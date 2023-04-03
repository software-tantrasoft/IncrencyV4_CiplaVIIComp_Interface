const globalData = require("../../global/globalData");
const FormulaFun = require("./clsformulaFun");
const Database = require("../../database/clsQueryProcess");
const clsActivityLog = require("../../model/clsActivityLogModel");
const tcpConnector = require("../../tcp/tcpConnection.model");
const objTcpConnector = new tcpConnector();
const database = new Database();
const formulaFun = new FormulaFun();
const objActivityLog = new clsActivityLog();
var IBulkInvalid = require("../../../Interfaces/IBulkInvalid.model");
var clsMonitor = require("../MonitorSocket/clsMonitSocket");
const clsRemarkInComplete = require("../clsRemarkIncomplete");
const FetchDetails = require("../clsFetchDetails");
const serverConfig = require("../../global/severConfig");
const CompCoatLOD = require("../BulkWeighments/clsCompCoatLOD");
const objCompCoatLOD = new CompCoatLOD();
const fetchDetails = new FetchDetails();
const objRemarkInComplete = new clsRemarkInComplete();
const objMonitor = new clsMonitor();
const PowerBackup = require("../clsPowerBackupModel");
const clspowerbackup = new PowerBackup();
const config = require("../../global/severConfig");
const developerPanel = require("../../global/projectConfig");

