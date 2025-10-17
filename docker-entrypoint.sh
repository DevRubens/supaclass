#!/bin/sh
set -e

mkdir -p /home/app/.gemini /home/app/.npm-global
chown -R app:app /home/app/.gemini /home/app/.npm-global

exec su -s /bin/sh -c "$*" app
