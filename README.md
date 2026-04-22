# NextGenSecurity

Cloud-first reference architecture for an Alexa Echo Show live-view security platform that records camera sessions to AWS, logs viewing activity, and exports clips to cloud storage.

## Goal

Build a security platform that:

- streams camera live view to Echo Show devices through Alexa Smart Home
- records the underlying camera stream in AWS
- creates cloud-native viewing session records
- exports clips for evidence, archive, analytics, or downstream workflows
- keeps the edge as thin as possible and pushes the control plane, media plane, and automation into managed AWS services

## Reference Architecture

```text
RTSP Camera
   |
   v
Edge Bridge / Stream Agent
   |- pulls RTSP
   |- authenticates with AWS IoT Core
   |- publishes stream to Amazon Kinesis Video Streams
   |
   +-------------------------------+
   |                               |
   v                               v
AWS IoT Core                  Amazon Kinesis Video Streams
   |- thing identity               |- ingest
   |- certs/policies               |- retention
   |- heartbeats                   |- archived media APIs
   |- jobs/config                  |- playback / clip generation
   |
   v
Amazon EventBridge
   |- session started
   |- session ended
   |- clip requested
   |- export complete
   |
   v
AWS Lambda
   |- Alexa Smart Home handlers
   |- session orchestration
   |- entitlement checks
   |- clip export workflows
   |
   v
Amazon DynamoDB
   |- cameras
   |- viewing sessions
   |- export jobs
   |
   v
Amazon S3
   |- exported MP4 clips
   |- evidence bundles
   |- long-term archive
   |
   v
Amazon API Gateway / Admin APIs
   |
   v
Alexa Smart Home Skill
   |- discovery
   |- CameraStreamController
   |
   v
Echo Show
```

## Major AWS Services

### Media plane
- Amazon Kinesis Video Streams
- Amazon S3

### Device plane
- AWS IoT Core
- AWS IoT Jobs
- AWS Secrets Manager

### Application plane
- AWS Lambda
- Amazon EventBridge
- Amazon API Gateway
- Amazon DynamoDB
- Amazon CloudWatch
- AWS CloudTrail

## High-Level Flow

1. Camera or NVR exposes RTSP.
2. Lightweight bridge authenticates to AWS IoT Core.
3. Bridge publishes stream into Amazon Kinesis Video Streams.
4. User says, `Alexa, show Front Door`.
5. Alexa Smart Home skill resolves camera metadata and returns stream details.
6. Echo Show opens live view.
7. Session-start event is emitted into EventBridge.
8. Lambda writes session metadata to DynamoDB.
9. Session-end event updates DynamoDB and can trigger clip export.
10. Selected clips are exported to S3 and tracked as export jobs.

## Repository Layout

```text
/docs
  architecture.md
  data-model.md
  event-flow.md
  implementation-roadmap.md
/infra/terraform
  README.md
  main.tf
  variables.tf
  outputs.tf
/services/alexa-skill
  README.md
/services/session-orchestrator
  README.md
```

## Initial Build Phases

### Phase 1 - MVP
- one RTSP camera
- one edge bridge
- one Kinesis Video Streams stream
- Alexa Smart Home camera integration
- DynamoDB session logging
- optional clip export to S3

### Phase 2 - Production Hardening
- multi-camera registry
- IoT certificate provisioning
- CloudWatch alarms
- CloudTrail audit coverage
- per-camera retention policies
- export job retries and dead-letter handling

### Phase 3 - Platform Expansion
- admin portal and API layer
- analytics and search
- motion/event-triggered workflows
- downstream AI review pipeline

## Notes

This repo is structured as a cloud-heavy reference implementation and project starter. The preferred long-term Alexa path is WebRTC with `Alexa.RTCSessionController`, but this repository starts from the more practical RTSP plus `Alexa.CameraStreamController` design for faster implementation.
