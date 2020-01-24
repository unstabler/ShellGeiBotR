import Axios from "axios";
import WebSocket from "ws";
import { EventEmitter } from "events";


export interface Toot {
    id: string;
    url: string;
    account: Account;
    content: string;
    reblog: boolean;
    visibility: string; // fixme
    tags: Tag[];
}

export interface Account {
    id: string;
    username: string;
    acct: string;
    display_name: string;
    bot: boolean;
}

export interface Tag {
    name: string;
}

export interface StreamingEvent {
    event: 'update' | 'notification' | 'delete' | 'filters_changed';
    payload: any;
};

export interface InstanceInfo {
    urls: {
        streaming_api: string;
    };
}


export interface PendingToot {
    status: string;
    in_reply_to_id?: string;
    media_ids?: string[];
    sensitive?: boolean;
    spoiler_text?: string;
    visibility: 'unlisted';
}

export class MastodonClient {
    constructor(public host: string, public token: string) {

    }

    async postStatus(pendingToot: PendingToot) {
        const { data } = await Axios.post(
            `https://${this.host}/api/v1/statuses`,
            pendingToot, {
                headers: {
                    contentType: 'application/json',
                    authorization: `Bearer ${this.token}`
                }
        });
    }

    async instanceInfo(): Promise<InstanceInfo> {
        const { data } = await Axios.get(`https://${this.host}/api/v1/instance`);
        return data as InstanceInfo;
    }
}

export class StreamingClient extends EventEmitter {
    private client: WebSocket | null = null;

    constructor(public mastodonClient: MastodonClient) {
        super();
    }

    async getEndpointUrl(): Promise<string> {
        const { urls: { streaming_api } } = await this.mastodonClient.instanceInfo();
        return `${streaming_api}/api/v1/streaming?stream=user&access_token=${this.mastodonClient.token}`;
    }

    async connect() {
        const endpointUrl = await this.getEndpointUrl();
        console.log(`opening connection to ${endpointUrl}...`);
        this.client = new WebSocket(endpointUrl);
        this.client.on('message', (data: string) => this.onMessage(data));
    }

    private onMessage(data: string) {
        const { event, payload } = JSON.parse(data) as StreamingEvent;
        if (event === 'update') {
            this.emit('update', JSON.parse(payload) as Toot);
        } else if (event === 'notification') {
            // TODO: handle notification
        }
    }
}
