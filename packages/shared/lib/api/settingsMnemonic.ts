import { MNEMONIC_STATUS } from '../interfaces';

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
    url: 'settings/mnemonic',
    method: 'put',
    data,
});

export const reactivateMnemonicPhrase = (data: UpdateMnemonicPhrasePayload) => ({
    url: 'settings/mnemonic/reactivate',
    method: 'put',
    data,
});

export const disableMnemonicPhrase = () => ({
    url: 'settings/mnemonic/disable',
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
    url: 'settings/mnemonic/reset',
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
    url: 'settings/mnemonic/reset',
    method: 'post',
    data,
});
