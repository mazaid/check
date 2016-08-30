var path = require('path');
var log4js = require('log4js-nested');
var uuid = require('uuid').v4;

var CheckTask = require('mazaid-check-task');
var ExecTask = require('mazaid-exec-task');
var exec = require('mazaid-exec');

var Check = require(path.join(__dirname, '..', '..', 'src', 'Check'));
var PingChecker = require(path.join(__dirname, 'PingChecker'));

describe('Check', function () {

    it('should success exec check task with ping checker', function (done) {

        var logger = log4js.getLogger('test');

        var config = {};

        var check = new Check(logger, config);

        var checkTask;

        check.add(PingChecker)
            .then(() => {
                return check.init();
            })
            .then(() => {

                var raw = {
                    id: uuid(),
                    checker: 'ping',
                    data: {
                        host: 'github.com',
                        count: 2,
                        interval: '0.5',
                        successResponseTimeLimit: 150
                    }
                };

                checkTask = new CheckTask(raw);

                return checkTask.validate();
            })
            .then((checkTask) => {
                checkTask.queued();
                return check.prepare(checkTask);
            })
            .then((execData) => {
                execData.id = uuid();

                var execTask = new ExecTask(execData);

                return execTask.validate();
            })
            .then((execTask) => {
                checkTask.started();

                return exec(execTask);
            })
            .then((execTask) => {
                console.log();

                console.log(require('util').inspect(execTask, {depth: null}));

                console.log();

                return check.parse(checkTask, execTask);
            })
            .then((rawResult) => {
                checkTask.rawResult = rawResult;

                console.log();

                console.log(require('util').inspect(checkTask, {depth: null}));

                console.log();

                return check.analyze(checkTask);

            })
            .then((result) => {
                checkTask.result = result;
                checkTask.finished();

                return checkTask.validate();
            })
            .then((checkTask) => {
                console.log(checkTask);
                done();
            })
            .catch((error) => {
                checkTask.result = {status: 'fail', message: error.message};
                console.log(checkTask);
                done(error);
            });

    });

});
