// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region
AWS.config.update({ region: 'eu-central-1' });

const EventEmitter = require('events');

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
  WaitTimeSeconds: 10
};

class SQSEmitter extends EventEmitter {
  constructor() {
    super();

    this.SQSconnected = false;
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
    this.startSQS()
  }

  connected() {
    return this.SQSconnected
  }

  startSQS() {
    sqs.receiveMessage(params, function (err, data) {
      console.log('SQS debug')
      //myEmitter.emit('connect');
      if (err) {
        this.SQSconnected = false
        console.log("Receive Error", err);
      } else if (data.Messages) {
        this.SQSconnected = true
        console.log(data.Messages)
        myEmitter.emit('event');
        var deleteParams = {
          QueueUrl: queueURL,
          ReceiptHandle: data.Messages[0].ReceiptHandle
        };
        sqs.deleteMessage(deleteParams, function (err, data) {
          if (err) {
            console.log("Delete Error", err);
          } else {
            console.log("Message Deleted", data);
          }
        });
      }
    });
  }
}

const myEmitter = new SQSEmitter();

module.exports = myEmitter