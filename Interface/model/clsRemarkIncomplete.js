const Database = require("../database/clsQueryProcess");
const globalData = require("../global/globalData");
const objDatabase = new Database();
const serverConfig = require("../global/severConfig");
const clsCommonFun = require('../model/Calibration/clsCommonFunction');
const objCommanFun = new clsCommonFun();
class ReportIncomplete {
   // async updateEntry(IdsNo, type, BatchNo) {
   //    var selectedIds;
   //    let instrument = "";
   //    var IPQCObject = globalData.arr_IPQCRelIds.find((k) => k.idsNo == IdsNo);
   //    var productType = globalData.arrProductTypeArray.find(
   //       (k) => k.idsNo == IdsNo
   //    );
   //    var objMenuMLHR = globalData.arrMultihealerMS.find((k) => k.idsNo == IdsNo);
   //    if (IPQCObject != undefined) {
   //       selectedIds = IPQCObject.selectedIds;
   //    } else {
   //       selectedIds = IdsNo;
   //    }
   //    var cubicalObj = globalData.arrIdsInfo.find(
   //       (k) => k.Sys_IDSNo == selectedIds
   //    );
   //    let IncompleteTableName = "";
   //    let ParamName = "";
   //    switch (type) {
   //       case "1":
   //          if (
   //             cubicalObj.Sys_Area != "Capsule Filling" &&
   //             productType.productType == "1"
   //          ) {
   //             IncompleteTableName = "tbl_tab_master1_incomplete";
   //          } else {
   //             IncompleteTableName = "tbl_cap_master1_incomplete";
   //          }
   //          ParamName = "Ind";
   //          instrument = "BALANCE";
   //          break;
   //       case "3":
   //          if (productType.productType == "1") {
   //             IncompleteTableName = "tbl_tab_master3_incomplete";
   //             ParamName = "Thickness";
   //          }
   //          instrument = "VERNIER";

   //          break;
   //       case "4":
   //          if (
   //             cubicalObj.Sys_Area != "Capsule Filling" &&
   //             productType.productType == "1"
   //          ) {
   //             IncompleteTableName = "tbl_tab_master4_incomplete";
   //             ParamName = "Breadth";
   //          } else {
   //             IncompleteTableName = "tbl_cap_master4_incomplete";
   //             ParamName = "Diameter";
   //          }
   //          instrument = "VERNIER";
   //          break;
   //       case "5":
   //          if (
   //             cubicalObj.Sys_Area != "Capsule Filling" &&
   //             productType.productType == "1"
   //          ) {
   //             IncompleteTableName = "tbl_tab_master5_incomplete";
   //          } else {
   //             IncompleteTableName = "tbl_cap_master5_incomplete";
   //          }
   //          ParamName = "Length";
   //          instrument = "VERNIER";
   //          break;
   //       case "6":
   //          if (productType.productType == "1") {
   //             IncompleteTableName = "tbl_tab_master6_incomplete";
   //             ParamName = "Diameter";
   //          }
   //          instrument = "VERNIER";
   //          break;

   //       case "8":
   //          IncompleteTableName = "tbl_tab_master9_incomplete";
   //          ParamName = "Ind Layer 1";
   //          if (serverConfig.ProjectName == "RBH") {
   //             ParamName = "Ind Empty";
   //          }
   //          instrument = "BALANCE";

