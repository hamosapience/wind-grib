FROM phusion/baseimage:0.9.16

# File Author / Maintainer
MAINTAINER Kalentine Vamenek

# Use baseimage-docker's init system.
CMD ["/sbin/my_init"]

RUN apt-get update && apt-get install -y nodejs && apt-get install -y npm

ENV DIR /src/
ENV PATH /usr/local/bin:$PATH
ENV NODE nodejs

ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p ${DIR} && cp -a /tmp/node_modules ${DIR}

WORKDIR ${DIR}
COPY . ${DIR}

RUN ./init.sh

RUN mkdir /etc/service/wind-grib
COPY start.sh /etc/service/wind-grib/run

RUN mkdir -p /etc/my_init.d
ADD first_fetch.sh /etc/my_init.d/first_fetch.sh

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

VOLUME ./data
