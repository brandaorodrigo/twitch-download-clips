const fs = require('node:fs');
const { getVideo, getDriver } = require('./api.cjs');
const args = process.argv.slice(2);
const channel = args[0];

if (!channel) {
    console.error('channel required');
    process.exit(1);
}

const clips = require(`${__dirname}/../json/${channel}.json`);

console.log('TOTAL', clips.length);

const files = [];
for (const clip of clips) {
    const file = `${__dirname}/../download/${clip.name}.mp4`;
    if (!fs.existsSync(file) || !fs.statSync(file).size) {
        files.push({ url: clip.url, file });
    }
}

console.log('TO DOWNLOAD', files.length);

getDriver().then((driver) => {
    let i = 0;
    const loop = async () => {
        await getVideo(files?.[i]?.url, files?.[i]?.file, driver);
        i = i + 1;
        if (files?.[i]?.url && i <= 1000) {
            loop();
        } else {
            driver.quit();
        }
    };
    loop();
});
