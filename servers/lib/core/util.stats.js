/**
 * Created by Joseph Sutton on 11/30/13.
 * Config file load
 *   - Multi file loading until success
 *   - Config
 */
var fs = require('fs');
var _  = require('lodash');
var StatsD = require('node-statsd').StatsD;

module.exports = Stats;

function Stats(options, root){
    this.options = _.merge(
        {
            statsd: {
                host: "localhost",
                port: 8125
            }
        },
        options
    );

    this.statsd = new StatsD(this.options.statsd);
    this.statsd.socket.on('error', function(err) {
        this.statsd = null;
        return console.error("StatsD: Error connecting to server. ", err);
    });

    this.sRoot = root;
    this.root  = root;
    this.env   = process.env.HYDRA_ENV || "dev";
}

Stats.prototype.saveRoot = function() {
    this.sRoot = this.root;
}

Stats.prototype.setRoot = function(root) {
    this.root = root;
}

Stats.prototype.restoreRoot = function() {
    this.root = this.sRoot;
}

Stats.prototype.increment = function(level, key, count) {
    if(!count) {
        count = 1;
    }

    if(this.statsd) {
        level = level.toLowerCase();

        // dev.App.error.Loaded
        this.statsd.increment(this.env+"."+this.root+"."+level+"."+key, count);

        // dev.error.App.Loaded
        this.statsd.increment(this.env+"."+level+"."+this.root+"."+key, count);
        // dev.error.App._total
        this.statsd.increment(this.env+"."+level+"."+this.root+"._total", count);
        // dev.error._total
        this.statsd.increment(this.env+"."+level+"._total", count);
    }
};

Stats.prototype.gauge = function(level, key, value) {

    if(this.statsd) {
        level = level.toLowerCase();

        // dev.error.App.Loaded
        this.statsd.gauge(this.env+"."+level+"."+this.root+"."+key, value);
    }
};
