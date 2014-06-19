
var _         = require('lodash');
var when      = require('when');
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
        // set timeout so request doesn't close connection
        req.connection.setTimeout(this.options.request.httpTimeout);

        if(!req.query) {
            this.requestUtil.errorResponse(res, {error: "missing arguments"}, 401);
            return;
        }

        if(!req.query.gameId) {
            this.requestUtil.errorResponse(res, {error: "missing gameId"}, 401);
            return;
        }
        var gameIds = req.query.gameId;
        try {
            //  if not array then make array
            if (_.isString(gameIds)) {
                gameIds = JSON.parse(gameIds);
            }
        } catch(err) {
            // this is ok, will assume it's just a string
            gameIds = [gameIds];
        }

        // if no schema assume it's gameId
        var schema = gameIds[0];
        if(req.query.schema) {
            schema = req.query.schema;
        }

        if(!this.parsedSchema.hasOwnProperty(schema)) {
            this.requestUtil.errorResponse(res, {error: "missing game parser schema"}, 401);
            return;
        }

        var startDate = moment({hour: 0});
        // startDate or startEpoc optional
        if(req.query.startEpoc) {
            startDate = parseInt(req.query.startEpoc)*1000;
        }
        if(req.query.startDate) {
            startDate = req.query.startDate;
        }
        if(!startDate) {
            this.requestUtil.errorResponse(res, {error: "missing startDate or startEpoc missing"}, 401);
            return;
        }
        startDate = moment(startDate);

        var endDate = moment();
        if(req.query.dateRange) {

            try {
                endDate = JSON.parse(req.query.dateRange);
                endDate = moment(startDate).add(endDate);
            } catch(err) {
                // error is ok, just ignore dateRange
                console.error("dateRange err:", err);
            }
        }
        if(req.query.endDate) {
            endDate = moment(req.query.endDate);
        }

        var timeFormat = "MM/DD/YYYY HH:mm:ss";
        if(req.query.timeFormat) {
            timeFormat = req.query.timeFormat;
        }

        var limit;
        if(req.query.limit) {
            limit = req.query.limit;
        }

        console.log("Getting Events from", startDate.format("MM/DD/YYYY"), "to", endDate.format("MM/DD/YYYY"));
        this.store.getEventsByDate(startDate.toArray(), endDate.toArray(), limit)
            .then(function(events){

                try {
                    console.log("Running Filter...");
                    events = _.filter(events,
                        function (event) {
                            return _.find(gameIds, function(gameId) {
                                return ((event.gameId == gameId) || (event.clientId == gameId));
                            });
                        }
                    );

                    console.log("Processing", events.length, "Events...");
                    // process events
                    var p = processEvents.call(this, schema, events, timeFormat);
                    p.then(function(out){
                        res.writeHead(200, {
                            'Content-Type': 'text/plain'
                            //'Content-Type': 'text/csv'
                        });
                        res.end(out);
                    }.bind(this));

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

function processEvents(schema, events, timeFormat) {
// add promise wrapper
return when.promise(function(resolve, reject) {
// ------------------------------------------------

    //console.log("events:", events);
    var parsedSchema = this.parsedSchema[schema];
    //console.log("Parsed Schema for", schema, ":", parsedSchema);

    var outList = [];
    var promiseList = [];
    events.forEach(function(event, i) {

        var p = this.store.validateSession(event.gameSessionId)
            .then(function(sdata){
                // add user Id to event
                event.userId = sdata.userId;

                var row = [];
                if( i != 0 &&
                    i % this.options.research.dataChunkSize == 0) {
                    console.log("Processed Events:", i);
                }

                // event name exists in parse map
                if( parsedSchema.rows.hasOwnProperty(event.eventName) ) {
                    row = _.clone(parsedSchema.rows[ event.eventName ]);
                }
                // wildcard to catch all other event types
                else if( parsedSchema.rows.hasOwnProperty('*') ) {
                    row = _.clone(parsedSchema.rows['*']);
                } else {
                    //console.log("Process Event - Event Name not in List:", event.eventName);
                }

                if(timeFormat) {
                    // need to convert EPOC to milliseconds
                    event.clientTimeStamp = moment(event.clientTimeStamp*1000).format(timeFormat);
                    event.serverTimeStamp = moment(event.serverTimeStamp*1000).format(timeFormat);
                }

                if(row.length > 0) {
                    // check each row item
                    for(var r in row) {
                        if(row[r] == '*') {
                            row[r] = JSON.stringify(event);
                        } else {
                            row[r] = parseItems(event, row[r], '{', '}');
                            row[r] = parseItems(event.eventData, row[r], '[', ']');
                        }
                    }

                    outList[i] = csv().stringifier.stringify(row) + "\n";
                }
            }.bind(this))

        promiseList.push(p);
    }.bind(this));

    when.all(promiseList)
        .then(function(){
            console.log("Done Processing "+events.length+" Events");
            var strOut = parsedSchema.header + "\n";

            for(var i = 0; i < outList.length; i++) {
                if(outList[i]) {
                    strOut += outList[i];
                }
            }

            resolve(strOut);
        }.bind(this))
// ------------------------------------------------
}.bind(this));
// end promise wrapper
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