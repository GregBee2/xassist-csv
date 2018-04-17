/**
* @preserve
* https://github.com/GregBee2/xassist-csv#readme Version 1.0.8.
*  Copyright 2018 undefined.
*  Created on Tue, 17 Apr 2018 10:40:57 GMT.
*/
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@xassist/xassist-object'), require('@xassist/xassist-array')) :
	typeof define === 'function' && define.amd ? define(['exports', '@xassist/xassist-object', '@xassist/xassist-array'], factory) :
	(factory((global.xa = global.xa || {}),global.xa,global.xa));
}(this, (function (exports,xassistObject,xassistArray) { 'use strict';

var _delimiter = [59]; //point comma
var _options = {
	headersIncluded: false, //first records are headers of files,
	headerPrefix: "column_", //used for unknown colums or if headers are not included
	spaceAllowedBetweenDelimiterAndQuote: true,
	treatConsecutiveDelmitersAsOne: false,
	removeLeadingEmptyRows: true, //removes if all values are null or spaced
	removeTrailingEmptyRows: true,
	removeInnerEmptyRows: false,
	trimValues: true,
	emptyValuesAreNull: true
};
var _errorMessages = {
	incorrectTrailingQuote: 'Unexpected token found after closing Quote for value',
	incorrectQuote: 'Unexpected Quote found inside value'
};
function _setOptions(o,newVals) {
	return xassistObject.object(o).mergeUnique(newVals);
}
function _setDelimiter(a) {
	var delimiter = [];
	for (var i = 0, l = a.length; i < l; i++) {
		delimiter.push(a.charCodeAt(i));
	}
	return delimiter;
}
function _getReFormat(delimiter) {
		return new RegExp("[\"" + delimiter.map(String.fromCharCode).join("") + "\n\r]");
	}
function csv(/*delimiters,options*/) {
	var options = xassistObject.object(_options).clone(),
		delimiter = _delimiter,
		indexAfterHeader=0,
		regexpFormat= _getReFormat(delimiter);
	if (arguments.length === 1) {
		if (typeof arguments[0] === "string") {
			delimiter=_setDelimiter(arguments[0]);
			regexpFormat = _getReFormat(delimiter);
		} else {
			options=_setOptions(options,arguments[0]);
		}
	} else if (arguments.length > 1) {
		delimiter=_setDelimiter(arguments[0]);
		regexpFormat = _getReFormat(delimiter);
		options=_setOptions(options,arguments[1]);
	}
	function _isNumeric(n) {
		//todo move to main
		return !isNaN(parseFloat(n)) && isFinite(n);
	}
	function _getHeader(text) {
		var res,origName,suffix,splitValue,currentValue;
		indexAfterHeader = 0; //reset index
		while (res = csvParser(text, undefined, options, delimiter, indexAfterHeader, 0), indexAfterHeader = res.endIndex, res.result.length !== 1 && res.validCSV);
		
		if(res.validCSV){
			//remove null or empty values
			res.result[0]=xassistArray.array(res.result[0]).replaceNull(function(v,i){return options.headerPrefix+i});
			//make really unique values
			for (var i=0,len=res.result[0].length;i<len;i++){
				//array without current Element
				currentValue=res.result[0][i];
				while(res.result[0].indexOf(currentValue)<i&&res.result[0].indexOf(currentValue)>-1){
					//found value before that equals this
					splitValue=currentValue.split("_");
					if(splitValue.length===1){
						origName=splitValue[0];
						suffix=-1;
					}
					else{
						suffix=splitValue.pop();
						if(_isNumeric(suffix)&&Number(suffix)%1===0){
							suffix=Number(suffix);
							origName=splitValue.join("_");
						}
						else{
							origName=splitValue.concat(suffix).join("_");
							suffix=-1;
							
						}
						
					}
					currentValue=origName+"_"+(++suffix);
				}
				res.result[0][i]=currentValue;
			}
		}
		return res;
	}
	function formatResult(parsedCSV, headers) {
		parsedCSV.header = headers;
		if (!parsedCSV.validCSV) {
			parsedCSV.error.message = _errorMessages[parsedCSV.error.id];
		}
		return parsedCSV;
	}
	function rowArrayToText(row, d) {
		return row.map(function (v) {
			return valueToText(v);
		}).join(d);
	}
	function rowObjectToText(headers) {
		var h = headers.reduce(function (res, v, i) {
				res[v] = i;
				return res;
			}, {});
		return function (row, d) {
			var result = [];
			xassistObject.object(row).forEach(function (value, key) {
				if (!h.hasOwnProperty(key)) h[key] = Object.keys(h).length;
				result[h[key]] = valueToText(value);
			});
			return result.join(d);
		};
	}
	function valueToText(value) {
		//if value has delimiter, quote or RETURN or NEWLINE this is a quotedValue;
		//quotes should be replaced by doublequotes
		if (value === null)
			return "";
		else {
			return regexpFormat.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
		}
	}
	function arrayToObject(columns, prefix) {
		columns = Array.isArray(columns) ? columns : [];
		prefix = prefix || "field_";
		//make sure prefix is unique with respect to existing columns;
		prefix = columns.reduce(function (res, v) {
				while (v.substr(0, res.length) === res) {
					res = res + "_";
				}
				return res;
			}, prefix);
		return function (row) {
			return row.reduce(function (result, value, index) {
				var key = columns[index] || (prefix + index);
				result[key] = value;
				return result;
			}, {});
		};
	}
	
	function toArray(text, callBack, headers) {
		//returns array for each row, with header row as columns if specified in options
		//with optional callback on each row
		var h; //if options is set first row will always be filtered
		if (options.headersIncluded) {
			h = _getHeader(text); //we even do this when headers is set because the first row needs to be removed
			if (h.validCSV) {
				h = h.result[0];

			} else {
				return formatResult(h);
			}

		} else {
			h = [];
		}
		headers = headers || h;
		return formatResult(csvParser(text, callBack, options, delimiter, indexAfterHeader), headers);
	}
	function toObject(text, callBack, headers) {
		//returns object for each row, with header row if specified in options
		//with optional callback on each object row
		var converter,
		f,
		h;
		if (options.headersIncluded) {
			h = _getHeader(text); //we even do this when headers is set because the first row needs to be removed
			if (h.validCSV) {
				h = h.result[0];

			} else {
				return formatResult(h);
			}

		} else {
			h = [];
		}
		headers = headers || h;
		converter = arrayToObject(headers, options.headerPrefix);
		f = (callBack ? function (row, i) {
			return callBack(converter(row), i);
		}: converter);
		return formatResult(csvParser(text, f, options, delimiter, indexAfterHeader), headers);
	}
	function fromObject(rows, headers) {
		var d = String.fromCharCode(delimiter[0]),
		rowConv,
		mapF;
		headers = headers || [];
		rowConv = rowObjectToText(headers);
		mapF = function (row) {
			return rowConv(row, d);
		};
		headers = headers || [];
		rows.map(mapF);
		return [headers.map(function (v) {
				return valueToText(v);
			}).join(d)]
		.concat(rows.map(mapF))
		.join("\n");
	}
	function fromArray(rows, headers) {
		var d = String.fromCharCode(delimiter[0]),
		mapF = function (row) {
			return rowArrayToText(row, d);
		};
		headers = headers || [];
		return [mapF(headers)]
		.concat(rows.map(mapF))
		.join("\n");
	}
	
	return {
		toArray:toArray,
		toObject:toObject,
		fromObject:fromObject,
		fromArray:fromArray
	};
}

function csvParser(text, callBack, options, delimiter, startIndex, endLine) {
	//based on d3.csv but enhanced
	var QUOTE = 34; //only doublequote taken into account
	var NEWLINE = 10;
	var RETURN = 13;
	var SPACE = 32;
	var EOF = {};
	var EOL = {};
	var ERROR = {};
	endLine = (typeof endLine === "undefined" ? Infinity : Number(endLine));
	function parseRows(text) {
		var records = [], // output rows,
		record=[],
		recordF=[],
		valid = true,
		error = {},
		len = text.length,
		charIndex = startIndex || 0, // current character index
		line = 0, // current line number
		value, // current value
		eof = len <= 0, // current token followed by EOF?
		eol = false, // current token followed by EOL?
		emptyRecords = [];
		function setError(messageId) {
			error = {
				id: messageId,
				lineIndex: line,
				characterIndex: charIndex
			};
			valid = false;

		}
		function getNextValue() {
			var start,
			end,
			quoteFound,
			quotedValueIsTrimmable;
			var currentCharacter;
			if (eof)
				return EOF;
			if (eol)
				return eol = false, EOL;
			// Unescape quotes.
			function checkCRLF() {
				/*function check if the current character is NEWLINE or RETURN
				if RETURN it checks if the next is NEWLINE (CRLF)
				afterwards it sets the charIndex after the NEWLINE, RETURN OR CRLF and currentCharacter to the character at index charIndex*/
				//check if current character at charIndex is NEWLINE (set eol)
				//adds 1 to charIndex
				if ((currentCharacter = text.charCodeAt(charIndex++)) === NEWLINE)
					eol = true;
				//checks if equal to RETURN
				else if (currentCharacter === RETURN) {
					eol = true;
					//checks next character equal to NEWLINE and adds 1 to charindex (total =2)
					if (text.charCodeAt(charIndex) === NEWLINE)
						++charIndex;
				}
				return eol;
			}
			start = charIndex;
			quoteFound = false;
			quotedValueIsTrimmable = (text.charCodeAt(start) !== QUOTE ? options.spaceAllowedBetweenDelimiterAndQuote : true);
			while (charIndex < len) {
				if (!quoteFound) {
					if (checkCRLF() || ~delimiter.indexOf(currentCharacter))
						return text.slice(start, charIndex - 1);
					else if (currentCharacter === QUOTE) {
						/*start of quoted values*/
						quoteFound = true;
						start = charIndex; //1 added via checkCRLF, so it starts after quote
					} else if (currentCharacter !== SPACE)
						quotedValueIsTrimmable = false;
				} else if (quotedValueIsTrimmable) {
					//quoted value was Started and was trimmable
					while (charIndex < len && text.charCodeAt(charIndex++) !== QUOTE || text.charCodeAt(charIndex++) === QUOTE); //charIndex is set at 2nd character after last quote
					charIndex = charIndex - 2; //go back to quote
					end = charIndex;
					//check for only spaces till next delimiter or linebreak or EOF
					if (options.spaceAllowedBetweenDelimiterAndQuote) {
						while (charIndex < len && text.charCodeAt(++charIndex) === SPACE); //charindex points to position just on last caracter not equal to space
					} else
						charIndex++; //charindex points to position just after last quote
					if (checkCRLF() || (eof = (charIndex >= len)) || ~delimiter.indexOf(currentCharacter))
						return text.slice(start, end).replace(/""/g, "\""); //position after linebreak or delimiter
					else {
						//raise Error
						setError("incorrectTrailingQuote");
						return ERROR;
					}

				} else {
					//raise error
					setError('incorrectQuote');
					return ERROR;
				}
			}
			// Return last token before EOF.
			return eof = true, text.slice(start, len);
		}
		function getResult() {
			var lastRow = (records.length - 1);
			var emptyRecordsGrouped = xassistArray.array(emptyRecords).groupSequence(function (a, b) {
					return (b - a) === 1;
				});
			var rowsToRemove = [];
			for (var i = 0, l = emptyRecordsGrouped.length; i < l; i++) {
				if ((options.removeLeadingEmptyRows && (emptyRecordsGrouped[i][0] === 0)) ||
					((options.removeInnerEmptyRows && (emptyRecordsGrouped[i][0] !== 0) &&
							(emptyRecordsGrouped[i][emptyRecordsGrouped[i].length - 1] !== lastRow))) ||
					(options.removeTrailingEmptyRows && (emptyRecordsGrouped[i][emptyRecordsGrouped[i].length - 1] === lastRow))) {
					rowsToRemove = rowsToRemove.concat(emptyRecordsGrouped[i]);
				}
			}
			return {
				result: records.filter(function (x, i) {
					return !~rowsToRemove.indexOf(i);
				}), //takes little time is negligeable
				emptyRecordLines: emptyRecords,
				error: error,
				validCSV: valid,
				startIndex: startIndex,
				endIndex: charIndex
			};
		}
		while (line <= endLine && (value = getNextValue()) !== EOF && valid) {
			record = [];
			recordF = [];
			while (value !== EOL && value !== EOF && value !== ERROR) {
				if (options.trimValues) {
					value = value.trim();
				}
				if (options.emptyValuesAreNull && !value.length) {
					value = null;
				}
				record.push(value);
				if (!eol && options.treatConsecutiveDelmitersAsOne) {
					while (charIndex < len && ~delimiter.indexOf(text.charCodeAt(charIndex++)));
					charIndex--;
				}
				value = getNextValue();
			}
			if (valid) {
				recordF = callBack ? callBack(record, line) : record;
				if (recordF != null && (!record.length || record.join("").length === 0)) {
					//empty row so we add to empty records
					emptyRecords.push(line);
				}
				line++;
				if (recordF == null)
					continue;
				records.push(recordF);
			}
		}
		return getResult();
	}
	return parseRows(text);

}

exports.csv = csv;

Object.defineProperty(exports, '__esModule', { value: true });

})));
