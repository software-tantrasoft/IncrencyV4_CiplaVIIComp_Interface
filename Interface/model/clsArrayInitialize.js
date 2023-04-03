const Comman = require('../model/Calibration/clsCommonFunction');
const globalData = require('../global/globalData');
const FetchDetail = require('../model/clsFetchDetails');

const comman = new Comman();
const fetchDetails = new FetchDetail();

class ArrayInitialize {

    async InitializeArrays() {
        try {
            // ******************************************************************************************************//
            // below methods fetch all the important data at the startup
            //*******************************************************************************************************/
            globalData.arrIdsInfo = await fetchDetails.getIds();
            globalData.arrBinSetting = await fetchDetails.getBinSettingData();
            globalData.arrCommunication = await fetchDetails.getCommunicationStatus();
            globalData.arr_menuList = await fetchDetails.getMenuList();
            globalData.arrsAllParameters = await fetchDetails.getAllParameters();
            globalData.arrBalanceRecalibStatus = await fetchDetails.getRecalibBalanceStatus();
            globalData.arrBalanceRecalibStatusBin = await fetchDetails.getRecalibBalanceStatusBin();
            globalData.objNominclature = await fetchDetails.getNominclatureInfo();
            globalData.arrsPwdComplexity = await fetchDetails.getpwdComplexity()
            globalData.arrVernierRecalibration = await fetchDetails.getRecalibVernierStatusBin();
            //globalData.arrIncompleteRemark.push({weighment:false,RepoSr:0,Type:0,IdsNo:0});
            // fetchDetails.prepareAlertObject().then(() =>{
            //     // here 
            //     globalData.alertArrTemp = globalData.alertArr;

            // }); // This function filled the global array i-e alert object
            // let objShowAlert = new ShowAlert()
            // setInterval(() =>{
            //     objShowAlert.showAlert()
            // },3000) 



            //*********************************************************************8 */

            //**********************************************************************8 */

            //******************************************************************************* */
            globalData.arrCalibrationSequnce = await fetchDetails.getCalibrationSequence();
            const array = await comman.sortObject(globalData.arrCalibrationSequnce[0]);
            var arr_newAray = [];
            for (let i = 0; i < array.length; i++) {
                if (array[i].value !== 0) {
                    arr_newAray.push(array[i].key)
                }
            }
            globalData.arrSortedCalib = arr_newAray;

            return "Success";
        } catch (error) {
            return "Error";
        }


    }
}

module.exports = ArrayInitialize;