import { ICacheService } from '@carbon-tracker/application';
import { createClient, type RedisClientType } from 'redis';

const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export function jsonDateReviver(key: string, value: unknown): unknown {
  if (typeof value === 'string' && dateRegex.test(value)) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return value;
}

export class RedisCacheService implements ICacheService {
  private client: RedisClientType | null = null;
  private isConnecting = false;

  constructor(private readonly url: string) {}

  private createRedisClient(): RedisClientType {
    const client = createClient({
      url: this.url,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
      },
    }) as RedisClientType;

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
    return client;
  }

  private async getClient(): Promise<RedisClientType> {
    if (this.client) return this.client;
    if (this.isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.getClient();
    }
    this.isConnecting = true;
    try {
      const client = this.createRedisClient();
      await client.connect();
      this.client = client;
      return this.client;
    } finally {
      this.isConnecting = false;
    }
  }

  public async get(key: string): Promise<string | null> {
    const client = await this.getClient();
    return client.get(key);
  }

  public async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    const client = await this.getClient();
    await client.set(key, value, { EX: ttlSeconds });
  }

  public async del(key: string): Promise<void> {
    const client = await this.getClient();
    await client.del(key);
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }
}
