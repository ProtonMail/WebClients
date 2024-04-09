import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import {
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    SettingsLink,
} from '@proton/components/components';

import BreachInfo from './BreachInfo';
import BreachInfoNote from './BreachInfoNote';
import BreachRecommendations from './BreachRecommendations';
import BreachTitle from './BreachTitle';
import { FetchedBreaches } from './CredentialLeakSection';
import UserBreachInfo from './UserBreachInfo';
import { getStyle } from './helpers';

interface BreachModalProps {
    modalProps: ModalProps;
    breachData: FetchedBreaches | undefined;
    securityCenter?: boolean;
}

const BreachModal = ({ modalProps, breachData, securityCenter }: BreachModalProps) => {
    if (!breachData) {
        return;
    }
    const { name, createdAt, email, severity, passwordLastChars, actions, exposedData } = breachData;

    const hasActions = actions && actions?.length > 0;

    const isResolved = false; // TODO: API?

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
                    />
                }
            />
            <ModalTwoContent className="pb-4">
                <div className="flex flex-column flex-nowrap gap-2">
                    <BreachInfo exposedData={exposedData} inModal />
                    <UserBreachInfo email={email} passwordLastChars={passwordLastChars} inModal />
                    {hasActions && <BreachRecommendations actions={actions} inModal />}

                    <BreachInfoNote />
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                {isResolved ? (
                    <ButtonLike disabled>{c('Action').t`Mark as open`}</ButtonLike>
                ) : (
                    <ButtonLike disabled>{c('Action').t`Mark as resolved`}</ButtonLike>
                )}
                {securityCenter && (
                    <ButtonLike as={SettingsLink} path="/security#breaches">{c('Action')
                        .t`View all reports`}</ButtonLike>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default BreachModal;
