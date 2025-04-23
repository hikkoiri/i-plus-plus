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
import { DnsValidatedCertificate, CertificateValidation, Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { join } from 'path'
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IPlusPlusStackProps } from '../config/interface';

export class IPlusPlusStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: IPlusPlusStackProps) {
    super(scope, id, props);

    //Configuration
    const projectName = 'i-plus-plus';
    const tableName = `${projectName}-counter-table`
    const counterPrimaryKey = "origin";
    const fullBackendDomainName = props.subdomainName + '.' + props.domainName


    const counterDynamoTable = new Table(this, tableName, {
      partitionKey: {
        name: counterPrimaryKey,
        type: AttributeType.STRING
      },
      tableName,
    });

    const nodeJsFunctionProps: NodejsFunctionProps = {
      depsLockFilePath: join(__dirname, 'lambdas', 'package-lock.json'),
      environment: {
        COUNTER_TABLE_NAME: tableName,
        COUNTER_PRIMARY_KEY: counterPrimaryKey,
      },
      runtime: Runtime.NODEJS_20_X,
    }

    // Create Lambda functions
    const bumpLambda = new NodejsFunction(this, `${projectName}-bump-fn`, {
      functionName: `${projectName}-bump-fn`,
      entry: join(__dirname, 'lambdas', 'bump.ts'),
      ...nodeJsFunctionProps,
    });
    const svgLambda = new NodejsFunction(this, `${projectName}-svg-fn`, {
      functionName: `${projectName}-svg-fn`,
      entry: join(__dirname, 'lambdas', 'svg.ts'),
      ...nodeJsFunctionProps,
    });
    const prometheusLambda = new NodejsFunction(this, `${projectName}-prometheus-fn`, {
      functionName: `${projectName}-prometheus-fn`,
      entry: join(__dirname, 'lambdas', 'prometheus.ts'),
      ...nodeJsFunctionProps,
    });

    const mergeLambda = new NodejsFunction(this, `${projectName}-merge-fn`, {
      functionName: `${projectName}-merge-fn`,
      entry: join(__dirname, 'lambdas', 'merge.ts'),
      ...nodeJsFunctionProps,
    });


    // Grant the Lambda function access to the DynamoDB table
    counterDynamoTable.grantReadWriteData(bumpLambda)
    counterDynamoTable.grantReadWriteData(mergeLambda)
    counterDynamoTable.grantReadWriteData(svgLambda)
    counterDynamoTable.grantReadData(prometheusLambda)

    // Integrate the Lambda functions with the API Gateway resource
    const bumpIntegration = new LambdaIntegration(bumpLambda);
    const svgIntegration = new LambdaIntegration(svgLambda);
    const prometheusIntegration = new LambdaIntegration(prometheusLambda);

    let certificate;
    if (props.existingWildCardDomainCertArn && props.existingWildCardDomainCertArn.trim() !== '') {
      // Use existing wildcard domain certificate
      certificate = Certificate.fromCertificateArn(this, 'WildcardCertificate', props.existingWildCardDomainCertArn);
    } else {
      certificate = new Certificate(this, 'Certificate', {
        domainName: fullBackendDomainName,
        validation: CertificateValidation.fromDns(),
      });
    }


    // Create an API Gateway resource for each of the CRUD operations
    const api = new RestApi(this, `${projectName}-api-gw`, {
      restApiName: `${projectName}-api-gw`,
      domainName: {
        domainName: fullBackendDomainName,
        certificate: certificate,
      },
    });


    api.root.addMethod('GET', bumpIntegration);
    addCorsOptions(api.root, props.corsAllowedOrigin);


    const prometheus = api.root.addResource('metrics');
    prometheus.addMethod('GET', prometheusIntegration);
    addCorsOptions(prometheus, props.corsAllowedOrigin);

    const increase = api.root.addResource('svg');
    increase.addMethod('GET', svgIntegration);
    addCorsOptions(increase, props.corsAllowedOrigin);


    // Schedule the merge Lambda to run every midnight
    const rule = new cdk.aws_events.Rule(this, `${projectName}-merge-schedule-rule`, {
      schedule: cdk.aws_events.Schedule.cron({ minute: '0', hour: '0' }), // Midnight UTC
    });
    rule.addTarget(new cdk.aws_events_targets.LambdaFunction(mergeLambda));
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