import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { BREACH_STATE } from '@proton/components/containers/credentialLeak/models';
import clsx from '@proton/utils/clsx';

import BreachInfo from './BreachInfo';
import BreachInfoNote from './BreachInfoNote';
import BreachRecommendations from './BreachRecommendations';
import BreachTitle from './BreachTitle';
import UserBreachInfo from './UserBreachInfo';
import { getFillerBreachData, getStyle } from './helpers';
import { FetchedBreaches } from './models';

import './BreachInfoCard.scss';

interface Props {
    breachData: FetchedBreaches | undefined;
    paid: boolean;
    onResolve?: () => void;
    onOpen?: () => void;
    isMutating?: boolean;
}

const BreachInformationCard = ({ breachData, paid, onResolve, isMutating, onOpen }: Props) => {
    if (!breachData) {
        return;
    }

    const { name, createdAt, email, severity, resolvedState } = breachData;

    const { passwordLastChars, actions, exposedData } = paid ? breachData : getFillerBreachData();

    const hasActions = actions && actions?.length > 0;
    const blurClass = paid ? '' : 'breach-info-card-nonpaid pointer-event-none select-none';

    const isResolved = resolvedState === BREACH_STATE.RESOLVED;

    return (
        <div
            className={clsx(
                'p-10 flex flex-column *:min-size-auto flex-nowrap w-full h-full overflow-y-auto gap-4 rounded-lg border border-weak shadow-norm',
                blurClass
            )}
            aria-hidden={paid ? false : true}
        >
            <BreachTitle
                name={name}
                createdAt={createdAt}
                style={getStyle(severity)}
                severity={severity}
                resolved={isResolved}
            />
            <div className="flex flex-column flex-nowrap gap-2">
                <BreachInfo exposedData={exposedData} />
                <UserBreachInfo email={email} passwordLastChars={passwordLastChars} />
                {hasActions && <BreachRecommendations actions={actions} />}

                <BreachInfoNote />

                {isResolved ? (
                    <Button className="mr-auto" onClick={onOpen}>{c('Action').t`Mark as open`}</Button>
                ) : (
                    <Button className="mr-auto" onClick={onResolve} loading={isMutating}>{c('Action')
                        .t`Mark as resolved`}</Button>
                )}
            </div>
        </div>
    );
};

export default BreachInformationCard;
