var request = require('request');
var rp = require('request-promise');
const axios = require('axios').default;


const serverConfig = require('../../global/severConfig');
const date = require('date-and-time');
var logFromPC = require('../../../Interface/model/clsLogger');
const { json } = require('express');
class PrintReportOnline {

  async generateOnlineReport(objReport, printerName, productType = 1) {
    let cls = this;
    var APIPath = 'tabletRoute/ViewTabReport';
    if (productType == 2) {
      var APIPath = 'capsuleRoute/viewCapsuleReport';
    } else if (productType == 3) {
      var APIPath = 'multihalerReport/ViewMultihalerReport';
    } else if (productType == 1) {
      var APIPath = 'tabletRoute/ViewTabReport';
    }
    try {
      var objReport = {
        "recordFrom": objReport.recordFrom,
        "reportOption": objReport.reportOption,
        "reportType": objReport.reportType,
        "testType": objReport.testType,
        "RepSerNo": objReport.RepSerNo,
        "userId": objReport.userId,
        "username": objReport.username,
        "idsNo": objReport.idsNo,
        "str_hmi": objReport.idsNo,
        "str_source": "Auto",
        "printNo": 0

      };
      if (productType == 3) {
        Object.assign(objReport, { "str_verifyByVal": 0 });
      }

      request({
        url: `http://${serverConfig.hostApi}:${serverConfig.APIPORT}/API_V1/${APIPath}`,
        method: 'POST',
        body: objReport,
        json: true
      }, function (err, response, body) {
        if (err) {
          console.log('Error while Printing Report Online', err)
          let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + err;
          //commented by vivek on 31-07-2020********************************
          //logFromPC.info(logQ);
          //logFromPC.addtoProtocolLog(logQ)
          //************************************************************** */
          return false;
        } else {
          if (body == null || body == undefined) {
            console.log('Error while Printing Report Online Body Blank');
            let msg = "Error while Printing Report Online Body Blank";
            let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + body;
            //commented by vivek on 31-07-2020********************************
            //logFromPC.info(logQ);
            //logFromPC.addtoProtocolLog(logQ)
            //************************************************************** */
            return false;
          } else {

            cls.printReport(body, objReport, printerName, productType).then(res => {
              return true;
            }).catch(err => {
              return err;
            });

          }
        }
      });
    } catch (error) {
      console.log(error);
      return false;
    }

  }
  /**
   * 
   * @param {*} reportObj 
   * @param {*} printerName 
   * @param {*} objBin 
   */
  async generateOnlineIPCReport(reportObj, printerName, objBin) {
    try {
      console.log(reportObj);
      console.log(printerName);
      if (printerName != "NA" && printerName != "" && printerName != null && printerName != 'None') {
        const objSaveTemp = {
          RecNo: reportObj.data.RecNo,
          UserId: reportObj.data.UserId,
          UserName: reportObj.data.UserName,
          str_ICReport: reportObj.data.str_ICReport,
          str_cubicleType: reportObj.data.str_cubicleType,
          idsNo: reportObj.data.idsNo,
        }

        console.log(objSaveTemp);
        console.log(reportObj);
        var resSaveToTemp = await axios.post(`http://${serverConfig.hostApi}:${serverConfig.APIPORT}/API_V1/bin/storeBinLabelDataInTemp`, objSaveTemp)
        if (resSaveToTemp.data.status == "Success") {
          var genReport = await axios.post(`http://${serverConfig.hostApi}:${serverConfig.APIPORT}/API_V1/report/GenerateReport`, reportObj);
          if (genReport.data.filepath != "") {
            var filepath = genReport.data.filepath;

            let printRep = {}
            Object.assign(
              printRep,
              { filepath: filepath },
              { strSelectedPrinter: printerName }
            )
            console.log(printRep);
            //logFromPC.addtoProtocolLog(printRep)
            var printReport = await axios.post(`http://${serverConfig.hostApi}:${serverConfig.APIPORT}/API_V1/report/PrintReport`, printRep);
            console.log(printReport.data.Message)

            if (printReport.data.Message == "Print Successfull") {
              const objPrintData = {
                str_ICReport: "Current",
                str_batchNo: objBin.selBatch,
                str_type: reportObj.data.cubType,
                int_printNo: 0,
                intRecNo: reportObj.data.RecNo,
                str_prdID: objBin.selProductId,
                str_prdName: objBin.selProductName,
                str_prdVersion: objBin.selProductVersion,
                str_version: objBin.selVersion,
                strReason: "",
                strUserId: reportObj.data.UserId,
                strUserName: reportObj.data.UserName,
                rptLabelForActivity: "Label Generation-Compression Report Printed"
              }

              var updateCount = await axios.post(`http://${serverConfig.hostApi}:${serverConfig.APIPORT}/API_V1/report/increasePrintCountUpBinLabel`, objPrintData);
              //logFromPC.addtoProtocolLog("count" + updateCount)
              if (updateCount.data.status == "Success") {
                return true;
              }
            }


          }
        }
      }

      //   request({
      //     url: `http://${serverConfig.hostApi}:${serverConfig.APIPORT}/API_V1/report/GenerateReport`,
      //     method: 'POST',
      //     body: reportObj,
      //     json: true
      //   }, function (err, response, body) {

      //     if (err) {
      //       console.log('Error while Printing Report Online', err)
      //       let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + err;
      //       //commented by vivek on 31-07-2020********************************
      //       //logFromPC.info(logQ);
      //       //logFromPC.addtoProtocolLog(logQ)
      //       //************************************************************** */
      //     } else {
      //       if (body == null || body == undefined) {
      //         console.log('Error while Printing Report Online Body Blank');
      //         let msg = "Error while Printing Report Online Body Blank";
      //         let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + body;
      //         //commented by vivek on 31-07-2020********************************
      //         //logFromPC.info(logQ);
      //         //logFromPC.addtoProtocolLog(logQ)
      //         //************************************************************** */
      //       } else {
      //         var filepath = response.body.filepath;

      //         let printRep = {}
      //         Object.assign(
      //           printRep,
      //           { filepath: filepath },
      //           { strSelectedPrinter: printerName }
      //         )
      //         request.post(`http://${serverConfig.hostApi}:${serverConfig.APIPORT}/API_V1/report/PrintReport`, { json: printRep }, (err, res, body) => {

      //           if (err) {
      //             console.log('Error while Printing Report Online', err)
      //             let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + err;
      //             //commented by vivek on 31-07-2020********************************
      //             //logFromPC.info(logQ);
      //             //logFromPC.addtoProtocolLog(logQ)
      //             //************************************************************** */
      //           } else {
      //             // console.log('IPCReport printed ')
      //             //console.log(res.body);
      //             // setTimeout(()=>{return true;},2000)
      //             const objPrintData = {
      //               str_ICReport: "Current",
      //               str_batchNo: objBin.selBatch,
      //               str_type: reportObj.data.cubType,
      //               int_printNo: 0,
      //               intRecNo: reportObj.data.RecNo,
      //               str_prdID: objBin.selProductId,
      //               str_prdName: objBin.selProductName,
      //               str_prdVersion: objBin.selProductVersion,
      //               str_version: objBin.selVersion,
      //               strReason: "",
      //               strUserId: reportObj.data.UserId,
      //               strUserName: reportObj.data.UserName,
      //               rptLabelForActivity: "Label Generation-Compression Report Printed"
      //             }
      //             request.post(`http://${serverConfig.hostApi}:${serverConfig.APIPORT}/API_V1/report/increasePrintCountUpBinLabel`, { json: objPrintData }, (err, res1, body) => {
      //               if (err) {
      //                 console.log(err)
      //               } else {
      //                 console.log(res.body, res1.body);
      //               }
      //             })
      //             return true

      //           }
      //         })
      //       }
      //     }
      //   });
      // } else {
      //   console.log("Printer Name empty")
      //   let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + "Printer Name empty";
      //   //commented by vivek on 31-07-2020********************************
      //   //logFromPC.info(logQ);
      //   //logFromPC.addtoProtocolLog(logQ)
      //   //************************************************************** */
      //   return false;
      // }
    } catch (err) {
      console.log(err);
    }
  }
  generateOnlineReportAsync(objReport, printerName) {
    return new Promise((resolve, reject) => {
      let cls = this;
      var objReport1 = {
        "recordFrom": objReport.recordFrom,
        "reportOption": objReport.reportOption,
        "reportType": objReport.reportType,
        "testType": objReport.testType,
        "RepSerNo": objReport.RepSerNo,
        "userId": objReport.userId,
        "username": objReport.username,
        "str_hmi": objReport.idsNo,
        "str_source": "Auto",
        "idsNo": objReport.idsNo

      }

      var options = {
        method: 'POST',
        uri: `http://${serverConfig.hostApi}:${serverConfig.APIPORT}/API_V1/tabletRoute/ViewTabReport`,
        body: objReport1,
        json: true // Automatically stringifies the body to JSON
      };
      //var parsedBody = await axios.post(options.uri, options.body, json);

      rp(options).then(function (parsedBody) {
        cls.printReport(parsedBody, objReport1, printerName).then(res => {
          resolve(true);
        }).catch(err => {
          resolve(err);
        });
      })

    }).catch(error => {
      console.log(error);
      resolve(false);
    })

  }

