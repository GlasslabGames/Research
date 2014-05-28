
var _         = require('lodash');
var when      = require('when');
var moment    = require('moment');

var Util      = require('../../core/util.js');

module.exports = {
    getEventsByDate: getEventsByDate
};

/*
 http://localhost:8090/research/events/get?gameId=AA-1&startDate=2014-05-01

 http://stage.argubotacademy.org:8090/research/events/get?gameId=AA-1&startDate=2014-05-01

 http://localhost:8090/research/events/get?gameId=AA-1&startDate=2014-05-01&endDate=2014-05-14&timeFormat="MM/DD/YYYY HH:mm:ss"


 required:
    gameId
    startDate
 */
function getEventsByDate(req, res, next){
    try {
        if(!req.query) {
            this.requestUtil.errorResponse(res, {error: "missing arguments"}, 401);
            return;
        }

        if(!req.query.gameId) {
            this.requestUtil.errorResponse(res, {error: "missing gameId"}, 401);
            return;
        }
        var gameId = req.query.gameId;

        if(!this.parsedSchema.hasOwnProperty(gameId)) {
            this.requestUtil.errorResponse(res, {error: "missing game parser schema"}, 401);
            return;
        }

        if(!req.query.startDate) {
            this.requestUtil.errorResponse(res, {error: "missing startDate"}, 401);
            return;
        }
        var startDate = moment(req.query.startDate).toArray();

        var endDate;
        if(req.query.endDate) {
            endDate = moment(req.query.endDate);
            endDate = endDate.toArray();
        }

        var timeFormat = "MM/DD/YYYY HH:mm:ss";
        if(req.query.timeFormat) {
            timeFormat = req.query.timeFormat;
        }

        var limit;
        if(req.query.limit) {
            limit = req.query.limit;
        }

        this.store.getEventsByDate(startDate, endDate, limit)
            .then(function(events){

                try {
                    console.log("Running Filter...");
                    events = _.filter(events,
                        function (event) {
                            return (event.gameId == gameId);
                        }
                    );

                    console.log("Process", events.length, "Events...");
                    // process events
                    var out = processEvents.call(this, gameId, events, timeFormat);
                    res.writeHead(200, {
                        'Content-Type': 'text/plain'
                        //'Content-Type': 'text/csv'
                    });
                    res.end(out);

                } catch(err) {
                    console.trace("Research: Process Events -", err);
                    this.stats.increment("error", "ProcessEvents.Catch");
                    this.requestUtil.errorResponse(res, {error: err});
                }

            }.bind(this),
            function(err){
                this.requestUtil.errorResponse(res, err);
            }.bind(this)
        );
    } catch(err) {
        console.trace("Research: Get User Data Error -", err);
        this.stats.increment("error", "GetUserData.Catch");
        this.requestUtil.errorResponse(res, {error: err});
    }
}

function processEvents(gameId, events, timeFormat) {
    //console.log("events:", events);
    var parsedSchema = this.parsedSchema[gameId];
    //console.log("Parsed Schema for", gameId, ":", parsedSchema);

    var sessionOrderList = {};
    var out = parsedSchema.header + "\n";
    var row = "";

    for(var i = 0; i < events.length; i++) {
        var event = events[i];

        //console.log("Process Event", i);
        // event name exists in parse map
        if( parsedSchema.rows.hasOwnProperty(event.eventName) ) {
            row = _.clone( parsedSchema.rows[ event.eventName ] );

            if(timeFormat) {
                // need to convert EPOC to milliseconds
                event.clientTimeStamp = moment(event.clientTimeStamp*1000).format(timeFormat);
                event.serverTimeStamp = moment(event.serverTimeStamp*1000).format(timeFormat);
            }

            // if gameSessionEventOrder not exist,
            // then maintain one in mem
            if(!event.gameSessionEventOrder) {
                // if session not in list then gen
                if(!sessionOrderList.hasOwnProperty(event.gameSessionId)) {
                    sessionOrderList[event.gameSessionId] = 1;
                } else {
                    sessionOrderList[event.gameSessionId]++;
                }
                event.gameSessionEventOrder = sessionOrderList[event.gameSessionId];
            } else {
                // else update in mem in case an event doesn't have an order
                sessionOrderList[event.gameSessionId] = event.gameSessionEventOrder;
            }

            // convert all Object to JSON
            for(var e in event) {
                if( _.isObject(event[e]) ) {
                    event[e] = JSON.stringify(event[e]);
                }
            }

            // replace all event (root) items in row
            for(var e in event) {
                var re = new RegExp("\\{"+e+"\\}", 'g');
                row = row.replace(re, event[e]);
            }
            // clear out all remaining variables
            var re = new RegExp("\\{[\\$a-zA-Z0-9]*\\}", 'g');
            row = row.replace(re, '');

            // convert eventData back to object
            event.eventData = JSON.parse(event.eventData);

            // replace all eventData items in row
            for(var d in event.eventData) {
                var re = new RegExp("\\["+d+"\\]", 'g');
                row = row.replace(re, event.eventData[d]);
            }
            // clear out all remaining variables
            var re = new RegExp("\\[[\\$a-zA-Z0-9]*\\]", 'g');
            row = row.replace(re, '');

            out += row + "\n";
            //console.log("Process Event - row:", row);
        } else {
            //console.log("Process Event - Event Name not in List:", event.eventName);
        }
    }

    return out;
}