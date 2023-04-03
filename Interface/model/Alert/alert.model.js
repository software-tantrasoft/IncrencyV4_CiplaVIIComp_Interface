const Database = require('../../database/clsQueryProcess');
const database = new Database();
const globalData = require('../../global/globalData');
const serverConfig = require('../../global/severConfig');
const moment = require('moment');
const date1 = require('date-and-time');
const clsprotocolHandler = require('../../controller/protocolHandlerController');
const clsPreWeighmentCheck = require('../clsPreWeighmentChecks');
const protocolHandler = new clsprotocolHandler();

class AlertModel {
    constructor() { }
    /**
     * @description Given function will sow alert
     */
    async showAlert() {
      //  console.log('AlertArray', globalData.alertArrTemp);
        let alertArray = [];
        alertArray = globalData.alertArrTemp;
        var regExp = /(\d{1,2})\:(\d{1,2})\:(\d{1,2})/;
        if (alertArray.length > 0) {
            for (let i = 0; i < alertArray.length; i++) {
                // Here we are checking if calibration or weighment is in process
                let CalibORWeighmentObj = globalData.arr_FlagCallibWeighment.find(k => k.idsNo == alertArray[i].IDSNO);
                let blnCalibORWeigmntStart;
                if (CalibORWeighmentObj != undefined) {
                    blnCalibORWeigmntStart = CalibORWeighmentObj.alertFlag;
                } else {
                    blnCalibORWeigmntStart = false;
                }

                var objPreWeighmentCheck = new clsPreWeighmentCheck();
                var batchStartCheck = await objPreWeighmentCheck.checkBatchStart(alertArray[i].IDSNO);
                
                let now = new Date();
                let date = moment(alertArray[i].AlertTime, 'HH:mm:ss')
                    .add(alertArray[i].intGroupParam, 'minutes')
                    .format("HH:mm:ss");
                let currentTime = date1.format(now, 'HH:mm:ss');
                // console.log('after time',date, 'current Time',currentTime)
                let flag = parseInt(currentTime.replace(regExp, "$1$2$3")) > parseInt(date.replace(regExp, "$1$2$3"));
                // console.log(date,currentTime,flag);
                if (blnCalibORWeigmntStart != true && batchStartCheck === "Batch Started,") {
                    if (flag == true) {
                        let sendIp = serverConfig.strIpSeries + alertArray[i].IDSNO;
                        let protocol = 'DM0G0Group Weighment, Pending,,,,'
                        protocolHandler.sendProtocol(protocol, sendIp);
                    }
                }
            }
        }
    }
    /**
     * @param {*} IDSNO IDSSR NO
     * @description Below function is for alerts
     */
    handleDRProtocol(IDSNO) {
        return new Promise((resolve, reject) => {
            // First we have to update the time for specific Ids in alerts array
            let now = new Date();
            let tempAlertObj = globalData.alertArrTemp.find(k => k.IDSNO == parseInt(IDSNO));
            if (tempAlertObj != undefined) {
                let currentTime = date1.format(now, 'hh:mm:ss')
                tempAlertObj.AlertTime = currentTime;
            }
            // console.log(globalData.alertArrTemp)
            resolve('+');
        })
    }
    /**
     * 
     */
    async updateAlertObject() {
        let scanCubicle = {
            str_tableName: "tbl_cubical",
            data: '*',
            condition: [
                { str_colName: 'Sys_flagAlert', value: 1 },
            ]
        }
        let result = await database.select(scanCubicle);
        if (result[0].length > 0) {
            for (let val of result[0]) {
                let cubicNo = val.Sys_CubicNo;

                let tempAlertObj = globalData.alertArrTemp.find(k => k.intCubicleNo == cubicNo);
                const objAlert = {
                    str_tableName: 'tbl_alert_param_duration',
                    data: '*',
                }

                let alerParam = await database.select(objAlert);

                let objAlertParam = alerParam[0].find(k => k.CubicNo == cubicNo);

                let batchesParam = await database.execute(`SELECT * FROM tbl_batches WHERE Batch= '${val.Sys_Batch}' AND (STATUS = 'S' OR STATUS = 'R')`);
                if (batchesParam[0].length > 0) {
                    if (val.Sys_RptType == 1) {
                        globalData.alertArrTemp = globalData.alertArrTemp
                        .filter(k => k.IDSNO != val.Sys_IDSNo)
                    } else {
                        if (tempAlertObj !== undefined) {
                            if (objAlertParam.Group == 0) { // Group alerts are only for Standard run

                                globalData.alertArrTemp = globalData.alertArrTemp
                                    .filter(k => k.IDSNO != val.Sys_IDSNo)

                            } else {

                                tempAlertObj.strBatch = val.Sys_Batch;
                                tempAlertObj.intGroupParam = objAlertParam.Group;
                                tempAlertObj.AlertTime = batchesParam[0][0].tm;
                                tempAlertObj.IDSNO = val.Sys_IDSNo;

                            }
                        } else {

                            if (objAlertParam.Group != 0) {
                                let tempobj = {
                                    intCubicleNo: cubicNo,
                                    strBatch: val.Sys_Batch,
                                    intGroupParam: objAlertParam.Group,
                                    AlertTime: batchesParam[0][0].tm,
                                    IDSNO: val.Sys_IDSNo,

                                }

                                globalData.alertArrTemp.push(tempobj)
                            }
                        }
                    }
                }
                let updateCubicAlertVal = {
                    str_tableName: "tbl_cubical",
                    data: [
                        { str_colName: 'Sys_flagAlert', value: 0 },
                    ],
                    condition: [
                        { str_colName: 'Sys_CubicNo', value: cubicNo },
                    ]
                }
                await database.update(updateCubicAlertVal);
            }
          //  console.log('ASD',globalData.alertArrTemp)
        }


    }
}
module.exports = AlertModel;
