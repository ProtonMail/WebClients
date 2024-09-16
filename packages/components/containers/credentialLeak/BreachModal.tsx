import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, SettingsLink } from '@proton/components/components';
import useLoading from '@proton/hooks/useLoading';
import { updateBreachState } from '@proton/shared/lib/api/breaches';

import { useApi, useErrorHandler } from '../..';
import BreachInfo from './BreachInfo';
import BreachInfoNote from './BreachInfoNote';
import BreachRecommendations from './BreachRecommendations';
import BreachTitle from './BreachTitle';
import UserBreachInfo from './UserBreachInfo';
import { getStyle } from './helpers';
import type { FetchedBreaches } from './models';
import { BREACH_STATE } from './models';

interface BreachModalProps {
    modalProps: ModalProps;
    breachData: FetchedBreaches | undefined;
    securityCenter?: boolean;
    onResolve: () => void;
}

const BreachModal = ({ modalProps, breachData, securityCenter, onResolve }: BreachModalProps) => {
    const api = useApi();
    const handleError = useErrorHandler();
    const [buttonLoading, withButtonLoading] = useLoading();

    if (!breachData) {
        return;
    }
    const { name, createdAt, email, severity, passwordLastChars, actions, exposedData, id } = breachData;

    const hasActions = actions && actions?.length > 0;

    const isResolved = false;

    const markAsResolved = async () => {
        try {
            await withButtonLoading(
                api(
                    updateBreachState({
                        ID: id,
                        State: BREACH_STATE.RESOLVED,
                    })
                )
            );
            onResolve();
            modalProps.onClose?.();
        } catch (e) {
            handleError(e);
        }
    };

    return (
        <ModalTwo fullscreenOnMobile {...modalProps}>
            <ModalTwoHeader
                title={
                    <BreachTitle
                        name={name}
                        createdAt={createdAt}
                        style={getStyle(severity)}
                        className="mb-4"
                        inModal
                        severity={severity}
                        resolved={isResolved}
                    />
                }
            />
            <ModalTwoContent className="pb-4">
                <div className="flex flex-column flex-nowrap gap-2">
                    <BreachInfo exposedData={exposedData} inModal />
                    <UserBreachInfo
                        email={email}
                        passwordLastChars={passwordLastChars}
                        exposedData={exposedData}
                        inModal
                    />
                    {hasActions && <BreachRecommendations actions={actions} inModal />}

                    <BreachInfoNote />
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={markAsResolved} loading={buttonLoading}>{c('Action').t`Mark as resolved`}</Button>

                {securityCenter && (
                    <ButtonLike as={SettingsLink} path="/security#breaches">{c('Action')
                        .t`View all reports`}</ButtonLike>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default BreachModal;
