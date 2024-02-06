import { useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms/Button';
import { Toggle, useModalStateObject, useSettingsLink } from '@proton/components/components';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { useApi, useEventManager, useNotifications, useUserSettings } from '@proton/components/hooks';
import { disableHighSecurity, enableHighSecurity } from '@proton/shared/lib/api/settings';
import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';
import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { isProtonSentinelEligible } from '@proton/shared/lib/helpers/userSettings';
import { SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/interfaces';
import ProtonSentinelLogo from '@proton/styles/assets/img/illustrations/proton-sentinel-shield.svg';

import { DrawerAppSection } from '../../shared';
import ProtonSentinelUpsellModal from './modal/ProtonSentinelUpsellModal';

const learnMoreLink = (
    <ButtonLike
        as="a"
        shape="underline"
        color="norm"
        key="learn-more"
        href={getKnowledgeBaseUrl('/proton-sentinel')}
        target="_blank"
    >{c('Link').t`Learn more`}</ButtonLike>
);

const ProtonSentinel = () => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const upsellModal = useModalStateObject();
    const [loadingSentinel, setLoadingSentinel] = useState(false);
    const goToSettings = useSettingsLink();
    const isSentinelEligible = isProtonSentinelEligible(userSettings);
    const isProtonSentinelEnabled = userSettings.HighSecurity.Value === SETTINGS_PROTON_SENTINEL_STATE.ENABLED;

    if (loadingUserSettings) {
        return null;
    }

    const handleToggleSentinel = async (newHighSecurityState: Boolean) => {
        if (!isSentinelEligible) {
            upsellModal.openModal(true);
            return;
        }

        try {
            setLoadingSentinel(true);
            if (newHighSecurityState) {
                await api(enableHighSecurity());
                createNotification({ text: c('Notification').t`${PROTON_SENTINEL_NAME} has been enabled` });
            } else {
                await api(disableHighSecurity());
                createNotification({ text: c('Notification').t`${PROTON_SENTINEL_NAME} has been disabled` });
            }
            await call();
        } catch (e) {
            console.error(e);
            traceInitiativeError('drawer-security-center', e);
        } finally {
            setLoadingSentinel(false);
        }
    };

    return (
        <>
            <DrawerAppSection>
                <div className="flex flex-nowrap items-center gap-2 mt-2">
                    <div className="shrink-0 flex">
                        <img src={ProtonSentinelLogo} alt="" />
                    </div>
                    <h3 className="flex-1 text-rg">
                        <label htmlFor="proton-sentinel-toggle">{PROTON_SENTINEL_NAME}</label>
                    </h3>
                    <Toggle
                        id="proton-sentinel-toggle"
                        loading={loadingSentinel}
                        checked={isProtonSentinelEnabled}
                        onChange={({ target }) => {
                            void handleToggleSentinel(target.checked);
                        }}
                        className="shrink-0"
                    />
                </div>
                {isProtonSentinelEnabled ? (
                    <>
                        <p className="mt-1 mb-2 text-sm color-weak">
                            {
                                // translator: **active** will be put in bold, please keep syntax to make it work properly
                                getBoldFormattedText(
                                    c('Security Center - Info').t`Sentinel is **active** and safeguarding your account.`
                                )
                            }
                        </p>
                        <Button
                            color="weak"
                            fullWidth
                            onClick={() => {
                                goToSettings(`/security#logs`, undefined, false);
                            }}
                            className="mb-2"
                        >
                            {c('Security Center - Action').t`View logs`}
                        </Button>
                    </>
                ) : (
                    <p className="mt-1 mb-2 text-sm color-weak">
                        {c('Security Center - Info')
                            .jt`Our cutting-edge AI-driven security solution designed for users seeking heightened protection for their accounts. ${learnMoreLink}`}
                    </p>
                )}
            </DrawerAppSection>
            {upsellModal.render && <ProtonSentinelUpsellModal modalProps={upsellModal.modalProps} />}
        </>
    );
};

export default ProtonSentinel;