class MenuSelect {
  // *********************************************************************************************************/
  //                       Below function is for handeling Menu selection
  //********************************************************************************************************* */
  async processMS(IdsNo, strProtocol) {
    try {
      if (strProtocol.substring(2, 3) != "G") {
        // MSG
        var selectedIds;
        // here we are selecting IDS functionality for that cubicle
        const IPQCObject = globalData.arr_IPQCRelIds.find(
          (k) => k.idsNo == IdsNo
        );
        if (IPQCObject != undefined) {
          selectedIds = IPQCObject.selectedIds;
        } else {
          selectedIds = IdsNo; // for compression and coating
        }

        let timeOutPeriod = (
          "0000" +
          globalData.arrsAllParameters[0].tbl_config_TimeoutPeriod * 60
        ).slice(-4);
        // console.log(globalData.arr_limits)
        // check which cubicle we are selected like it may be comprestion, coating or IPQC
        const tempArrCubicleTypeObject = globalData.arrCubicleType.find(
          (k) => k.idsNo == IdsNo
        );
        // const cubicType = tempArrCubicleTypeObject.cubicType;
        // const cubicArea = tempArrCubicleTypeObject.cubicArea;
        // Finding here which type product has 1 OR 2
        var productTypeObj = globalData.arrProductTypeArray.find(
          (k) => k.idsNo == IdsNo
        );

        var tempLimitObj = globalData.arr_limits.find((k) => k.idsNo == IdsNo); // limits Object
        var MenuType = strProtocol.substring(2, 3); // eg, 1,2,3,4,5,6,7,K,L,H,T
        var tempCubicleObject = globalData.arrIdsInfo.find(
          (k) => k.Sys_IDSNo == parseInt(selectedIds)
        ); // selected Cubicle Info
        var currentCubicObject = globalData.arrIdsInfo.find(
          (k) => k.Sys_IDSNo == parseInt(IdsNo)
        );
        var side = tempCubicleObject.Sys_RotaryType;
        if (side == "Single" || side == "NA") {
          side = "N";
        } else if (side == "Double") {
          side = "L";
        }
        var cno = tempCubicleObject.Sys_CubicNo; // Cubicle number
        // finding Out how many sample required from 'tbl_cubicle_product_sample' table
        var slectProductSamples = {
          str_tableName: "tbl_cubicle_product_sample",
          data: "*",
          condition: [{ str_colName: "Sys_CubicNo", value: cno, comp: "eq" }],
        };
        let result = await database.select(slectProductSamples);
        var strReturnProtocol;
        if (MenuType == "H") {
          // Bulk Data
          // First we have to check IDS type like 101,102,103,104
          if (
            currentCubicObject.Sys_PortNo == 103 ||
            currentCubicObject.Sys_PortNo == 104
          ) {
            // check for port 4
            var portInstrument = currentCubicObject.Sys_Port4.toUpperCase();
            if (portInstrument == "DISINTEGRATION TESTER") {
              objMonitor.monit({
                case: "MS",
                idsNo: IdsNo,
                data: { menu: "DT" },
              });
              let DTModel = await this.CheckDTModel(IdsNo);
              if (tempCubicleObject.Sys_RotaryType == "Single") {
                if (
                  !developerPanel.showJARMSG ||
                  config.ProjectName == "CIPLA_KurkumbhU1" ||
                  config.ProjectName == "CIPLA_Baddi" ||
                  (config.ProjectName == "CIPLA_INDORE" &&
                    config.CompanyName == "Cipla 7")
                ) {
                  var protocolToBeSend = await this.processBulkData(
                    portInstrument,
                    tempLimitObj,
                    result,
                    side,
                    MenuType,
                    tempCubicleObject,
                    IdsNo
                  );
                  await this.activityLogEntryForMs("DT", IdsNo);
                  return protocolToBeSend;
                } else {
                  let protocol = this.ShowJarMsg(DTModel, "H");
                  return protocol;
                }
              } else if (tempCubicleObject.Sys_RotaryType == "Double") {
                var strRecieveBulProtocol = await this.processBulkData(
                  portInstrument,
                  tempLimitObj,
                  result,
                  side,
                  MenuType,
                  tempCubicleObject,
                  IdsNo
                );
                await this.activityLogEntryForMs("DT", IdsNo);
                return strRecieveBulProtocol;
              }
            } else {
              var strRecieveBulProtocol = await this.processBulkData(
                portInstrument,
                tempLimitObj,
                result,
                side,
                MenuType,
                tempCubicleObject,
                IdsNo
              );
              await this.activityLogEntryForMs(portInstrument, IdsNo);
              return strRecieveBulProtocol;
            }
          } else if (
            currentCubicObject.Sys_PortNo == 101 ||
            currentCubicObject.Sys_PortNo == 102
          ) {
            // check for port 1
            var portInstrument = currentCubicObject.Sys_Port1.toUpperCase();
            if (portInstrument == "DISINTEGRATION TESTER") {
              objMonitor.monit({
                case: "MS",
                idsNo: IdsNo,
                data: { menu: "DT" },
              });
              let DTModel = await this.CheckDTModel(IdsNo);
              if (tempCubicleObject.Sys_RotaryType == "Single") {
                if (
                  !developerPanel.showJARMSG ||
                  config.ProjectName == "CIPLA_KurkumbhU1" ||
                  (config.ProjectName == "CIPLA_INDORE" &&
                    config.CompanyName == "Cipla 7")
                ) {
                  var protocolToBeSend = await this.processBulkData(
                    portInstrument,
                    tempLimitObj,
                    result,
                    side,
                    MenuType,
                    tempCubicleObject,
                    IdsNo
                  );
                  await this.activityLogEntryForMs(portInstrument, IdsNo);
                  return protocolToBeSend;
                } else {
                  let protocol = this.ShowJarMsg(DTModel, "H");
                  return protocol;
                }
              } else if (tempCubicleObject.Sys_RotaryType == "Double") {
                var strRecieveBulProtocol = await this.processBulkData(
                  portInstrument,
                  tempLimitObj,
                  result,
                  side,
                  MenuType,
                  tempCubicleObject,
                  IdsNo
                );
                await this.activityLogEntryForMs(portInstrument, IdsNo);
                return strRecieveBulProtocol;
              }
            } else {
              var strRecieveBulProtocol = await this.processBulkData(
                portInstrument,
                tempLimitObj,
                result,
                side,
                MenuType,
                tempCubicleObject,
                IdsNo
              );
              await this.activityLogEntryForMs(portInstrument, IdsNo);
              return strRecieveBulProtocol;
            }
          }
        } else if (MenuType == "E") {
          // Bulk Data
          // First we have to check IDS type like 101,102,103,104
          if (
            currentCubicObject.Sys_PortNo == 103 ||
            currentCubicObject.Sys_PortNo == 104
          ) {
            // check for port 4
            var portInstrument = currentCubicObject.Sys_Port2.toUpperCase();
            if (portInstrument == "DISINTEGRATION TESTER") {
              objMonitor.monit({
                case: "MS",
                idsNo: IdsNo,
                data: { menu: "DT" },
              });
              let DTModel = await this.CheckDTModel(IdsNo);
              if (tempCubicleObject.Sys_RotaryType == "Single") {
                if (
                  !developerPanel.showJARMSG ||
                  config.ProjectName == "CIPLA_KurkumbhU1" ||
                  (config.ProjectName == "CIPLA_INDORE" &&
                    config.CompanyName == "Cipla 7")
                ) {
                  var protocolToBeSend = await this.processBulkData(
                    portInstrument,
                    tempLimitObj,
                    result,
                    side,
                    MenuType,
                    tempCubicleObject,
                    IdsNo
                  );
                  await this.activityLogEntryForMs(portInstrument, IdsNo);
                  return protocolToBeSend;
                } else {
                  let protocol = this.ShowJarMsg(DTModel, "E");
                  return protocol;
                }
              } else if (tempCubicleObject.Sys_RotaryType == "Double") {
                var strRecieveBulProtocol = await this.processBulkData(
                  portInstrument,
                  tempLimitObj,
                  result,
                  side,
                  MenuType,
                  tempCubicleObject,
                  IdsNo
                );
                await this.activityLogEntryForMs("DT", IdsNo);
                return strRecieveBulProtocol;
              }
            } else {
              var strRecieveBulProtocol = await this.processBulkData(
                portInstrument,
                tempLimitObj,
                result,
                side,
                MenuType,
                tempCubicleObject,
                IdsNo
              );
              await this.activityLogEntryForMs(portInstrument, IdsNo);
              return strRecieveBulProtocol;
            }
          }
        } else if (MenuType == "T") {
          // Bulk Data
          if (
            currentCubicObject.Sys_PortNo == 103 ||
            currentCubicObject.Sys_PortNo == 104
          ) {
            // check for port 3
            var portInstrument = currentCubicObject.Sys_Port3.toUpperCase();
            if (portInstrument == "DISINTEGRATION TESTER") {
              objMonitor.monit({
                case: "MS",
                idsNo: IdsNo,
                data: { menu: "DT" },
              });
              let DTModel = await this.CheckDTModel(IdsNo);
              if (tempCubicleObject.Sys_RotaryType == "Single") {
                if (
                  !developerPanel.showJARMSG ||
                  config.ProjectName == "CIPLA_KurkumbhU1" ||
                  (config.ProjectName == "CIPLA_INDORE" &&
                    config.CompanyName == "Cipla 7")
                ) {
                  var protocolToBeSend = await this.processBulkData(
                    portInstrument,
                    tempLimitObj,
                    result,
                    side,
                    MenuType,
                    tempCubicleObject,
                    IdsNo
                  );
                  await this.activityLogEntryForMs(portInstrument, IdsNo);
                  return protocolToBeSend;
                } else {
                  let protocol = this.ShowJarMsg(DTModel, "T");
                  return protocol;
                }
              } else if (tempCubicleObject.Sys_RotaryType == "Double") {
                var strRecieveBulProtocol = await this.processBulkData(
                  portInstrument,
                  tempLimitObj,
                  result,
                  side,
                  MenuType,
                  tempCubicleObject,
                  IdsNo
                );
                await this.activityLogEntryForMs(portInstrument, IdsNo);
                return strRecieveBulProtocol;
              }
            } else {
              var strRecieveBulProtocol = await this.processBulkData(
                portInstrument,
                tempLimitObj,
                result,
                side,
                MenuType,
                tempCubicleObject,
                IdsNo
              );
              await this.activityLogEntryForMs(portInstrument, IdsNo);
              return strRecieveBulProtocol;
            }
          } else if (
            currentCubicObject.Sys_PortNo == 101 ||
            currentCubicObject.Sys_PortNo == 102
          ) {
            // check for port 2
            var portInstrument = currentCubicObject.Sys_Port2.toUpperCase();
            if (portInstrument == "DISINTEGRATION TESTER") {
              objMonitor.monit({
                case: "MS",
                idsNo: IdsNo,
                data: { menu: "DT" },
              });
              let DTModel = await this.CheckDTModel(IdsNo);
              if (tempCubicleObject.Sys_RotaryType == "Single") {
                if (
                  !developerPanel.showJARMSG ||
                  config.ProjectName == "CIPLA_KurkumbhU1" ||
                  (config.ProjectName == "CIPLA_INDORE" &&
                    config.CompanyName == "Cipla 7")
                ) {
                  var protocolToBeSend = await this.processBulkData(
                    portInstrument,
                    tempLimitObj,
                    result,
                    side,
                    MenuType,
                    tempCubicleObject,
                    IdsNo
                  );
                  await this.activityLogEntryForMs(portInstrument, IdsNo);

                  return protocolToBeSend;
                } else {
                  let protocol = this.ShowJarMsg(DTModel, "T");
                  return protocol;
                }
              } else if (tempCubicleObject.Sys_RotaryType == "Double") {
                var strRecieveBulProtocol = await this.processBulkData(
                  portInstrument,
                  tempLimitObj,
                  result,
                  side,
                  MenuType,
                  tempCubicleObject,
                  IdsNo
                );
                await this.activityLogEntryForMs(portInstrument, IdsNo);
                return strRecieveBulProtocol;
              }
            } else {
              var strRecieveBulProtocol = await this.processBulkData(
                portInstrument,
                tempLimitObj,
                result,
                side,
                MenuType,
                tempCubicleObject,
                IdsNo
              );
              await this.activityLogEntryForMs(portInstrument, IdsNo);
              return strRecieveBulProtocol;
            }
          }
        } else if (MenuType == "D") {
          if (
            tempCubicleObject.Sys_Area == "Softshell" &&
            productTypeObj.productType == 4 &&
            serverConfig.ProjectName == "SunHalolGuj1"
          ) {
            objMonitor.monit({
              case: "MS",
              idsNo: IdsNo,
              data: { menu: "Differential" },
            });
            var menuObj = globalData.arr_menuList.find(
              (k) => k.MenuName == "Differential"
            );
            //as per discuss with pushkar rode on 05022021 net limit should be display as actual limit i.e. T2UPPER,T2LOWER
            var digit = parseInt(serverConfig.calculationDigit);
            var upperLimitNet = formulaFun.FormatNumber(
              tempLimitObj.Differential.T2Pos,
              digit
            );
            var lowerLimitNet = formulaFun.FormatNumber(
              tempLimitObj.Differential.T2Neg,
              digit
            );
            // var upperLimitNet = formulaFun.upperLimit(tempLimitObj.Differential);
            // var lowerLimitNet = formulaFun.lowerLimit(tempLimitObj.Differential);
            //********************************************************************* */
            // var upperLimitNet = formulaFun.upperLimit(tempLimitObj.Net);
            // var lowerLimitNet = formulaFun.lowerLimit(tempLimitObj.Net);
            // var upperLimit = formulaFun.upperLimit(tempLimitObj.Individual);
            // var lowerLimit = formulaFun.lowerLimit(tempLimitObj.Individual);
            // var noOfsamples = tempLimitObj.Individual.noOfSamples;
            var noOfsamples = tempLimitObj.Differential.noOfSamples;
            noOfsamples = ("00" + noOfsamples).slice(-3);
            // this.CheckPendingSideWeighment()
            //***************commented and added by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
            //strReturnProtocol = `MSD${menuObj.InstruId}${side}DIFFER,0,000,${upperLimitNet},${lowerLimitNet},0,000,${noOfsamples},${timeOutPeriod},0`;
            //strReturnProtocol = `MSD${menuObj.InstruId}${side}DIFFER,0,000,${upperLimitNet},${lowerLimitNet},0,000,${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Differential.unit},`;
            strReturnProtocol = `MSD${menuObj.InstruId}${side}DIFFER,0,000,${upperLimitNet},${lowerLimitNet},0,000,${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Differential.unit},`;
            //************************************************************************* *****************************************************/
          } else if (
            serverConfig.ProjectName == "CIPLA_INDORE" ||
            serverConfig.ProjectName == "CIPLA_KurkumbhU1" ||
            serverConfig.ProjectName == "CIPLA_Baddi"
          ) {
            //added by vivek on 24-03-2020
            objMonitor.monit({
              case: "MS",
              idsNo: IdsNo,
              data: { menu: "Differential" },
            });
            var menuObj = globalData.arr_menuList.find(
              (k) => k.MenuName == "Differential"
            );

            //var upperLimitEmpty = formulaFun.upperLimit(tempLimitObj.Differential);
            //var lowerLimitEmpty = formulaFun.lowerLimit(tempLimitObj.Differential);
            var upperLimitNet = formulaFun.upperLimit(tempLimitObj.Net);
            var lowerLimitNet = formulaFun.lowerLimit(tempLimitObj.Net);
            var upperLimit = formulaFun.upperLimit(tempLimitObj.Individual);
            var lowerLimit = formulaFun.lowerLimit(tempLimitObj.Individual);
            var noOfsamples = tempLimitObj.Individual.noOfSamples;

            noOfsamples = ("00" + noOfsamples).slice(-3);
            //***************commented and added by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
            //strReturnProtocol = `MSD${menuObj.InstruId}${side}DIFFER,999,0.014,${upperLimitNet},${lowerLimitNet},${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0`;
            if (serverConfig.ProjectName == "MLVeer") {
              var side = "";
              side = await this.CheckPendingSideWeighment(tempCubicleObject);
              strReturnProtocol = `MSD${menuObj.InstruId}${side}DIFFER,999,0.014,${upperLimitNet},${lowerLimitNet},${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Individual.unit},`;
            } else {
              strReturnProtocol = `MSD${menuObj.InstruId}${side}DIFFER,999,0.014,${upperLimitNet},${lowerLimitNet},${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Individual.unit},`;
            }

            noOfsamples = ("00" + noOfsamples).slice(-3);
            //***************commented and added by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
            //strReturnProtocol = `MSD${menuObj.InstruId}${side}DIFFER,999,0.014,${upperLimitNet},${lowerLimitNet},${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0`;
            if (serverConfig.ProjectName == "MLVeer") {
              var side = "";
              side = await this.CheckPendingSideWeighment(tempCubicleObject);
              strReturnProtocol = `MSD${menuObj.InstruId}${side}DIFFER,999,0.014,${upperLimitNet},${lowerLimitNet},${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Individual.unit},`;
            } else {
              strReturnProtocol = `MSD${menuObj.InstruId}${side}DIFFER,999,0.014,${upperLimitNet},${lowerLimitNet},${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Individual.unit},`;
            }

            //************************************************************************* *****************************************************/
          } else {
            objMonitor.monit({
              case: "MS",
              idsNo: IdsNo,
              data: { menu: "Differential" },
            });
            var menuObj = globalData.arr_menuList.find(
              (k) => k.MenuName == "Differential"
            );
            var upperLimitEmpty = formulaFun.upperLimit(
              tempLimitObj.Differential
            );
            var lowerLimitEmpty = formulaFun.lowerLimit(
              tempLimitObj.Differential
            );
            var upperLimitNet = formulaFun.upperLimit(tempLimitObj.Net);
            var lowerLimitNet = formulaFun.lowerLimit(tempLimitObj.Net);
            var upperLimit = formulaFun.upperLimit(tempLimitObj.Individual);
            var lowerLimit = formulaFun.lowerLimit(tempLimitObj.Individual);
            var noOfsamples = tempLimitObj.Individual.noOfSamples;
            noOfsamples = ("00" + noOfsamples).slice(-3);
            //***************commented and added by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
            //strReturnProtocol = `MSD${menuObj.InstruId}${side}DIFFER,${upperLimitEmpty},${lowerLimitEmpty},${upperLimitNet},${lowerLimitNet},${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0`;
            strReturnProtocol = `MSD${menuObj.InstruId}${side}DIFFER,${upperLimitEmpty},${lowerLimitEmpty},${upperLimitNet},${lowerLimitNet},${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Individual.unit},`;
            //************************************************************************* *****************************************************/
          }
          await this.activityLogEntryForMs("Differential", IdsNo);
          return strReturnProtocol;
        } else if (MenuType == "R") {
          objMonitor.monit({
            case: "MS",
            idsNo: IdsNo,
            data: { menu: "FRIABILATOR" },
          });
          var fribSide = "L";
          if (side == "L") {
            fribSide = "L";
          } else {
            fribSide = side;
          }
          // let objInvalidBulk = globalData.arrBulkInvalid.find(k => k.idsNo == IdsNo);
          // if (objInvalidBulk == undefined) {
          //     const objBulkInvalid = new IBulkInvalid();
          //     objBulkInvalid.invalidObj.idsNo = IdsNo;
          //     globalData.arrBulkInvalid.push(objBulkInvalid.invalidObj);
          // }
          // else {
          //     const objBulkInvalid = new IBulkInvalid();
          //     objBulkInvalid.invalidObj.idsNo = IdsNo;
          //     objBulkInvalid.invalidObj.Friabilitor.invalid = false;
          //     objBulkInvalid.invalidObj.Friabilitor.invalidMsg = "";
          //     Object.assign(objInvalidBulk, objBulkInvalid.invalidObj);
          // }

          var Obj = globalData.arr_menuList.find(
            (k) => k.MenuName == "Friability"
          );
          // var upperLimit = formulaFun.upperLimit1(parseInt(tempLimitObj.Friability.nominal), tempLimitObj.Friability.T1Pos);
          // var lowerLimit = formulaFun.lowerLimit1(parseInt(tempLimitObj.Friability.nominal), tempLimitObj.Friability.T1Neg);
          var noOfsamples = tempLimitObj.Friability.noOfSamples;
          let nmt = tempLimitObj.Friability.nominal;
          noOfsamples = ("00" + noOfsamples).slice(-3);
          let retuRes = await fetchDetails.checkFriabilityStatus(IdsNo);
          var statusNo; // BEFORE OR AAFTER
          if (retuRes.status == "before") {
            statusNo = "001";
          } else {
            statusNo = "002";
          }
          //***************commented and added by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
          // upper limit will be nmt as told by sheetal 06/02/2021
          strReturnProtocol = `MS${MenuType}1${fribSide}FRIABL,${nmt},0.00,${statusNo},${timeOutPeriod},0,${tempLimitObj.Friability.unit},`;
          //************************************************************************* *****************************************************/
          // var tempFriabilityObj = globalData.arrFriabilityData.find(td => td.idsNo == IdsNo);
          // if (tempFriabilityObj == undefined) {
          //     globalData.arrFriabilityData.push({ idsNo: IdsNo, arr: [] })
          // } else {
          //     tempFriabilityObj.arr = [];
          // }
          //resolve(strReturnProtocol)
          await this.activityLogEntryForMs("Friability", IdsNo);
          return strReturnProtocol;
        } else {
          // for balance, vernier
          switch (MenuType) {
            case "1":
              if (tempCubicleObject.Sys_Area == "Dosa Dry Syrup") {
                objMonitor.monit({
                  case: "MS",
                  idsNo: IdsNo,
                  data: { menu: "Dosa Dry Syrup" },
                });
                var menuObj = globalData.arr_menuList.find(
                  (k) => k.MenuName == "Individual"
                );
                var upperLimit = formulaFun.upperLimit(tempLimitObj.Individual);
                var lowerLimit = formulaFun.lowerLimit(tempLimitObj.Individual);
                var noOfsamples = tempLimitObj.Individual.noOfSamples;
                noOfsamples = ("00" + noOfsamples).slice(-3);
                // if (serverConfig.ProjectName == "MLVeer") {
                //     var tempSide = ""
                //     var tableName = 'tbl_tab_master1_incomplete'
                //     tempSide = await this.CheckPendingSideWeighment(tempCubicleObject)
                //     //***************commented and adde by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
                //     //strReturnProtocol = `MS1${menuObj.InstruId}${side}DOSDRY,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0`;
                //     strReturnProtocol = `MS1${menuObj.InstruId}${side}DOSDRY,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Individual.unit},`;
                //     //************************************************************************* *****************************************************/
                // }
                // else {
                //     //***************commented and adde by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
                //     //strReturnProtocol = `MS1${menuObj.InstruId}${side}DOSDRY,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0`;
                //     strReturnProtocol = `MS1${menuObj.InstruId}${side}DOSDRY,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Individual.unit},`;
                //     //************************************************************************* *****************************************************/
                // }

                strReturnProtocol = `MS1${menuObj.InstruId}${side}DOSDRY,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},1,${tempLimitObj.Individual.unit},`;
                await this.activityLogEntryForMs("Dosa Dry Syrup", IdsNo);
                return strReturnProtocol;
              } else {
                objMonitor.monit({
                  case: "MS",
                  idsNo: IdsNo,
                  data: { menu: "Individual" },
                });
                var menuObj = globalData.arr_menuList.find(
                  (k) => k.MenuName == "Individual"
                );
                var upperLimit = formulaFun.upperLimit(tempLimitObj.Individual);
                var lowerLimit = formulaFun.lowerLimit(tempLimitObj.Individual);
                var noOfsamples = tempLimitObj.Individual.noOfSamples;
                noOfsamples = ("00" + noOfsamples).slice(-3);
                if (serverConfig.ProjectName == "MLVeer") {
                  var tempSide = "";
                  var tableName = "tbl_tab_master1";
                  if (side == "L") {
                    tempSide = await this.CheckPendingSideWeighment(
                      tempCubicleObject,
                      tableName
                    );
                    strReturnProtocol = `MS1${menuObj.InstruId}${tempSide}INDIVI,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Individual.unit},`;
                  } else {
                    strReturnProtocol = `MS1${menuObj.InstruId}${side}INDIVI,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Individual.unit},`;
                  }
                } else {
                  //***************commented and adde by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
                  //strReturnProtocol = `MS1${menuObj.InstruId}${side}INDIVI,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0`;
                  strReturnProtocol = `MS1${menuObj.InstruId}${side}INDIVI,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Individual.unit},`;
                  //************************************************************************* *****************************************************/
                }

                await this.activityLogEntryForMs("Individual", IdsNo);
                return strReturnProtocol;
              }
              break;
            case "2":
              objMonitor.monit({
                case: "MS",
                idsNo: IdsNo,
                data: { menu: "Group" },
              });
              var menuObj = globalData.arr_menuList.find(
                (k) => k.MenuName == "Group"
              );
              var upperLimit = formulaFun.upperLimit(tempLimitObj.Group);
              var lowerLimit = formulaFun.lowerLimit(tempLimitObj.Group);
              var noOfsamples = tempLimitObj.Group.noOfSamples;
              noOfsamples = ("00" + noOfsamples).slice(-3);

              if (serverConfig.ProjectName == "MLVeer") {
                var tempWhich = globalData.arrWhichMenuSideSelected.find(
                  (k) => k.idsNo == IdsNo
                );
                var tempSide = "";
                var tableName = "tbl_tab_master2";
                if (productTypeObj.productType == 1) {
                  //tablet){
                  tableName = "tbl_tab_master2";
                } else {
                  tableName = "tbl_cap_master2";
                }

                if (side == "L") {
                  tempSide = await this.CheckPendingSideWeighment(
                    tempCubicleObject,
                    tableName,
                    2,
                    productTypeObj.productType
                  );
                  //-------------------------------------------------------------------
                  if (tempWhich == undefined) {
                    globalData.arrWhichMenuSideSelected.push({
                      idsNo: IdsNo,
                      menu: "2",
                      side: tempSide,
                    });
                  } else {
                    tempWhich.menu = "2";
                    tempWhich.side = tempSide;
                  }
                  //-------------------------------------------------------------------
                  strReturnProtocol = `MS2${menuObj.InstruId}${tempSide}GROUP,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Group.unit},`;
                } else {
                  //------------------------------------------------------------------
                  if (tempWhich == undefined) {
                    globalData.arrWhichMenuSideSelected.push({
                      idsNo: IdsNo,
                      menu: "2",
                      side: tempSide,
                    });
                  } else {
                    tempWhich.menu = "2";
                    tempWhich.side = side;
                  }
                  //-------------------------------------------------------------------
                  strReturnProtocol = `MS2${menuObj.InstruId}${side}GROUP,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Group.unit},`;
                }
              } else {
                //***************commented and adde by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
                //strReturnProtocol = `MS2${menuObj.InstruId}${side}GROUP,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0`;
                strReturnProtocol = `MS2${menuObj.InstruId}${side}GROUP,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Group.unit},`;
                //************************************************************************* *****************************************************/
              }

              await this.activityLogEntryForMs("Group", IdsNo);
              return strReturnProtocol;
              break;
            case "3":
              objMonitor.monit({
                case: "MS",
                idsNo: IdsNo,
                data: { menu: "Thickness" },
              });
              if (productTypeObj.productType == 1) {
                //tablet
                var menuObj = globalData.arr_menuList.find(
                  (k) => k.MenuName == "Thickness"
                );
                var upperLimit = formulaFun.upperLimit(tempLimitObj.Thickness);
                var lowerLimit = formulaFun.lowerLimit(tempLimitObj.Thickness);
                var noOfsamples = tempLimitObj.Thickness.noOfSamples;
                noOfsamples = ("00" + noOfsamples).slice(-3);

                if (serverConfig.ProjectName == "MLVeer") {
                  var tempSide = "";
                  var tableName = "tbl_tab_master3";
                  if (side == "L") {
                    tempSide = await this.CheckPendingSideWeighment(
                      tempCubicleObject,
                      tableName
                    );
                    strReturnProtocol = `MS3${menuObj.InstruId}${tempSide}THICKN,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Thickness.unit},`;
                  } else {
                    strReturnProtocol = `MS3${menuObj.InstruId}${side}THICKN,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Thickness.unit},`;
                  }
                } else {
                  //***************commented and adde by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
                  //strReturnProtocol = `MS3${menuObj.InstruId}${side}THICKN,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0`;
                  strReturnProtocol = `MS3${menuObj.InstruId}${side}THICKN,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Thickness.unit},`;
                  //************************************************************************* *****************************************************/
                }

                await this.activityLogEntryForMs("Thickness", IdsNo);
                return strReturnProtocol;
              } else if (productTypeObj.productType == 2) {
                //capsule
                var menuObj = globalData.arr_menuList.find(
                  (k) => k.MenuName == "Differential"
                );
                var upperLimit = formulaFun.upperLimit(
                  tempLimitObj.Differential
                );
                var lowerLimit = formulaFun.lowerLimit(
                  tempLimitObj.Differential
                );
                var noOfsamples = tempLimitObj.Differential.noOfSamples;
                noOfsamples = ("00" + noOfsamples).slice(-3);
                //  strReturnProtocol = `MS3${menuObj.InstruId}${side}DIFFER,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0`;
                //***************commented and adde by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
                //strReturnProtocol = `MSD${menuObj.InstruId}${side}DIFFER,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0`;
                //Capsule dont have double rotory so for MLV here not checking for side // projectname == MLVee like ind,thick
                strReturnProtocol = `MSD${menuObj.InstruId}${side}DIFFER,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Differential.unit},`;
                //************************************************************************* *****************************************************/
                await this.activityLogEntryForMs("Differential", IdsNo);
                return strReturnProtocol;
              }
              break;
            case "4":
              if (productTypeObj.productType == 2) {
                //capsule
                objMonitor.monit({
                  case: "MS",
                  idsNo: IdsNo,
                  data: { menu: "Diameter" },
                });
                var menuObj = globalData.arr_menuList.find(
                  (k) => k.MenuName == "Diameter"
                );
                var upperLimit = formulaFun.upperLimit(tempLimitObj.Diameter);
                var lowerLimit = formulaFun.lowerLimit(tempLimitObj.Diameter);
                var noOfsamples = tempLimitObj.Diameter.noOfSamples;
                noOfsamples = ("00" + noOfsamples).slice(-3);

                if (serverConfig.ProjectName == "MLVeer") {
                  var tempSide = "";
                  var tableName = "tbl_cap_master4";
                  if (side == "L") {
                    tempSide = await this.CheckPendingSideWeighment(
                      tempCubicleObject,
                      tableName
                    );
                    strReturnProtocol = `MS4${menuObj.InstruId}${tempSide}DIAMTR,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Diameter.unit},`;
                  } else {
                    strReturnProtocol = `MS4${menuObj.InstruId}${side}DIAMTR,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Diameter.unit},`;
                  }
                } else {
                  //***************commented and adde by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
                  //strReturnProtocol = `MS4${menuObj.InstruId}${side}DIAMTR,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0`;
                  strReturnProtocol = `MS4${menuObj.InstruId}${side}DIAMTR,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Diameter.unit},`;
                  //************************************************************************* *****************************************************/
                }

                await this.activityLogEntryForMs("Diameter", IdsNo);
                return strReturnProtocol;
                break;
              } else {
                //tablet
                objMonitor.monit({
                  case: "MS",
                  idsNo: IdsNo,
                  data: { menu: "Breadth" },
                });
                var menuObj = globalData.arr_menuList.find(
                  (k) => k.MenuName == "Breadth"
                );
                var upperLimit = formulaFun.upperLimit(tempLimitObj.Breadth);
                var lowerLimit = formulaFun.lowerLimit(tempLimitObj.Breadth);
                var noOfsamples = tempLimitObj.Breadth.noOfSamples;
                noOfsamples = ("00" + noOfsamples).slice(-3);

                if (serverConfig.ProjectName == "MLVeer") {
                  var tempSide = "";
                  var tableName = "tbl_tab_master4";
                  if (side == "L") {
                    tempSide = await this.CheckPendingSideWeighment(
                      tempCubicleObject,
                      tableName
                    );
                    strReturnProtocol = `MS4${menuObj.InstruId}${tempSide}BREADT,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Breadth.unit},`;
                  } else {
                    strReturnProtocol = `MS4${menuObj.InstruId}${side}BREADT,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Breadth.unit},`;
                  }
                } else {
                  //***************commented and adde by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
                  //strReturnProtocol = `MS4${menuObj.InstruId}${side}BREADTH,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0`;
                  strReturnProtocol = `MS4${menuObj.InstruId}${side}BREADT,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Breadth.unit},`;
                  //************************************************************************* *****************************************************/
                }

                await this.activityLogEntryForMs("Breadth", IdsNo);
                return strReturnProtocol;

                break;
              }

            case "5":
              objMonitor.monit({
                case: "MS",
                idsNo: IdsNo,
                data: { menu: "Length" },
              });
              var menuObj = globalData.arr_menuList.find(
                (k) => k.MenuName == "Length"
              );
              var upperLimit = formulaFun.upperLimit(tempLimitObj.Length);
              var lowerLimit = formulaFun.lowerLimit(tempLimitObj.Length);
              var noOfsamples = tempLimitObj.Length.noOfSamples;
              noOfsamples = ("00" + noOfsamples).slice(-3);

              if (serverConfig.ProjectName == "MLVeer") {
                var tempSide = "";
                var tableName = "tbl_tab_master5";
                if (productTypeObj.productType == 2) {
                  tableName = "tbl_cap_master5";
                } else {
                  tableName = "tbl_tab_master5";
                }

                if (side == "L") {
                  tempSide = await this.CheckPendingSideWeighment(
                    tempCubicleObject,
                    tableName
                  );
                  strReturnProtocol = `MS5${menuObj.InstruId}${tempSide}LENGTH,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Length.unit},`;
                } else {
                  strReturnProtocol = `MS5${menuObj.InstruId}${side}LENGTH,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Length.unit},`;
                }
              } else {
                //***************commented and adde by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
                //strReturnProtocol = `MS5${menuObj.InstruId}${side}LENGTH,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0`;
                strReturnProtocol = `MS5${menuObj.InstruId}${side}LENGTH,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Length.unit},`;
                //************************************************************************* *****************************************************/
              }

              await this.activityLogEntryForMs("Length", IdsNo);
              return strReturnProtocol;

              break;
            case "6":
              objMonitor.monit({
                case: "MS",
                idsNo: IdsNo,
                data: { menu: "Diameter" },
              });
              var menuObj = globalData.arr_menuList.find(
                (k) => k.MenuName == "Diameter"
              );
              var upperLimit = formulaFun.upperLimit(tempLimitObj.Diameter);
              var lowerLimit = formulaFun.lowerLimit(tempLimitObj.Diameter);
              var noOfsamples = tempLimitObj.Diameter.noOfSamples;
              noOfsamples = ("00" + noOfsamples).slice(-3);

              if (serverConfig.ProjectName == "MLVeer") {
                var tempSide = "";
                var tableName = "";
                tableName = "tbl_tab_master6";
                if (side == "L") {
                  tempSide = await this.CheckPendingSideWeighment(
                    tempCubicleObject,
                    tableName
                  );
                  strReturnProtocol = `MS6${menuObj.InstruId}${tempSide}DIAMTR,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Diameter.unit},`;
                } else {
                  strReturnProtocol = `MS6${menuObj.InstruId}${side}DIAMTR,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Diameter.unit},`;
                }
              } else {
                //***************commented and adde by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
                //strReturnProtocol = `MS6${menuObj.InstruId}${side}DIAMTR,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0`;
                strReturnProtocol = `MS6${menuObj.InstruId}${side}DIAMTR,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Diameter.unit},`;
                //************************************************************************* *****************************************************/
              }

              await this.activityLogEntryForMs("Diameter", IdsNo);
              return strReturnProtocol;
              break;
            case "8":
              if (serverConfig.ProjectName == "RBH") {
                objMonitor.monit({
                  case: "MS",
                  idsNo: IdsNo,
                  data: { menu: "Ind Empty" },
                });
                var menuObj = globalData.arr_menuList.find(
                  (k) => k.MenuName == "Ind_Layer"
                );
                var upperLimit = formulaFun.upperLimit(tempLimitObj.Ind_Empty);
                var lowerLimit = formulaFun.lowerLimit(tempLimitObj.Ind_Empty);
                var noOfsamples = tempLimitObj.Ind_Empty.noOfSamples;
                noOfsamples = ("00" + noOfsamples).slice(-3);
                //***************commented and adde by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
                //strReturnProtocol = `MS8${menuObj.InstruId}${side}INDEMP,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0`;
                strReturnProtocol = `MS8${menuObj.InstruId}${side}INDEMP,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Ind_Empty.unit},`;
                //************************************************************************* *****************************************************/
                await this.activityLogEntryForMs("Individual Empty", IdsNo);
                return strReturnProtocol;
              } else {
                objMonitor.monit({
                  case: "MS",
                  idsNo: IdsNo,
                  data: { menu: "Ind Layer 1" },
                });
                var menuObj = globalData.arr_menuList.find(
                  (k) => k.MenuName == "Ind_Layer"
                );
                var upperLimit = formulaFun.upperLimit(tempLimitObj.Ind_Layer);
                var lowerLimit = formulaFun.lowerLimit(tempLimitObj.Ind_Layer);
                var noOfsamples = tempLimitObj.Ind_Layer.noOfSamples;
                noOfsamples = ("00" + noOfsamples).slice(-3);
                //***************commented and adde by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
                //strReturnProtocol = `MS8${menuObj.InstruId}${side}INDLAY,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0`;
                strReturnProtocol = `MS8${menuObj.InstruId}${side}INDLA1,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Ind_Layer.unit},`;
                //************************************************************************* *****************************************************/
                await this.activityLogEntryForMs("Individual Layer-1", IdsNo);
                return strReturnProtocol;
              }
              break;
            case "9":
              objMonitor.monit({
                case: "MS",
                idsNo: IdsNo,
                data: { menu: "Grp Layer 1" },
              });
              var menuObj = globalData.arr_menuList.find(
                (k) => k.MenuName == "Grp_Layer"
              );
              var upperLimit = formulaFun.upperLimit(tempLimitObj.Grp_Layer);
              var lowerLimit = formulaFun.lowerLimit(tempLimitObj.Grp_Layer);
              var noOfsamples = tempLimitObj.Grp_Layer.noOfSamples;
              noOfsamples = ("00" + noOfsamples).slice(-3);
              //***************commented and adde by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
              //strReturnProtocol = `MS9${menuObj.InstruId}${side}GRPLAY,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0`;
              strReturnProtocol = `MS9${menuObj.InstruId}${side}GRPLA1,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Grp_Layer.unit},`;
              //************************************************************************* *****************************************************/
              await this.activityLogEntryForMs("Group Layer-1", IdsNo);
              return strReturnProtocol;

              break;
            case "L":
              objMonitor.monit({
                case: "MS",
                idsNo: IdsNo,
                data: { menu: "Ind Layer2" },
              });
              var menuObj = globalData.arr_menuList.find(
                (k) => k.MenuName == "Ind_Layer1"
              );
              var upperLimit = formulaFun.upperLimit(tempLimitObj.Ind_Layer1);
              var lowerLimit = formulaFun.lowerLimit(tempLimitObj.Ind_Layer1);
              var noOfsamples = tempLimitObj.Ind_Layer1.noOfSamples;
              noOfsamples = ("00" + noOfsamples).slice(-3);
              // last 0/1 for Edit sample 0- editable 1- Not editable
              //***************commented and adde by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
              //strReturnProtocol = `MSL${menuObj.InstruId}${side}INDLAY1,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0`;
              strReturnProtocol = `MSL${menuObj.InstruId}${side}INDLA2,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Ind_Layer1.unit},`;
              //************************************************************************* *****************************************************/
              await this.activityLogEntryForMs("Individual Layer-2", IdsNo);
              return strReturnProtocol;

              break;
            case "K":
              objMonitor.monit({
                case: "MS",
                idsNo: IdsNo,
                data: { menu: "Group Layer2" },
              });
              var menuObj = globalData.arr_menuList.find(
                (k) => k.MenuName == "Grp_Layer1"
              );
              var upperLimit = formulaFun.upperLimit(tempLimitObj.Grp_Layer1);
              var lowerLimit = formulaFun.lowerLimit(tempLimitObj.Grp_Layer1);
              var noOfsamples = tempLimitObj.Grp_Layer1.noOfSamples;
              noOfsamples = ("00" + noOfsamples).slice(-3);
              // last 0/1 for Edit sample 0- editable 1- Not editable
              //***************commented and adde by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
              //strReturnProtocol = `MSK${menuObj.InstruId}${side}GRPLAY1,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0`;
              strReturnProtocol = `MSK${menuObj.InstruId}${side}GRPLA2,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Grp_Layer1.unit},`;
              //************************************************************************* *****************************************************/
              await this.activityLogEntryForMs("Group Layer-2", IdsNo);
              return strReturnProtocol;
              break;
            case "P":
              objMonitor.monit({
                case: "MS",
                idsNo: IdsNo,
                data: { menu: "Particle Size" },
              });
              var menuObj = globalData.arr_menuList.find(
                (k) => k.MenuName == "Particle Seizing"
              );

              var upperLimit = tempLimitObj.PartSize.T1Pos;
              var lowerLimit = tempLimitObj.PartSize.T1Neg;
              var noOfsamples = tempLimitObj.PartSize.noOfSamples;
              noOfsamples = ("00" + noOfsamples).slice(-3);
              // last 0/1 for Edit sample 0- editable 1- Not editable
              //***************commented and adde by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
              //strReturnProtocol = `MSP${menuObj.InstruId}NPRTSIZ,${upperLimit},${lowerLimit},${noOfsamples},0000,0`;
              strReturnProtocol = `MSP${menuObj.InstruId}NPRTSIZ,${upperLimit},${lowerLimit},${noOfsamples},0000,1,${tempLimitObj.PartSize.unit},`;
              //************************************************************************* *****************************************************/
              await this.activityLogEntryForMs("Particle Size", IdsNo);
              return strReturnProtocol;
              break;
            case "F":
              objMonitor.monit({
                case: "MS",
                idsNo: IdsNo,
                data: { menu: "% Fine" },
              });
              var menuObj = globalData.arr_menuList.find(
                (k) => k.MenuName == "%Fine"
              );
              var upperLimit = tempLimitObj.PerFine.T1Pos;
              var lowerLimit = tempLimitObj.PerFine.T1Neg;
              var noOfsamples = tempLimitObj.PerFine.noOfSamples;
              noOfsamples = ("00" + noOfsamples).slice(-3);
              // last 0/1 for Edit sample 0- editable 1- Not editable
              //***************commented and adde by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
              //strReturnProtocol = `MSF${menuObj.InstruId}N%FINE,${upperLimit},${lowerLimit},${noOfsamples},0000,0`;
              strReturnProtocol = `MSF${menuObj.InstruId}N%FINE,${upperLimit},${lowerLimit},${noOfsamples},0000,1,${tempLimitObj.PerFine.unit},`;
              //************************************************************************* *****************************************************/
              await this.activityLogEntryForMs("% Fine", IdsNo);
              return strReturnProtocol;
              break;
            case "Y":
              // CASE FOR SEALED CARTRIAGE
              objMonitor.monit({
                case: "MS",
                idsNo: IdsNo,
                data: { menu: "Sealed Cartridge" },
              });
              var menuObj = globalData.arr_menuList.find(
                (k) => k.MenuName == "Sealed Cartridge"
              );
              var upperLimit = formulaFun.upperLimit(tempLimitObj.SealedCart);
              var lowerLimit = formulaFun.lowerLimit(tempLimitObj.SealedCart);
              var noOfsamples = tempLimitObj.SealedCart.noOfSamples;
              noOfsamples = ("00" + noOfsamples).slice(-3);
              // last 0/1 for Edit sample 0- editable 1- Not editable
              //***************commented and added by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
              //strReturnProtocol = `MSI${menuObj.InstruId}${side}SLDCRT,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,ACTUAL WT ,`;
              strReturnProtocol = `MSI${menuObj.InstruId}${side}SLDCRT,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,ACTUAL WT ,${tempLimitObj.SealedCart.unit},`;
              //************************************************************************* *****************************************************/
              await this.activityLogEntryForMs("Sealed Cartridge", IdsNo);
              var objMLH = globalData.arrMultihealerMS.find(
                (k) => k.idsNo == IdsNo
              );
              if (objMLH == undefined) {
                globalData.arrMultihealerMS.push({
                  idsNo: IdsNo,
                  menu: "Sealed Cartridge",
                });
              } else {
                objMLH.menu = "Sealed Cartridge";
              }
              return strReturnProtocol;
              break;
            case "Z":
              // CASE FOR NET CONTENT
              objMonitor.monit({
                case: "MS",
                idsNo: IdsNo,
                data: { menu: "Net Content" },
              });
              var menuObj = globalData.arr_menuList.find(
                (k) => k.MenuName == "Net Content"
              );
              var upperLimit = formulaFun.upperLimit(tempLimitObj.NetCart);
              var lowerLimit = formulaFun.lowerLimit(tempLimitObj.NetCart);
              var noOfsamples = tempLimitObj.NetCart.noOfSamples;
              noOfsamples = ("00" + noOfsamples).slice(-3);
              // last 0/1 for Edit sample 0- editable 1- Not editable
              //***************commented and added by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
              //strReturnProtocol = `MSI${menuObj.InstruId}${side}NETCRT,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,TARE WT ,`;
              strReturnProtocol = `MSI${menuObj.InstruId}${side}NETCRT,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,TARE WT ,${tempLimitObj.NetCart.unit},`;
              //************************************************************************* *****************************************************/
              await this.activityLogEntryForMs("Net Cartriage", IdsNo);
              var objMLH = globalData.arrMultihealerMS.find(
                (k) => k.idsNo == IdsNo
              );
              if (objMLH == undefined) {
                globalData.arrMultihealerMS.push({
                  idsNo: IdsNo,
                  menu: "Net Content",
                });
              } else {
                objMLH.menu = "Net Content";
              }
              return strReturnProtocol;
              break;
            case "W":
              // CASE FOR Dry Cartridge
              objMonitor.monit({
                case: "MS",
                idsNo: IdsNo,
                data: { menu: "Dry Cartridge" },
              });
              var menuObj = globalData.arr_menuList.find(
                (k) => k.MenuName == "Dry Cartridge"
              );
              var upperLimit = formulaFun.upperLimit(tempLimitObj.DryCart);
              var lowerLimit = formulaFun.lowerLimit(tempLimitObj.DryCart);
              var noOfsamples = tempLimitObj.DryCart.noOfSamples;
              noOfsamples = ("00" + noOfsamples).slice(-3);
              // last 0/1 for Edit sample 0- editable 1- Not editable
              //***************commented and added by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
              //strReturnProtocol = `MSI${menuObj.InstruId}${side}DRYCRT,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,GROSS WT ,`;
              strReturnProtocol = `MSI${menuObj.InstruId}${side}DRYCRT,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,GROSS WT ,${tempLimitObj.DryCart.unit},`;
              //************************************************************************* *****************************************************/
              await this.activityLogEntryForMs("Dry Cartridge", IdsNo);
              var objMLH = globalData.arrMultihealerMS.find(
                (k) => k.idsNo == IdsNo
              );
              if (objMLH == undefined) {
                globalData.arrMultihealerMS.push({
                  idsNo: IdsNo,
                  menu: "Dry Cartridge",
                });
              } else {
                objMLH.menu = "Dry Cartridge";
              }
              return strReturnProtocol;
              break;
            case "X":
              // CASE FOR Dry Cartridge
              objMonitor.monit({
                case: "MS",
                idsNo: IdsNo,
                data: { menu: "Dry Powder" },
              });
              var menuObj = globalData.arr_menuList.find(
                (k) => k.MenuName == "Dry Powder"
              );
              var upperLimit = formulaFun.upperLimit(tempLimitObj.DryPwd);
              var lowerLimit = formulaFun.lowerLimit(tempLimitObj.DryPwd);
              var noOfsamples = tempLimitObj.DryPwd.noOfSamples;
              noOfsamples = ("00" + noOfsamples).slice(-3);
              // last 0/1 for Edit sample 0- editable 1- Not editable
              //***************commented and added by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
              //strReturnProtocol = `MSI${menuObj.InstruId}${side}DRYPWD,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,GROSS WT ,`;
              strReturnProtocol = `MSI${menuObj.InstruId}${side}DRYPWD,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,GROSS WT ,${tempLimitObj.DryPwd.unit},`;
              //************************************************************************* *****************************************************/
              await this.activityLogEntryForMs("Dry Powder", IdsNo);
              var objMLH = globalData.arrMultihealerMS.find(
                (k) => k.idsNo == IdsNo
              );
              if (objMLH == undefined) {
                globalData.arrMultihealerMS.push({
                  idsNo: IdsNo,
                  menu: "Dry Powder",
                });
              } else {
                objMLH.menu = "Dry Powder";
              }
              return strReturnProtocol;
              break;
            default:
              return "+";
              break;
            // TO-Do  for other
          }
        }
      } else {
        return "+";
      }
    } catch (err) {
      console.log(err);
      return err;
    }
  }
  /**
   *
   * @param {*} idsNo Ids No
   * @param {*} strProtocol InComing Protocol for Side change
   */
  async processES(idsNo, strProtocol) {
    try {
      var tempTDObj = globalData.arrDTData.find((td) => td.idsNo == idsNo);
      if (tempTDObj == undefined) {
        globalData.arrDTData.push({
          idsNo: idsNo,
          arr_heading: [],
          arr_reading: [],
          arr_info: [],
        });
      } else {
        tempTDObj.arr_heading = [];
        tempTDObj.arr_reading = [];
        tempTDObj.arr_info = [];
      }
      // Here we have to check for IPQC as wll
      var selectedIds;
      var IPQCObject = globalData.arr_IPQCRelIds.find((k) => k.idsNo == idsNo);
      if (IPQCObject != undefined) {
        selectedIds = IPQCObject.selectedIds;
      } else {
        selectedIds = idsNo;
      }
      let tempCubicleObject = globalData.arrIdsInfo.find(
        (k) => k.Sys_IDSNo == idsNo
      );
      let selectedCubicleObj = globalData.arrIdsInfo.find(
        (k) => k.Sys_IDSNo == selectedIds
      );
      var tempLimitObj = globalData.arr_limits.find((k) => k.idsNo == idsNo); // limits Object
      var MenuType = strProtocol.substring(3, 4); // T OR H
      // here we are taking side OR rotory for selected machine
      var side = selectedCubicleObj.Sys_RotaryType;
      // if (side == 'Single' || side == 'NA') {
      //     side = 'N';
      // } else if (side == 'Double') {
      //     side = 'L';
      // }
      if (side == "None" || side == "NA" || side == "Single") {
        side = "N";
      } else if (side == "Double") {
        side = "L";
      }
      // console.log('IN Proccess ES', strProtocol)
      var portInstrument;
      if (
        tempCubicleObject.Sys_PortNo == 103 ||
        tempCubicleObject.Sys_PortNo == 104
      ) {
        // check for port 3
        if (MenuType == "H") {
          portInstrument = tempCubicleObject.Sys_Port4;
        } else if (MenuType == "E") {
          portInstrument = tempCubicleObject.Sys_Port2;
        } else {
          portInstrument = tempCubicleObject.Sys_Port3;
        }
      } else if (
        tempCubicleObject.Sys_PortNo == 101 ||
        tempCubicleObject.Sys_PortNo == 102
      ) {
        // check for port 2
        if (MenuType == "H") {
          portInstrument = tempCubicleObject.Sys_Port1;
        } else if (MenuType == "E") {
          // NO USE------------------
          portInstrument = tempCubicleObject.Sys_Port2;
        } else {
          portInstrument = tempCubicleObject.Sys_Port2;
        }
      }
      let result = await this.getProductSamples(tempCubicleObject.Sys_CubicNo);
      let strRecieveBulProtocol = await this.processBulkData(
        portInstrument,
        tempLimitObj,
        result,
        side,
        MenuType,
        tempCubicleObject,
        idsNo
      );
      // this.activityLogEntryForMs("Tab Density", idsNo).then((res) => {
      return strRecieveBulProtocol;
      // }).catch(error => { console.log(error) })
    } catch (err) {
      return err;
    }
  }
  async getProductSamples(cno) {
    try {
      var slectProductSamples = {
        str_tableName: "tbl_cubicle_product_sample",
        data: "*",
        condition: [{ str_colName: "Sys_CubicNo", value: cno, comp: "eq" }],
      };
      let result = await database.select(slectProductSamples);
      return result;
    } catch (error) {
      console.log(error);
      return error;
    }
  }
  /****************************************************************** */
  async activityLogEntryForMs(strSelectedMenu, IDSSrNo) {
    // activity Entry for Repeatability Calibration Completion
    try {
      const tempUserObject = globalData.arrUsers.find(
        (k) => k.IdsNo == IDSSrNo
      );
      var objActivity = {};
      Object.assign(
        objActivity,
        { strUserId: tempUserObject.UserId },
        { strUserName: tempUserObject.UserName },
        { activity: strSelectedMenu + " Menu Selected on IDS" + IDSSrNo }
      );
      await objActivityLog.ActivityLogEntry(objActivity);
      return "Successfull";
    } catch (err) {
      console.log(err);
      return err;
    }
  }
  async CheckHardnessModel(idsNo, str_Protocol) {
    var cubicInfo = globalData.arrIdsInfo.find((k) => k.Sys_IDSNo == idsNo);
    var hardnessId = cubicInfo.Sys_HardID;
    var selectOtherEquip = {
      str_tableName: "tbl_otherequipment",
      data: "*",
      condition: [{ str_colName: "Eqp_ID", value: hardnessId }],
    };
    var result = await database.select(selectOtherEquip);
    return result[0][0];
  }

