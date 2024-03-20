import { ModalProps, ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components/components';

import BreachInfo from './BreachInfo';
import BreachRecommendations from './BreachRecommendations';
import BreachTitle from './BreachTitle';
import { FetchedBreaches } from './CredentialLeakSection';
import UserBreachInfo from './UserBreachInfo';
import { getStyle } from './helpers';

interface BreachModalProps {
    modalProps: ModalProps;
    breachData: FetchedBreaches | undefined;
}
const BreachModal = ({ modalProps, breachData }: BreachModalProps) => {
    if (!breachData) {
        return;
    }
    const {
        name,
        createdAt,
        email,
        severity,
        passwordLastChars,
        publishedAt,
        actions,
        size,
        source: { category, country },
        exposedData,
    } = breachData;

    const hasActions = actions && actions?.length > 0;

    return (
        <ModalTwo fullscreenOnMobile {...modalProps}>
            <ModalTwoHeader />
            <ModalTwoContent className="px-4 pb-4">
                <BreachTitle name={name} createdAt={createdAt} style={getStyle(severity)} className="mb-4" />
                <div className="flex flex-column flex-nowrap gap-2">
                    <BreachInfo
                        publishedAt={publishedAt}
                        category={category?.name}
                        size={size}
                        country={country?.name}
                        exposedData={exposedData}
                    />
                    <UserBreachInfo email={email} passwordLastChars={passwordLastChars} style={getStyle(severity)} />
                    {hasActions && <BreachRecommendations actions={actions} />}
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default BreachModal;
