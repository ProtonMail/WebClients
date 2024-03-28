import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { GenericError } from '@proton/components';
import { Icon, Loader, useModalStateObject } from '@proton/components/components';
import BreachModal from '@proton/components/containers/credentialLeak/BreachModal';
import { FetchedBreaches } from '@proton/components/containers/credentialLeak/CredentialLeakSection';
import { getStyle } from '@proton/components/containers/credentialLeak/helpers';
import { BREACH_API_ERROR, toCamelCase } from '@proton/components/containers/credentialLeak/helpers';
import { useApi, useErrorHandler, useUser } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import { getBreaches } from '@proton/shared/lib/api/breaches';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import noop from '@proton/utils/noop';

import BreachAlertUpsellModal from './BreachAlertUpsellModal';
import BreachCard from './BreachCard';
import BreachDetectedUpsell from './BreachDetectedUpsell';
import FreeUserNoBreaches from './FreeUserNoBreaches';

const BREACHES_LIMIT = 3;

const BreachAlertsSecurityCenter = () => {
    const handleError = useErrorHandler();
    const [user] = useUser();
    const { isPaid } = user;

    const [loading, withLoading] = useLoading();
    const [fetchedBreachData, setFetchedBreachData] = useState<FetchedBreaches[] | null>(null);
    const [error, setError] = useState<{ message: string } | null>(null);
    const [count, setCount] = useState<number | null>(null);
    const api = useApi();
    const [selectedBreachID, setSelectedBreachID] = useState<string | null>(null);
    const breachAlertModal = useModalStateObject();
    const breachAlertUpsellModal = useModalStateObject();

    useEffect(() => {
        const fetchLeakData = async () => {
            try {
                const { Breaches, Count } = await api(getBreaches(true));
                const fetchedData = toCamelCase(Breaches);
                if (fetchedData.length < BREACHES_LIMIT) {
                    setFetchedBreachData(fetchedData);
                } else {
                    setFetchedBreachData(fetchedData.slice(0, BREACHES_LIMIT));
                }
                setCount(Count);
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

    const handleUpgradeClick = () => {
        breachAlertUpsellModal.openModal(true);
        return;
    };

    const openBreachModal = () => {
        breachAlertModal.openModal(true);
    };

    const getSelectedBreachData = () => {
        if (!fetchedBreachData || !selectedBreachID) {
            return undefined;
        }
        return fetchedBreachData.find((breach) => breach.id === selectedBreachID);
    };

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
                        if (count === 0) {
                            return <FreeUserNoBreaches onToggleBreaches={handleUpgradeClick} />;
                        }
                        return <BreachDetectedUpsell onToggleBreaches={handleUpgradeClick} />; // TO UPDATE for upsell
                    }

                    return (
                        <>
                            <h3 className="text-rg text-bold mt-1 mb-2">{c('Title').t`Breach Alert`}</h3>
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
                                    {fetchedBreachData?.map((breach) => {
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
                />
            )}
            {breachAlertUpsellModal.render && <BreachAlertUpsellModal modalProps={breachAlertUpsellModal.modalProps} />}
        </>
    );
};

export default BreachAlertsSecurityCenter;
