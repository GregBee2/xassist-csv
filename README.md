
# @xassist/xassist-csv

This module parses CSV-strings and puts them in an array, so javascript can understand them. 
The different available options make sure most exotic CSV-files and derivatives can be parsed.

## Installation

This is a [Node.js](https://nodejs.org/) module available through the 
[npm registry](https://www.npmjs.com/). It can be installed using the 
[`npm`](https://docs.npmjs.com/getting-started/installing-npm-packages-locally)
or 
[`yarn`](https://yarnpkg.com/en/)
command line tools.

```sh
npm install @xassist/xassist-csv --save
```

## Tests

```sh
npm install
npm test
```

## Usage

### csv()

The base function csv(), gives access to the underlying methods
```js
csv(/*[delimiter::string],[options::Object]*/)
```

#### parameters for csv() 
`csv()` takes two parameters:
- **delimiter**: a String where each character represents a delimiter used in the CSV-text (ie multiple delimiters can be used at the same time). The default value is a colon ";".
- **options**: an Object where multiple settings regarding to the parsing can be changed

The different settings for the option-Object are:
- **headersIncluded** [boolean; default=FALSE]: this parameter takes care of the parsing of the headers included in the CSV-file. It strips the first row from he CSV-text and treats this as a header-row.
- **headerPrefix** [String; default="column_"]: if the headers are unknown (not provided in the submethods or not parsed via the headersIncluded-option or an empty value in the CSV-text) will be prefixed with this option. A following number will indicate the columnIndex.
- **spaceAllowedBetweenDelimiterAndQuote** [boolean; default:TRUE]: this option (dis)allows possible spaces between double-quotes (for escaped values) and the delimiter, ie `"val1\"\""   ; "val2"\r\n` will be a correct row.
- **treatConsecutiveDelmitersAsOne** [boolean; default:TRUE]: this option treats consecutive delimiters as a typo (eg `"val1;;val2"` will be parsed as `["val1","val2"]`). This option can be used with the following option (trimValues), where even spaces between consecutive delimiters are considered as empty.
- **trimValues** [boolean; deault:TRUE]: this option trims leading and trailing spaces and/or tabs for any values (except if space and or tab are delimiters)
- **emptyValuesAreNull** [boolean; default:TRUE]: this option treats empty values (ie `""`) as the javascript null-object. In combination with trimValues even spaces become null.
- **removeLeadingEmptyRows** [boolean; default:true]: removes leading empty rows from the result.
- **removeTrailingEmptyRows** [boolean; default:true]: removes trailing empty rows from the resultset
- **removeInnerEmptyRows** [boolean; default:false]: removes emty rows found in the middle from the resultset

We should remark that for the last three options, an empty row can be filled with spaces and/or tabs if the option `trimValues` equals TRUE (the default value).

Both parameters for `csv()` are optional. Following are all correct usages:

```js
csv()
csv(",|")
csv(",",{headersIncluded:true})
csv({headersIncluded:true})
```

#### result for csv()
`csv()` returns 4 methods:
- `toArray` [function]: which will return an array as the result of the csv-parsing 
- `toObject` [function]: which will return an object as the result of the csv-parsing 
- `fromArray` [function]: the inverse of toArray(), this will give a valid csv-string starting from an array 
- `fromObject` [function]: the inverse of toObject, it will return a valid csv-string starting from an object

### csv().toArray()

The first method `csv().toArray()` will parse the csv string and formats it as an array.

```js
csv().toArray(csvTextString::string [,callBack::function [,headers::array]])
```

This method accepts 3 parameters. the last 2 callBack and headers are optional

#### parameters for csv().toArray()

the method `toArray()` accepts 3 parameters. th first one csvTextString being the most important:
- **csvTextString** [String; default:undefined]: a String reresenting the csv-data with the delimiters as set with `csv()`-initialization.
- **callBack** [Function; default:undefined]: a function which  will process each row and should return the corrected row (or `null` to remove the row from the result)  which will take as input the parameters row and rowIndex
- **headers** [Array, default:undefined]: this array overwrites the headers found in the csv-data (if the option `headersIncluded:true` is set) or predefines the headers (eg when the data does not include the headers)

#### Result for csv().toArray()
`csv().toArray()` returns following object:

Suppose following initialization:
```js
var testData=[
	["header1","header2","header3"],
	["val1_row1","val2_row1","val3_row1"],
	["val1_row2","val2_row2","val3_row2"],
	["val1_row3","val2_row3","val3_row3"],
	["val1_row4","val2_row4","val3_row4"]
]
var csvTextString=testData.map(v=>v.join(",")).join("\r\n")
```

Then the following function
```js
csv(",",{headersIncluded:true}).toArray(csvTextString);
```
will return 
```js
{ result:
   [ [ 'val1_row1', 'val2_row1', 'val3_row1' ],
     [ 'val1_row2', 'val2_row2', 'val3_row2' ],
     [ 'val1_row3', 'val2_row3', 'val3_row3' ],
     [ 'val1_row4', 'val2_row4', 'val3_row4' ] ],
  emptyRecordLines: [],
  error: {},
  validCSV: true,
  startIndex: 25,
  endIndex: 147,
  header: [ 'header1', 'header2', 'header3' ] }
```

the object-keys are:
 - **result**: an array of arrays
 - **emptyRecordLines**:  an array with the index of all rows that were considered empty. Caution the rows may have been deleted, dependent on the csv-options set.
 - **error**: an object representing the error (if any) was encountered. Be aware the parser should not throw an error when something went wrong. Instead it will fail gently and returns the data parsed uptill then.
 - **validCSV**: a Boolean indicating if an error occured during parsing.
 - **startIndex**: the character index were the first data was retrieved. Since in this example headers are parsed seperatly, the index was not 0, but 25 (the index of the first real row)
 - **endIndex**: the last index parsed, usually the length of the csv-string
 - **header**: the headers parsed by the parser, or defined as parameter for `csv().toArray()`

### csv().toObject()

The other csv-parsing method `csv().toObject()` will parse the csv string and formats it as an object.

```js
csv().toObject(csvTextString::string [,callBack::function [,headers::array]])
```

This method is identical to `csv().toArray()`; so please read the explanation above.

#### Result for csv().toObject()
`csv().toObject()` returns an object similar to `csv().toArray()`

Suppose following initialization:
```js
var testData=[
	["header1","header2","header3"],
	["val1_row1","val2_row1","val3_row1"],
	["val1_row2","val2_row2","val3_row2"],
	["val1_row3","val2_row3","val3_row3"],
	["val1_row4","val2_row4","val3_row4"]
]
var csvTextString=testData.map(v=>v.join(",")).join("\r\n")
```

Then the following function
```js
csv(",",{headersIncluded:true}).toObject(csvTextString);
```
will return 
```js
{ result:
   [{"header1":"val1_row1","header2":"val2_row1","header3":"val3_row1"},{"header1":"val1_row2","header2":"val2_row2","header3":"val3_row2"},{"header1":"val1_row3","header2":"val2_row3","header3":"val3_row3"},{"header1":"val1_row4","header2":"val2_row4","header3":"val3_row4"}]
  emptyRecordLines: [],
  error: {},
  validCSV: true,
  startIndex: 25,
  endIndex: 147,
  header: [ 'header1', 'header2', 'header3' ] }
```

The only difference from `csv().toArray()` is the result, here an array of objects is returned with the key's being the headers identified.

### csv().fromArray()

the counterpart of `csv().toArray()` is `csv().fromArray()`

```js
csv().fromArray(rows,headers)
```
given an array of arrays (rows) the csvtextString will be created



### csv().fromObject()

Similar to `csv().fromArray()`, `csv().fromObject()` is the counterpart of `csv().toObject()`




## Dependencies

- [@xassist/xassist-array](https://ghub.io/@xassist/xassist-array): helper functions for javascript arrays
- [@xassist/xassist-object](https://ghub.io/@xassist/xassist-object): general helper functions for JavaScript objects 

## Dev Dependencies

- [rimraf](https://ghub.io/rimraf): A deep deletion module for node (like `rm -rf`)
- [rollup](https://ghub.io/rollup): Next-generation ES6 module bundler
- [tape](https://ghub.io/tape): tap-producing test harness for node and browsers

## License

GPL-3.0
