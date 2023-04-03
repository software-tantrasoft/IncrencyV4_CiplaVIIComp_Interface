// Server Config modules
// maintain by - Pradip Shinde
var config = require('../../../increncyV4Cipla7GoaConfig.json')
var configForProject = require('./projectName.json');
var units = require('./units.json')
strIpSeries = config.strIpSeries;
host = config.host;
hostApi = config.hostApi;
port = config.port; 203;
maxDevices = 20;
MonitPort = config.MonitPort;
dbHost = config.dbHost;
dbUser = config.dbUser;
dbPass = config.dbPass;
dbName = config.dbName;
dbHost = config.dbHost;
dbType = config.dbType == undefined ? 'mysql' : config.dbType;
friabilityType = config.friabilityType == undefined ? 'OB' : config.friabilityType;//OB,OF,BFBO,BFBT
isLDAP = config.isLDAP;
APIPORT = config.APIPORT;
ProjectName = configForProject.ProjectName
CompanyName = configForProject.CompanyName
Individual = units.Individual == undefined ? 'g' : units.Individual;
Group = units.Group == undefined ? 'g' : units.Group;
Vernier = units.Vernier == undefined ? 'mm' : units.Vernier;
Differential = units.Differential == undefined ? 'g' : units.Differential;
DryCart = units.DryCart == undefined ? 'mg' : units.DryCart;
NetCart = units.NetCart == undefined ? 'mg' : units.NetCart;
DryPwd = units.DryPwd == undefined ? 'mg' : units.DryPwd;
SealedCart = units.SealedCart == undefined ? 'g' : units.SealedCart;
DTDateandTime = config.DTDateandTime == undefined ? 'now' : config.DTDateandTime;//string/now
calculationDigit = config.calculationDigit == undefined ? '4' : config.calculationDigit;
hardnessOnTCP = config.hardnessOnTCP == undefined ? false : config.hardnessOnTCP;
// tareFlag = config.tareFlag == undefined? "MLH":config.tareFlag;// for hosure
tareFlag = config.tareFlag == undefined ? "Indore" : config.tareFlag; // for rest of the project

isPowerBackup = config.isPowerBackup == undefined ? false : config.isPowerBackup;


module.exports.host = host
module.exports.hostApi = hostApi
module.exports.port = port
module.exports.maxDevices = maxDevices
module.exports.strIpSeries = strIpSeries
module.exports.dbUser = dbUser
module.exports.dbPass = dbPass
module.exports.dbName = dbName
module.exports.dbHost = dbHost
module.exports.isLDAP = isLDAP
module.exports.MonitPort = MonitPort
module.exports.APIPORT = APIPORT
module.exports.ProjectName = ProjectName
module.exports.CompanyName = CompanyName
module.exports.dbType = dbType
module.exports.friabilityType = friabilityType
//unit import sction*************//
module.exports.Individual = Individual
module.exports.Group = Group
module.exports.Vernier = Vernier;
module.exports.Differential = Differential;
module.exports.DryCart = DryCart;
module.exports.NetCart = NetCart;
module.exports.DryPwd = DryPwd;
module.exports.SealedCart = SealedCart;
//*************************** */
// Dt module date/time config
module.exports.DTDateandTime = DTDateandTime;
module.exports.calculationDigit = calculationDigit;
module.exports.hardnessOnTCP = hardnessOnTCP;
module.exports.tareFlag = tareFlag;
module.exports.isPowerBackup = isPowerBackup;
