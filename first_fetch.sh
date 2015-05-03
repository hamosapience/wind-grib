#!/bin/sh

# First data fetch
cd ${DIR} && ./get.sh 2>&1 | tee ${DIR}/log/get.log 
