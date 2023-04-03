
const fs = require('fs');
const date = require('date-and-time');
/**
 * 
 * @param {*} logQ string line
 * @description Function takes argument as string line
 * @author Pradip shinde
 * @date 16/09/2020
 */
function storeStrings(instrument,str_IpAddress,str_Protocol) {
try {
   var THECounter = str_Protocol.substring(2, 5);
   if(THECounter == '001'){
      var logQ = `Date: ${date.format(new Date(), 'DD-MM-YYYY HH:mm:ss')} Selected instrument: ${instrument} IP: ${str_IpAddress}`;
     // console.log(logQ);
      StringLog(logQ);
   } else if(THECounter == '000'){
      var logQ = `         ---------------------------------------       `;
      StringLog(logQ);
   } else {
      var logQ = str_Protocol.substring(5);
      logQ = logQ.substring(0, logQ.length - 2)
      StringLog(logQ);
   }

} catch (err){
console.log('Error while logging string')
}
}
function StringLog(logQ) {
    var dir = './Logs';
    var FilePath = './Logs/Strings' + date.format(new Date(), 'MM-YYYY') + '.log';
    if (!fs.existsSync(dir)) {//it will create new folder if its not exists
        fs.mkdirSync(dir);
    }

    
    if (!fs.existsSync(FilePath)) {//it will craete new file if its not exist
        fs.open(FilePath, 'w', function (err, file) {
            if (err) throw err;
            console.log('new string protocol file created' + err);
        });

        fs.appendFile(FilePath, logQ, function (err) {//append data in new file
            if (err) throw err;
            console.log('string protocol file Updated' + err);
        });
    }
    else {
        fs.appendFile(FilePath, '\n' + logQ, function (err) {
            if (err) throw err;
            //console.log('File appended!'+err);
        });
    }
}
module.exports.storeStrings = storeStrings