   //          break;
   //       case "11":
   //          IncompleteTableName = "tbl_tab_master11_incomplete";
   //          ParamName = "Ind Layer 2";
   //          instrument = "BALANCE";
   //          break;
   //       case "L":
   //          IncompleteTableName = "tbl_tab_master11_incomplete";
   //          ParamName = "Ind Layer 2";
   //          instrument = "BALANCE";
   //          break;
   //       case "P":
   //          if (productType.productType == "1") {
   //             IncompleteTableName = "tbl_tab_master18_incomplete";
   //          } else {
   //             IncompleteTableName = "tbl_cap_master18_incomplete";
   //          }
   //          ParamName = "PRTSIZE";
   //          instrument = "BALANCE";
   //          break;
   //       case "F":
   //          if (productType.productType == "1") {
   //             IncompleteTableName = "tbl_tab_master17_incomplete";
   //          } else {
   //             IncompleteTableName = "tbl_cap_master17_incomplete";
   //          }
   //          ParamName = "%Fine";
   //          instrument = "BALANCE";
   //          break;
   //       case "D":
   //          if (productType.productType == "2") {
   //             IncompleteTableName = "tbl_cap_master3_incomplete";
   //             ParamName = "Differential";
   //          }
   //          instrument = "BALANCE";
   //          break;
   //       case "Hardness":
   //          IncompleteTableName = "tbl_tab_masterhtd_incomplete";
   //          ParamName = "Hardness";
   //          instrument = "Hardness";
   //          break;
   //       case "Tablet Tester":
   //          IncompleteTableName = "tbl_tab_masterhtd_incomplete";
   //          ParamName = "Tablet Tester";
   //          ParamName = "Hardness";
   //          break;
   //       case "I":
   //          if (
   //             objMenuMLHR.menu != "Sealed Cartridge" &&
   //             productType.productType == "2"
   //          ) {
   //             IncompleteTableName = "tbl_cap_master7_incomplete";
   //             ParamName = objMenuMLHR.menu;
   //          } else {
   //             IncompleteTableName = "";
   //             ParamName = "";
   //          }
   //          instrument = "BALANCE";
   //          break;
   //    }
   //    var isPresentObj = {
   //       str_tableName: "tbl_remark_incomplete_master",
   //       data: "*",
   //       condition: [
   //          { str_colName: "IDSNo", value: IdsNo },
   //          { str_colName: "BatchNumber", value: cubicalObj.Sys_Batch },
   //       ],
   //    };
   //    if (IncompleteTableName != "") {
   //       let result = await objDatabase.select(isPresentObj);
   //       //if (result[0].length == 0) {
   //       //Need to insert into database
   //       var insertRemarkObj = {
   //          str_tableName: "tbl_remark_incomplete_master",
   //          data: [
   //             { str_colName: "IDSNo", value: IdsNo },
   //             { str_colName: "paramName", value: ParamName },
   //             { str_colName: "tableName", value: IncompleteTableName },
   //             { str_colName: "BatchNumber", value: cubicalObj.Sys_Batch },
   //             //{ str_colName: "Instrument", value: instrument },
   //          ],
   //       };
   //       await objDatabase.save(insertRemarkObj);
   //       return true;
   //    }
   //    else {
   //       //Need to update into Database
   //       var updateRemarkObj = {
   //          str_tableName: "tbl_remark_incomplete_master",
   //          data: [
   //             { str_colName: "paramName", value: ParamName },
   //             { str_colName: "tableName", value: IncompleteTableName },
   //             { str_colName: "BatchNumber", value: cubicalObj.Sys_Batch },
   //             { str_colName: "Instrument", value: instrument },
   //          ],
   //          condition: [
   //             { str_colName: "IDSNo", value: IdsNo },
   //             { str_colName: "BatchNumber", value: cubicalObj.Sys_Batch },
   //          ],
   //       };
   //       await objDatabase.update(updateRemarkObj);
   //       return true;
   //    }
   // }

   // else {
   //    return true;
   // }
   //}


