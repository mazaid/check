var path = require('path');
var log4js = require('log4js-nested');
var uuid = require('uuid').v4;

var CheckTask = require('mazaid-check-task');

var functions = require('./functions');

var initCheckApi = functions.initCheckApi;
var runCheckTask = functions.runCheckTask;

var logger = log4js.getLogger('test');

var config = {};

var checkApi;


initCheckApi(logger, config)
    .then(() => {

        var raw = {
            checker: 'ping',
            data: {
                host: 'github.com',
                count: 3,
                interval: '0.5',

                analyzer: {
                    'avg <=': 200
                }
            }
        };

        raw.id = uuid();
        var checkTask = new CheckTask(raw);

        return runCheckTask(checkTask);
    })
    .then((checkTask) => {
        logger.info(checkTask.data.host, checkTask.result);
        logger.info(checkTask.rawResult);
    })
    .then(() => {
        var raw = {
            checker: 'ping',
            data: {
                host: 'ngs.ru',
                count: 3,
                interval: '0.5',

                analyzer: {
                    responseTimeLimit: 300
                }

            }
        };

        raw.id = uuid();
        var checkTask = new CheckTask(raw);

        return runCheckTask(checkTask);
    })
    .then((checkTask) => {
        logger.info(checkTask.data.host, checkTask.result);
        logger.info(checkTask.rawResult);
    })
    .catch((error) => {
        logger.error(error);
    });


