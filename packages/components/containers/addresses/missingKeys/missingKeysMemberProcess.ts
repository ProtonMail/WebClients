import { OpenPGPKey } from 'pmcrypto';
import { generateMemberAddressKey } from 'proton-shared/lib/keys/organizationKeys';
import { Api, Address, Member, EncryptionConfig } from 'proton-shared/lib/interfaces';
import { updateAddress } from './state';
import { SetFormattedAddresses, Status } from './interface';
import { createMemberAddressKeys } from '../../members/actionHelper';

interface MissingKeysMemberProcessArguments {
    api: Api;
    encryptionConfig: EncryptionConfig;
    addresses: Address[];
    setFormattedAddresses: SetFormattedAddresses;
    organizationKey: OpenPGPKey;
    primaryMemberKey: OpenPGPKey;
    member: Member;
}
export default ({
    api,
    encryptionConfig,
    addresses,
    setFormattedAddresses,
    member,
    primaryMemberKey,
    organizationKey,
}: MissingKeysMemberProcessArguments) => {
    return Promise.all(
        addresses.map(async (address) => {
            try {
                setFormattedAddresses((oldState) => {
                    return updateAddress(oldState, address.ID, { status: { type: Status.LOADING } });
                });

                const { privateKey, ...rest } = await generateMemberAddressKey({
                    email: address.Email,
                    primaryKey: primaryMemberKey,
                    organizationKey,
                    encryptionConfig,
                });

                await createMemberAddressKeys({
                    api,
                    Member: member,
                    Address: address,
                    keys: [], // Assume no keys exists for this address since we are in this modal.
                    signingKey: privateKey,
                    privateKey,
                    ...rest,
                });

                setFormattedAddresses((oldState) => {
                    return updateAddress(oldState, address.ID, { status: { type: Status.DONE } });
                });
            } catch (e) {
                setFormattedAddresses((oldState) =>
                    updateAddress(oldState, address.ID, { status: { type: Status.FAILURE, tooltip: e.message } })
                );
            }
        })
    );
};
