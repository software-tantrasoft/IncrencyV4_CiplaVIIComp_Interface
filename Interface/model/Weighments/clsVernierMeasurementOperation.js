const clsIncompleteDataSave = require('./clsIncompleteDataSave');
const IncompleteReport = require('./clsIncompleteReport');
const WeighmentDataTransfer = require('./clsWeighmentDataTransfer');
const globalData = require('../../global/globalData');
const objIncompleteReport = new IncompleteReport();
const objWeighmentDataTransfer = new WeighmentDataTransfer();

class VernierMeasurementClass extends clsIncompleteDataSave {
    async saveIncompleteData(productObj, wt, intNos, typeValue, tempUserObject, IdsNo) {
        var productType = globalData.arrProductTypeArray.find(k=>k.idsNo == IdsNo);
        var masterTable, detailTable;
        if (typeValue == 'P') {
            if (productType.productType == 1) {
              masterTable = "tbl_tab_master18_incomplete";
              detailTable = "tbl_tab_detail18_incomplete";
            } else {
              masterTable = "tbl_cap_master18_incomplete";
              detailTable = "tbl_cap_detail18_incomplete";
            }
        }
        else {
            masterTable = 'tbl_tab_master' + typeValue + '_incomplete';
            detailTable = 'tbl_tab_detail' + typeValue + '_incomplete';
        }
        const resSave = await this.saveData(productObj, wt, intNos, typeValue, tempUserObject, masterTable, detailTable, IdsNo);
        return resSave;
    }
    // for storing partcile and % fine data
    // saveCompleteData(objWeighment, typeValue) {
    //     var masterTable, detailTable;
    //     if (typeValue == 'P') {
    //         masterTable = 'tbl_tab_master18';
    //         detailTable = 'tbl_tab_detail18';
    //     }
    //     else {
    //         masterTable = 'tbl_tab_master' + typeValue;
    //         detailTable = 'tbl_tab_detail' + typeValue;
    //     }
    //     objIncompleteReport.getIncomepleteData(objWeighment, masterTable, detailTable).then((result) => {
    //         objWeighmentDataTransfer.saveCommonDataToComplete(result);
    //     })
    // }
}
module.exports = VernierMeasurementClass;