'use strict';

var vm = require('vm');

var joi = require('joi');
var _ = require('lodash');

var error = require('mazaid-error');

var checkerSchema = require('./checkerSchema');

var ErrorCodes = {
    UNKNOWN_CHECKER: 'unknownChecker',
    INVALID_CHECK_TASK: 'invalidCheckTask',
    INVALID_EXEC_TASK: 'invalidExecTask'
};

/**
 * @class
 */
class Check {

    /**
     * @constructor
     * @param  {Log4js} logger
     * @param  {Object} config
     */
    constructor(logger, config) {

        this.ErrorCodes = ErrorCodes;

        this._logger = logger;
        this._config = config;

        this._checkers = {};
    }

    /**
     * init
     *
     * @return {Promise}
     */
    init() {

        return new Promise((resolve, reject) => {
            resolve();
        });

    }

    /**
     * add checker
     *
     * @param {object} checker
     */
    add(checker) {

        return new Promise((resolve, reject) => {

            this.validateChecker(checker)
                .then(() => {
                    // TODO check if already exists
                    this._checkers[checker.name] = checker;
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                });

        });

    }

    /**
     * get checker by name
     *
     * @param  {String} name
     * @return {Null|Object}
     */
    get(name) {
        if (typeof this._checkers[name] === 'undefined') {
            return null;
        }

        return this._checkers[name];
    }

    /**
     * prepare execTaskData
     *
     * @param  {Object} checkTask
     * @return {Promise}
     */
    prepare(checkTask) {

        return new Promise((resolve, reject) => {

            // TODO validate checkTask

            if (typeof checkTask.isValid !== 'function') {
                return reject(new Error('invalid check task object', ErrorCodes.INVALID_CHECK_TASK));
            }

            var checker = this.get(checkTask.checker);

            if (!checker) {
                return reject(
                    error('unknown checker = ' + checkTask.checker, ErrorCodes.UNKNOWN_CHECKER)
                );
            }

            var checkData = _.cloneDeep(checkTask.data);

            if (typeof checker.defaultData === 'object') {
                checkData = _.defaultsDeep(checkData, checker.defaultData);
            }

            var context = vm.createContext({
                logger: this._logger,
                prepare: checker.prepare,
                checkData: checkData,
                callback: (error, execData) => {

                    if (error) {
                        return reject(error);
                    }

                    var execTaskData = {
                        checkTaskId: checkTask.id,
                        type: checker.type,
                        data: execData,
                    };

                    resolve(execTaskData);
                }
            });

            var script = new vm.Script(`
                prepare(logger, checkData)
                    .then((result) => {callback(null, result);})
                    .catch((error) => {callback(error);});
            `);

            script.runInContext(context);

        });

    }

    /**
     * parse execTask result
     *
     * @param  {Object} checkTask
     * @param  {Object} execTask
     * @return {Promise}
     */
    parse(checkTask, execTask) {

        return new Promise((resolve, reject) => {
            // TODO use vm module

            var checker = this.get(checkTask.checker);

            if (!checker) {
                return reject(
                    error('unknown checker = ' + checkTask.checker, ErrorCodes.UNKNOWN_CHECKER)
                );
            }

            if (execTask.type === 'exec') {
                var rawResult = execTask.result;

                if (rawResult.code !== 0) {

                    if (rawResult.error) {
                        return reject(new Error(rawResult.error));
                    } else {
                        return reject(new Error(
                            'unknown error with exit code = ' + rawResult.code
                        ));
                    }

                }
            }

            var context = vm.createContext({
                logger: this._logger,
                parse: checker.parse,
                execTaskResult: _.cloneDeep(execTask.result),
                callback: (error, parsed) => {

                    if (error) {
                        return reject(error);
                    }

                    resolve(parsed);
                }
            });

            var script = new vm.Script(`
                parse(logger, execTaskResult)
                    .then((result) => {callback(null, result);})
                    .catch((error) => {callback(error);});
            `);

            script.runInContext(context);

        });

    }

    /**
     * analyze parsed result
     *
     * @param  {Object} checkTask
     * @return {Promise}
     */
    analyze(checkTask) {

        return new Promise((resolve, reject) => {
            // TODO use vm module

            var checker = this.get(checkTask.checker);

            if (!checker) {
                return reject(
                    error('unknown checker = ' + checkTask.checker, ErrorCodes.UNKNOWN_CHECKER)
                );
            }

            var checkData = _.cloneDeep(checkTask.data);

            if (typeof checker.defaultData === 'object') {
                checkData = _.defaultsDeep(checkData, checker.defaultData);
            }

            var context = vm.createContext({
                logger: this._logger,
                analyze: checker.analyze,
                data: checkData,
                rawResult: _.cloneDeep(checkTask.rawResult),
                callback: (error, result) => {

                    if (error) {
                        return reject(error);
                    }

                    resolve(result);
                }
            });

            var script = new vm.Script(`
                analyze(logger, data, rawResult)
                    .then((result) => {callback(null, result);})
                    .catch((error) => {callback(error);});
            `);

            script.runInContext(context);

        });

    }

    /**
     * validate Checker object
     *
     * @param  {Object} checker
     * @return {Promise}
     */
    validateChecker(checker) {

        return new Promise((resolve, reject) => {

            var joiOptions = {
                convert: false,
                abortEarly: false,
                allowUnknown: false
            };

            joi.validate(checker, checkerSchema, joiOptions, function (err) {
                if (err) {
                    return reject(err);
                }

                resolve();
            });

        });

    }

}

module.exports = Check;
