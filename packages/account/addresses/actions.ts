import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import {
    convertToBYOEAddress as convertToBYOEAddressApi,
    createBYOEAddress as createBYOEAddressApi,
} from '@proton/activation/src/api/api';
import { createPreAuthKTVerifier } from '@proton/key-transparency/shared';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities/interface';
import {
    createAddress as createAddressConfig,
    deleteAddress as deleteAddressConfig,
    disableAddress as disableAddressConfig,
    enableAddress as enableAddressConfig,
    setupAddress as setupAddressConfig,
    updateAddressesOrder,
} from '@proton/shared/lib/api/addresses';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import mutatePassword from '@proton/shared/lib/authentication/mutate';
import { ADDRESS_STATUS, ADDRESS_TYPE, type APP_NAMES } from '@proton/shared/lib/constants';
import type { Address, Member } from '@proton/shared/lib/interfaces';
import {
    type AddressGenerationPayload,
    handleCreateAddressAndKey,
    handleSetupAddressAndKey,
    handleSetupAddressKeys,
} from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { createAddressKeysThunk, getCreateAddressKeysPayload } from '../addressKeys/createAddressKeys';
import type { KtState } from '../kt';
import { getKTActivation } from '../kt/actions';
import type { MemberState } from '../member';
import { type MembersState, getMemberAddresses } from '../members';
import { type OrganizationState, organizationThunk } from '../organization';
import type { OrganizationKeyState } from '../organizationKey';
import { removePersistedStateEvent } from '../persist/event';
import { type ProtonDomainsState, protonDomainsThunk } from '../protonDomains';
import type { UserState } from '../user';
import { userThunk } from '../user';
import { type UserInvitationsState, userInvitationsThunk } from '../userInvitations';
import type { UserKeysState } from '../userKeys';
import type { UserSettingsState } from '../userSettings';
import { type AddressesState, addressesThunk } from './index';

type RequiredState = KtState &
    UserState &
    OrganizationState &
    OrganizationKeyState &
    AddressesState &
    UserKeysState &
    MemberState &
    MembersState &
    ProtonDomainsState &
    UserSettingsState;

export const orderAddresses = ({
    member,
    addresses,
}: {
    member: Member | undefined;
    addresses: Address[];
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        await extra.api(updateAddressesOrder(addresses.map(({ ID }) => ID)));
        if (!member || member.Self) {
            // If the address is getting set as default it affects the user.Email value
            dispatch(addressesThunk({ cache: CacheType.None })).catch(noop);
            dispatch(userThunk({ cache: CacheType.None })).catch(noop);
        }
    };
};

export const createAddress = ({
    member: selectedMember,
    displayName,
    signature,
    emailAddressParts,
    password: memberPassword,
    setDefault,
}: {
    member: Member;
    displayName?: string;
    signature?: string;
    emailAddressParts: { Local: string; Domain: string };
    password?: string;
    setDefault?: boolean;
}): ThunkAction<Promise<Address>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        const [user, addresses, { premiumDomains }] = await Promise.all([
            dispatch(userThunk()),
            dispatch(addressesThunk()),
            dispatch(protonDomainsThunk()),
        ]);

        const [premiumDomain = ''] = premiumDomains;
        const emailAddress = `${emailAddressParts.Local}@${emailAddressParts.Domain}`;

        const hasPremium = addresses?.some(({ Type }) => Type === ADDRESS_TYPE.TYPE_PREMIUM);
        if (!hasPremium && `${user.Name}@${premiumDomain}`.toLowerCase() === emailAddress.toLowerCase()) {
            throw new Error(
                c('Error')
                    .t`${user.Name} is your username. To create ${emailAddress}, please go to Settings > Identity and addresses > Short domain (pm.me)`
            );
        }

        // NOTE: Important this is done _before_ address creation so that the address is not created if keys can't be created.
        const addressKeyCreationPayload = await dispatch(
            getCreateAddressKeysPayload({
                member: selectedMember,
                password: memberPassword,
            })
        );

        const { Address } = await api<{ Address: Address }>(
            createAddressConfig({
                MemberID: selectedMember.ID,
                Local: emailAddressParts.Local,
                Domain: emailAddressParts.Domain,
                DisplayName: displayName,
                Signature: signature,
            })
        );

        const updatedAddresses = await dispatch(
            createAddressKeysThunk({
                addressKeyCreationPayload,
                addressesToGenerate: [Address],
            })
        );

        if (setDefault) {
            // Default address is the first one in the list so we need to reorder the addresses
            await dispatch(orderAddresses({ member: selectedMember, addresses: [Address, ...addresses] }));
        }

        // Creating an address affects the `UsedAddresses` in organization
        dispatch(organizationThunk({ cache: CacheType.None })).catch(noop);

        return updatedAddresses.find(({ ID }) => ID === Address.ID) || Address;
    };
};

