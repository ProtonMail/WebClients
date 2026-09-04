import { type FC, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { IcArrowRotateRight } from '@proton/icons/icons/IcArrowRotateRight';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { useVariant } from '@proton/unleash/useVariant';

import { getOAuthRedirectURL } from '../../../hooks/useOAuthPopup.helpers';
import { openAdminConsentPopup } from '../../adminConsent';
import { useConnectionState } from '../../useConnectionState';
import { CircledLogoWithProton } from '../CircledLogoWithProton';
import type { StepComponentProps } from './MigrationSetup';

type StepClientConfig = {
    marketplaceUrl?: string;
    providerClientIds?: Record<string, string>;
};

const StepInstallApp: FC<StepComponentProps> = ({ model, onNext }) => {
    const [hasUserInteracted, setHasUserInteracted] = useState<'add' | 'verify'>();
    const [connection, loading, verify] = useConnectionState(model.provider, model.tokens);
    const flagVariant = useVariant('OrganizationLevelEasySwitch');
    const { provider } = model;
    const { installApp } = provider;

    const clientConfig: StepClientConfig = (() => {
        try {
            const parsedConfig = JSON.parse(flagVariant?.payload?.value ?? '{}');
            if (parsedConfig !== null && typeof parsedConfig === 'object') {
                return parsedConfig;
            }
        } catch {
            return {};
        }
        return {};
    })();

    /** Lets us close the consent popup and stop polling when the admin leaves this step */
    const consentAbortController = useRef<AbortController>();

    useEffect(() => () => consentAbortController.current?.abort(), []);

    useEffect(() => {
        setHasUserInteracted(undefined);
    }, [model.domainName]);

    const handleVerify = async () => {
        await verify();
        setHasUserInteracted('verify');
    };

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'visible' || connection === 'connected') {
                return;
            }

            void verify();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const providerName = provider.displayName;
    const storeName = installApp.type === 'link' ? installApp.storeName : '';
    const stepTranslations = (() => {
        switch (installApp.type) {
            case 'consent':
                return {
                    title: c('Title').t`Grant access`,
                    description: c('Info').t`Give ${BRAND_NAME} permissions to import your ${providerName} data.`,
                    action: c('Action').t`Grant access`,
                    verificationFailed: c('Warning')
                        .t`We were unable to verify access, please check that you have granted access in your ${providerName} account and try again.`,
                };
            case 'link':
                return {
                    title: c('Title').t`Install migration app`,
                    description: c('Info')
                        .t`To bring your organization's data to ${BRAND_NAME}, install ${BRAND_NAME} Easy Switch from the ${storeName}. After installing it, come back here to continue.`,
                    cardDescription: c('Info').t`${storeName} app to copy data to ${BRAND_NAME}`,
                    action: c('Action').t`Install app`,
                    verificationFailed: c('Warning')
                        .t`We were unable to verify the installation, please check that you have installed it in your ${providerName} account and try again.`,
                };
        }
    })();
    const providerInstallAction = (() => {
        const buttonClassName = 'button-outline-weak-text-norm rounded-lg';

        if (installApp.type === 'link') {
            return (
                <ButtonLike
                    className={buttonClassName}
                    as="a"
                    href={clientConfig.marketplaceUrl || installApp.defaultUrl}
                    onClick={() => !hasUserInteracted && setHasUserInteracted('add')}
                    target="_blank"
                >
                    {stepTranslations.action}
                </ButtonLike>
            );
        }

        if (installApp.type === 'consent') {
            const requestGrant = async () => {
                const clientId = clientConfig.providerClientIds?.[provider.id] ?? '';

                if (!clientId) {
                    return;
                }

                const redirectUri = getOAuthRedirectURL(provider.oauthProvider);
                const consentWindowUrl = new URL(installApp.baseUrl);
                consentWindowUrl.searchParams.set('client_id', clientId);
                consentWindowUrl.searchParams.set('redirect_uri', redirectUri);

                consentAbortController.current?.abort();
                const abortController = new AbortController();
                consentAbortController.current = abortController;

                await openAdminConsentPopup({
                    url: consentWindowUrl.toString(),
                    redirectUri,
                    signal: abortController.signal,
                });

                if (abortController.signal.aborted) {
                    return;
                }

                await handleVerify();
            };

            return (
                <Button className={buttonClassName} onClick={requestGrant} disabled={loading}>
                    {stepTranslations.action}
                </Button>
            );
        }

        return null;
    })();

    return (
        <div className="max-w-custom" style={{ '--max-w-custom': '42rem' }}>
            <div className="flex justify-space-between flex-nowrap items-center gap-4 mb-4">
                <h3 className="text-4xl text-bold">{stepTranslations.title}</h3>
                <div className="flex gap-2 shrink-0 text-semibold">
                    <Button
                        disabled={!onNext}
                        onClick={() => onNext?.()}
                        color="norm"
                        size="medium"
                        className="rounded-lg"
                    >
                        {c('Action').t`Next`}
                    </Button>
                </div>
            </div>
            <p className="color-weak mt-0">
                {stepTranslations.description}{' '}
                <Href href={getKnowledgeBaseUrl('/easy-switch-for-business')}>{c('Link').t`Learn more`}</Href>
            </p>
            <div className="flex flex-nowrap border border-weak rounded-xxl p-4 items-center mb-8 gap-4">
                <CircledLogoWithProton
                    iconSrc={provider.iconSrc}
                    iconPosition="inside-bottom-right"
                    className="shrink-0"
                />
                <div className="flex-1 flex *:min-size-auto flex-column md:flex-row gap-2 md:items-center">
                    <div className="md:min-w-custom flex-1" style={{ '--md-min-w-custom': '16rem' }}>
                        <p className="m-0 text-semibold">{c('Label').t`${BRAND_NAME} Easy Switch`}</p>
                        {stepTranslations.cardDescription && (
                            <p className="m-0 text-sm color-weak">{stepTranslations.cardDescription}</p>
                        )}
                    </div>
                    <div className="flex flex-wrap xl:flex-nowrap items-center xl:justify-end gap-2 xl:shrink-0">
                        {connection !== 'connected' && (
                            <>
                                {providerInstallAction}
                                {hasUserInteracted && (
                                    <Button
                                        color="norm"
                                        className="inline-flex items-center rounded-lg"
                                        onClick={handleVerify}
                                        disabled={loading}
                                    >
                                        <IcArrowRotateRight className="shrink-0" />
                                        <span className="ml-2">{c('Action').t`Verify installation`}</span>
                                    </Button>
                                )}
                            </>
                        )}
                        {connection === 'connected' && (
                            <div className="flex gap-1 text-semibold color-primary items-center">
                                <IcCheckmarkCircleFilled />
                                <span>{c('Info').t`Verified`}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {hasUserInteracted === 'verify' && connection === 'disconnected' && (
                <Banner variant="warning" opaqueVariant largeRadius noIcon className="p-2">
                    {stepTranslations.verificationFailed}
                </Banner>
            )}
        </div>
    );
};

export default StepInstallApp;
