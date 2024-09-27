import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import {
    GenericError,
    SUBSCRIPTION_STEPS,
    useApi,
    useErrorHandler,
    useSubscriptionModal,
    useUser,
    useUserSettings,
} from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import Loader from '@proton/components/components/loader/Loader';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { useNotifications } from '@proton/components/hooks';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useLoading } from '@proton/hooks';
import { getBreaches, updateBreachEmailNotificationsState, updateBreachState } from '@proton/shared/lib/api/breaches';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { disableBreachAlert, enableBreachAlert } from '@proton/shared/lib/api/settings';
import {
    APP_UPSELL_REF_PATH,
    BRAND_NAME,
    DARK_WEB_MONITORING_NAME,
    MAIL_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import {
    DARK_WEB_MONITORING_ELIGIBILITY_STATE,
    DARK_WEB_MONITORING_EMAILS_STATE,
    DARK_WEB_MONITORING_STATE,
} from '@proton/shared/lib/interfaces';
import freeUserBreachImg from '@proton/styles/assets/img/breach-alert/img-breaches-found.svg';
import freeUserNoBreachImg from '@proton/styles/assets/img/breach-alert/img-no-breaches-found-inactive.svg';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import BreachEmailToggle from './BreachEmailToggle';
import BreachInformationCard from './BreachInformationCard';
import BreachModal from './BreachModal';
import BreachMonitoringToggle from './BreachMonitoringToggle';
import BreachesList from './BreachesList';
import EmptyBreachListCard from './EmptyBreachListCard';
import NoBreachesView from './NoBreachesView';
import { BREACH_API_ERROR, getEnableString, getUpsellText, toCamelCase } from './helpers';
import type { ListType, SampleBreach } from './models';
import { BREACH_STATE } from './models';
import { useBreaches } from './useBreaches';

const LIST_STATES_MAP: Record<ListType, BREACH_STATE[]> = {
    open: [BREACH_STATE.UNREAD, BREACH_STATE.READ],
    resolved: [BREACH_STATE.RESOLVED],
};

const CredentialLeakSection = () => {
    const canDisplayDWMEmailToggle = useFlag('DarkWebEmailNotifications');
    const handleError = useErrorHandler();
    const [loading, withLoading] = useLoading();
    const [breachesLoading] = useLoading();
    const [toggleLoading, withToggleLoading] = useLoading();
    const [actionLoading, withActionLoading] = useLoading();
    const [emailToggleLoading, withEmailToggleLoading] = useLoading();
    const [openSubscriptionModal] = useSubscriptionModal();
    const api = useApi();
    const [user] = useUser();
    const [{ BreachAlerts }] = useUserSettings();
    const { createNotification } = useNotifications();
    const breachModal = useModalStateObject();
    const { viewportWidth } = useActiveBreakpoint();
    const { breaches: breachList, actions } = useBreaches();

    const [selectedBreachID, setSelectedBreachID] = useState<string | null>(null);
    const [listType, setListType] = useState<ListType>('open');
    const [total, setTotal] = useState<number | null>(null);
    const [error, setError] = useState<{ message: string } | null>(null);
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [sample, setSample] = useState<SampleBreach | null>(null);
    const [hasBeenInteractedWith, setHasBeenInteractedWith] = useState<boolean>(false);

    // TODO: change nums to constants
    const [hasAlertsEnabled, setHasAlertsEnabled] = useState<boolean>(
        BreachAlerts.Eligible === DARK_WEB_MONITORING_ELIGIBILITY_STATE.PAID &&
            BreachAlerts.Value === DARK_WEB_MONITORING_STATE.ENABLED
    );
    const [hasEmailsEnabled, setHasEmailsEnabled] = useState<boolean>(
        BreachAlerts.EmailNotifications === DARK_WEB_MONITORING_EMAILS_STATE.ENABLED
    );
    const isPaidUser = user.isPaid;

    const metrics = {
        source: 'upsells',
    } as const;

    useEffect(() => {
        const fetchLeakData = async () => {
            try {
                const { Breaches, Samples, IsEligible, Count } = await api(getBreaches());

                if (IsEligible) {
                    const breaches = toCamelCase(Breaches);
                    actions.load(breaches);
                    if (Count > 0) {
                        setSelectedBreachID(breaches[0].id);
                    }
                } else {
                    const fetchedSample = toCamelCase(Samples);
                    setSample(fetchedSample[0]);
                }
                setTotal(Count);
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

    useEffect(() => {
        const handleBreachModal = () => {
            if (!loading && viewportWidth['<=medium'] && openModal) {
                breachModal.openModal(true);
                setOpenModal(!openModal);
            }
        };
        handleBreachModal();
    }, [loading, openModal, viewportWidth]);

    // TODO: if BE api returns read and opened breaches, can remove filter
    const viewingBreachList = breachList.filter((breach) => LIST_STATES_MAP[listType].includes(breach.resolvedState));
    const viewingBreach = viewingBreachList.find((b) => b.id === selectedBreachID) ?? viewingBreachList[0];

    const isFirstItemUnread =
        viewingBreachList.length > 0 && viewingBreachList[0].resolvedState === BREACH_STATE.UNREAD;
    const firstBreach = viewingBreachList[0];

    const markAsResolvedBreach = async () => {
        if (!viewingBreach) {
            return;
        }
        try {
            await withActionLoading(
                api(
                    updateBreachState({
                        ID: viewingBreach.id,
                        State: BREACH_STATE.RESOLVED,
                    })
                )
            );
            actions.resolve(viewingBreach);
            setSelectedBreachID(null);
        } catch (e) {
            handleError(e);
        }
    };

    const markAsOpenBreach = async () => {
        if (!viewingBreach) {
            return;
        }
        try {
            await api(
                updateBreachState({
                    ID: viewingBreach.id,
                    State: BREACH_STATE.READ,
                })
            );
            actions.open(viewingBreach);
        } catch (e) {
            handleError(e);
        }
    };

    const handleEnableBreachAlertToggle = async (newToggleState: boolean) => {
        if (newToggleState === hasAlertsEnabled) {
            return;
        }
        try {
            const [action, notification] = newToggleState
                ? [enableBreachAlert, c('Notification').t`Dark Web Monitoring has been enabled`]
                : [disableBreachAlert, c('Notification').t`Dark Web Monitoring has been disabled`];

            await withToggleLoading(api(action()));
            createNotification({ text: notification });
            setHasAlertsEnabled(newToggleState);
        } catch (e) {
            handleError(e);
        }
    };

    const handleEmailNotificationsToggle = async (newState: boolean) => {
        const notification = newState
            ? c('Notification').t`Email notifications have been enabled`
            : c('Notification').t`Email notifications have been disabled`;
        try {
            await withEmailToggleLoading(api(updateBreachEmailNotificationsState({ Enabled: newState })));
            createNotification({ text: notification });
            setHasEmailsEnabled(newState);
        } catch (e) {
            handleError(e);
        }
    };

    // need upsellRef to differentiate between breach alert upsells in account and inbox
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.ACCOUNT_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.TOGGLE,
        feature: MAIL_UPSELL_PATHS.BREACH_ALERTS,
    });

    const handleUpgrade = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            metrics,
            mode: 'upsell-modal',
            upsellRef,
            onSubscribed: () => {
                handleEnableBreachAlertToggle(true);
                return;
            },
        });
    };

    useEffect(() => {
        if (viewingBreach === firstBreach && isFirstItemUnread && hasBeenInteractedWith) {
            markAsOpenBreach();
        } else {
            if (viewingBreach !== firstBreach && viewingBreach.resolvedState === BREACH_STATE.UNREAD) {
                markAsOpenBreach();
            }
        }
    }, [viewingBreach, hasBeenInteractedWith]);

    const href = getKnowledgeBaseUrl('/dark-web-monitoring');
    // translator: full sentence is: We monitor the dark web for instances where your personal information (such as an email address or password used on a third-party site) is leaked or compromised. <How does monitoring work?>
    const dataBreachLink = (
        <Href key={'breach'} className="inline-block" href={href}>{c('Link').t`How does monitoring work?`}</Href>
    );

    const breachAlertIntroText = (
        <SettingsParagraph>
            {
                // translator: full sentence is: We monitor the dark web for instances where your personal information (such as an email address or password used on a third-party site) is leaked or compromised. <How does monitoring work?>
                c('Info')
                    .jt`We monitor the dark web for instances where your personal information (such as an email address or password used on a third-party site) is leaked or compromised.`
            }{' '}
            {dataBreachLink}
        </SettingsParagraph>
    );

    const breachAlertInfoSharing = (
        <SettingsParagraph>
            {c('Info')
                .t`${BRAND_NAME} never shares your information with third parties. Data comes from ${BRAND_NAME}'s own analyses and Constella Intelligence.`}{' '}
            {
                // translator: full sentence is: Proton never shares your information with third parties. Data comes from Proton's own analyses and Constella Intelligence. Support for monitoring of custom domains and non-Proton email addresses is coming soon.
                c('Info')
                    .t`Support for monitoring of custom domains and non-${BRAND_NAME} email addresses is coming soon.`
            }
        </SettingsParagraph>
    );

    // translator: full sentence is: Get notified if your password or other personal data was leaked. <Learn more>
    const learnMoreLinkNoBreach = <Href href={href} className="inline-block">{c('Link').t`Learn more`}</Href>;

    // translator: full sentence is: Your information was found in at least one data breach. Turn on Dark Web Monitoring to view details and take action. <Learn more>
    const learnMoreLinkBreach = (
        <Href href={href} className="inline-block color-danger">{c('Link').t`Learn more`}</Href>
    );

    return (
        <>
            <SettingsSectionWide>
                {(() => {
                    if (error) {
                        return <GenericError className="text-center">{error.message}</GenericError>;
                    }
                    if (loading) {
                        return <Loader size="medium" />;
                    }

                    if (!isPaidUser) {
                        return (
                            <div className="flex flex-nowrap">
                                <div className="flex-1">
                                    {breachAlertIntroText}
                                    {total === 0 ? (
                                        <SettingsParagraph>
                                            {c('Info')
                                                .jt`Get notified if your password or other personal data was leaked. ${learnMoreLinkNoBreach}`}
                                        </SettingsParagraph>
                                    ) : (
                                        <SettingsParagraph>
                                            <div
                                                className="flex flex-nowrap color-danger p-4 rounded"
                                                style={{ 'background-color': 'var(--signal-danger-minor-2)' }}
                                            >
                                                <Icon
                                                    name="exclamation-circle-filled"
                                                    className="shrink-0 mt-0.5 mr-2"
                                                />
                                                <span className="flex-1">
                                                    {getUpsellText(sample, total, learnMoreLinkBreach, true)}
                                                </span>
                                            </div>
                                        </SettingsParagraph>
                                    )}

                                    <SettingsLayout>
                                        <SettingsLayoutLeft>
                                            <label className="text-semibold" htmlFor="data-breach-toggle">
                                                <span className="mr-2">
                                                    {getEnableString(DARK_WEB_MONITORING_NAME)}
                                                </span>
                                            </label>
                                        </SettingsLayoutLeft>
                                        <SettingsLayoutRight isToggleContainer>
                                            <Toggle
                                                id="data-breach-toggle"
                                                disabled={false}
                                                checked={false}
                                                onClick={handleUpgrade}
                                            />
                                        </SettingsLayoutRight>
                                    </SettingsLayout>
                                </div>

                                <div className="hidden lg:flex">
                                    <img
                                        src={total === 0 ? freeUserNoBreachImg : freeUserBreachImg}
                                        alt=""
                                        width={300}
                                        className="m-auto"
                                    />
                                </div>
                            </div>
                        );
                    }

                    return (
                        <>
                            {breachAlertIntroText}
                            {breachAlertInfoSharing}
                            <BreachMonitoringToggle
                                enabled={hasAlertsEnabled}
                                loading={toggleLoading}
                                onToggle={handleEnableBreachAlertToggle}
                            />
                            {canDisplayDWMEmailToggle && (
                                <BreachEmailToggle
                                    enabled={hasEmailsEnabled}
                                    loading={emailToggleLoading}
                                    onToggle={handleEmailNotificationsToggle}
                                />
                            )}
                            {hasAlertsEnabled &&
                                (total === 0 ? (
                                    <NoBreachesView />
                                ) : (
                                    <div
                                        className="flex flex-nowrap lg:flex-row w-full max-h-custom lg:max-h-custom"
                                        style={{ '--max-h-custom': '40vh', '--lg-max-h-custom': '90vh' }}
                                    >
                                        <BreachesList
                                            data={breachList}
                                            selectedID={selectedBreachID}
                                            onSelect={(id) => {
                                                setSelectedBreachID(id);
                                                setOpenModal(true);
                                                if (!hasBeenInteractedWith) {
                                                    setHasBeenInteractedWith(true);
                                                }
                                            }}
                                            isPaidUser={isPaidUser}
                                            total={total}
                                            type={listType}
                                            onViewTypeChange={setListType}
                                        />
                                        {viewingBreachList.length === 0 && (
                                            <div
                                                className={clsx(
                                                    'flex relative w-full md:w-2/3',
                                                    viewportWidth['<=medium'] && 'hidden'
                                                )}
                                            >
                                                <EmptyBreachListCard listType={listType} />
                                            </div>
                                        )}
                                        {viewingBreach && (
                                            <div
                                                className={clsx(
                                                    'relative w-full md:w-2/3',
                                                    viewportWidth['<=medium'] && 'hidden'
                                                )}
                                                onMouseEnter={() => {
                                                    if (!hasBeenInteractedWith) {
                                                        setHasBeenInteractedWith(true);
                                                    }
                                                }}
                                            >
                                                <BreachInformationCard
                                                    breachData={viewingBreach}
                                                    onResolve={markAsResolvedBreach}
                                                    onOpen={() => withActionLoading(markAsOpenBreach())}
                                                    isMutating={breachesLoading}
                                                    loading={actionLoading}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </>
                    );
                })()}
            </SettingsSectionWide>
            {breachModal.render && (
                <BreachModal
                    modalProps={breachModal.modalProps}
                    breachData={viewingBreach}
                    onResolve={() => {
                        if (viewingBreach) {
                            actions.resolve(viewingBreach);
                        }
                    }}
                />
            )}
        </>
    );
};

export default CredentialLeakSection;
