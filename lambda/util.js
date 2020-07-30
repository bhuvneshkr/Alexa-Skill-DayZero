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
    date = startDate.split('-');
    const startDate = new Date(date[0],date[1],date[2]);

    const left = Math.round((startDate - today)/day)
    return left;
}
module.exports = {
    doesTableExist,
    createNewHireTable,
    putItem,
    getItem,
    daysLeft

}
// const s3SigV4Client = new AWS.S3({
//     signatureVersion: 'v4',
// });

// module.exports.getS3PreSignedUrl = function getS3PreSignedUrl(s3ObjectKey) {

//     const bucketName = process.env.S3_PERSISTENCE_BUCKET;
//     const s3PreSignedUrl = s3SigV4Client.getSignedUrl('getObject', {
//         Bucket: bucketName,
//         Key: s3ObjectKey,
//         Expires: 60*1 // the Expires is capped for 1 minute
//     });
//     console.log(`Util.s3PreSignedUrl: ${s3ObjectKey} URL ${s3PreSignedUrl}`);
//     return s3PreSignedUrl;

// }

// function set_table()