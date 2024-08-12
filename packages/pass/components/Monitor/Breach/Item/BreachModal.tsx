import { ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components/components';
import type { FetchedBreaches } from '@proton/components/containers';
import BreachInfo from '@proton/components/containers/credentialLeak/BreachInfo';
import BreachInfoNote from '@proton/components/containers/credentialLeak/BreachInfoNote';
import BreachRecommendations from '@proton/components/containers/credentialLeak/BreachRecommendations';
import BreachTitle from '@proton/components/containers/credentialLeak/BreachTitle';
import UserBreachInfo from '@proton/components/containers/credentialLeak/UserBreachInfo';
import { getStyle } from '@proton/components/containers/credentialLeak/helpers';

type Props = { breach: FetchedBreaches; onClose: () => void };

export const BreachModal = ({ breach, onClose }: Props) => {
    const { name, createdAt, severity, actions, exposedData } = breach;
    const hasActions = actions && actions?.length > 0;
    const isResolved = false;

    return (
        <ModalTwo fullscreenOnMobile open onClose={onClose} size="medium">
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
                    <UserBreachInfo exposedData={exposedData} inModal />
                    {hasActions && <BreachRecommendations actions={actions} inModal />}

                    <BreachInfoNote />
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};
