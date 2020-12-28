const express = require("express");
var cors = require('cors');
const http = require("http");
const socketIo = require("socket.io");

require('dotenv').config();

const port = process.env.PORT || 4001;
const index = require("./routes/index");
const senddatahub = require("./outgoing/senddatahub")
const topic_name = "mainchannel"
const mqtt_host = "mqtt://localhost"
const today = new Date();

const staticbasemessage = today.getDate() + "." + today.getMonth() + "." + today.getFullYear() + " \\n \
                          Live Timing\\n \
                          \\n \
                          "

var settings = {
  keepalive: 2000
}

var lanemessages = []

var headermessage = {
  type: 'header',
  competition: 'not defined',
  distance: '50',
  swimstyle: 'FREE',
  event: '0',
  heat: '0'
};

var start = { type: 'start' };
var laststart = Date.now();
var timestart = Date.now();
var running = false;

var mqtt = require('mqtt')

var client = mqtt.connect(mqtt_host, settings)

const app = express();

app.use(index);
app.use(cors());
app.options('*', cors());

const server = http.createServer(app);
const io = socketIo(server, { path: '/ws/socket.io'}); // < Interesting!

io.origins('*:*') // for latest version

io.on("connection", socket => {
  console.log('websocket backend Subscribing to ' + mqtt_host);
  //client.subscribe("topic_name");
  sendBaseData(socket)
  socket.on("disconnect", () => console.log("websocket backend Client disconnected"));

  socket.on("error", (error) => {
    console.log(error)
  })
});

server.listen(port, () => console.log(`websocket backend Listening on port ${port}`));

client.on('connect', function () {
  console.log("websocket backend connected");
  client.subscribe(topic_name);
});

client.on('error', function () {
  console.log("websocket backend error");
  client.subscribe(topic_name);
});

function checkMQTT() {
  if (!client.connected) {
    console.log("failure MQTT")
  }
}

setInterval(checkMQTT, 1000);

client.disconnected

client.on('message', function (topic, message) {
  //console.log('websocket backend', topic, message.toString());
  storeBaseData(message)
  try {
    io.sockets.emit("FromAPI", message.toString());
    // console.log("websocket backend send " + message.toString())
    // console.log("send heat ")
  } catch (error) {
    console.error(`websocket backend Error emit : ${error.code}`);
    console.error(error);
  }
});

function storeBaseData(message) {
  try {
    var jsonmessage = JSON.parse(message)
    //console.log(jsonmessage.type)
    if (jsonmessage.type == "header") {
      //console.log("new header " + JSON.stringify(jsonmessage))
      headermessage = jsonmessage
      if (start.type === 'clock' || start.type === 'message') {
        console.log("----------------- reset " + start.type)
        var recallmessage = "{\"type\":\"race\"}"
        start = JSON.parse(recallmessage)
      }
    }

    if (jsonmessage.type == "race") {
      start = jsonmessage
    }

    if (jsonmessage.type == "startlist") {
      start = jsonmessage
    }

    if (jsonmessage.type == "start") {
      laststart = Date.now()
      start = jsonmessage
    }

    if (jsonmessage.type == "stop") {
      // we send it to datahub
      running = false
      sendDataHub();
      start = jsonmessage
    }

    if (jsonmessage.type == "clock") {
      timestart = Date.now()
      start = jsonmessage
    }

    if (jsonmessage.type == "message") {
      timestart = Date.now()
      start = jsonmessage
    }

    if (jsonmessage.type == "clear") {
      console.log("clear lanes")
      lanemessages = []
    }

    if (jsonmessage.type == "lane") {
      running = true
      var lanenumber = (jsonmessage.lane - 1)
      var number_of_elements_to_remove = 1
      lanemessages.splice(lanenumber, number_of_elements_to_remove, jsonmessage);
    }
  } catch (err) {
    console.log("<app.js> error")
    console.log(err)
  }
}

function sendDataHub() {
  console.log("send to datahub")
  var newmessage = { ...headermessage, lanes: lanemessages }
  senddatahub.sendHeat(newmessage)
}

async function sendBaseData(socket) {
  // we need io.sockets.socket();
  try {

    if (headermessage.event === "0") {
      var basemessage = {
        type: 'message',
        value: staticbasemessage,
      }
      var timediff = Date.now() - timestart;
      var newtime = Math.floor((timestart + timediff) / 1000);
      var jsondiff = "{\"time\":\"" + newtime + "\" }"

      var newmessage = { ...basemessage, ...JSON.parse(jsondiff) }
      socket.emit("FromAPI", JSON.stringify(newmessage));
      return;
    } else {

      socket.emit("FromAPI", JSON.stringify(headermessage));

      if (start.type === "message" || start.type === "clock") {
        var timediff = Date.now() - timestart;
        var newtime = Math.floor((timestart + timediff) / 1000);
        var jsondiff = "{\"time\":\"" + newtime + "\" }"
        var newmessage = { ...start, ...JSON.parse(jsondiff) }
        socket.emit("FromAPI", JSON.stringify(newmessage));
      } else {
        var timediff = Date.now() - laststart;
        var jsondiff = "{\"diff\":\"" + timediff + "\" }"
        var newmessage = { ...start, ...JSON.parse(jsondiff) }
        socket.emit("FromAPI", JSON.stringify(newmessage))
        if (running) {
          var racemessage = "{\"type\":\"race\"}"
          var sendracemessage = JSON.parse(racemessage)
          socket.emit("FromAPI", JSON.stringify(sendracemessage))
          console.log("send race maybe " + timediff)
        }
      }

      for (let lane of lanemessages) {
        socket.emit("FromAPI", JSON.stringify(lane));
      }

    }
    //console.log("FromAPI " + JSON.stringify(newmessage))
  } catch (error) {
    console.error(`websocket backend Error emit : ${error.code}`);
    console.error(error);
  }

}