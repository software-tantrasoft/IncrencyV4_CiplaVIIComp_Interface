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

class LinearityModel {
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
            var bln_isPresent = await comman.checkIfRecordInIncomplete('L', strBalId);
            if (bln_isPresent) {
                const selectRepSrNoObj = {
                    str_tableName: 'tbl_calibration_linearity_master_incomplete',
                    data: 'Linear_RepNo',
                    condition: [
                        { str_colName: 'Linear_BalID', value: strBalId, comp: 'eq' },
                    ]
                }
                var result = await database.select(selectRepSrNoObj);
                let int_linear_RepNo = result[0][0].Linear_RepNo;
                await comman.caibrationFails('L', strBalId, int_linear_RepNo);

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
                var result = await database.select(selectBalInfoObj);
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
                else if (tempBalace.balance_info[0].includes('Sarto') || tempBalace.balance_info[0].includes('SARTO')) {
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
                        { str_colName: 'Bal_Linearity', value: 1, comp: 'eq' },
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
                var result = await database.select(selectBalWtDetObj);
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
                await objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', 'Linearity Calibration', 'started');
                return 'CB01' + objFormulaFunction.FormatNumberString(result[0][0].Bal_StdWt, tempBalace.balance_info[0].Bal_DP) + strUnit + `, 0.000,Linearity Calib,${TareCmd}`;

            }
        } catch (err) {
            console.log("Error from getCalibWeights of Linearity", err)
            return `Error from getCalibWeights of Linearity ${err}`;
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
            var srNo = str_Protocol.split(',')[0].substring(3, 4); // Weight Sr Number
            var sendWt = str_Protocol.split(',')[0].substring(4).slice(0, -1); // Weight send for calibration
            var recieveWt = str_Protocol.split(',')[1].split(' ')[0]; // recived weight after calibration
            // fetching calibration weights for that balance from global array with reference to Ids
            var objBalRelWt = globalData.arrBalCalibWeights.find(k => k.idsNo == IDSSrNo);
            // getting weight  for previously weight which we sent
            //commented by vivek on 28012020 as per new change*************************************************/ 
            //user can add balance haviing same weigths with different/same tollerence's
            //so we will fetch weight according to thier serial number 
            // const objSentWt = objBalRelWt.calibWt.find(j => j.Bal_StdWt == parseFloat(sendWt));
            const objSentWt = objBalRelWt.calibWt[parseFloat(srNo) - 1]
            //************************************************************************************************ */


            // console.log(objSentWt)
            if (parseInt(srNo) <= objBalRelWt.calibWt.length) {
                if (objSentWt.Bal_NegTol <= parseFloat(recieveWt) && (parseFloat(recieveWt) <= objSentWt.Bal_PosTol)) {
                    var srNotobepalced = parseInt(srNo) + 1;
                    var int_RepSrNo;

                    const tempBalObject = globalData.arrBalance.find(k => k.idsNo == IDSSrNo);
                    // getting only balanceInfo
                    const balanceInfo = tempBalObject.balance_info[0];
                    // getting userIfo logged in for that cubicle
                    const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IDSSrNo);
                    // getting reCaibration status from `tbl_recalibration_balance_status` 
                    if (objOwner.owner == 'analytical') {
                        var BalanceRecalibStatusObject = globalData.arrBalanceRecalibStatus.find(k => k.Bal_ID == strBalId);
                    } else {
                        var BalanceRecalibStatusObject = globalData.arrBalanceRecalibStatusBin.find(k => k.Bal_ID == strBalId);
                    }
                    //
                    if (parseInt(srNo) == 1) {
                        // Inserting entries in master table for daily calibration
                        // Object for inserting data for Incommplete master
                        var RepNo = await obj_getRepSrNo.getReportSerialNumber('L', strBalId, IDSSrNo);
                        const insertObj = {
                            str_tableName: 'tbl_calibration_linearity_master_incomplete',
                            data: [
                                { str_colName: 'Linear_RepNo', value: RepNo },
                                { str_colName: 'Linear_CalbDate', value: date.format(now, 'YYYY-MM-DD') },
                                { str_colName: 'Linear_CalbTime', value: date.format(now, 'HH:mm:ss') },
                                { str_colName: 'Linear_BalID', value: balanceInfo.Bal_ID, },
                                { str_colName: 'Linear_BalSrNo', value: balanceInfo.Bal_SrNo },
                                { str_colName: 'Linear_Make', value: balanceInfo.Bal_Make },
                                { str_colName: 'Linear_Model', value: balanceInfo.Bal_Model },
                                { str_colName: 'Linear_Unit', value: balanceInfo.Bal_Unit },
                                { str_colName: 'Linear_Dept', value: balanceInfo.Bal_Dept },
                                { str_colName: 'Linear_LeastCnt', value: balanceInfo.Bal_LeastCnt },
                                { str_colName: 'Linear_MaxCap', value: balanceInfo.Bal_MaxCap },
                                { str_colName: 'Linear_MinCap', value: balanceInfo.Bal_MinCap },
                                { str_colName: 'Linear_ZeroError', value: 0 },
                                { str_colName: 'Linear_SpritLevel', value: 0 },
                                { str_colName: 'Linear_GerneralCare', value: 0 },
                                { str_colName: 'Linear_UserID', value: tempUserObject.UserId },
                                { str_colName: 'Linear_UserName', value: tempUserObject.UserName },
                                { str_colName: 'Linear_PrintNo', value: 0 },
                                { str_colName: 'Linear_IsRecalib', value: BalanceRecalibStatusObject.LinearityBalRecalib },
                                { str_colName: 'Linear_Location', value: tempCubicInfo.Sys_Location },
                                { str_colName: 'Linear_RoomNo', value: tempCubicInfo.Sys_RoomNo },
                                { str_colName: 'Decimal_Point', value: 0 },
                                { str_colName: 'Linear_IsBinBalance', value: balanceInfo.IsBinBalance },
                            ]
                        }
                        await database.save(insertObj)
                        // Selecting Preclalibration weight from tbl_calibration_periodic_detail_incomplete
                        const selectPreCalibLinearWtObj = {
                            str_tableName: 'tbl_precalibration_linearity',
                            data: '*',
                            condition: [
                                { str_colName: 'Equipment_ID', value: strBalId, comp: 'eq' },
                                { str_colName: 'Standard_Weight_Block', value: objSentWt.Bal_StdWt, comp: 'eq' },
                                // { str_colName: 'Equipment_Type', value: 'Balance', comp: 'eq' },
                            ]
                        }
                        var result = await database.select(selectPreCalibLinearWtObj);
                        const linearity_precalib_weights = result[0][0];
                        const insertIncompleteLinearityDetailsObj = {
                            str_tableName: 'tbl_calibration_linearity_detail_incomplete',
                            data: [
                                { str_colName: 'Linear_RecNo', value: 1 },
                                { str_colName: 'Linear_RepNo', value: RepNo },
                                { str_colName: 'Linear_BalStdWt', value: objSentWt.Bal_StdWt },
                                { str_colName: 'Linear_BalNegTol', value: objSentWt.Bal_NegTol },
                                { str_colName: 'Linear_BalPosTol', value: objSentWt.Bal_PosTol },
                                { str_colName: 'Linear_ActualWt', value: recieveWt },
                                { str_colName: 'Linear_StdWtBoxID', value: linearity_precalib_weights.CalibrationBox_ID },
                                { str_colName: 'Linear_StdWt', value: linearity_precalib_weights.CalibrationBox_Selected_Elements },
                                { str_colName: 'Linear_WtIdentification', value: '' },
                                { str_colName: 'Linear_WeightBox_certfctNo', value: linearity_precalib_weights.CalibrationBox_Calibration_CertificateNo },
                                { str_colName: 'PercentofCapacity', value: 0 },
                                { str_colName: 'Linear_ValDate', value: linearity_precalib_weights.CalibrationBox_Validity_Date },
                            ]
                        }
                        await database.save(insertIncompleteLinearityDetailsObj);
                        var wt = str_Protocol.split(',')[1].trim().split(' ')[0];
                        objMonitor.monit({ case: 'CB', idsNo: IDSSrNo, data: { Weight: wt } });
                        // Updating RepSrNo if this calibration is first
                        // activity Entry for Linearity Calibration Start
                        const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IDSSrNo);
                        var objActivity = {}
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Linearity Calibration Started on IDS' + IDSSrNo });
                        await objActivityLog.ActivityLogEntry(objActivity);;

                        /*
                           */
                        var sortedArray = await sort.sortedSeqArray(globalData.arrSortedCalib, strBalId);
                        if (sortedArray[0] == 'L') {
                            await comman.updateRepSrNo('linearity', strBalId, IDSSrNo);
                        }
                    } else {
                        var int_Linearity_RecNo1;
                        // Selecting data from tbl_calibration_linearity_master_incomplete based on 'strBalId'
                        const selectRepSrNoObj = {
                            str_tableName: 'tbl_calibration_linearity_master_incomplete',
                            data: 'Linear_RepNo',
                            condition: [
                                { str_colName: 'Linear_BalID', value: strBalId, comp: 'eq' },
                            ]
                        }
                        var result = await database.select(selectRepSrNoObj);
                        let int_linear_RepNo = result[0][0].Linear_RepNo;
                        // Selecting Periodic_RecNo from tbl_calibration_linearity_detail_incomplete based on 'int_linear_RepNo'
                        const selectRecNoObj = {
                            str_tableName: 'tbl_calibration_linearity_detail_incomplete',
                            data: 'MAX(Linear_RecNo) AS Linear_RecNo',
                            condition: [
                                { str_colName: 'Linear_RepNo', value: int_linear_RepNo, comp: 'eq' },
                            ]
                        }
                        var resultRecNo = await database.select(selectRecNoObj)
                        const linear_RecNo = resultRecNo[0][0].Linear_RecNo;
                        int_Linearity_RecNo1 = linear_RecNo + 1;

                        // Selecting selectpreCalibWtObj from tbl_precalibration_linearity based on 'strBalId' and
                        // First weight was sent
                        const selectPreCalibLinearWtObj = {
                            str_tableName: 'tbl_precalibration_linearity',
                            data: '*',
                            condition: [
                                { str_colName: 'Equipment_ID', value: strBalId, comp: 'eq' },
                                { str_colName: 'Standard_Weight_Block', value: objSentWt.Bal_StdWt, comp: 'eq' },
                                // { str_colName: 'Equipment_Type', value: 'Balance', comp: 'eq' },
                            ]
                        }

                        var result = await database.select(selectPreCalibLinearWtObj);
                        const linearity_precalib_weights = result[0][0];
                        // console.log('linearity_precalib_weights', linearity_precalib_weights)
                        // Inserting data in tbl_calibration_linearity_detail_incomplete
                        const inserDetailObj = {
                            str_tableName: 'tbl_calibration_linearity_detail_incomplete',
                            data: [
                                { str_colName: 'Linear_RecNo', value: int_linear_RepNo },
                                { str_colName: 'Linear_RepNo', value: int_Linearity_RecNo1 },
                                { str_colName: 'Linear_BalStdWt', value: objSentWt.Bal_StdWt },
                                { str_colName: 'Linear_BalNegTol', value: objSentWt.Bal_NegTol },
                                { str_colName: 'Linear_BalPosTol', value: objSentWt.Bal_PosTol },
                                { str_colName: 'Linear_ActualWt', value: recieveWt },
                                { str_colName: 'Linear_StdWtBoxID', value: linearity_precalib_weights.CalibrationBox_ID },
                                { str_colName: 'Linear_StdWt', value: linearity_precalib_weights.CalibrationBox_Selected_Elements },
                                { str_colName: 'Linear_WtIdentification', value: '' },
                                { str_colName: 'Linear_WeightBox_certfctNo', value: linearity_precalib_weights.CalibrationBox_Calibration_CertificateNo },
                                { str_colName: 'PercentofCapacity', value: 0 },
                                { str_colName: 'Linear_ValDate', value: linearity_precalib_weights.CalibrationBox_Validity_Date },
                            ]
                        }
                        await database.save(inserDetailObj);
                        var wt = str_Protocol.split(',')[1].trim().split(' ')[0];
                        objMonitor.monit({ case: 'CB', idsNo: IDSSrNo, data: { Weight: wt } });
                        // if (parseInt(srNo) == objBalRelWt.calibWt.length) {
                        //     // If this calibration is last calibration then we have to move all caibration records
                        //     // to complete tables
                        //     await comman.incompleteToComplete('L', strBalId);
                        //     await objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', '', 'completed')
                        // }
                    }
                    // console.log('lenght', objBalRelWt.calibWt.length);
                    if (parseInt(srNo) == objBalRelWt.calibWt.length) {
                        console.log('done');
                        // Updating Linearity status from 0 -> 1 in calibration_status table as well as our global array
                        // which holding calibration status
                        await comman.updateCalibStatus('L', strBalId, IDSSrNo);
                        var calibType = 'L';
                        for (var i in globalData.calibrationStatus) {
                            if (globalData.calibrationStatus[i].BalId == strBalId) {
                                globalData.calibrationStatus[i].status[calibType] = 1;
                                break; //Stop this loop, we found it!
                            }
                        }
                        var result = await checkForPenCal.checkForPendingCalib(strBalId, IDSSrNo);

                        var arr_sortedCalibArray = await sort.sortedSeqArray(globalData.arrSortedCalib, strBalId);
                        let lastCalibration = arr_sortedCalibArray[arr_sortedCalibArray.length - 1];

                        await comman.incompleteToComplete('L', strBalId, IDSSrNo);
                        if (lastCalibration == 'L') {
                            await comman.UpdateRecalibFLagPeriodic(strBalId, IDSSrNo);
                            BalanceRecalibStatusObject.PeriodicBalRecalib = 0;
                        }
                        await objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', '', 'completed')
                        // activity Entry for Linearity Calibration Completion
                        const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IDSSrNo);
                        var objActivity = {}
                        Object.assign(objActivity,
                            { strUserId: tempUserObject.UserId },
                            { strUserName: tempUserObject.UserName },
                            { activity: 'Linearity Calibration Completed on IDS' + IDSSrNo });
                        await objActivityLog.ActivityLogEntry(objActivity);
                        return result;
                    } else {
                        var protocolToBeSend = "CB0" + srNotobepalced +
                            await objFormulaFunction.FormatNumberString(objBalRelWt.calibWt[parseInt(srNo)].Bal_StdWt, balanceInfo.Bal_DP) + balanceInfo.Bal_Unit + ", " + recieveWt + ",Linearity Calib,";
                        return protocolToBeSend;
                    }
                } else {
                    // We have to move records to failed tables
                    const selectRepSrNoObj = {
                        str_tableName: 'tbl_calibration_linearity_master_incomplete',
                        data: 'Linear_RepNo',
                        condition: [
                            { str_colName: 'Linear_BalID', value: strBalId, comp: 'eq' },
                        ]
                    }
                    var result = await database.select(selectRepSrNoObj);
                    let int_linear_RepNo = result[0][0].Linear_RepNo;
                    await comman.caibrationFails('L', strBalId, int_linear_RepNo);
                    return 'CF';

                }
            }
        } catch (err) {
            console.log("Error from verifyWeights of Linearity", err)
            return `Error from verifyWeights of Linearity  ${err}`;
        }
    }
}
module.exports = LinearityModel;