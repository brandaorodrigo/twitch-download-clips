const axios = require('axios');
const fs = require('node:fs');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');

const getToken = async (clientId, clientSecret) => {
    const url = 'https://id.twitch.tv/oauth2/token';
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'client_credentials');
    try {
        const response = await axios.post(url, params);
        return response.data.access_token;
    } catch (error) {
        console.error(error.response.data);
        throw error;
    }
};

const getBroadcasterId = async (login, token, clientId) => {
    const url = `https://api.twitch.tv/helix/users?login=${login}`;
    const headers = {
        'Client-ID': clientId,
        Authorization: `Bearer ${token}`,
    };
    try {
        const response = await axios.get(url, { headers });
        return response.data.data[0].id;
    } catch (error) {
        console.error(error.response.data);
        throw error;
    }
};

const getClips = async (broadcasterId, token, clientId) => {
    let clips = [];
    let cursor = null;
    let hasMoreClips = true;
    while (hasMoreClips) {
        const url = `https://api.twitch.tv/helix/clips?broadcaster_id=${broadcasterId}&first=100${
            cursor ? `&after=${cursor}` : ''
        }`;
        const headers = {
            'Client-ID': clientId,
            Authorization: `Bearer ${token}`,
        };
        try {
            const response = await axios.get(url, { headers });
            clips = clips.concat(response.data.data);
            cursor = response.data.pagination.cursor;
            hasMoreClips = !!cursor;
        } catch (error) {
            console.error(error.response.data);
            throw error;
        }
    }
    return clips;
};

const getFile = async (url) => {
    let driver = undefined;
    let file = undefined;
    try {
        const options = new chrome.Options();
        options.addArguments('--headless');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--log-level=ERROR');
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .setChromeService(new chrome.ServiceBuilder(chromedriver.path))
            .build();
        await driver.get(url);
        const element = await driver.wait(until.elementLocated(By.css('video')), 10000);
        file = await element.getAttribute('src');
    } finally {
        if (driver) {
            await driver.quit();
        }
    }
    return file;
};

const getVideo = async (url, file) => {
    found = await getFile(url);
    if (!found) {
        return false;
    }
    const response = await axios({
        url: found,
        method: 'GET',
        responseType: 'stream',
    });
    const writer = fs.createWriteStream(file);
    response.data.pipe(writer);
    return true;
};

module.exports = {
    getToken,
    getBroadcasterId,
    getClips,
    getVideo,
};
