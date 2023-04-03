const globalData = require('../../global/globalData');
const obj_getRepSrNo = require('../../middleware/RepSrNo');
const date = require('date-and-time');
const Database = require('../../database/clsQueryProcess');
const sort = require('./checkForPendingCalib');
const database = new Database();
var checkForPenCal = require('./checkForPendingCalib');
var Comman = require('./clsCommonFunction');
var comman = new Comman();
const clsActivityLog = require('../../model/clsActivityLogModel');
const objActivityLog = new clsActivityLog();
const FormulaFunction = require('../Product/clsformulaFun');
const objFormulaFunction = new FormulaFunction();
const InstrumentUsage = require('../clsInstrumentUsageLog');
var clsMonitor = require('../MonitorSocket/clsMonitSocket');
const objMonitor = new clsMonitor();
const objInstrumentUsage = new InstrumentUsage();
const serverConfig = require('../../global/severConfig');
const jsonTareCmd = require('../../global/tare.json');

class Uncertinity {
    // ****************************************************************************************************//
    // Below function takes argument as str_Protocol, IdSSrNo and stores all balance information related to
    // that IDS
    //**************************************************************************************************** */
    async getCalibWeights(str_Protocol, IDSSrNo) {
        try {
            // calculating balance Id assigned to that IDS
            const tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(IDSSrNo));
            var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == parseInt(IDSSrNo));
            if (objOwner.owner == 'analytical') {
                var strBalId = tempCubicInfo.Sys_BalID;
            } else {
                var strBalId = tempCubicInfo.Sys_BinBalID;
            }
            // Check if there is entries in incomplete tables so we need to move it into failed tables
            var bln_isPresent = await comman.checkIfRecordInIncomplete('U', strBalId)
            if (bln_isPresent) {
                const selectRepSrNoObj = {
                    str_tableName: 'tbl_calibration_uncertinity_master_incomplete',
                    data: 'Uncertinity_RepNo',
                    condition: [
                        { str_colName: 'Uncertinity_BalID', value: strBalId, comp: 'eq' },
                    ]
                }
                var result = await database.select(selectRepSrNoObj)
                let int_uncertinity_RepNo = result[0][0].Uncertinity_RepNo;
                await comman.caibrationFails('U', strBalId, int_uncertinity_RepNo)

            }

