export function generateKeyMapFromArray<T = Record<string, unknown>>(
  array: T[],
  key: keyof T
) {
  if (array.length === 0) return {};

  return Object.fromEntries(array.map((item) => [item[key], item]));
}

export function uint8ArrayToString(data: Uint8Array): string {
  return Buffer.from(data).toString();
}

export function stringToUint8Array(data: string): Uint8Array {
  return Uint8Array.from(Buffer.from(data));
}
