let ojson = require("./divisions.json");
let fs = require('fs');

let njson = {};

for (let i = 0; i < ojson.length; i++) {
    let pc = ojson[i].Postcode;
    let div = ojson[i].Division;
    if (!njson[pc]) {
        njson[pc] = {};
    }
    njson[pc][div] = ojson[i].Percent;
}

let data = JSON.stringify(njson);

fs.writeFile("divisions2.json", data, function(err) {
    if(err) {
        return console.log(err);
    }
});

console.log(njson);