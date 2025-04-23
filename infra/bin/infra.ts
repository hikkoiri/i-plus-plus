#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { IPlusPlusStack } from '../lib/i-plus-plus-stack';
import { prodProps } from '../config/prod';

const app = new cdk.App();


new IPlusPlusStack(app, 'IPlusPlusStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }, 
  ...prodProps
});