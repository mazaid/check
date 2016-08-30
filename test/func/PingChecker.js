module.exports = {
    name: 'ping',

    type: 'exec',

    defaultData: {
        interval: 1,
        count: 3,
        // analyzer params
        successResponseTimeLimit: 300
    },

    prepare: function (data) {

        return new Promise((resolve, reject) => {
            var args = [];

            args.push('-i ' + data.interval);
            args.push('-c ' + data.count);

            args.push(data.host);

            resolve({
                command: 'ping',
                args: args
            });
        });

    },

    parse: function (rawResult) {

        return new Promise((resolve, reject) => {
            if (rawResult.code !== 0) {

                if (!rawResult.error || !rawResult.error.message) {
                    return reject(new Error('unknown error with exit code = ' + rawResult.code));
                } else {
                    return reject(new Error(rawResult.error.message));
                }

            }

            if (!rawResult.stdout) {
                return reject(new Error('no stdout'));
            }

            var splitted = rawResult.stdout.split('\n');

            var pingItemRegex = /\d+ bytes from \d+\.\d+\.\d+\.\d+: icmp_seq=\d+ ttl=\d+ time=(\d+\.\d+)\sms/;

            var pings = [];

            for (var line of splitted) {
                var matches = pingItemRegex.exec(line);

                if (matches) {
                    pings.push(Number(matches[1]));
                }
            }

            resolve(pings);
        });

    },

    analyze: function (data, result) {

        return new Promise((resolve, reject) => {
            if (!result) {
                return resolve({status: 'fail', message: 'empty data'});
            }

            var avg = 0;

            for (var time of result) {
                avg += time;
            }

            avg = avg / result.length;

            avg = Number(avg.toFixed(2));

            if (avg > data.successResponseTimeLimit) {
                resolve({
                    status: 'fail',
                    message: `avg response time = ${avg} ms ( > ${data.successResponseTimeLimit} ms)`,
                    avg: avg
                });
            } else {
                resolve({
                    status: 'pass',
                    avg: avg
                });
            }
        });

    }
};
