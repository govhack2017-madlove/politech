const mongoose = require("mongoose");
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
require('dotenv').config();

let divisions = require("./divisions2.json");

const app = express();

// mongodb
let User = require('./models/users');

let mongoOptions = {
    server: {
        socketOptions: {
            keepAlive: 300000,
            connectTimeoutMS: 30000
        }
    },
    replset: {
        socketOptions: {
            keepAlive: 300000,
            connectTimeoutMS : 30000
        }
    }
};
mongoose.connect(process.env.MONGO_URI, mongoOptions);


app.set('port', (process.env.PORT || 5000));

// body-parser middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());



// routes

app.get('/', function(req, res) {
    res.send("politech chatbot index page");
});

// Facebook
let token = process.env.FACEBOOK_TOKEN;
let access_token = process.env.ACCESS_TOKEN;

app.get('/webhook/', function(req, res) {
    if (req.query['hub.verify_token'] === token) {
        res.send(req.query['hub.challenge'])
    }
    res.send("Wrong token")
});

app.post('/webhook/', function(req, res) {
    let messaging_events = req.body.entry[0].messaging;
    for (let i = 0; i < messaging_events.length; i++) {
        let event = messaging_events[i];
        let sender = event.sender.id;
        if (event.message && event.message.text) {
            let text = event.message.text;
            console.log(event, sender, text);
            if (event.message.is_echo) {
                // do nothing
            } else {
                decideResponse(sender, text);
            }

            /*
            if (text.length == 4) {
                postcodeTest(sender);
            } else {
                sendText(sender, "Text echo: " + text.substring(0, 100));
            }
            */
        }
    }
    res.sendStatus(200)
});

function sendText(sender, text) {
    let messageData = {text: text};
    request({
        url: "https://graph.facebook.com/v2.6/me/messages?access_token=" + access_token,
        method: "POST",
        json: {
            recipient: {id: sender},
            message : messageData
        }
    }, function(error, response, body) {
        if (error) {
            console.log("sending error");
        } else if (response.body.error) {
            console.log(response.body.error);
            console.log("response body error");
        }
    });
}

function postcodeTest(sender) {
    User.findOne({userid: sender}, function(err, user) {
        if (err) console.log(err);
        if (!user) {
            let user = new User({userid: sender, postcode: 6666});
            user.save(function (err) {
                if (err) console.log(err);
            });
        } else {
            sendText(sender, "Your postcode is " + user.postcode);
        }
    })
}

function decideResponse(sender, text) {
    // check if postcode entered
    let num = parseInt(text);
    if (text.length == 4 && num > 999) {
        setPostcode(sender, num);
        sendText(sender, "You have set your postcode to " + num + ".");
        sendText(sender, getDivision(num));
        return;
    }

    text = text.toLowerCase();

    if (text.startsWith("division")) {
        console.log(num);
        return;
    }

    switch (text) {
        case "what is my postcode":
            getUser(sender, function(user) {
                if (user == null) {
                    sendText(sender, "You have not set your postcode. You can set you postcode by simply sending it to me.")
                } else {
                    sendText(sender, "Your postcode is " + user.postcode + " and your division is " + user.division + ".");
                }
            });
            break;
        case "what happened today":
            happening(sender);
            break;
        default:
            sendText(sender, "Sorry i don't understand that.");
    }
}


function getDivisions(dateString, callback) {
    request("https://theyvoteforyou.org.au/api/v1/divisions.json?key=qB79nIe4HcQHOKGHrj6o", function(err, res, body) {

        let past100 = JSON.parse(body);

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

        callback(urls);

    });

}

function happening(sender) {
    // TODO chagne hardcode
    getDivisions("2017-06-21", function(urls) {

        let divs = [];
        let promises = [];
        for (let i = 0; i < urls.length; i++) {
            promises.push(new Promise((resolve, reject) => {
                getAttribute(urls[i], "name", resolve);
            }));

        }

        Promise.all(promises).then(values => {

            console.log("HERE");

            for (let i = 0; i < values.length; i++) {
                let div = values[i];

                let title = div.name;

                for (let j = 0; j < div.votes.length; j++) {
                    console.log(div.votes[j].member.electorate);
                    if (div.votes[j].member.electorate == "Wentworth") {
                        console.log(div.votes[j]);
                        let member = div.votes[j].member.first_name + " " + div.votes[j].member.last_name;
                        let vote = div.votes[j].vote;
                        sendText(sender, member + "voted " + vote + " on " + title + ".");
                        break;
                    }
                }


            }

        })




    });

}

function getAttribute(fileName, attribute, callback) {
    request(fileName, function(err, res, body) {
        json = JSON.parse(body);
        callback(json);
    });
}

function getDivision(postcode) {
    let div = divisions[postcode.toString()];
    let max = 0;
    let division = null;
    for (let property in div) {
        if (div.hasOwnProperty(property)) {
            if (div[property] > max) {
                max = div[property];
                division = property;
            }
        }
    }

    return division;
}

function getUser(sender, callback) {
    User.findOne({userid: sender}, function(err, user) {
        if (err) console.log(err);
        if (!user) {
            callback(null);
        } else {
            callback(user);
        }
    })
}

function setPostcode(sender, postcode) {
    let division = getDivision(postcode);
    division = division ? division : "none";
    User.findOne({userid: sender}, function(err, user) {
        if (err) console.log(err);
        if (!user) {
            let user = new User({userid: sender, postcode: postcode, division: division});
            user.save(function (err) {
                if (err) console.log(err);
            });
        } else {
            user.postcode = postcode;
            user.division = division;
            user.save(function (err) {
                if (err) console.log(err);
            })
        }
    })
}

app.listen(app.get('port'), function() {
    console.log("running: port");
});