FROM alpine:3.5
RUN addgroup -S redis && adduser -S -G redis redis
RUN apk add --no-cache 'su-exec>=0.2'
ENV REDIS_VERSION 3.2.6
ENV REDIS_DOWNLOAD_URL http://download.redis.io/releases/redis-3.2.6.tar.gz
ENV REDIS_DOWNLOAD_SHA1 0c7bc5c751bdbc6fabed178db9cdbdd948915d1b
RUN set -ex \
    \
    && apk add --no-cache --virtual .build-deps \
        gcc \
        linux-headers \
        make \
        musl-dev \
        tar \
    \
    && wget -O redis.tar.gz "$REDIS_DOWNLOAD_URL" \
    && echo "$REDIS_DOWNLOAD_SHA1 *redis.tar.gz" | sha1sum -c - \
    && mkdir -p /usr/src/redis \
    && tar -xzf redis.tar.gz -C /usr/src/redis --strip-components=1 \
    && rm redis.tar.gz \
    \
    && grep -q '^#define CONFIG_DEFAULT_PROTECTED_MODE 1$' /usr/src/redis/src/server.h \
    && sed -ri 's!^(#define CONFIG_DEFAULT_PROTECTED_MODE) 1$!\1 0!' /usr/src/redis/src/server.h \
    && grep -q '^#define CONFIG_DEFAULT_PROTECTED_MODE 0$' /usr/src/redis/src/server.h \
    \
    && make -C /usr/src/redis \
    && make -C /usr/src/redis install \
    \
    && rm -r /usr/src/redis \
    \
    && apk del .build-deps
RUN mkdir /data && chown redis:redis /data
VOLUME /data
WORKDIR /data
COPY redis.conf /etc/
COPY docker-entrypoint.sh /usr/local/bin/
ENTRYPOINT ["docker-entrypoint.sh"]
EXPOSE 6379
CMD [ "redis-server" ]
