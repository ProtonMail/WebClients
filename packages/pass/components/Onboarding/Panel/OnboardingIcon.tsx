import type { FC } from 'react';

import './OnboardingIcon.scss';

export const OnboardingIcon: FC<{ iconSrc: string }> = ({ iconSrc }) => {
    return (
        <div className="rounded onboarding-icon flex item-center shrink-0 justify-center">
            <img src={iconSrc} alt="" className="shrink-0" />
        </div>
    );
};
