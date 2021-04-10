import React from 'react';
import { c } from 'ttag';
import onboardingWelcome from 'design-system/assets/img/onboarding/proton-welcome.svg';

import { Label } from '../../components/label';
import { Input, LegacyInputField } from '../../components/input';
import OnboardingContent, { Props as OnboardingContentProps } from './OnboardingContent';

interface Props extends Omit<OnboardingContentProps, 'img' | 'text' | 'description'> {
    displayName: string;
    hideDisplayName?: boolean;
    setDisplayName: (displayName: string) => void;
    displayNameError?: string;
    isSubmitted?: boolean;
}

const OnboardingSetDisplayName = ({
    isSubmitted,
    displayName,
    hideDisplayName,
    setDisplayName,
    displayNameError,
    ...rest
}: Props) => {
    return (
        <OnboardingContent
            description={c('Onboarding Proton')
                .t`Proton is your private space on the Internet. No one is reading your emails, monitoring your calendar events, or scanning your files. Your data is encrypted, and you’re in control.`}
            img={<img src={onboardingWelcome} alt="Proton" />}
            text={
                !hideDisplayName &&
                c('Onboarding Proton')
                    .t`Please choose a display name to finish setting up your account. (Other people will see this.)`
            }
            {...rest}
        >
            {!hideDisplayName && (
                <div className="sign-layout-container">
                    <LegacyInputField
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
            )}
        </OnboardingContent>
    );
};

export default OnboardingSetDisplayName;