  async getHardnessData(idsNo, str_Protocol) {
    var cubicInfo = globalData.arrIdsInfo.find((k) => k.Sys_IDSNo == idsNo);
    var hardnessId = cubicInfo.Sys_HardID;
    var selectOtherEquip = {
      str_tableName: "tbl_otherequipment",
      data: "*",
      condition: [{ str_colName: "Eqp_ID", value: hardnessId }],
    };
    var result = await database.select(selectOtherEquip);
    return result[0][0];
  }
  // ****************************************************************************************************/
  // Below function handles only Menu selection for buld data instrument
  //**************************************************************************************************** */
  async processBulkData(
    portInstrument,
    tempLimitObj,
    result,
    side,
    MenuType,
    tempCubicleObject,
    IdsNo
  ) {
    try {
      let timeOutPeriod = (
        "0000" +
        globalData.arrsAllParameters[0].tbl_config_TimeoutPeriod * 60
      ).slice(-4);
      var strReturnProtocol;
      var tempIM = globalData.arrHexInfo.find((k) => k.idsNo == IdsNo);
      var cubicInfo = globalData.arrIdsInfo.find((k) => k.Sys_IDSNo == IdsNo);
      if (tempIM == undefined) {
        return "ID3 Config Mismatched,,,";
      } else {
        var IM = tempIM.IM;
        var bulkInstruments = [
          "Hardness",
          "Disintegration Tester",
          "Moisture Analyzer",
          "Tapped Density",
          "Friabilator",
        ];
        var intInstrumentID = 4;
        var port1, port2;
        switch (IM) {
          case "IMG1":
            intInstrumentID = 4;
            break;
          case "IMG2": // ALL BULK
            intInstrumentID = 6;
            break;
          case "IMC1":
            // check for menuID
            port1 = "Balance";
            port2 = "Vernier";
            if (
              cubicInfo.Sys_Port1 != "Balance" &&
              cubicInfo.Sys_Port2 != "Vernier"
            ) {
              return "ID3 PORT SETTING,Mismatched,,,";
            } else {
              switch (MenuType) {
                case (1, 2, 8, 9, "L", "K", "F", "P"):
                  intInstrumentID = 1;
                  break;
                case (3, 4, 5, 6):
                  intInstrumentID = 2;
                  break;
                case "T":
                  intInstrumentID = 3;
                  break;
                case "H":
                  intInstrumentID = 4;
                  break;
                case "F":
                  intInstrumentID = 6;
                  break;
                default:
                  intInstrumentID = 1;
                  break;
              }
            }
            break;
          case "IMC2":
            port1 = "Bulk";
            port2 = "Vernier";
            if (
              bulkInstruments.indexOf(cubicInfo.Sys_Port1) == -1 &&
              cubicInfo.Sys_Port2 != "Vernier"
            ) {
              return "ID3 PORT SETTING,Mismatched,,,";
            } else {
              switch (MenuType) {
                case (1, 2, 8, 9, "L", "K", "F", "P"):
                  intInstrumentID = 1;
                  break;
                case (3, 4, 5, 6):
                  intInstrumentID = 2;
                  break;
                case "T":
                  intInstrumentID = 3;
                  break;
                case "H":
                  intInstrumentID = 4;
                  break;
                default:
                  intInstrumentID = 1;
                  break;
              }
            }
            break;
          case "IMC3":
            port1 = "Bulk";
            port2 = "Balance";
            if (
              bulkInstruments.indexOf(cubicInfo.Sys_Port1) == -1 &&
              cubicInfo.Sys_Port2 != "Balance"
            ) {
              return "ID3 PORT SETTING,Mismatched,,,";
            } else {
              switch (MenuType) {
                case (1, 2, 8, 9, "L", "K", "F", "P"):
                  intInstrumentID = 1;
                  break;
                case (3, 4, 5, 6):
                  intInstrumentID = 2;
                  break;
                case "T":
                  intInstrumentID = 3;
                  break;
                case "H":
                  intInstrumentID = 4;
                  break;
                default:
                  intInstrumentID = 1;
                  break;
              }
            }
            break;
          case "IMC4":
            port1 = "Bulk";
            port2 = "Bulk";
            if (
              bulkInstruments.indexOf(cubicInfo.Sys_Port1) == -1 &&
              bulkInstruments.indexOf(cubicInfo.Sys_Port2) == -1
            ) {
              return "ID3 PORT SETTING,Mismatched,,,";
            } else {
              switch (MenuType) {
                case "T":
                  intInstrumentID = 3;
                  break;
                case "H":
                  intInstrumentID = 4;
                  break;
                default:
                  intInstrumentID = 1;
                  break;
              }
            }
            break;
          default:
            break;
        }
      }
      switch (portInstrument.toUpperCase()) {
        case "DISINTEGRATION TESTER":
          //objMonitor.monit({case:'MS', idsNo:IdsNo,data:{menu:'DT'}})
          /**
           * For DT if rotory type is single then side will N otherwise it will be R
           * so checking for side
           */
          let objInvalidBulkDT = globalData.arrBulkInvalid.find(
            (k) => k.idsNo == IdsNo
          );
          if (objInvalidBulkDT == undefined) {
            const objBulkInvalid = new IBulkInvalid();
            objBulkInvalid.invalidObj.idsNo = IdsNo;
            globalData.arrBulkInvalid.push(objBulkInvalid.invalidObj);
          } else {
            const objBulkInvalid = new IBulkInvalid();
            objBulkInvalid.invalidObj.idsNo = IdsNo;
            objBulkInvalid.invalidObj.DT.invalid = false;
            objBulkInvalid.invalidObj.DT.invalidMsg = "";
            Object.assign(objInvalidBulkDT, objBulkInvalid.invalidObj);
          }
          if (side == "L" || side == "R") {
            side = "R";
          } else {
            side = "N";
          }
          var DTObj = globalData.arr_menuList.find((k) => k.MenuName == "DT");
          var upperLimit = formulaFun.upperLimit1(
            parseInt(tempLimitObj.DT.nominal),
            tempLimitObj.DT.T1Pos
          );
          var lowerLimit = formulaFun.lowerLimit1(
            parseInt(tempLimitObj.DT.nominal),
            tempLimitObj.DT.T1Neg
          );
          var noOfsamples = tempLimitObj.DT.noOfSamples;
          noOfsamples = ("00" + noOfsamples).slice(-3);
          //***************commented and added by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
          //strReturnProtocol = `MS${MenuType}${intInstrumentID}${side}DT   ,0,0,N.A,0000,1`;
          //strReturnProtocol = `MS${MenuType}${intInstrumentID}${side}DT   ,0,0,N.A,0000,1,${tempLimitObj.DT.unit},`;
          strReturnProtocol = `MS${MenuType}${intInstrumentID}${side}DT    ,0,0,${noOfsamples},0000,0,${tempLimitObj.DT.unit},`;
          //strReturnProtocol = `MS1${menuObj.InstruId}${tempSide}INDIVI,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Individual.unit},`;
          //************************************************************************* *****************************************************/
          var tempTDObj = globalData.arrDTData.find((td) => td.idsNo == IdsNo);
          if (tempTDObj == undefined) {
            globalData.arrDTData.push({
              idsNo: IdsNo,
              arr_heading: [],
              arr_reading: [],
              arr_info: [],
            });
          } else {
            tempTDObj.arr_heading = [];
            tempTDObj.arr_reading = [];
            tempTDObj.arr_info = [];
          }

          return strReturnProtocol;
          break;
        case "TABLET TESTER":
        case "HARDNESS":
          objMonitor.monit({
            case: "MS",
            idsNo: IdsNo,
            data: { menu: "HARDNESS" },
          });
          var objHardness = globalData.arrHardness425.find(
            (ht) => ht.idsNo == IdsNo
          );
          var objHardness1050 = globalData.arrHardnessTH1050.find(
            (ht) => ht.idsNo == IdsNo
          );
          let objInvalidBulkHD = globalData.arrBulkInvalid.find(
            (k) => k.idsNo == IdsNo
          );
          var objproductlimits = globalData.arr_limits.find(
            (k) => k.idsNo == IdsNo
          ); //added by vivek on 28102020

          var hardnessModelObj = await this.CheckHardnessModel(IdsNo);
          //Eqp_Make
          let hardnessModel = hardnessModelObj.Eqp_Make;
          let isMultiParam = hardnessModelObj.Eqp_HT_IsMutliTester;
          if (objInvalidBulkHD == undefined) {
            const objBulkInvalid = new IBulkInvalid();
            objBulkInvalid.invalidObj.idsNo = IdsNo;
            globalData.arrBulkInvalid.push(objBulkInvalid.invalidObj);
          } else {
            const objBulkInvalid = new IBulkInvalid();
            objBulkInvalid.invalidObj.idsNo = IdsNo;
            objBulkInvalid.invalidObj.HD425.invalid = false;
            objBulkInvalid.invalidObj.HD425.invalidMsg = "";
            Object.assign(objInvalidBulkHD, objBulkInvalid.invalidObj);
          }

          if (hardnessModel == "Kraemer") {
            var upperLimit =
              tempLimitObj.Hardness == undefined
                ? 0
                : tempLimitObj.Hardness.T1Pos;
            var lowerLimit =
              tempLimitObj.Hardness == undefined
                ? 0
                : tempLimitObj.Hardness.T1Neg;
            var noOfsamples =
              tempLimitObj.Hardness == undefined
                ? 0
                : tempLimitObj.Hardness.noOfSamples;
            var NomValue =
              tempLimitObj.Hardness == undefined
                ? 0
                : tempLimitObj.Hardness.nominal;
            var unit =
              tempLimitObj.Hardness == undefined
                ? "N"
                : tempLimitObj.Hardness.unit;

            noOfsamples = ("00" + noOfsamples).slice(-3);
            if (unit == "N") {
              upperLimit = parseFloat(upperLimit).toFixed(0);
              lowerLimit = parseFloat(lowerLimit).toFixed(0);
            } else {
              // FOR KP, SC
              upperLimit = parseFloat(upperLimit).toFixed(1);
              lowerLimit = parseFloat(lowerLimit).toFixed(1);
            }

            if (objHardness == undefined) {
              const obj = {
                idsNo: IdsNo,
                sampleNo: 0,
                masterEntryFlag: false,
                hardnessVal: 0,
                opNominal: NomValue,
                opNegTol: lowerLimit,
                opPosTol: upperLimit,
                arr: [],
              };
              globalData.arrHardnessKramer.push(obj);
            } else {
              (objHardness.sampleNo = 0),
                (objHardness.masterEntryFlag = false),
                (objHardness.hardnessVal = 0),
                (objHardness.opNominal = 0),
                (objHardness.opNegTol = 0),
                (objHardness.arr = []),
                (objHardness.opPosTol = 0);
            }

            var objIncompIdHardness = globalData.hardnessIncompleteId.find(
              (sr) => sr.idsNo == IdsNo
            );
            if (objIncompIdHardness == undefined) {
              const obj = {
                idsNo: IdsNo,
                incompRepSerNo: 0,
              };
              globalData.hardnessIncompleteId.push(obj);
            }
          } else if (
            hardnessModel == "Sotax MT50" ||
            hardnessModel == "Sotax ST50"
          ) {
            if (serverConfig.hardnessOnTCP == true) {
              var hardnessData = await this.getHardnessData(IdsNo);
              let host = hardnessData.Eqp_IP;
              let port = hardnessData.Eqp_Port;
              var connection = await objTcpConnector.connect(host, port);
            }
            let strMt50Type = hardnessModelObj.Eqp_HT_Type;
            if (strMt50Type == "HTOHR") {
              /**
               * MT50, v01.09.00                      *
               * MICROLABS ML11
               */
              var tempHardnessReadings =
                globalData.arrHardnessDRSCPharmatron.find(
                  (k) => k.idsNo == IdsNo
                );
              if (tempHardnessReadings == undefined) {
                globalData.arrHardnessDRSCPharmatron.push({
                  idsNo: IdsNo,
                  oc: 0,
                  hardnessFlag: false,
                  arr: [],
                  capacityFlag: false,
                  masterId: 0,
                  masterEntryFlag: false,
                });
              } else {
                tempHardnessReadings.oc = 0;
                tempHardnessReadings.arr = [];
                tempHardnessReadings.capacityFlag = false;
                tempHardnessReadings.hardnessFlag = false;
                tempHardnessReadings.masterId = 0;
                tempHardnessReadings.masterEntryFlag = false;
              }
            } else {
              let objHardnessMT50 = globalData.arrHardnessMT50.find(
                (ht) => ht.idsNo == IdsNo
              );
              let objarrHardnessMT50Reading =
                globalData.arrHardnessMT50Reading.find(
                  (ht) => ht.idsNo == IdsNo
                );
              if (objHardnessMT50 == undefined) {
                const obj = {
                  idsNo: IdsNo,
                  dimensionParam: 0,
                  sampleNo: 0,
                  colName: "",
                  thicknessVal: [],
                  thicknessDecimal: 0,
                  thicknessNom: 0,
                  thicknesneg: 0,
                  thicknespos: 0,
                  WidthVal: [],
                  WidthDecimal: 0,
                  WidthNom: 0,
                  Widthneg: 0,
                  Widthpos: 0,
                  DiameterVal: [],
                  DiameterDecimal: 0,
                  DiametereNom: 0,
                  Diameterneg: 0,
                  Diameterpos: 0,
                  HardnessVal: [],
                  HardnessDecimal: 0,
                  HardnessNom: 0,
                  Hardnessrneg: 0,
                  Hardnesspos: 0,
                };
                globalData.arrHardnessMT50.push(obj);
              } else {
                (objHardnessMT50.dimensionParam = 0),
                  (objHardnessMT50.sampleNo = 0),
                  (objHardnessMT50.colName = ""),
                  (objHardnessMT50.thicknessVal = []),
                  (objHardnessMT50.thicknessDecimal = 0),
                  (objHardnessMT50.thicknessNom = 0),
                  (objHardnessMT50.thicknesneg = 0),
                  (objHardnessMT50.thicknespos = 0),
                  (objHardnessMT50.WidthVal = []),
                  (objHardnessMT50.WidthDecimal = 0),
                  (objHardnessMT50.WidthNom = 0),
                  (objHardnessMT50.Widthneg = 0),
                  (objHardnessMT50.Widthpos = 0),
                  (objHardnessMT50.DiameterVal = []),
                  (objHardnessMT50.DiameterDecimal = 0),
                  (objHardnessMT50.DiametereNom = 0),
                  (objHardnessMT50.Diameterneg = 0),
                  (objHardnessMT50.Diameterpos = 0),
                  (objHardnessMT50.HardnessVal = []),
                  (objHardnessMT50.HardnessDecimal = 0),
                  (objHardnessMT50.HardnessNom = 0),
                  (objHardnessMT50.Hardnessrneg = 0),
                  (objHardnessMT50.Hardnesspos = 0);
              }
              if (objarrHardnessMT50Reading == undefined) {
                const obj = {
                  idsNo: IdsNo,
                  Readingflag: false,
                  RhCounter: 0,
                  sampleFromString: 0,
                  localSampleCounter: 0,
                  SampleSkipped: false,
                  atPresent: false,
                };
                globalData.arrHardnessMT50Reading.push(obj);
              } else {
                (objarrHardnessMT50Reading.idsNo = IdsNo),
                  (objarrHardnessMT50Reading.Readingflag = false),
                  (objarrHardnessMT50Reading.RhCounter = 0),
                  (objarrHardnessMT50Reading.SampleSkipped = false),
                  (objarrHardnessMT50Reading.atPresent = false),
                  (objarrHardnessMT50Reading.sampleFromString = 0),
                  (objarrHardnessMT50Reading.localSampleCounter = 0);
              }
            }
            if (objIncompIdHardness == undefined) {
              const obj = {
                idsNo: IdsNo,
                incompRepSerNo: 0,
              };
              globalData.hardnessIncompleteId.push(obj);
            }
          } else if (hardnessModel != "Dr Schleuniger") {
            /**
             * CIPLA
             * HARDNESS 125 & 425
             */
            if (objHardness == undefined) {
              const obj = {
                idsNo: IdsNo,
                dimensionParam: 0,
                thicknessVal: 0,
                thicknessDecimal: 0,
                dimensionVal: 0,
                dimensionDecimal: 0,
                sampleNo: 0,
                hardnessVal: 0,
                hardnessDecimal: 0,
                colName: "",
                opNominal: 0,
                opNegTol: 0,
                opPosTol: 0,
                thicknessNom: 0,
                thicknesneg: 0,
                thicknespos: 0,
                mgcnt:0,
                mmcnt:0,
                ncnt:0,
                linecnt:[],
                rhcnt:0,
                dataValues:[],
                isFirstSampleSaved:false,
                moveToComplete:false
              };
              globalData.arrHardness425.push(obj);
            } else {
              objHardness.thicknessVal = 0;
              objHardness.thicknessDecimal = 0;
              objHardness.dimensionVal = 0;
              objHardness.dimensionDecimal = 0;
              objHardness.hardnessVal = 0;
              objHardness.hardnessDecimal = 0;
              (objHardness.sampleNo = 0),
                (objHardness.dimensionParam = 0),
                (objHardness.colName = ""),
                (objHardness.opNominal = 0),
                (objHardness.opNegTol = 0),
                (objHardness.opPosTol = 0),
                (objHardness.thicknessNom = 0),
                (objHardness.thicknesneg = 0),
                (objHardness.thicknespos = 0);
                objHardness.mgcnt = 0;
                objHardness.mmcnt = 0;
                objHardness.ncnt = 0;
                objHardness.linecnt = [];
                objHardness.rhcnt = 0;
                objHardness.dataValues = [];
                objHardness.isFirstSampleSaved = false;
                objHardness.moveToComplete = true;
            }

            if (objHardness1050 == undefined) {
              globalData.arrHardnessTH1050.push({
                idsNo: IdsNo,
                arr_heading: [],
                arr_reading: [],
                arr_info: [],
                extractSample: false,
                sampleno: 0,
                currentsampleno: 0,
                masterEntryFlag: false,
                capacityFlag: false
              });
            } else {
              objHardness1050.arr_heading = [];
              objHardness1050.arr_reading = [];
              objHardness1050.arr_info = [];
            }

            var objIncompIdHardness = globalData.hardnessIncompleteId.find(
              (sr) => sr.idsNo == IdsNo
            );
            if (objIncompIdHardness == undefined) {
              const obj = {
                idsNo: IdsNo,
                incompRepSerNo: 0,
              };
              globalData.hardnessIncompleteId.push(obj);
            }
          } else {
            /**
             * SUN PHARMA GPN/IN/184
             * 8M Dr.Schleuniger Pharmatron AG V1.35*
             */
            var tempHardnessReadings =
              globalData.arrHardnessDRSCPharmatron.find(
                (k) => k.idsNo == IdsNo
              );
            if (tempHardnessReadings == undefined) {
              globalData.arrHardnessDRSCPharmatron.push({
                idsNo: IdsNo,
                oc: 0,
                hardnessFlag: false,
                arr: [],
                capacityFlag: false,
                masterId: 0,
                masterEntryFlag: false,
              });
            } else {
              tempHardnessReadings.oc = 0;
              tempHardnessReadings.arr = [];
              tempHardnessReadings.capacityFlag = false;
              tempHardnessReadings.hardnessFlag = false;
              tempHardnessReadings.masterId = 0;
              tempHardnessReadings.masterEntryFlag = false;
            }
          }

          var Obj = globalData.arr_menuList.find(
            (k) => k.MenuName == "Hardness"
          );
          // var upperLimit = formulaFun.upperLimit1(parseInt(tempLimitObj.Hardness.nominal), tempLimitObj.Hardness.T1Pos);
          // var lowerLimit = formulaFun.lowerLimit1(parseInt(tempLimitObj.Hardness.nominal), tempLimitObj.Hardness.T1Neg);
          var upperLimit =
            tempLimitObj.Hardness == undefined
              ? 0
              : tempLimitObj.Hardness.T1Pos;
          var lowerLimit =
            tempLimitObj.Hardness == undefined
              ? 0
              : tempLimitObj.Hardness.T1Neg;
          var noOfsamples =
            tempLimitObj.Hardness == undefined
              ? 0
              : tempLimitObj.Hardness.noOfSamples;
          var unit =
            tempLimitObj.Hardness == undefined
              ? "N"
              : tempLimitObj.Hardness.unit;
          noOfsamples = ("00" + noOfsamples).slice(-3);
          if (unit == "N") {
            // upperLimit = parseFloat(upperLimit).toFixed(0);
            // lowerLimit = parseFloat(lowerLimit).toFixed(0);

            parseFloat(upperLimit).toFixed(0) == '99999' ? upperLimit = "0" : upperLimit = parseFloat(upperLimit).toFixed(0);
            parseFloat(lowerLimit).toFixed(0) == '99999' ? lowerLimit = "0" : lowerLimit = parseFloat(lowerLimit).toFixed(0);

          } else {
            // FOR KP, SC
            upperLimit = parseFloat(upperLimit).toFixed(1);
            lowerLimit = parseFloat(lowerLimit).toFixed(1);
          }

          let strHardMenu = "HARDNS";
          strHardMenu = isMultiParam == 0 ? "HARDNS" : "TABTES";
          if (isMultiParam == 1) {
            var tempIPQCobj = globalData.arr_IPQCRelIds.find(
              (k) => k.idsNo == IdsNo
            );
            let selectedIds;
            if (tempIPQCobj != undefined) {
              // IPQC Cubicles
              selectedIds = tempIPQCobj.selectedIds;
            } else {
              selectedIds = IdsNo;
            }
            var selectProdDetObj = {
              str_tableName: "tbl_cubical",
              data: "*",
              condition: [
                { str_colName: "Sys_IDSNo", value: selectedIds, comp: "eq" },
              ],
            };
            var result = await database.select(selectProdDetObj);
            let cno = result[0][0].Sys_CubicNo;
            var slectProductSamples = {
              str_tableName: "tbl_cubicle_product_sample",
              data: "*",
              condition: [
                { str_colName: "Sys_CubicNo", value: cno, comp: "eq" },
              ],
            };
            var resultSample = await database.select(slectProductSamples);
            upperLimit = "NA";
            lowerLimit = "NA";
            unit = "";
            noOfsamples = resultSample[0][0].Individual;
            noOfsamples = ("00" + noOfsamples).slice(-3);
          }
          if (serverConfig.ProjectName == "MLVeer") {
            var tempSide = "";
            var tableName = "tbl_tab_master7";
            if (
              hardnessModel == "Kraemer" ||
              hardnessModel == "Dr Schleuniger"
            ) {
              if (side == "L") {
                tempSide = await this.CheckPendingSideWeighment(
                  tempCubicleObject,
                  tableName
                );
                objproductlimits.Hardness.side = tempSide;
                strReturnProtocol = `MS${MenuType}${intInstrumentID}${tempSide}${strHardMenu},${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${unit},`;
              } else {
                strReturnProtocol = `MS${MenuType}${intInstrumentID}${side}${strHardMenu},${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${unit},`;
              }
            } else {
              strReturnProtocol = `MS${MenuType}${intInstrumentID}${side}${strHardMenu},${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${unit},`;
            }
          } else {
            //***************commented and added by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
            //strReturnProtocol = `MS${MenuType}${intInstrumentID}${side}HARDNS,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0`;
            strReturnProtocol = `MS${MenuType}${intInstrumentID}${side}${strHardMenu},${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${unit},`;
            //************************************************************************* *****************************************************/
          }

          return strReturnProtocol;
          break;
        case "FRIABILATOR":
          objMonitor.monit({
            case: "MS",
            idsNo: IdsNo,
            data: { menu: "FRIABILATOR" },
          });
          var fribSide = "R";
          if (side == "L") {
            fribSide = "R";
          } else {
            fribSide = side;
          }
          let objInvalidBulk = globalData.arrBulkInvalid.find(
            (k) => k.idsNo == IdsNo
          );
          if (objInvalidBulk == undefined) {
            const objBulkInvalid = new IBulkInvalid();
            objBulkInvalid.invalidObj.idsNo = IdsNo;
            globalData.arrBulkInvalid.push(objBulkInvalid.invalidObj);
          } else {
            const objBulkInvalid = new IBulkInvalid();
            objBulkInvalid.invalidObj.idsNo = IdsNo;
            objBulkInvalid.invalidObj.Friabilitor.invalid = false;
            objBulkInvalid.invalidObj.Friabilitor.invalidMsg = "";
            Object.assign(objInvalidBulk, objBulkInvalid.invalidObj);
          }

          var Obj = globalData.arr_menuList.find(
            (k) => k.MenuName == "Friability"
          );
          var upperLimit = formulaFun.upperLimit1(
            parseInt(tempLimitObj.Friability.nominal),
            tempLimitObj.Friability.T1Pos
          );
          var lowerLimit = formulaFun.lowerLimit1(
            parseInt(tempLimitObj.Friability.nominal),
            tempLimitObj.Friability.T1Neg
          );
          let nmt = tempLimitObj.Friability.nominal;
          var noOfsamples = tempLimitObj.Friability.noOfSamples;
          noOfsamples = ("00" + noOfsamples).slice(-3);
          //***************commented and added by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
          //strReturnProtocol = `MS${MenuType}${intInstrumentID}${fribSide}FRIABL,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0`;
          //strReturnProtocol = `MS${MenuType}${intInstrumentID}${fribSide}FRIABL,${upperLimit},${lowerLimit},${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Friability.unit},`;
          strReturnProtocol = `MS${MenuType}${intInstrumentID}${fribSide}FRIABL,${nmt},0,${noOfsamples},${timeOutPeriod},0,${tempLimitObj.Friability.unit},`;
          //************************************************************************* *****************************************************/
          var tempFriabilityObj = globalData.arrFriabilityData.find(
            (td) => td.idsNo == IdsNo
          );
          if (tempFriabilityObj == undefined) {
            globalData.arrFriabilityData.push({
              idsNo: IdsNo,
              version: undefined,
              arr: [],
            });
          } else {
            tempFriabilityObj.arr = [];
          }
          //resolve(strReturnProtocol)
          return strReturnProtocol;
          break;
        case "TAPPED DENSITY":
          objMonitor.monit({
            case: "MS",
            idsNo: IdsNo,
            data: { menu: "TapDensity" },
          });
          var Obj = globalData.arr_menuList.find(
            (k) => k.MenuName == "TapDensity"
          );
          var upperLimit = formulaFun.FormatNumber(tempLimitObj.TDT.T1Pos, 4);
          var lowerLimit = formulaFun.FormatNumber(tempLimitObj.TDT.T1Neg, 4);
          var noOfsamples = tempLimitObj.TDT.noOfSamples;
          noOfsamples = ("00" + noOfsamples).slice(-3);
          //***************commented and added by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
          //strReturnProtocol = `MS${MenuType}${intInstrumentID}${side}TDT,${upperLimit},${lowerLimit},N.A,${timeOutPeriod},1`;
          strReturnProtocol = `MS${MenuType}${intInstrumentID}${side}TDT   ,${upperLimit},${lowerLimit},N.A,${timeOutPeriod},1,${tempLimitObj.TDT.unit},`;
          //************************************************************************* *****************************************************/
          var tempTDObj = globalData.arrTDTData.find((td) => td.idsNo == IdsNo);
          if (tempTDObj == undefined) {
            globalData.arrTDTData.push({ idsNo: IdsNo, arr: [], version: undefined });
          } else {
            tempTDObj.arr = [];
            tempTDObj.version = undefined;
          }

          return strReturnProtocol;
          break;
        case "MOISTURE ANALYZER":
          objMonitor.monit({ case: "MS", idsNo: IdsNo, data: { menu: "LOD" } });
          var objLodData = globalData.arrLodData.find(
            (LD) => LD.idsNo == IdsNo
          );
          if (objLodData == undefined) {
            globalData.arrLodData.push({ idsNo: IdsNo, arr: [], counter: 0 });
          } else {
            objLodData.arr = [];
          }

          if (
            tempCubicleObject.Sys_Area == "Effervescent Granulation" ||
            tempCubicleObject.Sys_Area == "Granulation" ||
            tempCubicleObject.Sys_Area == "Pallet Coating" ||
            tempCubicleObject.Sys_Area == "Pellets-II" ||
            tempCubicleObject.Sys_Area == "MFG-1 Processing Area" ||
            tempCubicleObject.Sys_Area == "MFG-1 Blending Area" ||
            tempCubicleObject.Sys_Area == "MFG-3 IPQC" ||
            tempCubicleObject.Sys_Area == "MFG-2 Processing Area" ||
            tempCubicleObject.Sys_Area == "MFG-2 Blending Area" ||
            tempCubicleObject.Sys_Area == "MFG-8 Processing Area" ||
            tempCubicleObject.Sys_Area == "MFG-8 IPQC" ||
            tempCubicleObject.Sys_Area == "MFG-5 Capsule" ||
            tempCubicleObject.Sys_Area == "MFG-6 Capsule" ||
            tempCubicleObject.Sys_Area == "Pellet IPQC"
          ) {
            // Here we have to print list of LOD'd and use of LS protocol.
            // check if present then insert or simply update
            let tempMenuTypeObj = globalData.arrGranulationMenuType.find(
              (k) => k.IdsNo == IdsNo
            );
            if (tempMenuTypeObj == undefined) {
              globalData.arrGranulationMenuType.push({
                idsNo: IdsNo,
                LODMenuType: MenuType,
              });
            } else {
              tempMenuTypeObj.LODMenuType = MenuType;
            }
            strReturnProtocol = `LDQ01`;
            let TempArrayLimitsObj = globalData.arr_limits.find(
              (k) => k.idsNo == IdsNo
            );
            if (TempArrayLimitsObj["GRNDRY"] != undefined) {
              strReturnProtocol += `GRANULES DRY,`;
            }
            if (TempArrayLimitsObj["GRNLUB"] != undefined) {
              strReturnProtocol += `GRANULES LUB,`;
            }
            if (TempArrayLimitsObj["LAY1DRY"] != undefined) {
              strReturnProtocol += `LAYER1 DRY,`;
            }
            if (TempArrayLimitsObj["LAY1LUB"] != undefined) {
              strReturnProtocol += `LAYER1 LUB,`;
            }
            if (TempArrayLimitsObj["LAY2DRY"] != undefined) {
              strReturnProtocol += `LAYER2 DRY,`;
            }
            if (TempArrayLimitsObj["LAY2LUB"] != undefined) {
              strReturnProtocol += `LAYER2 LUB,`;
            }
            strReturnProtocol = strReturnProtocol + ";";
            return strReturnProtocol;
            //  var Obj = globalData.arr_menuList.find(k => k.MenuName == 'LOD');
          } else {
            var Obj = globalData.arr_menuList.find((k) => k.MenuName == "LOD");
            var upperLimit = formulaFun.upperLimit1(
              tempLimitObj.LOD.nominal,
              tempLimitObj.LOD.T1Pos
            );
            var lowerLimit = formulaFun.lowerLimit1(
              tempLimitObj.LOD.nominal,
              tempLimitObj.LOD.T1Neg
            );
            var noOfsamples = tempLimitObj.LOD.noOfSamples;
            noOfsamples = ("00" + noOfsamples).slice(-3);
            //***************commented and added by vivek to display Unit using MS protocl in Rage 19/08/2020*************************************** */
            //strReturnProtocol = `MS${MenuType}${intInstrumentID}${side}LOD,${upperLimit},${lowerLimit},N.A,${timeOutPeriod},1`;
            strReturnProtocol = `MS${MenuType}${intInstrumentID}${side}LOD   ,${upperLimit},${lowerLimit},N.A,${timeOutPeriod},1,${tempLimitObj.LOD.unit},`;
            //************************************************************************* *****************************************************/
            return strReturnProtocol;
            break;
          }
      }
    } catch (err) {
      console.log(err);
      return err;
    }
  }
  /**
   * @description When CL Protocol comes then we have to initialize hardness array specially if present in the
   * array
   */
  async handleCLProtocol(IdsNo) {
    var objHardness = globalData.arrHardness425.find((ht) => ht.idsNo == IdsNo);

    if (objHardness == undefined) {
      const obj = {
        idsNo: IdsNo,
        dimensionParam: 0,
        thicknessVal: 0,
        thicknessDecimal: 0,
        dimensionVal: 0,
        dimensionDecimal: 0,
        sampleNo: 0,
        hardnessVal: 0,
        hardnessDecimal: 0,
        colName: "",
        opNominal: 0,
        opNegTol: 0,
        opPosTol: 0,
        thicknessNom: 0,
        thicknesneg: 0,
        thicknespos: 0,
      };
      globalData.arrHardness425.push(obj);
    } else {
      objHardness.thicknessVal = 0;
      objHardness.thicknessDecimal = 0;
      objHardness.dimensionVal = 0;
      objHardness.dimensionDecimal = 0;
      objHardness.hardnessVal = 0;
      objHardness.hardnessDecimal = 0;
      (objHardness.sampleNo = 0),
        (objHardness.dimensionParam = 0),
        (objHardness.colName = ""),
        (objHardness.opNominal = 0),
        (objHardness.opNegTol = 0),
        (objHardness.opPosTol = 0),
        (objHardness.thicknessNom = 0),
        (objHardness.thicknesneg = 0),
        (objHardness.thicknespos = 0);
    }

    let objHardnessMT50 = globalData.arrHardnessMT50.find(
      (ht) => ht.idsNo == IdsNo
    );
    let objarrHardnessMT50Reading = globalData.arrHardnessMT50Reading.find(
      (ht) => ht.idsNo == IdsNo
    );
    if (objHardnessMT50 == undefined) {
      const obj = {
        idsNo: IdsNo,
        dimensionParam: 0,
        sampleNo: 0,
        colName: "",
        thicknessVal: [],
        thicknessDecimal: 0,
        thicknessNom: 0,
        thicknesneg: 0,
        thicknespos: 0,
        WidthVal: [],
        WidthDecimal: 0,
        WidthNom: 0,
        Widthneg: 0,
        Widthpos: 0,
        DiameterVal: [],
        DiameterDecimal: 0,
        DiametereNom: 0,
        Diameterneg: 0,
        Diameterpos: 0,
        HardnessVal: [],
        HardnessDecimal: 0,
        HardnessNom: 0,
        Hardnessrneg: 0,
        Hardnesspos: 0,
        masterId: 0,
      };
      globalData.arrHardnessMT50.push(obj);
    } else {
      (objHardnessMT50.dimensionParam = 0),
        (objHardnessMT50.sampleNo = 0),
        (objHardnessMT50.colName = ""),
        (objHardnessMT50.thicknessVal = []),
        (objHardnessMT50.thicknessDecimal = 0),
        (objHardnessMT50.thicknessNom = 0),
        (objHardnessMT50.thicknesneg = 0),
        (objHardnessMT50.thicknespos = 0),
        (objHardnessMT50.WidthVal = []),
        (objHardnessMT50.WidthDecimal = 0),
        (objHardnessMT50.WidthNom = 0),
        (objHardnessMT50.Widthneg = 0),
        (objHardnessMT50.Widthpos = 0),
        (objHardnessMT50.DiameterVal = []),
        (objHardnessMT50.DiameterDecimal = 0),
        (objHardnessMT50.DiametereNom = 0),
        (objHardnessMT50.Diameterneg = 0),
        (objHardnessMT50.Diameterpos = 0),
        (objHardnessMT50.HardnessVal = []),
        (objHardnessMT50.HardnessDecimal = 0),
        (objHardnessMT50.HardnessNom = 0),
        (objHardnessMT50.Hardnessrneg = 0),
        (objHardnessMT50.Hardnesspos = 0),
        (objHardnessMT50.masterId = 0);
    }
    if (objarrHardnessMT50Reading == undefined) {
      const obj = {
        idsNo: IdsNo,
        Readingflag: false,
        RhCounter: 0,
        sampleFromString: 0,
        localSampleCounter: 0,
        SampleSkipped: false,
        atPresent: false,
      };
      globalData.arrHardnessMT50Reading.push(obj);
    } else {
      (objarrHardnessMT50Reading.idsNo = IdsNo),
        (objarrHardnessMT50Reading.Readingflag = false),
        (objarrHardnessMT50Reading.RhCounter = 0),
        (objarrHardnessMT50Reading.SampleSkipped = false),
        (objarrHardnessMT50Reading.atPresent = false),
        (objarrHardnessMT50Reading.sampleFromString = 0),
        (objarrHardnessMT50Reading.localSampleCounter = 0);
    }

    var objIncompIdHardness = globalData.hardnessIncompleteId.find(
      (sr) => sr.idsNo == IdsNo
    );
    if (objIncompIdHardness == undefined) {
      const obj = {
        idsNo: IdsNo,
        incompRepSerNo: 0,
      };
      globalData.hardnessIncompleteId.push(obj);
    }

    var tempHardnessReadings = globalData.arrHardnessKramer.find(
      (k) => k.idsNo == IdsNo
    );
    if (tempHardnessReadings == undefined) {
      const obj = {
        idsNo: IdsNo,
        sampleNo: 0,
        masterEntryFlag: false,
        hardnessVal: 0,
        opNominal: 0,
        opNegTol: 0,
        opPosTol: 0,
        arr: [],
      };
      globalData.arrHardnessKramer.push(obj);
    } else {
      (tempHardnessReadings.sampleNo = 0),
        (tempHardnessReadings.masterEntryFlag = false),
        (tempHardnessReadings.hardnessVal = 0),
        (tempHardnessReadings.opNominal = 0),
        (tempHardnessReadings.opNegTol = 0),
        (tempHardnessReadings.arr = []),
        (tempHardnessReadings.opPosTol = 0);
    }
    return "+";
  }
  async CheckDTModel(idsNo) {
    try {
      var cubicInfo = globalData.arrIdsInfo.find((k) => k.Sys_IDSNo == idsNo);
      var DTId = cubicInfo.Sys_DTID;
      var selectOtherEquip = {
        str_tableName: "tbl_otherequipment",
        data: "Eqp_Make",
        condition: [{ str_colName: "Eqp_ID", value: DTId }],
      };
      var result = await database.select(selectOtherEquip);
      return result[0][0].Eqp_Make;
    } catch (err) {
      throw new Error(err);
    }
  }

