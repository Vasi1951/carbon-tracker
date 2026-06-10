variable "project_id" {}
variable "api_service" {}
variable "web_service" {}
variable "domain_name" {}

resource "google_compute_global_address" "default" {
  name    = "carbon-tracker-ip"
  project = var.project_id
}

resource "google_compute_managed_ssl_certificate" "default" {
  name    = "carbon-tracker-cert"
  project = var.project_id
  managed {
    domains = [var.domain_name]
  }
}

resource "google_compute_security_policy" "policy" {
  name    = "carbon-tracker-armor"
  project = var.project_id

  rule {
    action   = "allow"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "default rule"
  }
}

resource "google_compute_backend_service" "web_backend" {
  name                  = "web-backend"
  project               = var.project_id
  protocol              = "HTTPS"
  enable_cdn            = true
  security_policy       = google_compute_security_policy.policy.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

resource "google_compute_backend_service" "api_backend" {
  name                  = "api-backend"
  project               = var.project_id
  protocol              = "HTTPS"
  enable_cdn            = false
  security_policy       = google_compute_security_policy.policy.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

resource "google_compute_url_map" "default" {
  name            = "carbon-tracker-url-map"
  project         = var.project_id
  default_service = google_compute_backend_service.web_backend.id

  host_rule {
    hosts        = [var.domain_name]
    path_matcher = "allpaths"
  }

  path_matcher {
    name            = "allpaths"
    default_service = google_compute_backend_service.web_backend.id

    path_rule {
      paths   = ["/api", "/api/*"]
      service = google_compute_backend_service.api_backend.id
    }
  }
}

resource "google_compute_target_https_proxy" "default" {
  name             = "carbon-tracker-https-proxy"
  project          = var.project_id
  url_map          = google_compute_url_map.default.id
  ssl_certificates = [google_compute_managed_ssl_certificate.default.id]
}

resource "google_compute_global_forwarding_rule" "default" {
  name                  = "carbon-tracker-lb"
  project               = var.project_id
  target                = google_compute_target_https_proxy.default.id
  port_range            = "443"
  ip_address            = google_compute_global_address.default.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}
