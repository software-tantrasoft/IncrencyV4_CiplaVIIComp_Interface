const Database = require("../../database/clsQueryProcess");
const database = new Database();
const globalData = require("../../global/globalData");
const moment = require("moment");
const serverConfig = require("../../global/severConfig");
const date = require("date-and-time");
const clsRemarkInComplete = require("../../model/clsRemarkIncomplete");
const objRemarkInComplete = new clsRemarkInComplete();
var Comman = require("./clsCommonFunction");
var comman = new Comman();
const clsActivityLog = require("../../model/clsActivityLogModel");
const objActivityLog = new clsActivityLog();
const sort = require("./checkForPendingCalib");

// created by vivek11101997 on 27 march 2021 powerbackup
class CalibPowerBackup {
  /**
   *
   * @param {*} Cubcial_info
   * @param {*} Weightment_type
   * @param {*} Userinfo
   * @param {*} Idsno
   * @description Method for inserting backup data to `tbl_powerbackup`
   *
   */
  async insertCalibPowerBackupData(RepNo, calibtype, Bal_ID, IdsNo) {
    const tempUserObject = globalData.arrUsers.find((k) => k.IdsNo == IdsNo);
    try {
      var now = new Date();
      //in powerbackup incomplate report serial number is updated at incomplatedatasave after data inserted to incomplate master
      const insertInpowerbakupobj = {
        str_tableName: "tbl_calibpowerbackup",
        data: [
          { str_colName: "RecSampleNo", value: 1 },
          { str_colName: "Inc_RepSerNo", value: RepNo },
          { str_colName: "IdsNo", value: IdsNo },
          { str_colName: "CalibrationType", value: calibtype },
          { str_colName: "BalanceID", value: Bal_ID },
          { str_colName: "UserID", value: tempUserObject.UserId },
          { str_colName: "CalibDate", value: date.format(now, "YYYY-MM-DD") },
        ],
      };
      var result = await database.save(insertInpowerbakupobj);
      return result;
    } catch (err) {
      throw new Error(err);
    }
  }

