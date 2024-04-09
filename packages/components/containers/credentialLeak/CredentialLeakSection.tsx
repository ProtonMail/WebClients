import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import {
    GenericError,
    Icon,
    Loader,
    SUBSCRIPTION_STEPS,
    Toggle,
    useErrorHandler,
    useModalStateObject,
    useSubscriptionModal,
    useUser,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getBreaches } from '@proton/shared/lib/api/settings';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import freeUserBreachImg from '@proton/styles/assets/img/breach-alert/img-breaches-found.svg';
import freeUserNoBreachImg from '@proton/styles/assets/img/breach-alert/img-no-breaches-found-inactive.svg';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { useActiveBreakpoint, useApi } from '../../hooks';
import {
    SettingsLayout,
    SettingsLayoutLeft,
    SettingsLayoutRight,
    SettingsParagraph,
    SettingsSectionWide,
} from '../account';
import BreachInformationCard from './BreachInformationCard';
import BreachModal from './BreachModal';
import BreachesList from './BreachesList';
import NoBreachesView from './NoBreachesView';
import UnlockBreachReportCard from './UnlockBreachReportCard';
import { BREACH_API_ERROR, toCamelCase } from './helpers';

export interface FetchedBreaches {
    id: string;
    name: string;
    email: string;
    severity: number;
    createdAt: string;
    publishedAt: string;
    size: number;
    passwordLastChars: string | null;
    exposedData: {
        code: string;
        name: string;
    }[];
    actions:
        | {
              code: string;
              name: string;
              desc: string;
          }[]
        | null;
    source: {
        isAggregated: boolean;
        domain: string | null;
        category: null | {
            code: string;
            name: string;
        };
        country: null | {
            code: string;
            name: string;
            emoji: string;
        };
    };
}

