const Database = require('../../database/clsQueryProcess');
const globalData = require('../../global/globalData');
const database = new Database();
class IncompleteReport{

getIncomepleteData(objWeighment,strMasterTableName,strDetailTableName,IdsNo){
    return new Promise((resolve, reject) => {
        var tempProductType = globalData.arrProductTypeArray.find(k=>k.idsNo == IdsNo);
        var tempMenu = globalData.arrMultihealerMS.find(k=>k.idsNo == IdsNo);
        let responseObj = {};
        if(tempProductType.productType == 3){
            var query = `SELECT * FROM ${strMasterTableName + '_incomplete'} WHERE RepSerNo=(SELECT MAX(RepSerNo) AS RepSerNo FROM ${strMasterTableName + '_incomplete'}
            WHERE BFGCode='${objWeighment.strProductId}' AND ProductName='${objWeighment.strProductName}'
             AND PVersion='${objWeighment.strProductVersion}' AND VERSION='${objWeighment.strVersion}' 
             AND BatchNo='${objWeighment.strBatch}' AND Idsno='${IdsNo}' AND TestType='${tempMenu.menu}')`;
        } else {
        var query = `SELECT * FROM ${strMasterTableName+'_incomplete'} WHERE RepSerNo=(SELECT MAX(RepSerNo) AS RepSerNo FROM ${strMasterTableName+'_incomplete'}
        WHERE BFGCode='${objWeighment.strProductId}' AND ProductName='${objWeighment.strProductName}'
         AND PVersion='${objWeighment.strProductVersion}' AND VERSION='${objWeighment.strVersion}' 
         AND BatchNo='${objWeighment.strBatch}' AND Idsno='${IdsNo}')`;
        }
        database.execute(query).then(masterresult =>{
            //console.log(masterresult);
            var RepSerNo = masterresult[0][0].RepSerNo;
            //console.log(RepSerNo);
            const incompleteDetailData = {
                str_tableName: strDetailTableName+'_incomplete',
                data: '*',
                condition: [
                    { str_colName: 'RepSerNo', value: RepSerNo, comp: 'eq' }
                ]   
            }
            database.select(incompleteDetailData).then((detailresult) => {
            Object.assign(responseObj, 
                { incompleteData: masterresult[0][0] }, 
                { detailData: detailresult[0] }, 
                { completeTableName: strMasterTableName }, 
                { detailTableName: strDetailTableName }, 
                { incompleteTableName: strMasterTableName +'_incomplete' }, 
                { incompletedetailTableName: strDetailTableName +'_incomplete' })
            resolve(responseObj)
            }).catch(err => {
                console.log(err);
            })
        }).catch(err =>{
            reject(err)
        })
    })
}
}
module.exports = IncompleteReport;