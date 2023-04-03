const globalData = require('../global/globalData');
const Database = require('../database/clsQueryProcess');
const database = new Database();
const ErrorLog = require('../model/clsErrorLog');
const date = require('date-and-time');
const sort = require('../model/Calibration/checkForPendingCalib');
// *****************************************************************************************************//
// Below function return the maximum RepNo for calibration                                             //
// ****************************************************************************************************//
async function getReportSerialNumber(Caibration, strBalId, idsNo) {
    try {
        // Calibration holds vaues like 'P', 'U', 'E' ... etc
        /**
         * @description 1) For the very first calibration in the sequence array the rep sr number will be the maximum of all calibration 
         * plus 1, and immediately update that rep Sr no infront of that balance ID in `caibration_status`
         *              2) For the remaining calibrations, the rep sr number will be the rep sr number infront of that balance Id 
         * @author Pradip Shinde
         */
        var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == idsNo);
        var calibTable = 'tbl_calibration_status';
        if (objOwner.owner == 'analytical') {
            calibTable = 'tbl_calibration_status';
        } else {
            calibTable = 'tbl_calibration_status_bin';
        }
        
        var resultNormalBalance = await database.execute(`SELECT MAX(RepNo) AS RepNo FROM tbl_calibration_status`);
        var resultBinBalance = await database.execute(`SELECT MAX(RepNo) AS RepNo FROM tbl_calibration_status_bin`);
        var tempRepSerNo = ''
        if (resultBinBalance[0][0].RepNo > resultNormalBalance[0][0].RepNo) {
            tempRepSerNo = parseFloat(resultBinBalance[0][0].RepNo) + 1
        } 
        else {
            tempRepSerNo = parseFloat(resultNormalBalance[0][0].RepNo) + 1 
        }

        var RepNo;
        var sortedArray = await sort.sortedSeqArray(globalData.arrSortedCalib, strBalId);
        if (sortedArray[0] == Caibration) {
            //await database.execute(`UPDATE ${calibTable} SET RepNo=${result[0][0].RepNo + 1} WHERE BalID = '${strBalId}'`);
            await database.execute(`UPDATE ${calibTable} SET RepNo=${tempRepSerNo} WHERE BalID = '${strBalId}'`);
            RepNo = tempRepSerNo;
            return RepNo;
        } else {
            var resultLatestNormalBal = await database.execute(`SELECT MAX(RepNo) AS RepNo FROM tbl_calibration_status WHERE BalID = '${strBalId}'`);
            var resultLatestBinBal = await database.execute(`SELECT MAX(RepNo) AS RepNo FROM tbl_calibration_status_bin WHERE BalID = '${strBalId}'`);
            var tempRepSerNoLatest = ''
            if (resultLatestNormalBal[0][0].RepNo > resultLatestBinBal[0][0].RepNo) {
                tempRepSerNoLatest = parseFloat(resultLatestNormalBal[0][0].RepNo) 
            } 
            else {
                tempRepSerNoLatest = parseFloat(resultLatestBinBal[0][0].RepNo)  
            }
    
            //RepNo = tempRepSerNo[0][0].RepNo;
            RepNo = tempRepSerNoLatest
            return RepNo;
        }
    } catch (err) {
        var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
        logError = logError + err.stack;
        //commented by vivek on 31-07-2020*********************************** */
        //ErrorLog.error(logError);
        ErrorLog.addToErrorLog(logError);
        //******************************************************************* */
        throw new Error(err)
    }

}
// ***************************************************************************************************//
// Below function update new RepNo w.r.t to balance in tbl_calibration_status
//*************************************************************************************************** */
function updateRepSrNo(strBalId, RepNo) {
    return new Promise((resolve, reject) => {
        database.execute(`UPDATE tbl_calibration_status SET RepNo='${RepNo}' WHERE BalID='${strBalId}'`);
    })
}
function getRepSrNoWRTBalance(strBalId, IDSSrNo) {
    var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == IDSSrNo);
    var calibTable = 'tbl_calibration_status';
    if (objOwner.owner == 'analytical') {
        calibTable = 'tbl_calibration_status';
    } else {
        calibTable = 'tbl_calibration_status_bin';
    }
    return database.execute(`SELECT RepNo FROM ${calibTable} WHERE BalID = '${strBalId}'`);

}
// *****************************************************************************************************//
module.exports.getReportSerialNumber = getReportSerialNumber;
module.exports.updateRepSrNo = updateRepSrNo;
module.exports.getRepSrNoWRTBalance = getRepSrNoWRTBalance;