const winston = require('winston');
const fs = require('fs');
const date = require('date-and-time');
const { createLogger, format, transports } = winston;




function addtoProtocolLog(logQ) {
    var dir = './Logs';
    var FilePath = './Logs/Protocol' + date.format(new Date(), 'MM-YYYY') + '.log';
    if (!fs.existsSync(dir)) {//it will create new folder if its not exists
        fs.mkdirSync(dir);
    }

    
    if (!fs.existsSync(FilePath)) {//it will craete new file if its not exist
        fs.open(FilePath, 'w', function (err, file) {
            if (err) throw err;
            console.log('new protocol file created' + err);
        });

        fs.appendFile(FilePath, logQ, function (err) {//append data in new file
            if (err) throw err;
            console.log('protocol file Updated' + err);
        });
    }
    else {
        fs.appendFile(FilePath, '\n' + logQ, function (err) {
            if (err) throw err;
            //console.log('File appended!'+err);
        });
    }
}


// const FromPC = createLogger({
//     format: format.combine(
//         format.printf(i => `${i.message}`)
//     ),
//     transports: [
//         new transports.Stream({

//             //stream: fs.createWriteStream(path.join(__dirname, 'example.log'))
//             stream: fs.createWriteStream('Logs/Protocol' + date.format(new Date(), 'DD-MM-YYYY HH-mm-ss') + '.log')
//             //stream: fs.createWriteStream('Protocol.log')
//         })
//     ]
// })


//var now = new Date();

//module.exports = FromPC;
module.exports.addtoProtocolLog = addtoProtocolLog