import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { Appearance } from '@microsoft/mixed-reality-extension-sdk';
import dotenv from 'dotenv';
import { resolve as resolvePath } from 'path';
// add some generic error handlers here, to log any exceptions we're not expecting
process.on('uncaughtException', err => console.log('uncaughtException', err));
process.on('unhandledRejection', reason => console.log('unhandledRejection', reason));
// Read .env if file exists
dotenv.config();

import { createServer, IncomingMessage, ServerResponse } from 'http';


interface uri {
    id: string;
    uri: string;
}

interface uris {
    ids: uri[];
}

var urisDatabase: uris = require('../public/test.json');

class Skybox {
    private assets: MRE.AssetContainer;
    private skybox: MRE.Actor = null;
    private mat: MRE.Material;

    constructor(private context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
        this.context.onStarted(() => this.started());
    }

    private async started() {
        this.assets = new MRE.AssetContainer(this.context);
        
        
        const skyboxData = await this.assets.loadGltf('skyboxSphere.glb', 'box');
        this.mat = this.assets.materials[0];
        
        // spawn a copy of the glTF model
        this.skybox = MRE.Actor.CreateFromPrefab(this.context, {
            firstPrefabFrom: skyboxData,
            actor: {
                name: 'Skybox',
                appearance: {
                    materialId: this.mat.id
                },
            }
        });

        
        if (urisDatabase.ids.find(x => x.id == this.context.sessionId))
        {
            var index = urisDatabase.ids.findIndex(x => x.id == this.context.sessionId)
            const tex = this.assets.createTexture('uvgrid', {
                uri: urisDatabase.ids[index].uri
            });
            this.mat.emissiveTexture = tex;
        }
        else
        {
            const tex = this.assets.createTexture('uvgrid', {
                uri: `${this.baseUrl}/Gy09v.jpg`
            });
            this.mat.emissiveTexture = tex;
        }

        const textButton = MRE.Actor.Create(this.context, {
            actor: {
                name: 'textButton',
                transform: { local: { position: { x: 1, y: 1, z: -1 } } },
                collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } },
                text: {
                    contents: "Load Image from URL",
                    height: 0.1,
                    anchor: MRE.TextAnchorLocation.MiddleCenter,
                    justify: MRE.TextJustify.Center
                }
            }
        });
        textButton.setBehavior(MRE.ButtonBehavior).onClick(user => {
            user.prompt("360 Image URL?", true)
                .then(res => {
                    // textButton.text.contents =
                    //     `Click for prompt\nLast response: ${res.submitted ? res.text : "<cancelled>"}`;

                    var index = urisDatabase.ids.findIndex(x => x.id == this.context.sessionId);
                    if (index > -1) {
                        urisDatabase.ids.splice(index, 1);
                    }

                    this.reloadImage(res.text);
                })
                .catch(err => {
                    console.error(err);
                });
        });

        return true;
    }


    private reloadImage(url: string) {
        const tex = this.assets.createTexture(`${url}`, {
            uri: url
        });

        this.mat.emissiveTexture = tex;

        const tmp:uri = {id: this.context.sessionId, uri: url};
        urisDatabase.ids.push(tmp);
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


