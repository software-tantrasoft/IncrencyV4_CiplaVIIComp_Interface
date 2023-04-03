const dbCon = require('../utils/dbCon');
const globalData = require('../global/globalData')

const Database = require('../database/clsQueryProcess');
const database = new Database();
const jsonTareCmd = require('../global/tare.json');

class SendSIR {

    async prepareCommand(IdsNo) {
        try {
            const tempCubicInfo = globalData.arrIdsInfo.find(k => k.Sys_IDSNo == parseInt(IdsNo));
            let strBalId = tempCubicInfo.Sys_BalID;

            if (strBalId == "None") {
                return "";
            }
            var selectBalObj = {
                str_tableName: 'tbl_balance',
                data: '*',
                condition: [
                    { str_colName: 'Bal_ID', value: strBalId, comp: 'eq' },
                ]
            }
            let resultBal = await database.select(selectBalObj);
            var balSrNo = "";
            if (resultBal[0].length != 0) {
                balSrNo = resultBal[0][0].Bal_SrNo;
            } else {
                balSrNo = "";
            }
            var tempIM = globalData.arrHexInfo.find(k => k.idsNo == IdsNo);

            var tareCmd = "";
            var flgSendSIR = false;
            if (resultBal[0][0].Bal_Make.includes('Mettler')) {
                var objTareCmd = jsonTareCmd.Mettler.find(mod => resultBal[0][0].Bal_Model.includes(mod.Model));
                if (objTareCmd == undefined) {
                    flgSendSIR = true
                }
                else {
                    flgSendSIR = objTareCmd.SendCmd == "Y" ? true : false;
                }
            }

            if (tempIM.IM == "IMG1" || tempIM.IM == "IMC3" || tempIM.IM == "IMC1") {
                if (tempIM.IM != "IMC3") {
                    flgSendSIR == true ? tareCmd = `SP10SIR,` : tareCmd = "";

                } else {
                    flgSendSIR == true ? tareCmd = `SP20SIR,` : tareCmd = "";
                }
            }

            return tareCmd;

        } catch (error) {
            console.log(error);
        }

    }
}


module.exports = SendSIR;