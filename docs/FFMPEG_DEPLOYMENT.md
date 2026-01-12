# FFmpeg Video Processing - Production Deployment Guide

This document outlines the recommended approach for deploying video processing in production.

## 🎯 Recommended Architecture: AWS Lambda + FFmpeg

### Why Lambda?
- **Serverless**: No server management, auto-scaling
- **Cost-effective**: Pay only for processing time
- **Pre-built FFmpeg layers**: No need to compile FFmpeg
- **Integration**: Works seamlessly with S3, SQS, CloudWatch

### Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌────────────────┐
│   Next.js   │─────▶│   SQS Queue  │─────▶│  Lambda Worker │
│   API Route │      │   (Job Queue)│      │   (FFmpeg)     │
└─────────────┘      └──────────────┘      └────────────────┘
                                                    │
                                                    ▼
                                            ┌────────────────┐
                                            │   S3 Storage   │
                                            │  (Video Files) │
                                            └────────────────┘
                                                    │
                                                    ▼
                                            ┌────────────────┐
                                            │   Database     │
                                            │  (Update URL)  │
                                            └────────────────┘
```

## 📦 Implementation Steps

### 1. Install FFmpeg Lambda Layer

Use the popular `ffmpeg-lambda-layer` package:

```bash
npm install ffmpeg-lambda-layer
```

Or manually add a pre-built layer ARN for your region:
- **us-east-1**: `arn:aws:lambda:us-east-1:985374797321:layer:ffmpeg:1`
- **us-west-2**: `arn:aws:lambda:us-west-2:985374797321:layer:ffmpeg:1`
- **eu-west-1**: `arn:aws:lambda:eu-west-1:985374797321:layer:ffmpeg:1`

### 2. Create Lambda Function

**File**: `lambda/video-processor/index.ts`

```typescript
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { SQSEvent } from 'aws-lambda'
import { VideoProcessor } from './video-processor' // Copy from src/lib

const s3Client = new S3Client({ region: process.env.AWS_REGION })

export async function handler(event: SQSEvent) {
  for (const record of event.Records) {
    const job = JSON.parse(record.body)
    
    try {
      // Download video from S3
      const videoKey = `input-videos/${job.contentId}.mp4`
      const videoBuffer = await s3Client.send(new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: videoKey
      }))
      
      // Save to /tmp (Lambda temp storage)
      const inputPath = `/tmp/input-${job.editId}.mp4`
      await writeFile(inputPath, videoBuffer.Body)
      
      // Process video
      const processor = new VideoProcessor('/tmp')
      const result = await processor.processVideo({
        videoUrl: inputPath,
        operations: job.operations,
        settings: job.settings,
        outputPath: `/tmp/output-${job.editId}.mp4`
      })
      
      if (result.success) {
        // Upload to S3
        const outputKey = `edited-videos/${job.editId}.mp4`
        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: outputKey,
          Body: await readFile(result.outputPath)
        }))
        
        // Update database
        await fetch(`${process.env.API_URL}/api/editing/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            editId: job.editId,
            videoUrl: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${outputKey}`,
            processingTime: result.processingTime
          })
        })
      }
    } catch (error) {
      console.error('Processing failed:', error)
      // Update database with failed status
      await fetch(`${process.env.API_URL}/api/editing/failed`, {
        method: 'POST',
        body: JSON.stringify({ editId: job.editId })
      })
    }
  }
}
```

### 3. Create SQS Queue

```bash
# Create queue
aws sqs create-queue --queue-name video-processing-queue

# Get queue URL
aws sqs get-queue-url --queue-name video-processing-queue
```

### 4. Update Next.js API Route

**File**: `src/app/api/editing/process/route.ts`

```typescript
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'

const sqsClient = new SQSClient({ region: process.env.AWS_REGION })

