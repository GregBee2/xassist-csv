const definition = require("./package.json");
const dependencies = Object.keys(definition.dependencies || {});
var endOfLine = require('os').EOL;
var bannerText="/**"+endOfLine+
	"* @preserve" +endOfLine+
	"* "+(definition.homepage||definition.name)+" Version "+definition.version+"."+endOfLine+
	"* "+"// Copyright "+(new Date).getFullYear()+" "+definition.author.name+"."+endOfLine+
	"* "+"// Created on "+(new Date).toUTCString()+"."+endOfLine+
	"*/";
//var ignoreUMD=endOfLine+endOfLine+"/*istanbul ignore next*/"; //ignore umd definition
var _format="umd";

var args=process.argv
var formatArgs=["-f","--output.format"];

for (let i=0,len=args.length;i<len;i++){
	for(let j=0,len2=formatArgs.length;j<len2;j++){
		if(args[i]===formatArgs[j]){
			_format=args[++i];
			break;
		}
		else if(args[i].indexOf(formatArgs[j]+"=")===0){
			_format=args[i].split("=")[1];
		}
	}
}

export default {
	input: './index.js',
	external: dependencies,
	plugins:[],
	output:{
		extend: true,
		file: definition.main,
		format: _format,
		globals: dependencies.reduce((p, v) => (p[v] = "xa", p), {}),
		name:'xa',
		banner:bannerText
	}	
};