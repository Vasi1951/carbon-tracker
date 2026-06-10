variable "project_id" {}
variable "region" {}
variable "vpc_network_id" {}
variable "db_password" {}

resource "google_sql_database_instance" "postgres" {
  name             = "carbon-tracker-db"
  database_version = "POSTGRES_16"
  region           = var.region
  project          = var.project_id

  settings {
    tier              = "db-custom-2-8192"
    availability_type = "REGIONAL" # High Availability

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "02:00"
      transaction_log_retention_days = 7
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = var.vpc_network_id
    }
  }

  deletion_protection = true
}

resource "google_sql_database" "database" {
  name     = "carbon_tracker"
  instance = google_sql_database_instance.postgres.name
  project  = var.project_id
}

resource "google_sql_user" "users" {
  name     = "carbon_user"
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
  project  = var.project_id
}
