
var _         = require('lodash');
var moment    = require('moment');
var csv       = require('csv');

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

    var strOut = "";
    strOut += parsedSchema.header + "\n";

    var row = [];
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

            for(var r in row) {
                row[r] = parseItems(event, row[r], '{', '}');
                row[r] = parseItems(event.eventData, row[r], '[', ']');
            }

            strOut += csv().stringifier.stringify(row) + "\n";
        } else {
            //console.log("Process Event - Event Name not in List:", event.eventName);
        }
    }

    return strOut;
}

function parseItems(event, row, left, right){
    var re = new RegExp("\\"+left+"(.*?)\\"+right, 'g');
    var matchs = getMatches(row, re, 1);

    var item = "", key = "";
    for(var m in matchs) {
        key = left + matchs[m] + right;
        item = processSpecialRowItem(matchs[m], event);

        var reReplace = new RegExp(escapeRegExp(key), 'g');
        row = row.replace(reReplace, item);
    }

    return row;
}

function processSpecialRowItem (item, data) {
    var results = "";
    with(data){
        try {
            results = eval(item);
        }
        catch(err) {
            // this is ok
        }
    }

    if(_.isObject(results)) {
        results = JSON.stringify(results);
    }

    return results;
}


function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function getMatches(string, regex, index) {
    index = index || 1; // default to the first capturing group
    var matches = [];
    var match;
    while (match = regex.exec(string)) {
        matches.push(match[index]);
    }
    return matches;
}