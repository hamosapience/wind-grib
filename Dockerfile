FROM phusion/baseimage:0.9.16

# File Author / Maintainer
MAINTAINER Kalentine Vamenek

# Use baseimage-docker's init system.
CMD ["/sbin/my_init"]

RUN apt-get update && apt-get install nodejs

ENV DIR /src 

COPY . ${DIR}
WORKDIR ${DIR}
RUN npm install && ./init.sh
VOLUME ./data


RUN mkdir /etc/service/wind-grib
ADD start.sh /etc/service/wind-grib/run


# Clean up APT when done.
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*