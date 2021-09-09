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
interface uris { ids: uri[]; }

class Skybox {
    private assets: MRE.AssetContainer;
    private skybox: MRE.Actor = null;               // skybox as MRE Actor
    private mat: MRE.Material;                      // reference to material to change the texture

    constructor(private context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
        this.context.onStarted(() => this.started(params));
    }

    private async started(params: MRE.ParameterSet) {
        this.assets = new MRE.AssetContainer(this.context);

        const skyboxData = await this.assets.loadGltf("skyboxSphere.glb", 'box');
        this.mat = this.assets.materials[0];
        
        // spawning Skybox
        this.skybox = MRE.Actor.CreateFromPrefab(this.context, {
            firstPrefabFrom: skyboxData,
            actor: {
                name: 'Skybox',
                appearance: {
                    materialId: this.mat.id
                },
            }
        });

        if (params.url != null) {
            this.reloadImage(params.url);
        } else {
            this.reloadImage(`${this.baseUrl}/Gy09v.jpg`);
            this.addTextButton();
        }

        return true;
    }

    private addTextButton()
    {
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
            user.prompt("Please upload your image and input the URL here: ", true)
                .then(res => {
                    this.reloadImage(res.text);
                })
                .catch(err => {
                    console.error(err);
                });
        });
    }

    private reloadImage(url: any) 
    {
        const tex = this.assets.createTexture(`${url}`, { uri: url });
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


