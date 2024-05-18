export { v4 as uuidv4, v5 as uuidv5 } from "uuid";

// Encode integer ID to UUID
export function encodeIdToUUID(id: number): string {
  const hexString = id.toString(16).padStart(32, "0"); // Convert integer ID to hexadecimal string
  const uuid = `${hexString.substr(0, 8)}-${hexString.substr(
    8,
    4
  )}-${hexString.substr(12, 4)}-${hexString.substr(16, 4)}-${hexString.substr(
    20
  )}`;
  return uuid;
}

// Decode UUID to integer ID
export function decodeUUIDToId(uuid: string): number {
  const hexString = uuid.replace(/-/g, ""); // Remove dashes from UUID
  const id = parseInt(hexString, 16); // Parse hexadecimal string as integer
  return id;
}
