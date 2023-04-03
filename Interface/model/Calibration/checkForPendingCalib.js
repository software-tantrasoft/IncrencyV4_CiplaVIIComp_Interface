var globalData = require('../../global/globalData');
const Database = require('../../database/clsQueryProcess');
const database = new Database();
const request = require('request');
var logFromPC = require('../clsLogger');
const moment = require('moment');
const date1 = require('date-and-time');
const serverConfig = require('../../global/severConfig');
var clsMonitor = require('../../model/MonitorSocket/clsMonitSocket');
const objMonitor = new clsMonitor();
exports.checkForPendingCalib = async (strBalId, IDSSrNo) => {

    // below variable holds unsorted array
    var arr_sortedSequence = sortObject(globalData.arrCalibrationSequnce[0]);
    var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == IDSSrNo);
    var calibTable = 'tbl_calibration_status';
    if (objOwner.owner == 'analytical') {
        var calibTable = 'tbl_calibration_status';
    } else {
        var calibTable = 'tbl_calibration_status_bin';
    }
    var tempCubicInfo = globalData.arrIdsInfo.find(ids => ids.Sys_IDSNo == IDSSrNo);
    var calibarray = await checkIfCalibrationPresent(strBalId);
    var newArr = [];
    for (let i = 0; i < arr_sortedSequence.length; i++) {
        for (let j = 0; j < calibarray.length; j++) {
            if (arr_sortedSequence[i].key == calibarray[j] && arr_sortedSequence[i].value != 0) {
                newArr.push(arr_sortedSequence[i])
            }
        }
    }
    arr_sortedSequence = newArr;
    var tempCaibStatus = globalData.calibrationStatus.find(k => k.BalId == strBalId);
    /**
     * @date 30/12/2020
     * @description If user perform half periodic calibration and trying to perform remaining calibration on next day then system will allow to
     * perform calibration from start i-e periodic, so we are clearing flags in calibration_status which set to 1 previous date
     * depends updon the date, As discused with Rahul, Pushkar, Sheetal;  
     */
        var exists = Object.keys(tempCaibStatus.status).some(function(k) {
            return tempCaibStatus.status[k] == 1 ;
        });
        if(exists){
        // check for the date in table
        var objSelectCalibStatus = {
            str_tableName: calibTable,
            data: "*",
            condition: [
                {str_colName:'BalID', value:strBalId}
            ]
        }
        var arrResult = await database.select(objSelectCalibStatus);
         var dtCalibStatusDate = arrResult[0][0].date;
            if(moment(dtCalibStatusDate).format('YYYY-MM-DD')!=moment().format('YYYY-MM-DD')){
                 // Updating Our golbal array that all calibration is completed with complete status
                 for (var i in globalData.calibrationStatus) {
                    if (globalData.calibrationStatus[i].BalId == strBalId) {
                        globalData.calibrationStatus[i].status['P'] = 0;
                        globalData.calibrationStatus[i].status['E'] = 0;
                        globalData.calibrationStatus[i].status['R'] = 0;
                        globalData.calibrationStatus[i].status['U'] = 0;
                        globalData.calibrationStatus[i].status['L'] = 0;
                        break; //Stop this loop, we found it!
                    }
                }

                const updateCalibstatusObj = {
                    str_tableName: calibTable,
                    data: [
                        { str_colName: 'P', value: 0 },
                        { str_colName: 'E', value: 0 },
                        { str_colName: 'R', value: 0 },
                        { str_colName: 'U', value: 0 },
                        { str_colName: 'L', value: 0 }
                    ],
                    condition: [
                        { str_colName: 'BalID', value: strBalId }
                    ]
                }
                await database.update(updateCalibstatusObj);
            }
        }
    // If calibration due today then get calibration status for required balance in calibrationStatus 
    // or it blank so
    // no for loop execution and it sends CR0

    var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == IDSSrNo);
    var calibPId = '2';
    var calibEId = 'E';
    var calibRId = 'R';
    var calibUId = 'U';
    var calibLId = 'L';
    if (objOwner.owner == 'analytical') {
        var BalanceRecalibStatusObject = globalData.arrBalanceRecalibStatus.find(k => k.Bal_ID == strBalId);
        calibPId = '2';
        calibEId = 'E';
        calibRId = 'R';
        calibUId = 'U';
        calibLId = 'L';
    } else {
        var BalanceRecalibStatusObject = globalData.arrBalanceRecalibStatusBin.find(k => k.Bal_ID == strBalId);
        if (tempCubicInfo.Sys_Port3 == 'IPC Balance') {
            calibPId = '5';
            calibEId = 'e';
            calibRId = 'r';
            calibUId = 'u';
            calibLId = 'l';
        }
    }

    let TempCalibType = globalData.arrcalibType.find(k => k.idsNo == IDSSrNo);
    for (i = 0; i < arr_sortedSequence.length; i++) {
        /**
         arr_sortedSequence[i].value == 0 means calibration is disabled(not required) for
         specific company hence check calibration for arr_sortedSequence[i].value != 0.
        */
        // console.log(arr_sortedSequence[i])
        if (arr_sortedSequence[i].value != 0) {
            // check for only those are pending // next will return control to calling procedure
            if (tempCaibStatus.status[arr_sortedSequence[i].key] == 0) {
                switch (arr_sortedSequence[i].key) {
                    case 'P':
                        if (TempCalibType != undefined) {
                            TempCalibType.calibType = 'periodic';
                        } else {
                            globalData.arrcalibType.push({ idsNo: IDSSrNo, calibType: 'periodic' })
                        }
                        // Here we check if Calibration is done already for today or not  
                        let tempCalib = globalData.arrBalCaibDet.find(k => k.strBalId == strBalId);

                        if (tempCalib.isPeriodicDone == true && BalanceRecalibStatusObject.PeriodicBalRecalib == 0) {
                            return 'CR0';
                            //next();
                        } else {

                            var systemDate = new Date();
                            var systemHours = systemDate.getHours();

                            if (systemHours >= 7) {
                                // return "CR20PERIODIC CALIB,PENDING FOR BALANCE,,,";
                                if (serverConfig.ProjectName == "RBH" || serverConfig.ProjectName == 'SunHalolGuj1') { // Set in serverconfig file
                                    objMonitor.monit({ case: 'CR', idsNo: IDSSrNo, data: { calibType: 'Linearity' } });
                                    //return `CR${calibPId}0LINEARITY CALIB,PENDING FOR BALANCE,,,`;
                                    //return `CR${calibPId}0Linearity,Calibration Pending,,,`;
                                    return `CR${calibPId}1Linearity,Calibration Pending,,,`;
                                } else {
                                    objMonitor.monit({ case: 'CR', idsNo: IDSSrNo, data: { calibType: 'Periodic' } });
                                    //return `CR${calibPId}0PERIODIC CALIB,PENDING FOR BALANCE,,,`;
                                    //return `CR${calibPId}0Periodic Calibration,Pending,,,`;
                                    //if (serverConfig.ProjectName == 'MLVeer') {
                                    //    return `CR${calibPId}0Periodic Calibration,Pending,,,`;
                                    //}
                                    //else {
                                    return `CR${calibPId}1Periodic Calibration,Pending,,,`;
                                    //}

                                }
                            }
                            else {
                                //Dont take calibartions
                                return `CR0`;
                            }

                            //resolve(`CR20PERIODIC CALIB,PENDING FOR BALANCE,,,`);
                            next();
                        }

                        break;
                    case 'U':
                        if (TempCalibType != undefined) {
                            TempCalibType.calibType = 'uncertinity';
                        } else {
                            globalData.arrcalibType.push({ idsNo: IDSSrNo, calibType: 'uncertinity' })
                        }
                        objMonitor.monit({ case: 'CR', idsNo: IDSSrNo, data: { calibType: 'uncertinity' } });
                        //return `CR${calibUId}0UNCERTINITY CALIB,PENDING FOR BALANCE,,,`;
                        //return `CR${calibUId}0Uncertinity,Calibration Pending,,,`;
                        //if (serverConfig.ProjectName == 'MLVeer') {
                        //    return `CR${calibUId}0Uncertainty,Calibration Pending,,,`;
                        //}
                        //else {
                        return `CR${calibUId}1Uncertainty,Calibration Pending,,,`;
                        //}

                        next();
                        break;
                    case 'R':
                        if (TempCalibType != undefined) {
                            TempCalibType.calibType = 'repeatability';
                        } else {
                            globalData.arrcalibType.push({ idsNo: IDSSrNo, calibType: 'repeatability' })
                        }
                        objMonitor.monit({ case: 'CR', idsNo: IDSSrNo, data: { calibType: 'repeatability' } });
                        //return `CR${calibRId}0REPETABILITY CALIB,PENDING FOR BALANCE,,,`;
                        //return `CR${calibRId}0Repetability,Calibration Pending,,,`;
                        //if (serverConfig.ProjectName == 'MLVeer') {
                        //   return `CR${calibRId}0Repeatability,Calibration Pending,,,`;
                        //}
                        //else {
                        return `CR${calibRId}1Repeatability,Calibration Pending,,,`;
                        //}

                        next();
                        break;
                    case 'L':
                        if (TempCalibType != undefined) {
                            TempCalibType.calibType = 'linearity';
                        } else {
                            globalData.arrcalibType.push({ idsNo: IDSSrNo, calibType: 'linearity' })
                        }
                        objMonitor.monit({ case: 'CR', idsNo: IDSSrNo, data: { calibType: 'linearity' } });
                        //return `CR${calibLId}1LINEARITY CALIB,PENDING FOR BALANCE,,,`;
                        //if (serverConfig.ProjectName == 'MLVeer') {
                        //    return `CR${calibLId}0Linearity,Calibration Pending,,,`;
                        //}
                        //else {
                        return `CR${calibLId}1Linearity,Calibration Pending,,,`;
                        //}        
                        next();
                        break;
                    case 'E':
                        if (TempCalibType != undefined) {
                            TempCalibType.calibType = 'eccentricity';
                        } else {
                            globalData.arrcalibType.push({ idsNo: IDSSrNo, calibType: 'eccentricity' })
                        }
                        objMonitor.monit({ case: 'CR', idsNo: IDSSrNo, data: { calibType: 'eccentricity' } });
                        //return `CR${calibEId}0ECCENTRICITY CALIB,PENDING FOR BALANCE,,,`;
                        //return `CR${calibEId}0Eccentricity,Calibration Pending,,,`;
                        //if (serverConfig.ProjectName == 'MLVeer') {
                        //   return `CR${calibEId}0Eccentricity,Calibration Pending,,,`;
                        //}
                        //else {
                        return `CR${calibEId}1Eccentricity,Calibration Pending,,,`;
                        //}       
                        next();
                        break;
                    case 'V':
                        if (TempCalibType != undefined) {
                            TempCalibType.calibType = 'positional';
                        } else {
                            globalData.arrcalibType.push({ idsNo: IDSSrNo, calibType: 'positional' })
                        }
                        objMonitor.monit({ case: 'CR', idsNo: IDSSrNo, data: { calibType: 'positional' } });
                        return `CR0`;
                        next();
                        break;
                }
            }

        }
    }
    // If For loop fails means no calibraion pending control will shifted to here
    return 'CR0';

}
async function checkIfCalibrationPresent(strBalId) {
    const selectObj = {
        str_tableName: 'tbl_balance_weights',
        data: '*',
        condition: [
            { str_colName: 'Bal_ID', value: strBalId }
        ]
    }
    var selectResult = await database.select(selectObj);
    var array = [];
    for (let i = 0; i < selectResult[0].length; i++) {
        if (selectResult[0][i].Bal_Periodic == 1) {
            array.push('P');
        }
        if (selectResult[0][i].Bal_Linearity == 1) {
            array.push('L');
        }
        if (selectResult[0][i].Bal_IsEccentricity == 1) {
            array.push('E');
        }
        if (selectResult[0][i].Bal_IsUncertinity == 1) {
            array.push('U');
        }
        if (selectResult[0][i].Bal_IsRepetability == 1) {
            array.push('R');
        }
    }
    array = array.filter(function (item, pos, self) {
        return self.indexOf(item) == pos;
    })
    return array;


}

