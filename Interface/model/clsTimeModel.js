var dateFormat = require('dateformat');
class TimeModel { 
    handleTMProtocol(strIdsIP, Protocol) { 
      
        return new Promise((resolve, reject) => { 
            var now = new Date();
            var strRetutnProtocol = `TM${dateFormat(now, 'ssMMHH')}06${dateFormat(now, 'ddmmyy')}`;
            resolve(strRetutnProtocol)
        });
    }
}
module.exports = TimeModel;