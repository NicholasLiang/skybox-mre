/*!
 * Copyright (c) Nicholas Liang. All rights reserved.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { ModeratorFilter, SingleEventFilter } from '@microsoft/mixed-reality-extension-altspacevr-extras';
import { resolve as resolvePath } from 'path';

const fetch = require('node-fetch');

// add some generic error handlers here, to log any exceptions we're not expecting
process.on('uncaughtException', err => console.log('uncaughtException', err));
process.on('unhandledRejection', reason => console.log('unhandledRejection', reason));

class Skybox {
    private assets: MRE.AssetContainer;             // altspace mre assets context

    private filter: MRE.UserFilter;                 // moderator filter
    private userMask: MRE.GroupMask;                // moderator group mask

    private skybox: MRE.Actor = null;               // skybox as MRE Actor
    private mat: MRE.Material;                      // reference to material to change the texture

    private textButton: MRE.Actor;                  // text button for inputing URL

    private attachButton: MRE.Actor = null;         // attach button

    constructor(private context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
        this.assets = new MRE.AssetContainer(this.context);

        this.context.onStarted(()           => this.started(params));
        this.context.onUserJoined((user)    => this.userJoined(user));
    }

    private async started(params: MRE.ParameterSet) {
        // loading skybox gltf
        const skyboxData = await this.assets.loadGltf(`${this.baseUrl}/skyboxSphere.glb`);
        this.mat = this.assets.materials[0];    // reference material to change the texture

        // spawning Skybox
        this.skybox = MRE.Actor.CreateFromPrefab(this.context, {
            firstPrefabFrom: skyboxData,
            actor: {
                name: 'Skybox',
                appearance: {
                    materialId: this.mat.id     // reference material to change the texture
                },
            }
        });

        const defaultURL = `${this.baseUrl}/default.jpg`;

        // fetch json
        if (params.content_pack != null) {
            fetch('https://account.altvr.com/api/content_packs/' + params.content_pack + '/raw.json')
                .then((res: any) => res.json())
                .then((json: any) => {
                    // if there is a value, use it, or else, use default
                    json.url != null            ? this.reloadImage(json.url)                                : this.reloadImage(defaultURL);
                    json.scale != null          ? this.reloadSkybox(json.scale)                             : this.reloadSkybox("small");
                    json.moderator_only != null ? this.generateTextButton(json.moderator_only)              : this.generateTextButton("true");
                });
        } else {
            params.url != null                  ? this.reloadImage(params.url)                              : this.reloadImage(defaultURL);
            params.scale != null                ? this.reloadSkybox(String(params.scale))                   : this.reloadSkybox("small");
            params.moderator_only != null       ? this.generateTextButton(String(params.moderator_only))    : this.generateTextButton("true");
        }
    }

    private userJoined(thisUser: MRE.User) {
        // add group mask 'moderator' to user who is moderator
        thisUser.groups.add('user');
        this.filter = new ModeratorFilter(new SingleEventFilter(this.context));
        var userIsModerator = this.filter.users.includes(thisUser);
        if (userIsModerator) {
            thisUser.groups.add('moderator');
        }

        console.log("user: " + thisUser.id);
    }

    /** reload skybox texture */
    private reloadImage(url: any) {
        const tex = this.assets.createTexture(`${url}`, { uri: url });
        this.mat.emissiveTexture = tex;
    }

    /** reload skybox size and position by number or string {small, median, large} */
    private reloadSkybox(value: string) {
        var decimal = /^[-+]?[0-9]+\.[0-9]+$/;
        var isValidNumber = value.match(decimal);
        if (isValidNumber) {
            // if a number is provided, scale will be set and height will set as 0
            this.rescaleSkybox(0, parseFloat(value));
        } else if (value.toUpperCase() === 'SMALL') {
            this.rescaleSkybox(1.8, 1);
        } else if (value.toUpperCase() === 'MEDIAN') {
            // reference to Jimmy @tuesy , sweet spot for shared experience
            this.rescaleSkybox(0.2, 8);
        } else if (value.toUpperCase() === 'LARGE') {
            // replace the real skybox
            this.rescaleSkybox(1.8, 100);
        }
    }

    /** rescale and reposition skybox */
    private rescaleSkybox(height: number, scale: number) {
        this.skybox.transform.local.position = new MRE.Vector3(0, height, 0);
        this.skybox.transform.local.scale = new MRE.Vector3(scale, scale, scale);
    }

    /** gereate text button and determine the group mask */
    private generateTextButton(value: string) {
        if (value.toUpperCase() === 'TRUE') {
            this.userMask = new MRE.GroupMask(this.context, ['moderator']);
        } else if (value.toUpperCase() === 'FALSE') {
            this.userMask = new MRE.GroupMask(this.context, ['user']);
        }
        this.createInputButton(this.userMask);
    }

    /** create an input button for user to load image from custom URL */
    private createInputButton(userMask: MRE.GroupMask) {
        // text button for loading custom URL
        this.textButton = MRE.Actor.Create(this.context, {
            actor: {
                name: 'textButton',
                transform: { local: { position: { x: 1, y: 1, z: -1 } } },
                collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } },
                appearance: {
                    enabled: userMask           // group mask to define who can see and change the image
                },
                text: {
                    contents: 'Load Image from URL',
                    height: 0.1,
                    anchor: MRE.TextAnchorLocation.MiddleCenter,
                    justify: MRE.TextJustify.Center,
                }
            }
        });

        // register callback
        this.textButton.setBehavior(MRE.ButtonBehavior).onClick(user => {
            user.prompt('Please upload your image and input the URL here: ', true)
                .then(res => {
                    if (res.submitted) {
                        this.reloadImage(res.text);
                    }
                })
                .catch(err => {
                    console.error(err);
                });
        });
    }
}

function runApp() {
    // Start listening for connections, and serve static files.
    const server = new MRE.WebHost({
        baseDir: resolvePath(__dirname, '../public')
    });

    // Handle new application sessions
    server.adapter.onConnection((context, params) => new Skybox(context, params, server.baseUrl));
}

runApp();


