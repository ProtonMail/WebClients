import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Href } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import Loader from '@proton/components/components/loader/Loader';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import DWMUpsellModal from '@proton/components/components/upsell/modal/types/DWMUpsellModal';
import BreachModal from '@proton/components/containers/credentialLeak/BreachModal';
import {
    BREACH_API_ERROR,
    getEnabledString,
    getStyle,
    isResolved,
    isUnread,
    toCamelCase,
} from '@proton/components/containers/credentialLeak/helpers';
import type { FetchedBreaches, SampleBreach } from '@proton/components/containers/credentialLeak/models';
import { BREACH_STATE } from '@proton/components/containers/credentialLeak/models';
import { useBreaches } from '@proton/components/containers/credentialLeak/useBreaches';
import GenericError from '@proton/components/containers/error/GenericError';
import useApi from '@proton/components/hooks/useApi';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store';
import { getBreaches, updateBreachState } from '@proton/shared/lib/api/breaches';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { enableBreachAlert } from '@proton/shared/lib/api/settings';
import { DARK_WEB_MONITORING_NAME, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import ProtonSentinelPlusLogo from '@proton/styles/assets/img/illustrations/sentinel-shield-bolt-breach-alert.svg';
import { useFlag } from '@proton/unleash';
import noop from '@proton/utils/noop';

import DrawerAppSection from '../../shared/DrawerAppSection';
import BreachCard from './BreachCard';
import FreeUserBreachToggle from './FreeUserBreachToggle';
import {
    decreaseUnreadBreachCount,
    selectShouldBreachAlertsRefresh,
    selectUnreadBreachesCount,
    setUnreadBreachesCount,
} from './slice/breachNotificationsSlice';

const BreachAlertsSecurityCenter = () => {
    const handleError = useErrorHandler();
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const { isPaid } = user;
    const { breaches: allBreaches, actions } = useBreaches();
    const dispatch = baseUseDispatch();
    const canDisplayBreachNotifications = useFlag('BreachAlertsNotificationsCommon');

    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [toggleLoading, withToggleLoading] = useLoading();
    const [error, setError] = useState<{ message: string } | null>(null);
    const api = useApi();
    const [selectedBreachID, setSelectedBreachID] = useState<string | null>(null);
    const [hasAlertsEnabled, setHasAlertsEnabled] = useState<boolean>(userSettings.BreachAlerts.Value === 1);
    const [sample, setSample] = useState<SampleBreach | null>(null);
    // upsellCount is the Count returned from reponse that represents the number of breaches a free user has
    const [upsellCount, setUpsellCount] = useState<number | null>(null);
    const breachAlertModal = useModalStateObject();
    const dwmUpsellModal = useModalStateObject();

    const shouldRefreshFlag = baseUseSelector(selectShouldBreachAlertsRefresh);
    const unreadBreachesCount = baseUseSelector(selectUnreadBreachesCount);

    const breaches = [...allBreaches]
        .filter((b) => !isResolved(b.resolvedState))
        .sort((a, b) => {
            if (a.resolvedState !== b.resolvedState) {
                return isUnread(a.resolvedState) ? -1 : 1;
            } else {
                return 0;
            }
        });

    const count = breaches.length;

    const fetchLeakData = async () => {
        try {
            const { Breaches, Samples, IsEligible, Count } = await api(getBreaches(true));

            if (IsEligible) {
                const fetchedData = toCamelCase(Breaches);
                actions.load(fetchedData);

                if (canDisplayBreachNotifications && hasAlertsEnabled) {
                    const unreadCount = fetchedData.filter((breach: FetchedBreaches) =>
                        isUnread(breach.resolvedState)
                    ).length;
                    if (unreadCount !== unreadBreachesCount) {
                        dispatch(setUnreadBreachesCount(unreadCount));
                    }
                }
            } else {
                const fetchedSample = toCamelCase(Samples);
                setSample(fetchedSample[0]);
                setUpsellCount(Count);
            }
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

    useEffect(() => {
        withLoading(fetchLeakData()).catch(noop);
    }, [hasAlertsEnabled, shouldRefreshFlag, canDisplayBreachNotifications]);

    const enableBreachAlerts = async () => {
        try {
            await withToggleLoading(api(enableBreachAlert()));
            createNotification({ text: getEnabledString(DARK_WEB_MONITORING_NAME) });
            setHasAlertsEnabled(true);
        } catch (e) {
            handleError(e);
        }
    };

    const markAsOpened = async (breach: FetchedBreaches) => {
        try {
            await api(
                updateBreachState({
                    ID: breach.id,
                    State: BREACH_STATE.READ,
                })
            );
            actions.open(breach);
        } catch (e) {
            handleError(e);
        }
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
                                onToggleBreaches={() => dwmUpsellModal.openModal(true)}
                                hasBreach={upsellCount ? upsellCount > 0 : false}
                                sample={sample}
                                count={upsellCount}
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
                            <h3 className="text-rg text-bold mt-1 mb-2">
                                {DARK_WEB_MONITORING_NAME}
                                {canDisplayBreachNotifications && (
                                    <>{unreadBreachesCount ? ` (${unreadBreachesCount})` : ''}</>
                                )}
                            </h3>
                            {count === 0 ? (
                                <div className="drawerAppSection shadow-norm px-4 py-3 rounded-lg w-full flex flex-nowrap gap-2">
                                    <Icon name="checkmark-circle-filled" className="color-success shrink-0" alt="" />
                                    <p className="m-0 color-weak text-left flex-1 text-sm">{c('Title')
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
                                                    if (isUnread(breach.resolvedState)) {
                                                        markAsOpened(breach);
                                                        dispatch(decreaseUnreadBreachCount());
                                                    }
                                                    setSelectedBreachID(breach.id);
                                                    openBreachModal();
                                                }}
                                                style={getStyle(breach.severity)}
                                                severity={breach.severity}
                                                unread={isUnread(breach.resolvedState)}
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
            {dwmUpsellModal.render && (
                <DWMUpsellModal
                    modalProps={dwmUpsellModal.modalProps}
                    upsellComponent={UPSELL_COMPONENT.TOGGLE}
                    onUpgrade={() => enableBreachAlerts()}
                />
            )}
        </>
    );
};

export default BreachAlertsSecurityCenter;
