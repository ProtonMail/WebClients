import type { Maybe } from '@proton/pass/types/utils';

let encryptedAppPassword: Maybe<Uint8Array<ArrayBuffer>>;

export const setAppPassword = (key: Maybe<Uint8Array<ArrayBuffer>>) => {
    encryptedAppPassword = key;
};

export const getAppPassword = () => encryptedAppPassword;

export const clearAppPassword = () => {
    encryptedAppPassword = undefined;
};
