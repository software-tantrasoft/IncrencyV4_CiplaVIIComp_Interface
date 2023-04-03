const globalData = require('../../global/globalData');
const obj_getRepSrNo = require('../../middleware/RepSrNo');
const date = require('date-and-time');
const Database = require('../../database/clsQueryProcess');
var checkForPenCal = require('./checkForPendingCalib');
var Comman = require('./clsCommonFunction');
const clsActivityLog = require('../../model/clsActivityLogModel');
const objActivityLog = new clsActivityLog();
var clsMonitor = require('../MonitorSocket/clsMonitSocket');
const objMonitor = new clsMonitor();
var comman = new Comman();
const InstrumentUsage = require('../clsInstrumentUsageLog');
const objInstrumentUsage = new InstrumentUsage();
const FetchDetail = require('../../model/clsFetchDetails');
const fetchDetails = new FetchDetail()
var serverConfig = require('../../global/severConfig')
const FormulaFunction = require('../Product/clsformulaFun');
const sort = require('./checkForPendingCalib');
const objFormulaFunction = new FormulaFunction();
const jsonTareCmd = require('../../global/tare.json');

//////////////////////////////////////////////////
const database = new Database();
class CalibrationModel {
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
            var bln_isPresent = await comman.checkIfRecordInIncomplete('P', strBalId)
            if (bln_isPresent) {
                const selectRepSrNoObj = {
                    str_tableName: 'tbl_calibration_periodic_master_incomplete',
                    data: 'Periodic_RepNo',
                    condition: [
                        { str_colName: 'Periodic_BalID', value: strBalId, comp: 'eq' },
                    ]
                }
                var result = await database.select(selectRepSrNoObj)
                let int_periodic_RepNo = result[0][0].Periodic_RepNo;
                await comman.caibrationFails('P', strBalId, int_periodic_RepNo)
            }

