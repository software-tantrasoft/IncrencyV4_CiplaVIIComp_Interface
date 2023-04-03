const Database = require('../../database/clsQueryProcess');
const objDatabase = new Database();
class CubicleSetting {
    checkCubicleSettingDone(idsNo, strSearchString = "") {
        return new Promise((resolve, reject) => {
            const selectCubicleData = {
                str_tableName: "tbl_cubical",
                data: '*',
                condition: [
                    { str_colName: 'Sys_IDSNo', value: idsNo, comp: 'eq' }
                ]
            }
            var blankData = [];
            var existingData = {};
            objDatabase.select(selectCubicleData).then((result) => {
                for (const key in result[0][0]) {
                    if (result[0][0].hasOwnProperty(key)) {
                        const element = result[0][0][key];
                        if (element == 'NULL'|| element == null) {
                            blankData.push(key);
                        }
                        else {
                            existingData[key] = element.toString();
                        }
                    }
                }
                blankData.push(existingData);
                resolve(blankData)
            })

        })
    }
    checkProductSet(idsNo) {
        return new Promise((resolve, reject) => {
            this.checkCubicleSettingDone(idsNo).then((result) => {
                let responseObj = {};
                var productData;
                var filledData = result.splice(-1);
                var emptyData = result.splice(0, result.length);
                if (emptyData.includes("Sys_ProductName") == true) {
                    Object.assign(responseObj, { result: false });
                    resolve(responseObj)
                }
                else {
                    productData = {
                        'Sys_BFGCode': filledData[0].Sys_BFGCode,
                        'Sys_ProductName': filledData[0].Sys_ProductName,
                        'Sys_Version': filledData[0].Sys_Version,
                        'Sys_PVersion': filledData[0].Sys_PVersion,
                    }
                    Object.assign(responseObj, { result: productData });
                    resolve(responseObj)
                }
            })
        })



    }


}
module.exports = CubicleSetting;