#!/bin/bash

date_auto=`date -u +%Y%m%d`
date_auto="$date_auto"00;
params="UGRD:VGRD"
levels="10_m_above_ground"

# curl "http://nomads.ncep.noaa.gov/cgi-bin/filter_gfs.pl?file=gfs.t00z.pgrbf00.grib2&lev_10_m_above_ground=on&var_UGRD=on&var_VGRD=on&dir=%2Fgfs.${date_auto}00" -o gfs.t00z.pgrbf00.grib2


# curl "http://nomads.ncep.noaa.gov/cgi-bin/filter_gfs.pl?file=gfs.t00z.pgrbf00.grib2&lev_10_m_above_ground=on&var_UGRD=on&var_VGRD=on&dir=%2Fgfs.2015041900" -o gfs.t00z.pgrbf00.grib2


# perl get_gfs.pl data $date_auto 0 48 6 $params $levels . &>> $logfile
perl get_gfs.pl data $date_auto 0 0 0 $params $levels .