import { useMemo } from 'react';

import { c } from 'ttag';

import {
    Badge,
    Icon,
    Info,
    InlineLinkButton,
    StripedItem,
    StripedList,
    useActiveBreakpoint,
} from '@proton/components/';
import clsx from '@proton/utils/clsx';

import { useDealContext } from './DealContext';

interface Props {
    isExpanded?: boolean;
    expand: () => void;
}

const DealFeatures = ({ isExpanded, expand }: Props) => {
    const { deal } = useDealContext();
    const { isNarrow } = useActiveBreakpoint();
    const features = useMemo(() => deal.features?.(), [deal.features]);

    if (!features?.length) {
        return null;
    }

    return (
        <div className="flex-item-fluid-auto w100">
            {(!isNarrow || isExpanded) && (
                <StripedList alternate="odd">
                    {features.map((feature) => (
                        <StripedItem
                            key={`${feature.name}-${feature.icon}`}
                            left={
                                !!feature.icon ? (
                                    <Icon className="color-success" name={feature.icon} size={20} />
                                ) : (
                                    <Icon className="color-success" name="checkmark" size={20} />
                                )
                            }
                        >
                            {feature.badge && <Badge type="primary">{feature.badge}</Badge>}
                            <span className={clsx(['text-left', feature.disabled && 'color-disabled'])}>
                                {feature.name}
                            </span>
                            {!!feature.tooltip && <Info buttonClass="ml-2" title={feature.tooltip} />}
                        </StripedItem>
                    ))}
                </StripedList>
            )}
            {isNarrow && !isExpanded && (
                <div className="w100 text-center flex">
                    <InlineLinkButton className="mx-auto" onClick={() => expand()}>
                        <span>{c('Action').t`See plan features`}</span>
                        <Icon name="chevron-down" className="ml-2" />
                    </InlineLinkButton>
                </div>
            )}
        </div>
    );
};

export default DealFeatures;