export const createPremiumAddress = ({
    domain,
    displayName,
    signature,
    replaceAddressSignature,
    setDefault,
}: {
    domain: string;
    displayName?: string;
    signature?: string;
    replaceAddressSignature?: boolean;
    setDefault?: boolean;
}): ThunkAction<Promise<Address>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const addresses = await dispatch(addressesThunk());
        const defaultAddress: Address | Partial<Address> = addresses?.[0] || {};
        const {
            Email: defaultAddressEmail = '',
            DisplayName = '',
            Signature: defaultAddressSignature = '',
        } = defaultAddress;
        const api = getSilentApi(extra.api);

        let nextAddressSignature: string | undefined;
        if (!signature && replaceAddressSignature && defaultAddressSignature) {
            nextAddressSignature = defaultAddressSignature.replaceAll(defaultAddressEmail, domain);
        }

        // NOTE: Important this is done _before_ address creation so that the address is not created if keys can't be created.
        const addressKeyCreationPayload = await dispatch(getCreateAddressKeysPayload());

        const { Address } = await api<{ Address: Address }>(
            setupAddressConfig({
                Domain: domain,
                DisplayName: displayName || DisplayName || '', // DisplayName can be null
                Signature: signature ?? nextAddressSignature ?? defaultAddressSignature ?? '', // Signature can be null
            })
        );

        const updatedAddresses = await dispatch(
            createAddressKeysThunk({
                addressKeyCreationPayload,
                addressesToGenerate: [Address],
            })
        );

        if (setDefault) {
            // Default address is the first one in the list so we need to reorder the addresses
            await dispatch(orderAddresses({ member: undefined, addresses: [Address, ...addresses] }));
        }

        return updatedAddresses.find(({ ID }) => ID === Address.ID) || Address;
    };
};

export const setupUser = ({
    password,
    app,
}: {
    password: string;
    app: APP_NAMES;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        const authentication = extra.authentication;
        const [user, addresses, domains] = await Promise.all([
            dispatch(userThunk()),
            dispatch(addressesThunk()),
            api<{
                Domains: string[];
            }>(queryAvailableDomains('signup')).then(({ Domains }) => Domains),
        ]);
        const preAuthKTVerifier = createPreAuthKTVerifier(dispatch(getKTActivation()));
        const passphrase = await handleSetupAddressKeys({
            addresses,
            api,
            username: user.Name,
            password,
            domains,
            preAuthKTVerify: preAuthKTVerifier.preAuthKTVerify,
            productParam: app,
        });
        dispatch(removePersistedStateEvent()); // Avoid resuming a critically out-of-date user
        await mutatePassword({
            api,
            authentication,
            keyPassword: passphrase,
            clearKeyPassword: password,
            User: user,
        });
        await preAuthKTVerifier.preAuthKTCommit(user.ID, api);
        await dispatch(userThunk({ cache: CacheType.None }));
    };
};

/**
 * Set up an external user with a proton mail address
 */
export const setupExternalUserForProton = ({
    payload,
    app,
}: {
    payload: Omit<AddressGenerationPayload, 'preAuthKTVerify'>;
    app: APP_NAMES;
}): ThunkAction<Promise<void>, RequiredState & UserInvitationsState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        const authentication = extra.authentication;

        const [user, addresses] = await Promise.all([dispatch(userThunk()), dispatch(addressesThunk())]);

        if (payload.setup.mode === 'setup') {
            const { preAuthKTCommit, preAuthKTVerify } = createPreAuthKTVerifier(dispatch(getKTActivation()));

            const keyPassword = await handleSetupAddressAndKey({
                username: payload.username,
                domain: payload.domain,
                api,
                password: payload.setup.loginPassword,
                preAuthKTVerify,
                productParam: app,
                user,
                addresses,
            });

            dispatch(removePersistedStateEvent()); // Avoid resuming a critically out-of-date user

            await mutatePassword({
                authentication,
                keyPassword,
                clearKeyPassword: payload.setup.loginPassword,
                User: user,
                api,
            });
            await preAuthKTCommit(user.ID, api);
        }

        if (payload.setup.mode === 'create') {
            const { preAuthKTCommit, preAuthKTVerify } = createPreAuthKTVerifier(dispatch(getKTActivation()));

            dispatch(removePersistedStateEvent()); // Avoid resuming a critically out-of-date user

            await handleCreateAddressAndKey({
                username: payload.username,
                domain: payload.domain,
                api,
                passphrase: payload.setup.keyPassword,
                preAuthKTVerify,
                user,
                addresses,
            });

            await preAuthKTCommit(user.ID, api);
        }

        dispatch(userInvitationsThunk({ cache: CacheType.None })).catch(noop);

        await Promise.all([
            dispatch(userThunk({ cache: CacheType.None })),
            dispatch(addressesThunk({ cache: CacheType.None })),
        ]);
    };
};

