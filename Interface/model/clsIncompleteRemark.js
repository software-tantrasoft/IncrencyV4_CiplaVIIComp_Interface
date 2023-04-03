const globalData = require('../global/globalData');
const Database = require('../database/clsQueryProcess');
const database = new Database();

class IncompleteRemark {

    updateReportRemarkaftercommunicationoff(idsNo){
        return new Promise((resolve, reject) => {
            var tempObj = globalData.arrIncompleteRemark.find(k => k.IdsNo == idsNo);
            var productType = globalData.arrProductTypeArray.find(k => k.idsNo == idsNo);
            if (tempObj != undefined) {
                if (tempObj.Type != 0) {
                    if (tempObj.Type == 7) {
                        var updateObj = {
                            str_tableName: 'tbl_tab_masterhtd_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Communication Off' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        }
                    } else if (tempObj.Type == 'I') {
                        var updateObj = {
                            str_tableName: 'tbl_cap_master7_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Communication Off' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        }
                    } else if (tempObj.Type == 'P') {
                        if (productType.productType == 1) {
                            var updateObj = {
                                str_tableName: 'tbl_tab_master18_incomplete',
                                data: [
                                    { str_colName: 'RepoLabel12', value: 'Communication Off' },
                                ],
                                condition: [
                                    { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                                ]
                            }
                        } else {
                            var updateObj = {
                                str_tableName: 'tbl_cap_master18_incomplete',
                                data: [
                                    { str_colName: 'RepoLabel12', value: 'Communication Off' },
                                ],
                                condition: [
                                    { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                                ]
                            }
                        }
                    } else if (tempObj.Type == 'F') {
                        if (productType.productType == 1) {
                            var updateObj = {
                                str_tableName: 'tbl_tab_master17_incomplete',
                                data: [
                                    { str_colName: 'RepoLabel12', value: 'Communication Off' },
                                ],
                                condition: [
                                    { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                                ]
                            }
                        } else {
                            var updateObj = {
                                str_tableName: 'tbl_cap_master17_incomplete',
                                data: [
                                    { str_colName: 'RepoLabel12', value: 'Communication Off' },
                                ],
                                condition: [
                                    { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                                ]
                            }
                        }
                    }
                    else {
                        var prdTableName = 'tbl_tab_master';
                        if (productType.productType == 2) { prdTableName = 'tbl_cap_master' }
                        var updateObj = {
                            str_tableName: `${prdTableName}` + tempObj.Type + '_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Communication Off' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        }
                    }
    
                    database.update(updateObj).then(result => {
                        // return result;
                        resolve("Success");
                    }).catch(err => {
                        reject(err);
                    });
    
                    if (globalData.arrIncompleteRemark != undefined) {
                        globalData.arrIncompleteRemark = globalData.arrIncompleteRemark.filter(k => k.IdsNo != idsNo);
                    }
    
                } else {
                    return false;
                }
            } else {
                return true;
            }
        })
    }

    async updateReportRemark(idsNo) {
        try {
            var tempObj = globalData.arrIncompleteRemark.find(k => k.IdsNo == idsNo);
            var productType = globalData.arrProductTypeArray.find(k => k.idsNo ==idsNo);
            if (tempObj != undefined) {
                if (tempObj.Type != 0) {
                    if (tempObj.Type == 7) {
                        var updateObj = {
                            str_tableName: 'tbl_tab_masterhtd_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Aborted test' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        }
                    } else if(tempObj.Type == 'I'){
                        var updateObj = {
                            str_tableName: 'tbl_cap_master7_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Aborted test' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        }
                    } else if(tempObj.Type == 'P'){
                        if(productType.productType ==1) {
                        var updateObj = {
                            str_tableName: 'tbl_tab_master18_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Aborted test' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        }
                     } else {
                        var updateObj = {
                            str_tableName: 'tbl_cap_master18_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Aborted test' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        } 
                     }
                    } else if(tempObj.Type == 'F'){
                        if(productType.productType ==1) {
                        var updateObj = {
                            str_tableName: 'tbl_tab_master17_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Aborted test' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        }
                    } else {
                        var updateObj = {
                            str_tableName: 'tbl_cap_master17_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Aborted test' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        }  
                    }
                    }
                    else {
                        var prdTableName = 'tbl_tab_master';
                        if(productType.productType == 2){ prdTableName='tbl_cap_master'}
                        var updateObj = {
                            str_tableName: `${prdTableName}` + tempObj.Type + '_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Aborted test' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        } 
                    }

                    var result = await database.update(updateObj);
                    if (globalData.arrIncompleteRemark != undefined) {
                        globalData.arrIncompleteRemark = globalData.arrIncompleteRemark.filter(k => k.IdsNo != idsNo);
                    }
                    return result;
                } else {
                    return false;
                }
            } else {
                return true;
            }
        } catch (err) {
            console.log(err)
            return err;
        }
    }

    async updateReportRemarkOnLO(idsNo) {
        try {
            var tempObj = globalData.arrIncompleteRemark.find(k => k.IdsNo == idsNo);
            var productType = globalData.arrProductTypeArray.find(k => k.idsNo ==idsNo);
            if (tempObj != undefined) {
                if (tempObj.Type != 0) {
                    if (tempObj.Type == 7) {
                        var updateObj = {
                            str_tableName: 'tbl_tab_masterhtd_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Auto Log Out' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        }
                    } else if(tempObj.Type == 'I'){
                        var updateObj = {
                            str_tableName: 'tbl_cap_master7_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Auto Log Out' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        }
                    } else if(tempObj.Type == 'P'){
                        if(productType.productType ==1) {
                        var updateObj = {
                            str_tableName: 'tbl_tab_master18_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Auto Log Out' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        }
                     } else {
                        var updateObj = {
                            str_tableName: 'tbl_cap_master18_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Auto Log Out' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        } 
                     }
                    } else if(tempObj.Type == 'F'){
                        if(productType.productType ==1) {
                        var updateObj = {
                            str_tableName: 'tbl_tab_master17_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Auto Log Out' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        }
                      } else {
                        var updateObj = {
                            str_tableName: 'tbl_cap_master17_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Auto Log Out' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        }  
                      }
                    }
                    else {
                        var prdTableName = 'tbl_tab_master';
                        if(productType.productType == 2){ prdTableName='tbl_cap_master'}
                        var updateObj = {
                            str_tableName: `${prdTableName}` + tempObj.Type + '_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Auto Log Out' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        } 
                    }

                    var result = await database.update(updateObj);
                    if (globalData.arrIncompleteRemark != undefined) {
                        globalData.arrIncompleteRemark = globalData.arrIncompleteRemark.filter(k => k.IdsNo != idsNo);
                    }
                    return result;
                } else {
                    return false;
                }
            } else {
                return true;
            }
        } catch (err) {
            console.log(err)
            return err;
        }
    }


    async updateReportRemarkOnBalOF(idsNo) {
        try {
            var tempObj = globalData.arrIncompleteRemark.find(k => k.IdsNo == idsNo);
            var productType = globalData.arrProductTypeArray.find(k => k.idsNo ==idsNo);
            if (tempObj != undefined) {
                if (tempObj.Type != 0) {
                    if (tempObj.Type == 7) {
                        var updateObj = {
                            str_tableName: 'tbl_tab_masterhtd_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Balance Off' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        }
                    } else if(tempObj.Type == 'I'){
                        var updateObj = {
                            str_tableName: 'tbl_cap_master7_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Balance Off' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        }
                    } else if(tempObj.Type == 'P'){
                        if(productType.productType ==1) {
                        var updateObj = {
                            str_tableName: 'tbl_tab_master18_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Balance Off' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        }
                     } else {
                        var updateObj = {
                            str_tableName: 'tbl_cap_master18_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Balance Off' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        }
                     }
                    } else if(tempObj.Type == 'F'){
                        if(productType.productType ==1) {
                        var updateObj = {
                            str_tableName: 'tbl_tab_master17_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Balance Off' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        }
                    } else {
                        var updateObj = {
                            str_tableName: 'tbl_cap_master17_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Balance Off' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        }
                    }
                    }
                    else {
                        var prdTableName = 'tbl_tab_master';
                        if(productType.productType == 2){ prdTableName='tbl_cap_master'}
                        var updateObj = {
                            str_tableName: `${prdTableName}` + tempObj.Type + '_incomplete',
                            data: [
                                { str_colName: 'RepoLabel12', value: 'Balance Off' },
                            ],
                            condition: [
                                { str_colName: 'RepSerNo', value: tempObj.RepoSr, comp: 'eq' },
                            ]
                        } 
                    }

                    var result = await database.update(updateObj);
                    if (globalData.arrIncompleteRemark != undefined) {
                        globalData.arrIncompleteRemark = globalData.arrIncompleteRemark.filter(k => k.IdsNo != idsNo);
                    }
                    return result;
                } else {
                    return false;
                }
            } else {
                return true;
            }
        } catch (err) {
            console.log(err)
            return err;
        }
    }
}
module.exports = IncompleteRemark;