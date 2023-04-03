const winston = require('winston');
const fs = require('fs');
//const path = require('path');
const date = require('date-and-time');
const { createLogger, format, transports } = winston;




function addToErrorLog(logQ) {
    var dir = './Logs';
    var FilePath = './Logs/Error' + date.format(new Date(), 'MM-YYYY') + '.log';
    if (!fs.existsSync(dir)) {//it will create new folder if its not exists
        fs.mkdirSync(dir);
    }

    
    if (!fs.existsSync(FilePath)) {//it will craete new file if its not exist
        fs.open(FilePath, 'w', function (err, file) {
            if (err) throw err;
            console.log('new Error Log created with' + err);
        });

        fs.appendFile(FilePath, logQ, function (err) {//append data in new file
            if (err) throw err;
            console.log('Error Log Updated with' + err);
        });
    }
    else {
        fs.appendFile(FilePath, '\n' + logQ, function (err) {
            if (err) throw err;
            //console.log('File appended!'+err);
        });
    }
}

module.exports.addToErrorLog = addToErrorLog;
//module.exports = ErrorLog;