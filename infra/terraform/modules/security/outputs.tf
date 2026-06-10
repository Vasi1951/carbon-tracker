output "run_service_account_email" {
  value = google_service_account.cloud_run_sa.email
}

output "binary_auth_policy_id" {
  value = google_binary_authorization_policy.policy.id
}
