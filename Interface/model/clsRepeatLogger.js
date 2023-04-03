const winston = require('winston');
const fs = require('fs');
//const path = require('path');
const date = require('date-and-time');
const { createLogger, format, transports } = winston;

function addToRepeatLog(logQ) {
    var dir = './Logs';
    var FilePath = './Logs/RepeatProtocol' + date.format(new Date(), 'MM-YYYY') + '.log';
    if (!fs.existsSync(dir)) {//it will create new folder if its not exists
        fs.mkdirSync(dir);
    }

    
    if (!fs.existsSync(FilePath)) {//it will craete new file if its not exist
        fs.open(FilePath, 'w', function (err, file) {
            if (err) throw err;
            console.log('new Repeat protocol file created' + err);
        });

        fs.appendFile(FilePath, logQ, function (err) {//append data in new file
            if (err) throw err;
            console.log('new repeat file Updated' + err);
        });
    }
    else {
        fs.appendFile(FilePath, '\n' + logQ, function (err) {
            if (err) throw err;
            //console.log('File appended!'+err);
        });
    }
}

module.exports.addToRepeatLog = addToRepeatLog
//module.exports = RepeatLog;