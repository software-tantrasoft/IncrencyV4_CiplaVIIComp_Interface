const globalData = require('./Interface/global/globalData');
const BulkWeighment = require('./Interface/model/clsBulkWeighment');
const ProtocolHandler = require('./Interface/controller/protocolHandlerController');
const bulkWeighment = new BulkWeighment();
const protocolHandlerController = new ProtocolHandler();
var net = require('net');
var tcpServer = net.createServer();   

tcpServer.on('connection', (connection) => {
    connection.setEncoding('utf8');
    console.log(connection)
    var hardnessTesterIP = connection.remoteAddress;
    
    connection.on('data',async (data) => {
      console.log('===== start ===>');
      console.log(data);
      console.log('===== end ===>');
      var cubicalObj = globalData.arrIdsInfo.find(k => k.IPAddress == hardnessTesterIP);
      if(cubicalObj){
        var objHardness = globalData.arrHardness425.find( (ht) => ht.idsNo == cubicalObj.Sys_IDSNo );
      }else {
        console.log('hardness IP not set on cubible');
      }

      if(objHardness && objHardness.dataFlowStatus == true){
           let sendProtocol = await bulkWeighment.insertBulkWeighmentHardness_425Lan(data,cubicalObj.Sys_IDSNo);
           protocolHandlerController.sendProtocol(sendProtocol,objHardness.idsIPAddress);
        
      }else if(objHardness == undefined){
           console.log(`data coming from hardness ${hardnessTesterIP} without WS from IDS`)
      }else {
          console.log('dataFlowStatus variable not initialized');
      }

    });

});



tcpServer.on('error',() => {

})

tcpServer.listen({host:'192.168.1.178',port:9000}, function() {  
    console.log('TCP SERVER LISTENING TO', tcpServer.address().address + ":9000");  
});
  


// function strCount(data) {
//     let result = {};
//     let lines = data.split('X');

//     for (let i = 0; i < lines.length; i++) {
//          let str = lines[i];
      
//     }

//     return;
// }


// function hardness425parsing(str) {
  
// }