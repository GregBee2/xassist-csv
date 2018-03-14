var definition = require("../package.json");
var { csv }=require("../"+definition.main);
var tape=require("tape");
var  { object  } =require( "@xassist/xassist-object");
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
function checkCSVObject(csvObj,numberOfLines,numberOfValues){
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
		if (Object.keys(v).length!==n[i]){
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
function checkRowKeys(row,keysExpected){
	for (var i=0,len=Object.keys(row).length;i<len;i++){
		if (Object.keys(row)[i]!==keysExpected[i]){
			return false;
		}
	}
	return true;
}

tape("csv().toObject(): Optional parameters for csv", function(test) {
	var commaText=textFile(",","\r\n");
	var colonText=textFile(";","\r\n");
	
	var simple=csv(",",{headersIncluded:true}).toObject(commaText);
	var simple2=csv({headersIncluded:true}).toObject(colonText);
	var simple3=csv(",").toObject(commaText);
	var simple4=csv().toObject(colonText);
	test.deepEqual(simple,simple2,
		"csv(delimiter,options) equals to csv(options),delimiter is optional when default delimiter is used (\";\") and options set");
	test.deepEqual(simple3,simple4,
		"csv(delimiter) equals to csv(), delimiter is optional when default delimiter is used (\";\") without options set");
	test.deepEqual(simple3.result.slice(1).map(v=>object(v).toArray),simple.result.map(v=>object(v).toArray),
		"csv(delimiter) equals to csv(options), both parse correctly and options is optional parameter");
	test.end();
});
tape("csv().toObject(): Optional parameters for toArray (callBack)", function(test) {
	var colonText=textFile(";","\r\n");
	var fn=function(row,rowIndex){
		if(row["column_0"]==="header1"){
			return {column_0:"header"}
		}
		else if(rowIndex==2&&row["column_0"]==="val1_row2"){
			return {column_0:"2ndRow"}
		}
		else if(rowIndex==1&&row["header1"]==="val1_row2"){
			return {column_0:"2ndRow_withHeaders"}
		}
		return row
	}
	var resultExpected=[
		{column_0:"header"},
		{column_0:"val1_row1",column_1:"val2_row1",column_2:"val3_row1"},
		{column_0:"2ndRow"},
		{column_0:"val1_row3",column_1:"val2_row3",column_2:"val3_row3"},
		{column_0:"val1_row4",column_1:"val2_row4",column_2:"val3_row4"}
	];
	var simple=csv().toObject(colonText,fn);
	test.deepEqual(simple.result,resultExpected,
		"csv().toObject(txt,callBack) executes a callback on each row");
	simple=csv({headersIncluded:true}).toObject(colonText,fn);
	 resultExpected=[
		{header1:"val1_row1",header2:"val2_row1",header3:"val3_row1"},
		{column_0:"2ndRow_withHeaders"},                              
		{header1:"val1_row3",header2:"val2_row3",header3:"val3_row3"},
		{header1:"val1_row4",header2:"val2_row4",header3:"val3_row4"}
	];
	test.deepEqual(simple.result,resultExpected,
		"csv({headersIncluded:true}).toObject(txt,callBack) works as intended");
	test.deepEqual(simple.header,["header1","header2","header3"],
		"csv({headersIncluded:true}).toObject(txt,callBack) does not execute callBack on header");
	test.end();
});
tape("csv().toObject(): Optional parameters for toObject (headers)", function(test) {
	var simple=csv().toObject(textFile(";","\r\n"),undefined,["h1","h2"]);
	test.ok(checkheaders(simple,["h1","h2"]) && checkRowKeys(simple.result[0],["h1","h2","column_2"]),
		"csv().toArray(txt,undefined,headers) sets headers even for resulting object");
	simple=csv({headersIncluded:true}).toObject(textFile(";","\r\n"),undefined,["h1","h2"]);
	test.deepEqual(simple.header,["h1","h2"],
		"csv({headersIncluded:true}).toObject(txt,undefined,headers) sets headers");
	test.ok(checkCSVObject(simple,4,3) && checkRowKeys(simple.result[0],["h1","h2","column_2"]),
		"csv({headersIncluded:true}).toObject(txt,undefined,headers) removes first line with expected headers");
	test.end();
});
tape("csv().toObject(): Multilinehandling and escaping values", function(test) {
	var simple=csv().toObject("value1;\"value 2\r\n\secondline\"\" with escaped quote\"\r\nrealsecondLine");
	test.ok(checkCSVObject(simple,2,[2,1]) && simple.result[0]["column_1"]==="value 2\r\n\secondline\" with escaped quote",
		"csv() handle escaped doublequotes and multilines in quoted values" );
	test.end();
});
tape("csv().toObject(): EOL handling and usage of multiple delimiters", function(test) {
	var simpleRN=csv().toObject(textFile(";","\r\n"));
	var simpleR=csv().toObject(textFile(";","\r"));
	var simpleN=csv().toObject(textFile(";","\n"));
	test.ok(checkCSVObject(simpleRN,5,3) && checkCSVObject(simpleR,5,3) && checkCSVObject(simpleN,5,3) ,
		"csv().toObject(textString) splits on \";\" and can parse different types of EOL");
	simpleRN=csv(",;").toObject(textFile(",","\r\n") +"\rv1;v2;v3");
	test.ok(checkCSVObject(simpleRN,6,3),
		"csv(\",;\").toObject(textString) splits on \",\" and \";\" and works with mixes of EOL");
	test.ok(/[\r\n]/.test(simpleRN.result.concat(simpleR.result).concat(simpleN.result).map(v=>object(v).toArray().join('')).join(''))===false,
		"csv().toObject(textString) removes all non escaped EOL even \r\n");
	test.end();
});

tape("csv().toObject(): Option Spec [headersIncluded (default:false)]", function(test) {
	var simple=csv(",",{headersIncluded:true}).toObject(textFile(",","\r\n"));
	test.ok(checkCSVObject(simple,4,3) && checkheaders(simple,["header1","header2","header3"]),
		"csv(\",\",{headersIncluded:true}).toObject(textString) splits on \",\"  and includes headers in resultObject (first row)" );
	simple=csv({headersIncluded:true}).toObject("f_1;f_1;f_0;f_0\r"+textFile(";","\r\n"));
	test.deepEqual(simple.header,["f_1","f_2","f_0","f_3"],
		"csv(\";\",{headersIncluded:true}) makes sure all headers are unique");
	simple=csv({headersIncluded:true}).toObject("f_1;\"f_\"1;f\"_0;f_0\r"+textFile(";","\r\n"));
	test.ok(simple.validCSV==false  && simple.error.id==="incorrectTrailingQuote" && simple.error.lineIndex==0,
		"csv({headersIncluded:true}) returns the correct error when one found in header eg unescaped sequence");
	test.end();
});

tape("csv().toObject(): Option Spec [headerPrefix (default:\'column_\')]", function(test) {
	var options={headersIncluded:true,headerPrefix:"t_"};
	var simple=csv(options).toObject("fakeHeader1;;\r"+textFile(";","\r\n"));
	
	test.deepEqual(simple.header,["fakeHeader1","t_1","t_2"],
		"csv(\";\",{headerPrefix:\"x\"}) prefixes unknown headers (empty values in first line)");
	 simple=csv(options).toObject("fakeHeader1\r"+textFile(";","\r\n"));
	
	test.deepEqual(Object.keys(simple.result[0]),["fakeHeader1","t_1","t_2"],
		"csv(\";\",{headerPrefix:\"x\"}) prefixes unknown headers even inside the object");
	test.end();
});
tape("csv().toObject(): Option Spec [spaceAllowedBetweenDelimiterAndQuote (default:true)]", function(test) {
	var allSpacedText="   \""+textFile("\"   ;   \"","\"   \r\n   \"")+"\"   ";
	var normalText=textFile(";","\r");
	var simple=csv().toObject(allSpacedText);
	var normal=csv({spaceAllowedBetweenDelimiterAndQuote:false}).toObject(normalText);
	
	test.deepEqual(simple.result,normal.result,
		"csv() allows spaces between delimiter and value (default value spaceAllowedBetweenDelimiterAndQuote=TRUE)");
	var error=csv({spaceAllowedBetweenDelimiterAndQuote:false}).toObject(normalText+"\r"+allSpacedText);
	test.ok(error.validCSV===false && error.error.id==="incorrectQuote" && checkCSVObject(error,5,3) && error.error.lineIndex===5,
		"csv( spaceAllowedBetweenDelimiterAndQuote:false) forbids spaces between delimiter and value and returns an error, the error breaks on correct line and gives parsed rows uptill then")
	test.end();
});

tape("csv().toObject(): Option Spec [treatConsecutiveDelmitersAsOne (default:false)]", function(test) {
	var normalText="start;;normalIndex2;;;;normalIndex6; ;normalIndex8"
	var simple=csv().toObject(normalText);
	
	test.ok( checkCSVObject(simple,1,9),
		"csv() treats consecutive delimiters as  empty value (default value treatConsecutiveDelmitersAsOne=FALSE)");
	simple=csv({treatConsecutiveDelmitersAsOne:true,headerPrefix:"c"}).toObject(normalText);
	test.deepEqual(simple.result,[{c0:"start",c1:"normalIndex2",c2:"normalIndex6",c3:null,c4:"normalIndex8"}],
		"csv({treatConsecutiveDelmitersAsOne:true}) treats consecutive delimiters as  1 delimiter, a space between values is really considerd as a (empty) value");
	test.end();
});
tape("csv().toObject(): Option Spec [emptyValuesAreNull (default:true)]", function(test) {
	var normalText="start; ;end"
	var simple=csv({headerPrefix:"c"}).toObject(normalText);
	test.deepEqual(simple.result,[{c0:"start",c1:null,c2:"end"}],
		"csv() treats empty values as null (default value emptyValuesAreNull=TRUE)");
	simple=csv({emptyValuesAreNull:false,headerPrefix:"c"}).toObject(normalText);
	test.deepEqual(simple.result,[{c0:"start",c1:"",c2:"end"}],
		"csv({emptyValuesAreNull:false}) treats empty values as \'\'");
	test.end();
});
tape("csv().toObject(): Option Spec [trimValues (default:true)]", function(test) {
	var normalText="   start  ;    trimmed   ;  end  \r  secondLine   ;  \tvalue2  \t  test  \t"
	var simple=csv({headerPrefix:"c"}).toObject(normalText);
	test.deepEqual(simple.result,[{c0:"start",c1:"trimmed",c2:"end"},{c0:"secondLine",c1:"value2  \t  test"}],
		"csv() trims the spaces around values (default value trimValues=TRUE)");
	simple=csv({trimValues:false,headerPrefix:"c"}).toObject(normalText);
	test.deepEqual(simple.result,[{c0:"   start  ",c1:"    trimmed   ",c2:"  end  "},{c0:"  secondLine   ",c1:"  \tvalue2  \t  test  \t"}],
		"csv({trimValues:false}) treats empty values as \'\'");
	simple=csv("\t",{trimValues:true,headerPrefix:"c"}).toObject(normalText);
	test.deepEqual(simple.result,[{c0:"start  ;    trimmed   ;  end"},{c0:"secondLine   ;",c1:"value2",c2:"test",c3:null}],
		"csv(\"\\t\",{trimValues:true}) delimiter takes precedence over trimming");
	test.end();
});

tape("csv().toObject(): Option Spec [removeLeadingEmptyRows (default:true)]", function(test) {
	var normalText=" \r\n\rstart;mid;end"
	var simple=csv({headerPrefix:"c"}).toObject(normalText);
	test.deepEqual(simple.result,[{c0:"start",c1:"mid",c2:"end"}],
		"csv() removes leading empty rows (default value removeLeadingEmptyRows=TRUE)");
	simple=csv({removeLeadingEmptyRows:false,headerPrefix:"c"}).toObject(normalText);
	test.deepEqual(simple.result,[{c0:null},{c0:null},{c0:"start",c1:"mid",c2:"end"}],
		"csv({removeLeadingEmptyRows:false}) does not remove leading empty rows");
	test.end();
});
tape("csv().toObject(): Option Spec [removeTrailingEmptyRows (default:true)]", function(test) {
	var normalText="start;mid;end\r\n\r\r"
	var simple=csv({headerPrefix:"c"}).toObject(normalText);
	test.deepEqual(simple.result,[{c0:"start",c1:"mid",c2:"end"}],
		"csv() removes trialing empty rows (default value removeTrailingEmptyRows=TRUE)");
	simple=csv({removeTrailingEmptyRows:false,headerPrefix:"c"}).toObject(normalText);
	test.deepEqual(simple.result,[{c0:"start",c1:"mid",c2:"end"},{c0:null},{c0:null},{c0:null}],
		"csv({removeTrailingEmptyRows:false}) does not remove trailing empty rows");
	test.end();
});
tape("csv().toObject(): Option Spec [removeInnerEmptyRows (default:false)]", function(test) {
	var normalText="start\r\n\rmid\r\n\rend"
	var simple=csv({headerPrefix:"c"}).toObject(normalText);
	test.deepEqual(simple.result,[{c0:"start"},{c0:null},{c0:"mid"},{c0:null},{c0:"end"}],
		"csv() does not remove the inner empty rows (default value removeInnerEmptyRows=TRUE) - this maybe trimmed");
	simple=csv({removeInnerEmptyRows:true,headerPrefix:"c"}).toObject(normalText);
	test.deepEqual(simple.result,[{c0:"start"},{c0:"mid"},{c0:"end"}],
		"csv({removeInnerEmptyRows:true}) removes the inner empty rows");
	test.end();
});

