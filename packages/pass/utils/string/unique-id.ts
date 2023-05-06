export const uniqueId = (length: number = 8): string =>
    Array.from(crypto.getRandomValues(new Uint8Array(length)))
        .map((b) => b.toString(16))
        .join('')
        .slice(0, length);
