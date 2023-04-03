// const dbCon = require('../utils/dbCon');
// const request = require('request');
// const serverConfig = require('../global/severConfig');
// const clsprotocolHandler = require('../controller/protocolHandlerController');
// const protocolHandler = new clsprotocolHandler();
// class WindowServiceModel {
//     handleResponseFromWinSer(InComingDataFromWinSer1) {
//         console.log('WS', InComingDataFromWinSer1);
//         const SrNo = InComingDataFromWinSer1.split(':')[1];
//         dbCon.execute('SELECT Ip FROM `identification` WHERE SrNo= ?', [SrNo]).then((result) => {
//             switch (InComingDataFromWinSer1.split(':')[0]) {
//                 case 'IdentifyUserSuccess':
//                     var str_IpAddress = result[0][0].Ip;
//                     const str_UserId = InComingDataFromWinSer1.split(':')[2];
//                     request.get(`http://${serverConfig.host}:3000/API_V1/interface/userInfo`, { json: { str_UserId: str_UserId } }, (err, res, body) => {
//                         if (res.body[0].active === 1) {
//                             var str_Protocol = "ID3 USER ALREADY LOGIN, ON " + res.body[0].source.toUpperCase() + ",,";
//                             protocolHandler.sendProtocol(str_Protocol, str_IpAddress);
//                         }
//                         // else if (res.body[0].Status === 4) {
//                         //     var str_Protocol = "ID5U00,0001010600,USER AUTO DISABLED,";
//                         //     protocolHandler.sendProtocol(str_Protocol, str_IpAddress);
//                         // }
//                         else if (res.body[0].Status === 2) {
//                             var str_Protocol = "ID3 USER, PERMANANTLY DISABLED";
//                             protocolHandler.sendProtocol(str_Protocol, str_IpAddress);
//                         } else if (res.body[0].Status === 1) {
//                             var str_Protocol = "ID3 USER, TEMPORARY DISABLED";
//                             protocolHandler.sendProtocol(str_Protocol, str_IpAddress);
//                         } else if (res.body[0].Status === 3) {
//                             var str_Protocol = "ID3 , USER IS LOCKED,,";
//                             protocolHandler.sendProtocol(str_Protocol, str_IpAddress);
//                         } else { 
//                             var str_Protocol = "ID1U0240," + res.body[0].UserID + ",";
//                             protocolHandler.sendProtocol(str_Protocol, str_IpAddress);
//                         }
                        
//                     });
//                     break;
//                 case 'IdentifyUserFailure':
//                     var str_IpAddress = result[0][0].Ip;
//                     var str_Protocol = "ID2UFINGER PRINT NOT AVAILABLE,,";
//                     protocolHandler.sendProtocol(str_Protocol, str_IpAddress);
//                     break;
//                 case 'IdentifyUserError':
//                     var str_IpAddress = result[0][0].Ip;
//                     var str_Protocol = "ID2UFINGER PRINT NOT RECOGNIZED, TRY AGAIN,";
//                     protocolHandler.sendProtocol(str_Protocol, str_IpAddress);
//                     break;
//                 default:
//                     console.log('default')
//                     break;

//             }
//         }).catch((err) => {
//             console.log('error while fetching ip from identification protocol in clsWSM', err)
//         });
//     }
// }
// module.exports = WindowServiceModel;