            // calculating below parametes as recieved from CP000
            var generalCare = str_Protocol.substring(2, 3);
            var zeroError = str_Protocol.substring(3, 4);
            var spiritLevel = str_Protocol.substring(4, 5);
            // If any parameter fails the caibration fails
            // console.log(str_Protocol)
            if (generalCare == '1' || zeroError == '1' || spiritLevel == '1') {
                return "CF";
            } else {
                // Storing all the balance details for 'tbl_balance' in global array
                const selectBalInfoObj = {
                    str_tableName: 'tbl_balance',
                    data: '*',
                    condition: [
                        { str_colName: 'Bal_ID', value: strBalId, comp: 'eq' },
                    ]
                }
                result = await database.select(selectBalInfoObj)
                var tempBal = globalData.arrBalance.find(k => k.idsNo == IDSSrNo);
                if (tempBal == undefined) {
                    globalData.arrBalance.push({
                        idsNo: IDSSrNo,
                        balance_info: result[0]
                    });
                } else {
                    tempBal.balance_info = result[0];
                }
                var tempIM = globalData.arrHexInfo.find(k => k.idsNo == IDSSrNo);
                var tempBalace = globalData.arrBalance.find(k => k.idsNo == IDSSrNo);
                var TareCmd = "";

                var appendVal = '';
                if (tempBalace.balance_info[0].Bal_Make.includes('Mettler') || tempBalace.balance_info[0].Bal_Make.includes('METTLER')) {
                    var objTareCmd = jsonTareCmd.Mettler.find(mod => tempBalace.balance_info[0].Bal_Model.includes(mod.Model));
                    if (objTareCmd == undefined) {
                        appendVal = jsonTareCmd.Mettler.find(mod => mod.Model == "Default");
                    }
                    else {
                        appendVal = objTareCmd.TareCmd;
                    }
                }
                else if (tempBalace.balance_info[0].Bal_Make.includes('Sarto') || tempBalace.balance_info[0].Bal_Make.includes('SARTO')) {
                    var objTareCmd = jsonTareCmd.Satorious.find(mod => tempBalace.balance_info[0].Bal_Model.includes(mod.Model));
                    if (objTareCmd == undefined) {
                        appendVal = jsonTareCmd.Satorious.find(mod => mod.Model == "Default");
                    }
                    else {
                        appendVal = objTareCmd.TareCmd;
                    }

                }
                else {
                    appendVal = "T"
                }



                var escChar = String.fromCharCode(27);
                if (tempIM.IM != "IMC3") {

                    if (tempCubicInfo.Sys_Area == "Effervescent Granulation" || tempCubicInfo.Sys_Area == "Granulation") {
                        TareCmd = ""
                    }

                    else if (appendVal == "T" && tempBalace.balance_info[0].Bal_Make.includes('Sarto')) {
                        TareCmd = `SP10${escChar}${appendVal},`
                    }
                    else {
                        TareCmd = `SP10${appendVal},`
                    }

                    //this.sendProtocol('SP10Z,', str_IpAddress);
                } else {
                    if (tempCubicInfo.Sys_Area == "Effervescent Granulation" || tempCubicInfo.Sys_Area == "Granulation") {
                        TareCmd = ""
                    }
                    else if (tempBalace.balance_info[0].Bal_Make.includes('Sarto')) {
                        TareCmd = `SP20${escChar}${appendVal},`
                    }
                    else {
                        TareCmd = `SP20${appendVal},`
                    }
                    //this.sendProtocol('SP20Z,', str_IpAddress);
                }
                if (serverConfig.ProjectName == 'RBH') {
                    TareCmd = "";
                }
                // Storing all the balance weight details for 'tbl_balance_weights' in global array
                const selectBalWtDetObj = {
                    str_tableName: 'tbl_balance_weights',
                    data: '*',
                    condition: [
                        { str_colName: 'Bal_ID', value: strBalId, comp: 'eq' },
                        { str_colName: 'Bal_IsUncertinity', value: 1, comp: 'eq' },
                    ]

                }
                if (serverConfig.ProjectName != 'SunHalolGuj1') {
                    var order = {
                        order: [
                            { str_colName: 'Bal_StdWt', value: 'ASC' }
                        ]
                    }
                    Object.assign(selectBalWtDetObj, order)
                }
                result = await database.select(selectBalWtDetObj)
                // If Array of weights is Already present in globalData then we have to update this so we first remove 
                // and push new one OR Else if not present then we add new one
                var found = globalData.arrBalCalibWeights.some(function (el) {
                    return el.idsNo == IDSSrNo;
                });
                if (found) {
                    const tempObj = globalData.arrBalCalibWeights.find(k => k.idsNo == IDSSrNo);
                    // removing Current obj
                    var index = globalData.arrBalCalibWeights.indexOf(tempObj);
                    if (index !== -1) globalData.arrBalCalibWeights.splice(index, 1);
                    globalData.arrBalCalibWeights.push({
                        idsNo: IDSSrNo,
                        calibWt: result[0] // array
                    })
                } else {
                    globalData.arrBalCalibWeights.push({
                        idsNo: IDSSrNo,
                        calibWt: result[0] // array
                    })
                }
                var strUnit = tempBalace.balance_info[0].Bal_Unit
                await objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', 'Uncertainty Calibration', 'started');
                return 'CB01' + objFormulaFunction.FormatNumberString(result[0][0].Bal_StdWt, tempBalace.balance_info[0].Bal_DP) + strUnit + `, 0.000,Uncertainty Calib,${TareCmd}`;

            }
        } catch (err) {
            console.log("error from getCalibWeights of Uncertinity", err);
            return err;
        }
    }
    //**************************************************************************************************************** */
    // Below function verifies recived weights is in range of tolerences and stores in database as in given situation
    // Also send next weights for calibrations
    //**************************************************************************************************************** */
    async verifyWeights(str_Protocol, IDSSrNo) {
        try {
            let now = new Date();
            // calculating Balance Id related to that Ids
            const tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(IDSSrNo));
            var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == parseInt(IDSSrNo));
            if (objOwner.owner == 'analytical') {
                var strBalId = tempCubicInfo.Sys_BalID;
            } else {
                var strBalId = tempCubicInfo.Sys_BinBalID;
            }
            // calculating below parameted from string 
            var srNo = str_Protocol.split(',')[0].substring(2, 4); // Weight Sr Number
            var sendWt = str_Protocol.split(',')[0].substring(4).slice(0, -1); // Weight send for calibration
            var recieveWt = str_Protocol.split(',')[1].split(' ')[0]; // recived weight after calibration
            var objBalRelWt = globalData.arrBalCalibWeights.find(k => k.idsNo == IDSSrNo);

            // getting weight for previously weight which we sent
            //commented by vivek on 28012020 as per new change*************************************************/ 
            //user can add balance haviing same weigths with different/same tollerence's
            //so we will fetch weight according to thier serial number 
            //const objSentWt = objBalRelWt.calibWt.find(j => j.Bal_StdWt == parseFloat(sendWt));
            const objSentWt = objBalRelWt.calibWt[0]
            //************************************************************************************************ */

            // Selecting selectpreCalibWtObj from tbl_precalibration_periodic based on 'strBalId' and
            // First weight was sent
            if (objOwner.owner == 'analytical') {
                var BalanceRecalibStatusObject = globalData.arrBalanceRecalibStatus.find(k => k.Bal_ID == strBalId);
            } else {
                var BalanceRecalibStatusObject = globalData.arrBalanceRecalibStatusBin.find(k => k.Bal_ID == strBalId);
            }
            var Bal_DP = globalData.arrBalance.filter((k) => k.idsNo == IDSSrNo)[0].balance_info.find(k => k.Bal_ID == strBalId).Bal_DP

            var objFailedFlag = globalData.arrFlagForFailCalib.find(k => k.idsNo == IDSSrNo);
            if (objFailedFlag == undefined) {
                globalData.arrFlagForFailCalib.push({
                    idsNo: IDSSrNo,
                    failFlagDaily: false,
                    failFlagPeriodic: false
                });
                objFailedFlag = globalData.arrFlagForFailCalib.find(k => k.idsNo == IDSSrNo);
            }
            const selectpreCalibWtObj = {
                str_tableName: 'tbl_precalibration_uncertainty',
                data: '*',
                condition: [
                    { str_colName: 'Equipment_ID', value: strBalId, comp: 'eq' },
                    { str_colName: 'UID', value: objSentWt.Id, comp: 'eq' },
                    // { str_colName: 'Equipment_Type', value: 'Balance', comp: 'eq' }
                ]
            }
            var result = await database.select(selectpreCalibWtObj)
            var uncertinity_precalib_weights = result[0][0];
            var counter = uncertinity_precalib_weights.Repeat_Count;
            if (parseInt(srNo) <= counter) {

                var srNotobepalced = parseInt(srNo) + 1;
                var int_RepSrNo;
                // const tempBalObject = globalData.arrBalance.find(k => k.idsNo === IDSSrNo);
                const tempBalObject = globalData.arrBalance.find(k => k.idsNo == IDSSrNo);
                // getting only balanceInfo
                const balanceInfo = tempBalObject.balance_info[0];
                // getting userIfo logged in for that cubicle
                const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IDSSrNo);
                if (parseInt(srNo) == 1) {

                    /** code for storing all the wgt in column of std wgt ,neg tol and pos tol */
                    var combineStdWt = "";
                    var combineLowerLimit = "";
                    var combineUpperLimit = "";
                    for (let i of objBalRelWt.calibWt) {
                        combineStdWt = combineStdWt + i.Bal_StdWt + ",";
                        combineLowerLimit = combineLowerLimit + i.Bal_NegTol + ",";
                        combineUpperLimit = combineUpperLimit + i.Bal_PosTol + ",";
                    }
                    combineStdWt = combineStdWt.slice(0, -1)
                    combineLowerLimit = combineLowerLimit.slice(0, -1)
                    combineUpperLimit = combineUpperLimit.slice(0, -1);
                    // for sun halol we want precalibration details in report
                    //   if(serverConfig.ProjectName == 'SunHalolGuj1') {
                    //     var Uncertinity_AllWeightboxID = "";
                    //    var Uncertinity_AllWeightboxCert = "";
                    //    var Uncertinity_AllWeightboxValidUpto = "";
                    //     const selectPrecalibSelWtObjForMaster = {
                    //      str_tableName: 'tbl_precalibration_uncertainty',
                    //      data: '*',
                    //      condition: [
                    //          { str_colName: 'Equipment_ID', value: strBalId, comp: 'eq' },
                    //          // { str_colName: 'Standard_Weight_Block', value: objSendWt.Bal_StdWt, comp: 'eq' },
                    //          // { str_colName: 'Equipment_Type', value: 'Balance', comp: 'eq' }
                    //      ]
                    //  }
                    //   var preRes =  await database.select(selectPrecalibSelWtObjForMaster);
                    //   for (let i of preRes[0]) {
                    //     Uncertinity_AllWeightboxID = Uncertinity_AllWeightboxID + i.CalibrationBox_ID + ",";
                    //     Uncertinity_AllWeightboxCert = Uncertinity_AllWeightboxCert + i.CalibrationBox_Calibration_CertificateNo + ",";
                    //     Uncertinity_AllWeightboxValidUpto = Uncertinity_AllWeightboxValidUpto + i.CalibrationBox_Validity_Date + ","
                    //   }
                    //   Uncertinity_AllWeightboxID = Uncertinity_AllWeightboxID.slice(0, -1);
                    //   Uncertinity_AllWeightboxCert = Uncertinity_AllWeightboxCert.slice(0, -1);
                    //   Uncertinity_AllWeightboxValidUpto = Uncertinity_AllWeightboxValidUpto.slice(0, -1)
                    //  }
                    var RepNo = await obj_getRepSrNo.getReportSerialNumber('U', strBalId, IDSSrNo)
                    const insertObj = {
                        str_tableName: 'tbl_calibration_uncertinity_master_incomplete',
                        data: [
                            { str_colName: 'Uncertinity_RepNo', value: RepNo },
                            { str_colName: 'Uncertinity_CalbDate', value: date.format(now, 'YYYY-MM-DD') },
                            { str_colName: 'Uncertinity_CalbTime', value: date.format(now, 'HH:mm:ss') },
                            { str_colName: 'Uncertinity_BalID', value: balanceInfo.Bal_ID, },
                            { str_colName: 'Uncertinity_BalSrNo', value: balanceInfo.Bal_SrNo },
                            { str_colName: 'Uncertinity_Make', value: balanceInfo.Bal_Make },
                            { str_colName: 'Uncertinity_Model', value: balanceInfo.Bal_Model },
                            { str_colName: 'Uncertinity_Unit', value: balanceInfo.Bal_Unit },
                            { str_colName: 'Uncertinity_Dept', value: balanceInfo.Bal_Dept },
                            { str_colName: 'Uncertinity_LeastCnt', value: balanceInfo.Bal_LeastCnt },
                            { str_colName: 'Uncertinity_MaxCap', value: balanceInfo.Bal_MaxCap },
                            { str_colName: 'Uncertinity_MinCap', value: balanceInfo.Bal_MinCap },
                            { str_colName: 'Uncertinity_ZeroError', value: 0 },
                            { str_colName: 'Uncertinity_SpritLevel', value: 0 },
                            { str_colName: 'Uncertinity_GerneralCare', value: 0 },
                            { str_colName: 'Uncertinity_UserID', value: tempUserObject.UserId },
                            { str_colName: 'Uncertinity_UserName', value: tempUserObject.UserName },
                            { str_colName: 'Uncertinity_Location', value: serverConfig.ProjectName == 'SunHalolGuj1' ? tempCubicInfo.Sys_Location : tempCubicInfo.Sys_Area },
                            { str_colName: 'Uncertinity_PrintNo', value: 0 },
                            { str_colName: 'Uncertinity_StdWeight', value: combineStdWt },
                            { str_colName: 'Uncertinity_NegTol', value: combineLowerLimit },
                            { str_colName: 'Uncertinity_PosTol', value: combineUpperLimit },
                            { str_colName: 'Decimal_Point', value: Bal_DP },
                            { str_colName: 'Uncertinity_IsBinBalance', value: balanceInfo.IsBinBalance }

                        ]
                    }
                    // if(serverConfig.ProjectName == 'SunHalolGuj1') {
                    //     insertObj.data.push({ str_colName: 'Uncertinity_AllWeightboxID', value: Uncertinity_AllWeightboxID });
                    //     insertObj.data.push({ str_colName: 'Uncertinity_AllWeightboxCert', value: Uncertinity_AllWeightboxCert });
                    //     insertObj.data.push({ str_colName: 'Uncertinity_AllWeightboxValidUpto', value: Uncertinity_AllWeightboxValidUpto });
                    //   }
                    const insertIncompleteDetailsObj = {
                        str_tableName: 'tbl_calibration_uncertinity_detail_incomplete',
                        data: [
                            { str_colName: 'Uncertinity_RecNo', value: 1 },
                            { str_colName: 'Uncertinity_RepNo', value: RepNo },
                            { str_colName: 'Uncertinity_BalStdWt', value: objSentWt.Bal_StdWt },
                            { str_colName: 'Uncertinity_BalNegTol', value: objSentWt.Bal_NegTol },
                            { str_colName: 'Uncertinity_BalPosTol', value: objSentWt.Bal_PosTol },
                            { str_colName: 'Uncertinity_ActualWt', value: recieveWt },
                            { str_colName: 'Uncertinity_StdWtID', value: uncertinity_precalib_weights.CalibrationBox_ID },
                            { str_colName: 'Uncertinity_StdWt', value: uncertinity_precalib_weights.CalibrationBox_Selected_Elements },
                            { str_colName: 'Uncertinity_WtIdentification', value: '' },
                            { str_colName: 'Uncertinity_WeightBox_certfctNo', value: uncertinity_precalib_weights.CalibrationBox_Calibration_CertificateNo },
                            { str_colName: 'PercentofCapacity', value: uncertinity_precalib_weights.Percent_of_Capacity },
                            { str_colName: 'Uncertinity_ValDate', value: uncertinity_precalib_weights.CalibrationBox_Validity_Date },
                        ]
                    }
                    await database.save(insertObj)
                    await database.save(insertIncompleteDetailsObj)
                    var wt = str_Protocol.split(',')[1].trim().split(' ')[0];
                    objMonitor.monit({ case: 'CB', idsNo: IDSSrNo, data: { Weight: wt } });
                    // activity Entry for Uncerinity Calibration Start

                    var objActivity = {}
                    Object.assign(objActivity,
                        { strUserId: tempUserObject.UserId },
                        { strUserName: tempUserObject.UserName },
                        { activity: 'Uncertainty Calibration Started on IDS' + IDSSrNo });
                    await objActivityLog.ActivityLogEntry(objActivity);

                    /*
                       */
                    // Updating RepSrNo if this calibration is first
                    var sortedArray = await sort.sortedSeqArray(globalData.arrSortedCalib, strBalId);
                    if (sortedArray[0] == 'U') {
                        await comman.updateRepSrNo('uncertanity', strBalId, IDSSrNo);
                    }


                } else {
                    var int_Uncertinity_RecNo1;
                    // Selecting data from tbl_calibration_uncertinity_master_incomplete based on 'strBalId'
                    const selectRepSrNoObj = {
                        str_tableName: 'tbl_calibration_uncertinity_master_incomplete',
                        data: 'Uncertinity_RepNo',
                        condition: [
                            { str_colName: 'Uncertinity_BalID', value: strBalId, comp: 'eq' },
                        ]
                    }
                    result = await database.select(selectRepSrNoObj)
                    let int_Uncertinity_RepNo = result[0][0].Uncertinity_RepNo;
                    // Selecting Periodic_RecNo from tbl_calibration_uncertinity_detail_incomplete based on 'int_periodic_RepNo'
                    const selectRecNoObj = {
                        str_tableName: 'tbl_calibration_uncertinity_detail_incomplete',
                        data: 'MAX(Uncertinity_RecNo) AS Uncertinity_RecNo',
                        condition: [
                            { str_colName: 'Uncertinity_RepNo', value: int_Uncertinity_RepNo, comp: 'eq' },
                        ]
                    }
                    var resultRecNo = await database.select(selectRecNoObj);
                    const Uncertinity_RecNo = resultRecNo[0][0].Uncertinity_RecNo;
                    int_Uncertinity_RecNo1 = Uncertinity_RecNo + 1;
                    const inserDetailObj = {
                        str_tableName: 'tbl_calibration_uncertinity_detail_incomplete',
                        data: [
                            { str_colName: 'Uncertinity_RecNo', value: int_Uncertinity_RecNo1 },
                            { str_colName: 'Uncertinity_RepNo', value: int_Uncertinity_RepNo },
                            { str_colName: 'Uncertinity_BalStdWt', value: objSentWt.Bal_StdWt },
                            { str_colName: 'Uncertinity_BalNegTol', value: objSentWt.Bal_NegTol },
                            { str_colName: 'Uncertinity_BalPosTol', value: objSentWt.Bal_PosTol },
                            { str_colName: 'Uncertinity_ActualWt', value: recieveWt },
                            { str_colName: 'Uncertinity_StdWtID', value: uncertinity_precalib_weights.CalibrationBox_ID },
                            { str_colName: 'Uncertinity_StdWt', value: uncertinity_precalib_weights.CalibrationBox_Selected_Elements },
                            { str_colName: 'Uncertinity_WtIdentification', value: '' },
                            { str_colName: 'Uncertinity_WeightBox_certfctNo', value: uncertinity_precalib_weights.CalibrationBox_Calibration_CertificateNo },
                            { str_colName: 'PercentofCapacity', value: uncertinity_precalib_weights.Percent_of_Capacity },
                            { str_colName: 'Uncertinity_ValDate', value: uncertinity_precalib_weights.CalibrationBox_Validity_Date },
                        ]
                    }
                    await database.save(inserDetailObj);
                    var wt = str_Protocol.split(',')[1].trim().split(' ')[0];
                    objMonitor.monit({ case: 'CB', idsNo: IDSSrNo, data: { Weight: wt } });
                }

                if (objSentWt.Bal_NegTol <= parseFloat(recieveWt) && (parseFloat(recieveWt) <= objSentWt.Bal_PosTol)) {

                    if (parseInt(srNo) == counter) {
                        console.log('done');

                        const selectRepSrNoObj = {
                            str_tableName: 'tbl_calibration_uncertinity_master_incomplete',
                            data: 'Uncertinity_RepNo',
                            condition: [
                                { str_colName: 'Uncertinity_BalID', value: strBalId, comp: 'eq' },
                            ]
                        }
                        let result = await database.select(selectRepSrNoObj)
                        let int_Uncertinity_RepNo = result[0][0].Uncertinity_RepNo;
                        // const selectRecNoObj = {
                        //     str_tableName: 'tbl_calibration_uncertinity_detail_incomplete',
                        //     data: 'Uncertinity_ActualWt',
                        //     condition: [
                        //         { str_colName: 'Uncertinity_RepNo', value: int_Uncertinity_RepNo, comp: 'eq' },
                        //     ]
                        // }
                        //var resultRecNo = await database.select(selectRecNoObj);
                        let remark = await comman.calibrationCalculation('U', int_Uncertinity_RepNo);
                        if (remark == "Complies") {


                            // Updating Periodic status from 0 -> 1 in calibration_status table as well as our global array
                            // which holding calibration status
                            await comman.updateCalibStatus('U', strBalId, IDSSrNo);
                            var calibType = 'U';
                            for (var i in globalData.calibrationStatus) {
                                if (globalData.calibrationStatus[i].BalId == strBalId) {
                                    globalData.calibrationStatus[i].status[calibType] = 1;
                                    break; //Stop this loop, we found it!
                                }
                            }
                            // If this calibration is last calibration then we have to move all caibration records
                            // to complete tables
                            var arr_sortedCalibArray = await sort.sortedSeqArray(globalData.arrSortedCalib, strBalId);
                            let lastCalibration = arr_sortedCalibArray[arr_sortedCalibArray.length - 1];

                            await comman.incompleteToComplete('U', strBalId, IDSSrNo);
                            if (lastCalibration == 'U') {
                                await comman.UpdateRecalibFLagPeriodic(strBalId, IDSSrNo);
                                BalanceRecalibStatusObject.PeriodicBalRecalib = 0;
                            }
                            objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', '', 'completed')
                            // activity Entry for Uncertanity Calibration Completion
                            const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IDSSrNo);
                            var objActivity = {}
                            Object.assign(objActivity,
                                { strUserId: tempUserObject.UserId },
                                { strUserName: tempUserObject.UserName },
                                { activity: 'Uncertainty Calibration Completed on IDS' + IDSSrNo });
                            objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });

                            result = await checkForPenCal.checkForPendingCalib(strBalId, IDSSrNo)
                            return result;
                        }
                        else {
                            const selectRepSrNoObj = {
                                str_tableName: 'tbl_calibration_uncertinity_master_incomplete',
                                data: 'Uncertinity_RepNo',
                                condition: [
                                    { str_colName: 'Uncertinity_BalID', value: strBalId, comp: 'eq' },
                                ]
                            }
                            result = await database.select(selectRepSrNoObj)
                            let int_uncertinity_RepNo = result[0][0].Uncertinity_RepNo;
                            await comman.caibrationFails('U', strBalId, int_uncertinity_RepNo)
                            objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', '', 'completed')
                            return 'CF';
                        }
                    } else {

                        if (srNotobepalced < 10) {
                            var protocolToBeSend = "CB0" + srNotobepalced +
                                objFormulaFunction.FormatNumberString(objBalRelWt.calibWt[0].Bal_StdWt, balanceInfo.Bal_DP) + balanceInfo.Bal_Unit + ", " + recieveWt + ",Uncertainty Calib,";
                        } else {
                            var protocolToBeSend = "CB" + srNotobepalced +
                                objFormulaFunction.FormatNumberString(objBalRelWt.calibWt[0].Bal_StdWt, balanceInfo.Bal_DP) + balanceInfo.Bal_Unit + ", " + recieveWt + ",Uncertainty Calib,";
                        }

                        return protocolToBeSend;
                    }

                } else {
                    // We have to move records to failed tables
                    const selectRepSrNoObj = {
                        str_tableName: 'tbl_calibration_uncertinity_master_incomplete',
                        data: 'Uncertinity_RepNo',
                        condition: [
                            { str_colName: 'Uncertinity_BalID', value: strBalId, comp: 'eq' },
                        ]
                    }
                    result = await database.select(selectRepSrNoObj)
                    let int_uncertinity_RepNo = result[0][0].Uncertinity_RepNo;
                    await comman.caibrationFails('U', strBalId, int_uncertinity_RepNo)
                    objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', '', 'completed')
                    return 'CF';

                }

            }


        } catch (err) {
            console.log("error from verifyWeights of Uncertinity", err);
            return err;
        }

    }
    //**************************************************************************************************************** */
}
module.exports = Uncertinity;