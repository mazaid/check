var path = require('path');
var log4js = require('log4js-nested');
var uuid = require('uuid').v4;

var CheckTask = require('mazaid-check-task');
var ExecTask = require('mazaid-exec-task');
var exec = require('mazaid-exec');

var Check = require(path.join(__dirname, '..', '..', 'src', 'Check'));
var HttpChecker = require(path.join(__dirname, 'HttpChecker'));

var chai = require('chai');
chai.use(require('chai-as-promised'));

var assert = chai.assert;

describe('Check http', function () {

    it('should success exec check task with http checker', function (done) {

        var logger = log4js.getLogger('test');

        var config = {};

        var check = new Check(logger, config);

        var checkTask;

        var promise = check.add(HttpChecker)
            .then(() => {
                return check.init();
            })
            .then(() => {

                var raw = {
                    id: uuid(),
                    checker: 'base-http',
                    data: {
                        url: 'http://github.com'
                    }
                };

                checkTask = new CheckTask(raw);

                return checkTask.validate();
            })
            .then((checkTask) => {
                // console.log(1);
                // checkTask.queued();
                return check.prepare(checkTask);
            })
            .then((execData) => {
                // console.log(2);
                execData.id = uuid();

                var execTask = new ExecTask(execData);

                return execTask.validate();
            })
            .then((execTask) => {
                // console.log(3);
                checkTask.started();

                return exec(execTask);
            })
            .then((execTask) => {
                // console.log(4);
                return check.parse(checkTask, execTask);
            })
            .then((rawResult) => {
                // console.log(5);
                checkTask.rawResult = rawResult;

                return check.analyze(checkTask);
            })
            .then((result) => {
                // console.log(result);
                checkTask.result = result;
                checkTask.finished();

                return checkTask.validate();
            })
            .then((checkTask) => {
                done();
            })
            .catch((error) => {
                done(error);
            });

    });

});
