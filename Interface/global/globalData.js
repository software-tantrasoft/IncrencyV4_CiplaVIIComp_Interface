var WindowSerSockArray = [];        // holds WINDOW SERVICE SOCKETS
var arrWebSocket = []; // holds the Web sockets
var arrIdsInfo = []; // holds all the information cubicle/ IDS     Defination [{Sys_CubicNo : ,Sys_RptType:, Sys_IDSNo:}... etc]
// Most of declaration is for calibration below
var arrBalCalibWeights = []; //{idsNo:200,calibWt:[{},...]}
var arrGroupIPC = [];
var arrVerCalibWeights = []
var arrBalance = []; // holds balance info along w.r.t IDS No {idsNo: IDSSrNo, balance_info: result[0]}
var arrVernier = [];// holds balance info along w.r.t IDS No {idsNo: IDSSrNo, vernier_info: result[0]}
var arrUsers = []; // holds user info along w.r.t IDS No {idsNo: IDSSrNo, UserId: .., UserName:...}
var arrsAllParameters = []; // Holds all Parameters
var arrCpProtocol = []; // Not in use
var arrBalanceRecalibStatus = []; // holds the information from tbl_recalibration_balance_status table with no IDS signature
var arrBalanceRecalibStatusBin = [];
var arrCalibrationSequnce = []; // holds the calibration sequence with no IDS signature
var arrCalibNumber = [{ P: '2', U: '6', R: '7', E: '8', L: '9', V: '10' }];
var calibrationStatus = []; // holds calibration sequence for all balance [{balId:200, status: {P:1, R:0....}}];
var arrSortedCalib = []; // Holds the calibration type in sequence [P, E, U, R, .......] like that with no IDs signature
var arrcalibType = []; // Array holds the Current calibration type [{idsNo:200, calibType:'Daily'}]
var dimensionParam = [] // [{idsNo:200,dimention:},..] 
var arrBalCaibDet = []; // Array holds if periodic done [{strBalId:Bal01, isPeriodicDone:true/false},..]
var arrOldProtocol = []; // Repeat logic remain
//////////////////////////////////////////////////////////////////////
// Products related arrays below
var arrProductTypeArray = []; // holds the productType along with Ids no [{idsNo:IDSSrNo, productType:1},....]
var arr_limits = []; // holds the limits like nominal, upper, lower.... along with Ids no [{idsNo:IDSSrNo, indivisual:{nominal:0,lower:0.....}}]
var arr_menuList = []; // holds the menulist
var arr_IPQCRelIds = [];// holds the ipqc rel Ids like [{idsNo:IDSSrNo, selectedIds:IDSSrNo}]
var arrCubicleType = []; //holds the cubicle type [{idsNo:IDSSrNo, cubicleType:'Compression'}]
//dt and hardness data(note add this to Readme and flush this array <a to p>)
var arrBulkDataFlag = []; // [{IdsNo:200, flgDTFlag:true/false, flgHTFlag:true/false},..]
// var arrDTDataReading = [];
var arrDTData = []; // [{idsNo:200,arr_heading:[]},.....]
// var arrHardnessReading = [];
var sampleNo = 0;
var hardnessIncompleteId = []; // [{idsNo:200,incompRepSerNo:},....] 
var arrTDTData = []; // [{idsNo:200,arr:[]},.....]
var arrIntervalFlag = []; //[{IdsNo:200, flgFriabilityFlag:true/false}]
//OLD CODE FOR FRIABILITY arrInterval and arrActualRMP used
// var arrInterval = [];
// var arrActualRMP = [];
var arrFriabilityData = []; // [{idsNo:200,arr:[]},.....]
var arrHardnessTH1050=[];
var arrLodData = []; // [{idsNo:200,arr:[]},.....]
var arrLodFlag = []; // [{IdsNo:200, flgLodFlag:true/false},..]
var arrVernierData = []; //[{IdsNum:200, flag:true/false},..]
var alertArr = []; // index array
var arrsPwdComplexity = [];
var alertArrTemp = []; //index array
var arr_FlagCallibWeighment = []; // Array holds the flag if calibration or weighment is in process
// so that it can be used for alert setting [{idsNo:200,alertFlag:true/false},......]
var arrGranulationMenuType = []; // Array holds the menuType H OR T as when we show list of LOD then
// LS Protocol we have to send MS Protocol [ {idsNo:IdsNo, LODMenuType:MenuType},..]
var arrLODTypeSelectedMenu = []; // Array holds for granulation which type of LOD is selected
// for specific IDs = [{idsNo:200, selectedLOD:'compressed Dry'},.....] fill it out in LS Protocol 
var arrJARTypeDT = []; // Array holds the jar type selected for DT [{idsNo:200, JarType;A}]           
//Variable to store thickness and dimension value declared by salman//
var arrHardness425 = []; // [{idsNo:200,dimensionParam:0,thicknessVal:2.2,thicknessDecimal:5.3,dimensionVal:1,dimensionDecimal:2,sampleNo:0}] 
var arrHardnessMT50 = []; // [{idsNo:200,dimensionParam:0,thicknessVal:2.2,thicknessDecimal:5.3,dimensionVal:1,dimensionDecimal:2,sampleNo:0}] 

