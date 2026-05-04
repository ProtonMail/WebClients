import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcLockCheckFilled } from '@proton/icons/icons/IcLockCheckFilled';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

interface OnboardingPillProps {
    onClick: () => void;
    className?: string;
}

const OnboardingPill = ({ onClick, className }: OnboardingPillProps) => {
    return (
        // <div className="absolute bottom-0 right-0 mb-4 mr-4">
        <Button
            onClick={onClick}
            shape="ghost"
            color="weak"
            className={clsx('inline-flex flex-row flex-nowrap gap-2 items-center color-hint', className)}
        >
            <IcLockCheckFilled />
            <span className="text-sm">{c('collider_2025: Pill').t`Protected by ${BRAND_NAME}`}</span>
        </Button>
        // </div>
    );
};

export default OnboardingPill;