  async deleteCalibPowerBackupData(CalibrationType, IdsNo) {
    try {
      const tempCubicInfo = globalData.arrIdsInfo.find(
        (k) => k.Sys_IDSNo == parseInt(IdsNo)
      );
      var objOwner = globalData.arrPreWeighCalibOwner.find(
        (k) => k.idsNo == parseInt(IdsNo)
      );
      var strBalId = tempCubicInfo.Sys_BalID;
      if (objOwner != undefined) {
        if (objOwner.owner == "analytical") {
          strBalId = tempCubicInfo.Sys_BalID;
        } else {
          strBalId = tempCubicInfo.Sys_BinBalID;
        }
      }
      if (serverConfig.isPowerBackup) {
        switch (CalibrationType) {
          case "1":
          case "4":
            CalibrationType = "Daily";
            break;

          case "2":
          case "5":
            CalibrationType = "Periodic";
            break;

          case "E":
            CalibrationType = "Eccentricity";
            break;

          case "R":
            CalibrationType = "Repeatability";
            break;
          case "U":
            CalibrationType = "Uncertainty";
            break;
        }

        var deleteObj = {
          str_tableName: "tbl_calibpowerbackup",
          condition: [
            { str_colName: "IdsNo", value: IdsNo },
            { str_colName: "CalibrationType", value: CalibrationType },
            { str_colName: "BalanceID", value: strBalId },
          ],
        };
        // console.log("calibpowerbakup discard");

        return await database.delete(deleteObj);
      }
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }

  async fetchCalibPowerBackupData(IdsNo, calibtype, BAL_ID) {
    try {
      if (serverConfig.isPowerBackup) {
        var selectCalibPowerBackupData = {
          str_tableName: "tbl_calibpowerbackup",
          data: "*",
          condition: [
            { str_colName: "IdsNo", value: IdsNo },
            { str_colName: "CalibrationType", value: calibtype },
            { str_colName: "BalanceID", value: BAL_ID },
          ],
        };
        var result = await database.select(selectCalibPowerBackupData);
        let sendObj = {};
        Object.assign(sendObj, { status: true, result: result[0] });
        return sendObj;
      } else {
        let sendObj = {};
        Object.assign(sendObj, { status: false, result: [] });
        return sendObj;
      }
    } catch (err) {
      throw new Error(err);
    }
  }

  async sendCalibPowerBackupData(
    strReturnProtocol,
    PowerBackupData,
    IdsNo,
    str_IpAddress
  ) {
    try {
      var now = new Date();
      var currentdate = date.format(now, "YYYY-MM-DD");
      var Calibrationname = PowerBackupData[0].CalibrationType;
      const tempUserObject = globalData.arrUsers.find((k) => k.IdsNo == IdsNo);
      var curruser = tempUserObject.UserId;
      var calibtypeforipc = strReturnProtocol.substring(2, 3);
      var ipccalib = false;
      if (calibtypeforipc == "4" || calibtypeforipc == "5") {
        ipccalib = true;
      }
      // var BalanceID = PowerBackupData[0].BalanceID;
      var CalibrationType = "";
      switch (Calibrationname) {
        case "Daily":
          if (ipccalib) {
            CalibrationType = "4";
          } else {
            CalibrationType = "1";
          }

          break;
        case "Periodic":
          if (ipccalib) {
            CalibrationType = "5";
          } else {
            CalibrationType = "2";
          }

          break;
        case "Eccentricity":
          CalibrationType = "E";
          break;
        case "Repeatability":
          CalibrationType = "R";
          break;
        case "Uncertainty":
          CalibrationType = "U";
          break;
      }

      var dayextendfordaily = false;
      var currenttime = date.format(now, "HH:mm:ss");
      if (
        date.format(PowerBackupData[0].CalibDate, "YYYY-MM-DD") !=
          currentdate &&
        currenttime > "07:00:00"
      ) {
        dayextendfordaily = true;
      }

      if (PowerBackupData[0].UserID != curruser) {
        //activitylog
        var objActivity = {};
        var userObj = globalData.arrUsers.find((k) => k.IdsNo == IdsNo);
        Object.assign(
          objActivity,
          { strUserId: userObj.UserId },
          {
            strUserName: userObj.UserName, //sarr_UserData[0].UserName
          },
          {
            activity: `Calibration discarded on IDS ${IdsNo} of User ${PowerBackupData[0].UserID}`,
          }
        );
        await objActivityLog.ActivityLogEntry(objActivity);

        //
      }

      if (
        PowerBackupData[0].UserID != curruser ||
        (dayextendfordaily &&
          (CalibrationType == "1" || CalibrationType == "4"))
      ) {
        console.log("calibpowerbakup discard sendcalib");
        await this.deleteCalibPowerBackupData(Calibrationname, IdsNo);

        //
        if (
          CalibrationType != "4" &&
          CalibrationType != "1"
        ) {
          const tempCubicInfo = globalData.arrIdsInfo.find(
            (k) => k.Sys_IDSNo == parseInt(IdsNo)
          );
          var objOwner = globalData.arrPreWeighCalibOwner.find(
            (k) => k.idsNo == parseInt(IdsNo)
          );
          var strBalId = tempCubicInfo.Sys_BalID;
          if (objOwner != undefined) {
            if (objOwner.owner == "analytical") {
              strBalId = tempCubicInfo.Sys_BalID;
            } else {
              strBalId = tempCubicInfo.Sys_BinBalID;
            }
          }
       
       
          // await this.movingtocalibfailaftercalibpowerbackupdiscard(
          //   CalibrationType,
          //   IdsNo
          // );

         var repnofordelete =  await this.movingtocalibfailafterlogindifferrentUser(strBalId, IdsNo);

         switch (CalibrationType) {
          case "P": case "2" :
            var selectRepSrNoObj = {
              str_tableName: "tbl_calibration_periodic_master_incomplete",
              data: "Periodic_RepNo",
              condition: [
                { str_colName: "Periodic_BalID", value: strBalId, comp: "eq" },
              ],
            };
            var result = await database.select(selectRepSrNoObj);
            var int_periodic_RepNo = result[0][0].Periodic_RepNo;
            await comman.calibfailmovingallcalibrationentries("P", strBalId, int_periodic_RepNo,repnofordelete);

            break;

          case "E":
            var selectRepSrNoObj = {
              str_tableName: "tbl_calibration_eccentricity_master_incomplete",
              data: "Eccent_RepNo",
              condition: [
                { str_colName: "Eccent_BalID", value: strBalId, comp: "eq" },
              ],
            };
            var result = await database.select(selectRepSrNoObj);
            var Eccent_RepNo = result[0][0].Eccent_RepNo;
            await comman.calibfailmovingallcalibrationentries("E", strBalId, Eccent_RepNo,repnofordelete);
            break;

          case "R":
            var selectRepSrNoObj = {
              str_tableName: "tbl_calibration_repetability_master_incomplete",
              data: "Repet_RepNo",
              condition: [
                { str_colName: "Repet_BalID", value: strBalId, comp: "eq" },
              ],
            };
            var result = await database.select(selectRepSrNoObj);
            var Repet_RepNo = result[0][0].Repet_RepNo;
            await comman.calibfailmovingallcalibrationentries("R", strBalId, Repet_RepNo,repnofordelete);
            break;

          case "U":
            var selectRepSrNoObj = {
              str_tableName: "tbl_calibration_uncertinity_master_incomplete",
              data: "Uncertinity_RepNo",
              condition: [
                {
                  str_colName: "Uncertinity_BalID",
                  value: strBalId,
                  comp: "eq",
                },
              ],
            };
            var result = await database.select(selectRepSrNoObj);
            var Uncertinity_RepNo = result[0][0].Uncertinity_RepNo;
            await comman.calibfailmovingallcalibrationentries("U", strBalId, Uncertinity_RepNo,repnofordelete);
            break;
        }

       
         
        }
        return "DIFUSER";
       
      }
      return `VI${CalibrationType}1${Calibrationname},calibration pending,`;
    } catch (err) {
      throw new Error(err);  
    }
  }


  async movingtocalibfailaftercalibpowerbackupdiscard(CalibrationType, IdsNo) {
    const tempCubicInfo = globalData.arrIdsInfo.find(
      (k) => k.Sys_IDSNo == parseInt(IdsNo)
    );
    var objOwner = globalData.arrPreWeighCalibOwner.find(
      (k) => k.idsNo == parseInt(IdsNo)
    );
    var strBalId = tempCubicInfo.Sys_BalID;
    if (objOwner != undefined) {
      if (objOwner.owner == "analytical") {
        strBalId = tempCubicInfo.Sys_BalID;
      } else {
        strBalId = tempCubicInfo.Sys_BinBalID;
      }
    }

    switch (CalibrationType) {
      case "2":
      case "5":
        var selectRepSrNoObj = {
          str_tableName: "tbl_calibration_periodic_master_incomplete",
          data: "Periodic_RepNo",
          condition: [
            { str_colName: "Periodic_BalID", value: strBalId, comp: "eq" },
          ],
        };
        var result = await database.select(selectRepSrNoObj);
        var int_periodic_RepNo = result[0][0].Periodic_RepNo;
        await comman.caibrationFails("P", strBalId, int_periodic_RepNo);
        break;

      case "E":
        var selectRepSrNoObj = {
          str_tableName: "tbl_calibration_eccentricity_master_incomplete",
          data: "Eccent_RepNo",
          condition: [
            { str_colName: "Eccent_BalID", value: strBalId, comp: "eq" },
          ],
        };
        var result = await database.select(selectRepSrNoObj);
        var Eccent_RepNo = result[0][0].Eccent_RepNo;
        await comman.caibrationFails("E", strBalId, Eccent_RepNo);
        break;

      case "R":
        var selectRepSrNoObj = {
          str_tableName: "tbl_calibration_repetability_master_incomplete",
          data: "Repet_RepNo",
          condition: [
            { str_colName: "Repet_BalID", value: strBalId, comp: "eq" },
          ],
        };
        var result = await database.select(selectRepSrNoObj);
        var Repet_RepNo = result[0][0].Repet_RepNo;
        await comman.caibrationFails("R", strBalId, Repet_RepNo);
        break;

      case "U":
        console.log("deletewrong");
        var selectRepSrNoObj = {
          str_tableName: "tbl_calibration_uncertinity_master_incomplete",
          data: "Uncertinity_RepNo",
          condition: [
            { str_colName: "Uncertinity_BalID", value: strBalId, comp: "eq" },
          ],
        };
        var result = await database.select(selectRepSrNoObj);
        var Uncertinity_RepNo = result[0][0].Uncertinity_RepNo;
        await comman.caibrationFails("U", strBalId, Uncertinity_RepNo);
        break;
    }
  }

  async deletepowerbackupaftercalibterminated(IdsNo) {
    const tempCubicInfo = globalData.arrIdsInfo.find(
      (k) => k.Sys_IDSNo == parseInt(IdsNo)
    );
    var objOwner = globalData.arrPreWeighCalibOwner.find(
      (k) => k.idsNo == parseInt(IdsNo)
    );
    var strBalId = tempCubicInfo.Sys_BalID;
    if (objOwner != undefined) {
      if (objOwner.owner == "analytical") {
        strBalId = tempCubicInfo.Sys_BalID;
      } else {
        strBalId = tempCubicInfo.Sys_BinBalID;
      }
    }

    var selectCalibPowerBackupData = {
      str_tableName: "tbl_calibpowerbackup",
      data: "*",
      condition: [
        { str_colName: "IdsNo", value: IdsNo },
        { str_colName: "BalanceID", value: strBalId },
      ],
    };
    var result = await database.select(selectCalibPowerBackupData);
    if (result[0].length > 0) {
      var deleteObj = {
        str_tableName: "tbl_calibpowerbackup",
        condition: [
          { str_colName: "IdsNo", value: IdsNo },
          { str_colName: "BalanceID", value: strBalId },
        ],
      };
      console.log("calibpowerbakup discard  AFTER LO");

      await database.delete(deleteObj);

      var CalibrationType = result[0][0].CalibrationType;
      //ACTIVITYLOG
      var objActivity = {};
      var userObj = globalData.arrUsers.find((k) => k.IdsNo == IdsNo);
      Object.assign(
        objActivity,
        { strUserId: userObj.UserId },
        {
          strUserName: userObj.UserName, //sarr_UserData[0].UserName
        },
        { activity: `${CalibrationType}  Calibration Discarded on IDS ` + IdsNo }
      );
      await objActivityLog.ActivityLogEntry(objActivity);
      //

      switch (CalibrationType) {
        case "Daily":
          CalibrationType = "1";
          break;
        case "Periodic":
          CalibrationType = "2";
          break;
        case "Eccentricity":
          CalibrationType = "E";
          break;
        case "Repeatability":
          CalibrationType = "R";
          break;
        case "Uncertainty":
          CalibrationType = "U";
          break;
      }

      if (CalibrationType != "D" && CalibrationType != "1") {
        await this.movingtocalibfailaftercalibpowerbackupdiscard(
          CalibrationType,
          IdsNo
        );
      }
    }
  }

  async movingtocalibfailafterlogindifferrentUser_old(strBalId, IdsNo) {
    var BalanceRecalibStatusObject = globalData.arrBalanceRecalibStatus.find(
      (k) => k.Bal_ID == strBalId
    );
    var tempCalibStatus = globalData.calibrationStatus.find(
      (k) => k.BalId == strBalId
    );
    var count = 0 ;
    var sortedArray = await sort.sortedSeqArray(
      globalData.arrSortedCalib,
      strBalId
    );
    var arr_CalibArray = []; // array holds calibration which done and one which failed
    for (let i = 0; i < sortedArray.length; i++) {
      arr_CalibArray.push(sortedArray[i]);
    }

    for (let i = 0; i < tempCalibStatus.status.length; i++) {
      if(tempCalibStatus.status[i] == "1"){
        arr_CalibArray[i] = "1";

      }
      
    }

    for (var i in tempCalibStatus.status) {
      if (tempCalibStatus.status[i] == "1") {
        switch (i) {
          case "P":
            var selectRepSrNoObj = {
              str_tableName: "tbl_calibration_periodic_master_incomplete",
              data: "Periodic_RepNo",
              condition: [
                { str_colName: "Periodic_BalID", value: strBalId, comp: "eq" },
              ],
            };
            var result = await database.select(selectRepSrNoObj);
            var int_periodic_RepNo = result[0][0].Periodic_RepNo;
            await comman.caibrationFails("P", strBalId, int_periodic_RepNo);

            break;

          case "E":
            var selectRepSrNoObj = {
              str_tableName: "tbl_calibration_eccentricity_master_incomplete",
              data: "Eccent_RepNo",
              condition: [
                { str_colName: "Eccent_BalID", value: strBalId, comp: "eq" },
              ],
            };
            var result = await database.select(selectRepSrNoObj);
            var Eccent_RepNo = result[0][0].Eccent_RepNo;
            await comman.caibrationFails("E", strBalId, Eccent_RepNo);
            break;

          case "R":
            var selectRepSrNoObj = {
              str_tableName: "tbl_calibration_repetability_master_incomplete",
              data: "Repet_RepNo",
              condition: [
                { str_colName: "Repet_BalID", value: strBalId, comp: "eq" },
              ],
            };
            var result = await database.select(selectRepSrNoObj);
            var Repet_RepNo = result[0][0].Repet_RepNo;
            await comman.caibrationFails("R", strBalId, Repet_RepNo);
            break;

          case "U":
           
            count = count + 1 ;
            console.log(count);
            var selectRepSrNoObj = {
              str_tableName: "tbl_calibration_uncertinity_master_incomplete",
              data: "Uncertinity_RepNo",
              condition: [
                {
                  str_colName: "Uncertinity_BalID",
                  value: strBalId,
                  comp: "eq",
                },
              ],
            };
            var result = await database.select(selectRepSrNoObj);
            var Uncertinity_RepNo = result[0][0].Uncertinity_RepNo;
            await comman.caibrationFails("U", strBalId, Uncertinity_RepNo);
            break;
        }
      }
    }

    // await comman.UpdateRecalibFLagPeriodic(strBalId, IdsNo);
    // BalanceRecalibStatusObject.PeriodicBalRecalib = 0;

    const updateCalibstatusObj = {
      str_tableName: "tbl_calibration_status",
      data: [
        { str_colName: "P", value: 0 },
        { str_colName: "U", value: 0 },
        { str_colName: "R", value: 0 },
        { str_colName: "E", value: 0 },
     
       
      ],
      condition: [{ str_colName: "BalID", value: strBalId }],
    };
    await database.update(updateCalibstatusObj);
    for (var i in globalData.calibrationStatus) {
      if (globalData.calibrationStatus[i].BalId == strBalId) {
        globalData.calibrationStatus[i].status["P"] = 0;
        globalData.calibrationStatus[i].status["U"] = 0;
        globalData.calibrationStatus[i].status["R"] = 0;
        globalData.calibrationStatus[i].status["E"] = 0;
        break; //Stop this loop, we found it!
      }
    }
  }

  async movingtocalibfailafterlogindifferrentUser(strBalId, IdsNo) {
    var BalanceRecalibStatusObject = globalData.arrBalanceRecalibStatus.find(
      (k) => k.Bal_ID == strBalId
    );
    var tempCalibStatus = globalData.calibrationStatus.find(
      (k) => k.BalId == strBalId
    );
    var count = 0 ;
  
    var sortedArray = await sort.sortedSeqArray(
      globalData.arrSortedCalib,
      strBalId
    );

    for (var i in tempCalibStatus.status) {
      if(tempCalibStatus.status[i] == 1){
       count = count + 1 ;
      }   
    }
    // var int_curentCalibrationIndex = sortedArray.indexOf(CalibrationType);
    var str_first_calibration = sortedArray[0];
    var arr_CalibArray = []; // array holds calibration which done and one which failed
    for (let i = 0; i < count; i++) {
      arr_CalibArray.push(sortedArray[i]);
    }

    var fRerSrNo = await comman.getFrepSrNo(str_first_calibration);
    // fRerSrNo is failed repSrNo which will insert   in all failed tables
    //
    for (let i = 0; i < arr_CalibArray.length; i++)  {
        switch (arr_CalibArray[i]) {
          case "P":
            var selectRepSrNoObj = {
              str_tableName: "tbl_calibration_periodic_master_incomplete",
              data: "Periodic_RepNo",
              condition: [
                { str_colName: "Periodic_BalID", value: strBalId, comp: "eq" },
              ],
            };
            var result = await database.select(selectRepSrNoObj);
            var int_periodic_RepNo = result[0][0].Periodic_RepNo;
            await comman.calibfailmovingallcalibrationentries("P", strBalId, int_periodic_RepNo,fRerSrNo);

            break;

          case "E":
            var selectRepSrNoObj = {
              str_tableName: "tbl_calibration_eccentricity_master_incomplete",
              data: "Eccent_RepNo",
              condition: [
                { str_colName: "Eccent_BalID", value: strBalId, comp: "eq" },
              ],
            };
            var result = await database.select(selectRepSrNoObj);
            var Eccent_RepNo = result[0][0].Eccent_RepNo;
            await comman.calibfailmovingallcalibrationentries("E", strBalId, Eccent_RepNo,fRerSrNo);
            break;

          case "R":
            var selectRepSrNoObj = {
              str_tableName: "tbl_calibration_repetability_master_incomplete",
              data: "Repet_RepNo",
              condition: [
                { str_colName: "Repet_BalID", value: strBalId, comp: "eq" },
              ],
            };
            var result = await database.select(selectRepSrNoObj);
            var Repet_RepNo = result[0][0].Repet_RepNo;
            await comman.calibfailmovingallcalibrationentries("R", strBalId, Repet_RepNo,fRerSrNo);
            break;

          case "U":
            var selectRepSrNoObj = {
              str_tableName: "tbl_calibration_uncertinity_master_incomplete",
              data: "Uncertinity_RepNo",
              condition: [
                {
                  str_colName: "Uncertinity_BalID",
                  value: strBalId,
                  comp: "eq",
                },
              ],
            };
            var result = await database.select(selectRepSrNoObj);
            var Uncertinity_RepNo = result[0][0].Uncertinity_RepNo;
            await comman.calibfailmovingallcalibrationentries("U", strBalId, Uncertinity_RepNo,fRerSrNo);
            break;
        }
      }
    

    // await comman.UpdateRecalibFLagPeriodic(strBalId, IdsNo);
    // BalanceRecalibStatusObject.PeriodicBalRecalib = 0;

    const updateCalibstatusObj = {
      str_tableName: "tbl_calibration_status",
      data: [
        { str_colName: "P", value: 0 },
        { str_colName: "U", value: 0 },
        { str_colName: "R", value: 0 },
        { str_colName: "E", value: 0 },
     
       
      ],
      condition: [{ str_colName: "BalID", value: strBalId }],
    };
    await database.update(updateCalibstatusObj);
    for (var i in globalData.calibrationStatus) {
      if (globalData.calibrationStatus[i].BalId == strBalId) {
        globalData.calibrationStatus[i].status["P"] = 0;
        globalData.calibrationStatus[i].status["U"] = 0;
        globalData.calibrationStatus[i].status["R"] = 0;
        globalData.calibrationStatus[i].status["E"] = 0;
        break; //Stop this loop, we found it!
      }
    }

    return fRerSrNo ;
  }
  
}
module.exports = CalibPowerBackup;
CalibPowerBackup