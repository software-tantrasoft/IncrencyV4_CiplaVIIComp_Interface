const globalData = require('../../global/globalData');
const obj_getRepSrNo = require('../../middleware/RepSrNo');
const date = require('date-and-time');
const Database = require('../../database/clsQueryProcess');
var checkForPenCal = require('./checkForPendingCalib');
const database = new Database();
var Comman = require('./clsCommonFunction');
var comman = new Comman();
const clsActivityLog = require('../../model/clsActivityLogModel');
const objActivityLog = new clsActivityLog();
const FormulaFunction = require('../Product/clsformulaFun');
const objFormulaFunction = new FormulaFunction();
const InstrumentUsage = require('../clsInstrumentUsageLog');
const serverConfig = require('../../global/severConfig');
var clsMonitor = require('../MonitorSocket/clsMonitSocket');
const sort = require('./checkForPendingCalib');
const clsStoreProcedure = require("../clsStoreProcedure")
const objStoreProcedure = new clsStoreProcedure()
const objInstrumentUsage = new InstrumentUsage();
const objMonitor = new clsMonitor();
const jsonTareCmd = require('../../global/tare.json');

class Repetabilty {
    // ****************************************************************************************************//
    // Below function takes argument as str_Protocol, IdSSrNo and stores all balance information related to
    // that IDS
    //**************************************************************************************************** */
    async getCalibWeights(str_Protocol, IDSSrNo) {

        // calculating balance Id assigned to that IDS
        const tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(IDSSrNo));
        var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == parseInt(IDSSrNo));
        if (objOwner.owner == 'analytical') {
            var strBalId = tempCubicInfo.Sys_BalID;
        } else {
            var strBalId = tempCubicInfo.Sys_BinBalID;
        }
        // Check if there is entries in incomplete tables so we need to move it into failed tables
        var bln_isPresent = await comman.checkIfRecordInIncomplete('R', strBalId)
        if (bln_isPresent) {
            const selectRepSrNoObj = {
                str_tableName: 'tbl_calibration_repetability_master_incomplete',
                data: 'Repet_RepNo',
                condition: [
                    { str_colName: 'Repet_BalID', value: strBalId, comp: 'eq' },
                ]
            }
            var result = await database.select(selectRepSrNoObj)
            let int_Repet_RepNo = result[0][0].Repet_RepNo;
            await comman.caibrationFails('R', strBalId, int_Repet_RepNo)

        }

        // calculating below parametes as recieved from CP000
        var generalCare = str_Protocol.substring(2, 3);
        var zeroError = str_Protocol.substring(3, 4);
        var spiritLevel = str_Protocol.substring(4, 5);
        // If any parameter fails the caibration fails
        if (generalCare == '1' || zeroError == '1' || spiritLevel == '1') {
            return "CF"
        } else {
            // Storing all balance details in global array related to that balance
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
                    { str_colName: 'Bal_IsRepetability', value: 1, comp: 'eq' },
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
            await objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', 'Repeatability Calibration', 'started');
            return 'CB01' + objFormulaFunction.FormatNumberString(result[0][0].Bal_StdWt, tempBalace.balance_info[0].Bal_DP) + strUnit + `, 0.000,Repeatability Calib,${TareCmd}`;

        }


    }
    //**************************************************************************************************************** */
    // Below function verifies recived weights is in range of tolerences and stores in database as in given situation
    // Also send next weights for calibrations
    //**************************************************************************************************************** */
    async verifyWeights(str_Protocol, IDSSrNo) {
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
        if (objOwner.owner == 'analytical') {
            var BalanceRecalibStatusObject = globalData.arrBalanceRecalibStatus.find(k => k.Bal_ID == strBalId);
        } else {
            var BalanceRecalibStatusObject = globalData.arrBalanceRecalibStatusBin.find(k => k.Bal_ID == strBalId);
        }

        //getting weight  for previously weight which we sent
        //commented by vivek on 28012020 as per new change*************************************************/ 
        //user can add balance haviing same weigths with different/same tollerence's
        //so we will fetch weight according to thier serial number 
        //const objSentWt = objBalRelWt.calibWt.find(j => j.Bal_StdWt == parseFloat(sendWt));
        const objSentWt = objBalRelWt.calibWt[0]
        //************************************************************************************************ *

        var objFailedFlag = globalData.arrFlagForFailCalib.find(k => k.idsNo == IDSSrNo);
        var Bal_DP = globalData.arrBalance.filter((k) => k.idsNo == IDSSrNo)[0].balance_info.find(k => k.Bal_ID == strBalId).Bal_DP

        // var objBal_DP = globalData.arrBalance[0].balance_info.find(k => k.Bal_ID == strBalId);
        // var Bal_DP = objBal_DP.Bal_DP // added by vivek to inser decimal place in master table on 07/08/2020

        if (objFailedFlag == undefined) {
            globalData.arrFlagForFailCalib.push({
                idsNo: IDSSrNo,
                failFlagDaily: false,
                failFlagPeriodic: false
            });
            objFailedFlag = globalData.arrFlagForFailCalib.find(k => k.idsNo == IDSSrNo);
        }

        // Selecting selectpreCalibWtObj from tbl_precalibration_periodic based on 'strBalId' and
        // First weight was sent
        const selectpreCalibWtObj = {
            str_tableName: 'tbl_precalibration_repeatability',
            data: '*',
            condition: [
                { str_colName: 'Equipment_ID', value: strBalId, comp: 'eq' },
                { str_colName: 'UID', value: objSentWt.Id, comp: 'eq' },
                // { str_colName: 'Equipment_Type', value: 'Balance', comp: 'eq' }
            ]
        }
        var result = await database.select(selectpreCalibWtObj)
        var repetability_precalib_weights = result[0][0];
        var counter = repetability_precalib_weights.Repeat_Count;
        const tempBalObject = globalData.arrBalance.find(k => k.idsNo == IDSSrNo);
        // getting only balanceInfo
        var balanceInfo = tempBalObject.balance_info[0];
        if (parseInt(srNo) <= counter) {

            var srNotobepalced = parseInt(srNo) + 1;
            var int_RepSrNo;

            // getting userIfo logged in for that cubicle
            const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IDSSrNo);

            if (parseInt(srNo) == 1) {
                var RepNo = await obj_getRepSrNo.getReportSerialNumber('R', strBalId, IDSSrNo)

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
                combineUpperLimit = combineUpperLimit.slice(0, -1)
                // for sun halol we want precalibration details in report
                if (serverConfig.ProjectName == 'SunHalolGuj1') {
                    var Repet_AllWeightboxID = "";
                    var Repet_AllWeightboxCert = "";
                    var Repet_AllWeightboxValidUpto = "";
                    const selectPrecalibSelWtObjForMaster = {
                        str_tableName: 'tbl_precalibration_repeatability',
                        data: '*',
                        condition: [
                            { str_colName: 'Equipment_ID', value: strBalId, comp: 'eq' },
                            // { str_colName: 'Standard_Weight_Block', value: objSendWt.Bal_StdWt, comp: 'eq' },
                            // { str_colName: 'Equipment_Type', value: 'Balance', comp: 'eq' }
                        ]
                    }
                    var preRes = await database.select(selectPrecalibSelWtObjForMaster);
                    for (let i of preRes[0]) {
                        Repet_AllWeightboxID = Repet_AllWeightboxID + i.CalibrationBox_ID + ",";
                        Repet_AllWeightboxCert = Repet_AllWeightboxCert + i.CalibrationBox_Calibration_CertificateNo + ",";
                        Repet_AllWeightboxValidUpto = Repet_AllWeightboxValidUpto + i.CalibrationBox_Validity_Date + ","
                    }
                    Repet_AllWeightboxID = Repet_AllWeightboxID.slice(0, -1);
                    Repet_AllWeightboxCert = Repet_AllWeightboxCert.slice(0, -1);
                    Repet_AllWeightboxValidUpto = Repet_AllWeightboxValidUpto.slice(0, -1)
                }
                const insertObj = {
                    str_tableName: 'tbl_calibration_repetability_master_incomplete',
                    data: [
                        { str_colName: 'Repet_RepNo', value: RepNo },
                        { str_colName: 'Repet_CalbDate', value: date.format(now, 'YYYY-MM-DD') },
                        { str_colName: 'Repet_CalbTime', value: date.format(now, 'HH:mm:ss') },
                        { str_colName: 'Repet_BalID', value: balanceInfo.Bal_ID, },
                        { str_colName: 'Repet_BalSrNo', value: balanceInfo.Bal_SrNo },
                        { str_colName: 'Repet_Make', value: balanceInfo.Bal_Make },
                        { str_colName: 'Repet_Model', value: balanceInfo.Bal_Model },
                        { str_colName: 'Repet_Unit', value: balanceInfo.Bal_Unit },
                        { str_colName: 'Repet_Dept', value: tempCubicInfo.Sys_dept },
                        { str_colName: 'Repet_LeastCnt', value: balanceInfo.Bal_LeastCnt },
                        { str_colName: 'Repet_MaxCap', value: balanceInfo.Bal_MaxCap },
                        { str_colName: 'Repet_MinCap', value: balanceInfo.Bal_MinCap },
                        { str_colName: 'Repet_ZeroError', value: 0 },
                        { str_colName: 'Repet_SpritLevel', value: 0 },
                        { str_colName: 'Repet_GerneralCare', value: 0 },
                        { str_colName: 'Repet_UserID', value: tempUserObject.UserId },
                        { str_colName: 'Repet_UserName', value: tempUserObject.UserName },
                        { str_colName: 'Repet_Location', value: serverConfig.ProjectName == 'SunHalolGuj1' ? tempCubicInfo.Sys_Location : tempCubicInfo.Sys_Area },
                        { str_colName: 'Repet_PrintNo', value: 0 },
                        { str_colName: 'Repet_RoomNo', value: tempCubicInfo.Sys_RoomNo },
                        { str_colName: 'Repet_StdWeight', value: combineStdWt },
                        { str_colName: 'Repet_NegTol', value: combineLowerLimit },
                        { str_colName: 'Repet_PosTol', value: combineUpperLimit },
                        { str_colName: 'Decimal_Point', value: Bal_DP },// added by vivek on 07-08-2020 for decimal point from Balance info table
                        { str_colName: 'Repet_IsBinBalance', value: balanceInfo.IsBinBalance }
                    ]
                }

                if (serverConfig.ProjectName == 'SunHalolGuj1') {
                    insertObj.data.push({ str_colName: 'Repet_AllWeightboxID', value: Repet_AllWeightboxID });
                    insertObj.data.push({ str_colName: 'Repet_AllWeightboxCert', value: Repet_AllWeightboxCert });
                    insertObj.data.push({ str_colName: 'Repet_AllWeightboxValidUpto', value: Repet_AllWeightboxValidUpto });
                }
                const insertIncompleteDetailsObj = {
                    str_tableName: 'tbl_calibration_repetability_detail_incomplete',
                    data: [
                        { str_colName: 'Repet_RecNo', value: 1 },
                        { str_colName: 'Repet_RepNo', value: RepNo },
                        { str_colName: 'Repet_BalStdWt', value: objSentWt.Bal_StdWt },
                        { str_colName: 'Repet_BalNegTol', value: objSentWt.Bal_NegTol },
                        { str_colName: 'Repet_BalPosTol', value: objSentWt.Bal_PosTol },
                        { str_colName: 'Repet_ActualWt', value: recieveWt },
                        { str_colName: 'Repet_StdWtID', value: repetability_precalib_weights.CalibrationBox_ID },
                        { str_colName: 'Repet_StdWt', value: repetability_precalib_weights.CalibrationBox_Selected_Elements },
                        { str_colName: 'Repet_WtIdentification', value: '' },
                        { str_colName: 'Repet_WeightBox_certfctNo', value: repetability_precalib_weights.CalibrationBox_Calibration_CertificateNo },
                        { str_colName: 'PercentofCapacity', value: repetability_precalib_weights.Percent_of_Capacity },
                        { str_colName: 'Repet_ValDate', value: repetability_precalib_weights.CalibrationBox_Validity_Date },
                    ]
                }
                // monit send messages 
                var wt = str_Protocol.split(',')[1].trim().split(' ')[0];
                objMonitor.monit({ case: 'CB', idsNo: IDSSrNo, data: { Weight: wt } });
                await database.save(insertObj)
                await database.save(insertIncompleteDetailsObj)


                var objActivity = {}
                Object.assign(objActivity,
                    { strUserId: tempUserObject.UserId },
                    { strUserName: tempUserObject.UserName },
                    { activity: 'Repeatability Calibration Started on IDS' + IDSSrNo });
                await objActivityLog.ActivityLogEntry(objActivity);

                /*
                   */
                // Updating RepSrNo if this calibration is first
                var sortedArray = await sort.sortedSeqArray(globalData.arrSortedCalib, strBalId);
                if (sortedArray[0] == 'R') {
                    await comman.updateRepSrNo('repetability', strBalId, IDSSrNo);
                }



            } else {
                var int_Repetability_RecNo1;
                // Selecting data from tbl_calibration_repetability_master_incomplete based on 'strBalId'
                const selectRepSrNoObj = {
                    str_tableName: 'tbl_calibration_repetability_master_incomplete',
                    data: 'Repet_RepNo',
                    condition: [
                        { str_colName: 'Repet_BalID', value: strBalId, comp: 'eq' },
                    ]
                }
                result = await database.select(selectRepSrNoObj)
                let int_Repetability_RepNo = result[0][0].Repet_RepNo;
                // Selecting Periodic_RecNo from tbl_calibration_uncertinity_detail_incomplete based on 'int_periodic_RepNo'
                const selectRecNoObj = {
                    str_tableName: 'tbl_calibration_repetability_detail_incomplete',
                    data: 'MAX(Repet_RecNo) AS Repet_RecNo',
                    condition: [
                        { str_colName: 'Repet_RepNo', value: int_Repetability_RepNo, comp: 'eq' },
                    ]
                }
                var resultRecNo = await database.select(selectRecNoObj)
                const Repetability_RecNo = resultRecNo[0][0].Repet_RecNo;
                int_Repetability_RecNo1 = Repetability_RecNo + 1;
                const inserDetailObj = {
                    str_tableName: 'tbl_calibration_repetability_detail_incomplete',
                    data: [
                        { str_colName: 'Repet_RecNo', value: int_Repetability_RecNo1 },
                        { str_colName: 'Repet_RepNo', value: int_Repetability_RepNo },
                        { str_colName: 'Repet_BalStdWt', value: objSentWt.Bal_StdWt },
                        { str_colName: 'Repet_BalNegTol', value: objSentWt.Bal_NegTol },
                        { str_colName: 'Repet_BalPosTol', value: objSentWt.Bal_PosTol },
                        { str_colName: 'Repet_ActualWt', value: recieveWt },
                        { str_colName: 'Repet_StdWtID', value: repetability_precalib_weights.CalibrationBox_ID },
                        { str_colName: 'Repet_StdWt', value: repetability_precalib_weights.CalibrationBox_Selected_Elements },
                        { str_colName: 'Repet_WtIdentification', value: '' },
                        { str_colName: 'Repet_WeightBox_certfctNo', value: repetability_precalib_weights.CalibrationBox_Calibration_CertificateNo },
                        { str_colName: 'PercentofCapacity', value: repetability_precalib_weights.Percent_of_Capacity },
                        { str_colName: 'Repet_ValDate', value: repetability_precalib_weights.CalibrationBox_Validity_Date },
                    ]
                }
                // console.log(inserDetailObj)
                await database.save(inserDetailObj);
                var wt1 = str_Protocol.split(',')[1].trim().split(' ')[0];
                objMonitor.monit({ case: 'CB', idsNo: IDSSrNo, data: { Weight: wt1 } });
            }

        }

        if (objSentWt.Bal_NegTol <= parseFloat(recieveWt) && (parseFloat(recieveWt) <= objSentWt.Bal_PosTol)) {
            if (parseInt(srNo) == counter) {

                //Added by vivek *************************************************************
                // var objAccepancelimit = await this.checkRepeatAccepancelimit(strBalId)
                // if (objAccepancelimit == 'Not Complies'){
                //     console.log('Fail');
                // }
                //****************************************************************************/

                // await comman.updateCalibStatus('R', strBalId, IDSSrNo);
                var arr_sortedCalibArray = await sort.sortedSeqArray(globalData.arrSortedCalib, strBalId);
                let lastCalibration = arr_sortedCalibArray[arr_sortedCalibArray.length - 1];

                var calibType = 'R';
                objFailedFlag.failFlagPeriodic = false;
                for (var i in globalData.calibrationStatus) {
                    if (globalData.calibrationStatus[i].BalId == strBalId) {
                        globalData.calibrationStatus[i].status[calibType] = 1;
                        break; //Stop this loop, we found it!
                    }
                }
                //await comman.incompleteToComplete('R', strBalId, IDSSrNo);
                if (lastCalibration == 'R') {
                    await comman.UpdateRecalibFLagPeriodic(strBalId, IDSSrNo);
                    BalanceRecalibStatusObject.PeriodicBalRecalib = 0;
                }
                objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', '', 'completed')
                console.log('done');

                const selectRepSrNoObj = {
                    str_tableName: 'tbl_calibration_repetability_master_incomplete',
                    data: 'Repet_RepNo',
                    condition: [
                        { str_colName: 'Repet_BalID', value: strBalId, comp: 'eq' },
                    ]
                }
                let result = await database.select(selectRepSrNoObj)
                let int_Repetability_RepNo = result[0][0].Repet_RepNo;

                let remark = await comman.calibrationCalculation('R', int_Repetability_RepNo, strBalId);
                if (remark == "Complies") {
                    await comman.updateCalibStatus('R', strBalId, IDSSrNo);
                    // Updating Periodic status from 0 -> 1 in calibration_status table as well as our global array
                    // which holding calibration status
                    // activity Entry for Repetability Calibration Completion
                    const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IDSSrNo);
                    var objActivity = {}
                    Object.assign(objActivity,
                        { strUserId: tempUserObject.UserId },
                        { strUserName: tempUserObject.UserName },
                        { activity: 'Repeatability Calibration Completed on IDS' + IDSSrNo });
                    objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });

                    /*
                       */

                    result = await checkForPenCal.checkForPendingCalib(strBalId, IDSSrNo)
                    await comman.incompleteToComplete('R', strBalId, IDSSrNo);
                    return result;
                }
                else {
                    const selectRepSrNoObj = {
                        str_tableName: 'tbl_calibration_repetability_master_incomplete',
                        data: 'Repet_RepNo',
                        condition: [
                            { str_colName: 'Repet_BalID', value: strBalId, comp: 'eq' },
                        ]
                    }
                    result = await database.select(selectRepSrNoObj)
                    let int_Repet_RepNo = result[0][0].Repet_RepNo;
                    result = await comman.caibrationFails('R', strBalId, int_Repet_RepNo)
                    objFailedFlag.failFlagPeriodic = true;
                    objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', '', 'completed')
                    return 'CF';
                }



            } else {
                if (srNotobepalced < 10) {
                    var protocolToBeSend = "CB0" + srNotobepalced +
                        objFormulaFunction.FormatNumberString(objBalRelWt.calibWt[0].Bal_StdWt, balanceInfo.Bal_DP) + balanceInfo.Bal_Unit + ", " + recieveWt + ",Repeatability Calib,";
                } else {
                    var protocolToBeSend = "CB" + srNotobepalced +
                        objFormulaFunction.FormatNumberString(objBalRelWt.calibWt[0].Bal_StdWt, balanceInfo.Bal_DP) + balanceInfo.Bal_Unit + ", " + recieveWt + ",Repeatability Calib,";
                }


                return protocolToBeSend;
            }
        }
        else {
            // We have to move records to failed tables
            const selectRepSrNoObj = {
                str_tableName: 'tbl_calibration_repetability_master_incomplete',
                data: 'Repet_RepNo',
                condition: [
                    { str_colName: 'Repet_BalID', value: strBalId, comp: 'eq' },
                ]
            }
            result = await database.select(selectRepSrNoObj)
            let int_Repet_RepNo = result[0][0].Repet_RepNo;
            result = await comman.caibrationFails('R', strBalId, int_Repet_RepNo)
            objFailedFlag.failFlagPeriodic = true;
            objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', '', 'completed')
            return 'CF';

        }
    }

    async checkRepeatAccepancelimit(strBalId) {
        try {
            var repetabilitymasterTable = '';
            var repetabilityDetailTable = '';

            repetabilitymasterTable = 'tbl_calibration_repetability_master_incomplete'
            repetabilityDetailTable = 'tbl_calibration_repetability_detail_incomplete';

            const selectRepSrNoObj = {
                str_tableName: repetabilitymasterTable,
                data: 'MAX(repet_repno) as repet_repno',
                condition: [
                    { str_colName: 'Repet_BalID', value: strBalId, comp: 'eq' },
                ]
            }
            var objselectRepSrNoObj = await database.select(selectRepSrNoObj)
            if (objselectRepSrNoObj[0].length > 0) {
                var result = await objStoreProcedure.CallSPRepeatabilityPercentage(objselectRepSrNoObj[0][0].repet_repno, strBalId, repetabilityDetailTable)
                if (result[1][0]['@result'] == 'Not Complies') {
                    return 'Not Complies'
                }
                else {
                    return 'Complies'
                }
            }
            else {
                var result = 'Data not found';
                return result
            }
        }
        catch (error) {
            console.log(error);
            throw new Error(error);
        }

    }


}

module.exports = Repetabilty;