   async updateEntry(IdsNo, type, tbl = false) {

      var selectedIds;
      let instrument = "";
      var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == IdsNo);
      var productType = globalData.arrProductTypeArray.find(k => k.idsNo == IdsNo);
      var objMenuMLHR = globalData.arrMultihealerMS.find(k => k.idsNo == IdsNo);
      if (IPQCObject != undefined) {
         selectedIds = IPQCObject.selectedIds;
      } else {
         selectedIds = IdsNo;
      }
      var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
      let IncompleteTableName = "";
      let ParamName = "";
      switch (type) {
         case "1":
            if (cubicalObj.Sys_Area != 'Capsule Filling' && productType.productType == '1') {
               IncompleteTableName = 'tbl_tab_master1_incomplete';
            } else {
               IncompleteTableName = 'tbl_cap_master1_incomplete';
            }
            ParamName = 'Ind';
            instrument = 'BALANCE'
            break;
         case "3":

            if (productType.productType == '1') {
               IncompleteTableName = 'tbl_tab_master3_incomplete';
               ParamName = 'Thickness';
            }
            instrument = 'VERNIER'



            break;
         case "4":
            if (cubicalObj.Sys_Area != 'Capsule Filling' && productType.productType == '1') {
               IncompleteTableName = 'tbl_tab_master4_incomplete';
               ParamName = 'Breadth';
            } else {
               IncompleteTableName = 'tbl_cap_master4_incomplete';
               ParamName = 'Diameter';
            }
            instrument = 'VERNIER'
            break;
         case "5":
            if (cubicalObj.Sys_Area != 'Capsule Filling' && productType.productType == '1') {
               IncompleteTableName = 'tbl_tab_master5_incomplete';
            } else {
               IncompleteTableName = 'tbl_cap_master5_incomplete';
            }
            ParamName = 'Length';
            instrument = 'VERNIER'
            break;
         case "6":
            if (productType.productType == '1') {
               IncompleteTableName = 'tbl_tab_master6_incomplete';
               ParamName = 'Diameter';
            }
            instrument = 'VERNIER'
            break;
         case "8":

            IncompleteTableName = 'tbl_tab_master9_incomplete';
            ParamName = 'Ind Layer 1';
            if (serverConfig.ProjectName == 'RBH') {
               ParamName = 'Ind Empty';
            }
            instrument = 'BALANCE'

            break;
         case "11":
            IncompleteTableName = 'tbl_tab_master11_incomplete';
            ParamName = 'Ind Layer 2';
            instrument = 'BALANCE'
            break;
         case "L":
            IncompleteTableName = 'tbl_tab_master11_incomplete';
            ParamName = 'Ind Layer 2';
            instrument = 'BALANCE'
            break;
         case 'P':
            if (productType.productType == '1') {
               IncompleteTableName = 'tbl_tab_master18_incomplete';
            } else {
               IncompleteTableName = 'tbl_cap_master18_incomplete';
            }
            ParamName = 'PRTSIZE';
            instrument = 'BALANCE'
            break;
         case 'F':
            if (productType.productType == '1') {
               IncompleteTableName = 'tbl_tab_master17_incomplete';
            } else {
               IncompleteTableName = 'tbl_cap_master17_incomplete';
            }
            ParamName = '%Fine';
            instrument = 'BALANCE'
            break;
         case 'D':
            if (productType.productType == '2') {
               IncompleteTableName = 'tbl_cap_master3_incomplete';
               ParamName = 'Differential';
               instrument = 'BALANCE'
            }
            break;
         case 'Hardness':
            let modal = await objCommanFun.CheckHardnessModel(IdsNo);
            if (modal.Eqp_Make == 'Erweka TBH-425') {

               IncompleteTableName = 'tbl_tab_masterhtd_incomplete';
            }
            else {
               IncompleteTableName = 'tbl_tab_master7_incomplete';
            }

            ParamName = 'Hardness';
            instrument = 'HARDNESS'
            break;
         case 'DISINTEGRATION TESTER':
            ParamName = 'Disintegration Tester';
            instrument = 'DISINTEGRATION TESTER'
            IncompleteTableName = 'tbl_tab_master13';
            break;
         case 'LOD':
            ParamName = 'LOD';
            instrument = 'MOISTURE ANALYZER'
            IncompleteTableName = 'tbl_lodmaster';
            break;

         case 'TAPPED DENSITY':
            ParamName = 'Tapped Density';
            instrument = 'TAPPED DENSITY'
            IncompleteTableName = 'tbl_tab_tapdensity';
            break;

         case 'FRIABILATOR':
            ParamName = 'Friablity';
            instrument = 'FRIABILATOR'
            IncompleteTableName = 'tbl_tab_friability';
            break;
         case 'BALANCE':
            ParamName = 'Friablity';
            instrument = 'BALANCE'
            IncompleteTableName = 'tbl_tab_friability';
            break;
         case 'Tablet Tester':
            IncompleteTableName = 'tbl_tab_masterhtd_incomplete';
            ParamName = 'Tablet Tester';
            instrument = 'HARDNESS'
            break;
         case 'I':
            if (objMenuMLHR.menu != 'Sealed Cartridge' && productType.productType == '2') {
               IncompleteTableName = 'tbl_cap_master7_incomplete';
               ParamName = objMenuMLHR.menu;
            } else {
               IncompleteTableName = "";
               ParamName = "";
            }
            instrument = 'BALANCE'
            break;
      }

