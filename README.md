# @xassist/xassist-csv
This module parses CSV-strings and puts them in an array, so javascript can understand them. The different available options make sure most exotic CSV-files and derivatives can be parsed.
## Installation

If you use [NPM](https://www.npmjs.com/), you can install the module via `npm install xassist-csv`. Otherwise, you can download the latest [minified file](https://raw.githubusercontent.com/GregBee2/xassist-csv/master/dist/xAssist-csv.min.js). Be aware any dependencies are not installed by default; you should consider downloading them yourself.
If you want, you can install the complete library from github [xassist](https://github.com/GregBee2/xassist), this includes all dependencies you may need.

The module uses [UMD](https://github.com/umdjs/umd) and supports [AMD](https://github.com/amdjs/amdjs-api/wiki/AMD), [CommonJS](http://wiki.commonjs.org/wiki/CommonJS) and vanilla environments. Using vanilla: the `xa`global is exported:

```html
<script>
xa.csv()
</script>
```



## API
### csv()

The base function csv(), gives access to the underlying methods
```js
csv(/*[delimiter::string],[options::Object]*/)
```
#### Parameters for csv()
`csv()` takes 2 parameters:
- *delimiter* [`String`,defaults to: `";"`]:a String where each character represents a delimiter used in the CSV-text (ie multiple delimiters can be used at the same time).
- *options* [`Object`]:an Object where multiple settings regarding to the parsing can be changed

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
#### Result for csv()
`csv()` returns 4 methods:
- `toArray` [function]: which will return an array as the result of the csv-parsing 
- `toObject` [function]: which will return an object as the result of the csv-parsing 
- `fromArray` [function]: the inverse of toArray(), this will give a valid csv-string starting from an array 
- `fromObject` [function]: the inverse of toObject, it will return a valid csv-string starting from an object
#### Example for csv()
```js
csv()
csv(",|")
csv(",",{headersIncluded:true})
csv({headersIncluded:true})
```
### csv().toArray()

The first method csv().toArray() will parse the csv string and formats it as an array.
```js
csv().toArray(csvTextString::string [,callBack::function [,headers::array]])
```
#### Parameters for csv().toArray()
`csv().toArray()` takes 3 parameters:
- **csvTextString** [`String`]:a String reresenting the csv-data with the delimiters as set with `csv()`-initialization.
- *callBack* [`Function`,defaults to: `undefined`]:a function which  will process each row and should return the corrected row (or `null` to remove the row from the result)  which will take as input the parameters row and rowIndex
- *headers* [`Array`,defaults to: `undefined`]:this array overwrites the headers found in the csv-data (if the option `headersIncluded:true` is set) or predefines the headers (eg when the data does not include the headers)
#### Result for csv().toArray()
`csv().toArray()` returns an `Object`:
 - **result**: an array of arrays
 - **emptyRecordLines**:  an array with the index of all rows that were considered empty. Caution the rows may have been deleted, dependent on the csv-options set.
 - **error**: an object representing the error (if any) was encountered. Be aware the parser should not throw an error when something went wrong. Instead it will fail gently and returns the data parsed uptill then.
 - **validCSV**: a Boolean indicating if an error occured during parsing.
 - **startIndex**: the character index were the first data was retrieved. Since in this example headers are parsed seperatly, the index was not 0, but 25 (the index of the first real row)
 - **endIndex**: the last index parsed, usually the length of the csv-string
 - **header**: the headers parsed by the parser, or defined as parameter for `csv().toArray()`
```js
{
  result:[[/*row1Values*/],?,[/*rowNValues*/]],
  emptyRecordLines:[],
  error: {},
  validCSV: true,
  startIndex:25,
  endIndex: 157,
  header: [ 'header1', 'header2', 'header3' ]
}
```
#### Example for csv().toArray()
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
```js
csv(",",{headersIncluded:true}).toArray(csvTextString);
```
This will result in:
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
### csv().toObject()

The other csv-parsing method `csv().toObject()` will parse the csv string and formats it as an object.
```js
csv().toObject(csvTextString::string [,callBack::function [,headers::array]])
```
`csv().toObject()` is similar to the method `csv().toArray()`.
The only difference from `csv().toArray()` is the result, here an array of objects is returned with the key's being the headers identified.
#### Parameters for csv().toObject()
`csv().toObject()` takes 3 parameters:
- **csvTextString** [`String`]:a String reresenting the csv-data with the delimiters as set with `csv()`-initialization.
- *callBack* [`Function`,defaults to: `undefined`]:a function which  will process each row and should return the corrected row (or `null` to remove the row from the result)  which will take as input the parameters row and rowIndex
- *headers* [`Array`,defaults to: `undefined`]:this array overwrites the headers found in the csv-data (if the option `headersIncluded:true` is set) or predefines the headers (eg when the data does not include the headers)
#### Result for csv().toObject()
`csv().toObject()` returns an `Object`:
 - **result**: an array of objects
 - **emptyRecordLines**:  an array with the index of all rows that were considered empty. Caution the rows may have been deleted, dependent on the csv-options set.
 - **error**: an object representing the error (if any) was encountered. Be aware the parser should not throw an error when something went wrong. Instead it will fail gently and returns the data parsed uptill then.
 - **validCSV**: a Boolean indicating if an error occured during parsing.
 - **startIndex**: the character index were the first data was retrieved. Since in this example headers are parsed seperatly, the index was not 0, but 25 (the index of the first real row)
 - **endIndex**: the last index parsed, usually the length of the csv-string
 - **header**: the headers parsed by the parser, or defined as parameter for `csv().toArray()`
```js
{
  result:[{/*row1Object*/},?,{/*rowNObject*/}],
  emptyRecordLines:[],
  error: {},
  validCSV: true,
  startIndex:25,
  endIndex: 157,
  header: [ 'header1', 'header2', 'header3' ]
}
```
#### Example for csv().toObject()
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
```js
csv(",",{headersIncluded:true}).toObject(csvTextString);
```
This will result in:
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
### csv().fromArray()

the counterpart of `csv().toArray()` is `csv().fromArray()`
```js
csv().fromArray(rows::Array(Array) [,headers::array]])
```
This method will build a vild csv-textString based on the rows in Array-format
#### Parameters for csv().fromArray()
`csv().fromArray()` takes 2 parameters:
- **rows** [`Array`]:an array of arrays, representing the values inside each row.
- *headers* [`Array`,defaults to: `[]`]:An array with all headers of each column
#### Result for csv().fromArray()
`csv().fromObject()` returns a String, which can be saved as valid csv-tekst.
#### Example for csv().fromArray()
Suppose following initialization:
```js
var rows=[ [ 'val1_row1', 'val2_row1', 'val3_row1' ],
  [ 'val1_row2', 'val2_row2', 'val3_row2' ],
  [ 'val1_row3', 'val2_row3', 'val3_row3' ],
  [ 'val1_row4', 'val2_row4', 'val3_row4' ] ];
var header: [ 'header1', 'header2', 'header3' ];
```
```js
csv(",").fromArray(rows,header)
```
This will result in:
```js
/*
"header1,header2,header3
val1_row1,val2_row1,val3_row1
val1_row2,val2_row2,val3_row2
val1_row3,val2_row3,val3_row3
val1_row4,val2_row4,val3_row4"
*/
```
### csv().fromObject()

the counterpart of `csv().toObject()` is `csv().fromObject()`
```js
csv().fromObject(rows::Array(Object) [,headers::array]])
```
This method will build a vild csv-textString based on the rows in Object-format
#### Parameters for csv().fromObject()
`csv().fromObject()` takes 2 parameters:
- **rows** [`Array`]:an array of Objects, representing the values inside each row.
- *headers* [`Array`,defaults to: `[]`]:An array with all headers of each column
#### Result for csv().fromObject()
`csv().fromObject()` returns a String, which can be saved as valid csv-tekst.
#### Example for csv().fromObject()
Suppose following initialization:
```js
var rows=[ {h1: 'val1_row1', h2:'val2_row1', h3:'val3_row1' },
  {h1: 'val1_row2', h2:'val2_row2', h3:'val3_row2' },
  {h1: 'val1_row3', h2:'val2_row3', h3:'val3_row3' },
  {h1: 'val1_row4', h2:'val2_row4', h3:'val3_row4' } ];
var header: [' h1' ,'h2' ,'h3' ];
```
```js
csv(",").fromObject(rows,header)
```
This will result in:
```js
/*
"h1,h2,h3
val1_row1,val2_row1,val3_row1
val1_row2,val2_row2,val3_row2
val1_row3,val2_row3,val3_row3
val1_row4,val2_row4,val3_row4"
*/
```
## Dependencies
- [@xassist/xassist-array](https://github.com/GregBee2/xassist-array#readme): helper functions for javascript arrays
- [@xassist/xassist-object](https://github.com/GregBee2/xassist-object#readme): general helper functions for JavaScript objects 
## DevDependencies
- [csv2readme](https://github.com/GregBee2/csv2readme#readme): read csv file with fixed format and parse a readme markdown file
- [rimraf](https://github.com/isaacs/rimraf#readme): A deep deletion module for node (like `rm -rf`)
- [rollup](https://github.com/rollup/rollup): Next-generation ES6 module bundler
- [tape](https://github.com/substack/tape): tap-producing test harness for node and browsers
## License

This module is licensed under the terms of [GPL-3.0](https://choosealicense.com/licenses/gpl-3.0).
