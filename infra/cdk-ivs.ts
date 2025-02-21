#!/usr/bin/env node
// import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ivs from 'aws-cdk-lib/aws-ivs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';

export class IVSStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const context = this.node.tryGetContext('info')
    const name = context.name
    const tags = this.node.tryGetContext('tags')


    const s3Bucket = new cdk.aws_s3.Bucket(this, 'recordingBucket', {
      bucketName: `${name}-${this.region}`,
    });

    const cf = new cloudfront.Distribution(this, 'cloudfront', {
      defaultBehavior: {
        origin: cloudfrontOrigins.S3BucketOrigin.withOriginAccessControl(s3Bucket),
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN
      
      },
    })


    const recordingConfiguration = new ivs.CfnRecordingConfiguration(this, 'recordingConfiguration', {
      name,
      destinationConfiguration: {
        s3: {
          bucketName: s3Bucket.bucketName,
        }
      },
    });

    const channel = new ivs.CfnChannel(this, 'channel', {
      name,
      latencyMode: 'LOW',
      type: 'STANDARD',
      recordingConfigurationArn: recordingConfiguration.attrArn,
      tags
    });
    
    const streamKey = new ivs.CfnStreamKey(this, 'streamKey', {
      channelArn: channel.attrArn,
    } )

    new cdk.CfnOutput(this, 'streamKey_string', { value: streamKey.attrValue})
    new cdk.CfnOutput(this, 'ingestionEndpoint', { value: channel.attrIngestEndpoint })
    new cdk.CfnOutput(this, 'cf', { value: cf.distributionDomainName })

  }
}

const app = new cdk.App({
  context: {
    info: {
      name: 'ivs-demo',
    }
  }
});

new IVSStack(app, 'IVSdemo', {
  tags: {
    'environment:type':'dev',
  },
  env: { region: 'us-east-1' },
});


