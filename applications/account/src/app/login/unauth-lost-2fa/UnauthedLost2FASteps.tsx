import { c } from 'ttag';

import { LoaderPage } from '@proton/components/index';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import { UserNameWithIcon } from '../../components/username/UserNameWithIcon';
import type { Render, RenderProps } from '../LoginRender';
import { useUnauthLost2FA } from './UnauthedLost2FAContainer';
import { ErrorStep } from './steps/ErrorStep';
import { NoMethodsStep } from './steps/NoMethodsStep';
import { TwoFADisabledStep } from './steps/TwoFADisabledStep';
import { RequestTotpBackupCodesStep } from './steps/requestTotpBackupCodes/RequestTotpBackupCodesStep';
import { VerifyOwnershipWithEmailStep } from './steps/verifyOwnershipWithEmail/VerifyOwnershipWithEmailStep';
import { VerifyOwnershipWithPhoneStep } from './steps/verifyOwnershipWithPhone/VerifyOwnershipWithPhoneStep';

export interface UnauthedLost2FAStepsProps {
    render: Render;
    toApp?: APP_NAMES;
    username: string;
}

export const UnauthedLost2FASteps = ({ render, toApp, username }: UnauthedLost2FAStepsProps) => {
    const { useUnauthLost2FAActorRef, useUnauthLost2FASelector } = useUnauthLost2FA();
    const snapshot = useUnauthLost2FASelector((snapshot) => snapshot);

    const { send } = useUnauthLost2FAActorRef();

    const canGoBack = useUnauthLost2FASelector((snapshot) => snapshot.can({ type: 'back' }));
    const handleBack = canGoBack ? () => send({ type: 'back' }) : undefined;

    const renderStepLayout = ({ content, title }: { content: RenderProps['content']; title: RenderProps['title'] }) => {
        return render({
            toApp,
            onBack: handleBack,
            title,
            subTitle: <UserNameWithIcon username={username} />,
            content,
        });
    };

    if (snapshot.matches('request totp backup codes')) {
        return renderStepLayout({
            title: c('Title').t`Use backup recovery code`,
            content: <RequestTotpBackupCodesStep />,
        });
    }

    if (snapshot.matches('verify ownership with email')) {
        return renderStepLayout({
            title: c('Title').t`Disable two-factor authentication?`,
            content: <VerifyOwnershipWithEmailStep />,
        });
    }

    if (snapshot.matches('verify ownership with phone')) {
        return renderStepLayout({
            title: c('Title').t`Disable two-factor authentication?`,
            content: <VerifyOwnershipWithPhoneStep />,
        });
    }

    if (snapshot.matches('totp backup code provided')) {
        return <LoaderPage />;
    }

    if (snapshot.matches('2fa-disabled')) {
        return renderStepLayout({
            title: c('Title').t`Two-factor authentication disabled`,
            content: <TwoFADisabledStep />,
        });
    }

    if (snapshot.matches('signin to continue')) {
        return <LoaderPage />;
    }

    if (snapshot.matches('no method to disable 2fa')) {
        return renderStepLayout({
            title: c('Title').t`Disable two-factor authentication?`,
            content: <NoMethodsStep />,
        });
    }

    if (
        snapshot.matches('phone ownership verification error') ||
        snapshot.matches('email ownership verification error')
    ) {
        return renderStepLayout({ title: c('Title').t`An error occurred`, content: <ErrorStep /> });
    }

    return null;
};
