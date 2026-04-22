# Architecture

## Overview

This platform separates responsibilities into three planes:

### 1. Media Plane
- Amazon Kinesis Video Streams
- Handles ingest, retention, playback, and clip extraction

### 2. Control Plane
- AWS IoT Core
- Lambda
- EventBridge
- DynamoDB

### 3. Experience Plane
- Alexa Smart Home Skill
- Echo Show devices

## Key Principle

Do NOT record Echo Show sessions.

Always record the underlying camera stream in AWS.

## Data Flow

RTSP Camera -> Bridge -> Kinesis Video Streams -> Archived Media APIs -> S3

## Event Flow

Alexa View Request -> Lambda -> EventBridge -> DynamoDB Session Record
