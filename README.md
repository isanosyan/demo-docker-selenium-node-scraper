## mobile.de demo scraper

Very basic mobile.de scraper, only for testing the tech stack :)
Parses information about most recently added ads on the site.

Technologies used:

* Docker (+ docker-compose);
* Selenium (+ ChromeDriver);
* node.js 8

### Requirements

In theory should be good to run on any machine with a Docker and docker-compose build.
Tested on:

* OS X 10.11.6
* Docker 17.10.0-ce
* docker-machine 0.13.0
* docker-compose 1.17.1

### Installing

1. Set up [docker](https://docs.docker.com/engine/installation/), [docker-machine](https://docs.docker.com/machine/install-machine/) if running on Mac, [docker-compose](https://docs.docker.com/compose/install/), [node.js](https://nodejs.org/en/download/package-manager/).
2. Run `npm install`.

### Running

To take the scraper up, first take up the Selenium container:

```
docker-compose up
```

Figure out the IP on which the container is accessible. Replace `192.168.99.100` in `index.js:16` with that IP. Next, run the scraper script:

```
node index.js
```

The script parses out information about newly added cars from ads on the search pages and logs it out to the console.
The process exits only when the scraper reaches the last available page on mobile.de (currently 50th).
