import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import type { AuthActionResponse, AuthCacheResult, AuthSession } from '@proton/components/containers/login/interface';
import { AuthStep } from '@proton/components/containers/login/interface';
import { SSOLoginCapabilites } from '@proton/components/containers/login/interface';
import {
    handleChangeSSOUserKeysPassword,
    handleSSODeviceConfirmed,
    handleSetupSSOUserKeys,
    handleUnlockSSO,
} from '@proton/components/containers/login/ssoLoginHelper';
import { askAdminConfig } from '@proton/shared/lib/api/authDevice';
import { type APP_NAMES, BRAND_NAME } from '@proton/shared/lib/constants';
import { AuthDeviceInvalidError, type DeviceSecretUser } from '@proton/shared/lib/keys/device';

import Text from '../../public/Text';
import type { Render } from '../LoginRender';
import SetBackupPasswordForm from '../SetBackupPasswordForm';
import SetPasswordForm from '../SetPasswordForm';
import SSOAdminDeviceConfirmation1 from './SSOAdminDeviceConfirmation1';
import SSOAdminDeviceConfirmation2 from './SSOAdminDeviceConfirmation2';
import SSOBackupPasswordForm from './SSOBackupPasswordForm';
import SSODeviceAdminGranted from './SSODeviceAdminGranted';
import SSODeviceConfirmation from './SSODeviceConfirmation';
import SSODeviceRejected from './SSODeviceRejected';

interface Props {
    render: Render;
    cache: AuthCacheResult;
    onBack?: () => void;
    onError: (error: any) => void;
    onCancel: () => void;
    onResult: (result: AuthActionResponse) => Promise<void>;
    createFlow: () => () => boolean;
    toApp?: APP_NAMES;
    step: AuthStep;
}

