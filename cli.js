#!/usr/bin/env node

"use strict";

var zhot = require('./index');

const config = require('yargs')(process.argv.slice(2))
    .usage('$0 <url>', '', (yargs) => {
        yargs
        .positional('url', {
            describe: 'The URL to browse to.',
            type: 'string'
        })
    })
    .demand(1)
    .options({
        'w': {
            alias: 'width',
            describe: 'Viewport width',
            type: 'integer',
            default: 800
        },
        'h': {
            alias: 'height',
            describe: 'Viewport height',
            type: 'integer',
            default: 600
        },
        's': {
            alias: 'selector',
            describe: 'DOM element to image, a la querySelector()',
            type: 'string',
            default: 'whole page'
        },
        'i': {
            alias: 'invisible',
            describe: 'Matching elements become invisible',
            type: 'string'
        },
        'r': {
            alias: 'remove',
            describe: 'Matching elements are removed',
            type: 'string'
        },
        'e': {
            alias: 'evaluate',
            describe: 'Javascript that will be evaluated in page context when loading has finished',
            type: 'string'
        },
        'f': {
            alias: 'evaluateFile',
            describe: 'File with javascript that will be evaluated in page context when loading has finished',
            type: 'string'
        },
        'E': {
            alias: 'evalOutput',
            describe: 'Output of evaluation to stdout',
            type: 'boolean'
        },
        't': {
            alias: 'settleTime',
            describe: 'Give browser this many milliseconds to settle before screenshot',
            type: 'integer'
        },
        'b': {
            alias: 'writeCookies',
            describe: 'Start interactive browsing session and save cookies to this file',
            type: 'string'
        },
        'c': {
            alias: 'readCookies',
            describe: 'Load cookies from file',
            type: 'string'
        },
        'q': {
            alias: 'quiet',
            describe: 'Supress status updates',
            type: 'boolean'
        },
        'd': {
            alias: 'debug',
            describe: 'Show browser console and detailed error info',
            type: 'boolean'
        },
        'H': {
            alias: 'head',
            describe: 'disable headless mode',
            type: 'boolean'
        },
        'o': {
            alias: 'outputFile',
            default: 'screenshot.png',
            describe: 'Filename for screenshot. Formats: png, jpg or webp, selected by extension.',
            type: 'string'
        }
    })
    .conflicts('evaluate', 'evaluateFile')
    .argv
;

config.defaultViewport = {
    'width': config.width,
    'height': config.height
}

if (config.writeCookies) {
    browseForCookies(config);
} else {

    if (config.evaluateFile) {
        config.evaluate = fs.readFileSync(config.evaluateFile).toString('utf-8');
    }

    if (config.debug) config.consoleFunction = console.log;
    if (!config.quiet) config.statusFunction = console.log;
    if (config.head) config.headless = false;

    zhot(config)
        .then((res) => {
            if (config.evalOutput) console.log(res);
        })
        .catch((e) => {
            if (config.debug) {
                throw (e);
            } else {
                if (!config.quiet) console.log(`Error: ${e.message}`);
                process.exit(1);
            }
        })
    ;

}


async function browseForCookies(config) {

    const jsonfile = require('jsonfile');
    const puppeteer = require('puppeteer');
    config.headless = false;
    config.defaultViewport = null;
    var browser = await puppeteer.launch(config);

    const page = await browser.newPage();
    await page.goto(config.url);

    if (config.readCookies) {
        const cookies = jsonfile.readFileSync(config.readCookies);
        for (let cookie of cookies) await page.setCookie(cookie);
        console.log(`Cookies loaded from '${config.readCookies}'.`);
    }

    const prompt = require('prompt-sync')();
    prompt('Press enter to save cookies and exit browser.');

    const cookiesObject = await page.cookies();
    jsonfile.writeFile(config.writeCookies, cookiesObject, { spaces: 2 },
        (err) => {
            if (err) {
                console.error(`Cookies could not be saved to '${config.writeCookies}'.`, err);
            } else {
                console.log(`Cookies saved to '${config.writeCookies}'.`);
            }
        }
    );
    await browser.close();

}
