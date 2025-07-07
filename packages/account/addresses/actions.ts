import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { createKTVerifier, createPreAuthKTVerifier } from '@proton/key-transparency';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import {
    createAddress as createAddressConfig,
    orderAddress,
    setupAddress as setupAddressConfig,
} from '@proton/shared/lib/api/addresses';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getAllMemberAddresses } from '@proton/shared/lib/api/members';
import mutatePassword from '@proton/shared/lib/authentication/mutate';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { ADDRESS_TYPE, DEFAULT_KEYGEN_TYPE, KEYGEN_CONFIGS, MEMBER_PRIVATE } from '@proton/shared/lib/constants';
import type { Address, Member } from '@proton/shared/lib/interfaces';
import {
    type AddressGenerationPayload,
    getCanGenerateMemberKeys,
    getShouldSetupMemberKeys,
    handleCreateAddressAndKey,
    handleSetupAddressAndKey,
    handleSetupAddressKeys,
    missingKeysMemberProcess,
    missingKeysSelfProcess,
    setupMemberKeys,
} from '@proton/shared/lib/keys';
import { getOrganizationKeyInfo, validateOrganizationKey } from '@proton/shared/lib/organization/helper';
import { isFree } from '@proton/shared/lib/user/helpers';
import noop from '@proton/utils/noop';

import type { KtState } from '../kt';
import { getKTActivation } from '../kt/actions';
import { getMemberAddresses } from '../members';
import { organizationThunk } from '../organization';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import { type ProtonDomainsState, protonDomainsThunk } from '../protonDomains';
import { type UserState, userThunk } from '../user';
import { type UserKeysState, userKeysThunk } from '../userKeys';
import { type UserSettingsState, userSettingsThunk } from '../userSettings';
import { type AddressesState, addressesThunk } from './index';