const SSOLogin = ({ toApp, step: authStep, render, cache, onBack, onCancel, onError, onResult, createFlow }: Props) => {
    const [adminConfirmed, setAdminConfirmed] = useState(false);
    const sessionDataRef = useRef<AuthSession | null>(null);

    const handleBackStep = () => {
        onBack?.();
    };

    const ssoData = cache.data.ssoData!;
    if (!ssoData) {
        throw new Error('Missing sso data');
    }

    const handleError = onError;
    const handleCancel = () => {
        if ('organizationData' in ssoData) {
            ssoData.organizationData.organizationLogo?.cleanup();
        }
        onCancel?.();
    };

    const [step, setStep] = useState<SSOLoginCapabilites | 'Rejected' | 'AdminGranted'>(ssoData.intent.step);

    const maybeStepSetter = (step: SSOLoginCapabilites) => {
        if (ssoData.intent.capabilities.has(step)) {
            return () => {
                setStep(step);
            };
        }
    };

    const handleResult = async (result: AuthActionResponse) => {
        if (result.to === AuthStep.DONE && result.session.data.User.Flags['has-temporary-password']) {
            sessionDataRef.current = result.session;
            setStep('AdminGranted');
        } else {
            return onResult(result);
        }
    };

    const handleDeviceConfirmed = async (deviceSecretUser: DeviceSecretUser) => {
        try {
            const validateFlow = createFlow();
            cache.data.user = deviceSecretUser.user;
            const result = await handleSSODeviceConfirmed({
                cache,
                deviceSecretUser,
            });
            if (validateFlow()) {
                return await handleResult(result);
            }
        } catch (e: any) {
            handleError(e);
        }
    };

    const handleDeviceError = (error: any) => {
        handleError(error);
    };

    const handleDeviceConfirmedRef = useRef(handleDeviceConfirmed);
    const handleDeviceErrorRef = useRef(handleDeviceError);

    useEffect(() => {
        handleDeviceConfirmedRef.current = handleDeviceConfirmed;
        handleDeviceErrorRef.current = handleDeviceError;
    });

    useEffect(() => {
        if (!ssoData || (ssoData.type !== 'unlock' && ssoData.type !== 'inactive')) {
            return;
        }

        const unsubscribe = ssoData.poll.addListener(
            (deviceSecretUser) => {
                handleDeviceConfirmedRef.current(deviceSecretUser).catch((error) => {
                    handleDeviceErrorRef.current(error);
                });
            },
            (error: any) => {
                if (error instanceof AuthDeviceInvalidError) {
                    setStep('Rejected');
                }
            }
        );

        return () => {
            unsubscribe();
        };
    }, []);

    const sharedProps = {
        step: authStep,
        toApp,
    };

    return (
        <>
            {step === SSOLoginCapabilites.SETUP_BACKUP_PASSWORD &&
                cache &&
                render({
                    ...sharedProps,
                    title: '',
                    onBack: handleBackStep,
                    content: (
                        <SetBackupPasswordForm
                            userData={cache.data.user}
                            ssoSetupData={ssoData.type === 'setup' ? ssoData : null}
                            onSubmit={async (newPassword) => {
                                try {
                                    if (ssoData.type !== 'setup') {
                                        throw new Error('Missing SSO setup data');
                                    }
                                    const validateFlow = createFlow();
                                    const result = await handleSetupSSOUserKeys({
                                        cache,
                                        newPassword,
                                        deviceData: ssoData.deviceData,
                                    });
                                    if (validateFlow()) {
                                        return await handleResult(result);
                                    }
                                } catch (e: any) {
                                    handleError(e);
                                    handleCancel();
                                }
                            }}
                        />
                    ),
                })}
            {step === SSOLoginCapabilites.OTHER_DEVICES &&
                cache &&
                render({
                    ...sharedProps,
                    title: c('sso').t`Approve the sign-in from another device`,
                    onBack: handleBackStep,
                    content: (
                        <SSODeviceConfirmation
                            ssoData={ssoData}
                            onAskAdminHelp={maybeStepSetter(SSOLoginCapabilites.ASK_ADMIN)}
                            onUseBackupPassword={maybeStepSetter(SSOLoginCapabilites.ENTER_BACKUP_PASSWORD)}
                        />
                    ),
                })}
            {step === SSOLoginCapabilites.ASK_ADMIN &&
                !adminConfirmed &&
                cache &&
                render({
                    ...sharedProps,
                    title: c('sso').t`Ask your administrator for access?`,
                    onBack: () => {
                        const back = maybeStepSetter(SSOLoginCapabilites.OTHER_DEVICES);
                        if (back) {
                            return back();
                        }
                        return handleBackStep();
                    },
                    content: (
                        <SSOAdminDeviceConfirmation1
                            ssoData={ssoData}
                            onConfirmAskAdmin={async () => {
                                if (ssoData.type === 'set-password') {
                                    throw new Error('Invalid sso data');
                                }
                                try {
                                    await cache.api(askAdminConfig(ssoData.deviceData.deviceOutput.ID));
                                    setAdminConfirmed(true);
                                } catch (e) {
                                    handleError(e);
                                }
                            }}
                            onUseBackupPassword={maybeStepSetter(SSOLoginCapabilites.ENTER_BACKUP_PASSWORD)}
                        />
                    ),
                })}
            {step === SSOLoginCapabilites.ASK_ADMIN && adminConfirmed && cache && (
                <>
                    {render({
                        ...sharedProps,
                        title: c('sso').t`Share the confirmation code with your administrator`,
                        onBack: () => {
                            const back = maybeStepSetter(SSOLoginCapabilites.OTHER_DEVICES);
                            if (back) {
                                return back();
                            }
                            return handleBackStep();
                        },
                        content: (
                            <SSOAdminDeviceConfirmation2
                                ssoData={ssoData}
                                onUseBackupPassword={maybeStepSetter(SSOLoginCapabilites.ENTER_BACKUP_PASSWORD)}
                            />
                        ),
                    })}
                </>
            )}
            {step === SSOLoginCapabilites.ENTER_BACKUP_PASSWORD &&
                cache &&
                render({
                    ...sharedProps,
                    title: c('sso').t`Enter your backup password`,
                    onBack: () => {
                        const back = maybeStepSetter(SSOLoginCapabilites.OTHER_DEVICES);
                        if (back) {
                            return back();
                        }
                        return handleBackStep();
                    },
                    content: (() => {
                        return (
                            <>
                                <Text>
                                    {c('sso')
                                        .t`To make sure it's really you trying to sign-in, please enter your backup password.`}
                                </Text>
                                <SSOBackupPasswordForm
                                    onAskAdminHelp={maybeStepSetter(SSOLoginCapabilites.ASK_ADMIN)}
                                    onSubmit={async (clearKeyPassword) => {
                                        try {
                                            const validateFlow = createFlow();
                                            const result = await handleUnlockSSO({
                                                cache,
                                                clearKeyPassword,
                                            });
                                            if (validateFlow()) {
                                                return await handleResult(result);
                                            }
                                        } catch (e: any) {
                                            handleError(e);
                                            // Cancel on any error except retry
                                            if (e.name !== 'PasswordError') {
                                                handleCancel();
                                            }
                                        }
                                    }}
                                />
                            </>
                        );
                    })(),
                })}
            {step === 'Rejected' &&
                render({
                    ...sharedProps,
                    title: '',
                    onBack: handleBackStep,
                    content: <SSODeviceRejected onBack={handleBackStep} />,
                })}
            {step === 'AdminGranted' &&
                render({
                    ...sharedProps,
                    title: '',
                    onBack: handleBackStep,
                    content: (
                        <SSODeviceAdminGranted
                            onContinue={() => {
                                setStep(SSOLoginCapabilites.NEW_BACKUP_PASSWORD);
                            }}
                        />
                    ),
                })}
            {step === SSOLoginCapabilites.NEW_BACKUP_PASSWORD &&
                cache &&
                render({
                    ...sharedProps,
                    title: c('sso').t`Set your backup password`,
                    onBack: handleBackStep,
                    content: (
                        <>
                            <Text margin="small">
                                {c('sso')
                                    .t`If you get locked out of your ${BRAND_NAME} Account, your backup password will allow you to sign in and recover your data.`}
                            </Text>
                            <Text>
                                {c('sso')
                                    .t`It’s the only way to fully restore your account, so make sure to keep it somewhere safe.`}
                            </Text>
                            <SetPasswordForm
                                onSubmit={async (newPassword) => {
                                    try {
                                        const { keyPassword, deviceSecretData } = (() => {
                                            if (ssoData?.type === 'set-password') {
                                                return {
                                                    keyPassword: ssoData.keyPassword,
                                                    deviceSecretData: ssoData.deviceSecretData,
                                                };
                                            }
                                            const sessionData = sessionDataRef.current;
                                            return {
                                                keyPassword: sessionData?.data.keyPassword,
                                                deviceSecretData: ssoData.deviceData.deviceSecretData,
                                            };
                                        })();
                                        if (!keyPassword || !deviceSecretData) {
                                            throw new Error('Missing SSO setup data');
                                        }
                                        const validateFlow = createFlow();
                                        const result = await handleChangeSSOUserKeysPassword({
                                            oldKeyPassword: keyPassword,
                                            newBackupPassword: newPassword,
                                            deviceSecretData,
                                            cache,
                                        });
                                        if (validateFlow()) {
                                            return await onResult(result);
                                        }
                                    } catch (e: any) {
                                        handleError(e);
                                        handleCancel();
                                    }
                                }}
                                type="backup"
                            />
                        </>
                    ),
                })}
        </>
    );
};

export default SSOLogin;
