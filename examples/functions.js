var path = require('path');

var uuid = require('uuid').v4;

var CheckTask = require('mazaid-check-task');
var ExecTask = require('mazaid-exec-task');

var Check = require(path.join(__dirname, '..', 'src', 'Check'));

var exec = require('mazaid-exec');

var logger = require('log4js-nested').getLogger();

/**
 * init check api, add ping checker
 *
 * @return {Promise}
 */
function initCheckApi(logger, config) {

    return new Promise((resolve, reject) => {
        var check = new Check(logger, config);

        var promises = [];

        var checkers = require('mazaid-checkers');

        for (var checker of checkers) {
            promises.push(check.add(checker));
        }

        Promise.all(promises)
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
 * @param  {Object} checkTask
 * @return {Promise}
 */
function runCheckTask(logger, checkTask) {

    return new Promise((resolve, reject) => {

        // create check task object
        // raw.id = uuid();
        // var checkTask = new CheckTask(raw);

        // validate check task
        checkTask.validate(logger)
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
                return exec(logger, execTask);
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

module.exports = {
    initCheckApi: initCheckApi,
    runCheckTask: runCheckTask
};
