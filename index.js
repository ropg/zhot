"use strict";

const puppeteer = require('puppeteer');
const jsonfile = require('jsonfile');

function zhot(config) {
    return async_zhot(config);
}

module.exports = zhot;


async function async_zhot(config) {

    function status(text) { if (config.statusFunction) config.statusFunction(text); }
    function pageConsole(consoleObj) { config.consoleFunction(consoleObj.text()); }

    var returnValue = true;

    // Set up the browser
    const browser = await puppeteer.launch(config);
    const page = await browser.newPage();

    if (config.consoleFunction) page.on('console', pageConsole);

    // Read Cookies
    if (config.readCookies) {
        const cookies = jsonfile.readFileSync(config.readCookies);
        for (let cookie of cookies) await page.setCookie(cookie);
        status(`Cookies loaded from '${config.readCookies}'.`);
    }

    // Go to page and wait for it
    await page.goto(config.url);
    await page.waitForNetworkIdle();

    // Freeze page, stop timers
    await page.evaluate(() => {
        document.body.outerHTML = document.body.outerHTML;
        for(var t = setTimeout(() => {}); t; --t) clearTimeout(t);
    });

    // Run any supplied javascript
    if (config.evaluate) returnValue = await page.evaluate(config.evaluate);

    // Remove and render invisible selected elements
    if (config.remove) {
        var removed = await page.$$eval(config.remove, (nodes) => {
            nodes.forEach((node) => node.remove());
            return nodes.length;
        });
        status(`Removed ${removed} element(s).`);
    }
    if (config.invisible) {
        var hidden = await page.$$eval(config.invisible, (nodes) => {
            nodes.forEach((node) => node.style.display = "none");
            return nodes.length;
        });
        status(`Hidden ${hidden} element(s).`);
    }

    // Optionally give browser some time to settle
    if (config.settleTime) {
        await new Promise(r => setTimeout(r, config.settleTime));
    }

    // Take the actual screenshot
    var pictureThis = page;
    if (config.selector && config.selector != 'whole page') {
        await page.waitForSelector(config.selector);
        pictureThis = await page.$(config.selector);
    }
    await pictureThis.screenshot({ path: config.outputFile });
    status(`Screenshot saved to '${config.outputFile}'.`);

    // Done
    await browser.close();
    return Promise.resolve(returnValue);

}
