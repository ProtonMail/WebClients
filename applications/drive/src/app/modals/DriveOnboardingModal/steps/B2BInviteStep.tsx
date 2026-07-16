import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useSettingsLink } from '@proton/components';
import { IcLock } from '@proton/icons/icons/IcLock';
import { IcPencil } from '@proton/icons/icons/IcPencil';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import { APPS } from '@proton/shared/lib/constants';
import inviteImg from '@proton/styles/assets/img/onboarding/drive-v2-invite.png';

import { Actions, countActionWithTelemetry } from '../../../utils/telemetry';
import { Container } from '../Container';
import { IconList } from '../IconList';
import type { OnboardingProps } from '../interface';

export const B2BInviteStep = () => {
    return (
        <Container
            title={c('Onboarding Info').t`Invite team members`}
            subtitle={c('Onboarding Info').t`Work together`}
            image={inviteImg}
        >
            <IconList
                items={[
                    {
                        icon: <IcUsers />,
                        text: c('Onboarding Info').t`Share files & folders`,
                    },
                    {
                        icon: <IcPencil />,
                        text: c('Onboarding Info').t`Collaborate on documents`,
                    },
                    {
                        icon: <IcLock />,
                        text: c('Onboarding Info').t`Manage access`,
                    },
                ]}
            />
        </Container>
    );
};

export const B2BInviteStepButtons = ({ onNext }: OnboardingProps) => {
    const goToSettings = useSettingsLink();

    return (
        <div className="w-full flex justify-space-between">
            <Button
                size="large"
                shape="ghost"
                color="norm"
                onClick={() => {
                    void countActionWithTelemetry(Actions.OnboardingV2B2BInviteSkip);
                    onNext();
                }}
            >
                {c('Onboarding Action').t`Maybe later`}
            </Button>
            <Button
                size="large"
                color="norm"
                onClick={() => {
                    void countActionWithTelemetry(Actions.OnboardingV2B2BInvite);
                    goToSettings('/multi-user-support', APPS.PROTONDRIVE, true);
                    onNext();
                }}
            >
                {c('Onboarding Action').t`Invite members`}
            </Button>
        </div>
    );
};