  async CheckPendingSideWeighment(
    tempCubicleObject,
    tableName,
    weighmentType = "",
    productType = ""
  ) {
    try {
      if (weighmentType == 2) {
        const checMaxRepSerno = {
          str_tableName: tableName,
          data: "max(RepSerNo) as RepSerNo",
          condition: [
            {
              str_colName: "BFGCode",
              value: tempCubicleObject.Sys_BFGCode,
              comp: "eq",
            },
            {
              str_colName: "ProductName",
              value: tempCubicleObject.Sys_ProductName,
              comp: "eq",
            },
            {
              str_colName: "PVersion",
              value: tempCubicleObject.Sys_PVersion,
              comp: "eq",
            },
            {
              str_colName: "Version",
              value: tempCubicleObject.Sys_Version,
              comp: "eq",
            },
            {
              str_colName: "BatchNo",
              value: tempCubicleObject.Sys_Batch,
              comp: "eq",
            },
            {
              str_colName: "CubicleType",
              value: tempCubicleObject.Sys_CubType,
              comp: "eq",
            },
            {
              str_colName: "RepoLabel14",
              value: tempCubicleObject.Sys_IPQCType,
              comp: "eq",
            },
            {
              str_colName: "ReportType",
              value: tempCubicleObject.Sys_RptType,
              comp: "eq",
            },
          ],
        };
        var objchecMaxRepSerno = await database.select(checMaxRepSerno);

        if (objchecMaxRepSerno[0][0].RepSerNo != null) {
          //if there is no record for above product ,batch combination
          var DetailtableName = "tbl_tab_detail2";
          if (productType == 1) {
            DetailtableName = "tbl_tab_detail2";
          } else {
            DetailtableName = "tbl_cap_detail2";
          }

          const checkGrpLHSCount = {
            str_tableName: DetailtableName,
            data: "count(*) as LHSCount",
            condition: [
              {
                str_colName: "RepSerNo",
                value: objchecMaxRepSerno[0][0].RepSerNo,
                comp: "eq",
              },
              { str_colName: "Side", value: "LHS", comp: "eq" },
            ],
          };
          var objcheckGrpLHSCount = await database.select(checkGrpLHSCount);

          const checkGrpRHSCount = {
            str_tableName: DetailtableName,
            data: "count(*) as RHSCount",
            condition: [
              {
                str_colName: "RepSerNo",
                value: objchecMaxRepSerno[0][0].RepSerNo,
                comp: "eq",
              },
              { str_colName: "Side", value: "RHS", comp: "eq" },
            ],
          };
          var objcheckGrpRHSCount = await database.select(checkGrpRHSCount);

          if (
            objcheckGrpLHSCount[0][0].LHSCount ==
            objcheckGrpRHSCount[0][0].RHSCount
          ) {
            return "L";
          } else {
            return "R";
          }
        } else {
          return "L";
        }
      } else {
        const checkLHSCount = {
          str_tableName: tableName,
          data: "count(*) as LHSCount",
          condition: [
            {
              str_colName: "BFGCode",
              value: tempCubicleObject.Sys_BFGCode,
              comp: "eq",
            },
            {
              str_colName: "ProductName",
              value: tempCubicleObject.Sys_ProductName,
              comp: "eq",
            },
            {
              str_colName: "PVersion",
              value: tempCubicleObject.Sys_PVersion,
              comp: "eq",
            },
            {
              str_colName: "Version",
              value: tempCubicleObject.Sys_Version,
              comp: "eq",
            },
            {
              str_colName: "BatchNo",
              value: tempCubicleObject.Sys_Batch,
              comp: "eq",
            },
            //{ str_colName: 'Idsno', value: tempCubicleObject.Sys_IDSNo, comp: 'eq' },
            {
              str_colName: "ReportType",
              value: tempCubicleObject.Sys_RptType,
              comp: "eq",
            },
            { str_colName: "Side", value: "LHS", comp: "eq" },
            {
              str_colName: "CubicleType",
              value: tempCubicleObject.Sys_CubType,
              comp: "eq",
            },
            {
              str_colName: "RepoLabel14",
              value: tempCubicleObject.Sys_IPQCType,
              comp: "eq",
            },
          ],
        };
        var objcheckLHSCount = await database.select(checkLHSCount);

        const checkRHSCount = {
          str_tableName: tableName,
          data: "count(*) as RHSCount",
          condition: [
            {
              str_colName: "BFGCode",
              value: tempCubicleObject.Sys_BFGCode,
              comp: "eq",
            },
            {
              str_colName: "ProductName",
              value: tempCubicleObject.Sys_ProductName,
              comp: "eq",
            },
            {
              str_colName: "PVersion",
              value: tempCubicleObject.Sys_PVersion,
              comp: "eq",
            },
            {
              str_colName: "Version",
              value: tempCubicleObject.Sys_Version,
              comp: "eq",
            },
            {
              str_colName: "BatchNo",
              value: tempCubicleObject.Sys_Batch,
              comp: "eq",
            },
            {
              str_colName: "ReportType",
              value: tempCubicleObject.Sys_RptType,
              comp: "eq",
            },
            { str_colName: "Side", value: "RHS", comp: "eq" },
            {
              str_colName: "CubicleType",
              value: tempCubicleObject.Sys_CubType,
              comp: "eq",
            },
            {
              str_colName: "RepoLabel14",
              value: tempCubicleObject.Sys_IPQCType,
              comp: "eq",
            },
          ],
        };
        var objcheckRHSCount = await database.select(checkRHSCount);

        if (objcheckLHSCount[0][0].LHSCount != 0) {
          if (
            objcheckLHSCount[0][0].LHSCount == objcheckRHSCount[0][0].RHSCount
          ) {
            return "L";
          } else {
            return "R";
          }
        } else {
          return "L";
        }
      }
    } catch (err) {
      throw new Error("Error from CheckPendingSideWeighment = " + err);
    }
  }

  ShowJarMsg(DTModel, MenuType) {
    // here menu type is indicates on which port instrument connected.
    // T for port 4 and H for port 3
    if (DTModel == "Electrolab-ED3PO") {
      var protocolToBeSend = `ESD${MenuType}A01Select Jar A Or Jar, B Or Jar C,,,`;
    } else {
      var protocolToBeSend = `ESD${MenuType}A01Select Jar A Or Jar B,,,,`;
    }
    return protocolToBeSend;
  }
}
module.exports = MenuSelect;
