output "vpc_id" {
  value = google_compute_network.main.id
}

output "vpc_access_connector_id" {
  value = google_vpc_access_connector.main.id
}
