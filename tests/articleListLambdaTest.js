'use strict';
//vs code F5 でデバッグ実行されます。
const app = require('../LambdaFunctions/articleListLambda/articleListLambda.js');
const chai = require('chai');
const expect = chai.expect;

describe('Tests index', function() {
  it('test', async () => {
    console.log('run test!!');
    let event = {};
    event.consoleTest = true;
    let result = await app.handler(event);
    console.log(JSON.stringify(result, null, '  '));
  });
});
