import { c } from 'ttag';

import { IcLock } from '@proton/icons/icons/IcLock';
import { ForkType, requestFork } from '@proton/shared/lib/authentication/fork';
import { APPS } from '@proton/shared/lib/constants';

import { DashboardMeetingListTab } from './types';

import './GuestUserPrompt.scss';

interface GuestUserPromptProps {
    activeTab: DashboardMeetingListTab;
}

export const GuestUserPrompt = ({ activeTab }: GuestUserPromptProps) => {
    const handleSignIn = () => {
        requestFork({
            fromApp: APPS.PROTONMEET,
            forkType: ForkType.LOGIN,
            extra: {
                returnUrl: window.location.pathname.replace('/guest', '') + window.location.hash,
            },
        });
    };

    // translator: full sentence is "Create an account or Sign in to access your personal room and create new rooms"
    const createAnActionAction = (
        <span className="guest-user-prompt-action-link" key="create-account">{c('Info').t`Create an account`}</span>
    );

    // translator: full sentence is "Create an account or Sign in to access your personal room and create new rooms"
    const signInAction = <span className="guest-user-prompt-action-link" key="sign-in">{c('Info').t`Sign in`}</span>;

    // translator: full sentence is "Create an account or Sign in to schedule meetings"
    const myMeetingsSentence = c('Headline').jt`${createAnActionAction} or ${signInAction} to schedule meetings`;

    // translator: full sentence is ""Create an account or Sign in to access your personal room and create new rooms"
    const myRoomsSentence = c('Headline')
        .jt`${createAnActionAction} or ${signInAction} to access your personal room and create new rooms`;

    return (
        <div className="w-full flex items-center justify-center">
            <button
                className="guest-user-prompt w-custom rounded-xl color-norm flex items-center justify-center gap-2 p-4 md:text-base flex-nowrap text-center"
                style={{ '--w-custom': '80%' }}
                onClick={handleSignIn}
            >
                <IcLock className="guest-user-prompt-purple-text hidden md:block" />
                <span>{activeTab === DashboardMeetingListTab.TimeBased ? myMeetingsSentence : myRoomsSentence}</span>
            </button>
        </div>
    );
};
