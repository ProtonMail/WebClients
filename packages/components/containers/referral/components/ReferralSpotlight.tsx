import type { ReactElement, RefObject } from 'react';

import { c } from 'ttag';

import type { PopperPlacement } from '@proton/components/components/popper/interface';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import { BRAND_NAME, REFERRAL_EXPANSION_PROGRAM_MAX_AMOUNT } from '@proton/shared/lib/constants';

import illustration from '../illustrations/spotlight.svg';

interface Props {
    children?: ReactElement;
    anchorRef?: RefObject<HTMLElement>;
    show: boolean;
    onDisplayed?: () => void;
    onClose: () => void;
    originalPlacement?: PopperPlacement;
    style?: React.CSSProperties;
}

export const ReferralSpotlight = ({ children, show, onDisplayed, onClose, anchorRef, originalPlacement, style }: Props) => {

    const credits = getSimplePriceString('USD', REFERRAL_EXPANSION_PROGRAM_MAX_AMOUNT);
    return (
        <Spotlight
            show={show}
            onDisplayed={onDisplayed}
            onClose={onClose}
            style={{ ...style }}
            originalPlacement={originalPlacement}
            content={
                <>
                    <div className="flex flex-nowrap gap-3">
                        <div className="shrink-0">
                            <img src={illustration} alt="" className="w-custom" style={{ '--w-custom': '3rem' }} />
                        </div>
                        <div>
                            <p className="mt-0 mb-2 text-bold">{c('Spotlight').t`Earn up to ${credits} in credit`}</p>
                            <p className="m-0">{c('Spotlight')
                                .t`Get credits when the person you invite subscribes to a ${BRAND_NAME} plan.`}</p>
                        </div>
                    </div>
                </>
            }
            anchorRef={anchorRef}
        >
            {children}
        </Spotlight>
    );
};
