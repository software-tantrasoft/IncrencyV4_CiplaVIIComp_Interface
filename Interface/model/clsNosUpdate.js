const database = require('../database/clsQueryProcess');
const objDatabase = new database();
class UpdateNOS {

    /**
     * To Update the NOS of Individual and Group on the EN Protocol.
     *
     * @param {*} objCubicle : object of cubicle 
     * @param {*} Sample : Edited NOS
     * @param {string} [IndORGrp="1"] : Indicates individual or group sample tobe edited 1 : Ind 2 : Grp
     * @returns Promise with Success or err
     * @memberof UpdateNOS
     * @author Pradip shinde
     */
    // updateSample(objCubicle, Sample, IndORGrp = "1") {
    //     return new Promise((resolve, reject) => {
    //         const objNOSIndiv = {
    //             str_tableName: "tbl_cubicle_product_sample",
    //             data: [

    //             ],
    //             condition: [
    //                 { str_colName: "Sys_CubicNo", value: objCubicle.Sys_CubicNo },
    //                 { str_colName: "Sys_BFGCode", value: objCubicle.Sys_BFGCode },
    //                 { str_colName: "Sys_ProductName", value: objCubicle.Sys_ProductName },
    //                 { str_colName: "Sys_PVersion", value: objCubicle.Sys_PVersion },
    //                 { str_colName: "Sys_Version", value: objCubicle.Sys_Version },

    //             ]
    //         }

    //         if (IndORGrp == "1") {
    //             objNOSIndiv.data.push({ str_colName: "Individual", value: Sample });
    //         }
    //         else if (IndORGrp == "2") {
    //             objNOSIndiv.data.push({ str_colName: "Group", value: Sample });
    //         } else if (IndORGrp == "3") {
    //             // FOR FRIABILITY
    //             objNOSIndiv.data.push({ str_colName: "Friability", value: Sample });
    //         } else if (IndORGrp == "4") {
    //             // FOR FRIABILITY
    //             objNOSIndiv.data.push({ str_colName: "DT", value: Sample });
    //         }

    //         objDatabase.update(objNOSIndiv).then(res => {
    //             resolve("Success");
    //         }).catch(err => {
    //             reject(err);
    //         })

    //     })
    // }

    updateSample(objCubicle, Sample, IndORGrp = "1") {
        return new Promise((resolve, reject) => {
            const objNOSIndiv = {
                str_tableName: "tbl_cubicle_product_sample",
                data: [

                ],
                condition: [
                    { str_colName: "Sys_CubicNo", value: objCubicle.Sys_CubicNo },
                    { str_colName: "Sys_BFGCode", value: objCubicle.Sys_BFGCode },
                    { str_colName: "Sys_ProductName", value: objCubicle.Sys_ProductName },
                    { str_colName: "Sys_PVersion", value: objCubicle.Sys_PVersion },
                    { str_colName: "Sys_Version", value: objCubicle.Sys_Version },

                ]
            }

            if (IndORGrp == "1") {
                objNOSIndiv.data.push({ str_colName: "Individual", value: Sample });
            }
            else if (IndORGrp == "2") {
                objNOSIndiv.data.push({ str_colName: "Group", value: Sample });
            } else if (IndORGrp == "3") {
                // FOR FRIABILITY
                objNOSIndiv.data.push({ str_colName: "Friability", value: Sample });
            } else if (IndORGrp == "4") {
                // FOR dt
                objNOSIndiv.data.push({ str_colName: "DT", value: Sample });
            } else if (IndORGrp == "5") {
                // FOR Hardness
                objNOSIndiv.data.push({ str_colName: "Individual", value: Sample });
            }

            objDatabase.update(objNOSIndiv).then(res => {
                resolve("Success");
            }).catch(err => {
                reject(err);
            })

        })
    }


}
module.exports = UpdateNOS;