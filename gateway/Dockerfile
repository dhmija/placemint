FROM nginx:stable-alpine

RUN apk add --no-cache gettext

COPY gateway/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY gateway/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
