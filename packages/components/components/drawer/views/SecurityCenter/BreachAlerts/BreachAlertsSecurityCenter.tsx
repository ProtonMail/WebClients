import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import { GenericError } from '@proton/components';
import { Icon, Loader, useModalStateObject, useUpsellConfig } from '@proton/components/components';
import { Toggle } from '@proton/components/components';
import BreachModal from '@proton/components/containers/credentialLeak/BreachModal';
import { getEnabledString, getStyle } from '@proton/components/containers/credentialLeak/helpers';
import { BREACH_API_ERROR, toCamelCase } from '@proton/components/containers/credentialLeak/helpers';
import { BREACH_STATE } from '@proton/components/containers/credentialLeak/models';
import { useBreaches } from '@proton/components/containers/credentialLeak/useBreaches';
import { useApi, useErrorHandler, useNotifications, useUser, useUserSettings } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import { getBreaches } from '@proton/shared/lib/api/breaches';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { enableBreachAlert } from '@proton/shared/lib/api/settings';
import {
    APP_UPSELL_REF_PATH,
    DARK_WEB_MONITORING_NAME,
    MAIL_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import ProtonSentinelPlusLogo from '@proton/styles/assets/img/illustrations/sentinel-shield-bolt-breach-alert.svg';
import noop from '@proton/utils/noop';

import { DrawerAppSection } from '../../shared';
import BreachCard from './BreachCard';
import FreeUserBreachToggle from './FreeUserBreachToggle';

const BREACHES_LIMIT = 3;

const BreachAlertsSecurityCenter = () => {
    const handleError = useErrorHandler();
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const { isPaid } = user;
    const { breaches: allBreaches, actions } = useBreaches();

    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [toggleLoading, withToggleLoading] = useLoading();
    const [error, setError] = useState<{ message: string } | null>(null);
    const api = useApi();
    const [selectedBreachID, setSelectedBreachID] = useState<string | null>(null);
    const [hasAlertsEnabled, setHasAlertsEnabled] = useState<boolean>(userSettings.BreachAlerts.Value === 1);
    const breachAlertModal = useModalStateObject();

    const breaches = allBreaches.filter((b) => b.resolvedState !== BREACH_STATE.RESOLVED).slice(0, BREACHES_LIMIT);
    const count = breaches.length;

    useEffect(() => {
        const fetchLeakData = async () => {
            try {
                const { Breaches } = await api(getBreaches(true));
                const fetchedData = toCamelCase(Breaches);
                actions.load(fetchedData);
            } catch (e) {
                const { message, code } = getApiError(e);
                if (code === BREACH_API_ERROR.GENERIC) {
                    setError({ message: message });
                    return;
                } else {
                    handleError(e);
                }
            }
        };
        withLoading(fetchLeakData()).catch(noop);
    }, [hasAlertsEnabled]);

    const enableBreachAlerts = async () => {
        try {
            await withToggleLoading(api(enableBreachAlert()));
            createNotification({ text: getEnabledString(DARK_WEB_MONITORING_NAME) });
            setHasAlertsEnabled(true);
        } catch (e) {
            handleError(e);
        }
    };
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.BREACH_ALERTS,
    });
    const { onUpgrade } = useUpsellConfig(upsellRef, undefined, () => {
        enableBreachAlerts();
        return;
    });

    const handleToggleOpenSubscriptionModal = () => {
        onUpgrade?.();
    };

    const openBreachModal = () => {
        breachAlertModal.openModal(true);
    };

    const getSelectedBreachData = () => {
        if (!breaches || !selectedBreachID) {
            return undefined;
        }
        return breaches.find((breach) => breach.id === selectedBreachID);
    };

    // translator: this learn more link is at the end of several sentences (all the same structure), like: Get notified if your password or other data was leaked from a third-party service. <Learn more>
    const learnMoreLink = (
        <Href href={getKnowledgeBaseUrl('/dark-web-monitoring')} className="inline-block">{c('Link')
            .t`Learn more`}</Href>
    );

    return (
        <>
            <div className="w-full">
                {(() => {
                    if (loading) {
                        return (
                            <div className="w-full flex flex-column justify-center mt-4">
                                <Loader size="medium" className="color-primary m-auto" />
                            </div>
                        );
                    }
                    if (error) {
                        return (
                            <GenericError className="text-center">{c('Info')
                                .t`Please try again in a few moments`}</GenericError>
                        );
                    }

                    if (!isPaid) {
                        return (
                            <FreeUserBreachToggle
                                onToggleBreaches={handleToggleOpenSubscriptionModal}
                                hasBreach={count ? count > 0 : false}
                            />
                        );
                    }

                    if (!hasAlertsEnabled) {
                        return (
                            <DrawerAppSection>
                                <div className="flex flex-nowrap items-center gap-2 mt-2">
                                    <div className="shrink-0 flex">
                                        <img src={ProtonSentinelPlusLogo} alt="" width={22} />
                                    </div>
                                    <h3 className="flex-1 text-rg">
                                        <label htmlFor="breaches-toggle">{DARK_WEB_MONITORING_NAME}</label>
                                    </h3>
                                    <Toggle
                                        id="breaches-toggle"
                                        loading={toggleLoading}
                                        checked={false}
                                        onChange={enableBreachAlerts}
                                        className="shrink-0"
                                    />
                                </div>
                                <p className="mt-1 mb-2 text-sm color-weak">
                                    {
                                        // translator: full sentence is: Get notified if your password or other data was leaked from a third-party service. <Learn more>
                                        c('Security Center - Info')
                                            .jt`Get notified if your password or other data was leaked from a third-party service. ${learnMoreLink}`
                                    }
                                </p>
                            </DrawerAppSection>
                        );
                    }

                    return (
                        <>
                            <h3 className="text-rg text-bold mt-1 mb-2">{DARK_WEB_MONITORING_NAME}</h3>
                            {count === 0 ? (
                                <div className="drawerAppSection shadow-norm px-4 py-3 rounded-lg w-full flex flex-nowrap gap-2">
                                    <Icon
                                        name="checkmark-circle-filled"
                                        className="color-success shrink-0 mt-0.5"
                                        alt=""
                                    />
                                    <p className="m-0 color-hint text-left flex-1">{c('Title')
                                        .t`No breaches detected`}</p>
                                </div>
                            ) : (
                                <div className="flex flex-column flex-nowrap gap-2 w-full">
                                    {breaches.map((breach) => {
                                        return (
                                            <BreachCard
                                                name={breach.name}
                                                email={breach.email}
                                                password={breach.passwordLastChars}
                                                key={breach.id}
                                                onClick={() => {
                                                    setSelectedBreachID(breach.id);
                                                    openBreachModal();
                                                }}
                                                style={getStyle(breach.severity)}
                                                severity={breach.severity}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    );
                })()}
            </div>
            {breachAlertModal.render && (
                <BreachModal
                    modalProps={breachAlertModal.modalProps}
                    breachData={getSelectedBreachData()}
                    securityCenter={true}
                    onResolve={() => {
                        const data = getSelectedBreachData();
                        if (data) {
                            actions.resolve(data);
                        }
                    }}
                />
            )}
        </>
    );
};

export default BreachAlertsSecurityCenter;
