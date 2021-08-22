// Load the AWS SDK for Node.js
const { rejects } = require('assert');
var AWS = require('aws-sdk');
// Set the region
AWS.config.update({ region: 'eu-central-1' });

const EventEmitter = require('events');

const SQSMessageHandler = require('./utils/sqsmessqges')

const timer = ms => new Promise(res => setTimeout(res, ms))

// Create an SQS service object
var sqs = new AWS.SQS({ apiVersion: '2012-11-05' });
var queueURL = "https://sqs.eu-central-1.amazonaws.com/654384432543/datamapping";
var params = {
  AttributeNames: [
    "SentTimestamp"
  ],
  MaxNumberOfMessages: 1,
  MessageAttributeNames: [
    "All"
  ],
  QueueUrl: queueURL,
  VisibilityTimeout: 0,
  WaitTimeSeconds: 20
};

class SQSEmitter extends EventEmitter {
  constructor() {
    super();

    this.SQSconnected = false;
    this.sendMessage = this.sendMessage.bind(this);
    this.getSQSMessage = this.getSQSMessage.bind(this);
    this.getSQSMessages = this.getSQSMessages.bind(this);
  }

  connect(destination, settings) {
    let _this = this;
    console.log('<sqsConnect> connect')
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
    return new Promise(resolve, reject => {
      var self = this;
      sqs.receiveMessage(params, function (err, data) {
        if (err) {
          this.SQSconnected = false
          console.log("Receive Error", err);
          reject(err);
        } else if (data.Messages) {
          this.SQSconnected = true
          var newMessage = SQSMessageHandler(data.Messages)
          self.sendMessage(newMessage)
          var deleteParams = {
            QueueUrl: queueURL,
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