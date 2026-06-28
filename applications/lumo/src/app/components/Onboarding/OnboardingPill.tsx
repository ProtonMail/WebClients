import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { LumoIcon } from '../LumoIcon/LumoIcon';

import './OnboardingPill.scss';

interface OnboardingPillProps {
    onClick: () => void;
    className?: string;
}

const OnboardingPill = ({ onClick, className }: OnboardingPillProps) => {
    return (
        <Button
            onClick={onClick}
            shape="ghost"
            color="weak"
            className={clsx('lumo--onboarding-pill inline-flex flex-row flex-nowrap gap-2 items-center', className)}
        >
            <LumoIcon name="LockKeyhole" size={16} />
            <span>{c('collider_2025: Pill').t`Protected by ${BRAND_NAME}`}</span>
        </Button>
    );
};

export default OnboardingPill;
