const ssm = new (require('aws-sdk/clients/ssm'))();
module.exports = async (...names) => {
  const data = await ssm
    .getParameters({
      Names: names,
      WithDecryption: false, //暗号化してる場合はtrueで複合化
    })
    .promise();

  let ret = {};
  for (const para of data.Parameters) {
    ret[para.Name] = para.Value;
    console.log(para);
  }
  return ret;
};
