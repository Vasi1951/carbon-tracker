variable "project_id" {
  type        = string
  description = "The GCP project ID"
}

variable "region" {
  type        = string
  description = "The primary region for resources"
  default     = "us-central1"
}

variable "db_password" {
  type        = string
  description = "The password for the PostgreSQL database"
  sensitive   = true
}

variable "api_image" {
  type        = string
  description = "The Artifact Registry URI for the API Docker image"
}

variable "web_image" {
  type        = string
  description = "The Artifact Registry URI for the Web frontend Docker image"
}

variable "domain_name" {
  type        = string
  description = "The domain name for the load balancer (e.g., api.carbontracker.dev)"
}

variable "pagerduty_auth_token" {
  type        = string
  description = "The PagerDuty authentication token for alert channels"
  sensitive   = true
}

variable "slack_channel_id" {
  type        = string
  description = "The Slack channel ID for alert notifications"
}
