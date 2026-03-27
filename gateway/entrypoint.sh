#!/bin/sh
set -eu

envsubst '${AUTH_SERVICE_URL} ${PROFILE_SERVICE_URL} ${JOB_SERVICE_URL} ${APPLICATION_SERVICE_URL} ${NOTIFICATION_SERVICE_URL} ${SKILLS_SERVICE_URL} ${QUIZ_SERVICE_URL} ${ANNOUNCEMENT_SERVICE_URL} ${HACKATHON_SERVICE_URL} ${TASK_SERVICE_URL} ${INTERVIEW_SERVICE_URL} ${MESSAGING_SERVICE_URL}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
