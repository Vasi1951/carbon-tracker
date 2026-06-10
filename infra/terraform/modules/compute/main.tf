variable "project_id" {}
variable "region" {}
variable "vpc_access_connector" {}
variable "db_connection_name" {}
variable "redis_host" {}
variable "redis_port" {}
variable "api_image" {}
variable "web_image" {}
variable "service_account_email" {}
variable "binary_auth_policy" {}

resource "google_cloud_run_v2_service" "api" {
  name     = "carbon-tracker-api"
  location = var.region
  project  = var.project_id

  template {
    service_account = var.service_account_email
    
    scaling {
      min_instance_count = 1
      max_instance_count = 100
    }

    containers {
      image = var.api_image
      resources {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }
        cpu_idle = false # CPU always allocated
      }
      env {
        name  = "DB_HOST"
        value = "/cloudsql/${var.db_connection_name}"
      }
      env {
        name  = "REDIS_HOST"
        value = var.redis_host
      }
      env {
        name  = "REDIS_PORT"
        value = var.redis_port
      }
    }
    vpc_access {
      connector = var.vpc_access_connector
      egress    = "ALL_TRAFFIC"
    }
  }

  binary_authorization {
    use_default = true
  }
}

resource "google_cloud_run_v2_service" "web" {
  name     = "carbon-tracker-web"
  location = var.region
  project  = var.project_id

  template {
    service_account = var.service_account_email
    
    scaling {
      min_instance_count = 1
      max_instance_count = 100
    }

    containers {
      image = var.web_image
      resources {
        limits = {
          cpu    = "1000m"
          memory = "256Mi"
        }
        cpu_idle = false
      }
    }
  }

  binary_authorization {
    use_default = true
  }
}
