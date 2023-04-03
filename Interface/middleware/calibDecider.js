const globalData = require('../global/globalData');
const DailyCalibrationModel = require('../model/Calibration/clsdailyCalibrationModel');
const PeriodicCalibrationModel = require('../model/Calibration/clsPeriodicCalibrationModel');
const UncertinityCalibrationModel = require('../model/Calibration/clsUncertinityCalib');
const RepetabilityCalibration = require('../model/Calibration/clsRepetabilityCalibration');
const EccentricityCaibration = require('../model/Calibration/clsEccentricityCalibration');
const LinearityCalibration = require('../model/Calibration/clslinearityCaibrationModel');
const PeriodicCalibrationVernierModel = require('../model/Calibration/clsVernierPeriodicCalibrationModel');
const clsActivityLog = require('../model/clsActivityLogModel');


const dailyCalibrationModel = new DailyCalibrationModel();
const periodiccalibrationModel = new PeriodicCalibrationModel();
const uncertinityCalibModel = new UncertinityCalibrationModel();
const repetabilityCalibration = new RepetabilityCalibration();
const eccentricityCaibration = new EccentricityCaibration();
const linearityCalibration = new LinearityCalibration();
const periodicCalibrationVernierModel = new PeriodicCalibrationVernierModel();
const objActivityLog = new clsActivityLog();

//************************************************************************************************************ */
// Below function Checks for which type of calibration is going on. calibType variable holds the current selected 
// calibration Type Also this function invokes On 'CP'
// maintain by Pradip Shinde
//************************************************************************************************************* */
async function calibPendingDecider(str_Protocol, IDSSrNo) {
   try {
        tempCailibType = globalData.arrcalibType.find(k=>k.idsNo == IDSSrNo); 
        var calibType = tempCailibType.calibType;
        console.log('from calibPendingDecider calibType:'+ calibType)
        switch (calibType) {
            case 'daily':
                var result = await dailyCalibrationModel.getCalibWeights(str_Protocol, IDSSrNo);
                return result;
            case 'periodic':
                var result = await  periodiccalibrationModel.getCalibWeights(str_Protocol, IDSSrNo)
                return result;
            case 'vernierPeriodic':
                var result = await  periodicCalibrationVernierModel.getCalibWeights(str_Protocol, IDSSrNo)
                return result;
            case 'uncertinity':
                var result = await uncertinityCalibModel.getCalibWeights(str_Protocol, IDSSrNo)
                return result;
            case 'repeatability':
                var result = await repetabilityCalibration.getCalibWeights(str_Protocol, IDSSrNo);
                return result;
            case 'eccentricity':
                var result = await eccentricityCaibration.getCalibWeights(str_Protocol, IDSSrNo);
                return result;
            case 'linearity':
                var result = await linearityCalibration.getCalibWeights(str_Protocol, IDSSrNo)
                return result;
            case 'positional':
                break;
            default:
                console.log('Cal Decider not set');
                break;
        }
    } catch (err){
        throw new Error(err);
    }
}
//************************************************************************************************************ */
// Below function Checks for which type of calibration is going on. calibType variable holds the current selected 
// calibration Type Also this function invokes On 'CB'
// maintain by Pradip Shinde
//************************************************************************************************************* */
async function calibDecider(str_Protocol, IDSSrNo) {
        try{
        var tempCailibType = globalData.arrcalibType.find(k=>k.idsNo == IDSSrNo); 
        var calibType = tempCailibType.calibType;
        const tempUserObject = globalData.arrUsers.find(k => k.IdsNo == IDSSrNo);
        switch (calibType) {
            case 'daily':
                var result = await dailyCalibrationModel.verifyWeights(str_Protocol, IDSSrNo);
                return result;
            case 'periodic':
                var result = await periodiccalibrationModel.verifyWeights(str_Protocol, IDSSrNo); 
                return result;
            case 'vernierPeriodic':
                var result = await  periodicCalibrationVernierModel.verifyWeights(str_Protocol, IDSSrNo)
                return result;
                break;
            case 'uncertinity':
                var result = await uncertinityCalibModel.verifyWeights(str_Protocol, IDSSrNo)
                return result;
            case 'repeatability':
                var result = await repetabilityCalibration.verifyWeights(str_Protocol, IDSSrNo);
                return result;
            case 'eccentricity':
                var result = await eccentricityCaibration.verifyWeights(str_Protocol, IDSSrNo);
                return result;
            case 'linearity':
                var result = await linearityCalibration.verifyWeights(str_Protocol, IDSSrNo);
                return result;
            case 'positional':
                break;
            default:
                console.log('Cal Decider not set');
                break;
        }
    } catch (err) {
        throw new Error(err);
    }
}
module.exports.calibPendingDecider = calibPendingDecider;
module.exports.calibDecider = calibDecider;