'use strict';

var joi = require('joi');
var _ = require('lodash');

var error = require('mazaid-error');

var checkerSchema = require('./checkerSchema');

var ErrorCodes = {
    UNKNOWN_CHECKER: 'unknownChecker'
};

class Check {

    constructor(logger, config) {

        this.ErrorCodes = ErrorCodes;

        this._logger = logger;
        this._config = config;

        this._checkers = {};
    }

    init() {

        return new Promise((resolve, reject) => {
            resolve();
        });

    }

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

    get(name) {
        if (typeof this._checkers[name] === 'undefined') {
            return null;
        }

        return this._checkers[name];
    }

    prepare(checkTask) {

        return new Promise((resolve, reject) => {

            // TODO validate checkTask

            var checker = this.get(checkTask.checker);

            if (!checker) {
                return reject(
                    error('unknown checker = ' + checkTask.checker, ErrorCodes.UNKNOWN_CHECKER)
                );
            }

            var checkData = checkTask.data;

            if (typeof checker.defaultData === 'object') {
                checkData = _.defaultsDeep(checkData, checker.defaultData);
            }

            // TODO use vm module
            // TODO check promise returned
            checker.prepare(checkData)
                .then((execData) => {

                    var execTaskData = {
                        checkTaskId: checkTask.id,
                        type: checker.type,
                        data: execData,
                    };

                    resolve(execTaskData);
                })
                .catch((error) => {
                    reject(error);
                });

        });

    }

    parse(checkTask, execTask) {

        return new Promise((resolve, reject) => {
            // TODO use vm module

            var checker = this.get(checkTask.checker);

            if (!checker) {
                return reject(
                    error('unknown checker = ' + checkTask.checker, ErrorCodes.UNKNOWN_CHECKER)
                );
            }

            // TODO use vm module
            // TODO check promise returned
            checker.parse(execTask.result)
                .then((parsed) => {
                    resolve(parsed);
                })
                .catch((error) => {
                    reject(error);
                });


        });

    }

    analyze(checkTask) {

        return new Promise((resolve, reject) => {
            // TODO use vm module

            var checker = this.get(checkTask.checker);

            if (!checker) {
                return reject(
                    error('unknown checker = ' + checkTask.checker, ErrorCodes.UNKNOWN_CHECKER)
                );
            }

            checker.analyze(checkTask.data, checkTask.rawResult)
                .then((result) => {
                    resolve(result);
                })
                .catch((error) => {
                    reject(error);
                });
        });

    }



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
