import { KeyReactivationData } from '../reactivation/interface';
import { KeyImportData } from './interface';
import { ActiveKey, InactiveKey } from '../../interfaces';

export const getFilteredImportRecords = (
    keyImportRecords: KeyImportData[],
    activeKeys: ActiveKey[],
    inactiveKeys: InactiveKey[]
) => {
    return keyImportRecords.reduce<[KeyReactivationData[], KeyImportData[], KeyImportData[]]>(
        (acc, keyImportRecord) => {
            const { privateKey: uploadedPrivateKey } = keyImportRecord;
            const fingerprint = uploadedPrivateKey.getFingerprint();
            const maybeInactiveKey = inactiveKeys.find(({ fingerprint: otherFingerprint }) => {
                return otherFingerprint === fingerprint;
            });
            const maybeActiveKey = activeKeys.find(({ fingerprint: otherFingerprint }) => {
                return otherFingerprint === fingerprint;
            });
            if (maybeActiveKey) {
                acc[2].push(keyImportRecord);
            } else if (maybeInactiveKey) {
                acc[0].push({
                    id: keyImportRecord.id,
                    Key: maybeInactiveKey.Key,
                    privateKey: uploadedPrivateKey,
                });
            } else {
                acc[1].push(keyImportRecord);
            }
            return acc;
        },
        [[], [], []]
    );
};
