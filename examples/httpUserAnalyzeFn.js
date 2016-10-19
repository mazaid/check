// logger, data, result, libs

logger.info('hello from user code');

var userResponseTimeLimit = 250;

var _ = libs.lodash;

var responseTime = _.get(result, 'responseTime', null);

if (responseTime > userResponseTimeLimit) {
    return resolve({
        status: 'fail',
        message: `[userAnalyzeFn] response time = ${responseTime} ms ( > ${userResponseTimeLimit} ms)`
    });
} else {
    return resolve({
        status: 'pass',
        message: `[userAnalyzeFn] all ok`
    });
}


// var s = 0;
// for (var i = 0; i <= 10000000000; i++) {
//     logger.info(i);
// }