exports.sortedSeqArray = async (arr, strBalId) => {
    var present = await checkIfCalibrationPresent(strBalId);
    var newArry = [];
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < present.length; j++) {
            if (arr[i] == present[j]) {
                newArry.push(arr[i])
            }
        }
    }
    return newArry;
}
function sortObject(obj) {
    var arr = [];
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            arr.push({
                'key': prop,
                'value': obj[prop]
            });
        }
    }
    arr.sort(function (a, b) { return a.value - b.value; });
    //arr.sort(function(a, b) { a.value.toLowerCase().localeCompare(b.value.toLowerCase()); }); //use this to sort as strings
    return arr; // returns array
}
async function checkPeriodicEntry(calibDate, strBalId) {
    let selectObj = {
        str_tableName: 'tbl_calibration_periodic_master',
        data: '*',
        condition: [
            { str_colName: 'Periodic_CalbDate', value: calibDate, comp: 'eq' },
            { str_colName: 'Periodic_BalID', value: strBalId, comp: 'eq' }
        ]
    }
    let res = await database.select(selectObj);
    return res[0];
}
async function checkPeriodicEntryVernier(calibDate, strVernier) {
    let selectObj = {
        str_tableName: 'tbl_calibration_periodic_master_vernier',
        data: '*',
        condition: [
            { str_colName: 'Periodic_CalbDate', value: calibDate, comp: 'eq' },
            { str_colName: 'Periodic_VerID', value: strVernier, comp: 'eq' }
        ]
    }
    let res = await database.select(selectObj);
    return res[0];
}
async function checkIfLatestEntryResBal(BalId) {
    // `SELECT * FROM `tbl_calibration_periodic_master` WHERE Periodic_RepNo = (SELECT MAX(Periodic_RepNo) AS Periodic_RepNo WHERE Periodic_BalID = 'TantraTest');`
    try {
        // console.log(`SELECT * FROM 'tbl_calibration_periodic_master' WHERE Periodic_RepNo = (SELECT MAX(Periodic_RepNo) AS Periodic_RepNo WHERE Periodic_BalID = '${BalId})'`)
        let res = await database.execute(`SELECT * FROM tbl_calibration_periodic_master WHERE Periodic_RepNo = (SELECT MAX(Periodic_RepNo) AS Periodic_RepNo FROM tbl_calibration_periodic_master WHERE Periodic_BalID = '${BalId}')`);
        if (res[0].length != 0) {
            return res[0][0].Periodic_CalbDate;
        } else {
            return 'no data';
        }

    } catch (err) {
        return err;
    }
}
async function checkIfLatestEntryResVernier(VernierId) {
    // `SELECT * FROM `tbl_calibration_periodic_master` WHERE Periodic_RepNo = (SELECT MAX(Periodic_RepNo) AS Periodic_RepNo WHERE Periodic_BalID = 'TantraTest');`
    try {
        // console.log(`SELECT * FROM 'tbl_calibration_periodic_master' WHERE Periodic_RepNo = (SELECT MAX(Periodic_RepNo) AS Periodic_RepNo WHERE Periodic_BalID = '${BalId})'`)
        let res = await database.execute(`SELECT * FROM tbl_calibration_periodic_master_vernier WHERE Periodic_RepNo = (SELECT MAX(Periodic_RepNo) AS Periodic_RepNo FROM tbl_calibration_periodic_master_vernier WHERE Periodic_VerID = '${VernierId}')`);
        if (res[0].length != 0) {
            return res[0][0].Periodic_CalbDate;
        } else {
            return 'no data';
        }

    } catch (err) {
        return err;
    }
}
/**
 * 
 * @param {*} IDSSrNo 
 * @description Function check if today is periodic calibration or not
 * True : Calibration Pending , False: Calibration Not Pending
 */
