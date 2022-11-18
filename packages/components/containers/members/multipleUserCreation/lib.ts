import { PrivateKeyReference } from '@proton/crypto';
import { checkMemberAddressAvailability, createMember, createMemberAddress } from '@proton/shared/lib/api/members';
import { ENCRYPTION_CONFIGS, ENCRYPTION_TYPES, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import { getEmailParts, validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { Address, Api } from '@proton/shared/lib/interfaces';
import { GetAddresses } from '@proton/shared/lib/interfaces/hooks/GetAddresses';
import { setupMemberKeys } from '@proton/shared/lib/keys';
import { srpVerify } from '@proton/shared/lib/srp';

import InvalidAddressesError from './errors/InvalidAddressesError';
import UnavailableAddressesError from './errors/UnavailableAddressesError';
import { UserTemplate } from './types';

export const createUser = async ({
    user,
    api,
    getAddresses,
    organizationKey,
}: {
    user: UserTemplate;
    api: Api;
    getAddresses: GetAddresses;
    organizationKey: PrivateKeyReference;
}) => {
    const { emailAddresses, password, displayName, totalStorage, vpnAccess, privateSubUser } = user;

    const invalidAddresses: string[] = [];
    const addressParts = emailAddresses.map((emailAddress) => {
        const isValid = validateEmailAddress(emailAddress);
        if (!isValid) {
            invalidAddresses.push(emailAddress);
        }

        const [Local, Domain] = getEmailParts(emailAddress);
        return {
            address: emailAddress,
            Local,
            Domain,
        };
    });

    if (invalidAddresses.length) {
        /**
         * Throw if any of the addresses are not valid
         */
        throw new InvalidAddressesError(invalidAddresses);
    }

    const unavailableAddresses: string[] = [];

    const [firstAddressParts, ...restAddressParts] = addressParts;

    const checkAddressAvailability = async ({
        address,
        Local,
        Domain,
    }: {
        address: string;
        Local: string;
        Domain: string;
    }) => {
        try {
            await api(
                checkMemberAddressAvailability({
                    Local,
                    Domain,
                })
            );
        } catch (error: any) {
            if (error.cancel) {
                /**
                 * Allow for handling if auth prompt is cancelled
                 */
                throw error;
            }
            unavailableAddresses.push(address);
        }
    };

    /**
     * Will prompt password prompt only once
     */
    await checkAddressAvailability(firstAddressParts);

    /**
     * No more password prompts will be needed
     */
    await Promise.all(restAddressParts.map(checkAddressAvailability));

    if (unavailableAddresses.length) {
        /**
         * Throw if any of the addresses are not available
         */
        throw new UnavailableAddressesError(unavailableAddresses);
    }

    const { Member } = await srpVerify({
        api,
        credentials: { password },
        config: createMember({
            Name: displayName,
            Private: +privateSubUser,
            MaxSpace: +totalStorage,
            MaxVPN: vpnAccess ? VPN_CONNECTIONS : 0,
        }),
    });

    /**
     * Create addresses one at a time
     */
    const memberAddresses: Address[] = [];
    for (const { Local, Domain } of addressParts) {
        const { Address } = await api<{ Address: Address }>(
            createMemberAddress(Member.ID, {
                Local,
                Domain,
            })
        );
        memberAddresses.push(Address);
    }

    if (!privateSubUser) {
        const ownerAddresses = await getAddresses();
        await setupMemberKeys({
            api,
            ownerAddresses,
            member: Member,
            memberAddresses,
            organizationKey: organizationKey,
            encryptionConfig: ENCRYPTION_CONFIGS[ENCRYPTION_TYPES.CURVE25519],
            password,
        });
    }
};
