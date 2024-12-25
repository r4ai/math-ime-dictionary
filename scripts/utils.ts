import { Buffer } from "node:buffer"

export const encode_utf16le = (str: string): Uint8Array => {
  const bom = Buffer.from([0xff, 0xfe])
  const body = Buffer.from(str, "utf16le")
  return Buffer.concat([bom, body])
}
