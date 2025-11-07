import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';

interface OnboardingPillProps {
    onClick: () => void;
}

const OnboardingPill = ({ onClick }: OnboardingPillProps) => {
    return (
        <div className="absolute bottom-0 right-0 mb-4 mr-4">
            <Button
                onClick={onClick}
                shape="outline"
                pill
                color="weak"
                className="inline-flex flex-row flex-nowrap gap-2 items-center"
            >
                <Icon name="lock-check-filled" className="color-primary" />
                <span className="color-weak text-sm">{c('collider_2025: Pill').t`Protected by ${BRAND_NAME}`}</span>
            </Button>
        </div>
    );
};

export default OnboardingPill;
