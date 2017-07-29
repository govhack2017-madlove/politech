var obj = require("C:\\Users\\Reuben\\Documents\\Politech\\politech\\reps.json");

/*
for (var exKey in obj) {
	console.log("key:" +exKey+", value:"+obj[exKey]);
}
*/
//getDescription(obj);
getDivisionResult(obj, "Malcolm", "Turnbull");
getDescription(obj);
function getDescription(jsonFile){
	console.log(obj.summary);
}


function getDivisionResult(jsonFile, firstName, secondName){
	for (var key in jsonFile.votes){
		if (jsonFile.votes[key].member.first_name == firstName &&
			jsonFile.votes[key].member.last_name == secondName) {
			console.log(jsonFile.votes[key].vote);
		}
		
		
	}
	//console.log(jsonFile.votes["100"].member.first_name);
	
}
