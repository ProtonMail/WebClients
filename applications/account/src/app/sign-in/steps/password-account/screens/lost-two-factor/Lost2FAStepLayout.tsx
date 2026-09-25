import type { ReactNode } from 'react';

import { UserNameWithIcon } from '../../../../../components/username/UserNameWithIcon';
import { SignInStepLayout } from '../../../../components/SignInStepLayout';
import { Lost2FAContext } from './Lost2FAContext';
import { selectLost2FAUsername } from './state-machine/lost2FAStateMachine';

/**
 * The lost-2FA screens' frame: the account's username, and back unless the screen has none. Back stays on screen
 * while a code is checked, when the flow ignores it.
 */
export const Lost2FAStepLayout = ({
    title,
    hasBack = true,
    children,
}: {
    title: string;
    hasBack?: boolean;
    children: ReactNode;
}) => {
    const actorRef = Lost2FAContext.useActorRef();
    const username = Lost2FAContext.useSelector(selectLost2FAUsername);
    return (
        <SignInStepLayout
            title={title}
            subTitle={<UserNameWithIcon username={username} />}
            onBack={hasBack ? () => actorRef.send({ type: 'decision.back' }) : undefined}
        >
            {children}
        </SignInStepLayout>
    );
};
