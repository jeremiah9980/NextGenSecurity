############################
# KINESIS VIDEO STREAMS
############################
resource "aws_kinesis_video_stream" "cameras" {
  for_each = toset(var.camera_names)

  name                    = "${var.project_name}-${each.value}-${var.environment}"
  data_retention_in_hours = var.kvs_data_retention_hours
}

############################
# DYNAMODB TABLES
############################
resource "aws_dynamodb_table" "cameras" {
  name         = "${var.project_name}-cameras-${var.environment}"
  billing_mode = var.session_table_billing_mode
  hash_key     = "cameraId"

  attribute {
    name = "cameraId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "sessions" {
  name         = "${var.project_name}-sessions-${var.environment}"
  billing_mode = var.session_table_billing_mode
  hash_key     = "sessionId"

  attribute {
    name = "sessionId"
    type = "S"
  }

  attribute {
    name = "cameraId"
    type = "S"
  }

  global_secondary_index {
    name            = "cameraId-index"
    hash_key        = "cameraId"
    projection_type = "ALL"
  }
}

############################
# IOT CORE (THING + CERT)
############################
resource "aws_iot_thing" "bridge" {
  name = var.iot_thing_name
}

resource "tls_private_key" "iot_key" {
  algorithm = "RSA"
}

resource "aws_iot_certificate" "bridge_cert" {
  active = true
}

resource "aws_iot_policy" "bridge_policy" {
  name = "${var.project_name}-iot-policy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "iot:Connect",
          "iot:Publish",
          "iot:Subscribe",
          "iot:Receive"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iot_policy_attachment" "bridge_attach" {
  policy = aws_iot_policy.bridge_policy.name
  target = aws_iot_certificate.bridge_cert.arn
}

resource "aws_iot_thing_principal_attachment" "bridge_attach_thing" {
  thing     = aws_iot_thing.bridge.name
  principal = aws_iot_certificate.bridge_cert.arn
}

############################
# LAMBDA (SESSION HANDLER)
############################
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda.zip"
}

resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "session_handler" {
  function_name = "${var.project_name}-session-handler-${var.environment}"
  role          = aws_iam_role.lambda_role.arn
  handler       = "handler.lambda_handler"
  runtime       = var.lambda_runtime
  filename      = data.archive_file.lambda_zip.output_path
  timeout       = var.lambda_timeout
}

############################
# EVENTBRIDGE
############################
resource "aws_cloudwatch_event_rule" "session_events" {
  name = "${var.project_name}-session-events"

  event_pattern = jsonencode({
    source = ["nextgensecurity.sessions"]
  })
}

resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.session_events.name
  target_id = "lambda"
  arn       = aws_lambda_function.session_handler.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.session_handler.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.session_events.arn
}
