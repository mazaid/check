'use strict';

var path = require('path');
var log4js = require('log4js-nested');
var uuid = require('uuid').v4;

var fs = require('fs');

var CheckTask = require('mazaid-check-task');

var functions = require('./functions');

var initCheckApi = functions.initCheckApi;
var runCheckTask = functions.runCheckTask;

var logger = log4js.getLogger('test');

var config = {};

var checkApi;

process.on('unhandledRejection', (error) => {
    error.message = '----- unhandledRejection ------\n' + error.message;
    logger.fatal(error);
});

process.on('uncaughtException', (error) => {
    error.message = '----- uncaughtException ------\n' + error.message;
    logger.fatal(error);
});

process.on('rejectionHandled', (error) => {
    error.message = '----- rejectionHandled ------\n' + error.message;
    logger.fatal(error);
});

initCheckApi(logger, config)
    .then(() => {



        var urls = [
            'http://ngs.ru',
            'http://pogoda.ngs.ru',
            'http://n1.ru',
            // 'http://github.com'
        ];

        var promises = [];

        for (var url of urls) {
            let raw = {
                checker: 'http',
                data: {
                    url: url,
                    'responseTime <=': 200,
                },
                // logger, data, rawResult
                userAnalyzeFn: fs.readFileSync(__dirname + '/httpUserAnalyzeFn.js').toString()
            };

            raw.id = uuid();
            let checkTask = new CheckTask(raw);

            promises.push(runCheckTask(logger, checkTask));
        }

        return Promise.all(promises);

        // return runCheckTask(logger, checkTask);
    })
    .then((result) => {

        for (var r of result) {
            logger.info(r.data);
            logger.info(r.result);
        }

        // logger.info(checkTask.data);
        // logger.info(checkTask.result);
        // logger.info(checkTask.rawResult);
    })
    // .then(() => {
    //     var raw = {
    //         checker: 'http',
    //         data: {
    //             url: 'http://google.com'
    //         }
    //     };
    //
    //     raw.id = uuid();
    //     var checkTask = new CheckTask(raw);
    //
    //     return runCheckTask(checkTask);
    // })
    // .then((checkTask) => {
    //     logger.info(checkTask.data.host, checkTask.result);
    //     logger.info(checkTask.rawResult);
    // })
    .catch((error) => {
        // console.log(require('util').inspect(error, {
        //     depth: null
        // }));
        logger.error(error);
    });