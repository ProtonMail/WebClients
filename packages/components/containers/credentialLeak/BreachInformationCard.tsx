import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { BREACH_STATE } from '@proton/components/containers/credentialLeak/models';

import BreachInfo from './BreachInfo';
import BreachInfoNote from './BreachInfoNote';
import BreachRecommendations from './BreachRecommendations';
import BreachTitle from './BreachTitle';
import UserBreachInfo from './UserBreachInfo';
import { getStyle } from './helpers';
import type { FetchedBreaches } from './models';

import './BreachInfoCard.scss';

interface Props {
    breachData: FetchedBreaches | undefined;
    onResolve?: () => void;
    onOpen?: () => void;
    isMutating?: boolean;
    loading?: boolean;
}

const BreachInformationCard = ({ breachData, onResolve, isMutating, onOpen, loading }: Props) => {
    if (!breachData) {
        return;
    }

    const { name, createdAt, severity, resolvedState, actions, exposedData } = breachData;
    const hasActions = actions && actions?.length > 0;
    const isResolved = resolvedState === BREACH_STATE.RESOLVED;

    return (
        <div className="p-10 flex flex-column *:min-size-auto flex-nowrap w-full h-full overflow-y-auto gap-4 rounded-lg border border-weak shadow-norm">
            <BreachTitle
                name={name}
                createdAt={createdAt}
                style={getStyle(severity)}
                severity={severity}
                resolved={isResolved}
            />
            <div className="flex flex-column flex-nowrap gap-2">
                <BreachInfo exposedData={exposedData} />
                <UserBreachInfo exposedData={exposedData} />
                {hasActions && <BreachRecommendations actions={actions} />}

                <BreachInfoNote />

                {isResolved ? (
                    <Button className="mr-auto" onClick={onOpen} loading={loading}>{c('Action')
                        .t`Mark as open`}</Button>
                ) : (
                    <Button className="mr-auto" onClick={onResolve} loading={isMutating || loading}>{c('Action')
                        .t`Mark as resolved`}</Button>
                )}
            </div>
        </div>
    );
};

export default BreachInformationCard;
