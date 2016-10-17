// logger, data, result

logger.info('hello from user code');

var userResponseTimeLimit = 250;

if (result.responseTime > userResponseTimeLimit) {
    status = {
        status: 'fail',
        message: `[userAnalyzeFn] response time = ${result.responseTime} ms ( > ${userResponseTimeLimit} ms)`,
        responseTime: result.responseTime
    };
} else {
    status = {
        status: 'pass',
        message: `[userAnalyzeFn] all ok`,
        responseTime: result.responseTime
    };
}


// var s = 0;
// for (var i = 0; i <= 10000000000; i++) {
//     // logger.info(i);
// }