const database = require('../database/clsQueryProcess');
const objDatabase = new database();
const globaldata = require('../global/globalData');
const clsCalibModel = require('./Calibration/clsCalibrationModel');
const PeriodicModel = require('./Calibration/checkForPendingCalib');
const moment = require('moment');
const serverConfig = require('../global/severConfig');
const date = require('date-and-time');
const ErrorLog = require('../model/clsErrorLog');

class PreWeighmentChecks {

    /**
     * This function will check the Batch Status
     * Based on this show message on IDS 
     * Dont allow user to continue if batch is PAUSE OR END
     * @param {*} intIdsNo : IDS NO for which batch no needs to be checked 
     * @returns object with batch status details
     * @memberof PreWeighmentChecks
     */
    checkBatchStart(intIdsNo) {
        return new Promise((resolve, reject) => {
            /**
             * @description Here we have to check if in IPQC which product is set we have to check
             * batch for that selected product
             */
            var tempIPQCobj = globaldata.arr_IPQCRelIds.find(k => k.idsNo == intIdsNo);
            let selectedIds;
            if (tempIPQCobj != undefined) { // IPQC Cubicles
                selectedIds = tempIPQCobj.selectedIds;
            } else {
                selectedIds = intIdsNo;
            }
            var objCubicData = globaldata.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);

            var query = `SELECT * FROM tbl_batches WHERE Batch='${objCubicData.Sys_Batch}' AND RecNo = (`
            query = query + `SELECT MAX(RecNo) FROM tbl_batches WHERE Batch='${objCubicData.Sys_Batch}' AND `
            query = query + `Prod_ID = '${objCubicData.Sys_BFGCode}' AND Prod_Name= '${objCubicData.Sys_ProductName}' AND `;
            query = query + `Prod_Version = '${objCubicData.Sys_PVersion}' AND Version='${objCubicData.Sys_Version}')`
            objDatabase.execute(query).then((result) => {
                if (result[0].length > 0) {
                    if (result[0][0].Status == "E") {//batch is ended
                        //resolve("Batch Is Either,Paused or Ended");
                        resolve("Start Batch");
                    }
                    else if (result[0][0].Status == "P") {//batch is paused
                        resolve("Resume Batch");
                    }
                    else if (result[0][0].Status == "N") {//if batch is new
                        //resolve("Batch Is Not Started,");
                        resolve("Start Batch,");
                    }
                    else {
                        resolve("Batch Started,");
                    }
                }
                else {
                    //resolve("Batch Is Not Started,");
                    resolve("Start Batch,");
                }

            }).catch((error) => {
                reject(error);
            })

        })
    }




    getPreCalibrationDataDaily(strBalanceID, BalType = '') {
        return new Promise((resolve, reject) => {
            if (BalType == '') {
                BalType = 'analytical'
            }
            var objWeights = {
                str_tableName: 'tbl_precalibration_daily',
                data: '*',
                condition: [
                    { str_colName: 'Equipment_ID', value: strBalanceID },
                    { str_colName: 'Equipment_Type', value: BalType == 'analytical' ? 'Balance' : 'IPC Balance' }
                ]
            }

            objDatabase.select(objWeights).then((result) => {
                resolve(result[0]);
            }).catch((error) => {
                reject(error);
            })
        })
    }

    getPreCalibrationDataPeriodic(strBalanceID, BalType = '') {
        return new Promise((resolve, reject) => {
            if (BalType == '') {
                BalType = 'analytical'
            }
            var objWeights = {
                str_tableName: 'tbl_precalibration_periodic',
                data: '*',
                condition: [
                    { str_colName: 'Equipment_ID', value: strBalanceID },
                    { str_colName: 'Equipment_Type', value: BalType == 'analytical' ? 'Balance' : 'IPC Balance' }
                ]
            }

            objDatabase.select(objWeights).then((result) => {
                resolve(result[0]);
            }).catch((error) => {
                reject(error);
            })
        })
    }
    getPreCalibrationDataPeriodicVernier(tempVernier) {
        return new Promise((resolve, reject) => {
            var objWeights = {
                str_tableName: 'tbl_precalibration_periodic',
                data: '*',
                condition: [
                    { str_colName: 'Equipment_ID', value: tempVernier },
                    { str_colName: 'Equipment_Type', value: 'Vernier' }
                ]
            }

            objDatabase.select(objWeights).then((result) => {
                resolve(result[0]);
            }).catch((error) => {
                reject(error);
            })
        })
    }
    getPreCalibrationDataEccentricity(strBalanceID, BalType = '') {
        return new Promise((resolve, reject) => {
            if (BalType == '') {
                BalType = 'analytical'
            }

            var objWeights = {
                str_tableName: 'tbl_precalibration_eccentricity',
                data: '*',
                condition: [
                    { str_colName: 'Equipment_ID', value: strBalanceID },
                    { str_colName: 'Equipment_Type', value: BalType == 'analytical' ? 'Balance' : 'IPC Balance' }
                ]
            }

            objDatabase.select(objWeights).then((result) => {
                resolve(result[0]);
            }).catch((error) => {
                reject(error);
            })
        })
    }
    getPreCalibrationDataRepetability(strBalanceID, BalType = '') {
        return new Promise((resolve, reject) => {
            if (BalType == '') {
                BalType = 'analytical'
            }
            var objWeights = {
                str_tableName: 'tbl_precalibration_repeatability',
                data: '*',
                condition: [
                    { str_colName: 'Equipment_ID', value: strBalanceID },
                    { str_colName: 'Equipment_Type', value: BalType == 'analytical' ? 'Balance' : 'IPC Balance' }
                ]
            }

            objDatabase.select(objWeights).then((result) => {
                resolve(result[0]);
            }).catch((error) => {
                reject(error);
            })
        })
    }
    getPreCalibrationDataUncertinity(strBalanceID, BalType = '') {
        return new Promise((resolve, reject) => {
            if (BalType == '') {
                BalType = 'analytical'
            }

            var objWeights = {
                str_tableName: 'tbl_precalibration_uncertainty',
                data: '*',
                condition: [
                    { str_colName: 'Equipment_ID', value: strBalanceID },
                    { str_colName: 'Equipment_Type', value: BalType == 'analytical' ? 'Balance' : 'IPC Balance' }
                ]
            }

            objDatabase.select(objWeights).then((result) => {
                resolve(result[0]);
            }).catch((error) => {
                reject(error);
            })
        })
    }

    async checkBalCalibPending(strBalanceID, intIdsNo) {
        var objCalibModel = new clsCalibModel();
        var objOwner = globaldata.arrPreWeighCalibOwner.find(k => k.idsNo == intIdsNo);
        var dailyCalibResult = await objCalibModel.checkDailyCalibrationPending(intIdsNo);
        var tempCubicInfo = globaldata.arrIdsInfo.find(ids => ids.Sys_IDSNo == intIdsNo);
        var periodicCalibResult = await PeriodicModel.checkIfTodayIsPeriodicCalib(intIdsNo);
        var calibDId = '1';
        if (objOwner.owner == 'analytical') {
            var objForRecalibration = globaldata.arrBalanceRecalibStatus.find(k => k.Bal_ID == strBalanceID);
            calibDId = '1';
        } else {
            var objForRecalibration = globaldata.arrBalanceRecalibStatusBin.find(k => k.Bal_ID == strBalanceID);
            if (tempCubicInfo.Sys_Port3 == 'IPC Balance') {
                calibDId = '4';
            }
        }
        if (objForRecalibration != undefined) {
            if (dailyCalibResult == "CR0" && objForRecalibration.DailyBalRecalib == 1) {
                dailyCalibResult = `CR${calibDId}`
            }
            if (periodicCalibResult == false && objForRecalibration.PeriodicBalRecalib == 1) {
                periodicCalibResult = true
            }
            return { Daily: dailyCalibResult, Periodic: periodicCalibResult }
        } else {
            return 'not present'; // If balance is not present in recalibration status
        }

    }
    async checkVernierCalibPending(strVerID, intIdsNo) {
        var objCalibModel = new clsCalibModel();
        var tempCubicInfo = globaldata.arrIdsInfo.find(ids => ids.Sys_IDSNo == intIdsNo);
        var periodicCalibResult = await PeriodicModel.checkIfTodayIsPeriodicCalibVernier(intIdsNo);
        var objForRecalibration = globaldata.arrVernierRecalibration.find(k => k.Ver_ID == strVerID);
        var calibDId = '3';

        if (objForRecalibration != undefined) {
            if (periodicCalibResult == false && objForRecalibration.PeriodicVerRecalib == 1) {
                periodicCalibResult = true
            }
            return { Periodic: periodicCalibResult }
        } else {
            return 'not present'; // If balance is not present in recalibration status
        }

    }

    getWeighBoxDetails(WtBoxID, Wt) {
        return new Promise((resolve, reject) => {
            const objCalibrationBox = {
                str_tableName: 'tbl_calibrationbox',
                data: 'max(id) as id',
                condition: [
                    { str_colName: 'CB_Type', value: 'Weight Box' },
                    { str_colName: 'CB_ID', value: WtBoxID },
                    { str_colName: 'CB_Wt', value: Wt },
                ]
            }
            objDatabase.select(objCalibrationBox).then((result) => {
                if (result[0][0].id != null) {
                    resolve("Matched");
                }
                else {
                    resolve("Not Matched")
                }
            }).catch((error) => {
                reject(error);
            })
        })
    }
    getBlockBoxDetails(WtBoxID, Wt) {
        return new Promise((resolve, reject) => {
            const objCalibrationBox = {
                str_tableName: 'tbl_calibrationbox',
                data: 'max(id) as id',
                condition: [
                    { str_colName: 'CB_Type', value: 'Block Box' },
                    { str_colName: 'CB_ID', value: WtBoxID },
                    { str_colName: 'CB_Wt', value: Wt },
                ]
            }
            objDatabase.select(objCalibrationBox).then((result) => {
                if (result[0][0].id != null) {
                    resolve("Matched");
                }
                else {
                    resolve("Not Matched")
                }
            }).catch((error) => {
                reject(error);
            })
        })
    }

    getCalibrationWeights(CalibType, strBalanceId) {
        return new Promise((resolve, reject) => {
            var selectCalibWeights = {
                str_tableName: 'tbl_balance_weights',
                data: '*',
                condition: [
                    { str_colName: 'Bal_ID', value: strBalanceId, comp: 'eq' },

                ]
            }

            if (CalibType == 1) {
                selectCalibWeights.condition.push(
                    { str_colName: 'Bal_Daily', value: 1, comp: 'eq' });

            }
            else if (CalibType == 2) {
                selectCalibWeights.condition.push(
                    { str_colName: 'Bal_Periodic', value: 1, comp: 'eq' });
            } else if (CalibType == 'E') {
                selectCalibWeights.condition.push(
                    { str_colName: 'Bal_IsEccentricity', value: 1, comp: 'eq' });
            } else if (CalibType == 'R') {
                selectCalibWeights.condition.push(
                    { str_colName: 'Bal_IsRepetability', value: 1, comp: 'eq' });
            } else if (CalibType == 'U') {
                selectCalibWeights.condition.push(
                    { str_colName: 'Bal_IsUncertinity', value: 1, comp: 'eq' });
            } else if (CalibType == 'L') {
                selectCalibWeights.condition.push(
                    { str_colName: 'Bal_Linearity', value: 1, comp: 'eq' });
            }

            objDatabase.select(selectCalibWeights).then((result) => {
                resolve(result[0]);
            }).catch((error) => {
                reject(error);
            })

        })
    }
    getCalibrationWeightsVernier(CalibType, strVerId) {
        return new Promise((resolve, reject) => {
            var selectCalibWeights = {
                str_tableName: 'tbl_vernier_blocks',
                data: '*',
                condition: [
                    { str_colName: 'ver_ID', value: strVerId, comp: 'eq' },

                ]
            }

            if (CalibType == 3) {
                selectCalibWeights.condition.push(
                    { str_colName: 'Ver_blnPeriodic', value: 1, comp: 'eq' });
            }

            objDatabase.select(selectCalibWeights).then((result) => {
                resolve(result[0]);
            }).catch((error) => {
                reject(error);
            })

        })
    }

    // blnPreCalibDone(objDailyPreCalibWeights, objCalibWeightsDaily) {
    //     return new Promise((resolve, reject) => {
    //         var WtFound = [];
    //         if (objDailyPreCalibWeights.length == objCalibWeightsDaily.length) {
    //             // Check the only calibration weights are set in precalibration
    //             for (let dailyWt = 0; dailyWt < objCalibWeightsDaily.length; dailyWt++) {

    //                 WtFound.push({ "Wt": objCalibWeightsDaily[dailyWt].Bal_StdWt, "FoundFlg": false });

    //                 for (let dailyPreWt = 0; dailyPreWt < objDailyPreCalibWeights.length; dailyPreWt++) {

    //                     if (objCalibWeightsDaily[dailyWt].Bal_StdWt ==
    //                         objDailyPreCalibWeights[dailyPreWt].Standard_Weight_Block) {
    //                         var objCalibWts = WtFound.find(k => k.Wt == objCalibWeightsDaily[dailyWt].Bal_StdWt);
    //                         objCalibWts.FoundFlg = true; 
    //                         break;
    //                     }

    //                 }
    //             }

    //             var blnResult = WtFound.some(ele => ele.FoundFlg == false);
    //             if (blnResult) {
    //                 resolve(false);
    //             }
    //             else { 
    //                 resolve(true);
    //             }

    //         }
    //         else {
    //             resolve(false);
    //         }
    //     })
    // }


    blnPreCalibDone(objPreCalibWeights, objCalibWeights) {
        return new Promise((resolve, reject) => {
            var WtFound = [];
            if (objPreCalibWeights.length == objCalibWeights.length) {
                // Check the only calibration weights are set in precalibration
                for (let dailyWt = 0; dailyWt < objCalibWeights.length; dailyWt++) {

                    WtFound.push({ "Wt": objCalibWeights[dailyWt].Bal_StdWt, "FoundFlg": false, "UID": objCalibWeights[dailyWt].Id });

                    for (let dailyPreWt = 0; dailyPreWt < objPreCalibWeights.length; dailyPreWt++) {


                        // if (objCalibWeights[dailyWt].Bal_StdWt ==
                        //     objPreCalibWeights[dailyPreWt].Standard_Weight_Block) {
                        if (objCalibWeights[dailyWt].Id ==
                            objPreCalibWeights[dailyPreWt].UID) {
                            var objCalibWts = WtFound.find(k => k.UID == objCalibWeights[dailyWt].Id);
                            objCalibWts.FoundFlg = true;
                            break;
                        }

                    }
                }

                var blnResult = WtFound.some(ele => ele.FoundFlg == false);
                if (blnResult) {
                    resolve(false);
                }
                else {
                    resolve(true);
                }

            }
            else {
                resolve(false);
            }
        })
    }
    blnPreCalibDoneVernier(objPreCalibWeights, objCalibWeights) {
        return new Promise((resolve, reject) => {
            var WtFound = [];
            if (objPreCalibWeights.length == objCalibWeights.length) {
                // Check the only calibration weights are set in precalibration
                for (let dailyWt = 0; dailyWt < objCalibWeights.length; dailyWt++) {

                    WtFound.push({ "Wt": objCalibWeights[dailyWt].Ver_StdBlock, "FoundFlg": false, "UID": objCalibWeights[dailyWt].id });

                    for (let dailyPreWt = 0; dailyPreWt < objPreCalibWeights.length; dailyPreWt++) {

                        // if (objCalibWeights[dailyWt].Ver_StdBlock ==
                        //     objPreCalibWeights[dailyPreWt].Standard_Weight_Block)
                        if (objCalibWeights[dailyWt].id ==
                            objPreCalibWeights[dailyPreWt].UID) {
                            var objCalibWts = WtFound.find(k => k.UID == objCalibWeights[dailyWt].id);
                            objCalibWts.FoundFlg = true;
                            break;
                        }

                    }
                }

                var blnResult = WtFound.some(ele => ele.FoundFlg == false);
                if (blnResult) {
                    resolve(false);
                }
                else {
                    resolve(true);
                }

            }
            else {
                resolve(false);
            }
        })
    }

    async verifyPreCalibration(intIdsNo) {
        try {
            var objCubicData = globaldata.arrIdsInfo.find(k => k.Sys_IDSNo == intIdsNo);
            var objOwner = globaldata.arrPreWeighCalibOwner.find(k => k.idsNo == intIdsNo);
            var tempCubicInfo = globaldata.arrIdsInfo.find(ids => ids.Sys_IDSNo == intIdsNo);
            var tempBalace = objCubicData.Sys_BalID;
            var calibDId = '1';
            if (objOwner.owner == 'analytical') {
                tempBalace = objCubicData.Sys_BalID;
                calibDId = '1';
            } else {
                tempBalace = objCubicData.Sys_BinBalID; // Bin Bal
                if (tempCubicInfo.Sys_Port3 == 'IPC Balance') {
                    calibDId = '4';
                }
            }
            var sortedArray = await PeriodicModel.sortedSeqArray(globaldata.arrSortedCalib, tempBalace);
            const objDailyPreCalibWeights = await this.getPreCalibrationDataDaily(tempBalace, objOwner.owner);
            const objPeriodicPreCalibWeights = await this.getPreCalibrationDataPeriodic(tempBalace, objOwner.owner);
            const objCalibCheck = await this.checkBalCalibPending(tempBalace, intIdsNo);
            const objCalibWeightsDaily = await this.getCalibrationWeights(1, tempBalace);
            const objCalibWeightsPeriodic = await this.getCalibrationWeights(2, tempBalace);


            var DailyMatched = true;
            var PeriodicMatched = true;
            var eccentricityMatched = true;
            var repetabilityMatched = true;
            var uncertinityMatched = true;
            var liniarityMatched = true;
            var isCertificateValid = true;
            var ExpiredWtBox = "";
            if (objCalibCheck != 'not present') {
                if (objCalibCheck.Daily == `CR${calibDId}`) {
                    if (objDailyPreCalibWeights.length > 0) {

                        DailyMatched = await this.blnPreCalibDone(objDailyPreCalibWeights, objCalibWeightsDaily);

                        if (DailyMatched != false) {
                            for (const weight of objDailyPreCalibWeights) {
                                var calibWtBox = weight.CalibrationBox_ID.split(',');
                                var arrCertValidity = weight.CalibrationBox_Validity_Date.split(',');
                                var weights = weight.CalibrationBox_Selected_Elements.split(',');

                                for (let i = 0; i < arrCertValidity.length; i++) {
                                    var todayDate = moment().format('YYYY-MM-DD');
                                    var validity = arrCertValidity[i];
                                    var validityDate = moment(validity).format(validity, 'YYYY-MM-DD');
                                    if (todayDate > validityDate) {
                                        isCertificateValid = false;
                                        ExpiredWtBox = calibWtBox[i];
                                    }
                                }
                                for (let index = 0; index < calibWtBox.length; index++) {

                                    var CalibCheckWt = await this.getWeighBoxDetails(calibWtBox[index], weights[index]);

                                    if (CalibCheckWt == "Not Matched") {
                                        DailyMatched = false;
                                        break;
                                    }
                                }

                                if (DailyMatched == false) {
                                    break;
                                }
                            }
                        }

                    }
                    else {
                        DailyMatched = false
                    }

                }

                if (objCalibCheck.Periodic == true) {
                    /***********
                 * We want flexible calibration, So if periodic calibration is not selected then skip
                 * weighment assignment check for Periodic calibration
                 */
                    // For Periodic
                    if (sortedArray.includes('P')) {
                        if (objPeriodicPreCalibWeights.length > 0) {

                            PeriodicMatched = await this.blnPreCalibDone(objPeriodicPreCalibWeights, objCalibWeightsPeriodic);

                            if (PeriodicMatched != false) {
                                for (const weight of objPeriodicPreCalibWeights) {
                                    var calibWtBox = weight.CalibrationBox_ID.split(',');
                                    var arrCertValidity = weight.CalibrationBox_Validity_Date.split(',');
                                    var weights = weight.CalibrationBox_Selected_Elements.split(',');
                                    for (let i = 0; i < arrCertValidity.length; i++) {
                                        var todayDate = moment().format('YYYY-MM-DD');
                                        var validity = arrCertValidity[i];
                                        var validityDate = moment(validity).format(validity, 'YYYY-MM-DD');
                                        if (todayDate > validityDate) {
                                            isCertificateValid = false;
                                            ExpiredWtBox = calibWtBox[i];
                                        }
                                    }
                                    for (let index = 0; index < calibWtBox.length; index++) {

                                        var CalibCheckWt = await this.getWeighBoxDetails(calibWtBox[index], weights[index]);

                                        if (CalibCheckWt == "Not Matched") {
                                            PeriodicMatched = false;
                                            break;
                                        }
                                    }

                                    if (PeriodicMatched == false) {
                                        break;
                                    }

                                }
                            }

                        }
                        else {
                            PeriodicMatched = false;
                        }
                    }
                    // for Eccentrcity
                    if (sortedArray.includes('E')) {
                        const objEccentricityPreCalibWeights = await this.getPreCalibrationDataEccentricity(tempBalace, objOwner.owner);
                        if (objEccentricityPreCalibWeights.length > 0) {
                            const objCalibWeightsEccentricity = await this.getCalibrationWeights('E', tempBalace);
                            eccentricityMatched = await this.blnPreCalibDone(objEccentricityPreCalibWeights, objCalibWeightsEccentricity);
                            if (eccentricityMatched != false) {
                                for (const weight of objEccentricityPreCalibWeights) {
                                    var calibWtBox = weight.CalibrationBox_ID.split(',');
                                    var arrCertValidity = weight.CalibrationBox_Validity_Date.split(',');
                                    var weights = weight.CalibrationBox_Selected_Elements.split(',');
                                    for (let i = 0; i < arrCertValidity.length; i++) {
                                        var todayDate = moment().format('YYYY-MM-DD');
                                        var validity = arrCertValidity[i];
                                        var validityDate = moment(validity).format(validity, 'YYYY-MM-DD');
                                        if (todayDate > validityDate) {
                                            isCertificateValid = false;
                                            ExpiredWtBox = calibWtBox[i];
                                        }
                                    }
                                    for (let index = 0; index < calibWtBox.length; index++) {

                                        var CalibCheckWt = await this.getWeighBoxDetails(calibWtBox[index], weights[index]);

                                        if (CalibCheckWt == "Not Matched") {
                                            eccentricityMatched = false;
                                            break;
                                        }
                                    }

                                    if (eccentricityMatched == false) {
                                        break;
                                    }

                                }
                            }
                        } else {
                            eccentricityMatched = false;
                        }
                    }
                    // for Repatibilty
                    if (sortedArray.includes('R')) {
                        const objRepetabilityPreCalibWeights = await this.getPreCalibrationDataRepetability(tempBalace, objOwner.owner);
                        if (objRepetabilityPreCalibWeights.length > 0) {
                            const objCalibWeightsRepetability = await this.getCalibrationWeights('R', tempBalace);
                            repetabilityMatched = await this.blnPreCalibDone(objRepetabilityPreCalibWeights, objCalibWeightsRepetability);
                            if (repetabilityMatched != false) {
                                for (const weight of objRepetabilityPreCalibWeights) {
                                    var calibWtBox = weight.CalibrationBox_ID.split(',');
                                    var arrCertValidity = weight.CalibrationBox_Validity_Date.split(',');
                                    var weights = weight.CalibrationBox_Selected_Elements.split(',');
                                    for (let i = 0; i < arrCertValidity.length; i++) {
                                        var todayDate = moment().format('YYYY-MM-DD');
                                        var validity = arrCertValidity[i];
                                        var validityDate = moment(validity).format(validity, 'YYYY-MM-DD');
                                        if (todayDate > validityDate) {
                                            isCertificateValid = false;
                                            ExpiredWtBox = calibWtBox[i];
                                        }
                                    }
                                    for (let index = 0; index < calibWtBox.length; index++) {

                                        var CalibCheckWt = await this.getWeighBoxDetails(calibWtBox[index], weights[index]);

                                        if (CalibCheckWt == "Not Matched") {
                                            repetabilityMatched = false;
                                            break;
                                        }
                                    }

                                    if (repetabilityMatched == false) {
                                        break;
                                    }

                                }
                            }
                        } else {
                            repetabilityMatched = false;
                        }
                    }
                    // for uncertinity
                    if (sortedArray.includes('U')) {
                        const objUncertinityPreCalibWeights = await this.getPreCalibrationDataUncertinity(tempBalace, objOwner.owner);
                        if (objUncertinityPreCalibWeights.length > 0) {
                            const objCalibWeightsUncertinity = await this.getCalibrationWeights('U', tempBalace);
                            uncertinityMatched = await this.blnPreCalibDone(objUncertinityPreCalibWeights, objCalibWeightsUncertinity);
                            if (uncertinityMatched != false) {
                                for (const weight of objUncertinityPreCalibWeights) {
                                    var calibWtBox = weight.CalibrationBox_ID.split(',');
                                    var arrCertValidity = weight.CalibrationBox_Validity_Date.split(',');
                                    var weights = weight.CalibrationBox_Selected_Elements.split(',');
                                    for (let i = 0; i < arrCertValidity.length; i++) {
                                        var todayDate = moment().format('YYYY-MM-DD');
                                        var validity = arrCertValidity[i];
                                        var validityDate = moment(validity).format(validity, 'YYYY-MM-DD');
                                        if (todayDate > validityDate) {
                                            isCertificateValid = false;
                                            ExpiredWtBox = calibWtBox[i];
                                        }
                                    }
                                    for (let index = 0; index < calibWtBox.length; index++) {

                                        var CalibCheckWt = await this.getWeighBoxDetails(calibWtBox[index], weights[index]);

                                        if (CalibCheckWt == "Not Matched") {
                                            uncertinityMatched = false;
                                            break;
                                        }
                                    }

                                    if (uncertinityMatched == false) {
                                        break;
                                    }

                                }
                            }
                        } else {
                            uncertinityMatched = false;
                        }
                    }
                }

                //return `${ExpiredWtBox} Weight Box,certification expired,,,`;

                if (DailyMatched == false || PeriodicMatched == false || eccentricityMatched == false || repetabilityMatched == false || uncertinityMatched == false) {
                    return "Invalid Weight,Assignment,,,";
                    // return "Valid PreCalibration,";
                }
                else if (!isCertificateValid) {
                    return `${ExpiredWtBox} WT Box,cert expired,,,`;
                } else {
                    return "Valid PreCalibration,";
                }
            } else {
                return "PLEASE SET BALANCE, AGAIN AND TRY AGAIN";
            }
        } catch (err) {
            console.log(err)
            var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
            logError = logError + err.stack;
            ErrorLog.addToErrorLog('verifyPreCalibration =' + logError)
        }
    }

    async VerifyPreCalibrationVernier(intIdsNo) {
        try {
            var objCubicData = globaldata.arrIdsInfo.find(k => k.Sys_IDSNo == intIdsNo);
            var tempVernier = objCubicData.Sys_VernierID;
            var calibDId = '3';
            const objPeriodicPreCalibWeights = await this.getPreCalibrationDataPeriodicVernier(tempVernier);
            const objCalibCheck = await this.checkVernierCalibPending(tempVernier, intIdsNo);
            const objCalibWeightsPeriodic = await this.getCalibrationWeightsVernier(3, tempVernier);
            var PeriodicMatched = true;
            var isCertificateValid = true;

            var ExpiredWtBox = "";
            if (objCalibCheck != 'not present') {
                if (objCalibCheck.Periodic == true) {
                    if (objPeriodicPreCalibWeights.length > 0) {

                        PeriodicMatched = await this.blnPreCalibDoneVernier(objPeriodicPreCalibWeights, objCalibWeightsPeriodic);

                        if (PeriodicMatched != false) {
                            for (const weight of objPeriodicPreCalibWeights) {
                                var calibWtBox = weight.CalibrationBox_ID.split(',');
                                var arrCertValidity = weight.CalibrationBox_Validity_Date.split(',');
                                var weights = weight.CalibrationBox_Selected_Elements.split(',');
                                for (let i = 0; i < arrCertValidity.length; i++) {
                                    var todayDate = moment().format('YYYY-MM-DD');
                                    var validity = arrCertValidity[i];
                                    var validityDate = moment(validity).format(validity, 'YYYY-MM-DD');
                                    if (todayDate > validityDate) {
                                        isCertificateValid = false;
                                        ExpiredWtBox = calibWtBox[i];
                                    }
                                }
                                for (let index = 0; index < calibWtBox.length; index++) {

                                    var CalibCheckWt = await this.getBlockBoxDetails(calibWtBox[index], weights[index]);

                                    if (CalibCheckWt == "Not Matched") {
                                        PeriodicMatched = false;
                                        break;
                                    }
                                }

                                if (PeriodicMatched == false) {
                                    break;
                                }

                            }
                        }

                    }
                    else {
                        PeriodicMatched = false;
                    }
                }
                if (PeriodicMatched == false) {
                    return "Invalid Block,Assignment,,,";
                }
                else if (!isCertificateValid) {
                    return `${ExpiredWtBox} Block Box,certification expired,,,`;
                } else {
                    return "Valid PreCalibration,";
                }
            } else {
                return "PLEASE SET VERNIER, AGAIN AND TRY AGAIN";
            }
        } catch (err) {
            throw new Error(err);
        }
    }

    async validatePreWeighmentActivites(intIdsNo, validateBatch = false) {
        if (validateBatch == true) {
            var BatchStatus = await this.checkBatchStart(intIdsNo);
        }
        else {
            BatchStatus = "Batch Started,";
        }

        var tempCubicInfo = globaldata.arrIdsInfo.find(ids => ids.Sys_IDSNo == intIdsNo);
        var objOwner = globaldata.arrPreWeighCalibOwner.find(k => k.idsNo == intIdsNo);
        var tempBalace = tempCubicInfo.Sys_BalID;
        if (objOwner.owner == 'analytical') {
            tempBalace = tempCubicInfo.Sys_BalID;
        } else {
            tempBalace = tempCubicInfo.Sys_BinBalID; // Bin Bal
        }
        if (tempBalace != 'None' &&
            (tempCubicInfo.Sys_Port1 == 'Balance' || tempCubicInfo.Sys_Port2 == 'Balance' || tempCubicInfo.Sys_Port1 == 'IPC Balance'
                || tempCubicInfo.Sys_Port3 == 'IPC Balance' || tempCubicInfo.Sys_Port4 == 'Balance')) {
            /**
         * @description For Sun Pharma Vapi Calibration will not be there, Also `verifyPreCalibration` is in Login
         * routine so here we are bypass VerifyPreCalibration
         */
            if (serverConfig.ProjectName == 'SunPharmaVP') {
                var PrecalibrationStatus = 'Valid PreCalibration,';
            } else {
                // var PrecalibrationStatus = await this.verifyPreCalibration(intIdsNo);
                var PrecalibrationStatus = 'Valid PreCalibration,';

            }
        } else {
            var PrecalibrationStatus = 'Valid PreCalibration,';
        }


        if (BatchStatus != "Batch Started,") {
            return BatchStatus;
        }
        else {
            return PrecalibrationStatus;
        }
    }

}
module.exports = PreWeighmentChecks;
