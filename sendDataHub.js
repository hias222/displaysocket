const { headermessage, lanemessages } = require("./app");
function sendDataHub() {
  console.log("send to datahub");
  console.log("header");
  console.log(headermessage);
  console.log("lanes");
  console.log(lanemessages);
}
