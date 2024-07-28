const fs = require('node:fs');
const { getVideo } = require('./api.cjs');
const args = process.argv.slice(2);
const channel = args[0];
const { exec } = require('child_process');

if (!channel) {
    console.error('channel required');
    process.exit(1);
}

const clips = require(`${__dirname}/../json/${channel}.json`);

const files = [];
for (const clip of clips) {
    const file = `${__dirname}/../download/${clip.name}.mp4`;
    if (!fs.existsSync(file) || !fs.statSync(file).size) {
        files.push({ url: clip.url, file });
    }
    if (files.length === 5) {
        break;
    }
}

let i = 0;
const loop = async () => {
    await getVideo(files?.[i]?.url, files?.[i]?.file);
    i = i + 1;
    if (files?.[i]?.url) {
        loop();
    } else {
        exec('taskkill /f /im geckodriver.exe /T');
        exec('taskkill /f /im chromedriver.exe /T');
        exec('taskkill /f /im IEDriverServer.exe /T');
    }
};

loop();
