import { Icon, Info, StripedItem, StripedList } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import { useDealContext } from './DealContext';

const DealFeatures = () => {
    const { deal } = useDealContext();
    return deal.features ? (
        <div className="flex-item-fluid-auto w100 no-mobile">
            <StripedList alternate="odd">
                {deal.features.map((feature, index) => (
                    <StripedItem
                        key={index}
                        left={
                            !!feature.icon ? (
                                <Icon className="color-success" name={feature.icon} size={20} />
                            ) : undefined
                        }
                    >
                        <span className={clsx(['text-left', feature.disabled && 'color-disabled'])}>{feature.name}</span>
                        {!!feature.tooltip && <Info className="ml0-5" title={feature.tooltip} />}
                    </StripedItem>
                ))}
            </StripedList>
        </div>
    ) : null;
};

export default DealFeatures;
