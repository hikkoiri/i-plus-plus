import {
  IResource,
  LambdaIntegration,
  MockIntegration,
  PassthroughBehavior,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, Table, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { App, Stack, RemovalPolicy, StackProps } from 'aws-cdk-lib';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { HostedZone, ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ApiGateway } from 'aws-cdk-lib/aws-route53-targets';
import { DnsValidatedCertificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { join } from 'path'



export class CounterBackendStack extends Stack {
  constructor(app: App, id: string, stackProps?: StackProps) {
    super(app, id, stackProps);

    //Configuration
    const domainName = 'carlo-hildebrandt.de'
    const subDomainName = 'counter'

    const COUNTER_TABLE_NAME = "counter";
    const COUNTER_PRIMARY_KEY = "_id";
    const COUNTER_PRIMARY_KEY_VALUE = "theOneAndOnlyTruth"
    const CORS_ALLOWED_ORIGIN = "https://" + domainName

    const counterDynamoTable = new Table(this, 'Counter', {
      partitionKey: {
        name: COUNTER_PRIMARY_KEY,
        type: AttributeType.STRING
      },
      tableName: COUNTER_TABLE_NAME,
      removalPolicy: RemovalPolicy.RETAIN,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      depsLockFilePath: join(__dirname, 'lambdas', 'package-lock.json'),
      environment: {
        CORS_ALLOWED_ORIGIN: CORS_ALLOWED_ORIGIN,
        COUNTER_TABLE_NAME: COUNTER_TABLE_NAME,
        COUNTER_PRIMARY_KEY: COUNTER_PRIMARY_KEY,
        COUNTER_PRIMARY_KEY_VALUE: COUNTER_PRIMARY_KEY_VALUE
      },
      runtime: Runtime.NODEJS_14_X,
    }

    // Create Lambda functions
    const getLambda = new NodejsFunction(this, 'getFunction', {
      entry: join(__dirname, 'lambdas', 'get.ts'),
      ...nodeJsFunctionProps,
    });
    const prometheusLambda = new NodejsFunction(this, 'prometheusFunction', {
      entry: join(__dirname, 'lambdas', 'prometheus.ts'),
      ...nodeJsFunctionProps,
    });
    const increaseLambda = new NodejsFunction(this, 'increaseFunction', {
      entry: join(__dirname, 'lambdas', 'increase.ts'),
      ...nodeJsFunctionProps,
    });


    // Grant the Lambda function access to the DynamoDB table
    counterDynamoTable.grantReadData(getLambda)
    counterDynamoTable.grantReadData(prometheusLambda)
    counterDynamoTable.grantReadWriteData(increaseLambda)

    // Integrate the Lambda functions with the API Gateway resource
    const getIntegration = new LambdaIntegration(getLambda);
    const prometheusIntegration = new LambdaIntegration(prometheusLambda);
    const increaseIntegration = new LambdaIntegration(increaseLambda);

    // Prepare API Gateway
    const backendDomainName = subDomainName + '.' + domainName
    const myHostedZone = HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domainName
    });

    const certificate = new DnsValidatedCertificate(this, 'FrontendCertificate', {
      domainName: backendDomainName,
      hostedZone: myHostedZone,
      validation: CertificateValidation.fromDns(myHostedZone)
    });

    // Create an API Gateway resource for each of the CRUD operations
    const api = new RestApi(this, 'Api', {
      restApiName: 'CounterApi',
      domainName: {
        domainName: backendDomainName,
        certificate: certificate,
      },
    });

    new ARecord(this, 'CustomDomainAliasRecord', {
      zone: myHostedZone,
      recordName: subDomainName,
      target: RecordTarget.fromAlias(new ApiGateway(api))
    });

    api.root.addMethod('GET', getIntegration);
    addCorsOptions(api.root, CORS_ALLOWED_ORIGIN);


    const prometheus = api.root.addResource('metrics');
    prometheus.addMethod('GET', prometheusIntegration);
    addCorsOptions(prometheus, CORS_ALLOWED_ORIGIN);

    const increase = api.root.addResource('increase');
    increase.addMethod('GET', increaseIntegration);
    addCorsOptions(increase, CORS_ALLOWED_ORIGIN);
  }
}

export function addCorsOptions(apiResource: IResource, corsAllowedOrigin: string) {
  apiResource.addMethod('OPTIONS', new MockIntegration({
    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Origin': "'" + corsAllowedOrigin + "'",
        'method.response.header.Access-Control-Allow-Credentials': "'false'",
        'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET'",
      },
    }],
    passthroughBehavior: PassthroughBehavior.NEVER,
    requestTemplates: {
      "application/json": "{\"statusCode\": 200}"
    },
  }), {
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    }]
  })
}

const app = new App();
new CounterBackendStack(app, 'CounterBackend',
  {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  });
app.synth();
