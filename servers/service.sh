#!/bin/bash

export LOG_DIR="/var/log/hydra"
mkdir -p $LOG_DIR

start() {
    # install dependencies from package.json
    npm install
    grunt
    # build static content
    cd static
    ./build.sh
    cd ..

    ./service_start.sh research
}

stop() {
    forever stop app-research.js
}

case "$1" in
    start)
        start
        exit 0
    ;;
    stop)
        stop
        exit 0
    ;;
    restart)
        # start will kill old processes
        stop
        start
        exit 0
    ;;
    **)
        echo "Usage: $0 {start|stop|reload}" 1>&2
        exit 1
    ;;
esac
