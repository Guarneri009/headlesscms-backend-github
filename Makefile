#----------------------------
include .env
# PROFILE = 
# AWS_REGION ?= ap-northeast-1
# AWS_ACCOUNT = 
# PROJECT_NAME ?= headless-cms
# STAGE = dev
#----------------------------

#templete-files-folder
TEMPLETE-FILES-FOLDER = cfn-template

#persistence-storages
CMS-PERSISTENCE-STORAGES-STRAGE_STACK_NAME = $(PROJECT_NAME)-persistence-storages-$(STAGE)
CMS-PERSISTENCE-STORAGES-TEMPLATE          = cms-persistence-storages-template.yaml


#backend
DEPLOY_STACK_NAME      = $(PROJECT_NAME)-backend-$(STAGE)
DEPLOY_BUCKET_NAME     = $(PROJECT_NAME)-backend-deploy-for-lambda-$(STAGE)-$(AWS_ACCOUNT)
CMS-BACKEND-TEMPLATE   = cms-backend-template.yaml
CMS-BACKEND-PACKAGE    = cms-backend-package.yaml
#
echo:
	@echo ターゲットが必要

#----------------------------------------------------------------------
# S3バケットを作成&DynamoDBテーブルを作成。
# DynamoDBテーブルはスタックが削除されると同時に削除されるので必要であればバックアップ。
# コマンドの頭に@を付けると、実行時にコマンドの出力だけを表示しコマンド自体は表示しなくなる。
#----------------------------------------------------------------------
validate-Ps:
	@ aws cloudformation validate-template \
		--profile $(PROFILE) \
		--template-body file://$(TEMPLETE-FILES-FOLDER)/$(CMS-PERSISTENCE-STORAGES-TEMPLATE)

create-Ps:
	aws cloudformation create-stack \
		--profile $(PROFILE) \
		--stack-name $(CMS-PERSISTENCE-STORAGES-STRAGE_STACK_NAME) \
		--region $(AWS_REGION) \
		--template-body file://$(TEMPLETE-FILES-FOLDER)/$(CMS-PERSISTENCE-STORAGES-TEMPLATE) \
		--parameters \
			 ParameterKey=Stage,ParameterValue=$(STAGE) \
			 ParameterKey=AWSAccount,ParameterValue=$(AWS_ACCOUNT) \

# updateps:
# 	@ aws cloudformation update-stack \
# 		--stack-name $(CMS-PERSISTENCE-STORAGES-STRAGE_STACK_NAME) \
# 		--region $(AWS_REGION) \
# 		--template-body file://$(CMS-PERSISTENCE-STORAGES-TEMPLATE)


#----------------------------------------------------------------------
# lambda,api gatewayの設定
# lambdaの環境変数は関数作成時に作成され、以後変更の場合はテンプレの値は採用されない。
# なのでいったん関数を削除する必要がある。
#----------------------------------------------------------------------
samvalidate:
	@ sam validate \
     	--profile $(PROFILE) \
		--template $(TEMPLETE-FILES-FOLDER)/$(CMS-BACKEND-TEMPLATE)

sampackage:
	@ sam package \
     	--profile $(PROFILE) \
		--template-file $(TEMPLETE-FILES-FOLDER)/$(CMS-BACKEND-TEMPLATE) \
		--s3-bucket $(DEPLOY_BUCKET_NAME) \
		--output-template-file $(TEMPLETE-FILES-FOLDER)/$(CMS-BACKEND-PACKAGE)

samdeploy:
	sam deploy \
		--region $(AWS_REGION) \
     	--profile $(PROFILE) \
		--template-file $(TEMPLETE-FILES-FOLDER)/$(CMS-BACKEND-PACKAGE) \
		--capabilities CAPABILITY_IAM \
		--stack-name $(DEPLOY_STACK_NAME) \
		--parameter-overrides \
			 Stage=$(STAGE) \
			 AWSAccount=$(AWS_ACCOUNT) \

samdescribe:
	@ aws cloudformation describe-stacks \
     	--profile $(PROFILE) \
		--region $(AWS_REGION) \
		--stack-name $(DEPLOY_STACK_NAME)

 
# オプション無しのsam syncコマンドは、sam deployコマンドと同様に全てのインフラストラクチャとコードをデプロイまたは、アップデートします。
# ただし、sam deployとは異なり、sam syncはAWS CloudFormationの変更セットプロセスをバイパスします。
# ルートスタックのテンプレートにネストスタックの記述が追加されネストスタックが作成されます。
# 開発環境のみ使用することをお勧めします。
samsync:
	sam sync \
     	--profile $(PROFILE) \
		--stack-name $(DEPLOY_STACK_NAME) \
		--template $(TEMPLETE-FILES-FOLDER)/$(CMS-BACKEND-TEMPLATE)


#----------------------------------------------------------------------
# 一気にでデプロイする場合のターゲット
deploysam: samvalidate sampackage samdeploy samdescribe
#----------------------------------------------------------------------

#----------------------------------------------------------------------
# 以下 aws cli のサンプルコマンド
# lambdaのログは以下のようなロググループ、ログストリームに書き出される
# (Log group) /aws/lambda/headless-cms-articleListLambda-dev  
#	 (Log stream) 2022/08/20/[$LATEST]6f197c4ac2954fc598caff1af3ec223a
cleanlog:
	 aws logs delete-log-group --log-group-name /aws/lambda/headless-cms-articleListLambda-dev

createlogGroup:
	 aws logs create-log-group --log-group-name /aws/lambda/headless-cms-articleListLambda-dev

list:
	aws configure list --profile $(PROFILE)

#----------------------------------------------------------------------
# ローカルで動かす場合 Dockerが動いていないといけない
# Docker デーモンを起動
# $ sudo systemctl start docker
# Docker をブート時に自動起動するには、次のように実行します。
# $ sudo systemctl enable docker
# ブラウザで以下のようにして呼び出す
# http://127.0.0.1:3000/v1/getArticleList 

localtest:
	sam local start-api \
	   	--profile $(PROFILE) \
		--template $(TEMPLETE-FILES-FOLDER)/$(CMS-BACKEND-TEMPLATE)