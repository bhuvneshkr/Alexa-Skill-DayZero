// util.js
// =======

const AWS = require('aws-sdk');

//set region
AWS.config.update({region: 'us-west-2'});

//Create the Dynamo Service Object
var Dynamo = new AWS.DynamoDB();

function doesTableExist(name) {
    var params = {
        TableName: name
    }

    Dynamo.describeTable(params, (err,data) => {
        if(err) {
            return false
        } else {
            return true
        }
    });

}
function createNewHireTable() {
    var params = {
        AttributeDefinitions: [
          {
            AttributeName: 'NAME',
            AttributeType: 'S'
          }
        ],
        KeySchema: [
            {
                AttributeName: 'NAME',
                KeyType: 'HASH'
            }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1
        },
        TableName: 'NEW_HIRE',
        StreamSpecification: {
          StreamEnabled: false
        }
      };

      Dynamo.createTable(params, (err,data) => {
          if(err) {
              console.log("Error",err)
          } else {
              console.log("Table Created", data)
          }
      });
}

function putItem(tableName,name,date,manager,team) {
    var params = {
        TableName: tableName,
        Item: {
            'NAME': {S:name},
            'START_DATE': {S:date},
            'MANAGER_NAME': {S:manager},
            'TEAM_NAME': {S:team}
        }
    }

    Dynamo.putItem(params,(err,data)=>{
        if (err) {
            console.log("Error", err);
          } else {
            console.log("Success", data);
          }
    });
}
async function getItem(tableName,name) {
    var params = {
        TableName: tableName,
        Key : {
            'NAME': {S:name}
        }
    }
    return await Dynamo.getItem(params).promise();
}

function daysLeft(date) {
    const day = 24 * 60 * 60 * 1000;
    const today = Date.now();   
    date = startDate.split('-')
    console.log(date)
    // const startDate = new Date(date[0],date[1],date[2]);
    const left = 0;
    // const left = Math.round((startDate - today)/day)
    return left;
}

// function getPersistenceAdapter(tableName) {
//     if (USE_DYNAMO === true) {
//         // TODO: dynamodb will be connected to and have a connector instantiated here.
//         // IMPORTANT: don't forget to give DynamoDB access to the role you're using to run this lambda (via IAM policy)
//         const {DynamoDbPersistenceAdapter} = require('ask-sdk-dynamodb-persistence-adapter');
//         return new DynamoDbPersistenceAdapter({
//             tableName: tableName || 'newHires',
//             createTable: true
//         });
//     }
// }

function createReminder(requestMoment, scheduledMoment, timezone, locale, message) {
    return {
        requestTime: requestMoment.format('YYYY-MM-DDTHH:mm:00.000'),
        trigger: {
            type: 'SCHEDULED_ABSOLUTE',
            scheduledTime: scheduledMoment.format('YYYY-MM-DDTHH:mm:00.000'),
            timeZoneId: timezone
        },
        alertInfo: {
            spokenInfo: {
                content: [{
                    locale: locale,
                    text: message
                }]
            }
        },
        pushNotification: {
            status: 'ENABLED'
        }
    }
}

module.exports = {
    createReminder,
    doesTableExist,
    createNewHireTable,
    putItem,
    getItem,
    daysLeft
}