export const createBYOEAddress = ({
    emailAddressParts,
}: {
    emailAddressParts: { Local: string; Domain: string };
    displayName?: string;
}): ThunkAction<Promise<Address | undefined>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const organization = await dispatch(organizationThunk());

        const api = getSilentApi(extra.api);
        const emailAddress = `${emailAddressParts.Local}@${emailAddressParts.Domain}`;

        // NOTE: Important this is done _before_ address creation so that the address is not created if keys can't be created.
        const addressKeyCreationPayload = await dispatch(getCreateAddressKeysPayload());

        const { Address } = await api<{ Address: Address }>(
            createBYOEAddressApi({
                Email: emailAddress,
                OrganizationId: organization.ID,
            })
        );

        const updatedAddresses = await dispatch(
            createAddressKeysThunk({
                addressKeyCreationPayload,
                addressesToGenerate: [Address],
            })
        );

        // Update user object for BYOE. TODO: Is this still needed?
        dispatch(userThunk({ cache: CacheType.None })).catch(noop);

        return updatedAddresses.find(({ ID }) => ID === Address.ID) || Address;
    };
};

export const convertBYOEAddress = ({
    addressID,
}: {
    addressID: string;
}): ThunkAction<Promise<Address | undefined>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);

        const { Address } = await api<{ Address: Address }>(convertToBYOEAddressApi(addressID));

        const [, result] = await Promise.all([
            dispatch(userThunk({ cache: CacheType.None })),
            dispatch(addressesThunk({ cache: CacheType.None })),
        ]);

        return result.find(({ ID }) => ID === Address.ID) || Address;
    };
};

export const deleteAddress = ({
    address,
    member,
}: {
    address: Address;
    member: Member | undefined;
}): ThunkAction<Promise<undefined>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        if (address.Status === ADDRESS_STATUS.STATUS_ENABLED) {
            await api(disableAddressConfig(address.ID));
        }
        await api(deleteAddressConfig(address.ID));

        await Promise.all([
            dispatch(organizationThunk({ cache: CacheType.None })),
            member
                ? dispatch(getMemberAddresses({ member, cache: CacheType.None, retry: true }))
                : dispatch(addressesThunk({ cache: CacheType.None })),
        ]);
    };
};

export const disableAddress = ({
    address,
    member,
}: {
    address: Address;
    member: Member | undefined;
}): ThunkAction<Promise<undefined>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        if (address.Status === ADDRESS_STATUS.STATUS_ENABLED) {
            const api = getSilentApi(extra.api);
            await api(disableAddressConfig(address.ID));

            await Promise.all([
                dispatch(organizationThunk({ cache: CacheType.None })),
                member
                    ? dispatch(getMemberAddresses({ member, cache: CacheType.None, retry: true }))
                    : dispatch(addressesThunk({ cache: CacheType.None })),
            ]);
        }
    };
};

export const enableAddress = ({
    address,
    member,
}: {
    address: Address;
    member: Member | undefined;
}): ThunkAction<Promise<undefined>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        if (address.Status === ADDRESS_STATUS.STATUS_DISABLED) {
            const api = getSilentApi(extra.api);
            await api(enableAddressConfig(address.ID));

            await Promise.all([
                dispatch(organizationThunk({ cache: CacheType.None })),
                member
                    ? dispatch(getMemberAddresses({ member, cache: CacheType.None, retry: true }))
                    : dispatch(addressesThunk({ cache: CacheType.None })),
            ]);
        }
    };
};
