import { fromCallback, fromPromise } from 'xstate';

import { askAdminConfig } from '@proton/shared/lib/api/authDevice';
import { getApiError, getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { AuthDeviceInvalidError, type DeviceSecretUser } from '@proton/shared/lib/keys/device';

import type { AuthSession } from '../../../../content/authSession';
import type { SSODataTypes } from '../../../auth/interface';
import {
    changeSSOUserKeysPassword,
    confirmSSODevice,
    pollDeviceApproval,
    prepareSSOSignIn,
    setupSSOUserKeys,
    unlockSSO,
} from '../../../auth/sso';
import type { PrepareSSOResult, SSOSignInResult } from '../../../auth/sso';
import type { AccountFlowInput } from '../../../state-machine/accountFlow';
import { createAccountFlowActors, getUserAndSalts } from '../../../state-machine/accountFlowActors';
import type { SignInActorServices } from '../../../state-machine/signInActors';
import { type SignInAuthState, toLoginFlowContext } from '../../../state-machine/signInAuthState';
import type { ChangeBackupPasswordInput, SSODeviceEvent, SSOInput } from './ssoStateMachine';

/** The key password and device secret to re-encrypt the keys with a new backup password. */
const getKeyPasswordForChange = (ssoData: SSODataTypes, session: AuthSession | undefined) => {
    if (ssoData.type === 'set-password') {
        return { keyPassword: ssoData.keyPassword, deviceSecretData: ssoData.deviceSecretData };
    }
    const keyPassword = session?.data.keyPassword;
    const deviceSecretData = ssoData.deviceData.deviceSecretData;
    if (!keyPassword || !deviceSecretData) {
        throw new Error('Missing SSO setup data');
    }
    return { keyPassword, deviceSecretData };
};

/** The screens after preparing only run with SSO data; checked here, so a missing one fails the flow like a request. */
const getSSOData = ({ ssoData }: SSOInput) => {
    if (!ssoData) {
        throw new Error('Missing SSO data');
    }
    return ssoData;
};

/** The SSO machine's actors, built from the app's services; `useSignInMachine` provides them. */
export const createSSOActors = (services: SignInActorServices) => {
    const { api } = services;
    const contextOf = (auth: SignInAuthState) => toLoginFlowContext(auth, services);

    return {
        ...createAccountFlowActors(services),
        prepareSSO: fromPromise<PrepareSSOResult, AccountFlowInput>(async ({ input }) => {
            const { user, addresses } = input.auth.account;
            if (!user) {
                throw new Error('Missing account data');
            }
            return prepareSSOSignIn(contextOf(input.auth), { user, addresses });
        }),
        waitForDeviceApproval: fromCallback<SSODeviceEvent, AccountFlowInput>(({ input, sendBack }) => {
            const user = input.auth.account.user;
            if (!user) {
                throw new Error('Missing user');
            }
            return pollDeviceApproval({
                api,
                user,
                onApproved: (deviceSecretUser) =>
                    sendBack({ type: 'sso.device.approved', payload: { deviceSecretUser } }),
                onError: (error) => {
                    if (error instanceof AuthDeviceInvalidError) {
                        sendBack({ type: 'sso.device.rejected' });
                    } else if (getIs401Error(error) || getApiError(error).status === HTTP_STATUS_CODE.FORBIDDEN) {
                        // The session is gone (the API layer already tried to refresh it), or no longer allowed
                        sendBack({ type: 'sso.device.failed', error });
                    }
                    // Other errors are transient; polling continues.
                },
            });
        }),
        confirmSSODevice: fromPromise<SSOSignInResult, SSOInput & { deviceSecretUser: DeviceSecretUser }>(
            async ({ input }) =>
                confirmSSODevice(contextOf(input.auth), {
                    deviceSecretUser: input.deviceSecretUser,
                    addresses: input.auth.account.addresses,
                    organizationData: getSSOData(input).organizationData,
                })
        ),
        requestAdminApproval: fromPromise<void, SSOInput>(async ({ input }) => {
            const ssoData = getSSOData(input);
            if (ssoData.type === 'set-password') {
                throw new Error('Invalid SSO data');
            }
            await api(askAdminConfig(ssoData.deviceData.deviceOutput.ID));
        }),
        unlockWithBackupPassword: fromPromise<SSOSignInResult, SSOInput & { password: string }>(async ({ input }) =>
            unlockSSO(contextOf(input.auth), {
                ...getUserAndSalts(input.auth),
                addresses: input.auth.account.addresses,
                ssoData: getSSOData(input),
                clearKeyPassword: input.password,
            })
        ),
        setupSSOKeys: fromPromise<AuthSession, SSOInput & { password: string | null }>(async ({ input }) => {
            const ssoData = getSSOData(input);
            if (ssoData.type !== 'setup') {
                throw new Error('Missing SSO setup data');
            }
            return setupSSOUserKeys(contextOf(input.auth), { ssoData, newPassword: input.password });
        }),
        changeBackupPassword: fromPromise<AuthSession, ChangeBackupPasswordInput>(async ({ input }) => {
            const { keyPassword, deviceSecretData } = getKeyPasswordForChange(getSSOData(input), input.session);
            return changeSSOUserKeysPassword(contextOf(input.auth), {
                user: input.auth.account.user,
                oldKeyPassword: keyPassword,
                newBackupPassword: input.password,
                deviceSecretData,
            });
        }),
    };
};

export type SSOActors = ReturnType<typeof createSSOActors>;
