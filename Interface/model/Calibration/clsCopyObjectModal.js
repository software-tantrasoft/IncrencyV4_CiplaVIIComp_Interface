// ***************************************************************************************************var 
var serverConfig = require('../../global/severConfig')
class CopyObject {
    constructor() {
    }
    // periodic copy object for master and details
    periodic(fromCopyTblName, toCopyTableName, oldRepSrNo, RecSrNo, type) {
        return new Promise((resolve, reject) => {
            if (type == 'master') {
                var copyObj = {
                    fromCopyTblName: fromCopyTblName,
                    toCopyTableName: toCopyTableName,
                    data: [
                        { str_colName: 'Periodic_CalbDate' },
                        { str_colName: 'Periodic_CalbTime' },
                        { str_colName: 'Periodic_BalID' },
                        { str_colName: 'Periodic_BalSrNo' },
                        { str_colName: 'Periodic_Make' },
                        { str_colName: 'Periodic_Model' },
                        { str_colName: 'Periodic_Unit' },
                        { str_colName: 'Periodic_Dept' },
                        { str_colName: 'Periodic_LeastCnt' },
                        { str_colName: 'Periodic_MaxCap' },
                        { str_colName: 'Periodic_MinCap' },
                        { str_colName: 'Periodic_ZeroError' },
                        { str_colName: 'Periodic_SpritLevel' },
                        { str_colName: 'Periodic_GerneralCare' },
                        { str_colName: 'Periodic_UserID' },
                        { str_colName: 'Periodic_UserName' },
                        { str_colName: 'Periodic_VerifyID' },
                        { str_colName: 'Periodic_VerifyName' },
                        { str_colName: 'Periodic_PrintNo' },
                        { str_colName: 'Periodic_IsRecalib' },
                        { str_colName: 'Periodic_CubicalNo' },
                        { str_colName: 'Periodic_Bal_MaxoptRange' },
                        { str_colName: 'Periodic_Bal_MinoptRange' },
                        { str_colName: 'Periodic_RoomNo' },
                        { str_colName: 'Periodic_DueDate' },
                        { str_colName: 'Decimal_Point' },
                        { str_colName: 'Periodic_StdWeight' },
                        { str_colName: 'Periodic_NegTol' },
                        { str_colName: 'Periodic_PosTol' },
                        { str_colName: 'Periodic_Location' },
                        { str_colName: 'Periodic_IsBinBalance' },
                    ],
                    condition: [
                        { str_colName: 'Periodic_RepNo', value: oldRepSrNo }
                    ]
                }
                if(serverConfig.ProjectName == 'SunHalolGuj1') {
                    copyObj.data.push({ str_colName: 'Periodic_AllWeightboxID' },
                    { str_colName: 'Periodic_AllWeightboxCert' },
                    { str_colName: 'Periodic_AllWeightboxValidUpto' },)
                }
                resolve(copyObj);
            } else {
                var copyObj = {
                    fromCopyTblName: fromCopyTblName,
                    toCopyTableName: toCopyTableName,
                    data: [
                        { str_colName: 'Periodic_RecNo' },
                        { str_colName: 'Periodic_BalStdWt' },
                        { str_colName: 'Periodic_BalNegTol' },
                        { str_colName: 'Periodic_BalPosTol' },
                        { str_colName: 'Periodic_ActualWt' },
                        { str_colName: 'Periodic_StdWtBoxID' },
                        { str_colName: 'Periodic_StdWt' },
                        { str_colName: 'Periodic_WtIdentification' },
                        { str_colName: 'Periodic_WeightBox_certfctNo' },
                        { str_colName: 'PercentofCapacity' },
                        { str_colName: 'Periodic_ValDate' },
                    ],
                    condition: [
                        { str_colName: 'Periodic_RepNo', value: oldRepSrNo },
                        { str_colName: 'Periodic_RecNo', value: RecSrNo }
                    ]
                }
                resolve(copyObj);
            }
        })
    }
    //********************************************************************************** */
    // repetability copy object for master and details
    repetability(fromCopyTblName, toCopyTableName, oldRepSrNo, RecSrNo, type) {
        return new Promise((resolve, reject) => {
            if (type == 'master') {
                var copyObj = {
                    fromCopyTblName: fromCopyTblName,
                    toCopyTableName: toCopyTableName,
                    data: [
                        { str_colName: 'Repet_CalbDate' },
                        { str_colName: 'Repet_CalbTime' },
                        { str_colName: 'Repet_BalID' },
                        { str_colName: 'Repet_BalSrNo' },
                        { str_colName: 'Repet_Make' },
                        { str_colName: 'Repet_Model' },
                        { str_colName: 'Repet_Unit' },
                        { str_colName: 'Repet_Dept' },
                        { str_colName: 'Repet_LeastCnt' },
                        { str_colName: 'Repet_MaxCap' },
                        { str_colName: 'Repet_MinCap' },
                        { str_colName: 'Repet_ZeroError' },
                        { str_colName: 'Repet_SpritLevel' },
                        { str_colName: 'Repet_GerneralCare' },
                        { str_colName: 'Repet_UserID' },
                        { str_colName: 'Repet_UserName' },
                        { str_colName: 'Repet_Location' },
                        { str_colName: 'Repet_RoomNo' },
                        { str_colName: 'Decimal_Point' },
                        { str_colName: 'Repet_DueDate' },
                        { str_colName: 'Repet_PrintNo' },
                        { str_colName: 'Repet_VerifyID' },
                        { str_colName: 'Repet_VerifyName' },
                        { str_colName: 'Repet_VerifyDate' },
                        { str_colName: 'Repet_StdWeight' },
                        { str_colName: 'Repet_NegTol' },
                        { str_colName: 'Repet_PosTol' },
                        { str_colName: 'Repet_IsBinBalance' },
                    ],
                    condition: [
                        { str_colName: 'Repet_RepNo', value: oldRepSrNo }
                    ]
                }
                if(serverConfig.ProjectName == 'SunHalolGuj1') {
                    copyObj.data.push({ str_colName: 'Repet_AllWeightboxID' },
                    { str_colName: 'Repet_AllWeightboxCert' },
                    { str_colName: 'Repet_AllWeightboxValidUpto' },)
                }
                resolve(copyObj);
            } else {
                var copyObj = {
                    fromCopyTblName: fromCopyTblName,
                    toCopyTableName: toCopyTableName,
                    data: [
                        { str_colName: 'Repet_RecNo' },
                        { str_colName: 'Repet_BalStdWt' },
                        { str_colName: 'Repet_BalNegTol' },
                        { str_colName: 'Repet_BalPosTol' },
                        { str_colName: 'Repet_ActualWt' },
                        { str_colName: 'Repet_StdWtID' },
                        { str_colName: 'Repet_StdWt' },
                        { str_colName: 'Repet_WtIdentification' },
                        { str_colName: 'Repet_WeightBox_certfctNo' },
                        { str_colName: 'PercentofCapacity' },
                        { str_colName: 'Repet_ValDate' },
                    ],
                    condition: [
                        { str_colName: 'Repet_RepNo', value: oldRepSrNo },
                        { str_colName: 'Repet_RecNo', value: RecSrNo }
                    ]
                }
                resolve(copyObj);
            }
        })
    }
    //********************************************************************************** */
    // uncertinity copy object for master and details
    uncertinity(fromCopyTblName, toCopyTableName, oldRepSrNo, RecSrNo, type) {
        return new Promise((resolve, reject) => {
            if (type == 'master') {
                var copyObj = {
                    fromCopyTblName: fromCopyTblName,
                    toCopyTableName: toCopyTableName,
                    data: [
                        { str_colName: 'Uncertinity_CalbDate' },
                        { str_colName: 'Uncertinity_CalbTime' },
                        { str_colName: 'Uncertinity_BalID' },
                        { str_colName: 'Uncertinity_BalSrNo' },
                        { str_colName: 'Uncertinity_Make' },
                        { str_colName: 'Uncertinity_Model' },
                        { str_colName: 'Uncertinity_Unit' },
                        { str_colName: 'Uncertinity_Dept' },
                        { str_colName: 'Uncertinity_LeastCnt' },
                        { str_colName: 'Uncertinity_MaxCap' },
                        { str_colName: 'Uncertinity_MinCap' },
                        { str_colName: 'Uncertinity_ZeroError' },
                        { str_colName: 'Uncertinity_SpritLevel' },
                        { str_colName: 'Uncertinity_GerneralCare' },
                        { str_colName: 'Uncertinity_UserID' },
                        { str_colName: 'Uncertinity_UserName' },
                        { str_colName: 'Uncertinity_DueDate' },
                        { str_colName: 'Uncertinity_Location' },
                        { str_colName: 'Uncertinity_RoomNo' },
                        { str_colName: 'Decimal_Point' },
                        { str_colName: 'Uncertinity_PrintNo' },
                        { str_colName: 'Uncertinity_VerifyID' },
                        { str_colName: 'Uncertinity_VerifyName' },
                        { str_colName: 'Uncertinity_VerifyDate' },
                        { str_colName: 'Uncertinity_StdWeight' },
                        { str_colName: 'Uncertinity_NegTol' },
                        { str_colName: 'Uncertinity_PosTol' },
                        { str_colName: 'Uncertinity_IsBinBalance' },

                    ],
                    condition: [
                        { str_colName: 'Uncertinity_RepNo', value: oldRepSrNo }
                    ]
                }
                resolve(copyObj);
            } else {
                var copyObj = {
                    fromCopyTblName: fromCopyTblName,
                    toCopyTableName: toCopyTableName,
                    data: [
                        { str_colName: 'Uncertinity_RecNo' },
                        { str_colName: 'Uncertinity_BalStdWt' },
                        { str_colName: 'Uncertinity_BalNegTol' },
                        { str_colName: 'Uncertinity_BalPosTol' },
                        { str_colName: 'Uncertinity_ActualWt' },
                        { str_colName: 'Uncertinity_StdWtID' },
                        { str_colName: 'Uncertinity_StdWt' },
                        { str_colName: 'Uncertinity_WtIdentification' },
                        { str_colName: 'Uncertinity_WeightBox_certfctNo' },
                        { str_colName: 'PercentofCapacity' },
                        { str_colName: 'Uncertinity_ValDate' },
                    ],
                    condition: [
                        { str_colName: 'Uncertinity_RepNo', value: oldRepSrNo },
                        { str_colName: 'Uncertinity_RecNo', value: RecSrNo }
                    ]
                }
                resolve(copyObj);
            }
        })
    }
    //********************************************************************************** */
    // eccentricity copy object for master and details
    eccentricity(fromCopyTblName, toCopyTableName, oldRepSrNo, RecSrNo, type) {
        return new Promise((resolve, reject) => {
            if (type == 'master') {
                var copyObj = {
                    fromCopyTblName: fromCopyTblName,
                    toCopyTableName: toCopyTableName,
                    data: [
                        { str_colName: 'Eccent_CalbDate' },
                        { str_colName: 'Eccent_CalbTime' },
                        { str_colName: 'Eccent_BalID' },
                        { str_colName: 'Eccent_BalSrNo' },
                        { str_colName: 'Eccent_Make' },
                        { str_colName: 'Eccent_Model' },
                        { str_colName: 'Eccent_Unit' },
                        { str_colName: 'Eccent_Dept' },
                        { str_colName: 'Eccent_LeastCnt' },
                        { str_colName: 'Eccent_MaxCap' },
                        { str_colName: 'Eccent_MinCap' },
                        { str_colName: 'Eccent_ZeroError' },
                        { str_colName: 'Eccent_SpritLevel' },
                        { str_colName: 'Eccent_GerneralCare' },
                        { str_colName: 'Eccent_UserID' },
                        { str_colName: 'Eccent_UserName' },
                        { str_colName: 'Eccent_VerifyName' },
                        { str_colName: 'Eccent_VerifyDate' },
                        { str_colName: 'Eccent_Location' },
                        { str_colName: 'Eccent_RoomNo' },
                        { str_colName: 'Decimal_Point' },
                        { str_colName: 'Eccent_DueDate' },
                        { str_colName: 'Eccent_PrintNo' },
                        { str_colName: 'Eccent_StdWeight' },
                        { str_colName: 'Eccent_NegTol' },
                        { str_colName: 'Eccent_PosTol' },
                        { str_colName: 'Eccent_IsBinBalance' },
                        
                    ],
                    condition: [
                        { str_colName: 'Eccent_RepNo', value: oldRepSrNo }
                    ]
                }
                if(serverConfig.ProjectName == 'SunHalolGuj1') {
                    copyObj.data.push({ str_colName: 'Eccent_AllWeightboxID' },
                    { str_colName: 'Eccent_AllWeightboxCert' },
                    { str_colName: 'Eccent_AllWeightboxValidUpto' },)
                }
                resolve(copyObj);
            } else {
                var copyObj = {
                    fromCopyTblName: fromCopyTblName,
                    toCopyTableName: toCopyTableName,
                    data: [
                        { str_colName: 'Eccent_RecNo' },
                        { str_colName: 'Eccent_BalStdWt' },
                        { str_colName: 'Eccent_BalNegTol' },
                        { str_colName: 'Eccent_BalPosTol' },
                        { str_colName: 'Eccent_ActualWt' },
                        { str_colName: 'Eccent_StdWtID' },
                        { str_colName: 'Eccent_StdWt' },
                        { str_colName: 'Eccent_WtIdentification' },
                        { str_colName: 'Eccent_WeightBox_certfctNo' },
                        { str_colName: 'PercentofCapacity' },
                        { str_colName: 'Eccent_ValDate' },

                    ],
                    condition: [
                        { str_colName: 'Eccent_RepNo', value: oldRepSrNo },
                        { str_colName: 'Eccent_RecNo', value: RecSrNo }
                    ]
                }
                resolve(copyObj);
            }
        })
    }
    //********************************************************************************** */
    // linearity copy object for master and details
    linearity(fromCopyTblName, toCopyTableName, oldRepSrNo, RecSrNo, type) {
        return new Promise((resolve, reject) => {
            if (type == 'master') {
                var copyObj = {
                    fromCopyTblName: fromCopyTblName,
                    toCopyTableName: toCopyTableName,
                    data: [
                        { str_colName: 'Linear_CalbDate' },
                        { str_colName: 'Linear_CalbTime' },
                        { str_colName: 'Linear_BalID' },
                        { str_colName: 'Linear_BalSrNo' },
                        { str_colName: 'Linear_Make' },
                        { str_colName: 'Linear_Model' },
                        { str_colName: 'Linear_Unit' },
                        { str_colName: 'Linear_Dept' },
                        { str_colName: 'Linear_LeastCnt' },
                        { str_colName: 'Linear_MaxCap' },
                        { str_colName: 'Linear_MinCap' },
                        { str_colName: 'Linear_ZeroError' },
                        { str_colName: 'Linear_SpritLevel' },
                        { str_colName: 'Linear_GerneralCare' },
                        { str_colName: 'Linear_UserID' },
                        { str_colName: 'Linear_UserName' },
                        { str_colName: 'Linear_VerifyID' },
                        { str_colName: 'Linear_VerifyName' },
                        { str_colName: 'Linear_VerifyDate' },
                        { str_colName: 'Linear_PrintNo' },
                        { str_colName: 'Linear_IsRecalib' },
                        { str_colName: 'Linear_Location' },
                        { str_colName: 'Linear_RoomNo' },
                        { str_colName: 'Decimal_Point' },
                        { str_colName: 'Linear_DueDate' },
                        { str_colName: 'Linear_StdWeight' },
                        { str_colName: 'Linear_NegTol' },
                        { str_colName: 'Linear_PosTol' },
                        { str_colName: 'Linear_IsBinBalance' },
                    ],
                    condition: [
                        { str_colName: 'Linear_RepNo', value: oldRepSrNo }
                    ]
                }
                resolve(copyObj);
            } else {
                var copyObj = {
                    fromCopyTblName: fromCopyTblName,
                    toCopyTableName: toCopyTableName,
                    data: [
                        { str_colName: 'Linear_RecNo' },
                        { str_colName: 'Linear_BalStdWt' },
                        { str_colName: 'Linear_BalNegTol' },
                        { str_colName: 'Linear_BalPosTol' },
                        { str_colName: 'Linear_ActualWt' },
                        { str_colName: 'Linear_StdWtBoxID' },
                        { str_colName: 'Linear_StdWt' },
                        { str_colName: 'Linear_WtIdentification' },
                        { str_colName: 'Linear_WeightBox_certfctNo' },
                        { str_colName: 'PercentofCapacity' },
                        { str_colName: 'Linear_ValDate' },
                    ],
                    condition: [
                        { str_colName: 'Linear_RepNo', value: oldRepSrNo },
                        { str_colName: 'Linear_RecNo', value: RecSrNo }
                    ]
                }
                resolve(copyObj);
            }
        })
    }

}
// CLASS ENDS
module.exports = CopyObject;