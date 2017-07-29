const mongoose = require("mongoose");
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
require('dotenv').config();

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
            decideResponse(sender, text);
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
    text = text.toLowerCase();

    // check if postcode entered
    if (text.length == 4 && +text > 999 && +text < 10000) {
        setPostcode(sender, +text);
        return;
    }

    switch (text) {
        case "what is my postcode":
            let postcode = getPostcode(sender);
            if (postcode == null) {
                sendText(sender, "You have not set your postcode. You can set you postcode by simply sending it to me.")
            } else {
                sendText(sender, "Your postcode is " + postcode + ".");
            }
        default:
            sendText(sender, "Sorry i don't understand that.")
    }
}

function getPostcode(sender) {
    User.findOne({userid: sender}, function(err, user) {
        if (err) console.log(err);
        if (!user) {
            return null;
        } else {
            return user.postcode;
        }
    })
}

function setPostcode(sender, postcode) {
    User.findOne({userid: sender}, function(err, user) {
        if (err) console.log(err);
        if (!user) {
            let user = new User({userid: sender, postcode: postcode});
            user.save(function (err) {
                if (err) console.log(err);
            });
        } else {
            user.postcode = postcode;
            user.save(function (err) {
                if (err) console.log(err);
            })
        }
    })
}

app.listen(app.get('port'), function() {
    console.log("running: port");
});