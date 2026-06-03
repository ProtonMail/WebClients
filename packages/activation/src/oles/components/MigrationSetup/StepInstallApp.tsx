import { type FC, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { IcArrowRotateRight } from '@proton/icons/icons/IcArrowRotateRight';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { GSUITE_MARKETPLACE_URL } from '@proton/shared/lib/api/activation';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { CommonFeatureFlag } from '@proton/unleash/Flags';
import { getStandaloneUnleashClient } from '@proton/unleash/standaloneClient';

import { useConnectionState } from '../../useConnectionState';
import { CircledLogoWithProton } from '../CircledLogoWithProton';
import type { StepComponentProps } from './MigrationSetup';

const StepInstallApp: FC<StepComponentProps> = ({ model, onNext }) => {
    const [hasUserInteracted, setHasUserInteracted] = useState<'add' | 'verify'>();
    const [connection, loading, verify] = useConnectionState(model.tokens);

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

    /** Google Workplace Marketplace URL fetched from Unleash or const fallback */
    const workspaceMarketplaceUrl = useMemo(() => {
        let url = GSUITE_MARKETPLACE_URL;

        try {
            const client = getStandaloneUnleashClient();
            const config = JSON.parse(client?.getVariant(CommonFeatureFlag.OlesM1)?.payload?.value ?? 'false') as
                | { marketplaceUrl?: any }
                | undefined;
            if (
                config?.marketplaceUrl &&
                typeof config.marketplaceUrl === 'string' &&
                config.marketplaceUrl.startsWith('https://')
            ) {
                url = config.marketplaceUrl;
            }
        } catch (err) {}

        return url;
    }, []);

    return (
        <div className="max-w-custom" style={{ '--max-w-custom': '42rem' }}>
            <div className="flex justify-space-between flex-nowrap items-center gap-4 mb-4">
                <h3 className="text-4xl text-bold">{c('BOSS').t`Install migration app`}</h3>
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
                {c('BOSS')
                    .t`To bring your organization's data to ${BRAND_NAME}, install ${BRAND_NAME} Easy Switch from the Google Workspace Marketplace. After installing it, come back here to continue.`}{' '}
                <Href href={getKnowledgeBaseUrl('/easy-switch-for-business')}>{c('Link').t`Learn more`}</Href>
            </p>
            <div className="flex flex-nowrap border border-weak rounded-xxl p-4 items-center mb-8 gap-4">
                <CircledLogoWithProton iconPosition="inside-bottom-right" className="shrink-0" />
                <div className="flex-1 flex *:min-size-auto flex-column md:flex-row gap-2 md:items-center">
                    <div className="md:min-w-custom flex-1" style={{ '--md-min-w-custom': '16rem' }}>
                        <p className="m-0 text-semibold">{c('BOSS').t`${BRAND_NAME} Easy Switch`}</p>
                        <p className="m-0 text-sm color-weak">{c('BOSS')
                            .t`Google Marketplace app to copy data to ${BRAND_NAME}`}</p>
                    </div>
                    <div className="flex flex-wrap xl:flex-nowrap items-center xl:justify-end gap-2 xl:shrink-0">
                        {connection !== 'connected' && (
                            <>
                                <ButtonLike
                                    className="button-outline-weak-text-norm rounded-lg"
                                    as="a"
                                    href={workspaceMarketplaceUrl}
                                    onClick={() => !hasUserInteracted && setHasUserInteracted('add')}
                                    target="_blank"
                                >{c('BOSS').t`Install app`}</ButtonLike>
                                {hasUserInteracted && (
                                    <Button
                                        color="norm"
                                        className="inline-flex items-center rounded-lg"
                                        onClick={handleVerify}
                                        disabled={loading}
                                    >
                                        <IcArrowRotateRight className="shrink-0" />
                                        <span className="ml-2">{c('BOSS').t`Verify installation`}</span>
                                    </Button>
                                )}
                            </>
                        )}
                        {connection === 'connected' && (
                            <div className="flex gap-1 text-semibold color-primary items-center">
                                <IcCheckmarkCircleFilled />
                                <span>{c('BOSS').t`Verified`}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {hasUserInteracted === 'verify' && connection === 'disconnected' && (
                <Banner variant="warning" opaqueVariant largeRadius noIcon className="p-2">
                    {c('BOSS')
                        .t`We were unable to verify the installation, please check that you have installed it in your Google Workspace account and try again.`}
                </Banner>
            )}
        </div>
    );
};

export default StepInstallApp;
