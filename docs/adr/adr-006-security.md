# ADR 006: API Security Posture

## Status
Accepted

## Context
The API must be resilient against common attack vectors such as Cross-Site Scripting (XSS), Brute Force attacks, Denial of Service (DoS), and malicious payload injections.

## Decision
We enforce a comprehensive security posture through middlewares in our Express API:
1. **Helmet**: For setting secure HTTP headers (e.g. strict Content Security Policy).
2. **Rate Limiting**: `express-rate-limit` enforces a strict 100 requests per 15-minute window per IP to mitigate DoS and credential stuffing.
3. **Zod Validation**: Input payloads are strongly typed and validated at runtime using `zod` via `validateRequest.middleware.ts`, rejecting any extraneous or malformed data before it reaches the domain layer.

## Consequences
- **Pros:**
  - Mitigates OWASP Top 10 vulnerabilities effectively.
  - Predictable error responses for invalid inputs (400 Bad Request).
- **Cons:**
  - Rate Limiting may require tuning for large organizational users or heavy client traffic.
