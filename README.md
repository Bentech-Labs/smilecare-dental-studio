# SmileCare Dental Studio — website prototype

## Files
- `index.html`: homepage / landing page
- `appointment.html`: appointment request form
- `reviews.html`: patient feedback form
- `styles.css`: shared responsive styling
- `config.js`: n8n webhook and Google review URL configuration
- `script.js`: form validation, demo/live webhook submission, service QR query handling

## Run locally
Open `index.html` in a browser, or serve this folder using a local static server.

## Before launch
1. Replace the temporary clinic name, phone, address, opening hours and copy.
2. Replace the stock image with a clinic-approved image.
3. Replace the placeholder testimonial with a genuine testimonial published with permission.
4. Set `googleReviewUrl` in `config.js` to the clinic's real Google review link.
5. Set `appointmentWebhookUrl` and `reviewWebhookUrl` to the production n8n webhook URLs.
6. Configure and test n8n validation, spam protection, Calendar availability and event creation.
7. Replace the sample appointment time options with live slots returned by an availability endpoint before enabling automatic confirmations.
8. Deploy over HTTPS and add a privacy notice and data-retention policy.

## Form payloads
Appointment fields: `name`, `phone`, `email`, `service`, `preferredDate`, `preferredTime`, `message`, `consent`, `formType`, `submittedAt`, `source`.

Review fields: `name`, `rating`, `service`, `feedback`, `suggestions`, `consent`, `formType`, `submittedAt`, `source`.

## Important
With empty webhook URLs, forms run in demo mode and do not transmit or store patient data. The appointment form is a request, not a confirmed booking. Do not collect sensitive clinical information through these basic forms. Configure server-side validation and anti-spam protection in n8n before public launch.