var arrHardness8M = []; //[{idsno:999,hadnessvalue : 2.3}]

var arrHardness8MvalidSampleflg = [];//[{hardnessflag:false,sampleFlag : flag}]

var arrHexInfo = []; // [{idsNo:200,IM:1/2/3/4}] // this will store the IDS/ HEX type i.e. IMG1 or IMC1/3/4

var arrBulkInvalid = [] // [{idsNo:200,DT:{invalid:true/false,invalidMsg:""},}]

var objNominclature = {} // { information from tbl_nomenclature}

var arrBinInfo = [] // [{IBin}] this will store data in format of Interface Ibin.

var arrBinSetting = [] // [{IBinSetting}] this will store data in format of Interface IBinSetting.

var arrTotalBins = [] // [{idsNo: 200, selBins:[ list of assigned bins for the cubicle.]}]

var arrBinIndex = [] // [{idsNo: 200, startIndex: 1, endIndex: 40}]
// var thicknessVal = 0;
// var thicknessDecimal = 0;
// var dimensionVal = 0;
// var dimensionDecimal = 0;
//end for declaring variables

// Exorting all arrays to be visible in all modules
//Communcation Array
var arrCommunication = []; // will be used for WebSocket
var arrUserRights = []; // [{idsNo:200, rights:[]},....]
var arrMonitCubic = [];
var arrLot = []; // [{idsNo : 200, MS:"",LotNo:"" }]
var arrIncompleteRemark = [];//this array is use to add incomplete remark.
var arrFlagForFailCalib = []; // this array is use to store status of calibration i.e Fail/complete
var arrMultihealerMS = []; // This array holds which is current menu in MLTHealer [{idsNo:200, menu:'Sealed cartriage'}]
var arrMultiHealerCal = []; // This array holds Tare, Actual, Net [{idsNo:200, dataValue1:100, dataValue2:110, netWt:10}]
var FrabilityOnBal = []; // [{idsNo:200, dataValue1:20, dataValue2:20},...]
var arrdifferential = [];// this array is to hold the fill and empty wgt of diff
var arrFriabilityMenuVisibility = []; // [{idsNo: 200, ETS:4}] // ETM-ESTIMATED TIME IN SECONDS
var arrHardnessDRSCPharmatron = []; // [{idsNo:200, oc:0,hardnessFlag:true,arr:[]}] // oc is how many times hardness word occured in string
var arrHardnessKramer = []; // [{idsNo:200, oc:0,hardnessFlag:true,arr:[]}] // oc is how many times hardness word occured in string
var arrAreaRelated = []; // [{idsNo:200, SelectedArea:'Compression'}];
var arrNetwtResult = [];// [{{idsNo:200, NetwtResult:''}}]
var arrDisplayFinalDiffWt = [];// [{{idsNo:200, filledWt:'',emptyWt:''}}]
var arrDTLABIndiaBasketTyep = [];//[{idsNo:200, Basket:A/B}]
var arrIPCLocation = []; // [{idsNo:200, location:'cubicle'}];
var arrIPCPeriodicFlag = [];
var arrPreWeighCalibOwner = []; /** As We have preWeighment check for balances i-e Wheather balance is connected or not, is balance 
having precalibration weights which will comman for both analytical and bin balance so who is the owner of this pre-Weighment 
functions i-e Analytical or bin balance so we can use this array to iidentify. [{idsNo:200, owner:'analytical'/ipc}] */
var arrDTmstSerNo = []; // [{idsNo:200, DtMstNo:'11'}];
var arGrpMschSpeedAndApp = [];
var arrTHHDrepet = [] /** When IDS send HD000 multiple times the as many times report is generated so we can update flag report 
generated on first recieved of HD000 and for rest we are sending + [{idsNo:200, flag :false,oc:0}]*/
var arrBFBO = []; // This array is used when there is balance and friability on same IDS [{idsNo:200, before:false,setParam:false,after:false}]
var arrPharmaMt50 = []; // This array holds the mt50 flags = [{idsNo:200,counter:0,hardnessFlag:false}]
var arrVernierRecalibration = []; // Recalibratio array for vernier
var arrVernierCalCMFlag = [];// [{idsNo:200,blnDone:false}];// this array is users in CM
var arrSideNo = [];// this is used to hold SideNo of particular weighment [{idsNo:200,SideNo = 1}];
var arrWhichMenuSideSelected = [];// this array holds which menu and side selected [{idsNo:200,menu:'Group',side:'L/R'}]
var arrisIMGBForBin = []; // [{idsNo:200, flag:false}];
var arrHardnessMT50Reading = [];// [idsNo:200, Readingflag:false ,RhCounter =0}];// this array holds the flag value when HArdness Data is started to send the data from HD001
var arrHardnessST50LAN = []; // This array will hold object {IPAddress: 192.168.1.1,Port:2255,ConnectionObj}
var arrContentCapsule = [] // This array hold the content Number {idsNo:200, contentNumber:0, totalContent:4}
var arrLLsampleRemark = []; //[{idsNo:200, remark:LE0/LE1}]
var arrRotaryTypeDT = [];
var arrHardnessPowerbackupFlag = [];
module.exports.arrGroupIPC = arrGroupIPC;
module.exports.arrHardnessPowerbackupFlag = arrHardnessPowerbackupFlag;
module.exports.arrHardnessTH1050=arrHardnessTH1050
module.exports.arrRotaryTypeDT = arrRotaryTypeDT;
module.exports.arrDTLABIndiaBasketTyep = arrDTLABIndiaBasketTyep;
module.exports.WindowSerSockArray = WindowSerSockArray;
module.exports.arrIPCPeriodicFlag = arrIPCPeriodicFlag;
module.exports.arrIdsInfo = arrIdsInfo;
module.exports.arrBalCalibWeights = arrBalCalibWeights;
module.exports.arrVerCalibWeights = arrVerCalibWeights;
module.exports.arrUsers = arrUsers;
module.exports.arrsAllParameters = arrsAllParameters;
module.exports.arrBalance = arrBalance; // This Arr Fills when each calib asked
module.exports.arrVernier = arrVernier;
module.exports.arrBalCaibDet = arrBalCaibDet; // This Arr Fills before chekcking calib
module.exports.arrCpProtocol = arrCpProtocol;
module.exports.arrBalanceRecalibStatus = arrBalanceRecalibStatus;
module.exports.arrBalanceRecalibStatusBin = arrBalanceRecalibStatusBin;
module.exports.arrCalibrationSequnce = arrCalibrationSequnce;
module.exports.arrCalibNumber = arrCalibNumber;
module.exports.arrcalibType = arrcalibType;
module.exports.calibrationStatus = calibrationStatus;
module.exports.arrSortedCalib = arrSortedCalib;
module.exports.arrProductTypeArray = arrProductTypeArray;
module.exports.arr_limits = arr_limits;
module.exports.arr_menuList = arr_menuList;
module.exports.arr_IPQCRelIds = arr_IPQCRelIds;
module.exports.arrCubicleType = arrCubicleType;
module.exports.arrWebSocket = arrWebSocket;
module.exports.arrCommunication = arrCommunication;
module.exports.arrBulkDataFlag = arrBulkDataFlag;
module.exports.arrBulkInvalid = arrBulkInvalid;
module.exports.arrBinInfo = arrBinInfo;
module.exports.arrTotalBins = arrTotalBins;
module.exports.arrBinIndex = arrBinIndex;
// module.exports.arrDTDataReading = arrDTDataReading;
module.exports.arrDTData = arrDTData;
// module.exports.arrHardnessReading = arrHardnessReading;
module.exports.sampleNo = sampleNo;
module.exports.arrTDTData = arrTDTData;
// module.exports.arrInterval = arrInterval;
// module.exports.arrActualRMP = arrActualRMP;
module.exports.arrIntervalFlag = arrIntervalFlag;
module.exports.hardnessIncompleteId = hardnessIncompleteId;
module.exports.dimensionParam = dimensionParam;
module.exports.arrFriabilityData = arrFriabilityData;
// module.exports.dimensionVal = dimensionVal;
// module.exports.thicknessVal = thicknessVal;
// module.exports.thicknessDecimal = thicknessDecimal;
// module.exports.dimensionDecimal = dimensionDecimal;
module.exports.arrLodData = arrLodData;
module.exports.arrLodFlag = arrLodFlag;
module.exports.arrOldProtocol = arrOldProtocol;
module.exports.arrVernierData = arrVernierData;
module.exports.alertArr = alertArr;
module.exports.alertArrTemp = alertArrTemp;
module.exports.arr_FlagCallibWeighment = arr_FlagCallibWeighment;
module.exports.arrGranulationMenuType = arrGranulationMenuType;
module.exports.arrLODTypeSelectedMenu = arrLODTypeSelectedMenu;
module.exports.arrJARTypeDT = arrJARTypeDT;
module.exports.arrHardness425 = arrHardness425;
module.exports.arrUserRights = arrUserRights;
module.exports.arrHexInfo = arrHexInfo;
module.exports.arrMonitCubic = arrMonitCubic;
module.exports.arrIncompleteRemark = arrIncompleteRemark;
module.exports.arrLot = arrLot;
module.exports.arrFlagForFailCalib = arrFlagForFailCalib;
module.exports.objNominclature = objNominclature;
module.exports.arrMultihealerMS = arrMultihealerMS;
module.exports.arrMultiHealerCal = arrMultiHealerCal;
module.exports.FrabilityOnBal = FrabilityOnBal;
module.exports.arrdifferential = arrdifferential;
module.exports.arrFriabilityMenuVisibility = arrFriabilityMenuVisibility;
module.exports.arrHardnessDRSCPharmatron = arrHardnessDRSCPharmatron;
module.exports.arrHardnessKramer = arrHardnessKramer
module.exports.arrHardness8M = arrHardness8M;
module.exports.arrHardness8MvalidSampleflg = arrHardness8MvalidSampleflg;
module.exports.arrsPwdComplexity = arrsPwdComplexity;
module.exports.arrAreaRelated = arrAreaRelated;
module.exports.arrNetwtResult = arrNetwtResult;
module.exports.arrDisplayFinalDiffWt = arrDisplayFinalDiffWt;
module.exports.arrIPCLocation = arrIPCLocation;
module.exports.arrPreWeighCalibOwner = arrPreWeighCalibOwner;
module.exports.arrDTmstSerNo = arrDTmstSerNo;
module.exports.arGrpMschSpeedAndApp = arGrpMschSpeedAndApp;
module.exports.arrTHHDrepet = arrTHHDrepet;
module.exports.arrBFBO = arrBFBO;
module.exports.arrPharmaMt50 = arrPharmaMt50;
module.exports.arrVernierRecalibration = arrVernierRecalibration;
module.exports.arrVernierCalCMFlag = arrVernierCalCMFlag;
module.exports.arrSideNo = arrSideNo;
module.exports.arrWhichMenuSideSelected = arrWhichMenuSideSelected;
module.exports.arrisIMGBForBin = arrisIMGBForBin;
module.exports.arrBinSetting = arrBinSetting;
module.exports.arrHardnessMT50 = arrHardnessMT50;
module.exports.arrHardnessMT50Reading = arrHardnessMT50Reading;
module.exports.arrHardnessST50LAN = arrHardnessST50LAN;
module.exports.arrContentCapsule = arrContentCapsule;
module.exports.arrLLsampleRemark = arrLLsampleRemark;

