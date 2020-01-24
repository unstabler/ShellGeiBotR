import {MastodonClient, StreamingClient, Toot} from "~/Mastodon";
import ShellGei from "~/ShellGei";

export class ShellGeiBotRServer {

    public constructor(public host: string,
                       public token: string,
                       public dockerImage: string,
                       public timeout: number = 5) {

    }

    public async dance() {
        const mastodonClient = new MastodonClient(this.host, this.token);
        const streamingClient = new StreamingClient(mastodonClient);
        streamingClient.connect();
        streamingClient.on('update', async (toot: Toot) => {
            if (ShellGeiBotRServer.shouldProcess(toot)) {
                const shellGei = new ShellGei(toot);
                try {
                    const pendingToot = await shellGei.execute(this.dockerImage, this.timeout);
                    await mastodonClient.postStatus(pendingToot);
                } catch (e) {
                    console.error(e);
                }
            }
        });
    }

    static shouldProcess(toot: Toot): boolean {
        return ['シェル芸', '셸예능', 'shellgei'].map(
            tag => toot.tags.map(t => t.name).includes(tag)
        ).includes(true);
    };
}

new ShellGeiBotRServer(
    process.env['SHELLGEI_HOST']!,
    process.env['SHELLGEI_TOKEN']!,
    process.env['SHELLGEI_DOCKER_IMAGE']!
).dance();
