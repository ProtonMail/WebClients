import { PrivateKeyReference } from '@proton/crypto';

import { Address, Api, EncryptionConfig, Member } from '../interfaces';
import { getHasMemberMigratedAddressKeys } from './keyMigration';
import { createMemberAddressKeysLegacy, createMemberAddressKeysV2, getDecryptedMemberKey } from './memberKeys';

type OnUpdateCallback = (ID: string, update: { status: 'loading' | 'error' | 'ok'; result?: string }) => void;

interface MissingKeysMemberProcessArguments {
    api: Api;
    encryptionConfig: EncryptionConfig;
    onUpdate: OnUpdateCallback;
    organizationKey: PrivateKeyReference;
    ownerAddresses: Address[];
    member: Member;
    memberAddresses: Address[];
    memberAddressesToGenerate: Address[];
}

export const missingKeysMemberProcess = async ({
    api,
    encryptionConfig,
    onUpdate,
    ownerAddresses,
    member,
    memberAddresses,
    memberAddressesToGenerate,
    organizationKey,
}: MissingKeysMemberProcessArguments) => {
    const PrimaryKey = member.Keys.find(({ Primary }) => Primary === 1);

    if (!PrimaryKey) {
        throw new Error('Member keys are not set up');
    }

    const hasMigratedAddressKeys = getHasMemberMigratedAddressKeys(memberAddresses, ownerAddresses);

    const primaryMemberUserKey = await getDecryptedMemberKey(PrimaryKey, organizationKey);

    return Promise.all(
        memberAddressesToGenerate.map(async (memberAddress) => {
            try {
                onUpdate(memberAddress.ID, { status: 'loading' });

                if (hasMigratedAddressKeys) {
                    await createMemberAddressKeysV2({
                        api,
                        member,
                        memberAddress,
                        memberAddressKeys: [], // Assume no keys exist for this address since we are in this modal.
                        encryptionConfig,
                        memberUserKey: primaryMemberUserKey,
                        organizationKey,
                    });
                } else {
                    await createMemberAddressKeysLegacy({
                        api,
                        member,
                        memberAddress,
                        memberAddressKeys: [], // Assume no keys exist for this address since we are in this modal.
                        encryptionConfig,
                        memberUserKey: primaryMemberUserKey,
                        organizationKey,
                    });
                }

                onUpdate(memberAddress.ID, { status: 'ok' });
            } catch (e: any) {
                onUpdate(memberAddress.ID, { status: 'error', result: e.message });
            }
        })
    );
};
