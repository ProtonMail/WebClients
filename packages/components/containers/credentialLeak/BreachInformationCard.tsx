import clsx from '@proton/utils/clsx';

import BreachInfo from './BreachInfo';
import BreachRecommendations from './BreachRecommendations';
import BreachTitle from './BreachTitle';
import { FetchedBreaches } from './CredentialLeakSection';
import UserBreachInfo from './UserBreachInfo';
import { getFillerBreachData, getStyle } from './helpers';

import './BreachInfoCard.scss';

interface Props {
    breachData: FetchedBreaches | undefined;
    paid: boolean;
}

const BreachInformationCard = ({ breachData, paid }: Props) => {
    if (!breachData) {
        return;
    }

    const { name, createdAt, email, severity } = breachData;

    const {
        passwordLastChars,
        publishedAt,
        actions,
        size,
        source: { category, country },
        exposedData,
    } = paid ? breachData : getFillerBreachData();

    const hasActions = actions && actions?.length > 0;
    const blurClass = paid ? '' : 'breach-info-card-nonpaid pointer-event-none select-none';

    return (
        <div
            className={clsx(
                'p-10 md:p-6 lg:p-10 flex flex-column *:min-size-auto flex-nowrap overflow-y-auto w-full h-full gap-6 rounded-lg border border-weak shadow-norm',
                blurClass
            )}
            aria-hidden={paid ? false : true}
        >
            <BreachTitle name={name} createdAt={createdAt} style={getStyle(severity)} />
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
        </div>
    );
};

export default BreachInformationCard;
