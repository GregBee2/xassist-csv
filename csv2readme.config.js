var csv2readme = require('csv2readme');
const definition = require("./package.json");

var options={
	input:{
		base:"../../helpData/csv/base.csv",
		functionParam:"../../helpData/csv/functionParameters.csv",
		classDef:"../../helpData/csv/classDefinition.csv"
	},
	moduleName:"xassist-csv",
	globalTOC:false,
	header:{
		title:"@xassist/xassist-csv",
		explanation:["This module parses CSV-strings and puts them in an array, so javascript can understand them. The different available options make sure most exotic CSV-files and derivatives can be parsed."].join("\r\n")
	},
	headerFiles:["../../helpData/markdown/installationModule.md"],
	includeDependencies:true,
	includeLicense:true,
	footerFiles:[/*"dependencies.md","src/license.md"*/],
	subTitle:"API",
	output:{
		file:"README.md"
	},
	baseLevel:3,
	headerTemplates:{
		moduleName:"xassist-csv",
		moduleUrl:"https://raw.githubusercontent.com/GregBee2/xassist-csv/master/dist/xAssist-csv.min.js",
		libraryName:"xassist",
		libraryUrl:"https://github.com/GregBee2/xassist",
		moduleTest:"object()"
	},
	footerTemplates:{
		/*license:definition.license,
		licenseUrl:"https://choosealicense.com/licenses/"+definition.license.toLowerCase()*/
	}
};
csv2readme.init(options);

	
	