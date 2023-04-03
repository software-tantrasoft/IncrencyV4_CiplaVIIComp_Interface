const globalData = require('../global/globalData');


class ProtocolStore {

    /**
     * Function is used to store the current protocol to the global array
     * @param {*} idsNo : Ids no for which data needs to be add.
     * @param {*} str_Protocol : Protocol Which needs to be add.
     * @author Pradip Shinde
     */
    storeProtocol(idsNo,str_Protocol,str_IpAddress){

        var oldData = globalData.arrOldProtocol.find(k => k.IdsNo == idsNo);
        if(oldData != undefined)
        {
            oldData.protocolRecived = str_Protocol;
            oldData.Response = '';
            oldData.ip = str_IpAddress;
        }
        else
        {
            var protocol = {
                IdsNo : idsNo,
                protocolRecived : str_Protocol,
                Response: '', // Initially keep it blank we will update this when protocol send successfully,
                ip:str_IpAddress
            }
            globalData.arrOldProtocol.push(protocol);
        }
        //console.log('5');
       //console.log(globalData.arrOldProtocol);
      
    }



    /**
     * This function is used to store the response of the protocol.
     * @param {*} idsNo : IdsNo For which response of protocol needs to be added.
     * @param {*} str_Response : Response of the protocol.
     * @author Pradip Shinde
     */
    storeresponse(idsNo,str_Response,str_IpAddress) {
        var oldProtocol = globalData.arrOldProtocol.find(k => k.IdsNo == idsNo);
        if(oldProtocol !=undefined){
            oldProtocol.Response = str_Response;
            oldProtocol.ip = str_IpAddress;
        }
        //console.log('6');
    }
}

module.exports= ProtocolStore;