const globalData = require('../../global/globalData');
var PreWeighmentCheck = require('../../model/clsPreWeighmentChecks');
const DailyCalibrationModel = require('../../model/Calibration/clsdailyCalibrationModel');
const FetchDetail = require('../../model/clsFetchDetails');
var clsMonitor = require('../MonitorSocket/clsMonitSocket');
const objMonitor = new clsMonitor();
const fetchDetails = new FetchDetail();
const dailyCalibrationModel = new DailyCalibrationModel();
const objPreWeighmentCheck = new PreWeighmentCheck();
const clsContainer = require('../../model/Container/Container.class');
const objContainer = new clsContainer();
class IPCWeighing {
   async handleMSBin(idsNo) {
      try {
         /**
          * @description 1) On selection of Bin Weighments First we nned to check if user have right of calibration
          * or not then we check PreWeighmentCheck i-e for bin balance precalibration is done or not balance set
          * properly or not, All the activities that we perform for Analytical balance
          * 2) Also setting calibration owner for preWeighemnt checks
          */
         var selectedIds;
         // here we are selecting IDS functionality for that cubicle 
         var IPQCObject = globalData.arr_IPQCRelIds.find(k => k.idsNo == idsNo);
         if (IPQCObject != undefined) {
            selectedIds = IPQCObject.selectedIds
         } else {
            selectedIds = idsNo; // for compression and coating
         };
         var tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIds);
         var currentCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == idsNo)
         var tempBalace = currentCubicInfo.Sys_BinBalID;
         var objOwner = globalData.arrPreWeighCalibOwner.find(k => k.idsNo == idsNo);
         if (objOwner == undefined) { globalData.arrPreWeighCalibOwner.push({ idsNo: IdsIp, owner: 'IPC' }) }
         else { objOwner.owner = 'IPC' }

         var objLocation = globalData.arrIPCLocation.find(k => k.idsNo == idsNo);
         if (objLocation == undefined) { globalData.arrIPCLocation.push({ idsNo: idsNo, location: 'cubicle' }) }
         else { objLocation.location = 'cubicle' }
         var res = await objPreWeighmentCheck.validatePreWeighmentActivites(idsNo, true);
         var result = await fetchDetails.checkBalanceInStatus_Re_tables(tempBalace, idsNo);
         await fetchDetails.getCaibrationStatus(idsNo);
         await fetchDetails.getBalanceCalibDetails(idsNo);
         if (result == false) {
            if (res != "Batch Started," && res != "Valid PreCalibration,") {
               var strReturnData = "ID3 " + res + ",,,";
               return strReturnData;
            } else {
               var strReturnProtocol = await dailyCalibrationModel.checkDailyCalibrationPending(idsNo);
               var temp = globalData.arrWhichMenuSideSelected.find(k => k.idsNo == idsNo);
               if (temp.side == 'Done') {
                  strReturnProtocol = 'CR0';
                  return strReturnProtocol;
               }
               if (strReturnProtocol.substring(0, 3) == 'CR4') {
                  objMonitor.monit({ case: 'CR', idsNo: idsNo, data: { calibType: 'Daily' } });
                  //strReturnProtocol = "CR0"; // to avoide calibraiton
               } else if (strReturnProtocol.substring(0, 3) == 'CR5') {
                  // objMonitor.monit({ case: 'CR', idsNo: idsNo, data: { calibType: 'Periodic' } });
                  //strReturnProtocol = "CR0"; // to avoide calibraiton
               } else if (strReturnProtocol.substring(0, 3) == 'CR0') {
                  //strReturnProtocol = 'WL212;';
                  // setting IMGB for bin flag to true


                  var selectedIDS = selectedIds

                  var resCubical = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == selectedIDS);

                  var selectedBatch = resCubical.Sys_Batch;
                  var selectedProductId = resCubical.Sys_BFGCode;
                  var selectedProductName = resCubical.Sys_ProductName;
                  var selectedProductVersion = resCubical.Sys_PVersion;
                  var selectedVersion = resCubical.Sys_Version;

                  var objBin = globalData.arrBinInfo.find(k => k.idsNo == idsNo);//selectedIDS

                  var objBinIndex = globalData.arrBinIndex.find(k => k.idsNo == idsNo);  //selectedIDS

                  if (objBin == undefined) {
                     globalData.arrBinInfo.push(
                        {
                           idsNo: idsNo,
                           selIds: selectedIDS,
                           selProductId: selectedProductId,
                           selProductName: selectedProductName,
                           selProductVersion: selectedProductVersion,
                           selVersion: selectedVersion,
                           selBatch: selectedBatch,
                           selContainer: "",
                           tareWt: 0,
                           grossWt: 0,
                           netWt: 0,
                           prDate: "",
                           prTime: "",
                           balanceID: "",
                           dp: 3, // if not specified then automatically it will take 3 decimal points
                           userid: "",
                           username: ""
                        })
                  }
                  else {
                     objBin.selIds = selectedIDS;
                     objBin.selProductId = selectedProductId;
                     objBin.selProductName = selectedProductName;
                     objBin.selProductVersion = selectedProductVersion;
                     objBin.selVersion = selectedVersion;
                     objBin.selBatch = selectedBatch;
                  }

                  if (objBinIndex == undefined) {
                     globalData.arrBinIndex.push({
                        idsNo: idsNo,
                        startIndex: 0,
                        endIndex: 43
                     })
                  }
                  else {
                     objBinIndex.startIndex = 0;
                     objBinIndex.endIndex = 43;
                  }
                  var tempCheck = globalData.arrisIMGBForBin.find(k => k.idsNo == idsNo);
                  tempCheck.flag = true;
                  // var response = await objContainer.sendIPCProductList(tempCubicInfo.Sys_CubType, tempCubicInfo.Sys_Area);
                  var result = await objContainer.sendIPCList(idsNo, tempCubicInfo.Sys_Area, tempCubicInfo.Sys_CubType, true);
                  strReturnProtocol = result
               }
               return strReturnProtocol;
            }
         } else {
            var strReturnData = "ID3 Set Bin, Balance Again,,"
            return strReturnData;
         }
      } catch (err) {
         console.log(err);
      }
   }
}
module.exports = IPCWeighing