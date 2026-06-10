variable "project_id" {}
variable "pagerduty_auth_token" {}
variable "slack_channel_id" {}
variable "api_service_name" {}
variable "domain_name" {}

resource "google_monitoring_notification_channel" "pagerduty" {
  display_name = "PagerDuty High Severity Alerts"
  type         = "pagerduty"
  project      = var.project_id
  labels = {
    service_key = var.pagerduty_auth_token
  }
}

resource "google_monitoring_notification_channel" "slack" {
  display_name = "Slack Ops Channel"
  type         = "slack"
  project      = var.project_id
  labels = {
    auth_token = var.pagerduty_auth_token # Or slack token
    channel_name = var.slack_channel_id
  }
}

resource "google_monitoring_alert_policy" "high_latency" {
  display_name = "High Latency Alert - API"
  project      = var.project_id
  combiner     = "OR"
  conditions {
    display_name = "P99 Latency > 200ms"
    condition_threshold {
      filter          = "resource.type = \"cloud_run_revision\" AND resource.labels.service_name = \"${var.api_service_name}\" AND metric.type = \"run.googleapis.com/request_latencies\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 200 # ms
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_PERCENTILE_99"
        cross_series_reducer = "REDUCE_MAX"
      }
    }
  }
  notification_channels = [
    google_monitoring_notification_channel.pagerduty.id,
    google_monitoring_notification_channel.slack.id
  ]
}

resource "google_monitoring_alert_policy" "high_error_rate" {
  display_name = "High Error Rate Alert - 1%"
  project      = var.project_id
  combiner     = "OR"
  conditions {
    display_name = "HTTP 5xx > 1%"
    condition_threshold {
      filter          = "resource.type = \"cloud_run_revision\" AND resource.labels.service_name = \"${var.api_service_name}\" AND metric.type = \"run.googleapis.com/request_count\" AND metric.labels.response_code_class = \"5xx\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 1 # Assuming simplified threshold representation
    }
  }
  notification_channels = [
    google_monitoring_notification_channel.pagerduty.id,
    google_monitoring_notification_channel.slack.id
  ]
}

resource "google_monitoring_uptime_check_config" "https_check" {
  display_name = "Uptime Check"
  project      = var.project_id
  timeout      = "10s"
  period       = "60s"

  http_check {
    path           = "/api/v1/health"
    port           = 443
    use_ssl        = true
    validate_ssl   = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = var.domain_name
    }
  }
}
