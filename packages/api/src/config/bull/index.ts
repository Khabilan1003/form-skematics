import { REDIS_HOST, REDIS_PORT } from "../../environments";

export const redisOptions = {
  redis: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
};
