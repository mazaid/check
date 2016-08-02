var joi = require('joi');

module.exports = {
    name: joi.string().required(),

    type: joi.string().valid(['exec']).required(),

    defaultData: joi.any(),

    prepare: joi.func().required(),

    parse: joi.func().required(),

    analyze: joi.func().required()
};
