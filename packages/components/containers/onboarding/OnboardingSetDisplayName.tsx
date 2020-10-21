import React from 'react';
import { c } from 'ttag';
import onboardingWelcome from 'design-system/assets/img/onboarding/onboarding-welcome.svg';
import onboardingWelcomeDark from 'design-system/assets/img/onboarding/onboarding-welcome-dark.svg';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';

import SignupLabelInputRow from '../signup/SignupLabelInputRow';
import { Label } from '../../components/label';
import { Input } from '../../components/input';
import OnboardingContent, { Props as OnboardingContentProps } from './OnboardingContent';

interface Props extends Omit<OnboardingContentProps, 'img' | 'text' | 'description'> {
    displayName: string;
    setDisplayName: (displayName: string) => void;
    displayNameError?: string;
    isSubmitted?: boolean;
}

const OnboardingSetDisplayName = ({ isSubmitted, displayName, setDisplayName, displayNameError, ...rest }: Props) => {
    return (
        <OnboardingContent
            description={c('Onboarding Proton')
                .t`Proton is your private space on the Internet. No one is reading your emails, monitoring your calendar events, or scanning your files. Your data is encrypted, and you’re in control.`}
            img={<img src={getLightOrDark(onboardingWelcome, onboardingWelcomeDark)} alt="Proton" />}
            text={c('Onboarding Proton')
                .t`Please choose a display name to finish setting up your account. (Other people will see this.)`}
            {...rest}
        >
            <div className="signLayout-container">
                <SignupLabelInputRow
                    label={<Label htmlFor="displayName">{c('Label').t`Display name`}</Label>}
                    input={
                        <Input
                            value={displayName}
                            onChange={({ target }) => setDisplayName(target.value)}
                            id="displayName"
                            placeholder={c('Placeholder').t`e.g. Julia Smith`}
                            isSubmitted={isSubmitted}
                            error={displayNameError}
                            autoFocus
                        />
                    }
                />
            </div>
        </OnboardingContent>
    );
};

export default OnboardingSetDisplayName;
