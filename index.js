const mongoose = require("mongoose");
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
require('dotenv').config();

let divisions = require("./divisions2.json");

const app = express();

// mongodb
let User = require('./models/users');
let Approval = require('./models/approvals');

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
    if (messaging_events === undefined) {
        console.log(res.body);
    }
    for (let i = 0; i < messaging_events.length; i++) {
        let event = messaging_events[i];
        let sender = event.sender.id;
        if (event.postback) {
            console.log(event.postback.payload);
            decidePostback(sender, event.postback.payload);
        } else if (event.message && event.message.quick_reply) {
            if (payload == "QUICK_REPLY_TODAY") {
                happening(sender, "2017-06-21");
            } else if (payload == "QUICK_REPLY_YESTERDAY") {
                happening(sender, "2017-06-20");
            }
        } else if (event.message && event.message.text) {
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

function sendQuickReply(sender, text, replies) {

    request({
        url: "https://graph.facebook.com/v2.6/me/messages?access_token=" + access_token,
        method: "POST",
        json: {
            recipient: {id: sender},
            message: {
                text: text,
                quick_replies: replies
            }
        }
    }, function(error, response, body) {
        if (error) {
            console.log("sending error");
        } else if (response.body.error) {
            console.log(response.body.error);
            console.log("response body error");
        }
    });
/*
    {
        "recipient":{
        "id":"USER_ID"
    },
        "message":{
        "text":"Pick a color:",
            "quick_replies":[
            {
                "content_type":"text",
                "title":"Red",
                "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED"
            },
            {
                "content_type":"text",
                "title":"Green",
                "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_GREEN"
            }
        ]
    }
    }
    */
}

function sendTextLink(sender, text, buttons) {
    request({
        url: "https://graph.facebook.com/v2.6/me/messages?access_token=" + access_token,
        method: "POST",
        json: {
            recipient: {id: sender},
            message: {
                "attachment":{
                    "type":"template",
                        "payload":{
                        "template_type":"button",
                            "text": text,
                            "buttons": buttons
                    }
                }
    }
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

function decidePostback(sender, payload) {
    if (payload == "GET_STARTED_PAYLOAD") {
        sendText(sender, "Welocome to RE:Member, enter your postcode to register your local MP");
        return;
    }

    // [YES|NO]_[DATE]_[NUM]
    let data = payload.split("_");
    User.findOne({userid: sender}, function(err, user) {
       if (err) console.log(err);
       if (!user) {
           console.log("No User");
       } else {
           Approval.findOne({electorate: user.division, date: data[1], id: data[2]}, function(err, approval) {
               if (err) console.log(err);
			   sendText(sender, "Your feedback will be sent to your MP.");
               if (!approval) {
                   console.log(user.division, data);
                   let approval = new Approval({electorate: user.division, date: data[1], id: data[2]});
                   if (data[0] == "YES") {
                       approval.yes = 1;
                   } else {
                       approval.no = 1;
                   }
                   approval.save(function(err) {
                       if (err) console.log(err);
                   })
               } else {
                   if (data[0] == "YES") {
                       approval.yes += 1;
                   } else {
                       approval.no += 1;
                   }
                   approval.save(function(err) {
                       if (err) console.log(err);
                   })
               }
           })
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
	
    text = text.toLowerCase();
	
	words = text.split(' ');
	for (var i = 0; i < words.length; i++) {
		if(words[i].length <= 4 && words[i].length >= 3 && !isNaN(words[i])) {
			let num = parseInt(words[i]);
			if(getDivision(num) == null) {
				setPostcode(sender, num);
				sendText(sender, "Invalid postcode, please enter the correct one.");
			} else {
				sendText(sender, "You have set your postcode to " + num + ". You are in the " + getDivision(num) + " division.");
			}
			return;
		}
	}

    if (text.startsWith("division")) {
        console.log(num);
        return;
    }

    let re = /what happened on (\d\d)[\/\-_](\d\d)[\/\-_](\d\d\d\d)/;

    let matches = re.exec(text);

    if (!(matches ==  null)) {
        console.log(matches);
        let dateString = matches[3] + '-' + matches[2] + '-' + matches[1];
        happening(sender, dateString);
        return;
    }

    switch (text) {
		case "what is my postcode":
        case "what is my postcode?":
            getUser(sender, function(user) {
                if (user == null) {
                    sendText(sender, "You have not set your postcode. You can set your postcode by simply sending it to me.")
                } else {
                    sendText(sender, "Your postcode is " + user.postcode + " and your division is " + user.division + ".");
                }
            });
            break;
		case "what happened today":
        case "what happened today?":
            happening(sender, "2017-06-21");
            break;
        case "what happened yesterday":
        case "what happened yesterday?":
            happening(sender, "2017-06-20");
            break;
		case "help":
			sendText(sender, "Type \'what is my postcode\'? to return your current postcode."
						+ "\nType your postcode \'xxxx\'' to set your current electorate.\n"
                        + "Type \'what happened on dd/mm/yyyy\'' to return what happened on a recent day." +
						"\nType \'what happened yesterday\'? to find out what happened yesterday.");
			break;
        default:
            sendQuickReply(sender, "Sorry I don't understand that. Type \"help\" for assistance or see what happened:", [
                {
                    "content_type":"text",
                    "title":"Today?",
                    "payload":"QUICK_REPLY_TODAY"
                },
                {
                    "content_type":"text",
                    "title":"Yesterday?",
                    "payload":"QUICK_REPLY_YESTERDAY"
                }
            ]);
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

function happening(sender, dateString) {
    // TODO chagne hardcode
    getDivisions(dateString, function(urls) {

        let divs = [];
        let promises = [];
        for (let i = 0; i < urls.length; i++) {
            promises.push(new Promise((resolve, reject) => {
                getAttribute(urls[i], "name", resolve);
            }));

        }

        Promise.all(promises).then(values => {

            console.log("HERE");
            let a = values.length;

            let goodValues = []

            for (let i = 0; i < a; i++) {
                let div = values[i];
                if (!div.name.startsWith("Motion")
                    && div.name.indexOf("Second Reading") == -1) {
                    goodValues.push(values[i]);
                }
            }
            if (goodValues.length == 0) {
                sendText(sender, "Your local MP didn't partake in any votes on that day");
            }

            for (let i = 0; i < goodValues.length; i++) {
                let div = goodValues[i];

                let title = div.name;

                User.findOne({userid: sender}, function(err, user) {
                    if (err) console.log(err);
                    if (!user) {
                        // break;
                    } else {
                        for (let j = 0; j < div.votes.length; j++) {
                            console.log(div.votes[j].member.electorate);
                            if (div.votes[j].member.electorate == user.division) {
                                console.log(div.votes[j]);
                                let member = div.votes[j].member.first_name + " " + div.votes[j].member.last_name;
                                let vote = div.votes[j].vote;
                                let number = div.number;
                                let ayes = div.aye_votes;
                                let nos = div.no_votes;
                                let percentage = Math.round(ayes/(nos+ayes) * 100);
                                let message = member + " voted " + vote + " on " + title + ". ";
                                if (ayes >= nos) {
                                    message = member + " voted " + vote + " on " + title + ". " + "The division passed with " + percentage + "\%.";
                                } else {
                                    message = member + " voted " + vote + " on " + title + ". " + "The division failed with " + percentage + "\%.";
                                }
                                sendTextLink(sender, message, [
                                    {
                                        "type": "web_url",
                                        "url": "https://theyvoteforyou.org.au/divisions/representatives/" + dateString + "/" + number,
                                        "title": "See More",
                                    },
                                    {
                                        "type": "postback",
                                        "payload": "YES_" + dateString + "_" + number,
                                        "title": "Approve",
                                    },
                                    {
                                        "type": "postback",
                                        "payload": "NO_" + dateString + "_" + number,
                                        "title": "Disapprove",
                                    }
                                ]);

                                break;
                            }
                        }
                    }
                });




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
	
	if(div == null) {
		return null;
	}
	
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