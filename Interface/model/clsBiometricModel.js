const dbCon = require('../utils/dbCon');
const globalData = require('../global/globalData')
class BiometricModel {
    sendProtocolToWinSer(str_BioProtocol, str_ProtocolBuffer, str_IpAddress) {
        const FPBuff = str_ProtocolBuffer.slice(25);
        const fingerPrint = FPBuff.slice(0, 400);
        dbCon.execute("INSERT INTO `identification` (`IdentificationTemplete`, `Ip`) VALUES (?, ?)", [fingerPrint, str_IpAddress]).then((res) => { 
            if (res) {
                console.log(res[0].insertId);
                const sendMsg = 'IdentifyUser:' + res[0].insertId;
                globalData.WindowSerSockArray[0].write(sendMsg)
            } else { 
                console.log('Error while inserting FP in identification')
            }
        })
     }
}
module.exports = BiometricModel;
//IdentifyUserSuccess:23:PBS03