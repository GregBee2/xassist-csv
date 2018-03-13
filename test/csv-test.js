var definition = require("../package.json");
var { csv }=require("../"+definition.main);
var tape=require("tape");

var testData=[
	["header1","header2","header3"],
	["val1_row1","val2_row1","val3_row1"],
	["val1_row2","val2_row2","val3_row2"],
	["val1_row3","val2_row3","val3_row3"],
	["val1_row4","val2_row4","val3_row4"]
]
var textFile=function(delimiter,EOL){
	return testData.map(function(v){return v.join(delimiter)}).join(EOL)
}
function checkCSVArray(csvObj,numberOfLines,numberOfValues){
	var result=true;
	n=[];
	if (typeof numberOfValues==="number"){
		for(var i=0;i<numberOfLines;i++){
			n.push(numberOfValues);
		}
	}
	else{
		//array
		n=numberOfValues;
		
	}
	if(csvObj.result.length!==numberOfLines){
		return false;
	}
	csvObj.result.forEach(function(v,i){
		if (v.length!==n[i]){
			result= false;
		}
	});
	return result;
}
function checkheaders(csvObject,headersExpected){
	for (var i=0,len=csvObject.header.length;i<len;i++){
		if (csvObject.header[i]!==headersExpected[i]){
			return false;
		}
	}
	return true;
}

tape("csv([delimiter],[options]) delimiter and/or options are optional", function(test) {
	var commaText=textFile(",","\r\n");
	var colonText=textFile(";","\r\n");
	
	var simple=csv(",",{headersIncluded:true}).toArray(commaText);
	var simple2=csv({headersIncluded:true}).toArray(colonText);
	var simple3=csv(",").toArray(commaText);
	var simple4=csv().toArray(colonText);
	test.deepEqual(simple,simple2,
		"csv(delimiter,options) equals to csv(options),delimiter is optional when default delimiter is used (\";\") and options set");
	test.deepEqual(simple3,simple4,
		"csv(delimiter) equals to csv(), delimiter is optional when default delimiter is used (\";\") without options set");
	test.deepEqual(simple3.result.slice(1),simple.result,
		"csv(delimiter) equals to csv(options), both parse correctly and options is optional parameter");
	test.end();
});

tape("csv([delimiter]) can parse different EOL and can use multiple delimiters in one file", function(test) {
	var simpleRN=csv().toArray(textFile(";","\r\n"));
	var simpleR=csv().toArray(textFile(";","\r"));
	var simpleN=csv().toArray(textFile(";","\n"));
	test.ok(checkCSVArray(simpleRN,5,3) && checkCSVArray(simpleR,5,3) && checkCSVArray(simpleN,5,3) ,
		"csv().toArray(textString) splits on \";\" and can parse different types of EOL");
	simpleRN=csv(",;").toArray(textFile(",","\r\n") +"\rv1;v2;v3");
	test.ok(checkCSVArray(simpleRN,6,3),
		"csv(\",;\").toArray(textString) splits on \",\" and \";\" and works with mixes of EOL");
	test.ok(/[\r\n]/.test(simpleRN.result.concat(simpleR.result).concat(simpleN.result).map(v=>v.join('')).join(''))===false,
		"csv().toArray(textString) removes all non escaped EOL even \r\n");
	test.end();
});

tape("csv({headersIncluded:true}) reads in a textString and parses it with respect to headers", function(test) {
	var simple=csv(",",{headersIncluded:true}).toArray(textFile(",","\r\n"));
	test.ok(checkCSVArray(simple,4,3) && checkheaders(simple,["header1","header2","header3"]),
		"csv(\",\",{headersIncluded:true}).toArray(textString) splits on \",\"  and includes headers in resultObject (first row)" );
	simple=csv({headersIncluded:true}).toArray("f_1;f_1;f_0;f_0\r"+textFile(";","\r\n"));
	test.deepEqual(simple.header,["f_1","f_2","f_0","f_3"],
		"csv(\";\",{headersIncluded:true}) makes sure all headers are unique");
	test.end();
});

tape("csv({headerPrefix:\"testColumn_\"}) adds correct headerPrefix for undefined columns", function(test) {
	var options={headersIncluded:true,headerPrefix:"t_"};
	var simple=csv(options).toArray("fakeHeader1;;\r"+textFile(";","\r\n"));
	
	test.deepEqual(simple.header,["fakeHeader1","t_1","t_2"],
		"csv(\";\",{headerPrefix:\"x\"}) prefixes unknown headers (empty values in first line)");
	test.end();
});
tape("csv({spaceAllowedBetweenDelimiterAndQuote:false}) forbids space between escaped value (with \") and delimiter", function(test) {
	var allSpacedText="   \""+textFile("\"   ;   \"","\"   \r\n   \"")+"\"   ";
	var normalText=textFile(";","\r");
	var simple=csv().toArray(allSpacedText);
	var normal=csv({spaceAllowedBetweenDelimiterAndQuote:false}).toArray(normalText);
	
	test.deepEqual(simple.result,normal.result,
		"csv() allows spaces between delimiter and value (default value spaceAllowedBetweenDelimiterAndQuote=TRUE)");
	var error=csv({spaceAllowedBetweenDelimiterAndQuote:false}).toArray(normalText+"\r"+allSpacedText);
	test.ok(error.validCSV===false && error.error.id==="incorrectQuote" && checkCSVArray(error,5,3) && error.error.lineIndex===5,
		"csv( spaceAllowedBetweenDelimiterAndQuote:false) forbids spaces between delimiter and value and returns an error, the error breaks on correct line and gives parsed rows uptill then")
	test.end();
});

tape("csv({treatConsecutiveDelmitersAsOne:true}) treats 2 consecutive delimiters as one", function(test) {
	var normalText="start;;normalIndex2;;;;normalIndex6; ;normalIndex8"
	var simple=csv().toArray(normalText);
	
	test.ok( checkCSVArray(simple,1,9),
		"csv() treats consecutive delimiters as  empty value (default value treatConsecutiveDelmitersAsOne=FALSE)");
	simple=csv({treatConsecutiveDelmitersAsOne:true}).toArray(normalText);
	test.deepEqual(simple.result,[["start","normalIndex2","normalIndex6",null,"normalIndex8"]],
		"csv({treatConsecutiveDelmitersAsOne:true}) treats consecutive delimiters as  1 delimiter, a space between values is really considerd as a (empty) value");
	test.end();
});


