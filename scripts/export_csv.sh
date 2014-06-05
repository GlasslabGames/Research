#!/bin/bash

# example:
# ./export_csv.sh 01-01-2014 01-13-2014

# startEpoc=1388618362
startEpoc=`date -j -f "%m-%d-%Y" $1 +%s`
endEpoc=`date -j -f "%m-%d-%Y" $2 +%s`
echo "startEpoc: ${startEpoc}"
echo "endEpoc: ${endEpoc}"

# day
#delta=86400
# week
delta=604800

while [  $startEpoc -lt $endEpoc ]; do
    exportDateStr=`date -j -f "%s" ${startEpoc} +"%m-%d-%Y"`

    echo "Exporting ${exportDateStr}"
    url='http://54.213.41.93:8090/research/events/get?schema=SC&gameId=SC&gameId=SD_LC&gameId=ELA_LC&startEpoc='${startEpoc}'&dateRange=\{"week":1\}'
    curl --connect-timeout 600 -m 600 -u glasslab:hz2M7V4fYb -s "$url" -o "export_${exportDateStr}.csv"
    if [[ $? = 1 ]]; then
        echo "Error Occurred!"
    else
        echo "Done!"
    fi

    startEpoc=$(($startEpoc + $delta))
done
