import { Redis } from "ioredis";
import { REDIS_HOST, REDIS_PORT } from "../../environments";

const redis = new Redis({ port: REDIS_PORT, host: REDIS_HOST });

export default redis;
