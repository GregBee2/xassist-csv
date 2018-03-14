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

tape("csv().toArray(): Optional parameters for csv", function(test) {
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
tape("csv().toArray(): Optional parameters for toArray (callBack)", function(test) {
	var colonText=textFile(";","\r\n");
	var fn=function(row,rowIndex){
		if(row[0]==="header1"){
			return ["header"]
		}
		else if(rowIndex==2&&row[0]==="val1_row2"){
			return ["2ndRow"]
		}
		else if(rowIndex==1&&row[0]==="val1_row2"){
			return ["2ndRow_withHeaders"]
		}
		return row
	}
	var resultExpected=testData.slice(0);
	resultExpected[0]= ["header"];
	resultExpected[2]= ["2ndRow"];
	var simple=csv().toArray(colonText,fn);
	test.deepEqual(simple.result,resultExpected,
		"csv().toArray(txt,callBack) executes a callback on each row");
	simple=csv({headersIncluded:true}).toArray(colonText,fn);
	resultExpected[2]= ["2ndRow_withHeaders"];
	test.deepEqual(simple.result,resultExpected.slice(1),
		"csv({headersIncluded:true}).toArray(txt,callBack) works as intended");
	test.deepEqual(simple.header,["header1","header2","header3"],
		"csv({headersIncluded:true}).toArray(txt,callBack) does not execute callBack on header");
	test.end();
});
tape("csv().toArray(): Optional parameters for toArray (headers)", function(test) {
	var simple=csv().toArray(textFile(";","\r\n"),undefined,["h1","h2"]);
	test.deepEqual(simple.header,["h1","h2"],
		"csv().toArray(txt,,headers) setsHeaders");
	simple=csv({headersIncluded:true}).toArray(textFile(";","\r\n"),undefined,["h1","h2"]);
	test.deepEqual(simple.header,["h1","h2"],
		"csv({headersIncluded:true}).toArray(txt,,headers) setsHeaders");
	test.deepEqual(simple.result,testData.slice(1),
		"csv({headersIncluded:true}).toArray(txt,,headers) removes first line with expected headers");
	test.end();
});
tape("csv().toArray(): Multilinehandling and escaping values", function(test) {
	var simple=csv().toArray("value1;\"value 2\r\n\secondline\"\" with escaped quote\"\r\nrealsecondLine");
	test.ok(checkCSVArray(simple,2,[2,1]) && simple.result[0][1]==="value 2\r\n\secondline\" with escaped quote",
		"csv() handle escaped doublequotes and multilines in quoted values" );
	test.end();
});
tape("csv().toArray(): EOL handling and usage of multiple delimiters", function(test) {
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

tape("csv().toArray(): Option Spec [headersIncluded (default:false)]", function(test) {
	var simple=csv(",",{headersIncluded:true}).toArray(textFile(",","\r\n"));
	test.ok(checkCSVArray(simple,4,3) && checkheaders(simple,["header1","header2","header3"]),
		"csv(\",\",{headersIncluded:true}).toArray(textString) splits on \",\"  and includes headers in resultObject (first row)" );
	simple=csv({headersIncluded:true}).toArray("f_1;f_1;f_0;f_0\r"+textFile(";","\r\n"));
	test.deepEqual(simple.header,["f_1","f_2","f_0","f_3"],
		"csv(\";\",{headersIncluded:true}) makes sure all headers are unique");
	simple=csv({headersIncluded:true}).toArray("f_1;\"f_\"1;f\"_0;f_0\r"+textFile(";","\r\n"));
	test.ok(simple.validCSV==false  && simple.error.id==="incorrectTrailingQuote" && simple.error.lineIndex==0,
		"csv({headersIncluded:true}) returns the correct error when one found in header eg unescaped sequence");
	test.end();
});

tape("csv().toArray(): Option Spec [headerPrefix (default:\'column_\')]", function(test) {
	var options={headersIncluded:true,headerPrefix:"t_"};
	var simple=csv(options).toArray("fakeHeader1;;\r"+textFile(";","\r\n"));
	
	test.deepEqual(simple.header,["fakeHeader1","t_1","t_2"],
		"csv(\";\",{headerPrefix:\"x\"}) prefixes unknown headers (empty values in first line)");
	test.end();
});
tape("csv().toArray(): Option Spec [spaceAllowedBetweenDelimiterAndQuote (default:true)]", function(test) {
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

tape("csv().toArray(): Option Spec [treatConsecutiveDelmitersAsOne (default:false)]", function(test) {
	var normalText="start;;normalIndex2;;;;normalIndex6; ;normalIndex8"
	var simple=csv().toArray(normalText);
	
	test.ok( checkCSVArray(simple,1,9),
		"csv() treats consecutive delimiters as  empty value (default value treatConsecutiveDelmitersAsOne=FALSE)");
	simple=csv({treatConsecutiveDelmitersAsOne:true}).toArray(normalText);
	test.deepEqual(simple.result,[["start","normalIndex2","normalIndex6",null,"normalIndex8"]],
		"csv({treatConsecutiveDelmitersAsOne:true}) treats consecutive delimiters as  1 delimiter, a space between values is really considerd as a (empty) value");
	test.end();
});
tape("csv().toArray(): Option Spec [emptyValuesAreNull (default:true)]", function(test) {
	var normalText="start; ;end"
	var simple=csv().toArray(normalText);
	test.deepEqual(simple.result,[["start",null,"end"]],
		"csv() treats empty values as null (default value emptyValuesAreNull=TRUE)");
	simple=csv({emptyValuesAreNull:false}).toArray(normalText);
	test.deepEqual(simple.result,[["start","","end"]],
		"csv({emptyValuesAreNull:false}) treats empty values as \'\'");
	test.end();
});
tape("csv().toArray(): Option Spec [trimValues (default:true)]", function(test) {
	var normalText="   start  ;    trimmed   ;  end  \r  secondLine   ;  \tvalue2  \t  test  \t"
	var simple=csv().toArray(normalText);
	test.deepEqual(simple.result,[["start","trimmed","end"],["secondLine","value2  \t  test"]],
		"csv() trims the spaces around values (default value trimValues=TRUE)");
	simple=csv({trimValues:false}).toArray(normalText);
	test.deepEqual(simple.result,[["   start  ","    trimmed   ","  end  "],["  secondLine   ","  \tvalue2  \t  test  \t"]],
		"csv({trimValues:false}) treats empty values as \'\'");
	simple=csv("\t",{trimValues:true}).toArray(normalText);
	test.deepEqual(simple.result,[["start  ;    trimmed   ;  end"],["secondLine   ;","value2","test",null]],
		"csv(\"\\t\",{trimValues:true}) delimiter takes precedence over trimming");
	test.end();
});

tape("csv().toArray(): Option Spec [removeLeadingEmptyRows (default:true)]", function(test) {
	var normalText="\r\n\rstart;mid;end"
	var simple=csv().toArray(normalText);
	test.deepEqual(simple.result,[["start","mid","end"]],
		"csv() removes leading empty rows (default value removeLeadingEmptyRows=TRUE)");
	simple=csv({removeLeadingEmptyRows:false}).toArray(normalText);
	test.deepEqual(simple.result,[[null],[null],["start","mid","end"]],
		"csv({removeLeadingEmptyRows:false}) does not remove leading empty rows");
	test.end();
});
tape("csv().toArray(): Option Spec [removeTrailingEmptyRows (default:true)]", function(test) {
	var normalText="start;mid;end\r\n\r\r"
	var simple=csv().toArray(normalText);
	test.deepEqual(simple.result,[["start","mid","end"]],
		"csv() removes trialing empty rows (default value removeTrailingEmptyRows=TRUE)");
	simple=csv({removeTrailingEmptyRows:false}).toArray(normalText);
	test.deepEqual(simple.result,[["start","mid","end"],[null],[null],[null]],
		"csv({removeTrailingEmptyRows:false}) does not remove trailing empty rows");
	test.end();
});
tape("csv().toArray(): Option Spec [removeInnerEmptyRows (default:false)]", function(test) {
	var normalText="start\r\n\rmid\r\n\rend"
	var simple=csv().toArray(normalText);
	test.deepEqual(simple.result,[["start"],[null],["mid"],[null],["end"]],
		"csv() does not remove the inner empty rows (default value removeInnerEmptyRows=FALSE) - this maybe trimmed");
	simple=csv({removeInnerEmptyRows:true}).toArray(normalText);
	test.deepEqual(simple.result,[["start"],["mid"],["end"]],
		"csv({removeInnerEmptyRows:true}) removes the inner empty rows");
	test.end();
});

