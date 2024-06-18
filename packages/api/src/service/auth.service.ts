import {
  timestamp,
  random,
  parseNumber,
  hs,
  helper,
  RandomType,
} from "@form/utils";

import {
  SESSION_KEY,
  VERIFICATION_CODE_EXPIRE,
  VERIFICATION_CODE_LIMIT,
} from "../environments";

import {
  COOKIE_SESSION_NAME,
  SessionOptionsFactory,
  CookieOptionsFactory,
  COOKIE_LOGIN_IN_NAME,
} from "../config/cookie";

import { aesDecryptObject, aesEncryptObject } from "../utils/crypto";
import { HTTPException } from "hono/http-exception";
import { RedisService } from "./redis.service";
import { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { ExceptionSchema } from "./schema/error.schema";
interface LoginOptions {
  c: Context<any>;
  userId: string;
}

export class AuthService {
  static setSession(c: Context<any>, jsonObject: Record<string, any>): void {
    const value = aesEncryptObject(jsonObject, SESSION_KEY);
    setCookie(c, COOKIE_SESSION_NAME, value, SessionOptionsFactory());
  }

  static getSession(c: Context<any>): Record<string, any> | void {
    const cookie = getCookie(c, COOKIE_SESSION_NAME);

    if (!cookie) {
      throw new HTTPException(401, { message: "User not logged in" });
    }

    try {
      return aesDecryptObject(cookie!, SESSION_KEY);
    } catch (_) {}
  }

  static async login({ c, userId }: LoginOptions): Promise<void> {
    AuthService.setSession(c, {
      loginAt: timestamp(),
      id: userId,
    });

    setCookie(c, COOKIE_LOGIN_IN_NAME, "true", CookieOptionsFactory());
  }

  // Verified
  static async getVerificationCode(
    key: string,
    length = 6,
    type = RandomType.NUMERIC
  ): Promise<string> {
    const code = random(length, type);
    await RedisService.hset({
      key,
      field: code,
      value: timestamp() + hs(VERIFICATION_CODE_EXPIRE)!,
      duration: VERIFICATION_CODE_EXPIRE,
    });

    // Delete the oldest one if the number of code is exceeded the VERIFICATION_CODE_LIMIT
    const result = await RedisService.hget({ key });
    const fields = Object.keys(result as Object);
    const count = fields.length;

    if (count > VERIFICATION_CODE_LIMIT) {
      await RedisService.hdel({
        key,
        field: fields.splice(0, count - VERIFICATION_CODE_LIMIT),
      });
    }

    return code;
  }

  // Verified
  static async checkVerificationCode(
    key: string,
    code: string
  ): Promise<void | ExceptionSchema> {
    const cache = await RedisService.hget({
      key,
      field: code,
    });

    if (!helper.isValid(cache)) {
      const exception: ExceptionSchema = {
        statusCode: 400,
        message: "Invalid verification code",
      };
      return exception;
    }

    const expired = parseNumber(cache);

    if (expired === undefined || expired < timestamp()) {
      const exception: ExceptionSchema = {
        statusCode: 400,
        message: "Verification code expired",
      };
      return exception;
    }
  }
}
