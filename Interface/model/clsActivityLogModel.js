const database = require('../database/clsQueryProcess');
const date = require('date-and-time');

const objDatabase = new database();

class ActivityLog {

    /**
     * This function will make a Activity Entry from IDS
     * 
     * @param {*} objActivity Object which includes strUserId,strUserName and activity.
     * @returns a Promise , 1 when successull err when reject
     * @memberof ActivityLog
     */
    ActivityLogEntry(objActivity) {
        return new Promise((resolve, reject) => { 
            var now = new Date();
           var activityObject = {
                str_tableName: 'tbl_activity_log',
                data: [
                    { str_colName: 'dt', value: date.format(now, 'YYYY-MM-DD') },
                    { str_colName: "tm", value: date.format(now, 'HH:mm:ss') },
                    { str_colName: "userid", value: objActivity.strUserId },
                    { str_colName: "username", value: objActivity.strUserName },
                    { str_colName: "activity", value: objActivity.activity },
                ]
            }
    
            objDatabase.save(activityObject).then((res) => {
                resolve({ result: '1' });
            }).catch((err) => {
                reject(err);
            })
        })
       
    }
}

module.exports = ActivityLog;