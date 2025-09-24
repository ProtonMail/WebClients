import type { ReactElement, RefObject } from 'react';

import { c } from 'ttag';

import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import type { PopperPlacement } from '@proton/components/components/popper/interface';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import { BRAND_NAME } from '@proton/shared/lib/constants';

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

export const ReferralSpotlight = ({
    children,
    show,
    onDisplayed,
    onClose,
    anchorRef,
    originalPlacement,
    style,
}: Props) => {
    const [referralInfo] = useReferralInfo();
    const { maxRewardAmount } = referralInfo.uiData;

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
                            <p className="mt-0 mb-2 text-bold">{c('Spotlight')
                                .t`Earn up to ${maxRewardAmount} in credit`}</p>
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
