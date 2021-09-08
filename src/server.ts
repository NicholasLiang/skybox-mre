import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import dotenv from 'dotenv';
import { resolve as resolvePath } from 'path';
// add some generic error handlers here, to log any exceptions we're not expecting
process.on('uncaughtException', err => console.log('uncaughtException', err));
process.on('unhandledRejection', reason => console.log('unhandledRejection', reason));
// Read .env if file exists
dotenv.config();

class Skybox {
    private assets: MRE.AssetContainer;
    private skybox: MRE.Actor = null;

    constructor(private context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
        this.context.onStarted(() => this.started());

        console.log(params);
        console.log(baseUrl);
    }

    private async started() {
        this.assets = new MRE.AssetContainer(this.context);

        const skyboxData = await this.assets.loadGltf('skyboxSphere.glb', 'box');

        // spawn a copy of the glTF model
        this.skybox = MRE.Actor.CreateFromPrefab(this.context, {
            firstPrefabFrom: skyboxData,
            actor: {
                name: 'Skybox'
            }
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