type RequiredState = KtState &
    UserState &
    OrganizationKeyState &
    AddressesState &
    UserKeysState &
    ProtonDomainsState &
    UserSettingsState;

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
        const shouldGenerateKeys =
            !selectedMember || Boolean(selectedMember.Self) || getCanGenerateMemberKeys(selectedMember);

        const shouldGenerateSelfKeys =
            Boolean(selectedMember.Self) && selectedMember.Private === MEMBER_PRIVATE.UNREADABLE;

        const shouldGenerateMemberKeys = !shouldGenerateSelfKeys;
        const shouldSetupMemberKeys = shouldGenerateKeys && getShouldSetupMemberKeys(selectedMember);

        const organizationKey = await dispatch(organizationKeyThunk());
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

        if (shouldGenerateKeys && shouldGenerateMemberKeys && !organizationKey?.privateKey) {
            throw new Error(c('Error').t`Organization key is not decrypted`);
        }

        const { Address } = await api<{ Address: Address }>(
            createAddressConfig({
                MemberID: selectedMember.ID,
                Local: emailAddressParts.Local,
                Domain: emailAddressParts.Domain,
                DisplayName: displayName,
                Signature: signature,
            })
        );

        if (shouldGenerateKeys) {
            const userKeys = await dispatch(userKeysThunk());
            const userSettings = await dispatch(userSettingsThunk());
            const keyGenConfig = KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE];

            const { keyTransparencyVerify, keyTransparencyCommit } = createKTVerifier({
                ktActivation: dispatch(getKTActivation()),
                api,
                config: extra.config,
            });

            if (shouldGenerateSelfKeys) {
                await missingKeysSelfProcess({
                    api,
                    userKeys,
                    addresses,
                    addressesToGenerate: [Address],
                    password: extra.authentication.getPassword(),
                    keyGenConfigForV4Keys: keyGenConfig,
                    supportV6Keys: !!userSettings.Flags.SupportPgpV6Keys,
                    keyTransparencyVerify,
                });
            } else {
                if (!organizationKey?.privateKey) {
                    throw new Error('Missing org key');
                }
                const memberAddresses = await getAllMemberAddresses(api, selectedMember.ID);
                if (shouldSetupMemberKeys && memberPassword) {
                    await setupMemberKeys({
                        ownerAddresses: addresses,
                        keyGenConfig,
                        organizationKey: organizationKey.privateKey,
                        member: selectedMember,
                        memberAddresses,
                        password: memberPassword,
                        api,
                        keyTransparencyVerify,
                    });
                } else {
                    await missingKeysMemberProcess({
                        api,
                        keyGenConfig,
                        ownerAddresses: addresses,
                        memberAddressesToGenerate: [Address],
                        member: selectedMember,
                        memberAddresses,
                        onUpdate: noop,
                        organizationKey: organizationKey.privateKey,
                        keyTransparencyVerify,
                    });
                }
            }

            await keyTransparencyCommit(user, userKeys);
        }

        if (setDefault) {
            // Default address is the first one in the list so we need to reorder the addresses
            await api(orderAddress([Address.ID, ...addresses.map(({ ID }) => ID)]));
        }

        const result = await dispatch(addressesThunk({ cache: CacheType.None }));

        // TODO: Remove dependency on call
        extra.eventManager.call();

        return result.find(({ ID }) => ID === Address.ID) || Address;
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
        const userSettings = await dispatch(userSettingsThunk());
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

        const { Address } = await api<{ Address: Address }>(
            setupAddressConfig({
                Domain: domain,
                DisplayName: displayName || DisplayName || '', // DisplayName can be null
                Signature: signature ?? nextAddressSignature ?? defaultAddressSignature ?? '', // Signature can be null
            })
        );
        const userKeys = await dispatch(userKeysThunk());
        const { keyTransparencyVerify, keyTransparencyCommit } = createKTVerifier({
            ktActivation: dispatch(getKTActivation()),
            api,
            config: extra.config,
        });
        await missingKeysSelfProcess({
            api,
            userKeys,
            addresses,
            addressesToGenerate: [Address],
            password: extra.authentication.getPassword(),
            keyGenConfigForV4Keys: KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE],
            keyTransparencyVerify,
            supportV6Keys: !!userSettings.Flags.SupportPgpV6Keys,
        });
        await keyTransparencyCommit(await dispatch(userThunk()), userKeys);

        if (setDefault) {
            // Default address is the first one in the list so we need to reorder the addresses
            await api(orderAddress([Address.ID, ...addresses.map(({ ID }) => ID)]));
        }

        const result = await dispatch(addressesThunk({ cache: CacheType.None }));

        // TODO: Remove dependency on call
        extra.eventManager.call();

        return result.find(({ ID }) => ID === Address.ID) || Address;
    };
};

