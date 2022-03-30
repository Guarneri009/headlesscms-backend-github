//東京リージョンに設定
'use strict';

//Lambda関数外の設定は初期化されない場合があるので注意
//const awsXRay = require('aws-xray-sdk');
//awsXRay.setContextMissingStrategy('LOG_ERROR');
//const aws = awsXRay.captureAWS(require('aws-sdk'));
const aws = require('aws-sdk');
aws.config.region = 'ap-northeast-1';
const s3 = new aws.S3();
const dynamodb = new aws.DynamoDB({ region: 'ap-northeast-1' });
const documentClient = new aws.DynamoDB.DocumentClient({ service: dynamodb });
//
const lambdaName = 'articleGetLambda';
const DynamoDBName = 'HeadlessCMS-DynamoDB-Name';
const S3bucketName = 'HeadlessCMS-S3bucket-Name';
const lambdaLayerlib = '/opt/lib/';
const locallambdaLayerlib = '/opt/lib/';
const testlambdaLayerlib = '../../LambdaLayer/nodejs/lib/';

const handler = {
  [lambdaName]: async (event) => {
    console.log('------- start ---------');
    // 以下のコメントを入れると直後の行はprettierが無視される
    // prettier-ignore
    console.log(`------- event = ${JSON.stringify(event,null,'  ')}`)

    //
    let getParameter = null;
    let consoleTest = false;

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
      let bucketName = retParam[S3bucketName];

      //DynamoDBからタイトルを取得
      let payload = {
        TableName: tableName,
        Key: {
          ArticleID: event.pathParameters.articleid,
        },
      };

      //DynamoDB の API 呼び出しにおいて, Query や Scan の結果セットは,
      //呼び出しあたり 1MB という制限がある為, 1MB を超える場合には,
      //レスポンスから LastEvaluatedKey を利用して 1MB 以上の結果を取得する必要がある.
      let retData = await documentClient.get(payload).promise();

      //s3 から記事を取得
      let params = {
        Bucket: bucketName,
        Key: `${event.pathParameters.articleid}/html`,
      };
      const data = await s3.getObject(params).promise();

      //レスポンスを返す
      console.log('------- レスポンスを返す ---------');
      console.log(`------- ${lambdaName} success -------`);
      let responseCode = 200;
      let response = {
        statusCode: responseCode,
        body: JSON.stringify({
          ArticleTitle: retData.Item.TitleName,
          ArticleData: data.Body.toString(),
        }),
      };
      return response;
      //----------------------------------------------
    } catch (err) {
      //----------------------------------------------
      console.log('------- 例外発生！！！！ ----------');
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
