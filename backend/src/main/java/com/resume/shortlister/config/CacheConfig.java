package com.resume.shortlister.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

@Configuration
@EnableCaching
public class CacheConfig {

    @Value("${cache.type:local}")
    private String cacheType;

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        if ("redis".equalsIgnoreCase(cacheType)) {
            return redisCacheManager(connectionFactory);
        }
        return new ConcurrentMapCacheManager();
    }

    /**
     * Creates a Redis-backed cache manager. Only used when cache.type=redis.
     * When Redis is unavailable, cache operations will fail gracefully (no caching)
     * rather than taking down the application.
     */
    private CacheManager redisCacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues();

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(config)
                .withCacheConfiguration("candidates", config.entryTtl(Duration.ofMinutes(5)))
                .withCacheConfiguration("stats", config.entryTtl(Duration.ofMinutes(1)))
                .build();
    }
}
