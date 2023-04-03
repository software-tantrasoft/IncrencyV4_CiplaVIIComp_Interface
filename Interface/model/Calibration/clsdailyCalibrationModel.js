const serverConfig = require('../../global/severConfig');
const globalData = require('../../global/globalData');
const timeZone = require('../../middleware/setTimeZone');
const request = require('request');
var checkForPenCal = require('./checkForPendingCalib');
const date = require('date-and-time');
const clsQueryProcessor = require('../../database/clsQueryProcess');
const database = new clsQueryProcessor();
const clsActivityLog = require('../../model/clsActivityLogModel');
const objActivityLog = new clsActivityLog();
const ErrorLog = require('../../model/clsErrorLog');
var logFromPC = require('../clsLogger');
var clsMonitor = require('../MonitorSocket/clsMonitSocket');
const FetchDetail = require('../../model/clsFetchDetails');
const fetchDetails = new FetchDetail()
const InstrumentUsage = require('../clsInstrumentUsageLog');
const objInstrumentUsage = new InstrumentUsage();
const FormulaFunction = require('../Product/clsformulaFun');
const objFormulaFunction = new FormulaFunction();
const jsonTareCmd = require('../../global/tare.json');

const objMonitor = new clsMonitor();
// Creating object for Database Class
class CalibrationModel {
  // ***********************************************************************************************************//
  // Below function checks if daily calibration is pending or not                                               //
  //*********************************************************************************************************** */
  async checkDailyCalibrationPending(IDSSrNo) {
    try {

      let now = new Date();
      // fetching Current cubicle information
      const tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(IDSSrNo));
      var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == parseInt(IDSSrNo));
      if (objOwner.owner == 'analytical') {
        var strBalId = tempCubicInfo.Sys_BalID;
      } else {
        var strBalId = tempCubicInfo.Sys_BinBalID;
      }
      // checking if today is nocalibration remark in `tbl_calibration_daily_noremark`;
      var selectNoCalibRemark = {
        str_tableName: 'tbl_calibration_daily_noremark',
        data: '*',
        condition: [
          { str_colName: 'NDCR_BalanceID', value: strBalId, comp: 'eq' },
          { str_colName: 'NDCR_DT', value: date.format(now, 'YYYY-MM-DD'), comp: 'eq' }
        ]
      }
      var noCalibRemarkRes = await database.select(selectNoCalibRemark);
      if (noCalibRemarkRes[0].length == 0) {
        //SELECT * FROM `tbl_calibration_daily_master` WHERE `Daily_BalID`=? and `Daily_CalbDate`=?
        var selectObj = {
          str_tableName: "tbl_calibration_daily_master",
          data: "*",
          condition: [
            { str_colName: "Daily_BalID", value: strBalId, comp: "eq" },
            {
              str_colName: "Daily_CalbDate",
              value: date.format(now, "YYYY-MM-DD"),
              comp: "eq",
            },
          ],
        };
        var selectDailyRes = await database.select(selectObj);
        await fetchDetails.pushCalibrationObj(strBalId, IDSSrNo);
        var found = globalData.calibrationStatus.some(function (el) {
          return el.BalId == strBalId;
        });
        // var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , " + JSON.stringify(found + "In daily Calib");
        // logError = logError;
        // ErrorLog.error(logError);
        // Here we will check if today is periodic calibration or not if today is periodic
        // calibration then daily will be suspended
        var calibDId = "1";
        var calibPId = "2";
        if (objOwner.owner == "analytical") {
          var BalanceRecalibStatusObject = globalData.arrBalanceRecalibStatus.find(
            (k) => k.Bal_ID == strBalId
          );
          calibDId = "1";
          calibPId = "2";
        } else {
          var BalanceRecalibStatusObject = globalData.arrBalanceRecalibStatusBin.find(
            (k) => k.Bal_ID == strBalId
          );
          if (tempCubicInfo.Sys_Port3 == "IPC Balance") {
            calibDId = "4";
            calibPId = "5";
          }
        }
        /**
         * Here for SunPharma Halol we want to ask daily and periodic on same day thats why we are bypassing This
         * function `checkIfTodayIsPeriodicCalib`
         */
        var Response = await checkForPenCal.checkIfTodayIsPeriodicCalib(
          IDSSrNo
        );
        if (serverConfig.ProjectName == "SunHalolGuj1" || serverConfig.ProjectName == "MLVeer") {
          // setting false if today is periodic then ask daily first then periodic
          Response = false;
        }
        if (Response == true) {

          if (found) {
            var resultFound = await checkForPenCal.checkForPendingCalib(
              strBalId,
              IDSSrNo
            );
            return resultFound;
          } else {
            // Skipped normal routine 12-7
            return "CR0";
          }
        } else if (BalanceRecalibStatusObject.DailyBalRecalib == 1) {
          let TempCalibType = globalData.arrcalibType.find(
            (k) => k.idsNo == IDSSrNo
          );
          if (TempCalibType != undefined) {
            TempCalibType.calibType = "daily";
          } else {
            globalData.arrcalibType.push({
              idsNo: IDSSrNo,
              calibType: "daily",
            });
          }
          //return `CR${calibDId}0DAILY CALIB,PENDING FOR BALANCE,,,`;
          //return `CR${calibDId}0Daily Verification,Pending,,,`;
          //logFromPC.addtoProtocolLog('Calibration Cause:Recalibration')
          //if (serverConfig.ProjectName == 'MLVeer') {
          //  return `CR${calibDId}0Daily Verification,Pending,,,`;
          //}
          //else {
          return `CR${calibDId}1Daily Verification,Pending,,,`;
          //}
        } else if (BalanceRecalibStatusObject.PeriodicBalRecalib == 1) {
          let TempCalibType = globalData.arrcalibType.find(
            (k) => k.idsNo == IDSSrNo
          );
          if (TempCalibType != undefined) {
            TempCalibType.calibType = "periodic";
          } else {
            globalData.arrcalibType.push({
              idsNo: IDSSrNo,
              calibType: "periodic",
            });
          }
          await fetchDetails.pushCalibrationObj(strBalId, IDSSrNo);
          var resultFound = await checkForPenCal.checkForPendingCalib(
            strBalId,
            IDSSrNo
          );
          //logFromPC.addtoProtocolLog('Calibration Cause:Recalibration')
          return resultFound;
        } else {
          if (selectDailyRes[0].length !== 0) {
            // here we recieves Daily calibration record so we want to check for other pending calibration
            if (serverConfig.ProjectName == "SunHalolGuj1" || serverConfig.ProjectName == "MLVeer") {
              var RepFromPC;
              var Response = await checkForPenCal.checkIfTodayIsPeriodicCalib(
                IDSSrNo
              );
              if (Response) {

                var resultFound = await checkForPenCal.checkForPendingCalib(
                  strBalId,
                  IDSSrNo
                );
                RepFromPC = resultFound;


              } else {

                var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == IDSSrNo)
                if (objOwner.owner == 'IPC') {

                  var flagcheck = globalData.arrIPCPeriodicFlag.find(k => k.idsNo == IDSSrNo);

                  if (flagcheck == undefined) {
                    globalData.arrIPCPeriodicFlag.push({ idsNo: IDSSrNo, flag: true });
                  }
                  else {
                    flagcheck.flag = flagcheck.flag;
                  }

                  flagcheck = globalData.arrIPCPeriodicFlag.find(k => k.idsNo == IDSSrNo);

                  if (flagcheck.flag == true) {
                    RepFromPC = await fetchDetails.checkForPeriodicDue(
                      IDSSrNo
                    );
                    flagcheck.flag = false;
                  }
                  else {
                    flagcheck.flag = false;
                    return `CR0`;
                  }
                }
                else {
                  RepFromPC = await fetchDetails.checkForPeriodicDue(
                    IDSSrNo
                  );
                  //return `CR0`;
                }





              }
              return RepFromPC;
            } else if (BalanceRecalibStatusObject.DailyBalRecalib == 1) {
              let TempCalibType = globalData.arrcalibType.find(
                (k) => k.idsNo == IDSSrNo
              );
              if (TempCalibType != undefined) {
                TempCalibType.calibType = "daily";
              } else {
                globalData.arrcalibType.push({
                  idsNo: IDSSrNo,
                  calibType: "daily",
                });
              }
              //return `CR${calibDId}0DAILY CALIB,PENDING FOR BALANCE,,,`;
              //return `CR${calibDId}0Daily Verification,Pending,,,`;
              //logFromPC.addtoProtocolLog('Calibration Cause:Recalibration')
              //if (serverConfig.ProjectName == 'MLVeer') {
              // return `CR${calibDId}0Daily Verification,Pending,,,`;
              //} else {
              return `CR${calibDId}1Daily Verification,Pending,,,`;
              //}

            } else if (
              BalanceRecalibStatusObject.PeriodicBalRecalib == 1
            ) {
              let TempCalibType = globalData.arrcalibType.find(
                (k) => k.idsNo == IDSSrNo
              );
              if (TempCalibType != undefined) {
                TempCalibType.calibType = "periodic";
              } else {
                globalData.arrcalibType.push({
                  idsNo: IDSSrNo,
                  calibType: "periodic",
                });
              }
              await fetchDetails.pushCalibrationObj(strBalId, IDSSrNo);
              //resolve("CR20PERIODIC CALIB,PENDING FOR BALANCE,,,");
              //logFromPC.addtoProtocolLog('Calibration Cause:Recalibration')
              if (
                serverConfig.ProjectName == "RBH" ||
                serverConfig.ProjectName == "SunHalolGuj1"
              ) {
                // Set in serverconfig file
                //return `CR${calibPId}0LINEARITY CALIB,PENDING FOR BALANCE,,,`;
                //return `CR${calibPId}0Linearity,Calibration Pending,,,`;
                return `CR${calibPId}1Linearity,Calibration Pending,,,`;
              } else {
                //if (serverConfig.ProjectName == 'MLVeer') {
                //  return `CR${calibPId}0Periodic Calibration,Pending,,,`;
                //}
                //else {
                //return `CR${calibPId}0PERIODIC CALIB,PENDING FOR BALANCE,,,`;
                //return `CR${calibPId}0Periodic Calibration,Pending,,,`;
                return `CR${calibPId}1Periodic Calibration,Pending,,,`;
                //}

              }
            } else {
              return "CR0";
            }
          } else {
            // setting global variable to 'daily' in order to identify CP, CB coming for which CalibType
            let TempCalibType = globalData.arrcalibType.find(
              (k) => k.idsNo == IDSSrNo
            );
            if (TempCalibType != undefined) {
              TempCalibType.calibType = "daily";
            } else {
              globalData.arrcalibType.push({
                idsNo: IDSSrNo,
                calibType: "daily",
              });
            }
            /* Suppose if daily and periodic calibration is on the same date, so the scenario is when 
              periodic calibration done for today and on the next login on the same date it will ask daily
              because no records found in `dailyMaster` according to logic so we have to check for today if 
              Periodic done no need to ask daily calibration for today itself on next login
              */
            let tempCalib = globalData.arrBalCaibDet.find(
              (k) => k.strBalId == strBalId
            );
            if (tempCalib.isPeriodicDone == true) {
              return "CR0";
            } else {
              // Check for Daily Calibration
              // this is for getting the system time
              var systemDate = new Date();
              var systemHours = systemDate.getHours();
              if (systemHours >= 7) {
                //return `CR${calibDId}0DAILY CALIB,PENDING FOR BALANCE,,,`;
                //return `CR${calibDId}0Daily Verification,Pending,,,`;
                //logFromPC.addtoProtocolLog('Calibration Cause:Normal routine')
                //if (serverConfig.ProjectName == 'MLVeer') {
                //return `CR${calibDId}0Daily Verification,Pending,,,`;
                //}
                //else {
                return `CR${calibDId}1Daily Verification,Pending,,,`;
                //}
              } else {
                //ont take calibartions
                return `CR0`;
              }
              // resolve("CR10DAILY CALIB,PENDING FOR BALANCE,,,");
            }
          }
        }
      } else {
        return "CR0";
      }

    } catch (err) {
      var logError = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + " , ";
      logError = logError + err.stack;
      //commented by vivek on 31-07-2020*********************************** */
      //ErrorLog.error(logError);
      ErrorLog.addToErrorLog(logError);
      //******************************************************************* */
      console.log(err.stack)
      throw new Error(err);
    }
  }
  //********************************************************************************************************** */
  // This function called when We recives CP protocol also here we send first weight for calibration
  //********************************************************************************************************** */
  async getCalibWeights(str_Protocol, IDSSrNo) {
    try {
      // calculating balance Id assigned to that IDS
      const tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(IDSSrNo));
      var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == parseInt(IDSSrNo));
      console.log('from getCalibWeights balance owner:' + objOwner.owner)
      if (objOwner.owner == 'analytical') {
        var strBalId = tempCubicInfo.Sys_BalID;
      } else {
        var strBalId = tempCubicInfo.Sys_BinBalID;
      }
      // calculating below parametes as recieved from CP000
      var generalCare = str_Protocol.substring(2, 3);
      var zeroError = str_Protocol.substring(3, 4);
      var spiritLevel = str_Protocol.substring(4, 5);
      // If any parameter fails the caibration fails
      if (generalCare == '1' || zeroError == '1' || spiritLevel == '1') {
        return "CF";
      } else {
        // get all the balance details form 'tbl_balance' in global array :arrBalance
        var selectBalObj = {
          str_tableName: 'tbl_balance',
          data: '*',
          condition: [
            { str_colName: 'Bal_ID', value: strBalId, comp: 'eq' },
          ]
        }
        var result = await database.select(selectBalObj);
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
        //    console.log('bal', strBalId, tempCubicInfo)
        // Storing all the balance weight details for 'tbl_balance_weights' in global array
        var selectCalibWeights = {
          str_tableName: 'tbl_balance_weights',
          data: '*',
          condition: [
            { str_colName: 'Bal_ID', value: strBalId, comp: 'eq' },
            { str_colName: 'Bal_Daily', value: 1, comp: 'eq' }
          ]

        }


        if (serverConfig.ProjectName != 'SunHalolGuj1') {
          var order = {
            order: [
              { str_colName: 'Bal_StdWt', value: 'ASC' }
            ]
          }
          Object.assign(selectCalibWeights, order)
        }


        var result = await database.select(selectCalibWeights);
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
        // console.log(globalData.arrBalCalibWeights)
        // sending first weight for calibration
        // Instrument Usage log for balance start
        await objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', 'Daily Calibration', 'started');

        var strunit = tempBalace.balance_info[0].Bal_Unit.trim()
        return 'CB01' + objFormulaFunction.FormatNumberString(result[0][0].Bal_StdWt, tempBalace.balance_info[0].Bal_DP)
          + strunit + `, 0.000,Daily Calib,${TareCmd}`;


      }
    } catch (err) {
      console.log("Error from getCalibWeights of Daily", err)
      throw new Error(`Error from getCalibWeights of Daily ${err}`)
    }
  }
  //**************************************************************************************************************** */
  // Below function verifies recived weights is in range of tolerences and stores in database as in given situation
  // Also send next weights for calibrations
  // CB0120.00g, 20.01, Daily Calib,
  //**************************************************************************************************************** */

  async verifyWeights(str_Protocol, IDSSrNo) {
    try {
      let now = new Date();
      // calculating Balance Id related to that Ids
      const tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(IDSSrNo));
      var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == parseInt(IDSSrNo));
      var calibPId = '2';
      if (objOwner.owner == 'analytical') {
        var strBalId = tempCubicInfo.Sys_BalID;
        calibPId = '2';
      } else {
        var strBalId = tempCubicInfo.Sys_BinBalID;
        if (tempCubicInfo.Sys_Port3 == 'IPC Balance') {
          calibPId = '5';
        }
      }



      // calculating below parameted from string 
      var srNo = str_Protocol.split(',')[0].substring(3, 4); // CB0120.00g
      var sendWt = str_Protocol.split(',')[0].substring(4).slice(0, -1); //CB0120.00g
      var recieveWt = str_Protocol.split(',')[1].split(' ')[0]; //20.01
      // fetching calibration weights for that balance from global array with reference to Ids
      var objIdsrelWt = globalData.arrBalCalibWeights.find(k => k.idsNo == IDSSrNo);

      // calculating positive negative tolerence for the weight that we send 
      //commented by vivek on 28012020 as per new change*************************************************/ 
      //user can add balance haviing same weigths with different/same tollerence's
      //so we will fetch weight according to thier serial number 

      if (serverConfig.ProjectName == 'SunHalolGuj1') {
        let tempsrNo = 0;
        if (srNo == 1 || srNo == 2 || srNo == 3 || srNo == 4 || srNo == 5) {
          tempsrNo = 0;
        } else if (srNo == 6) {
          tempsrNo = 1;
        } else if (srNo == 7) {
          tempsrNo = 2;
        } else if (srNo == 8) {
          tempsrNo = 3;
        }
        var objSendWt = objIdsrelWt.calibWt[parseFloat(tempsrNo)]
      }
      else {
        var objSendWt = objIdsrelWt.calibWt[parseFloat(srNo) - 1]
      }
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
      var iteration = 0;
      if (serverConfig.ProjectName == 'SunHalolGuj1') {
        iteration = 8;
      } else {
        iteration = objIdsrelWt.calibWt.length;
      }
      if (parseInt(srNo) <= iteration) {
        var protocolToBeSend = "";
        // srNotobepalced is srNo for second weight
        var srNotobepalced = parseInt(srNo) + 1;
        var intDaily_RepNo;
        // fetching here all necessory information to send the next weight and storing incoming data
        // from protocol
        const tempBalObject = globalData.arrBalance.find(k => k.idsNo == IDSSrNo);
        const balanceInfo = tempBalObject.balance_info[0];
        const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IDSSrNo);
        var RepFromPC = "";
        if (objOwner.owner == 'analytical') {
          var BalanceRecalibStatusObject = globalData.arrBalanceRecalibStatus.find(k => k.Bal_ID == strBalId);
        } else {
          var BalanceRecalibStatusObject = globalData.arrBalanceRecalibStatusBin.find(k => k.Bal_ID == strBalId);
        }
        // console.log('balWtDetailObject', balWtDetailObject, balWtDetail, sendWt, sendWt.toString())
        // for the very first weight we insert data in incompte master and incomplete details table
        if (parseInt(srNo) == 1) {
          /** code for storing all the wgt in column of std wgt ,neg tol and pos tol */
          var combineStdWt = "";
          var combineLowerLimit = "";
          var combineUpperLimit = "";
          for (let i of objIdsrelWt.calibWt) {
            combineStdWt = combineStdWt + i.Bal_StdWt + ",";
            combineLowerLimit = combineLowerLimit + i.Bal_NegTol + ",";
            combineUpperLimit = combineUpperLimit + i.Bal_PosTol + ",";
          }
          combineStdWt = combineStdWt.slice(0, -1)
          combineLowerLimit = combineLowerLimit.slice(0, -1)
          combineUpperLimit = combineUpperLimit.slice(0, -1)

          // Inserting entries in master table for daily calibration
          // Object for inserting data for Incommplete master

          // Object for selecting data from precalib selected weights
          // for sun halol we want precalibration details in report
          if (serverConfig.ProjectName == 'SunHalolGuj1') {
            var Daily_AllWeightboxID = "";
            var Daily_AllWeightboxCert = "";
            var Daily_AllWeightboxValidUpto = "";
            const selectPrecalibSelWtObjForMaster = {
              str_tableName: 'tbl_precalibration_daily',
              data: '*',
              condition: [
                { str_colName: 'Equipment_ID', value: strBalId, comp: 'eq' },
                // { str_colName: 'Standard_Weight_Block', value: objSendWt.Bal_StdWt, comp: 'eq' },
                // { str_colName: 'Equipment_Type', value: 'Balance', comp: 'eq' }
              ]
            }
            var preRes = await database.select(selectPrecalibSelWtObjForMaster);
            for (let i of preRes[0]) {
              Daily_AllWeightboxID = Daily_AllWeightboxID + i.CalibrationBox_ID + ",";
              Daily_AllWeightboxCert = Daily_AllWeightboxCert + i.CalibrationBox_Calibration_CertificateNo + ",";
              Daily_AllWeightboxValidUpto = Daily_AllWeightboxValidUpto + i.CalibrationBox_Validity_Date + ","
            }
            Daily_AllWeightboxID = Daily_AllWeightboxID.slice(0, -1);
            Daily_AllWeightboxCert = Daily_AllWeightboxCert.slice(0, -1);
            Daily_AllWeightboxValidUpto = Daily_AllWeightboxValidUpto.slice(0, -1)
          }
          const insertObj = {
            str_tableName: 'tbl_calibration_daily_master_incomplete',
            data: [
              { str_colName: 'Daily_CalbDate', value: date.format(now, 'YYYY-MM-DD') },
              { str_colName: 'Daily_CalbTime', value: date.format(now, 'HH:mm:ss') },
              { str_colName: 'Daily_BalID', value: balanceInfo.Bal_ID },
              { str_colName: 'Daily_BalSrNo', value: balanceInfo.Bal_SrNo, },
              { str_colName: 'Daly_Make', value: balanceInfo.Bal_Make },
              { str_colName: 'Daily_Model', value: balanceInfo.Bal_Model },
              { str_colName: 'Daily_Unit', value: balanceInfo.Bal_Unit },
              { str_colName: 'Daily_Dept', value: tempCubicInfo.Sys_dept },
              { str_colName: 'Daily_LeastCnt', value: balanceInfo.Bal_LeastCnt },
              { str_colName: 'Daily_MaxCap', value: balanceInfo.Bal_MaxCap },
              { str_colName: 'Daily_MinCap', value: balanceInfo.Bal_MinCap },
              { str_colName: 'Daily_ZeroError', value: 0 },
              { str_colName: 'Daily_SpiritLevel', value: 0 },
              { str_colName: 'Daily_GeneralCare', value: 0 },
              { str_colName: 'Daily_UserID', value: tempUserObject.UserId },
              { str_colName: 'Daily_UserName', value: tempUserObject.UserName },
              { str_colName: 'Daily_PrintNo', value: 0 },
              { str_colName: 'Daily_IsRecalib', value: BalanceRecalibStatusObject.DailyBalRecalib },
              // { str_colName: 'Daily_Location', value: serverConfig.ProjectName == 'SunHalolGuj1' ? tempCubicInfo.Sys_Location : tempCubicInfo.Sys_dept },
              { str_colName: 'Daily_Location', value: serverConfig.ProjectName == 'SunHalolGuj1' ? tempCubicInfo.Sys_Location : tempCubicInfo.Sys_Area },//as discussed with pushkar
              { str_colName: 'Daily_CubicalNo', value: tempCubicInfo.Sys_CubicNo },
              { str_colName: 'Daily_Bal_MaxoptRange', value: balanceInfo.Bal_MaxoptRange },
              { str_colName: 'Daily_Bal_MinoptRange', value: balanceInfo.Bal_MinoptRange },
              { str_colName: 'Decimal_Point', value: balanceInfo.Bal_DP },
              { str_colName: 'Daily_RoomNo', value: balanceInfo.Bal_CalbDuration },
              { str_colName: 'Daily_StdWeight', value: combineStdWt },
              { str_colName: 'Daily_NegTol', value: combineLowerLimit },
              { str_colName: 'Daily_PosTol', value: combineUpperLimit },
              { str_colName: 'Daily_NextPeriodicDate', value: date.format(balanceInfo.Bal_CalbDueDt, 'YYYY-MM-DD') },
              { str_colName: 'Daily_IsBinBalance', value: balanceInfo.IsBinBalance }
            ]
          }
          if (serverConfig.ProjectName == 'SunHalolGuj1') {
            insertObj.data.push({ str_colName: 'Daily_AllWeightboxID', value: Daily_AllWeightboxID });
            insertObj.data.push({ str_colName: 'Daily_AllWeightboxCert', value: Daily_AllWeightboxCert });
            insertObj.data.push({ str_colName: 'Daily_AllWeightboxValidUpto', value: Daily_AllWeightboxValidUpto });
          }
          // Object for selecting data from precalib selected weights
          const selectPrecalibSelWtObj = {
            str_tableName: 'tbl_precalibration_daily',
            data: '*',
            condition: [
              { str_colName: 'Equipment_ID', value: strBalId, comp: 'eq' },
              { str_colName: 'Standard_Weight_Block', value: objSendWt.Bal_StdWt, comp: 'eq' },
              { str_colName: 'UID', value: objSendWt.Id, comp: 'eq' },
              // { str_colName: 'Equipment_Type', value: 'Balance', comp: 'eq' }
            ]
          }
          // Inserting data in databse 
          var result = await database.save(insertObj)
          // intDaily_RepNo is Last inserted Id
          intDaily_RepNo = result[0].insertId;
          // selecting data from precalibSelectedWeights
          var result1 = await database.select(selectPrecalibSelWtObj)
          const daily_precalib_weight = result1[0][0];
          // Object for inserting in incomplete detail
          const insertDetailObj = {
            str_tableName: 'tbl_calibration_daily_detail_incomplete',
            data: [
              { str_colName: 'Daily_RepNo', value: intDaily_RepNo },
              { str_colName: 'Daily_RecNo', value: 1 },
              { str_colName: `Daily_BalStdWt${srNo}`, value: objSendWt.Bal_StdWt },
              { str_colName: `Daily_BalNegTol${srNo}`, value: objSendWt.Bal_NegTol },
              { str_colName: `Daily_BalPosTol${srNo}`, value: objSendWt.Bal_PosTol },
              { str_colName: `Daily_ActualWt${srNo}`, value: recieveWt },
              { str_colName: `Daily_StdWtBoxID${srNo}`, value: daily_precalib_weight.CalibrationBox_ID },
              { str_colName: `Daily_StdWtIDNo${srNo}`, value: daily_precalib_weight.CalibrationBox_Elements_IDNo },
              { str_colName: `Daily_WeightBox_certfctNo${srNo}`, value: daily_precalib_weight.CalibrationBox_Calibration_CertificateNo },
              { str_colName: `Daily_ValDate${srNo}`, value: daily_precalib_weight.CalibrationBox_Validity_Date },
              { str_colName: `Daily_StdWt${srNo}`, value: daily_precalib_weight.CalibrationBox_Selected_Elements },
              { str_colName: `PercentofCapacity${srNo}`, value: 0 },
              { str_colName: `Decimal_Point`, value: 0 },
            ]
          }
          // inserting data in incomplete daily table
          var res = await database.save(insertDetailObj)
          var wt = str_Protocol.split(',')[1].trim().split(' ')[0];
          objMonitor.monit({ case: 'CB', idsNo: IDSSrNo, data: { Weight: wt } });

          var objActivity = {};
          objFailedFlag = globalData.arrFlagForFailCalib.find(k => k.idsNo == IDSSrNo);
          Object.assign(objActivity,
            { strUserId: tempUserObject.UserId },
            { strUserName: tempUserObject.UserName },
          );
          if (objFailedFlag.failFlagDaily == true) {
            Object.assign(objActivity,
              { activity: `Daily Calibration Started On IDS ${IDSSrNo} After Failure` }
            );
          }
          else {
            Object.assign(objActivity,
              { activity: 'Daily Calibration Started On IDS ' + IDSSrNo }
            );
          }

          await objActivityLog.ActivityLogEntry(objActivity);


        } else {
          var Daily_RecNo1;
          // Object for selecting RepSrNo from daily master
          const selectDaily_RepNoObj = {
            str_tableName: 'tbl_calibration_daily_master_incomplete',
            data: 'MAX(Daily_RepNo) AS Daily_RepNo',
            condition: [
              { str_colName: 'Daily_BalID', value: strBalId, comp: 'eq' },
            ]
          }
          var result = await database.select(selectDaily_RepNoObj)
          let intDaily_RepNo = result[0][0].Daily_RepNo;
          // Object for selecting Daily_RecNo from daily master
          const selectDaily_RecNoObj = {
            str_tableName: 'tbl_calibration_daily_detail_incomplete',
            data: 'MAX(Daily_RecNo) AS  Daily_RecNo',
            condition: [
              { str_colName: 'Daily_RepNo', value: intDaily_RepNo, comp: 'eq' },
            ]
          }
          var resultRecNo = await database.select(selectDaily_RecNoObj)
          const Daily_RecNo = resultRecNo[0][0].Daily_RecNo;
          Daily_RecNo1 = Daily_RecNo + 1;
          // Object for selecting Precalibration selected weights(daily)
          const selectPrecalibSelWtObj = {
            str_tableName: 'tbl_precalibration_daily',
            data: '*',
            condition: [
              { str_colName: 'Equipment_ID', value: strBalId, comp: 'eq' },
              { str_colName: 'Standard_Weight_Block', value: objSendWt.Bal_StdWt, comp: 'eq' },
              // { str_colName: 'Equipment_Type', value: 'Balance', comp: 'eq' }
            ]
          }
          var result = await database.select(selectPrecalibSelWtObj)
          const daily_precalib_weight = result[0][0];
          // Object for updating values in dailt incompleteTable
          const updateObj = {
            str_tableName: 'tbl_calibration_daily_detail_incomplete',
            data: [
              { str_colName: `Daily_BalStdWt${srNo}`, value: objSendWt.Bal_StdWt },
              { str_colName: `Daily_BalNegTol${srNo}`, value: objSendWt.Bal_NegTol },
              { str_colName: `Daily_BalPosTol${srNo}`, value: objSendWt.Bal_PosTol },
              { str_colName: `Daily_ActualWt${srNo}`, value: recieveWt },
              { str_colName: `Daily_StdWtBoxID${srNo}`, value: daily_precalib_weight.CalibrationBox_ID },
              { str_colName: `Daily_StdWtIDNo${srNo}`, value: daily_precalib_weight.CalibrationBox_Elements_IDNo },
              { str_colName: `Daily_StdWt${srNo}`, value: daily_precalib_weight.CalibrationBox_Selected_Elements },
              { str_colName: `Daily_WeightBox_certfctNo${srNo}`, value: daily_precalib_weight.CalibrationBox_Calibration_CertificateNo },
              { str_colName: `Daily_ValDate${srNo}`, value: daily_precalib_weight.CalibrationBox_Validity_Date },
              { str_colName: `PercentofCapacity${srNo}`, value: 0 },
            ],
            condition: [
              { str_colName: 'Daily_RepNo', value: intDaily_RepNo },
            ]
          }
          // console.log(updateObj)
          await database.update(updateObj)
          var wt1 = str_Protocol.split(',')[1].trim().split(' ')[0];
          objMonitor.monit({ case: 'CB', idsNo: IDSSrNo, data: { Weight: wt1 } });




        }
        // If the incoming weight is last weight we have move data from incomplete to complete tables
        if (parseInt(srNo) == iteration) {

          if (objSendWt.Bal_NegTol <= parseFloat(recieveWt) && (parseFloat(recieveWt) <= objSendWt.Bal_PosTol)) {
            objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', '', 'completed')
            console.log('done');
            await this.saveToCompleteTable(strBalId, IDSSrNo);


            await objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', '', 'completed');


            objFailedFlag.failFlagDaily = false;
            var found = globalData.calibrationStatus.some(function (el) {
              return el.BalId == strBalId;
            });
            BalanceRecalibStatusObject.DailyBalRecalib = 0;
            // if (found) {
            //     var result = await checkForPenCal.checkForPendingCalib(strBalId, IDSSrNo)
            //     if (result == "CR0") {

            //         if (BalanceRecalibStatusObject.PeriodicBalRecalib == 1) {
            //             let TempCalibType = globalData.arrcalibType.find(k => k.idsNo == IDSSrNo);
            //             if (TempCalibType != undefined) {
            //                 TempCalibType.calibType = 'periodic';
            //             } else {
            //                 globalData.arrcalibType.push({ idsNo: IDSSrNo, calibType: 'periodic' })
            //             }
            //             await fetchDetails.pushCalibrationObj(strBalId);
            //             RepFromPC = 'CR20PERIODIC CALIB,PENDING FOR BALANCE,,,'
            //             //resolve('CR20PERIODIC CALIB,PENDING FOR BALANCE,,,');
            //         }
            //     } else {
            //         RepFromPC = result;
            //     }


            //     //retunr (result)

            // } 
            //else {
            if (serverConfig.ProjectName == 'SunHalolGuj1' || serverConfig.ProjectName == "MLVeer") {
              var Response = await checkForPenCal.checkIfTodayIsPeriodicCalib(IDSSrNo);
              if (Response) {
                var resultFound = await checkForPenCal.checkForPendingCalib(strBalId, IDSSrNo);
                RepFromPC = resultFound;
              }
              else if (BalanceRecalibStatusObject.PeriodicBalRecalib == 1) {
                let TempCalibType = globalData.arrcalibType.find(k => k.idsNo == IDSSrNo);
                if (TempCalibType != undefined) {
                  TempCalibType.calibType = 'periodic';
                } else {
                  globalData.arrcalibType.push({ idsNo: IDSSrNo, calibType: 'periodic' })
                }
                await fetchDetails.pushCalibrationObj(strBalId, IDSSrNo);
                if (serverConfig.ProjectName == "RBH" || serverConfig.ProjectName == 'SunHalolGuj1') { // Set in serverconfig file
                  RepFromPC = `CR${calibPId}1Linearity,Calibration Pending,,,`;
                } else {
                  //if (serverConfig.ProjectName == 'MLVeer') {
                  // RepFromPC = `CR${calibPId}0Periodic Calibration,Pending,,,`;
                  //}
                  //else {
                  RepFromPC = `CR${calibPId}1Periodic Calibration,Pending,,,`;
                  //}

                }

              }
              else {
                RepFromPC = await fetchDetails.checkForPeriodicDue(IDSSrNo);
              }
            }
            else if (BalanceRecalibStatusObject.PeriodicBalRecalib == 1) {

              let TempCalibType = globalData.arrcalibType.find(k => k.idsNo == IDSSrNo);
              if (TempCalibType != undefined) {
                TempCalibType.calibType = 'periodic';
              } else {
                globalData.arrcalibType.push({ idsNo: IDSSrNo, calibType: 'periodic' })
              }
              await fetchDetails.pushCalibrationObj(strBalId, IDSSrNo);
              //RepFromPC = 'CR20PERIODIC CALIB,PENDING FOR BALANCE,,,'


              if (serverConfig.ProjectName == "RBH" || serverConfig.ProjectName == 'SunHalolGuj1') { // Set in serverconfig file
                // RepFromPC = `CR${calibPId}0LINEARITY CALIB,PENDING FOR BALANCE,,,`;
                //RepFromPC = `CR${calibPId}0Linearity,Calibration Pending,,,`;
                RepFromPC = `CR${calibPId}1Linearity,Calibration Pending,,,`;
              } else {
                //RepFromPC = `CR${calibPId}0PERIODIC CALIB,PENDING FOR BALANCE,,,`;
                //RepFromPC = `CR${calibPId}0Periodic Calibration,Pending,,,`;
                //if (serverConfig.ProjectName == 'MLVeer') {
                // RepFromPC = `CR${calibPId}0Periodic Calibration,Pending,,,`;
                //}
                //else {
                RepFromPC = `CR${calibPId}1Periodic Calibration,Pending,,,`;
                //}

              }

            } else {
              // RepFromPC = 'CR0'
              RepFromPC = await fetchDetails.checkForPeriodicDue(IDSSrNo);
            }
            //}
          }
          else {
            objFailedFlag.failFlagDaily = true;
            return 'CF';
          }
        } else {
          if (serverConfig.ProjectName == 'SunHalolGuj1') {
            if (srNo == 1 || srNo == 2 || srNo == 3 || srNo == 4) {
              srNo = 0;
            } else if (srNo == 5) {
              srNo = 1;
            } else if (srNo == 6) {
              srNo = 2;
            } else if (srNo == 7) {
              srNo = 3;
            }
          }
          // Sending next weighgt
          protocolToBeSend = "CB0" + srNotobepalced + objFormulaFunction.FormatNumberString(objIdsrelWt.calibWt[parseInt(srNo)].Bal_StdWt, balanceInfo.Bal_DP) + balanceInfo.Bal_Unit + ", " + recieveWt + ",Daily Calib,";
          //resolve(protocolToBeSend)
          RepFromPC = protocolToBeSend;
        }

        if (objSendWt.Bal_NegTol <= parseFloat(recieveWt) && (parseFloat(recieveWt) <= objSendWt.Bal_PosTol)) {
          return RepFromPC
        } else {
          objFailedFlag.failFlagDaily = true;
          await objInstrumentUsage.InstrumentUsage('Balance', IDSSrNo, 'tbl_instrumentlog_balance', '', 'completed');
          return 'CF';
        }

      }
    } catch (err) {
      console.log(err);
      throw new Error(err);
    }
  }
  // **************************************************************************************//
  // Asynchronous function for storing data from incomplete to complete daily tables and 
  // deleting entries from incomplete tables
  //************************************************************************************** */
  async saveToCompleteTable(strBalId, IDSSrNo) {
    try {
      let oldRepSrNo = await this.getRepSrNo(strBalId);
      await this.copyFromIncomleteToCompleteMaster(oldRepSrNo, IDSSrNo);
      await this.deleteEntriesFromIncomplete(oldRepSrNo);
      await this.UpdateRecalibFLagDaily(strBalId, IDSSrNo);
    } catch (err) {
      throw new Error(err);
    }
  }
  //*************************************************************************************** */
  // getting repSrNo for incomplete tables
  //************************************************************************************** */
  getRepSrNo(strBalId) {
    return new Promise((resolve, reject) => {
      var selectRepSrNoObj = {
        str_tableName: 'tbl_calibration_daily_master_incomplete',
        data: 'max(Daily_RepNo) as Daily_RepNo',
        condition: [
          { str_colName: 'Daily_BalID', value: strBalId, comp: 'eq' },
        ]
      }
      database.select(selectRepSrNoObj).then(result => {
        resolve(result[0][0].Daily_RepNo)
      })
    })
  }
  //****************************************************************************************** */
  // Copyind data from incomplte daily table to complete tables
  // Condition  - Column name of both column must be same
  //********************************************************************************************* */
  copyFromIncomleteToCompleteMaster(oldRepSrNo, IDSSrNo) {
    return new Promise((resolve, reject) => {
      const copyMasterObj = {
        fromCopyTblName: 'tbl_calibration_daily_master_incomplete',
        toCopyTableName: 'tbl_calibration_daily_master',
        data: [
          { str_colName: 'Daily_CalbDate' },
          { str_colName: 'Daily_CalbTime' },
          { str_colName: 'Daily_BalID' },
          { str_colName: 'Daily_BalSrNo' },
          { str_colName: 'Daly_Make' },
          { str_colName: 'Daily_Model' },
          { str_colName: 'Daily_Unit' },
          { str_colName: 'Daily_Dept' },
          { str_colName: 'Daily_LeastCnt' },
          { str_colName: 'Daily_MaxCap' },
          { str_colName: 'Daily_MinCap' },
          { str_colName: 'Daily_ZeroError' },
          { str_colName: 'Daily_SpiritLevel' },
          { str_colName: 'Daily_GeneralCare' },
          { str_colName: 'Daily_UserID' },
          { str_colName: 'Daily_UserName' },
          { str_colName: 'Daily_VerifyID' },
          { str_colName: 'Daily_VerifyName' },
          { str_colName: 'Daily_PrintNo' },
          { str_colName: 'Daily_Reason' },
          { str_colName: 'Daily_IsRecalib' },
          { str_colName: 'Daily_Location' },
          { str_colName: 'Daily_CubicalNo' },
          { str_colName: 'Daily_Bal_MaxoptRange' },
          { str_colName: 'Daily_Bal_MinoptRange' },
          { str_colName: 'Decimal_Point' },
          { str_colName: 'Daily_RoomNo' },
          { str_colName: 'Daily_StdWeight' },
          { str_colName: 'Daily_NegTol' },
          { str_colName: 'Daily_PosTol' },
          { str_colName: 'Daily_NextPeriodicDate' },
          { str_colName: 'Daily_IsBinBalance' },
        ],
        condition: [
          { str_colName: 'Daily_RepNo', value: oldRepSrNo }
        ]
      }
      // Sunhalol Softshell
      if (serverConfig.ProjectName == 'SunHalolGuj1') {
        copyMasterObj.data.push({ str_colName: 'Daily_AllWeightboxID' },
          { str_colName: 'Daily_AllWeightboxCert' },
          { str_colName: 'Daily_AllWeightboxValidUpto' })
      }
      const copyDetailObj = {
        fromCopyTblName: 'tbl_calibration_daily_detail_incomplete',
        toCopyTableName: 'tbl_calibration_daily_detail',
        data: [
          { str_colName: 'Daily_RecNo' }, { str_colName: 'Daily_BalStdWt1' },
          { str_colName: 'Daily_BalNegTol1' }, { str_colName: 'Daily_BalPosTol1' },
          { str_colName: 'Daily_ActualWt1' }, { str_colName: 'Daily_StdWtBoxID1' },
          { str_colName: 'Daily_StdWtIDNo1' }, { str_colName: 'Daily_WeightBox_certfctNo1' },
          { str_colName: 'Daily_ValDate1' }, { str_colName: 'Daily_StdWt1' },
          { str_colName: 'PercentofCapacity1' }, { str_colName: 'Daily_BalStdWt2' },
          { str_colName: 'Daily_BalNegTol2' }, { str_colName: 'Daily_BalPosTol2' },
          { str_colName: 'Daily_ActualWt2' }, { str_colName: 'Daily_StdWtBoxID2' },
          { str_colName: 'Daily_StdWtIDNo2' }, { str_colName: 'Daily_StdWt2' },
          { str_colName: 'Daily_WeightBox_certfctNo2' }, { str_colName: 'Daily_ValDate2' },
          { str_colName: 'PercentofCapacity2' }, { str_colName: 'Daily_BalStdWt3' },
          { str_colName: 'Daily_BalNegTol3' }, { str_colName: 'Daily_BalPosTol3' },
          { str_colName: 'Daily_ActualWt3' },
          { str_colName: 'Daily_StdWtBoxID3' }, { str_colName: 'Daily_StdWtIDNo3' },
          { str_colName: 'Daily_StdWt3' }, { str_colName: 'Daily_WeightBox_certfctNo3' },
          { str_colName: 'Daily_ValDate3' }, { str_colName: 'PercentofCapacity3' },
          { str_colName: 'Daily_BalStdWt4' }, { str_colName: 'Daily_BalNegTol4' },
          { str_colName: 'Daily_BalPosTol4' }, { str_colName: 'Daily_ActualWt4' },
          { str_colName: 'Daily_StdWtBoxID4' }, { str_colName: 'Daily_StdWtIDNo4' },
          { str_colName: 'Daily_StdWt4' }, { str_colName: 'PercentofCapacity4' },
          { str_colName: 'Daily_WeightBox_certfctNo4' }, { str_colName: 'Daily_ValDate4' },
          { str_colName: 'Decimal_Point' }

        ],
        condition: [
          { str_colName: 'Daily_RepNo', value: oldRepSrNo }
        ]
      }
      // if(serverConfig.ProjectName == 'SunHalolGuj1') {
      copyDetailObj.data.push({ str_colName: 'Daily_BalStdWt5' },
        { str_colName: 'Daily_BalNegTol5' }, { str_colName: 'Daily_BalPosTol5' },
        { str_colName: 'Daily_ActualWt5' }, { str_colName: 'Daily_StdWtBoxID5' },
        { str_colName: 'Daily_StdWtIDNo5' }, { str_colName: 'Daily_WeightBox_certfctNo5' },
        { str_colName: 'Daily_ValDate5' }, { str_colName: 'Daily_StdWt5' },
        { str_colName: 'PercentofCapacity5' }, { str_colName: 'Daily_BalStdWt6' },
        { str_colName: 'Daily_BalNegTol6' }, { str_colName: 'Daily_BalPosTol6' },
        { str_colName: 'Daily_ActualWt6' }, { str_colName: 'Daily_StdWtBoxID6' },
        { str_colName: 'Daily_StdWtIDNo6' }, { str_colName: 'Daily_WeightBox_certfctNo6' },
        { str_colName: 'Daily_ValDate6' }, { str_colName: 'Daily_StdWt6' },
        { str_colName: 'PercentofCapacity6' }, { str_colName: 'Daily_BalStdWt7' },
        { str_colName: 'Daily_BalNegTol7' }, { str_colName: 'Daily_BalPosTol7' },
        { str_colName: 'Daily_ActualWt7' }, { str_colName: 'Daily_StdWtBoxID7' },
        { str_colName: 'Daily_StdWtIDNo7' }, { str_colName: 'Daily_WeightBox_certfctNo7' },
        { str_colName: 'Daily_ValDate7' }, { str_colName: 'Daily_StdWt7' },
        { str_colName: 'PercentofCapacity7' }, { str_colName: 'Daily_BalStdWt8' },
        { str_colName: 'Daily_BalNegTol8' }, { str_colName: 'Daily_BalPosTol8' },
        { str_colName: 'Daily_ActualWt8' }, { str_colName: 'Daily_StdWtBoxID8' },
        { str_colName: 'Daily_StdWtIDNo8' }, { str_colName: 'Daily_WeightBox_certfctNo8' },
        { str_colName: 'Daily_ValDate8' }, { str_colName: 'Daily_StdWt8' },
        { str_colName: 'PercentofCapacity8' })
      // }
      database.copy(copyMasterObj).then(result => {
        database.copy(copyDetailObj).then(result1 => {
          const UpdateObj = {
            str_tableName: 'tbl_calibration_daily_detail',
            data: [
              { str_colName: 'Daily_RepNo', value: result[0].insertId }
            ],
            condition: [
              { str_colName: 'SeqNo', value: result1[0].insertId }
            ]
          }
          database.update(UpdateObj).then(result2 => {
            //Activity Log Entry on Completion of Daily Calibration
            const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IDSSrNo);
            const objActivity = {};
            Object.assign(objActivity,
              { strUserId: tempUserObject.UserId },
              { strUserName: tempUserObject.UserName },
              { activity: 'Daily Calibration Completed on IDS' + IDSSrNo });
            objActivityLog.ActivityLogEntry(objActivity).catch(error => { console.log(error); });

          }).catch(err => console.log(err));
          resolve('Copy Done');
          // console.log('Copy Done')
        }).catch(err => console.log(err));
      }).catch(err => console.log(err));
    })
  }
  //*************************************************************************************************** */
  // Below function deletes the data from incomplete tables (daily)
  //***************************************************************************************************** */
  deleteEntriesFromIncomplete(oldRepSrNo) {
    const deleteMasterObj = {
      str_tableName: 'tbl_calibration_daily_master_incomplete',
      condition: [
        { str_colName: 'Daily_RepNo', value: oldRepSrNo }
      ]
    }
    const deleteDetailObj = {
      str_tableName: 'tbl_calibration_daily_detail_incomplete',
      condition: [
        { str_colName: 'Daily_RepNo', value: oldRepSrNo }
      ]
    }
    // console.log('Delete Done')
    database.delete(deleteMasterObj).catch(err => console.log(err));
    database.delete(deleteDetailObj).catch(err => console.log(err));
  }
  //***************************************************************************************************8 */
  //Below function is to update the Recalibration flag of Daily
  //****************************************************************************************** */
  UpdateRecalibFLagDaily(strBalId, IDSSrNo) {
    var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == IDSSrNo);
    if (objOwner.owner == 'analytical') {
      var recalliTable = `tbl_recalibration_balance_status`;
    } else {
      var recalliTable = `tbl_recalibration_balance_status_bin`;
    }
    var selectBalIDObj = {
      str_tableName: recalliTable,
      data: [
        { str_colName: 'DailyBalRecalib', value: 0 },
        { str_colName: 'RecalibSetDt_daily', value: null },
      ],
      condition: [
        { str_colName: 'Bal_ID', value: strBalId, comp: 'eq' },
      ]
    }
    database.update(selectBalIDObj).catch(err => console.log(err));
  }

}

module.exports = CalibrationModel;