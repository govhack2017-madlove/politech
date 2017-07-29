var obj = require("C:\\Users\\Reuben\\Documents\\Politech\\politech\\test.json");


for (var exKey in obj) {
	console.log("key:" +exKey+", value:"+obj[exKey]);
}


function getDescription(jsonFile){
	for (var key in jsonFile) {
		//console.log("key: " + key);
		if (key == "summary") {
			console.log(obj[key])
		}
	}
}


