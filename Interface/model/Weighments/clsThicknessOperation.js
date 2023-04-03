const clsIncompleteDataSave = require('../Weighments/clsIncompleteDataSave');
const IncompleteReport = require('../Weighments/clsIncompleteReport');
const WeighmentDataTransfer = require('../Weighments/clsWeighmentDataTransfer');

const objIncompleteReport = new IncompleteReport();
const objWeighmentDataTransfer = new WeighmentDataTransfer();

class Thickness extends clsIncompleteDataSave{
    saveIncompleteData(productObj,wt,intNos,typeValue){
        //console.log(productObj+''+wt+''+intNos+''+typeValue);
        this.saveData(productObj,wt,intNos,typeValue,'tbl_tab_master3_incomplete','tbl_tab_detail3_incomplete');
    }
    saveCompleteData(objWeighment){
        objIncompleteReport.getIncomepleteData(objWeighment,'tbl_tab_master3','tbl_tab_detail3').then((result)=>{
            objWeighmentDataTransfer.saveCommonDataToComplete(result); 
        })
    }
}
module.exports = Thickness;