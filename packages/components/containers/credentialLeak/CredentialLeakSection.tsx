import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import {
    GenericError,
    Loader,
    SUBSCRIPTION_STEPS,
    useErrorHandler,
    useModalStateObject,
    useSubscriptionModal,
    useUser,
} from '@proton/components';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import { useLoading } from '@proton/hooks';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getBreaches } from '@proton/shared/lib/api/settings';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { useActiveBreakpoint, useApi } from '../../hooks';
import { SettingsParagraph, SettingsSectionWide } from '../account';
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
            if (!loading && viewportWidth['<=small'] && openModal) {
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
    const dataBreachLink = (
        <Href key={'breach'} href={getKnowledgeBaseUrl('/proton-sentinel')}>{c('Link').t`Learn more`}</Href>
    );

    return (
        <>
            <SettingsSectionWide>
                <SettingsParagraph large>
                    {c('Info')
                        .t`We monitor your email addresses, passwords, and personal data for appearances on the dark web and notify you in case your data is compromised.`}
                </SettingsParagraph>
                <SettingsParagraph large>
                    {c('Info')
                        .jt`Breach Alert is powered by ${BRAND_NAME}'s propietary datasets, open-source datasets, and Constella Intelligence. ${dataBreachLink}`}
                </SettingsParagraph>
                {(() => {
                    if (error) {
                        return <GenericError className="text-center">{error.message}</GenericError>;
                    }
                    if (loading) {
                        return <Loader size="medium" />;
                    }
                    if (total === 0) {
                        if (isPaidUser) {
                            return <NoBreachesView />;
                        }
                        return (
                            <PromotionButton iconName="upgrade" iconGradient={true} onClick={handleUpgrade}>
                                {c('Action').t`Unlock breach reports`}
                            </PromotionButton>
                        );
                    }
                    if (!isPaidUser && total === 1) {
                        return (
                            <div className="relative align-center w-full lg:w-2/3">
                                <UnlockBreachReportCard />
                                <BreachInformationCard paid={isPaidUser} breachData={getSelectedBreachData()} />
                            </div>
                        );
                    }
                    return (
                        <div
                            className={clsx(
                                'flex flex-column flex-nowrap md:flex-row w-full max-h-custom md:max-h-custom'
                            )}
                            style={{ '--max-h-custom': '40vh', '--md-max-h-custom': '70vh' }}
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
                                    'relative w-full md:w-2/3 h-auto',
                                    viewportWidth['<=small'] ? 'hidden' : ''
                                )}
                            >
                                {!isPaidUser && <UnlockBreachReportCard />}
                                {selectedBreachID && (
                                    <BreachInformationCard paid={isPaidUser} breachData={getSelectedBreachData()} />
                                )}
                            </div>
                        </div>
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
