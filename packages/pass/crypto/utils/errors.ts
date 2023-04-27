export class PassCryptoError extends Error {}
export class PassCryptoNotHydratedError extends PassCryptoError {}
export class PassCryptoHydrationError extends PassCryptoError {}
export class PassCryptoShareError extends PassCryptoError {}
export class PassCryptoVaultError extends PassCryptoError {}
export class PassCryptoItemError extends PassCryptoError {}

export const isPassCryptoError = (err: any) => err instanceof PassCryptoError;