  async printReport(Response, ObjReportView, printerName, productType = 1) {
    try {
      var reportName = "";
      switch (ObjReportView.reportOption) {
        case 'Individual':
          reportName = 'Repo_Tab_Individual';
          //calculation = true;
          break;
        case 'Individual Layer1':
          reportName = 'Repo_Tab_Individual';
          //calculation = true;
          break;
        case 'Individual Empty':
          reportName = 'Repo_Tab_Individual';
          //calculation = true;
          break;
        case 'Individual Layer2':
          reportName = 'Repo_Tab_Individual';
          //calculation = true;
          break;
        case 'Thickness':
          reportName = 'Repo_Tab_Vernier';
          //calculation = true;
          break;
        case 'Length':
          reportName = 'Repo_Tab_Vernier';
          //calculation = true;
          break;
        case 'Breadth':
          reportName = 'Repo_Tab_Vernier';
          //calculation = true;
          break;
        case 'Diameter':
          reportName = 'Repo_Tab_Vernier';
          // calculation = true;
          break;
        case 'Friabilator':
          reportName = 'Repo_Tab_Friability';
          //calculation = false;
          break;
        case 'Moisture Analyzer':
          reportName = 'Repo_Tab_LOD';
          //calculation = false;
          break;
        case 'Hardness':
          reportName = 'Repo_Tab_Hardness';
          //calculation = true;
          break;
        case 'Particle Size':
          reportName = 'Repo_Tab_ParticleSize';
          //calculation = true;
          break;
        case 'Fine %':
          reportName = 'Repo_Tab_Fine';
          //calculation = true;
          break;
        case 'Tapped Density':
          reportName = 'Repo_Tab_TD';
          //calculation = false;
          break;
        case 'Disintegration Tester':
          reportName = 'Repo_Tab_DT';
          //calculation = true;
          break;
        case 'Group':
          reportName = 'Repo_Tab_Group';
          //calculation = true;
          break;
        case 'Group Layer':
          reportName = 'Repo_Tab_Group';
          //calculation = true;
          break;
        case 'Group Layer1':
          reportName = 'Repo_Tab_Group';
          //calculation = true;
          break;
        case 'Differential':
          reportName = 'Repo_Cap_Differential';
          //calculation = true;
          break;
        case 'Net Content':
        case 'Dry Cartridge':
        case 'Dry Powder':
          reportName = 'Repo_Mul_UniformityofContent';
          break;
        default:
          break;
      }
      let reportObj = {}
      const reportData = Response;
      delete reportData.waterMark;

      if (ObjReportView.reportOption == 'Moisture Analyzer') {
        request({
          url: `http://${serverConfig.hostApi}:${serverConfig.APIPORT}/API_V1/tabletRoute/calculationLOD`,
          method: 'POST',
          body: { "RepSerNo": ObjReportView.RepSerNo, "recordFrom": "Current" },
          json: true
        }, function (err, response, body) {

          if (err) {
            console.log('Error calculation in LOD', err)
            let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + err;
            //logFromPC.addtoProtocolLog(logQ)
            //************************************************************** */
          } else {
            if (body == null || body == undefined) {
              console.log('Error while calculation in LOD');
              let msg = "Error while Printing Report Online Body Blank";
              let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + body;
              //commented by vivek on 31-07-2020********************************
              //logFromPC.info(logQ);
              //logFromPC.addtoProtocolLog(logQ)
              //************************************************************** */
            } else {

              Object.assign(reportData, body);
              Object.assign(reportObj, { data: reportData, "FileName": reportName })
              if (printerName != "NA" && printerName != "" && printerName != null && printerName != 'None') {
                request({
                  url: `http://${serverConfig.hostApi}:${serverConfig.APIPORT}/API_V1/report/GenerateReport`,
                  method: 'POST',
                  body: reportObj,
                  json: true
                }, function (err, response, body) {
                  console.log(response);
                  console.log(body);
                  if (err) {
                    console.log('Error while Printing Report Online', err)
                    let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + err;
                    //commented by vivek on 31-07-2020********************************
                    //logFromPC.info(logQ);
                    //logFromPC.addtoProtocolLog(logQ)
                    //************************************************************** */
                  } else {
                    if (body == null || body == undefined) {
                      console.log('Error while Printing Report Online Body Blank');
                      let msg = "Error while Printing Report Online Body Blank";
                      let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + body;
                      //commented by vivek on 31-07-2020********************************
                      //logFromPC.info(logQ);
                      //logFromPC.addtoProtocolLog(logQ)
                      //************************************************************** */
                    } else {
                      var filepath = response.body.filepath;

                      let printRep = {}
                      Object.assign(
                        printRep,
                        { filepath: filepath },
                        { strSelectedPrinter: printerName }
                      )


                      request.post(`http://${serverConfig.hostApi}:${serverConfig.APIPORT}/API_V1/report/PrintReport`, { json: printRep }, (err, res, body) => {

                        if (err) {
                          console.log('Error while Printing Report Online', err)
                          let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + err;
                          //commented by vivek on 31-07-2020********************************
                          //logFromPC.info(logQ);
                          //logFromPC.addtoProtocolLog(logQ)
                          //************************************************************** */
                        } else {
                          console.log(res.body);
                          // setTimeout(()=>{return true;},2000)
                          const objPrintData = {

                            reportOption: ObjReportView.reportOption,
                            reportType: 'Complete',
                            recordFrom: 'Current',
                            strReason: '',
                            strUserId: Response.UserId,
                            strUserName: Response.UserName,
                            intPrintCount: 1
                          }
                          if (productType == 3) {
                            Object.assign(objPrintData, { RepSrNo: ObjReportView.RepSerNo })
                          } else {
                            Object.assign(objPrintData, { intReportSerNo: ObjReportView.RepSerNo })
                          }
                          var API_PATH = 'report/printcountup';
                          if (productType == 1) {
                            API_PATH = 'report/printcountup'
                          } else if (productType == 2) {
                            API_PATH = 'report/printcountupCapsule';
                          } else if (productType == 3) {
                            API_PATH = 'multihalerReport/increasePrintCountMultihaler';
                          }
                          request.post(`http://${serverConfig.hostApi}:${serverConfig.APIPORT}/API_V1/${API_PATH}`, { json: objPrintData }, (err, res1, body) => {
                            if (err) {
                              console.log(err)
                            } else {
                              console.log(res.body, res1.body);
                            }
                          })
                          return true

                        }
                      })
                    }
                  }
                });
              } else {
                console.log("Printer Name empty")
                let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + "Printer Name empty";
                //commented by vivek on 31-07-2020********************************
                //logFromPC.info(logQ);
                //logFromPC.addtoProtocolLog(logQ)
                //************************************************************** */
                return false;
              }
            }
          }
        });
      }
      else {
        Object.assign(reportData, { waterMark: false });
        Object.assign(reportObj, { data: reportData, "FileName": reportName })
        if (printerName != "NA" && printerName != "" && printerName != null && printerName != 'None') {
          request({
            url: `http://${serverConfig.hostApi}:${serverConfig.APIPORT}/API_V1/report/GenerateReport`,
            method: 'POST',
            body: reportObj,
            json: true
          }, function (err, response, body) {

            if (err) {
              console.log('Error while Printing Report Online', err)
              let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + err;
              //commented by vivek on 31-07-2020********************************
              //logFromPC.info(logQ);
              //logFromPC.addtoProtocolLog(logQ)
              //************************************************************** */
            } else {
              if (body == null || body == undefined) {
                console.log('Error while Printing Report Online Body Blank');
                let msg = "Error while Printing Report Online Body Blank";
                let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + body;
                //commented by vivek on 31-07-2020********************************
                //logFromPC.info(logQ);
                //logFromPC.addtoProtocolLog(logQ)
                //************************************************************** */
              } else {
                var filepath = response.body.filepath;

                let printRep = {}
                Object.assign(
                  printRep,
                  { filepath: filepath },
                  { strSelectedPrinter: printerName }
                )


                request.post(`http://${serverConfig.hostApi}:${serverConfig.APIPORT}/API_V1/report/PrintReport`, { json: printRep }, (err, res, body) => {

                  if (err) {
                    console.log('Error while Printing Report Online', err)
                    let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + err;
                    //commented by vivek on 31-07-2020********************************
                    //logFromPC.info(logQ);
                    //logFromPC.addtoProtocolLog(logQ)
                    //************************************************************** */
                  } else {
                    //console.log(res.body);
                    // setTimeout(()=>{return true;},2000)
                    const objPrintData = {

                      reportOption: ObjReportView.reportOption,
                      reportType: 'Complete',
                      recordFrom: 'Current',
                      strReason: '',
                      strUserId: Response.UserId,
                      strUserName: Response.UserName,
                      intPrintCount: 1
                    }
                    if (productType == 3) {
                      Object.assign(objPrintData, { RepSrNo: ObjReportView.RepSerNo })
                    } else {
                      Object.assign(objPrintData, { intReportSerNo: ObjReportView.RepSerNo })
                    }
                    var API_PATH = 'report/printcountup';
                    if (productType == 1) {
                      API_PATH = 'report/printcountup'
                    } else if (productType == 2) {
                      API_PATH = 'report/printcountupCapsule';
                    } else if (productType == 3) {
                      API_PATH = 'multihalerReport/increasePrintCountMultihaler';
                    }
                    request.post(`http://${serverConfig.hostApi}:${serverConfig.APIPORT}/API_V1/${API_PATH}`, { json: objPrintData }, (err, res1, body) => {
                      if (err) {
                        console.log(err)
                      } else {
                        console.log(res.body, res1.body);
                      }
                    })
                    return true

                  }
                })
              }
            }
          });
        } else {
          console.log("Printer Name empty")
          let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + "Printer Name empty";
          //commented by vivek on 31-07-2020********************************
          //logFromPC.info(logQ);
          //logFromPC.addtoProtocolLog(logQ)
          //************************************************************** */
          return false;
        }
      }

    } catch (error) {
      console.log('Error while Printing Report Online', error)
      let logQ = date.format(new Date(), 'DD-MM-YYYY HH:mm:ss') + error;
      //commented by vivek on 31-07-2020********************************
      //logFromPC.info(logQ);
      //logFromPC.addtoProtocolLog(logQ)
      //************************************************************** */
      return false;
    }
  }

}
module.exports = PrintReportOnline;