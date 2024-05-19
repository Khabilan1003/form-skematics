import * as blocklist from "disposable-email-blocklist";

export function isDisposableEmail(email: string): boolean {
  const [_, domain] = email.toLowerCase().split("@");

  const domainArray: string[] = blocklist as unknown as string[];

  for (let i = 0; i < domainArray.length; i++) {
    if (domainArray[i] === domain) return true;
  }

  return false;
}
