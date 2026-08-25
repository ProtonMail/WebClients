import { useMemo } from 'react';
import { useLocation } from 'react-router';

import { c } from 'ttag';

import { useConfig } from '@proton/app-context/useConfig';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import clsx from '@proton/utils/clsx';

import { Badge } from '../../../../../components/badge/Badge';
import Icon from '../../../../../components/icon/Icon';
import Info from '../../../../../components/link/Info';
import StripedItem from '../../../../../components/stripedList/StripedItem';
import { StripedList } from '../../../../../components/stripedList/StripedList';
import { getOfferProduct } from '../../../helpers/getOfferProduct';
import { useDealContext } from './DealContext';

interface Props {
    isExpanded?: boolean;
    expand: () => void;
}

const DealFeatures = ({ isExpanded, expand }: Props) => {
    const { deal } = useDealContext();
    const { APP_NAME } = useConfig();
    const { pathname } = useLocation();

    const product = getOfferProduct(APP_NAME, pathname);
    const features = useMemo(() => deal.features?.(product), [deal.features, product]);

    if (!features?.length) {
        return null;
    }

    return (
        <div className="flex-auto w-full">
            {isExpanded && (
                <StripedList alternate="odd">
                    {features.map((feature) => (
                        <StripedItem
                            key={`${feature.name}-${feature.icon}`}
                            left={
                                !!feature.icon ? (
                                    <Icon className="color-success" name={feature.icon} size={5} />
                                ) : (
                                    <IcCheckmark className="color-success" size={5} />
                                )
                            }
                        >
                            {feature.badge && <Badge type="primary">{feature.badge}</Badge>}
                            <span className={clsx(['text-left', feature.disabled && 'color-disabled'])}>
                                {feature.name}
                            </span>
                            {!!feature.tooltip && <Info buttonClass="ml-1" title={feature.tooltip} />}
                        </StripedItem>
                    ))}
                </StripedList>
            )}
            {!isExpanded && (
                <div className="w-full text-center flex">
                    <InlineLinkButton className="mx-auto offer-see-plan-features" onClick={() => expand()}>
                        <span>{c('Action').t`See plan features`}</span>
                        <IcChevronDown className="ml-2" />
                    </InlineLinkButton>
                </div>
            )}
        </div>
    );
};

export default DealFeatures;
