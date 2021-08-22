// Load the AWS SDK for Node.jss
var AWS = require('aws-sdk');
// Set the region
// export
// AWS_ACCESS_KEY_ID
// AWS_SECRET_ACCESS_KEY

AWS.config.update({ 
  region: 'eu-central-1'
 });

console.log(AWS.config)

const EventEmitter = require('events');

const SQSMessageHandler = require('./utils/sqsmessqges')

// Create an SQS service object
var sqs = new AWS.SQS({ apiVersion: '2012-11-05' });
class SQSEmitter extends EventEmitter {
  constructor() {
    super();

    this.params = {}

    this.SQSconnected = false;
    this.sendMessage = this.sendMessage.bind(this);
    this.getSQSMessage = this.getSQSMessage.bind(this);
    this.getSQSMessages = this.getSQSMessages.bind(this);
  }

  connect(destination, settings) {
    let _this = this;
    this.params = settings
    console.log('<sqsConnect> connect ' + settings.QueueUrl)
    setTimeout(() => {
      // wait short to get the event
      _this.emit('connect', 'start');
    }, 500);
    return this
  }

  subscribe() {
    console.log('<sqsConnect> start subscribe')
    //this.getSQSMessage()
    this.getSQSMessages()
  }

  connected() {
    return this.SQSconnected
  }

  sendMessage(message) {
    this.emit('message', 'SQS', JSON.stringify(message));
  }

  async getSQSMessages() {
    while (true) {
      await this.getSQSMessage();
    }
  }

  async getSQSMessage() {
    // resolve('resolved');
    // await timer(1000)
    return new Promise(resolve => {
      var self = this;
      sqs.receiveMessage(this.params, function (err, data) {
        if (err) {
          self.SQSconnected = false
          console.log("Receive Error", err);
          resolve('OK');
        } else if (data.Messages) {
          self.SQSconnected = true
          var newMessage = SQSMessageHandler(data.Messages)
          self.sendMessage(newMessage)
          
          var deleteParams = {
            QueueUrl: self.params.QueueUrl,
            ReceiptHandle: data.Messages[0].ReceiptHandle
          };
          sqs.deleteMessage(deleteParams, function (err, data) {
            if (err) {
              console.log("Delete Error", err);
            }
          });
          
          resolve('resolved');
        } else {
          console.log('no data')
          resolve('resolved');
        }
      });
    });
  }

}

const myEmitter = new SQSEmitter();

module.exports = myEmitter