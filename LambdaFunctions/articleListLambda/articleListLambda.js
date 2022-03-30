//東京リージョンに設定
'use strict';

//Lambda関数外の設定は初期化されない場合があるので注意
//const awsXRay = require('aws-xray-sdk');
//awsXRay.setContextMissingStrategy('LOG_ERROR');
//const aws = awsXRay.captureAWS(require('aws-sdk'));
const aws = require('aws-sdk');
aws.config.region = 'ap-northeast-1';
const dynamodb = new aws.DynamoDB({ region: 'ap-northeast-1' });
const documentClient = new aws.DynamoDB.DocumentClient({ service: dynamodb });
//
const lambdaName = 'articleListLambda';
const DynamoDBName = 'HeadlessCMS-DynamoDB-Name';
const S3bucketName = 'HeadlessCMS-S3bucket-Name';
const lambdaLayerlib = '/opt/lib/';
const locallambdaLayerlib = '/opt/lib/';
const testlambdaLayerlib = '../../LambdaLayer/nodejs/lib/';

const handler = {
  [lambdaName]: async (event) => {
    console.log('------- start ---------');
    //
    let getParameter = null;
    let consoleTest = true;

    try {
      if (event.consoleTest == undefined) {
        consoleTest = false;
        getParameter = require(`${locallambdaLayerlib}getParameter`);
      } else {
        consoleTest = true;
        getParameter = require(`${testlambdaLayerlib}getParameter`);
      }

      let retParam = await getParameter(DynamoDBName, S3bucketName);
      let tableName = retParam[DynamoDBName];

      //DBより必要なデーターを取得
      console.log(`------- DBより必要なデーターを取得 ---------`);
      let paramsQuery = {};

      let payload = {
        TableName: tableName,
      };

      //DynamoDB の API 呼び出しにおいて, Query や Scan の結果セットは,
      //呼び出しあたり 1MB という制限がある為, 1MB を超える場合には,
      //レスポンスから LastEvaluatedKey を利用して 1MB 以上の結果を取得する必要がある.
      let retData = await documentClient.scan(payload).promise();

      //レスポンスを返す
      console.log('------- レスポンスを返す ---------');
      console.log(`------- ${lambdaName} success -------`);
      let responseCode = 200;
      let response = {
        statusCode: responseCode,
        body: JSON.stringify({
          articleList: retData,
        }),
      };
      return response;
      //----------------------------------------------
    } catch (err) {
      //----------------------------------------------
      console.log('------- 例外発生！！！！ ---------');
      console.log(`------- ${lambdaName} failed : ${err.message} ---------`);
      let responseCode = 500;
      let response = {
        statusCode: responseCode,
        body: JSON.stringify({
          error: {
            message: err.message,
          },
        }),
      };
      return response;
      //----------------------------------------------
    }
  },
};

exports.handler = async (event, context, callback) => {
  console.log(`------- ${lambdaName} start ---------`);
  let result = await handler[lambdaName](event);
  console.log(`------- ${lambdaName} end ---------`);
  //CORSに対応するため必要
  result.headers = {
    'Access-Control-Allow-Origin': '*',
  };
  return result;
};