const CredentialLeakSection = () => {
    const handleError = useErrorHandler();
    const [loading, withLoading] = useLoading();
    const [openSubscriptionModal] = useSubscriptionModal();
    const api = useApi();
    const [user] = useUser();
    const breachModal = useModalStateObject();
    const { viewportWidth } = useActiveBreakpoint();
    const [fetchedBreachData, setFetchedBreachData] = useState<FetchedBreaches[] | null>(null);
    const [selectedBreachID, setSelectedBreachID] = useState<string | null>(null);
    const [total, setTotal] = useState<number | null>(null);
    const [error, setError] = useState<{ message: string } | null>(null);
    const [openModal, setOpenModal] = useState<boolean>(false);

    const isPaidUser = user.isPaid;

    //TODO: update source of metrics
    const metrics = {
        source: 'plans',
    } as const;

    const handleUpgrade = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            metrics,
            mode: 'upsell-modal',
        });
    };

    useEffect(() => {
        const fetchLeakData = async () => {
            try {
                const { Breaches, Samples, IsEligible, Count } = await api(getBreaches());
                const fetchedData = toCamelCase(Breaches);
                const fetchedSample = toCamelCase(Samples);

                if (IsEligible) {
                    setFetchedBreachData(fetchedData);
                    setSelectedBreachID(fetchedData[0]?.id || null);
                } else {
                    setFetchedBreachData(fetchedSample);
                    setSelectedBreachID(fetchedSample[0]?.id || null);
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
    }, []);

    useEffect(() => {
        const handleBreachModal = () => {
            if (!loading && viewportWidth['<=medium'] && openModal) {
                breachModal.openModal(true);
                setOpenModal(!openModal);
            }
        };
        handleBreachModal();
    }, [loading, openModal, viewportWidth]);

    const getSelectedBreachData = () => {
        if (!fetchedBreachData || !selectedBreachID) {
            return undefined;
        }
        return fetchedBreachData.find((breach) => breach.id === selectedBreachID);
    };

    // TODO: update to knowledge base url for data breaches
    // translator: full sentence is: We monitor the dark web for instances where your personal information (such as an email address or password used on a third-party site) is leaked or compromised. <How does monitoring work?>
    const dataBreachLink = (
        <Href key={'breach'} className="inline-block" href={getKnowledgeBaseUrl('/TO-ADD')}>{c('Link')
            .t`How does monitoring work?`}</Href>
    );

    const breachAlertIntroText = (
        <SettingsParagraph>
            {
                // translator: full sentence is: We monitor the dark web for instances where your personal information (such as an email address or password used on a third-party site) is leaked or compromised. <How does monitoring work?>
                c('Info')
                    .jt`We monitor the dark web for instances where your personal information (such as an email address or password used on a third-party site) is leaked or compromised. ${dataBreachLink}`
            }
        </SettingsParagraph>
    );

    const breachAlertInfoSharing = (
        <SettingsParagraph>
            {c('Info')
                .t`${BRAND_NAME} never shares your information with third parties. Data comes from  ${BRAND_NAME}'s own analyses and Constella Intelligence.`}
        </SettingsParagraph>
    );

    // translator: full sentence is: Get notified if your password or other personal data was leaked. <Learn more>
    const learnMoreLinkNoBreach = (
        <Href href={getKnowledgeBaseUrl('/TO-ADD')} className="inline-block">{c('Link').t`Learn more`}</Href>
    );

    // translator: full sentence is: Your information was found in at least one data breach. Turn on Breach Alert to view details and take action. <Learn more>
    const learnMoreLinkBreach = (
        <Href href={getKnowledgeBaseUrl('/TO-ADD')} className="inline-block color-danger">{c('Link')
            .t`Learn more`}</Href>
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
                                                    {
                                                        // translator: full sentence is: Your information was found in at least one data breach. Turn on Breach Alert to view details and take action. <Learn more>
                                                        c('Security Center - Info')
                                                            .jt`Your information was found in at least one data breach. Turn on Breach Alert to view details and take action. ${learnMoreLinkBreach}`
                                                    }
                                                </span>
                                            </div>
                                        </SettingsParagraph>
                                    )}

                                    <SettingsLayout>
                                        <SettingsLayoutLeft>
                                            <label className="text-semibold" htmlFor="data-breach-toggle">
                                                <span className="mr-2">{c('Log preference')
                                                    .t`Enable Breach Alert`}</span>
                                            </label>
                                        </SettingsLayoutLeft>
                                        <SettingsLayoutRight isToggleContainer>
                                            <Toggle
                                                id="data-breach-toggle"
                                                disabled={false}
                                                checked={false}
                                                onClick={handleUpgrade}
                                            />
                                            {/* TODO: toggle activation */}
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

                            <SettingsLayout>
                                <SettingsLayoutLeft>
                                    <label className="text-semibold" htmlFor="data-breach-toggle">
                                        <span className="mr-2">{c('Log preference').t`Enable Breach Alert`}</span>
                                    </label>
                                </SettingsLayoutLeft>
                                <SettingsLayoutRight isToggleContainer>
                                    <Toggle id="data-breach-toggle" disabled={false} checked={true} />
                                    {/* TODO: toggle activation */}
                                </SettingsLayoutRight>
                            </SettingsLayout>

                            {total === 0 ? (
                                <NoBreachesView />
                            ) : (
                                <div
                                    className="flex flex-nowrap lg:flex-row w-full max-h-custom lg:max-h-custom"
                                    style={{ '--max-h-custom': '40vh', '--lg-max-h-custom': '90vh' }}
                                >
                                    <BreachesList
                                        breachData={fetchedBreachData}
                                        selectedID={selectedBreachID}
                                        setSelectedBreachID={setSelectedBreachID}
                                        isPaidUser={isPaidUser}
                                        total={total}
                                        setOpenModal={setOpenModal}
                                    />

                                    <div
                                        className={clsx(
                                            'relative w-full md:w-2/3',
                                            viewportWidth['<=medium'] && 'hidden'
                                        )}
                                    >
                                        {!isPaidUser && <UnlockBreachReportCard />}
                                        {selectedBreachID && (
                                            <BreachInformationCard
                                                paid={isPaidUser}
                                                breachData={getSelectedBreachData()}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    );
                })()}
            </SettingsSectionWide>
            {breachModal.render && (
                <BreachModal modalProps={breachModal.modalProps} breachData={getSelectedBreachData()} />
            )}
        </>
    );
};

export default CredentialLeakSection;