export async function POST(req: Request) {
  // ... existing code ...
  
  // Instead of processVideoInBackground(), send to SQS
  await sqsClient.send(new SendMessageCommand({
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageBody: JSON.stringify({
      editId: videoEdit.id,
      contentId,
      videoUrl,
      operations,
      settings
    })
  }))
  
  return NextResponse.json({
    editId: videoEdit.id,
    status: 'queued',
    message: 'Video queued for processing'
  })
}
```

### 5. Deploy Lambda Function

**serverless.yml**:

```yaml
service: video-processor

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  memorySize: 3008 # Max memory for faster processing
  timeout: 900     # 15 minutes max
  
  environment:
    S3_BUCKET: ${env:S3_BUCKET}
    API_URL: ${env:API_URL}
    DATABASE_URL: ${env:DATABASE_URL}
  
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - s3:GetObject
            - s3:PutObject
          Resource: arn:aws:s3:::${env:S3_BUCKET}/*
        - Effect: Allow
          Action:
            - sqs:ReceiveMessage
            - sqs:DeleteMessage
          Resource: arn:aws:sqs:*:*:video-processing-queue

functions:
  processVideo:
    handler: index.handler
    layers:
      - arn:aws:lambda:us-east-1:985374797321:layer:ffmpeg:1
    events:
      - sqs:
          arn: arn:aws:sqs:${aws:region}:${aws:accountId}:video-processing-queue
          batchSize: 1 # Process one video at a time

plugins:
  - serverless-webpack
```

Deploy:

```bash
npm install -g serverless
serverless deploy
```

## 💰 Cost Optimization

### Lambda Configuration
- **Memory**: 3008 MB (max, for faster FFmpeg)
- **Timeout**: 900 seconds (15 min max for Lambda)
- **Concurrent executions**: Set limit to control costs

### S3 Lifecycle Rules
```json
{
  "Rules": [
    {
      "Id": "DeleteInputVideosAfter7Days",
      "Status": "Enabled",
      "Prefix": "input-videos/",
      "Expiration": {
        "Days": 7
      }
    },
    {
      "Id": "TransitionToIA",
      "Status": "Enabled",
      "Prefix": "edited-videos/",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        }
      ]
    }
  ]
}
```

### Estimated Costs (1000 videos/month)
- **Lambda**: 3GB RAM × 30s avg × 1000 = ~$10/month
- **S3 Storage**: 50GB × $0.023/GB = ~$1.15/month
- **S3 Requests**: 1000 uploads × $0.005/1000 = ~$0.01/month
- **SQS**: 1000 messages × $0.40/million = ~$0.0004/month
- **Total**: ~$12/month for 1000 videos

## 🔄 Alternative: Cloudflare Workers + Durable Objects

For simpler edits, consider Cloudflare Workers:

```typescript
// worker.ts
export default {
  async queue(batch: MessageBatch<VideoJob>, env: Env) {
    for (const message of batch.messages) {
      const job = message.body
      
      // Use FFmpeg.wasm for browser-compatible processing
      const ffmpeg = await createFFmpeg({ log: true })
      await ffmpeg.load()
      
      // Download video
      const response = await fetch(job.videoUrl)
      const videoData = await response.arrayBuffer()
      ffmpeg.FS('writeFile', 'input.mp4', new Uint8Array(videoData))
      
      // Apply edits (simplified)
      await ffmpeg.run('-i', 'input.mp4', '-vf', 'scale=1280:720', 'output.mp4')
      
      // Upload to R2
      const output = ffmpeg.FS('readFile', 'output.mp4')
      await env.R2_BUCKET.put(`edited-videos/${job.editId}.mp4`, output)
      
      message.ack()
    }
  }
}
```

**Pros**:
- Cheaper for simple edits
- No cold starts
- Integrated with R2 storage

**Cons**:
- Limited by Worker CPU time (30s max)
- FFmpeg.wasm slower than native FFmpeg
- Not suitable for heavy processing

## 🧪 Testing

### Local Testing with Docker

```dockerfile
FROM public.ecr.aws/lambda/nodejs:18

# Install FFmpeg
RUN yum install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
RUN yum install -y ffmpeg

# Copy function code
COPY index.js package*.json ./
RUN npm install

CMD [ "index.handler" ]
```

Run locally:
```bash
docker build -t video-processor .
docker run -p 9000:8080 video-processor
```

Test:
```bash
curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -d '{"body":"{\"editId\":\"test-123\",\"videoUrl\":\"...\"}"}''
```

## 📊 Monitoring

### CloudWatch Metrics to Track
- Lambda invocations
- Lambda duration
- Lambda errors
- SQS message age
- S3 storage size

### Set up Alarms
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name HighVideoProcessingErrors \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

## 🎓 Resources

- [FFmpeg Lambda Layer](https://github.com/serverlesspub/ffmpeg-aws-lambda-layer)
- [AWS Lambda Limits](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [FFmpeg Filters Guide](https://ffmpeg.org/ffmpeg-filters.html)
