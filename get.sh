#!/bin/bash

date_auto=`date -u +%Y%m%d`
date_auto="$date_auto"00;
params="UGRD:VGRD"
levels="10_m_above_ground"

echo date_auto

cd /home/hamo/wind-grib/

mkdir ./tmp

perl ./get_gfs.pl data $date_auto 0 0 0 $params $levels ./tmp

# декодирование grib-файла в csv формат
./wgrib2 ./tmp/gfs.t00z.pgrb2.1p00.f000 -csv ./tmp/temp.csv

node parse.js

rm -f ./tmp/gfs.t00z.pgrb2.1p00.f000
rm -f ./tmp/temp.csv