      if (tbl) {
         IncompleteTableName = IncompleteTableName.replace('_incomplete', '');
      }


      var isPresentObj = {
         str_tableName: "tbl_remark_incomplete_master",
         data: "*",
         condition: [
            { str_colName: "IDSNo", value: IdsNo },
            { str_colName: "BatchNumber", value: cubicalObj.Sys_Batch },
            { str_colName: "TestType", value: type },
         ],
      };
      if (IncompleteTableName != "") {
         let result = await objDatabase.select(isPresentObj);
         if (result[0].length == 0) {
            //Need to insert into database
            var insertRemarkObj = {
               str_tableName: "tbl_remark_incomplete_master",
               data: [
                  { str_colName: "IDSNo", value: IdsNo },
                  { str_colName: "paramName", value: ParamName },
                  { str_colName: "tableName", value: IncompleteTableName },
                  { str_colName: "BatchNumber", value: cubicalObj.Sys_Batch },
                  { str_colName: "Instrument", value: instrument },
                  { str_colName: "TestType", value: type },
               ],
            };
            await objDatabase.save(insertRemarkObj);
            return true;
         } else {
            return true;
         }
      } else {
         return true;
      }
   }
   async deleteEntry(IdsNo) {
      var selectedIds;
      var IPQCObject = globalData.arr_IPQCRelIds.find((k) => k.idsNo == IdsNo);
      if (IPQCObject != undefined) {
         selectedIds = IPQCObject.selectedIds;
      } else {
         selectedIds = IdsNo;
      }
      var cubicalObj = globalData.arrIdsInfo.find(
         (k) => k.Sys_IDSNo == selectedIds
      );

      var deleteRecord = {
         str_tableName: "tbl_remark_incomplete_master",
         condition: [
            { str_colName: "IDSNo", value: IdsNo },
            { str_colName: "BatchNumber", value: cubicalObj.Sys_Batch },
         ],
      };
      await objDatabase.delete(deleteRecord);
      return true;
   }
  
   async checkEntry(IdsNo, actualIdsNo, strBatchNo = '', testType = "") {
      try {
            var cubicalObj = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == actualIdsNo);

         // var isPresentObj = {
         //    str_tableName: 'tbl_remark_incomplete_master',
         //    data: '*',
         //    condition: [
         //       { str_colName: 'IDSNo', value: IdsNo },
         //       { str_colName: 'BatchNumber', value: cubicalObj.Sys_Batch },
         //       { str_colName: 'TestType', value: testType }

         //    ]
         // }

         var isPresentObj =
            await objDatabase.execute(`SELECT * FROM tbl_remark_incomplete_master WHERE serNo = (SELECT MAX(serNo) FROM tbl_remark_incomplete_master 
            WHERE IDSNo = '${IdsNo}' AND TestType = '${testType}' AND BatchNumber = '${cubicalObj.Sys_Batch}')`);

         //await objDatabase.select(isPresentObj);
         let selectdResult = isPresentObj;
         if (selectdResult[0].length > 0) {
            let tableName = selectdResult[0][0].tableName;
            let ParamName = selectdResult[0][0].paramName;
            var BatchNumber = cubicalObj.Sys_Batch;

            let checkObj = `SELECT * FROM ${tableName} WHERE BatchNo='${BatchNumber}' AND RepSerNo = (SELECT MAX(RepSerNo) FROM ${tableName} WHERE BatchNo='${BatchNumber}' and Idsno='${IdsNo}')`;
            let checkRes = await objDatabase.execute(checkObj);
            if (checkRes[0].length > 0) {
               // here cheacking for remark from frount end
               if (checkRes[0][0].RepoLabel13 == 'NULL' || checkRes[0][0].RepoLabel13 == null) {
                  if (serverConfig.ProjectName == 'SunPharmaVP' || serverConfig.ProjectName == 'MLVeer'
                     || serverConfig.ProjectName == 'SunHalolGuj1') {
                     return false;
                  } else {
                     return { status: true, param: ParamName, table: tableName }
                  }
               } else {
                  return false;
               }
            } else {
               return false;
            }
         } else {
            return false;
         }
      } catch (err) {
         return false;
      }
   }
}
module.exports = ReportIncomplete;