export const createMissingKeys = ({
    member,
    password: memberPassword,
    addressesToGenerate,
    onUpdate,
}: {
    member: Member | undefined;
    password?: string;
    addressesToGenerate: Address[];
    onUpdate: Parameters<typeof missingKeysMemberProcess>[0]['onUpdate'];
}): ThunkAction<Promise<string>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const shouldSetupMemberKeys = getShouldSetupMemberKeys(member);

        const api = getSilentApi(extra.api);

        const { keyTransparencyVerify, keyTransparencyCommit } = createKTVerifier({
            ktActivation: dispatch(getKTActivation()),
            api,
            config: extra.config,
        });

        const keyGenConfig = KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE];

        const processMember = async (member: Member) => {
            const [user, organization, organizationKey, memberAddresses, addresses, userKeys] = await Promise.all([
                dispatch(userThunk()),
                dispatch(organizationThunk()),
                dispatch(organizationKeyThunk()),
                dispatch(getMemberAddresses({ member, retry: true })),
                dispatch(addressesThunk()),
                dispatch(userKeysThunk()),
            ]);

            const error = validateOrganizationKey(getOrganizationKeyInfo(organization, organizationKey, addresses));
            if (error) {
                throw new Error(error);
            }
            if (!organizationKey?.privateKey) {
                throw new Error('Missing key');
            }

            if (shouldSetupMemberKeys && memberPassword) {
                await setupMemberKeys({
                    ownerAddresses: addresses,
                    keyGenConfig,
                    organizationKey: organizationKey.privateKey,
                    member,
                    memberAddresses,
                    password: memberPassword,
                    api,
                    keyTransparencyVerify,
                });

                await keyTransparencyCommit(user, userKeys);
                await extra.eventManager.call();

                addressesToGenerate.forEach((address) => onUpdate(address.ID, { status: 'ok' }));
            } else {
                const result = await missingKeysMemberProcess({
                    api,
                    keyGenConfig,
                    ownerAddresses: addresses,
                    memberAddressesToGenerate: addressesToGenerate,
                    member,
                    memberAddresses,
                    onUpdate,
                    organizationKey: organizationKey.privateKey,
                    keyTransparencyVerify,
                });

                await keyTransparencyCommit(user, userKeys);
                await extra.eventManager.call();

                const errorResult = result.find((result) => result.type === 'error');
                if (errorResult) {
                    throw errorResult.e;
                }
            }

            return c('Info').t`User activated`;
        };

        const processSelf = async () => {
            const [user, userKeys, addresses, userSettings] = await Promise.all([
                dispatch(userThunk()),
                dispatch(userKeysThunk()),
                dispatch(addressesThunk()),
                dispatch(userSettingsThunk()),
            ]);
            const result = await missingKeysSelfProcess({
                api,
                userKeys,
                addresses,
                addressesToGenerate,
                password: extra.authentication.getPassword(),
                keyGenConfigForV4Keys: keyGenConfig,
                supportV6Keys: !!userSettings.Flags.SupportPgpV6Keys,
                onUpdate,
                keyTransparencyVerify,
            });

            await keyTransparencyCommit(user, userKeys);
            await extra.eventManager.call();

            const errorResult = result.find((result) => result.type === 'error');
            if (errorResult) {
                throw errorResult.e;
            }
            return c('Info').t`Keys created`;
        };

        return !member || (member.Self && member.Private === MEMBER_PRIVATE.UNREADABLE)
            ? processSelf()
            : processMember(member);
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
        await mutatePassword({
            api,
            authentication,
            keyPassword: passphrase,
            clearKeyPassword: password,
            User: user,
        });
        await preAuthKTVerifier.preAuthKTCommit(user.ID, api);
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
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
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
    };
};

export const createBYOEAddress = ({
    emailAddressParts,
    displayName,
}: {
    emailAddressParts: { Local: string; Domain: string };
    displayName?: string;
}): ThunkAction<Promise<Address | undefined>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const user = await dispatch(userThunk());

        if (isFree(user)) {
            return;
        }

        const addresses = await dispatch(addressesThunk());
        const api = getSilentApi(extra.api);

        // Use regular api to display an error if necessary
        const { Address } = await extra.api<{ Address: Address }>(
            createAddressConfig({
                Local: emailAddressParts.Local,
                Domain: emailAddressParts.Domain,
                DisplayName: displayName,
            })
        );

        const userSettings = await dispatch(userSettingsThunk());
        const userKeys = await dispatch(userKeysThunk());
        const { keyTransparencyVerify, keyTransparencyCommit } = createKTVerifier({
            ktActivation: dispatch(getKTActivation()),
            api,
            config: extra.config,
        });
        await missingKeysSelfProcess({
            api,
            userKeys,
            addresses,
            addressesToGenerate: [Address],
            password: extra.authentication.getPassword(),
            keyGenConfigForV4Keys: KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE],
            supportV6Keys: !!userSettings.Flags.SupportPgpV6Keys,
            keyTransparencyVerify,
        });
        await keyTransparencyCommit(await dispatch(userThunk()), userKeys);

        const result = await dispatch(addressesThunk({ cache: CacheType.None }));

        // TODO: Remove dependency on call
        extra.eventManager.call();

        return result.find(({ ID }) => ID === Address.ID) || Address;
    };
};
