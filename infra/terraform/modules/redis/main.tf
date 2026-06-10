variable "project_id" {}
variable "region" {}
variable "vpc_network_id" {}

resource "google_redis_instance" "cache" {
  name           = "carbon-tracker-redis"
  tier           = "STANDARD_HA"
  memory_size_gb = 1
  region         = var.region
  redis_version  = "REDIS_7_0"

  authorized_network = var.vpc_network_id
}
