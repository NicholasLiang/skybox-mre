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

    private textButton: MRE.Actor;                  // text button for inputting URL

    constructor(private context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
        this.context.onStarted(()           => this.started(params));
        this.context.onUserJoined((user)    => this.userJoined(user));
    }

    private async started(params: MRE.ParameterSet) {
        this.assets = new MRE.AssetContainer(this.context);

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
        const defaultScale = "small";
        const defaultModerator = "false";

        // fetch json
        if (params.content_pack != null) {  // if content pack is provided
            // fetch the JSON raw file from Altspace web server
            fetch('https://account.altvr.com/api/content_packs/' + params.content_pack + '/raw.json')
                .then((res: any) => res.json())
                .then((json: any) => {
                    // if there is a value, then use the value provided, or else, use default value
                    json.url != null        ? this.reloadImage(json.url)                        : this.reloadImage(defaultURL);
                    json.scale != null      ? this.reloadSkybox(json.scale)                     : this.reloadSkybox(defaultScale);
                    json.moderator != null  ? this.generateTextButton(json.moderator)           : this.generateTextButton(defaultModerator);
                });
        } else {
            params.url != null              ? this.reloadImage(params.url)                      : this.reloadImage(defaultURL);
            params.scale != null            ? this.reloadSkybox(String(params.scale))           : this.reloadSkybox(defaultScale);
            params.moderator != null        ? this.generateTextButton(String(params.moderator)) : this.generateTextButton(defaultModerator);
        }
    }

    /** add group mask 'moderator' to user who is moderator and 'user' for everyone  */
    private userJoined(thisUser: MRE.User) {
        thisUser.groups.add('user');
        this.filter = new ModeratorFilter(new SingleEventFilter(this.context));
        var userIsModerator = this.filter.users.includes(thisUser);
        if (userIsModerator) {
            thisUser.groups.add('moderator');
        }
    }

    /** reload skybox texture */
    private reloadImage(url: any) {
        const tex = this.assets.createTexture(`${url}`, { uri: url });
        this.mat.emissiveTexture = tex;
    }

    /** reload skybox size and position by a number or string {small, medium, large} */
    private reloadSkybox(value: string) {
        var decimal = /^[-+]?[0-9]+\.[0-9]+$/;
        var isValidNumber = value.match(decimal);
        if (isValidNumber) {
            // if a number is provided, scale will be set as the number and height will set as 0
            this.rescaleSkybox(0, parseFloat(value));
        } else if (value.toUpperCase() === 'SMALL') {
            this.rescaleSkybox(0, 1);
        } else if (value.toUpperCase() === 'MEDIUM') {
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

    /** generate a text button and determine who can view it by the group mask */
    private generateTextButton(value: string) {
        if (value.toUpperCase() === 'TRUE' || value.toUpperCase() === 'ON') {
            this.userMask = new MRE.GroupMask(this.context, ['moderator']);
        } else if (value.toUpperCase() === 'FALSE' || value.toUpperCase() === 'OFF') {
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


