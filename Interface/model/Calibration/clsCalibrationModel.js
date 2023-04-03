const serverConfig = require('../../global/severConfig');
const globalData = require('../../global/globalData');
const timeZone = require('../../middleware/setTimeZone');
const Database = require('../../database/clsQueryProcess');
const database = new Database();
const request = require('request');
const moment = require('moment');
const date = require('date-and-time');
let now = new Date();
class CalibrationModel {
    checkDailyCalibrationPending(IDSSrNo) {
        return new Promise((resolve, reject) => {
            const tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(IDSSrNo));
            var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == parseInt(IDSSrNo));
            var calibDId = '1';
            if(objOwner.owner == 'analytical'){
            var strBalId = tempCubicInfo.Sys_BalID;
            calibDId = '1';
            } else {
            var strBalId = tempCubicInfo.Sys_BinBalID;
                if (tempCubicInfo.Sys_Port3 == 'IPC Balance') {
                    calibDId = '4';
                }
            }
            let dailyObj  = {
                str_tableName:'tbl_calibration_daily_master',
                data:'*',
                condition:[
                    {str_colName:'Daily_BalID', value:strBalId},
                    {str_colName:'Daily_CalbDate', value:date.format(now, 'YYYY-MM-DD')}
                ]
            }
            database.select(dailyObj).then((response) =>{
                if (response[0].length !== 0) {
                    resolve("CR0");
                } else {
                    resolve(`CR${calibDId}`);
                }
            }).catch(err =>{
                reject(err)
            })
        })
    }
    
    
   
}

module.exports = CalibrationModel;