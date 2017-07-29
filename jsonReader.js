let obj = require("C:\\Users\\Reuben\\Documents\\Politech\\politech\\reps.json");

let past100 = require("C:\\Users\\Reuben\\Documents\\Politech\\politech\\past100.json");

var request = require('request');

/*
for (var exKey in obj) {
	console.log("key:" +exKey+", value:"+obj[exKey]);
}
*/
//getDescription(obj);
//getDivisionResult(obj, "Wentworth");
//getDescription(obj);
//console.log(getDivision("2017-06-21"));

getDivisionResultFilename('https://theyvoteforyou.org.au/api/v1/divisions/3000.json?key=qB79nIe4HcQHOKGHrj6o', 'Macarthur', print);

function getJSON(error, response, body){
	json = JSON.parse(body);
	getDivisionResult(json)
}

function getDescription(jsonFile){
	console.log(obj.summary);
}

function getDivisionResultFilename(fileName, electorateName, callback) {
	request(fileName, function(err, res, body) {
		json = JSON.parse(body);
		callback(getDivisionResult(json,electorateName));
	});
}

function print(answer) {
	console.log("They voted:" + answer);
}

function getDivisionResult(jsonFile, electorateName) {
	for (var key in jsonFile.votes){
		if (jsonFile.votes[key].member.electorate == electorateName) {
			return jsonFile.votes[key].vote;
		}	
	}
}
/*
function getDivisionResult(jsonFile, firstName, secondName){
	for (var key in jsonFile.votes){
		if (jsonFile.votes[key].member.first_name == firstName &&
			jsonFile.votes[key].member.last_name == secondName) {
			console.log(jsonFile.votes[key].vote);
		}
		
		
	}
	//console.log(jsonFile.votes["100"].member.first_name);
	
}
*/
function getDivision(dateString) {
	let ids = [];
	let names = [];
	for (var key in past100) {
		if(past100[key].date == dateString) {
			ids.push(past100[key].id);
			names.push(past100[key].name);
		}
	}
	let urls = [];
	for (var id in ids) {
		urls.push("https://theyvoteforyou.org.au/api/v1/divisions/" + ids[id] + ".json?key=qB79nIe4HcQHOKGHrj6o");
	}
	
	return urls;

}

