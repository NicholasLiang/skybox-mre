import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import dotenv from 'dotenv';
import { resolve as resolvePath } from 'path';
// add some generic error handlers here, to log any exceptions we're not expecting
process.on('uncaughtException', err => console.log('uncaughtException', err));
process.on('unhandledRejection', reason => console.log('unhandledRejection', reason));
// Read .env if file exists
dotenv.config();

interface uri {
    id: string;
    uri: string;
}

interface uris {
    ids: uri[];
}

const wrap = (s: string, w: number) => s.replace(
    new RegExp(`(?![^\\n]{1,${w}}$)([^\\n]{1,${w}})\\s`, 'g'), '$1\n'
);

class Skybox {
    private assets: MRE.AssetContainer;
    private skybox: MRE.Actor = null;
    private mat: MRE.Material;
    private errorText: MRE.Actor;

    constructor(private context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
        this.context.onStarted(() => this.started(params));
    }

    private async started(params: MRE.ParameterSet) {
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

        this.errorText = MRE.Actor.Create(this.context, {
            actor: {
                text: {
                    contents: "Error",
                    height: 0.1,
                    anchor: MRE.TextAnchorLocation.MiddleCenter,
                    justify: MRE.TextJustify.Center,
                    color: MRE.Color3.Red(),
                }
            }
        })

        this.errorText.text.enabled = false;

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

                    this.reloadImage(res.text);
                })
                .catch(err => {
                    console.error(err);
                });
        });

        if (params.url != null) {
            this.reloadImage(params.url);
            textButton.appearance.enabled = false;
        } else {
            this.reloadImage(`${this.baseUrl}/Gy09v.jpg`);
            textButton.appearance.enabled = true;
        }

        return true;
    }

    private reloadImage(url: any) 
    {
        const tex = this.assets.createTexture(`${url}`, {
            uri: url
        });
        this.mat.emissiveTexture = tex;
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


