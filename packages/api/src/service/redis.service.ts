import { hs } from "@form/utils";
import redis from "../config/redis";

interface BaseOptions {
  key: string;
}

interface SetOptions extends BaseOptions {
  value: any;
  duration: string;
}

interface HsetOptions extends SetOptions {
  field: string;
}

interface HgetOptions extends BaseOptions {
  field?: string;
}

interface HdelOptions extends BaseOptions {
  field?: string | string[];
}

export class RedisService {
  public static get(key: string): Promise<string | null> {
    return redis.get(key);
  }

  public static async set({ key, value, duration }: SetOptions): Promise<any> {
    await redis.set(key, value);
    return await redis.expire(key, hs(duration)!);
  }

  public static hset({
    key,
    field,
    value,
    duration,
  }: HsetOptions): Promise<[error: Error | null, result: unknown][] | null> {
    return this.multi([
      ["hset", key, field, value],
      ["expire", key, hs(duration)],
    ]);
  }

  public static hsetObject({
    key,
    value: obj,
    duration,
  }: SetOptions): Promise<[error: Error | null, result: unknown][] | null> {
    return this.multi([
      ...Object.keys(obj).map((field) => ["hset", key, field, obj[field]]),
      ["expire", key, hs(duration)],
    ]);
  }

  public static hget({
    key,
    field,
  }: HgetOptions): Promise<string | null> | Promise<Record<string, string>> {
    if (field) {
      return redis.hget(key, field);
    }
    return redis.hgetall(key);
  }

  public static hdel({ key, field }: HdelOptions): Promise<number> {
    if (field) {
      if (typeof field === "string") {
        field = [field];
      }

      return redis.hdel(key, ...field);
    }
    return this.del(key);
  }

  public static multi(
    commands: string[][]
  ): Promise<[error: Error | null, result: unknown][] | null> {
    return redis.multi(commands).exec();
  }

  public static incr(key: string): Promise<number> {
    return redis.incr(key);
  }

  public static del(key: string): Promise<number> {
    return redis.del(key);
  }
}
