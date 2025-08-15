import { userThunk } from '@proton/account/user';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { userSettingsThunk } from '@proton/account/userSettings';
import useApi from '@proton/components/hooks/useApi';
import usePrimaryRecoverySecret from '@proton/components/hooks/usePrimaryRecoverySecret';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { setNewRecoverySecret } from '@proton/shared/lib/api/settingsRecovery';
import {
    exportRecoveryFile,
    generateRecoverySecret,
    validateRecoverySecret,
} from '@proton/shared/lib/recoveryFile/recoveryFile';

const useDownloadRecoveryFile = () => {
    const api = useApi();
    const dispatch = useDispatch();

    const getUserKeys = useGetUserKeys();

    const primaryRecoverySecret = usePrimaryRecoverySecret();

    const downloadRecoveryFile = async () => {
        const userKeys = await getUserKeys();
        const primaryUserKey = userKeys[0];
        if (!primaryUserKey) {
            return;
        }

        if (!primaryRecoverySecret) {
            const { recoverySecret, signature } = await generateRecoverySecret(primaryUserKey.privateKey);
            await api(
                setNewRecoverySecret({
                    RecoverySecret: recoverySecret,
                    Signature: signature,
                })
            );
            await exportRecoveryFile({ recoverySecret, userKeys });
            await Promise.all([
                dispatch(userSettingsThunk({ cache: CacheType.None })),
                dispatch(userThunk({ cache: CacheType.None })),
            ]);
            return;
        }

        const valid = await validateRecoverySecret(primaryRecoverySecret, primaryUserKey.publicKey);
        if (!valid) {
            throw new Error('Unable to verify recovery file signature');
        }

        await exportRecoveryFile({
            recoverySecret: primaryRecoverySecret.RecoverySecret,
            userKeys,
        });
    };

    return downloadRecoveryFile;
};

export default useDownloadRecoveryFile;