exports.checkIfTodayIsPeriodicCalib = async (IDSSrNo) => {
    const tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(IDSSrNo));
    var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == parseInt(IDSSrNo));
    if (objOwner.owner == 'analytical') {
        var strBalId = tempCubicInfo.Sys_BalID;
    } else {
        var strBalId = tempCubicInfo.Sys_BinBalID;
    }
    let selectBalObj = {
        str_tableName: 'tbl_balance',
        data: '*',
        condition: [
            { str_colName: 'Bal_ID', value: strBalId, comp: 'eq' }
        ]
    }
    let res = await database.select(selectBalObj);
    if (res[0].length > 0) {
        const bln_storeType = res[0][0].Bal_CalbStoreType.readUIntLE();
        let bln_isNewBal = res[0][0].IsNewBalance.readUIntLE();
        var today = new Date();
        var month = today.getMonth();
        var year = today.getFullYear();
        // cheeck if new balance 
        // for sun halol new bal condition is skipped as per chaitanya from plant
        // for MLV taken as per standard incrency as per sheetal and nawathe sir
        if (bln_isNewBal == 1 && serverConfig.ProjectName != 'SunHalolGuj1') {
            //logFromPC.addtoProtocolLog('Calibration Cause:New Balance')
            return true;//everytime return true if new balance
        } else {

            if (bln_storeType == 1) // set days
            {
                var todayDate = moment().format('YYYY-MM-DD');
                let calibDate = res[0][0].Bal_CalbDueDt;
                calibDate = date1.format(calibDate, 'YYYY-MM-DD')
                // here we have to check if calibration is pending or done for this date
                let checkres = await checkPeriodicEntry(calibDate, strBalId);
                if (calibDate == todayDate) {
                    //logFromPC.addtoProtocolLog('Calibration Cause:Normal Routine')
                    return true;
                } if (calibDate <= todayDate && checkres.length == 0) {
                    //logFromPC.addtoProtocolLog('Calibration Cause:Normal Routine')
                    return true;
                } else {
                    return false;
                }
            } else {
                var arr = res[0][0].Bal_CalbDates.split(',');
                var today = new Date();
                var todayDate = moment().format('YYYY-MM-DD');
                var month = today.getMonth() + 1;
                month = ("0" + month).slice(-2);
                var year = today.getFullYear();
                var arr_calibdates = []
                for (let d of arr) {
                    var day = ("0" + d).slice(-2)
                    var date = '';
                    date = year + '-' + month + '-' + day;
                    let checkres = await checkPeriodicEntry(date, strBalId);
                    if ((todayDate == date) && (checkres.length == 0)) {
                        //logFromPC.addtoProtocolLog('Calibration Cause:Normal Routine(Todays)')
                        console.log('today match', date)
                        return true; // calibration Pending   
                    } else if (date <= todayDate && checkres.length == 0) {
                        let lastCalibDate = await checkIfLatestEntryResBal(strBalId);
                        lastCalibDate = moment(lastCalibDate).format('YYYY-MM-DD')
                        console.log('yesterday', date)
                        if (lastCalibDate != 'no data') {
                            if (date > lastCalibDate) {
                                //logFromPC.addtoProtocolLog('Calibration Cause:Normal Routine(Previous)')
                                return true;
                            } else {
                                continue;
                            }
                        } else {
                            return false;
                        }

                    } else {
                        console.log('false codition', date)
                        return false;
                    }
                }
            }
        }
    } else {
        return `Bal ${strBalId} not found in tbl_balalnce`;;
    }


}
exports.checkIfTodayIsPeriodicCalibVernier = async (IDSSrNo) => {
    const tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(IDSSrNo));
    var tempVernier = tempCubicInfo.Sys_VernierID;

    let selectVerObj = {
        str_tableName: 'tbl_vernier',
        data: '*',
        condition: [
            { str_colName: 'VernierID', value: tempVernier, comp: 'eq' }
        ]
    }
    let res = await database.select(selectVerObj);
    if (res[0].length > 0) {
        const bln_storeType = res[0][0].CalibStoreType.readUIntLE();
        let blnVerIsNew = res[0][0].Ver_IsNew;
        var today = new Date();
        var month = today.getMonth();
        var year = today.getFullYear();
        // cheeck if new balance
        if (blnVerIsNew == 1) {
           // logFromPC.addtoProtocolLog('Vernier Calibration Cause:New Vernier')
            return true;//everytime return true if new balance
        } else {

            if (bln_storeType == 1) // set days
            {
                var todayDate = moment().format('YYYY-MM-DD');
                let calibDate = res[0][0].CalDueDT;
                calibDate = date1.format(calibDate, 'YYYY-MM-DD')
                // here we have to check if calibration is pending or done for this date
                let checkres = await checkPeriodicEntryVernier(calibDate, tempVernier);
                if (calibDate == todayDate) {
                   // logFromPC.addtoProtocolLog('Vernier Calibration Cause:Normal Routine')
                    return true;
                } if (calibDate <= todayDate && checkres.length == 0) {
                   // logFromPC.addtoProtocolLog('Vernier Calibration Cause:Normal Routine')
                    return true;
                } else {
                    return false;
                }
            } else {
                var arr = res[0][0].Caldates.split(',');
                var today = new Date();
                var todayDate = moment().format('YYYY-MM-DD');
                var month = today.getMonth() + 1;
                month = ("0" + month).slice(-2);
                var year = today.getFullYear();
                var arr_calibdates = []
                for (let d of arr) {
                    var day = ("0" + d).slice(-2)
                    var date = '';
                    date = year + '-' + month + '-' + day;
                    let checkres = await checkPeriodicEntryVernier(date, tempVernier);
                    if ((todayDate == date) && (checkres.length == 0)) {
                        //logFromPC.addtoProtocolLog('Vernier Calibration Cause:Normal Routine(Todays)')
                        console.log('today match', date)
                        return true; // calibration Pending   
                    } else if (date <= todayDate && checkres.length == 0) {
                        let lastCalibDate = await checkIfLatestEntryResVernier(tempVernier);
                       
                        console.log('yesterday', date)
                        if (lastCalibDate != 'no data') {
                            lastCalibDate = moment(lastCalibDate).format('YYYY-MM-DD')
                            if (date > lastCalibDate) {
                                //logFromPC.addtoProtocolLog('Vernier Calibration Cause:Normal Routine(Previous)')
                                return true;
                            } else {
                                continue;
                            }
                        } else {
                            return true;
                        }

                    } else {
                        console.log('false codition', date)
                        return false;
                    }
                }
            }
        }
    } else {
        return `Ver ${tempVernier} not found in tbl_balalnce`;;
    }


}

