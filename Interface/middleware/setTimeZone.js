const moment = require('moment-timezone')
/**
 * 
 * @param {*} dateInUTCFormat 
 * @description Function takes argument as Date in UTC format and converts in UTC with Indian Timezone
 * Asia/Kolkata
 * @author Pradip Shinde
 */
function convertDate(dateInUTCFormat) { 
    return new Promise((resolve, reject) => { 
        var dec = moment(dateInUTCFormat);
        var normalDate = dec.tz('Asia/Kolkata').format('YYYY-MM-DD');  // GMT +5:30 (India)
        resolve(normalDate);
    }) 
}

module.exports.convertDate = convertDate;

