variable "project_name" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "nextgensecurity"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "camera_names" {
  description = "Friendly camera names to provision Kinesis Video Streams for"
  type        = list(string)
  default     = ["front-door"]
}

variable "kvs_data_retention_hours" {
  description = "Retention in hours for Kinesis Video Streams"
  type        = number
  default     = 168
}

variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "python3.12"
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 30
}

variable "session_table_billing_mode" {
  description = "Billing mode for DynamoDB tables"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "iot_thing_name" {
  description = "IoT thing name for the edge bridge"
  type        = string
  default     = "nextgensecurity-edge-bridge"
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
