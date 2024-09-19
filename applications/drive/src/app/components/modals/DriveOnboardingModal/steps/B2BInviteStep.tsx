import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { OnboardingContent, OnboardingStep } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import { useSettingsLink } from '@proton/components/components/link';
import { APPS, DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import driveB2BInvite from '@proton/styles/assets/img/illustrations/drive-onboarding-b2b-invite.svg';

import type { StepProps } from './interface';

type Props = {};

export const B2BInviteStep = ({ onNext }: StepProps<Props>) => {
    const goToSettings = useSettingsLink();

    return (
        <OnboardingStep>
            <OnboardingContent
                title={c('Onboarding Title').t`Invite team members`}
                description={
                    <ul className="unstyled my-8">
                        <li className="flex items-center gap-2">
                            <Icon name="users" />
                            {c('Onboarding Info').t`Share files & folders`}
                        </li>
                        <li className="flex items-center gap-2">
                            <Icon name="pencil" />
                            {c('Onboarding Info').t`Collaborate on documents`}
                        </li>
                        <li className="flex items-center gap-2">
                            <Icon name="lock" />
                            {c('Onboarding Info').t`Manage access`}
                        </li>
                    </ul>
                }
                img={<img src={driveB2BInvite} alt={DRIVE_APP_NAME} />}
            />
            <footer className="flex flex-nowrap items-center justify-center gap-4">
                <Button fullWidth size="medium" onClick={onNext}>
                    {c('Action').t`Later`}
                </Button>
                <Button
                    fullWidth
                    size="medium"
                    color="norm"
                    onClick={() => {
                        goToSettings('/multi-user-support', APPS.PROTONDRIVE, true);
                        onNext();
                    }}
                >
                    {c('Action').t`Invite`}
                </Button>
            </footer>
        </OnboardingStep>
    );
};
