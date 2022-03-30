//東京リージョンに設定
'use strict';

//Lambda関数外の設定は初期化されない場合があるので注意
// const awsXRay = require('aws-xray-sdk');
// awsXRay.setContextMissingStrategy('LOG_ERROR');
// const aws = awsXRay.captureAWS(require('aws-sdk'));
const aws = require('aws-sdk');
aws.config.region = 'ap-northeast-1';
const s3 = new aws.S3();
const dynamodb = new aws.DynamoDB({ region: 'ap-northeast-1' });
const documentClient = new aws.DynamoDB.DocumentClient({ service: dynamodb });
const uuid = require('uuid/v4');
const MarkdownIt = require('markdown-it');
//
const lambdaName = 'articleSetLambda';
const DynamoDBName = 'HeadlessCMS-DynamoDB-Name';
const S3bucketName = 'HeadlessCMS-S3bucket-Name';
const lambdaLayerlib = '/opt/lib/';
const locallambdaLayerlib = '/opt/lib/';
const testlambdaLayerlib = '../../LambdaLayer/nodejs/lib/';
//

const handler = {
  [lambdaName]: async (event) => {
    console.log('------- start ---------');
    console.log(JSON.stringify(event));

    let getParameter = null;
    let consoleTest = false;

    //eventより取得
    let titleName = '';
    let articleData = '';

    try {
      if (event.consoleTest == undefined) {
        consoleTest = false;
        let body = JSON.parse(event.body);
        titleName = body.articleTitle;
        articleData = body.articleData;
        body;
        getParameter = require(`${locallambdaLayerlib}getParameter`);
      } else {
        consoleTest = true;
        titleName = 'Local 001';
        articleData = 'Local 001 Data';
        getParameter = require(`${testlambdaLayerlib}getParameter`);
      }

      let retParam = await getParameter(DynamoDBName, S3bucketName);
      let tableName = retParam[DynamoDBName];
      let bucketName = retParam[S3bucketName];

      //DynamoDBのArticleIDを発行
      let articleID = `${uuid()}`;

      //DynamoDBに書き込み
      let params = {
        TableName: tableName,
        Item: {
          ArticleID: articleID,
          TitleName: titleName,
        },
      };
      await documentClient.put(params).promise();

      let md = new MarkdownIt();
      var result = md.render(articleData);

      //記事はS3へ記録
      params = {
        Bucket: `${bucketName}`,
        Key: `${articleID}/html`,
        Body: result,
      };
      await s3.upload(params).promise();

      params = {
        Bucket: `${bucketName}`,
        Key: `${articleID}/markdown.md`,
        Body: articleData,
      };
      await s3.upload(params).promise();

      //
      params = {
        Bucket: `${bucketName}`,
        Key: `${articleID}`,
        Expires: 60 /*秒*/,
      };
      let url = await s3.getSignedUrlPromise('putObject', params);

      //レスポンスを返す
      console.log('------- レスポンスを返す ---------');
      console.log(`------- ${lambdaName} success -------`);
      let responseCode = 200;
      let response = {
        statusCode: responseCode,
        body: JSON.stringify({
          uploadUrl: url,
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
