# Data Model

## Cameras Table

- cameraId (PK)
- accountId
- friendlyName
- kvsStreamName
- iotThingName
- status
- retentionHours

## ViewingSessions Table

- sessionId (PK)
- cameraId (GSI)
- accountId
- startTs
- endTs
- durationSeconds
- clipS3Key

## ExportJobs Table

- jobId (PK)
- sessionId
- status
- s3Key