            // calculating below parametes as recieved from CP000
            var generalCare = str_Protocol.substring(2, 3);
            var zeroError = str_Protocol.substring(3, 4);
            var spiritLevel = str_Protocol.substring(4, 5);
            // If any parameter fails the caibration fails
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
                        { str_colName: 'Bal_Periodic', value: 1, comp: 'eq' },
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
                // Instrument Usage log for balance start
                var strunit = tempBalace.balance_info[0].Bal_Unit
                if (serverConfig.ProjectName == "RBH" || serverConfig.ProjectName == 'SunHalolGuj1') { // Set in serverconfig file

                    await objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', 'Linearity Calibration', 'started');
                    return 'CB01' + objFormulaFunction.FormatNumberString(result[0][0].Bal_StdWt, tempBalace.balance_info[0].Bal_DP) + strunit + `, 0.000,Linearity Calib,${TareCmd}`;
                }
                else {
                    await objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', 'Periodic Calibration', 'started');
                    return 'CB01' + objFormulaFunction.FormatNumberString(result[0][0].Bal_StdWt, tempBalace.balance_info[0].Bal_DP) + strunit + `, 0.000,Periodic Calib,${TareCmd}`;
                }
                // await objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', 'Periodic Calibration', 'started');
                // return 'CB01' + result[0][0].Bal_StdWt + 'g, 0.000,Periodic Calib,';

            }


        }
        catch (err) {
            console.log("Error from getCalibWeights of Periodic", err)
            return `Error from getCalibWeights of Periodic ${err}`;
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
            // fetching calibration weights for that balance from global array with reference to Ids
            var objBalRelWt = globalData.arrBalCalibWeights.find(k => k.idsNo == IDSSrNo);

            // getting weight  for previously weight which we sent
            //commented by vivek on 28012020 as per new change*************************************************/ 
            //user can add balance haviing same weigths with different/same tollerence's
            //so we will fetch weight according to thier serial number 
            //const objSentWt = objBalRelWt.calibWt.find(j => j.Bal_StdWt == parseFloat(sendWt));
            const objSentWt = objBalRelWt.calibWt[parseFloat(srNo) - 1]
            //************************************************************************************************ */

            var objFailedFlag = globalData.arrFlagForFailCalib.find(k => k.idsNo == IDSSrNo);
            if (objFailedFlag == undefined) {
                globalData.arrFlagForFailCalib.push({
                    idsNo: IDSSrNo,
                    failFlagDaily: false,
                    failFlagPeriodic: false
                });
                objFailedFlag = globalData.arrFlagForFailCalib.find(k => k.idsNo == IDSSrNo);
            }


            if (parseInt(srNo) <= objBalRelWt.calibWt.length) {

                var srNotobepalced = parseInt(srNo) + 1;
                var int_RepSrNo;

                const tempBalObject = globalData.arrBalance.find(k => k.idsNo == IDSSrNo);
                // getting only balanceInfo
                const balanceInfo = tempBalObject.balance_info[0];
                // getting userIfo logged in for that cubicle

                var ResponseFrmPC = ""
                // getting reCaibration status from `tbl_recalibration_balance_status` on start up
                if (objOwner.owner == 'analytical') {
                    var BalanceRecalibStatusObject = globalData.arrBalanceRecalibStatus.find(k => k.Bal_ID == strBalId);
                } else {
                    var BalanceRecalibStatusObject = globalData.arrBalanceRecalibStatusBin.find(k => k.Bal_ID == strBalId);
                }
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
                    combineUpperLimit = combineUpperLimit.slice(0, -1)
                    // Inserting entries in master table for daily/Periodic calibration
                    // Object for inserting data for Incommplete master
                    // for sun halol we want precalibration details in report
                    if (serverConfig.ProjectName == 'SunHalolGuj1') {
                        var Periodic_AllWeightboxID = "";
                        var Periodic_AllWeightboxCert = "";
                        var Periodic_AllWeightboxValidUpto = "";
                        const selectPrecalibSelWtObjForMaster = {
                            str_tableName: 'tbl_precalibration_periodic',
                            data: '*',
                            condition: [
                                { str_colName: 'Equipment_ID', value: strBalId, comp: 'eq' },
                                // { str_colName: 'Standard_Weight_Block', value: objSendWt.Bal_StdWt, comp: 'eq' },
                                // { str_colName: 'Equipment_Type', value: 'Balance', comp: 'eq' }
                            ]
                        }
                        var preRes = await database.select(selectPrecalibSelWtObjForMaster);
                        for (let i of preRes[0]) {
                            Periodic_AllWeightboxID = Periodic_AllWeightboxID + i.CalibrationBox_ID + ",";
                            Periodic_AllWeightboxCert = Periodic_AllWeightboxCert + i.CalibrationBox_Calibration_CertificateNo + ",";
                            Periodic_AllWeightboxValidUpto = Periodic_AllWeightboxValidUpto + i.CalibrationBox_Validity_Date + ","
                        }
                        Periodic_AllWeightboxID = Periodic_AllWeightboxID.slice(0, -1);
                        Periodic_AllWeightboxCert = Periodic_AllWeightboxCert.slice(0, -1);
                        Periodic_AllWeightboxValidUpto = Periodic_AllWeightboxValidUpto.slice(0, -1)
                    }
                    var RepNo = await obj_getRepSrNo.getReportSerialNumber('P', strBalId, IDSSrNo);
                    const insertObj = {
                        str_tableName: 'tbl_calibration_periodic_master_incomplete',
                        data: [
                            { str_colName: 'Periodic_RepNo', value: RepNo },
                            { str_colName: 'Periodic_CalbDate', value: date.format(now, 'YYYY-MM-DD') },
                            { str_colName: 'Periodic_CalbTime', value: date.format(now, 'HH:mm:ss') },
                            { str_colName: 'Periodic_BalID', value: balanceInfo.Bal_ID, },
                            { str_colName: 'Periodic_BalSrNo', value: balanceInfo.Bal_SrNo },
                            { str_colName: 'Periodic_Make', value: balanceInfo.Bal_Make },
                            { str_colName: 'Periodic_Model', value: balanceInfo.Bal_Model },
                            { str_colName: 'Periodic_Unit', value: balanceInfo.Bal_Unit },
                            { str_colName: 'Periodic_Dept', value: tempCubicInfo.Sys_dept },
                            { str_colName: 'Periodic_LeastCnt', value: balanceInfo.Bal_LeastCnt },
                            { str_colName: 'Periodic_MaxCap', value: balanceInfo.Bal_MaxCap },
                            { str_colName: 'Periodic_MinCap', value: balanceInfo.Bal_MinCap },
                            { str_colName: 'Periodic_ZeroError', value: 0 },
                            { str_colName: 'Periodic_SpritLevel', value: 0 },
                            { str_colName: 'Periodic_GerneralCare', value: 0 },
                            { str_colName: 'Periodic_UserID', value: tempUserObject.UserId },
                            { str_colName: 'Periodic_UserName', value: tempUserObject.UserName },
                            { str_colName: 'Periodic_PrintNo', value: 0 },
                            { str_colName: 'Periodic_IsRecalib', value: BalanceRecalibStatusObject.PeriodicBalRecalib },
                            { str_colName: 'Periodic_Location', value: serverConfig.ProjectName == 'SunHalolGuj1' ? tempCubicInfo.Sys_Location : tempCubicInfo.Sys_Area },
                            { str_colName: 'Periodic_CubicalNo', value: tempCubicInfo.Sys_CubicNo },
                            { str_colName: 'Periodic_Bal_MaxoptRange', value: balanceInfo.Bal_MaxoptRange },
                            { str_colName: 'Periodic_Bal_MinoptRange', value: balanceInfo.Bal_MinoptRange },
                            { str_colName: 'Periodic_RoomNo', value: balanceInfo.Bal_CalbDuration },
                            { str_colName: 'Periodic_DueDate', value: balanceInfo.Bal_CalbDueDt },
                            { str_colName: 'Decimal_Point', value: balanceInfo.Bal_DP },
                            { str_colName: 'Periodic_StdWeight', value: combineStdWt },
                            { str_colName: 'Periodic_NegTol', value: combineLowerLimit },
                            { str_colName: 'Periodic_PosTol', value: combineUpperLimit },
                            { str_colName: 'Periodic_IsBinBalance', value: balanceInfo.IsBinBalance },
                        ]
                    }
                    if (serverConfig.ProjectName == 'SunHalolGuj1') {
                        insertObj.data.push({ str_colName: 'Periodic_AllWeightboxID', value: Periodic_AllWeightboxID });
                        insertObj.data.push({ str_colName: 'Periodic_AllWeightboxCert', value: Periodic_AllWeightboxCert });
                        insertObj.data.push({ str_colName: 'Periodic_AllWeightboxValidUpto', value: Periodic_AllWeightboxValidUpto });
                    }
                    var objMasterEntry = await database.save(insertObj)
                    // Selecting Preclalibration weight from tbl_calibration_periodic_detail_incomplete
                    const selectPreCalibperiodicWtObj = {
                        str_tableName: 'tbl_precalibration_periodic',
                        data: '*',
                        condition: [
                            { str_colName: 'Equipment_ID', value: strBalId, comp: 'eq' },
                            { str_colName: 'Standard_Weight_Block', value: objSentWt.Bal_StdWt, comp: 'eq' },
                            { str_colName: 'UID', value: objSentWt.Id, comp: 'eq' },
                        ]
                    }
                    var result = await database.select(selectPreCalibperiodicWtObj)
                    // Inserting 1st weight data in  tbl_calibration_periodic_detail_incomplete
                    const periodic_precalib_weights = result[0][0];
                    const insertIncompletePeriodicDetailsObj = {
                        str_tableName: 'tbl_calibration_periodic_detail_incomplete',
                        data: [
                            { str_colName: 'Periodic_RepNo', value: RepNo },
                            { str_colName: 'Periodic_RecNo', value: 1 },
                            { str_colName: 'Periodic_BalStdWt', value: objSentWt.Bal_StdWt },
                            { str_colName: 'Periodic_BalNegTol', value: objSentWt.Bal_NegTol },
                            { str_colName: 'Periodic_BalPosTol', value: objSentWt.Bal_PosTol },
                            { str_colName: 'Periodic_ActualWt', value: recieveWt },
                            { str_colName: 'Periodic_StdWtBoxID', value: periodic_precalib_weights.CalibrationBox_ID },
                            { str_colName: 'Periodic_StdWt', value: periodic_precalib_weights.CalibrationBox_Selected_Elements },
                            { str_colName: 'Periodic_WtIdentification', value: '' },
                            { str_colName: 'Periodic_WeightBox_certfctNo', value: periodic_precalib_weights.CalibrationBox_Calibration_CertificateNo },
                            { str_colName: 'PercentofCapacity', value: 0 },
                            { str_colName: 'Decimal_Point', value: 0 },
                            { str_colName: 'Periodic_ValDate', value: periodic_precalib_weights.CalibrationBox_Validity_Date },
                        ]
                    }
                    var objDetailSave = await database.save(insertIncompletePeriodicDetailsObj);

                    // activity Entry for Perioic Calibration start

                    var objActivity = {}
                    Object.assign(objActivity,
                        { strUserId: tempUserObject.UserId },
                        { strUserName: tempUserObject.UserName }
                    );
                    if (objFailedFlag.failFlagPeriodic == true) {
                        var CalibName = "Periodic";
                        if (serverConfig.ProjectName == "RBH" || serverConfig.ProjectName == 'SunHalolGuj1') { CalibName = "Linearity" }
                        Object.assign(objActivity,
                            { activity: `${CalibName} Calibration Started on IDS ${IDSSrNo} after Failure` }
                        );
                    }
                    else {
                        var CalibName = "Periodic";
                        if (serverConfig.ProjectName == "RBH" || serverConfig.ProjectName == 'SunHalolGuj1') { CalibName = "Linearity" }
                        Object.assign(objActivity,
                            { activity: `${CalibName} Calibration Started on IDS` + IDSSrNo }
                        );
                    }

                    await objActivityLog.ActivityLogEntry(objActivity);

                    /* 
                       */
                    var wt = str_Protocol.split(',')[1].trim().split(' ')[0];
                    objMonitor.monit({ case: 'CB', idsNo: IDSSrNo, data: { Weight: wt } });
                    // Updating RepSrNo if this calibration is first
                    // if (globalData.arrSortedCalib[0] == 'P') {
                    //     await comman.updateRepSrNo('periodic', strBalId,IDSSrNo);
                    // }

                } else {
                    var int_periodic_RecNo1;
                    // Selecting data from tbl_calibration_periodic_master_incomplete based on 'strBalId'
                    const selectRepSrNoObj = {
                        str_tableName: 'tbl_calibration_periodic_master_incomplete',
                        data: 'Periodic_RepNo',
                        condition: [
                            { str_colName: 'Periodic_BalID', value: strBalId, comp: 'eq' },
                        ]
                    }
                    var result = await database.select(selectRepSrNoObj);
                    let int_periodic_RepNo = result[0][0].Periodic_RepNo;
                    // Selecting Periodic_RecNo from tbl_calibration_periodic_detail_incomplete based on 'int_periodic_RepNo'
                    const selectRecNoObj = {
                        str_tableName: 'tbl_calibration_periodic_detail_incomplete',
                        data: 'MAX(Periodic_RecNo) AS Periodic_RecNo',
                        condition: [
                            { str_colName: 'Periodic_RepNo', value: int_periodic_RepNo, comp: 'eq' },
                        ]
                    }
                    var resultRecNo = await database.select(selectRecNoObj)
                    const Periodic_RecNo = resultRecNo[0][0].Periodic_RecNo;
                    int_periodic_RecNo1 = Periodic_RecNo + 1;

                    // Selecting selectpreCalibWtObj from tbl_precalibration_periodic based on 'strBalId' and
                    // First weight was sent
                    const selectPreCalibperiodicWtObj = {
                        str_tableName: 'tbl_precalibration_periodic',
                        data: '*',
                        condition: [
                            { str_colName: 'Equipment_ID', value: strBalId, comp: 'eq' },
                            { str_colName: 'Standard_Weight_Block', value: objSentWt.Bal_StdWt, comp: 'eq' },
                            // { str_colName: 'Equipment_Type', value: 'Balance', comp: 'eq' },
                        ]
                    }

                    result = await database.select(selectPreCalibperiodicWtObj)
                    const periodic_precalib_weights = result[0][0];
                    // Inserting data in tbl_calibration_periodic_detail_incomplete
                    const inserDetailObj = {
                        str_tableName: 'tbl_calibration_periodic_detail_incomplete',
                        data: [
                            { str_colName: 'Periodic_RepNo', value: int_periodic_RepNo },
                            { str_colName: 'Periodic_RecNo', value: int_periodic_RecNo1 },
                            { str_colName: 'Periodic_BalStdWt', value: objSentWt.Bal_StdWt },
                            { str_colName: 'Periodic_BalNegTol', value: objSentWt.Bal_NegTol },
                            { str_colName: 'Periodic_BalPosTol', value: objSentWt.Bal_PosTol },
                            { str_colName: 'Periodic_ActualWt', value: recieveWt },
                            { str_colName: 'Periodic_StdWtBoxID', value: periodic_precalib_weights.CalibrationBox_ID },
                            { str_colName: 'Periodic_StdWt', value: periodic_precalib_weights.CalibrationBox_Selected_Elements },
                            { str_colName: 'Periodic_WtIdentification', value: '' },
                            { str_colName: 'Periodic_WeightBox_certfctNo', value: periodic_precalib_weights.CalibrationBox_Calibration_CertificateNo },
                            { str_colName: 'PercentofCapacity', value: 0 },
                            { str_colName: 'Decimal_Point', value: 0 },
                            { str_colName: 'Periodic_ValDate', value: periodic_precalib_weights.CalibrationBox_Validity_Date },
                        ]
                    }
                    await database.save(inserDetailObj);
                    var wt1 = str_Protocol.split(',')[1].trim().split(' ')[0];
                    objMonitor.monit({ case: 'CB', idsNo: IDSSrNo, data: { Weight: wt1 } });

                }


                if (objSentWt.Bal_NegTol <= parseFloat(recieveWt) && (parseFloat(recieveWt) <= objSentWt.Bal_PosTol)) {

                    if (parseInt(srNo) == objBalRelWt.calibWt.length) {
                        console.log('done');
                        // let balCalDetPeri = globalData.arrBalCaibDet.        find(k => k.strBalId == strBalId);
                        // balCalDetPeri.isPeriodicDone = true;
                        // Updating Periodic status from 0 -> 1 in calibration_status table as well as our global array
                        // which holding calibration status
                        // If this calibration is last calibration then we have to move all caibration records
                        // to complete tables
                        objFailedFlag.failFlagPeriodic = false;
                        var arr_sortedCalibArray = await sort.sortedSeqArray(globalData.arrSortedCalib, strBalId);
                        let lastCalibration = arr_sortedCalibArray[arr_sortedCalibArray.length - 1];

                        var calibType = 'P';
                        for (var i in globalData.calibrationStatus) {
                            if (globalData.calibrationStatus[i].BalId == strBalId) {
                                globalData.calibrationStatus[i].status[calibType] = 1;
                                break; //Stop this loop, we found it!
                            }
                        }
                        await comman.updateCalibStatus('P', strBalId, IDSSrNo)
                        await comman.incompleteToComplete('P', strBalId, IDSSrNo);
                        if (lastCalibration == 'P') {
                            await comman.UpdateRecalibFLagPeriodic(strBalId, IDSSrNo);
                            BalanceRecalibStatusObject.PeriodicBalRecalib = 0;
                        }
                        objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', '', 'completed')
                        result = await checkForPenCal.checkForPendingCalib(strBalId, IDSSrNo);
                        // activity Entry for Perioic Calibration Completion
                        const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IDSSrNo);
                        var objActivity = {}
                        // Object.assign(objActivity,
                        //     { strUserId: tempUserObject.UserId },
                        //     { strUserName: tempUserObject.UserName },
                        //     { activity: 'Perioic Calibration Completed on IDS' + IDSSrNo });

                        if (serverConfig.ProjectName == "RBH" || serverConfig.ProjectName == 'SunHalolGuj1') { // Set in serverconfig file
                            Object.assign(objActivity,
                                { strUserId: tempUserObject.UserId },
                                { strUserName: tempUserObject.UserName },
                                { activity: 'Linearity Calibration Completed on IDS' + IDSSrNo });
                        } else {
                            Object.assign(objActivity,
                                { strUserId: tempUserObject.UserId },
                                { strUserName: tempUserObject.UserName },
                                { activity: 'Perioic Calibration Completed on IDS' + IDSSrNo });
                        }




                        await objActivityLog.ActivityLogEntry(objActivity);

                        return result;

                    } else {

                        // if (srNotobepalced < 10) {
                        //     var protocolToBeSend = "CB0" + srNotobepalced + objBalRelWt.calibWt[parseInt(srNo)].Bal_StdWt + "g, " + recieveWt + ",Periodic Calib,";
                        // }
                        // else {
                        //     var protocolToBeSend = "CB" + srNotobepalced + objBalRelWt.calibWt[parseInt(srNo)].Bal_StdWt + "g, " + recieveWt + ",Periodic Calib,";
                        // }



                        if (serverConfig.ProjectName == "RBH" || serverConfig.ProjectName == 'SunHalolGuj1') { // Set in serverconfig file

                            if (srNotobepalced < 10) {
                                var protocolToBeSend = "CB0" + srNotobepalced +
                                    objFormulaFunction.FormatNumberString(objBalRelWt.calibWt[parseInt(srNo)].Bal_StdWt, balanceInfo.Bal_DP) + balanceInfo.Bal_Unit + ", " + recieveWt + ",Linearity Calib,";
                            }
                            else {
                                var protocolToBeSend = "CB" + srNotobepalced +
                                    objFormulaFunction.FormatNumberString(objBalRelWt.calibWt[parseInt(srNo)].Bal_StdWt, balanceInfo.Bal_DP) + balanceInfo.Bal_Unit + ", " + recieveWt + ",Linearity Calib,";
                            }
                        } else {

                            if (srNotobepalced < 10) {
                                var protocolToBeSend = "CB0" + srNotobepalced +
                                    objFormulaFunction.FormatNumberString(objBalRelWt.calibWt[parseInt(srNo)].Bal_StdWt, balanceInfo.Bal_DP) + balanceInfo.Bal_Unit + ", " + recieveWt + ",Periodic Calib,";
                            }
                            else {
                                var protocolToBeSend = "CB" + srNotobepalced +
                                    objFormulaFunction.FormatNumberString(objBalRelWt.calibWt[parseInt(srNo)].Bal_StdWt, balanceInfo.Bal_DP) + balanceInfo.Bal_Unit + ", " + recieveWt + ",Periodic Calib,";
                            }
                        }


                        return protocolToBeSend;
                    }

                } else {
                    // We have to move records to failed tables
                    const selectRepSrNoObj = {
                        str_tableName: 'tbl_calibration_periodic_master_incomplete',
                        data: 'Periodic_RepNo',
                        condition: [
                            { str_colName: 'Periodic_BalID', value: strBalId, comp: 'eq' },
                        ]
                    }
                    let result = await database.select(selectRepSrNoObj)
                    let int_periodic_RepNo
                    if (result[0].length == 0) {
                        int_periodic_RepNo = 1;
                    } else {
                        int_periodic_RepNo = result[0][0].Periodic_RepNo;
                        await comman.caibrationFails('P', strBalId, int_periodic_RepNo);
                    }
                    objFailedFlag.failFlagPeriodic = true;
                    await objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', '', 'completed');
                    return 'CF';

                }

            }
        }
        catch (err) {
            console.log("Error from verifyWeights of Periodic", err)
            return `Error from verifyWeights of Periodic  ${err}`;
        }

    }
}

module.exports = CalibrationModel;