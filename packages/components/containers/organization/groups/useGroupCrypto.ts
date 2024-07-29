import type { PrivateKeyReference } from '@proton/crypto/lib';
import { CryptoProxy } from '@proton/crypto/lib';

const useGroupCrypto = () => {
    const signMemberEmail = async (memberEmail: string, groupKey: PrivateKeyReference) => {
        return CryptoProxy.signMessage({
            textData: memberEmail,
            signingKeys: groupKey,
            context: { critical: true, value: 'account.key-token.address' },
            detached: true,
        });
    };

    return {
        signMemberEmail,
    };
};

export default useGroupCrypto;
