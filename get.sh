#!/bin/bash

date_auto=`date -u +%Y%m%d`
date_auto="$date_auto"00;
params="UGRD:VGRD"
levels="10_m_above_ground"

LEFT_LON=25 #долгота левой границы
RIGHT_LON=175 #долгота правой границы

UP_LAT=75 #широта верхней границы
DOWN_LAT=40 #широта нижней границы

mkdir ./tmp

perl get_gfs.pl data $date_auto 0 0 0 $params $levels ./tmp

# декодирование grib-файла в csv формат
./wgrib2 ./tmp/gfs.t00z.pgrb2.1p00.f000 -csv ./tmp/temp.csv

# фильтрация по координатам
cat ./tmp/temp.csv | awk -F ',' -v LL="$LEFT_LON" -v RL="$RIGHT_LON" -v UL="$UP_LAT" -v DL="$DOWN_LAT" '$5 >= LL && $5 <= RL && $6 >= DL && $6 <=UL' > ./tmp/data.csv 

node parse.js