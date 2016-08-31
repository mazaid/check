var path = require('path');
var log4js = require('log4js-nested');
var uuid = require('uuid').v4;

var CheckTask = require('mazaid-check-task');
var ExecTask = require('mazaid-exec-task');
var exec = require('mazaid-exec');

var Check = require(path.join(__dirname, '..', 'src', 'Check'));

var logger = log4js.getLogger('test');

var config = {};

var checkApi;

initCheckApi()
    .then(() => {

        var raw = {
            checker: 'ping',
            data: {
                host: 'github.com',
                count: 3,
                interval: '0.5',

                analyzer: {
                    responseTimeLimit: 200
                }
            }
        };

        return runCheckTask(raw);
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

        return runCheckTask(raw);
    })
    .then((checkTask) => {
        // console.log(require('util').inspect(checkTask, {depth: null}));
        logger.info(checkTask.data.host, checkTask.result);
        logger.info(checkTask.rawResult);
    })
    .catch((error) => {
        logger.error(error);
    });


/**
 * init check api, add ping checker
 *
 * @return {Promise}
 */
function initCheckApi() {

    return new Promise((resolve, reject) => {
        var check = new Check(logger, config);

        check.add(require('mazaid-checker-ping'))
            .then(() => {
                return check.init();
            })
            .then(() => {
                checkApi = check;
                resolve();
            })
            .catch((error) => {
                reject(error);
            });
    });

}


/**
 * exec check task
 *
 * @param  {Object} raw
 * @return {Promise}
 */
function runCheckTask(raw) {

    return new Promise((resolve, reject) => {

        // create check task object
        raw.id = uuid();
        var checkTask = new CheckTask(raw);

        // validate check task
        checkTask.validate()
            .then((checkTask) => {
                // set check task status to queued
                checkTask.queued();

                // prepare exec task by check task data
                return checkApi.prepare(checkTask);
            })
            .then((execData) => {
                // create exec task and validate
                execData.id = uuid();

                checkTask.execTaskId = execData.id;

                var execTask = new ExecTask(execData);
                return execTask.validate();
            })
            .then((execTask) => {
                // set check task to started
                checkTask.started();

                // execute exec task
                return exec(execTask);
            })
            .then((execTask) => {
                // got exec task response and parse it
                return checkApi.parse(checkTask, execTask);
            })
            .then((parsedResult) => {
                // got parsed response
                // set to check task
                checkTask.rawResult = parsedResult;

                // run analyze stage
                return checkApi.analyze(checkTask);
            })
            .then((result) => {
                // got status and message result, and custom checker data in result
                // set result to check task and validate
                checkTask.result = result;
                checkTask.finished();

                return checkTask.validate();
            })
            .then((task) => {
                resolve(task);
            })
            .catch((error) => {
                checkTask.result = {
                    status: 'fail',
                    message: error.message
                };

                error.checkTask = checkTask;

                reject(error);
            });

    });

}
