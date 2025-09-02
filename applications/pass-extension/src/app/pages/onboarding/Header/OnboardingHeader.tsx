import type { FC } from 'react';

import { PassTextLogo } from '@proton/pass/components/Layout/Logo/PassTextLogo';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import './OnboardingHeader.scss';

export const OnboardingHeader: FC = () => (
    <div className="flex items-center gap-2 mb-5">
        {
            <img
                src="/assets/protonpass-icon.svg"
                className="h-custom"
                style={{ '--h-custom': '2.25rem' }}
                alt={PASS_APP_NAME}
            />
        }
        <PassTextLogo key="pass-text-logo" className="pass-onboarding--brand-text ml-2 shrink-0 logo" />
    </div>
);
