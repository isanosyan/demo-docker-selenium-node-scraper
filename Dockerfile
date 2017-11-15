FROM node:8

RUN mkdir /src

COPY package.json /src/

RUN cd /src; \
    npm i
