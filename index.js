const {Builder, By, Key, until} = require('selenium-webdriver'),
    fs = require('fs'),
    sprintf = require('sprintf-js').sprintf,
    vsprintf = require('sprintf-js').vsprintf,

    config = {
        debug: {
            enabled: false,
            verbose: false,
            templates: {
                dump: '/tmp/vehimalyst-dump-%s.html',
                screenshot: '/tmp/vehimalyst-screenshot-%s.png'
            }
        },
        server: {
            host: '192.168.99.100',
            port: 4444
        },
    },

    getServer = () => {
        return config.server.host + ':' + config.server.port;
    },
    getDriver = (() => {
        let driver;

        return function () {
            if ('undefined' !== typeof driver) {
                return driver;
            }

            return driver = new Builder()
                .forBrowser('chrome')
                .usingServer(sprintf('http://%s/wd/hub', getServer()))
                .build();
        };
    })(),

    random = () => {
        return Math.random().toString(36).slice(2);
    },

    dumpHTML = async (pathToFile) => {
        fs.writeFileSync(pathToFile, await getDriver().getPageSource());
        if (config.debug.verbose) {
            console.log('dump: ' + pathToFile);
        }
    },

    takeScreenshot = async (pathToFile) => {
        fs.writeFileSync(pathToFile, await getDriver().takeScreenshot());
        if (config.debug.verbose) {
            console.log('screenshot: ' + pathToFile);
        }
    },

    Navigator = {
        get: async (url) => {
            await getDriver().get(url);
            if (config.debug.enabled) {
                const uniqid = random();

                await Promise.all([
                    dumpHTML(sprintf(config.debug.templates.dump, uniqid)),
                    // takeScreenshot(sprintf(config.debug.templates.screenshot, uniqid))
                ]);
            }
        },
        clickAndGo: async (element) => {
            await element.click();
            if (config.debug.enabled) {
                const uniqid = random();

                await Promise.all([
                    dumpHTML(sprintf(config.debug.templates.dump, uniqid)),
                    // takeScreenshot(sprintf(config.debug.templates.screenshot, uniqid))
                ]);
            }
        },
        exists: async (by) => {
            try {
                await getDriver().findElement(by);
                return true;
            } catch (e) {
                if (-1 !== e.message.indexOf('no such element')) {
                    return false;
                }
                throw new Error(e);
            }
        },
        childExists: async (element, by) => {
            try {
                await element.findElement(by);
                return true;
            } catch (e) {
                if (-1 !== e.message.indexOf('no such element')) {
                    return false;
                }
                throw new Error(e);
            }

        }
    },
    Site = {
        load: async () => {
            await Navigator.get('https://suchen.mobile.de/fahrzeuge/search.html?lang=en&damageUnrepaired=NO_DAMAGE_UNREPAIRED&isSearchRequest=true&scopeId=C&sortOption.sortBy=creationTime&sortOption.sortOrder=DESCENDING');
        },
        search: {
            nextPageExists: async () => {
                return await Navigator.exists(By.css('.rbt-page-forward'));
            },

            goToNextPage: async () => {
                await Navigator.clickAndGo(await getDriver().findElement(By.css('.rbt-page-forward')));
            },

            extractItems: async () => {
                const driver = getDriver(),
                    items = await driver.findElements(By.css('.cBox-body.cBox-body--resultitem'));

                await Promise.all(items.map(async (v) => {
                    const id = await v.findElement(By.css('a.result-item')).getAttribute('href').then((v) => {
                            return v.match(/id=(\d+)/)[1];
                        }),
                        title = await v.findElement(By.css('.h3.u-text-break-word')).getText(),
                        price = await v.findElement(By.css('.price-block .h3.u-block')).getText(),
                        isVATDeductable = await Navigator.childExists(v, By.css('.price-block .u-block:not(.h3)')),
                        isAccidentFree = await v.findElement(By.css('.g-col-9 .g-col-12 div:nth-child(2)')).getText().then((v) => {
                            return !!v.match(/Accident-free/);
                        }),
                        onlineSince = await v.findElement(By.className('rbt-onlineSince')).getText().then((v) => {
                            return new Date(v.match(/since (.+)$/)[1]);
                        });

                    console.log(vsprintf(
                        'Ad [id:%s] Accident-free: %s %s (VAT: %s) %s online since %s.',
                        [id, isAccidentFree ? 'yes' : 'no', price, isVATDeductable ? 'yes' : 'no', title, onlineSince]
                    ));
                }));
            },
        },
    };


(async function () {
    const driver = getDriver();

    await Site.load();

    let pageNumber = 1,
        onLastPage = false;

    while (!onLastPage) {
        console.log(vsprintf('On page %d: %s', [pageNumber, await driver.getCurrentUrl()]));

        await Site.search.extractItems();
        if (await Site.search.nextPageExists()) {
            await Site.search.goToNextPage();
            pageNumber++;
        } else {
            onLastPage = true;
        }
    }

    await driver.quit();
})();
