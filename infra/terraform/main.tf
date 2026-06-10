terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
  backend "gcs" {
    bucket = "carbon-tracker-tf-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

module "network" {
  source     = "./modules/network"
  project_id = var.project_id
  region     = var.region
}

module "security" {
  source     = "./modules/security"
  project_id = var.project_id
}

module "database" {
  source           = "./modules/database"
  project_id       = var.project_id
  region           = var.region
  vpc_network_id   = module.network.vpc_id
  db_password      = var.db_password
}

module "redis" {
  source         = "./modules/redis"
  project_id     = var.project_id
  region         = var.region
  vpc_network_id = module.network.vpc_id
}

module "compute" {
  source                 = "./modules/compute"
  project_id             = var.project_id
  region                 = var.region
  vpc_access_connector   = module.network.vpc_access_connector_id
  db_connection_name     = module.database.connection_name
  redis_host             = module.redis.host
  redis_port             = module.redis.port
  api_image              = var.api_image
  web_image              = var.web_image
  service_account_email  = module.security.run_service_account_email
  binary_auth_policy     = module.security.binary_auth_policy_id
}

module "loadbalancer" {
  source       = "./modules/loadbalancer"
  project_id   = var.project_id
  api_service  = module.compute.api_service_name
  web_service  = module.compute.web_service_name
  domain_name  = var.domain_name
}

module "observability" {
  source              = "./modules/observability"
  project_id          = var.project_id
  pagerduty_auth_token= var.pagerduty_auth_token
  slack_channel_id    = var.slack_channel_id
  api_service_name    = module.compute.api_service_name
  domain_name         = var.domain_name
}
