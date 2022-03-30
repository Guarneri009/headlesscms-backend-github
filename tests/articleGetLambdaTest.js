'use strict';
//vs code F5 でデバッグ実行されます。
const app = require('../LambdaFunctions/articleGetLambda/articleGetLambda.js');
const chai = require('chai');
const expect = chai.expect;

//for local test
const testArticleid = '<xxxxxxxxxx>';

describe('Tests index', function () {
  it('test', async () => {
    console.log('run test!!');
    let event = {};
    event.consoleTest = true;
    event.pathParameters = {};
    event.pathParameters.articleid = testArticleid;
    let result = await app.handler(event);
    console.log(JSON.stringify(result, null, '  '));
  });
});
