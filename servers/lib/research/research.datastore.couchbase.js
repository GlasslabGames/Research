
/**
 * Research DataStore Module
 *
 * Module dependencies:
 *  lodash     - https://github.com/lodash/lodash
 *  when   - https://github.com/cujojs/when
 *
 */
// Third-party libs
var _         = require('lodash');
var when      = require('when');
var guard     = require('when/guard');
var couchbase = require('couchbase');
// load at runtime
var Util;

module.exports = ResearchDS_Couchbase;

function ResearchDS_Couchbase(options){
    // Glasslab libs
    Util   = require('../core/util.js');

    this.options = _.merge(
        {
            host:     "localhost:8091",
            bucket:   "default",
            password: "",
            gameSessionExpire: 1*1*60 //24*60*60 // in seconds
        },
        options
    );
}

ResearchDS_Couchbase.prototype.connect = function(){
// add promise wrapper
return when.promise(function(resolve, reject) {
// ------------------------------------------------
    var options = {
        host:     this.options.host,
        bucket:   this.options.bucket,
        password: this.options.password,
        connectionTimeout: this.options.timeout || 60000,
        operationTimeout:  this.options.timeout || 60000
    };
    this.client = new couchbase.Connection(options, function(err) {
        console.error("CouchBase ResearchStore: Error -", err);

        if(err) throw err;
    }.bind(this));

    this.client.on('error', function (err) {
        console.error("CouchBase ResearchStore: Error -", err);
        reject(err);
    }.bind(this));

    this.client.on('connect', function () {
        console.log("CouchBase ResearchStore: Options -", options);
        resolve();
    }.bind(this));

// ------------------------------------------------
}.bind(this));
// end promise wrapper
};


// http://stackoverflow.com/questions/19178782/how-to-reshape-an-array-with-lodash
// In:  array = [1, 2, 3, 4, 5, 6, ,7, 8], n = 3
// Out: [[1, 2, 3], [4, 5, 6], [7, 8]]
function reshape(array, n){
    return _.compact(array.map(function(el, i){
        if (i % n === 0) {
            return array.slice(i, i + n);
        }
    }));
}


ResearchDS_Couchbase.prototype.getEventsByDate = function(startDateArray, endDateArray, limit){
// add promise wrapper
return when.promise(function(resolve, reject) {
// ------------------------------------------------

    startDateArray[1]++; // month starts at 0, so need to add one
    startDateArray[6] = null;
    //startDateArray.pop();

    var options = {
        startkey: startDateArray
    };

    if(endDateArray) {
        endDateArray[1]++;   // month starts at 0, so need to add one
        endDateArray[6]   = "\u0fff";

        options.endkey = endDateArray;
        options.inclusive_end = true;
    }

    if(limit) {
        options.limit = parseInt(limit);
    }

    //console.log("CouchBase ResearchStore: getEventsByDate - options:", options);
    this.client.view("telemetry", "getEventsByServerTimeStamp").query(
        options,
        function(err, results){
           if(err){
                console.error("CouchBase ResearchStore: Get Events View Error -", err);
                reject(err);
                return;
            }

            if(results.length == 0) {
                resolve([]);
                return;
            }

            var keys = [];
            var allEvents = [];
            for (var i = 0; i < results.length; ++i) {
                keys.push( results[i].id );
            }

            var taskList = reshape(keys, this.options.multiGetChunkSize);
            console.log("getEventsByKeys totalEvents:", taskList.length);

            var guardedAsyncOperation, taskResults;
            // Allow only 1 inflight execution of guarded
            guardedAsyncOperation = guard(guard.n(1), this._getEventsByKeys.bind(this));
            taskResults = when.map(taskList, guardedAsyncOperation);
            taskResults.then(
                function(events){
                    events = _.flatten(events);
                    console.log("CouchBase ResearchStore: getEventsByKeys total events:", events.length);
                    return events;
                }.bind(this),
                //errors
                function(err){
                    reject(err);
                }.bind(this)
            )
            .done(function(events){
                resolve(events);
            }.bind(this));


        }.bind(this));

// ------------------------------------------------
}.bind(this));
// end promise wrapper
};

ResearchDS_Couchbase.prototype._getEventsByKeys = function(keys) {
// add promise wrapper
return when.promise(function(resolve, reject) {
// ------------------------------------------------
    console.log("CouchBase ResearchStore: getEventsByKeys events:", keys.length);
    this.client.getMulti(keys, {},
        function (err, results) {
            if (err) {
                console.error("CouchBase ResearchStore: Multi Get Events Error -", err);
                if (results) {
                    console.error("CouchBase ResearchStore: Multi Get Events Error - results:", results);
                }
                reject(err);
                return;
            }

            var events = [];
            for (var i in results) {
                events.push(results[i].value);
            }

            //console.log("getRawEvents events.length:", events.length);
            resolve(events);
        }.bind(this));
// ------------------------------------------------
}.bind(this));
// end promise wrapper
}