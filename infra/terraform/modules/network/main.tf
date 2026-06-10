variable "project_id" {}
variable "region" {}

resource "google_compute_network" "main" {
  name                    = "carbon-tracker-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "private" {
  name          = "carbon-tracker-private-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.main.id
  private_ip_google_access = true
}

resource "google_vpc_access_connector" "main" {
  name          = "vpc-con"
  region        = var.region
  subnet {
    name = google_compute_subnetwork.private.name
  }
  machine_type  = "e2-micro"
  min_instances = 2
  max_instances = 10
}

resource "google_compute_router" "router" {
  name    = "carbon-tracker-router"
  region  = var.region
  network = google_compute_network.main.id
}

resource "google_compute_router_nat" "nat" {
  name                               = "carbon-tracker-nat"
  router                             = google_compute_router.router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}
