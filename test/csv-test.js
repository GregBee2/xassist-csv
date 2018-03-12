var definition = require("../package.json");
var main=require("../"+definition.main);
var tape=require("tape");



tape("empty test", function(test) {
	test.ok(true);
	test.end();
});

