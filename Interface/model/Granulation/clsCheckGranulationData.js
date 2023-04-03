const Database = require('../../database/clsQueryProcess');
var globalData = require('../../global/globalData')
const database = new Database();

class CheckGranulationData{
    checkGranulation(cubicalObj,typeValue,weightValue,IdsNo)
    {
        return new Promise((resolve, reject) => {
            let responseObj = {};
            var productType = globalData.arrProductTypeArray.find(k=>k.idsNo == IdsNo);
            var masterTable,detailTable;
            if(typeValue == "P")
            {
                if(productType.productType == 1) {
                masterTable = 'tbl_tab_master18_incomplete';
                detailTable = 'tbl_tab_detail18_incomplete';
                } else {
                    masterTable = 'tbl_cap_master18_incomplete';
                    detailTable = 'tbl_cap_detail18_incomplete';
                }
            }
            else
            {
                if(productType.productType == 1) {
                masterTable = 'tbl_tab_master17_incomplete';
                detailTable = 'tbl_tab_detail17_incomplete';
                } else {
                    masterTable = 'tbl_cap_master17_incomplete';
                    detailTable = 'tbl_cap_detail17_incomplete';  
                }
            }
            var incomingWt = parseFloat(weightValue);
            const masterData = {
                str_tableName:masterTable,
                data:'MAX(RepSerNo) AS serialNo',
                condition: [
                    { str_colName: 'BFGCode', value: cubicalObj.Sys_BFGCode, comp: 'eq' },
                    { str_colName: 'ProductName', value: cubicalObj.Sys_ProductName, comp: 'eq' },
                    { str_colName: 'PVersion', value: cubicalObj.Sys_PVersion, comp: 'eq' },
                    { str_colName: 'Version', value: cubicalObj.Sys_Version, comp: 'eq' },
                    { str_colName: 'BatchNo', value: cubicalObj.Sys_Batch, comp: 'eq' },
                ]   
            }
            database.select(masterData).then((masterResult) => {
                var masterSrNo = masterResult[0][0].serialNo;
                const detailData = {
                    str_tableName:detailTable,
                    data: '*',
                    condition: [
                        { str_colName: 'RepSerNo', value: masterSrNo, comp: 'eq' },
                    ]  
                }
                database.select(detailData).then((detailResult) => {
                    var finalData = detailResult[0];
                    var arrReading;
                    arrReading = [];
                    for(var i = 0; i < finalData.length; i++)
                    {
                        var val = finalData[i].DataValue;
                        arrReading.push(val);
                    }
                    var sampleval = arrReading.shift();
                    // console.log('sampleval   '+sampleval);
                    // console.log(arrReading);
                    var sumval = 0;
                    var sumFinalVal;
                    if(arrReading.length == 0)
                    {
                        if(sampleval < incomingWt)
                        {
                            Object.assign(responseObj, { result: 'fail' });
                            resolve(responseObj);
                        }
                        else
                        {
                            Object.assign(responseObj, { result: 'success' });
                            resolve(responseObj);
                        }
                        arrReading = '';
                    }
                    else
                    {
                        for(var j = 0; j < arrReading.length; j++)
                        {
                            sumval += parseFloat(arrReading[j]);
                        }
                        sumFinalVal = sumval;
                        //console.log('sum   '+sumFinalVal);
                        var finalCount = sumFinalVal;
                        //console.log('finalCount   '+finalCount);

                        if(sampleval < finalCount)
                        {
                            Object.assign(responseObj, { result: 'fail' });
                            resolve(responseObj);
                            
                        }
                        else
                        {
                            Object.assign(responseObj, { result: 'success' });
                            resolve(responseObj); 
                        }
                        arrReading = '';
                    }
                }).catch(err => { console.log(err); })
            }).catch(err => { reject(err); });

        })
    } 
}
module.exports = CheckGranulationData;