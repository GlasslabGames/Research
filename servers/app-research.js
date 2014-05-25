/**
 * App Server
 */
var ServiceManager = require('./lib/core/service.manager.js');
var Research       = require('./lib/research/research.js');
var manager = new ServiceManager("~/hydra.research.config.json");

// add all services
manager.add( Research );

manager.start();
