# turnitin-notify
Send SMS notifications whenever anything happens on turnitin.com.

## Setup
All it needs is a `crontab` entry, a complete `.env`, and a folder.

To set up `turnitin-notify`:

1. Clone the repo somewhere
1. Fill out the .env according to the 'configuration' section.
1. Using `crontab -e`, run the `main.js` script every once in a while.

## Configuration

`.env:`
```
# Turnitin creds
TURNITIN_EMAIL=<your turnitin.com email address>
TURNITIN_PW=<your turnitin.com password>

# Twilio creds
TWILIO_SID=<your twilio api sid>
TWILIO_AUTH_TOKEN=<your twilio api authtoken>
TWILIO_NUMBER=<a send number added to your twilio project>
RECV_NUMBER=<the number to send sms notifications to>
```
