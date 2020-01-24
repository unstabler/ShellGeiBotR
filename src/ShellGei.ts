import Crypto from 'crypto';
import { exec } from 'child_process';
import { writeFileSync } from 'fs';
import sanitizeHtml from 'sanitize-html';

import {PendingToot, Toot} from "~/Mastodon";


export default class ShellGei {
    script: string;

    public constructor(public toot: Toot) {
        this.script = sanitizeHtml(
            toot.content.replace(/<br[ \/]*?>/g, "\n"),
            {
                allowedTags: [],
                allowedAttributes: {}
            }
        );
    }

    public async execute(dockerImage: string, timeout: number): Promise<PendingToot> {
        console.debug(`executing ${this.script}`);
        const name = Crypto.createHash('sha256')
            .update(this.toot.id, "utf8").digest('hex');

        const path = `/tmp/SHELLGEI_${name}.sh`;
        writeFileSync(path, this.script);

        const stdout: string = await new Promise((resolve, reject) => {
            exec(`docker run --net=none --rm --name "${name}" -v ${path}:${path} ${dockerImage} bash ${path}`, {
                timeout: timeout * 1000,
                killSignal: "SIGKILL"
            }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stdout);
            })
        });

        return {
            in_reply_to_id: this.toot.id,
            visibility: "unlisted",
            status: `@${this.toot.account.acct}\n${stdout}\n${this.toot.url}`
        };
    }
}
