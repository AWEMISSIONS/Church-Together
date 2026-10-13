# Church Together — before offering to other churches

## Automatic invitation email

- [ ] Let each church configure and verify a sender address on its own domain (for example, `invites@churchdomain.org`). Use a verified association address for association-level invitations.
- [ ] Store the verified sender configuration per church. The current optional email integration uses one global `INVITE_FROM_EMAIL` and does **not** yet select a church-specific sender.
- [ ] Connect a transactional email service and store its API credential as a hosted secret. Verify each sending domain and its required DNS records before enabling automatic delivery.
- [ ] On **Save access & invite**, send from the church associated with the new membership. For people assigned to multiple churches, define which church sends the invite; do not silently use another church's identity.
- [ ] Record delivery status without storing raw invitation links or tokens. Show a clear failure with a manual email/share fallback, and allow an administrator to retry without sending duplicates accidentally.
- [ ] Test an actual inbox delivery, single-use signup, seven-day expiration, resend/reset, removed access, and the association sender for at least two different church domains.

**Current state:** Saving access creates a one-use invitation and offers a prefilled email that the administrator sends. Automatic delivery code is present but inactive until a service credential and verified sender are configured. It currently supports only one sender, so the per-church work above must be finished before sale.
