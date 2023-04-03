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
            var strVerId = tempCubicInfo.Sys_VernierID;
            // calculating below parametes as recieved from CP000
            var generalCare = str_Protocol.substring(2, 3);
            var zeroError = str_Protocol.substring(3, 4);
            var spiritLevel = str_Protocol.substring(4, 5);
            // If any parameter fails the caibration fails
            if (generalCare == '1' || zeroError == '1' || spiritLevel == '1') {
                return "CF";
            } else {
                // Storing all the balance details for 'tbl_balance' in global array
                const selectVerInfoObj = {
                    str_tableName: 'tbl_vernier',
                    data: '*',
                    condition: [
                        { str_colName: 'VernierID', value: strVerId, comp: 'eq' },
                    ]
                }
                var result = await database.select(selectVerInfoObj)
                globalData.arrVernier.push({
                    idsNo: IDSSrNo,
                    vernier_info: result[0]
                });

                var tempVernier = globalData.arrVernier.find(k => k.idsNo == IDSSrNo);
                var TareCmd = "";
                // Storing all the balance weight details for 'tbl_balance_weights' in global array
                const selectVerWtDetObj = {
                    str_tableName: 'tbl_vernier_blocks',
                    data: '*',
                    condition: [
                        { str_colName: 'ver_ID', value: strVerId, comp: 'eq' },
                        { str_colName: 'Ver_blnPeriodic', value: 1, comp: 'eq' },
                    ]

                }
                if(serverConfig.ProjectName != 'SunHalolGuj1') {
                    var order = { order: [
                       { str_colName: 'Ver_StdBlock', value: 'ASC' }
                     ]}
                     Object.assign(selectVerWtDetObj,order)
                   }
                var result = await database.select(selectVerWtDetObj)
                var arrTmpCalibWts = globalData.arrVerCalibWeights.find(k => k.idsNo == IDSSrNo);
                if(arrTmpCalibWts == undefined){
                   globalData.arrVerCalibWeights.push({idsNo: IDSSrNo,calibWt: result[0]});
                } else {
                  arrTmpCalibWts.calibWt = result[0]
                }
                // Instrument Usage log for balance start
                var strunit = tempVernier.vernier_info[0].RangeUnit
               await objInstrumentUsage.InstrumentUsage('Vernier', IDSSrNo, 'tbl_instrumentlog_vernier', 'Vernier Calibration', 'started');
               return 'CB01' + objFormulaFunction.FormatNumberString(result[0][0].Ver_StdBlock,tempVernier.vernier_info[0].ver_DP) + strunit +`, 0.000,Vernier Calib,`;
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
            var strVerId = tempCubicInfo.Sys_VernierID;
            // calculating below parameted from string 
            var srNo = str_Protocol.split(',')[0].substring(2, 4); // Weight Sr Number
            var sendWt = str_Protocol.split(',')[0].substring(4).slice(0, -1); // Weight send for calibration
            var recieveWt = str_Protocol.split(',')[1].split(' ')[0]; // recived weight after calibration
            // fetching calibration weights for that balance from global array with reference to Ids
            var objVerRelWt = globalData.arrVerCalibWeights.find(k => k.idsNo == IDSSrNo);
            // getting weight  for previously weight which we sent
            const objSentWt = objVerRelWt.calibWt.find(j => j.Ver_StdBlock == parseFloat(sendWt));
            // console.log(objSentWt)

            // var objFailedFlag = globalData.arrFlagForFailCalib.find(k => k.idsNo == IDSSrNo);
            // if (objFailedFlag == undefined) {
            //     globalData.arrFlagForFailCalib.push({
            //         idsNo: IDSSrNo,
            //         failFlagDaily: false,
            //         failFlagPeriodic: false
            //     });
            //     objFailedFlag = globalData.arrFlagForFailCalib.find(k => k.idsNo == IDSSrNo);
            // }


            if (parseInt(srNo) <= objVerRelWt.calibWt.length) {

                var srNotobepalced = parseInt(srNo) + 1;
                var int_RepSrNo;

                const tempVerObject = globalData.arrVernier.find(k => k.idsNo == IDSSrNo);
                // getting only balanceInfo
                const VernierInfo = tempVerObject.vernier_info[0];
                // getting userIfo logged in for that cubicle

                var ResponseFrmPC = ""
                // getting reCaibration status from `tbl_recalibration_balance_status` on start up
         
                var VernierRecalibStatusObject = globalData.arrVernierRecalibration.find(k => k.Ver_ID == strVerId);
                
                const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IDSSrNo);
                if (parseInt(srNo) == 1) {


                    /** code for storing all the wgt in column of std wgt ,neg tol and pos tol */
                    var combineStdWt = "";
                    var combineLowerLimit = "";
                    var combineUpperLimit = "";
                    for (let i of objVerRelWt.calibWt) {
                        combineStdWt = combineStdWt + i.Ver_StdBlock + ",";
                        combineLowerLimit = combineLowerLimit + i.Ver_NegTol + ",";
                        combineUpperLimit = combineUpperLimit + i.Ver_PosTol + ",";
                    }
                    combineStdWt = combineStdWt.slice(0, -1)
                    combineLowerLimit = combineLowerLimit.slice(0, -1)
                    combineUpperLimit = combineUpperLimit.slice(0, -1)
                    // Inserting entries in master table for daily/Periodic calibration
                    // Object for inserting data for Incommplete master
                       // for sun halol we want precalibration details in report
               //    if(serverConfig.ProjectName == 'SunHalolGuj1') {
               //      var Periodic_AllWeightboxID = "";
               //     var Periodic_AllWeightboxCert = "";
               //     var Periodic_AllWeightboxValidUpto = "";
               //      const selectPrecalibSelWtObjForMaster = {
               //       str_tableName: 'tbl_precalibration_periodic',
               //       data: '*',
               //       condition: [
               //           { str_colName: 'Equipment_ID', value: strVerId, comp: 'eq' },
               //           // { str_colName: 'Standard_Weight_Block', value: objSendWt.Bal_StdWt, comp: 'eq' },
               //           // { str_colName: 'Equipment_Type', value: 'Balance', comp: 'eq' }
               //       ]
               //   }
               //    var preRes =  await database.select(selectPrecalibSelWtObjForMaster);
               //    for (let i of preRes[0]) {
               //      Periodic_AllWeightboxID = Periodic_AllWeightboxID + i.CalibrationBox_ID + ",";
               //      Periodic_AllWeightboxCert = Periodic_AllWeightboxCert + i.CalibrationBox_Calibration_CertificateNo + ",";
               //      Periodic_AllWeightboxValidUpto = Periodic_AllWeightboxValidUpto + i.CalibrationBox_Validity_Date + ","
               //    }
               //    Periodic_AllWeightboxID = Periodic_AllWeightboxID.slice(0, -1);
               //    Periodic_AllWeightboxCert = Periodic_AllWeightboxCert.slice(0, -1);
               //    Periodic_AllWeightboxValidUpto = Periodic_AllWeightboxValidUpto.slice(0, -1)
               //   }
                    //var RepNo = await obj_getRepSrNo.getReportSerialNumber('P', strBalId, IDSSrNo);
                    const insertObj = {
                        str_tableName: 'tbl_calibration_periodic_master_vernier_incomplete',
                        data: [
                          //  { str_colName: 'Periodic_RepNo', value: RepNo },
                            { str_colName: 'Periodic_CalbDate', value: date.format(now, 'YYYY-MM-DD') },
                            { str_colName: 'Periodic_CalbTime', value: date.format(now, 'HH:mm:ss') },
                            { str_colName: 'Periodic_VerID', value: VernierInfo.VernierID, },
                            { str_colName: 'Periodic_VerSrNo', value: VernierInfo.VernierNo },
                            { str_colName: 'Periodic_Make', value: VernierInfo.Make },
                            { str_colName: 'Periodic_Model', value: VernierInfo.Model },
                            { str_colName: 'Periodic_Unit', value: VernierInfo.RangeUnit },
                            { str_colName: 'Periodic_Dept', value: tempCubicInfo.Sys_dept },
                            { str_colName: 'Periodic_LeastCnt', value: VernierInfo.leastCount },
                            { str_colName: 'Periodic_MaxCap', value: VernierInfo.RangeMinVal },
                            { str_colName: 'Periodic_MinCap', value: VernierInfo.RangeMaxVal },
                            { str_colName: 'Periodic_UserID', value: tempUserObject.UserId },
                            { str_colName: 'Periodic_UserName', value: tempUserObject.UserName },
                            { str_colName: 'Periodic_PrintNo', value: 0 },
                            { str_colName: 'Periodic_IsRecalib', value: VernierRecalibStatusObject.PeriodicVerRecalib },
                            { str_colName: 'Periodic_Location', value: serverConfig.ProjectName == 'SunHalolGuj1' ? tempCubicInfo.Sys_Location : tempCubicInfo.Sys_Area },
                            { str_colName: 'Periodic_CubicalNo', value: tempCubicInfo.Sys_CubicNo },
                            { str_colName: 'Periodic_RoomNo', value: 0 },
                            { str_colName: 'Periodic_DueDate', value:  VernierInfo.CalDueDT},
                            { str_colName: 'Decimal_Point', value: VernierInfo.ver_DP },
                            { str_colName: 'Periodic_StdBlock', value: combineStdWt },
                            { str_colName: 'Periodic_NegTol', value: combineLowerLimit },
                            { str_colName: 'Periodic_PosTol', value: combineUpperLimit },
                        ]
                    }
                    var objMasterEntry = await database.save(insertObj)
                    var lastInsertedId = objMasterEntry[0].insertId;
                    // Selecting Preclalibration weight from tbl_calibration_periodic_detail_incomplete
                    const selectPreCalibperiodicWtObj = {
                        str_tableName: 'tbl_precalibration_periodic',
                        data: '*',
                        condition: [
                            { str_colName: 'Equipment_ID', value: strVerId, comp: 'eq' },
                            { str_colName: 'Standard_Weight_Block', value: objSentWt.Ver_StdBlock, comp: 'eq' },
                             { str_colName: 'Equipment_Type', value: 'Vernier', comp: 'eq' },
                        ]
                    }
                    var result = await database.select(selectPreCalibperiodicWtObj);
                   
                    // Inserting 1st weight data in  tbl_calibration_periodic_detail_incomplete
                    const periodic_precalib_weights = result[0][0];
                    const insertIncompletePeriodicDetailsObj = {
                        str_tableName: 'tbl_calibration_periodic_detail_vernier_incomplete',
                        data: [
                            { str_colName: 'Periodic_RepNo', value: lastInsertedId },
                            { str_colName: 'Periodic_RecNo', value: 1 },
                            { str_colName: 'Periodic_StdBlock', value: objSentWt.Ver_StdBlock },
                            { str_colName: 'Periodic_NegTol', value: objSentWt.Ver_NegTol },
                            { str_colName: 'Periodic_PosTol', value: objSentWt.Ver_PosTol },
                            { str_colName: 'Periodic_ActualWt', value: recieveWt },
                            { str_colName: 'Periodic_BlockboxID', value: periodic_precalib_weights.CalibrationBox_ID },
                            { str_colName: 'Periodic_Block', value: periodic_precalib_weights.CalibrationBox_Selected_Elements },
                            { str_colName: 'Periodic_BlockIdentification', value: '' },
                            { str_colName: 'Periodic_BlockboxCert', value: periodic_precalib_weights.CalibrationBox_Calibration_CertificateNo },
                            { str_colName: 'PercentofCapacity', value: 0 },
                            { str_colName: 'Decimal_Point', value: 0 },
                            { str_colName: 'Periodic_BlockboxValidUpto', value: periodic_precalib_weights.CalibrationBox_Validity_Date },
                        ]
                    }
                    var objDetailSave = await database.save(insertIncompletePeriodicDetailsObj);

                    // activity Entry for Perioic Calibration start

                    var objActivity = {}
                    Object.assign(objActivity,
                        { strUserId: tempUserObject.UserId },
                        { strUserName: tempUserObject.UserName }
                    );
                        var CalibName = "Periodic";
                        Object.assign(objActivity,
                            { activity: `${CalibName} Calibration Started on IDS` + IDSSrNo }
                        );
                    

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
                        str_tableName: 'tbl_calibration_periodic_master_vernier_incomplete',
                        data: 'MAX(Periodic_RepNo) AS Periodic_RepNo',
                        condition: [
                            { str_colName: 'Periodic_VerID', value: strVerId, comp: 'eq' },
                        ]
                    }
                    var result = await database.select(selectRepSrNoObj);
                    var int_periodic_RepNo = result[0][0].Periodic_RepNo;
                    // Selecting Periodic_RecNo from tbl_calibration_periodic_detail_incomplete based on 'int_periodic_RepNo'
                    const selectRecNoObj = {
                        str_tableName: 'tbl_calibration_periodic_detail_vernier_incomplete',
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
                            { str_colName: 'Equipment_ID', value: strVerId, comp: 'eq' },
                            { str_colName: 'Standard_Weight_Block', value: objSentWt.Ver_StdBlock, comp: 'eq' },
                             { str_colName: 'Equipment_Type', value: 'Vernier', comp: 'eq' },
                        ]
                    }

                    result = await database.select(selectPreCalibperiodicWtObj)
                    const periodic_precalib_weights = result[0][0];
                    // Inserting data in tbl_calibration_periodic_detail_incomplete
                    const inserDetailObj = {
                        str_tableName: 'tbl_calibration_periodic_detail_vernier_incomplete',
                        data: [
                            { str_colName: 'Periodic_RepNo', value: int_periodic_RepNo },
                            { str_colName: 'Periodic_RecNo', value: int_periodic_RecNo1 },
                            { str_colName: 'Periodic_StdBlock', value: objSentWt.Ver_StdBlock },
                            { str_colName: 'Periodic_NegTol', value: objSentWt.Ver_NegTol },
                            { str_colName: 'Periodic_PosTol', value: objSentWt.Ver_PosTol },
                            { str_colName: 'Periodic_ActualWt', value: recieveWt },
                            { str_colName: 'Periodic_BlockboxID', value: periodic_precalib_weights.CalibrationBox_ID },
                            { str_colName: 'Periodic_Block', value: periodic_precalib_weights.CalibrationBox_Selected_Elements },
                            { str_colName: 'Periodic_BlockIdentification', value: '' },
                            { str_colName: 'Periodic_BlockboxCert', value: periodic_precalib_weights.CalibrationBox_Calibration_CertificateNo },
                            { str_colName: 'PercentofCapacity', value: 0 },
                            { str_colName: 'Decimal_Point', value: 0 },
                            { str_colName: 'Periodic_BlockboxValidUpto', value: periodic_precalib_weights.CalibrationBox_Validity_Date },
                        ]
                    }
                    await database.save(inserDetailObj);
                    var wt1 = str_Protocol.split(',')[1].trim().split(' ')[0];
                    objMonitor.monit({ case: 'CB', idsNo: IDSSrNo, data: { Weight: wt1 } });

                }


                if (objSentWt.Ver_NegTol <= parseFloat(recieveWt) && (parseFloat(recieveWt) <= objSentWt.Ver_PosTol)) {
                   
                    if (parseInt(srNo) == objVerRelWt.calibWt.length) {
                        console.log('done');
                        // let balCalDetPeri = globalData.arrBalCaibDet.find(k => k.strBalId == strBalId);
                        // balCalDetPeri.isPeriodicDone = true;
                        // Updating Periodic status from 0 -> 1 in calibration_status table as well as our global array
                        // which holding calibration status
                         // If this calibration is last calibration then we have to move all caibration records
                        // to complete tables
                        // objFailedFlag.failFlagPeriodic = false;
                        // var arr_sortedCalibArray = await sort.sortedSeqArray(globalData.arrSortedCalib, strBalId);
                        // let lastCalibration = arr_sortedCalibArray[arr_sortedCalibArray.length - 1];
                       
                        // var calibType = 'P';
                        // for (var i in globalData.calibrationStatus) {
                        //     if (globalData.calibrationStatus[i].BalId == strBalId) {
                        //         globalData.calibrationStatus[i].status[calibType] = 1;
                        //         break; //Stop this loop, we found it!
                        //     }
                        // }
                        // await comman.updateCalibStatus('P', strBalId,IDSSrNo)
                          await comman.incompleteToCompleteVernier('P', strVerId,IDSSrNo,int_periodic_RepNo);
                        // if (lastCalibration == 'P') {
                        //     await comman.UpdateRecalibFLagPeriodic(strBalId,IDSSrNo);
                        //     BalanceRecalibStatusObject.PeriodicBalRecalib = 0;
                        // }
                        objInstrumentUsage.InstrumentUsage('Vernier', IDSSrNo, 'tbl_instrumentlog_vernier', '', 'completed')
                        // result = await checkForPenCal.checkForPendingCalib(strBalId, IDSSrNo);
                        // activity Entry for Perioic Calibration Completion
                        const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IDSSrNo);
                        var objActivity = {}
                            Object.assign(objActivity,
                                { strUserId: tempUserObject.UserId },
                                { strUserName: tempUserObject.UserName },
                                { activity: 'Vernier Calibration Completed on IDS' + IDSSrNo });
                        await objActivityLog.ActivityLogEntry(objActivity);
                        return 'CR0';

                    } else {

                        // if (srNotobepalced < 10) {
                        //     var protocolToBeSend = "CB0" + srNotobepalced + objBalRelWt.calibWt[parseInt(srNo)].Bal_StdWt + "g, " + recieveWt + ",Periodic Calib,";
                        // }
                        // else {
                        //     var protocolToBeSend = "CB" + srNotobepalced + objBalRelWt.calibWt[parseInt(srNo)].Bal_StdWt + "g, " + recieveWt + ",Periodic Calib,";
                        // }

                            if (srNotobepalced < 10) {
                                var protocolToBeSend = "CB0" + srNotobepalced +
                                objFormulaFunction.FormatNumberString(objVerRelWt.calibWt[parseInt(srNo)].Ver_StdBlock, VernierInfo.ver_DP) + VernierInfo.RangeUnit + ", " + recieveWt + ",Vernier Calib,";
                            }
                            else {
                                var protocolToBeSend = "CB" + srNotobepalced +
                                objFormulaFunction.FormatNumberString(objVerRelWt.calibWt[parseInt(srNo)].Ver_StdBlock,VernierInfo.ver_DP) + VernierInfo.RangeUnit +", " + recieveWt + ",Vernier Calib,";
                            }
                       


                        return protocolToBeSend;
                    }

                } else {
                    return 'CF';
                }

            }
        }
        catch (err) {
            console.log("Error from verifyWeights vernier of Periodic", err)
            return `Error from verifyWeights of Periodic  ${err}`;
        }

    }
}

module.exports = CalibrationModel;