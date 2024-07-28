const config = require('./config.json');
const fs = require('node:fs');
const { getToken, getBroadcasterId, getClips } = require('./api.cjs');

const args = process.argv.slice(2);
const channel = args[0];

if (!channel) {
    console.error('channel required');
    process.exit(1);
}

getToken(config.id, config.secret).then((token) => {
    getBroadcasterId(channel, token, config.id).then((broadcasterId) => {
        getClips(broadcasterId, token, config.id).then((clips) => {
            const json = clips.map((clip) => {
                const date = clip.created_at.replaceAll(':', '').replaceAll('-', '');
                const user = clip.creator_name.toLowerCase();
                const title = clip.title
                    .replace(/[^a-z0-9 ]/gi, '')
                    .replaceAll(' ', '-')
                    .toLowerCase();
                const url = clip.url;
                const name = `${channel}__${date}__${user}__${title}`;
                return { url, name };
            });
            fs.writeFileSync(`${__dirname}/../json/${channel}.json`, JSON.stringify(json), 'utf8');
        });
    });
});
