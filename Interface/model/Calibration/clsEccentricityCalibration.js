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
const objInstrumentUsage = new InstrumentUsage();
const serverConfig = require('../../global/severConfig');
var clsMonitor = require('../MonitorSocket/clsMonitSocket');
const sort = require('./checkForPendingCalib');
const objMonitor = new clsMonitor();
const jsonTareCmd = require('../../global/tare.json');

class Eccentricity {
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
            var bln_isPresent = await comman.checkIfRecordInIncomplete('E', strBalId)
            if (bln_isPresent) {
                const selectRepSrNoObj = {
                    str_tableName: 'tbl_calibration_eccentricity_master_incomplete',
                    data: 'Eccent_RepNo',
                    condition: [
                        { str_colName: 'Eccent_BalID', value: strBalId, comp: 'eq' },
                    ]
                }
                var result = await database.select(selectRepSrNoObj)
                let int_eccent_RepNo = result[0][0].Eccent_RepNo;
                await comman.caibrationFails('E', strBalId, int_eccent_RepNo)

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
                        { str_colName: 'Bal_IsEccentricity', value: 1, comp: 'eq' },
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
                await objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', 'Eccentricity Calibration', 'started');
                return 'CB01' + objFormulaFunction.FormatNumberString(result[0][0].Bal_StdWt, tempBalace.balance_info[0].Bal_DP) + strUnit + `, 0.000,Eccentricity Calib,${TareCmd}`;

            }


        } catch (err) {
            console.log("Error from getCalibWeights of Eccentricity", err);
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
            // getting weight  for previously weight which we sent
            //commented by vivek on 28012020 as per new change*************************************************/ 
            //user can add balance haviing same weigths with different/same tollerence's
            //so we will fetch weight according to thier serial number 
            //const objSentWt = objBalRelWt.calibWt.find(j => j.Bal_StdWt == parseFloat(sendWt));
            const objSentWt = objBalRelWt.calibWt[0]
            //************************************************************************************************ *

            // Selecting selectpreCalibWtObj from tbl_precalibration_periodic based on 'strBalId' and
            // First weight was sent
            if (objOwner.owner == 'analytical') {
                var BalanceRecalibStatusObject = globalData.arrBalanceRecalibStatus.find(k => k.Bal_ID == strBalId);
            } else {
                var BalanceRecalibStatusObject = globalData.arrBalanceRecalibStatusBin.find(k => k.Bal_ID == strBalId);
            }
            var objFailedFlag = globalData.arrFlagForFailCalib.find(k => k.idsNo == IDSSrNo);

            var Bal_DP = globalData.arrBalance.filter((k) => k.idsNo == IDSSrNo)[0].balance_info.find(k => k.Bal_ID == strBalId).Bal_DP

            if (objFailedFlag == undefined) {
                globalData.arrFlagForFailCalib.push({
                    idsNo: IDSSrNo,
                    failFlagDaily: false,
                    failFlagPeriodic: false
                });
                objFailedFlag = globalData.arrFlagForFailCalib.find(k => k.idsNo == IDSSrNo);
            }
            const selectpreCalibWtObj = {
                str_tableName: 'tbl_precalibration_eccentricity',
                data: '*',
                condition: [
                    { str_colName: 'Equipment_ID', value: strBalId, comp: 'eq' },
                    { str_colName: 'UID', value: objSentWt.Id, comp: 'eq' },
                    // { str_colName: 'Equipment_Type', value: 'Balance', comp: 'eq' }
                ]
            }
            var result = await database.select(selectpreCalibWtObj)
            var eccentricity_precalib_weights = result[0][0];
            var counter = eccentricity_precalib_weights.Repeat_Count;
            if (parseInt(srNo) <= counter) {

                var srNotobepalced = parseInt(srNo) + 1;
                var int_RepSrNo;

                const tempBalObject = globalData.arrBalance.find(k => k.idsNo == IDSSrNo);
                // getting only balanceInfo
                const balanceInfo = tempBalObject.balance_info[0];
                // getting userIfo logged in for that cubicle
                const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IDSSrNo);
                if (parseInt(srNo) == 1) {
                    var RepNo = await obj_getRepSrNo.getReportSerialNumber('E', strBalId, IDSSrNo);
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
                        var Eccent_AllWeightboxID = "";
                        var Eccent_AllWeightboxCert = "";
                        var Eccent_AllWeightboxValidUpto = "";
                        const selectPrecalibSelWtObjForMaster = {
                            str_tableName: 'tbl_precalibration_eccentricity',
                            data: '*',
                            condition: [
                                { str_colName: 'Equipment_ID', value: strBalId, comp: 'eq' },
                                // { str_colName: 'Standard_Weight_Block', value: objSendWt.Bal_StdWt, comp: 'eq' },
                                // { str_colName: 'Equipment_Type', value: 'Balance', comp: 'eq' }
                            ]
                        }
                        var preRes = await database.select(selectPrecalibSelWtObjForMaster);
                        for (let i of preRes[0]) {
                            Eccent_AllWeightboxID = Eccent_AllWeightboxID + i.CalibrationBox_ID + ",";
                            Eccent_AllWeightboxCert = Eccent_AllWeightboxCert + i.CalibrationBox_Calibration_CertificateNo + ",";
                            Eccent_AllWeightboxValidUpto = Eccent_AllWeightboxValidUpto + i.CalibrationBox_Validity_Date + ","
                        }
                        Eccent_AllWeightboxID = Eccent_AllWeightboxID.slice(0, -1);
                        Eccent_AllWeightboxCert = Eccent_AllWeightboxCert.slice(0, -1);
                        Eccent_AllWeightboxValidUpto = Eccent_AllWeightboxValidUpto.slice(0, -1)
                    }
                    const insertObj = {
                        str_tableName: 'tbl_calibration_eccentricity_master_incomplete',
                        data: [
                            { str_colName: 'Eccent_RepNo', value: RepNo },
                            { str_colName: 'Eccent_CalbDate', value: date.format(now, 'YYYY-MM-DD') },
                            { str_colName: 'Eccent_CalbTime', value: date.format(now, 'HH:mm:ss') },
                            { str_colName: 'Eccent_BalID', value: balanceInfo.Bal_ID, },
                            { str_colName: 'Eccent_BalSrNo', value: balanceInfo.Bal_SrNo },
                            { str_colName: 'Eccent_Make', value: balanceInfo.Bal_Make },
                            { str_colName: 'Eccent_Model', value: balanceInfo.Bal_Model },
                            { str_colName: 'Eccent_Unit', value: balanceInfo.Bal_Unit },
                            { str_colName: 'Eccent_Dept', value: balanceInfo.Bal_Dept },
                            { str_colName: 'Eccent_LeastCnt', value: balanceInfo.Bal_LeastCnt },
                            { str_colName: 'Eccent_MaxCap', value: balanceInfo.Bal_MaxCap },
                            { str_colName: 'Eccent_MinCap', value: balanceInfo.Bal_MinCap },
                            { str_colName: 'Eccent_ZeroError', value: 0 },
                            { str_colName: 'Eccent_SpritLevel', value: 0 },
                            { str_colName: 'Eccent_GerneralCare', value: 0 },
                            { str_colName: 'Eccent_UserID', value: tempUserObject.UserId },
                            { str_colName: 'Eccent_UserName', value: tempUserObject.UserName },
                            { str_colName: 'Eccent_Location', value: serverConfig.ProjectName == 'SunHalolGuj1' ? tempCubicInfo.Sys_Location : tempCubicInfo.Sys_Area },
                            { str_colName: 'Eccent_RoomNo', value: tempCubicInfo.Sys_RoomNo },
                            { str_colName: 'Eccent_DueDate', value: 0 },
                            { str_colName: 'Eccent_StdWeight', value: combineStdWt },
                            { str_colName: 'Eccent_NegTol', value: combineLowerLimit },
                            { str_colName: 'Eccent_PosTol', value: combineUpperLimit },
                            { str_colName: 'Decimal_Point', value: Bal_DP },// added by vivek on 07-08-2020 for decimal point from Balance info table
                            { str_colName: 'Eccent_IsBinBalance', value: balanceInfo.IsBinBalance },
                        ]
                    }
                    if (serverConfig.ProjectName == 'SunHalolGuj1') {
                        insertObj.data.push({ str_colName: 'Eccent_AllWeightboxID', value: Eccent_AllWeightboxID });
                        insertObj.data.push({ str_colName: 'Eccent_AllWeightboxCert', value: Eccent_AllWeightboxCert });
                        insertObj.data.push({ str_colName: 'Eccent_AllWeightboxValidUpto', value: Eccent_AllWeightboxValidUpto });
                    }
                    const insertIncompleteDetailsObj = {
                        str_tableName: 'tbl_calibration_eccentricity_detail_incomplete',
                        data: [
                            { str_colName: 'Eccent_RecNo', value: 1 },
                            { str_colName: 'Eccent_RepNo', value: RepNo },
                            { str_colName: 'Eccent_BalStdWt', value: objSentWt.Bal_StdWt },
                            { str_colName: 'Eccent_BalNegTol', value: objSentWt.Bal_NegTol },
                            { str_colName: 'Eccent_BalPosTol', value: objSentWt.Bal_PosTol },
                            { str_colName: 'Eccent_ActualWt', value: recieveWt },
                            { str_colName: 'Eccent_StdWtID', value: eccentricity_precalib_weights.CalibrationBox_ID },
                            { str_colName: 'Eccent_StdWt', value: eccentricity_precalib_weights.CalibrationBox_Selected_Elements },
                            { str_colName: 'Eccent_WtIdentification', value: '' },
                            { str_colName: 'Eccent_WeightBox_certfctNo', value: eccentricity_precalib_weights.CalibrationBox_Calibration_CertificateNo },
                            { str_colName: 'PercentofCapacity', value: eccentricity_precalib_weights.Percent_of_Capacity },
                            { str_colName: 'Eccent_ValDate', value: eccentricity_precalib_weights.CalibrationBox_Validity_Date },
                        ]
                    }
                    await database.save(insertObj)
                    await database.save(insertIncompleteDetailsObj)
                    var wt = str_Protocol.split(',')[1].trim().split(' ')[0];
                    objMonitor.monit({ case: 'CB', idsNo: IDSSrNo, data: { Weight: wt } });
                    // activity Entry for Eccentricity Calibration Completion

                    var objActivity = {}
                    Object.assign(objActivity,
                        { strUserId: tempUserObject.UserId },
                        { strUserName: tempUserObject.UserName },
                        { activity: 'Eccentricity Calibration Started on IDS' + IDSSrNo });
                    await objActivityLog.ActivityLogEntry(objActivity)

                    /*
                       */

                    // Updating RepSrNo if this calibration is first
                    var sortedArray = await sort.sortedSeqArray(globalData.arrSortedCalib, strBalId);
                    if (sortedArray[0] == 'E') {
                        await comman.updateRepSrNo('eccentricity', strBalId, IDSSrNo);
                    }



                } else {
                    var int_Eccent_RecNo1;
                    // Selecting data from tbl_calibration_repetability_master_incomplete based on 'strBalId'
                    const selectRepSrNoObj = {
                        str_tableName: 'tbl_calibration_eccentricity_master_incomplete',
                        data: 'Eccent_RepNo',
                        condition: [
                            { str_colName: 'Eccent_BalID', value: strBalId, comp: 'eq' },
                        ]
                    }
                    result = await database.select(selectRepSrNoObj)
                    // console.log(result)
                    let int_Eccentricity_RepNo = result[0][0].Eccent_RepNo;
                    // Selecting Periodic_RecNo from tbl_calibration_uncertinity_detail_incomplete based on 'int_periodic_RepNo'
                    const selectRecNoObj = {
                        str_tableName: 'tbl_calibration_eccentricity_detail_incomplete',
                        data: 'MAX(Eccent_RecNo) AS Eccent_RecNo',
                        condition: [
                            { str_colName: 'Eccent_RepNo', value: int_Eccentricity_RepNo, comp: 'eq' },
                        ]
                    }
                    var resultRecNo = await database.select(selectRecNoObj)
                    const Eccentricity_RecNo = resultRecNo[0][0].Eccent_RecNo;
                    int_Eccent_RecNo1 = Eccentricity_RecNo + 1;
                    const inserDetailObj = {
                        str_tableName: 'tbl_calibration_eccentricity_detail_incomplete',
                        data: [
                            { str_colName: 'Eccent_RecNo', value: int_Eccent_RecNo1 },
                            { str_colName: 'Eccent_RepNo', value: int_Eccentricity_RepNo },
                            { str_colName: 'Eccent_BalStdWt', value: objSentWt.Bal_StdWt },
                            { str_colName: 'Eccent_BalNegTol', value: objSentWt.Bal_NegTol },
                            { str_colName: 'Eccent_BalPosTol', value: objSentWt.Bal_PosTol },
                            { str_colName: 'Eccent_ActualWt', value: recieveWt },
                            { str_colName: 'Eccent_StdWtID', value: eccentricity_precalib_weights.CalibrationBox_ID },
                            { str_colName: 'Eccent_StdWt', value: eccentricity_precalib_weights.CalibrationBox_Selected_Elements },
                            { str_colName: 'Eccent_WtIdentification', value: '' },
                            { str_colName: 'Eccent_WeightBox_certfctNo', value: eccentricity_precalib_weights.CalibrationBox_Calibration_CertificateNo },
                            { str_colName: 'PercentofCapacity', value: eccentricity_precalib_weights.Percent_of_Capacity },
                            { str_colName: 'Eccent_ValDate', value: eccentricity_precalib_weights.CalibrationBox_Validity_Date },
                        ]
                    }
                    await database.save(inserDetailObj)

                    var wt = str_Protocol.split(',')[1].trim().split(' ')[0];
                    objMonitor.monit({ case: 'CB', idsNo: IDSSrNo, data: { Weight: wt } });

                }

                if (objSentWt.Bal_NegTol <= parseFloat(recieveWt) && (parseFloat(recieveWt) <= objSentWt.Bal_PosTol)) {
                    if (parseInt(srNo) == counter) {
                        console.log('done');

                        const selectRepSrNoObj = {
                            str_tableName: 'tbl_calibration_eccentricity_master_incomplete',
                            data: 'Eccent_RepNo',
                            condition: [
                                { str_colName: 'Eccent_BalID', value: strBalId, comp: 'eq' },
                            ]
                        }
                        let result = await database.select(selectRepSrNoObj)
                        let int_Eccentricity_RepNo = result[0][0].Eccent_RepNo;

                        let remark = await comman.calibrationCalculation('E', int_Eccentricity_RepNo);
                        if (remark == "Complies") {
                            var arr_sortedCalibArray = await sort.sortedSeqArray(globalData.arrSortedCalib, strBalId);
                            let lastCalibration = arr_sortedCalibArray[arr_sortedCalibArray.length - 1];

                            var calibType = 'E';
                            for (var i in globalData.calibrationStatus) {
                                if (globalData.calibrationStatus[i].BalId == strBalId) {
                                    globalData.calibrationStatus[i].status[calibType] = 1;
                                    break; //Stop this loop, we found it!
                                }
                            }
                            await comman.updateCalibStatus('E', strBalId, IDSSrNo);
                            await comman.incompleteToComplete('E', strBalId, IDSSrNo);
                            if (lastCalibration == 'E') {
                                await comman.UpdateRecalibFLagPeriodic(strBalId, IDSSrNo);
                                BalanceRecalibStatusObject.PeriodicBalRecalib = 0;
                            }
                            objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', '', 'completed')
                            objFailedFlag.failFlagPeriodic = false;

                            // activity Entry for Eccentricity Calibration Completion
                            const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IDSSrNo);
                            var objActivity = {}
                            Object.assign(objActivity,
                                { strUserId: tempUserObject.UserId },
                                { strUserName: tempUserObject.UserName },
                                { activity: 'Eccentricity Calibration Completed on IDS' + IDSSrNo });
                            await objActivityLog.ActivityLogEntry(objActivity)

                            result = await checkForPenCal.checkForPendingCalib(strBalId, IDSSrNo)
                            return result;
                        }
                        else {
                            const selectRepSrNoObj = {
                                str_tableName: 'tbl_calibration_eccentricity_master_incomplete',
                                data: 'Eccent_RepNo',
                                condition: [
                                    { str_colName: 'Eccent_BalID', value: strBalId, comp: 'eq' },
                                ]
                            }
                            result = await database.select(selectRepSrNoObj)
                            let int_eccent_RepNo = result[0][0].Eccent_RepNo;
                            result = await comman.caibrationFails('E', strBalId, int_eccent_RepNo);
                            objFailedFlag.failFlagPeriodic = true;
                            objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', '', 'completed')
                            return 'CF';
                        }
                        /*
                           */
                    } else {

                        if (srNotobepalced < 10) {
                            var protocolToBeSend = "CB0" + srNotobepalced +
                                objFormulaFunction.FormatNumberString(objBalRelWt.calibWt[0].Bal_StdWt, balanceInfo.Bal_DP) + balanceInfo.Bal_Unit + ", " + recieveWt + ",Eccentricity Calib,";
                        } else {
                            var protocolToBeSend = "CB" + srNotobepalced +
                                objFormulaFunction.FormatNumberString(objBalRelWt.calibWt[0].Bal_StdWt, balanceInfo.Bal_DP) + balanceInfo.Bal_Unit + ", " + recieveWt + ",Eccentricity Calib,";
                        }

                        return protocolToBeSend;
                    }
                }
                else {
                    // We have to move records to failed tables
                    const selectRepSrNoObj = {
                        str_tableName: 'tbl_calibration_eccentricity_master_incomplete',
                        data: 'Eccent_RepNo',
                        condition: [
                            { str_colName: 'Eccent_BalID', value: strBalId, comp: 'eq' },
                        ]
                    }
                    result = await database.select(selectRepSrNoObj)
                    let int_eccent_RepNo = result[0][0].Eccent_RepNo;
                    result = await comman.caibrationFails('E', strBalId, int_eccent_RepNo);
                    objFailedFlag.failFlagPeriodic = true;
                    objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', '', 'completed')
                    return 'CF';

                }
            }


        }
        catch (err) {
            console.log("Error from verifyWeights of Eccentricity", err);
            return err;
        }
    }

    async checkEccentricityAccepancelimit(strBalId, Bal_DP) {
        try {


            var masterTableName = 'tbl_calibration_eccentricity_master_incomplete';
            var detailTableName = 'tbl_calibration_eccentricity_detail_incomplete';

            var dp = Bal_DP

            // const selectRepSrNoObj = {
            //     str_tableName: detailTableName,
            //     data: 'MAX(repet_repno) as Eccent_RepNo',
            //     condition: [
            //         { str_colName: 'Eccent_RepNo', value: strBalId, comp: 'eq' },
            //     ]
            // }


            var SqlQuery = `SELECT * FROM ${detailTableName} WHERE Eccent_RepNo=`
            SqlQuery = SqlQuery + `(SELECT MAX(Eccent_RepNo) AS Eccent_RepNo FROM ${masterTableName} WHERE Eccent_BalID ='${strBalId}')`

            var objselectRepSrNoObj = await database.execute(SqlQuery)

            if (objselectRepSrNoObj[0].length > 0) {
                var detailData = objselectRepSrNoObj[0];
                var repSrNo = objselectRepSrNoObj[0][0].Eccent_RepNo;
                var count = 0, finalVal;
                for (var i = 0; i < detailData.length; i++) {
                    /**
                     * formula used
                     * (C1-C) X100/C1,
                     * (C2-C) X100/C2,
                     * (C3-C) X100/C3
                     * (C4-C) X100/C4
                     */
                    var recNo = i + 1;
                    const data = await database.execute(`SELECT ROUND(ABS((ROUND(Eccent_ActualWt,${dp}) - 
                    (SELECT ROUND(Eccent_ActualWt,${dp}) FROM tbl_calibration_eccentricity_detail 
                    WHERE Eccent_RepNo = ${repSrNo} AND Eccent_RecNo = 1))*100/(SELECT ROUND(Eccent_ActualWt,${dp}) FROM tbl_calibration_eccentricity_detail 
                    WHERE Eccent_RepNo = ${repSrNo} AND Eccent_RecNo = ${recNo})) ,${dp})AS Deviation,
                    CASE WHEN (SELECT (ROUND(ABS((ROUND(Eccent_ActualWt,${dp}) - (SELECT ROUND(Eccent_ActualWt,${dp}) FROM tbl_calibration_eccentricity_detail 
                    WHERE Eccent_RepNo = ${repSrNo} AND Eccent_RecNo = 1))*100/(SELECT ROUND(Eccent_ActualWt,${dp}) FROM tbl_calibration_eccentricity_detail 
                    WHERE Eccent_RepNo = ${repSrNo} AND Eccent_RecNo = ${recNo})) ,${dp})) > 0.05) THEN 'Not Ok' ELSE 'Ok' END AS remark  
                    FROM
                   ${detailTableName}
                    WHERE
                    Eccent_RepNo = ${repSrNo} AND Eccent_RecNo = ${recNo}`);


                    const remarkData = data[0][0];
                    if (remarkData.remark == "Not Ok") {
                        count = count + 1;
                    }
                }
                if (count > 0) { finalVal = 'Not Complies'; } else { finalVal = 'Complies'; };
                return finalVal;
            }
            else {
                return "Data not Found"
            }
        }
        catch (error) {
            console.log(error);
            throw new Error(error);
        }

    }

}
module.exports = Eccentricity;