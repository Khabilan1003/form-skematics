import { hs } from "@form/utils";
import { CookieOptions } from "hono/utils/cookie";
import { COOKIE_MAX_AGE, SESSION_MAX_AGE } from "../../environments";

const commonOptions = {
  sameSite: "Lax",
  secure: true,
};

export const COOKIE_SESSION_NAME = "FORM_SESSION";
export const COOKIE_LOGIN_IN_NAME = "FORM_LOGGED_IN";
export const COOKIE_BROWSER_ID_NAME = "FORM_BROWSER_ID";

export function CookieOptionsFactory(options?: CookieOptions): CookieOptions {
  return {
    maxAge: hs(COOKIE_MAX_AGE),
    ...commonOptions,
    ...options,
  } as any;
}

export function SessionOptionsFactory(options?: CookieOptions): CookieOptions {
  return {
    maxAge: hs(SESSION_MAX_AGE),
    httpOnly: true,
    ...commonOptions,
    ...options,
  } as any;
}
