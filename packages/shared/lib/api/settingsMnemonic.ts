import { MNEMONIC_STATUS } from '../interfaces';

export interface MnemonicKeyResponse {
    ID: string;
    PrivateKey: string;
    Salt: string;
}
export const getMnemonicUserKeys = () => ({
    url: 'core/v4/settings/mnemonic',
    method: 'get',
});

interface UpdateMnemonicPhrasePayload {
    MnemonicUserKeys: {
        ID: string;
        PrivateKey: string;
    }[];
    MnemonicSalt: string;
    MnemonicAuth: {
        Version: number;
        ModulusID: string;
        Salt: string;
        Verifier: string;
    };
}
export const updateMnemonicPhrase = (data: UpdateMnemonicPhrasePayload) => ({
    url: 'core/v4/settings/mnemonic',
    method: 'put',
    data,
});

export const reactivateMnemonicPhrase = (data: UpdateMnemonicPhrasePayload) => ({
    url: 'core/v4/settings/mnemonic/reactivate',
    method: 'put',
    data,
});

export const disableMnemonicPhrase = () => ({
    url: 'core/v4/settings/mnemonic/disable',
    method: 'post',
});

export interface GetMnemonicResetData {
    MnemonicStatus: MNEMONIC_STATUS;
    MnemonicUserKeys: {
        ID: string;
        PrivateKey: string;
        Salt: string;
    }[];
}
export const getMnemonicReset = () => ({
    url: 'core/v4/settings/mnemonic/reset',
    method: 'get',
});

interface MnemonicResetPayload {
    UserKeys: {
        ID: string;
        PrivateKey: string;
    }[];
    KeysSalt: string;
}
export const mnemonicReset = (data: MnemonicResetPayload) => ({
    url: 'core/v4/settings/mnemonic/reset',
    method: 'post',
    data,
});
