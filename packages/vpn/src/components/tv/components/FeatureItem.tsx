import type { ReactNode } from 'react';

import { Info } from '@proton/components/index';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';

export const FeatureItem = ({
    included,
    text,
    tooltip,
}: {
    included: boolean;
    text: string | undefined;
    tooltip?: ReactNode;
}) => {
    return text ? (
        <li className="flex items-center text-center gap-1">
            {included ? <IcCheckmark className="color-success text-center" /> : null}
            <span>{text}</span>
            {tooltip ? (
                <Info title={tooltip}>
                    <IcInfoCircle className="color-primary" />
                </Info>
            ) : null}
        </li>
    ) : null;
};
