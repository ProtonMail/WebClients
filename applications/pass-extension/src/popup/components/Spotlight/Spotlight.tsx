import { type VFC, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { selectMostRecentInvite } from '@proton/pass/store/selectors/invites';
import type { MaybeNull } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import { useInviteContext } from '../../context/invite/InviteContextProvider';
import { useOnboardingMessage } from '../../hooks/useOnboardingMessage';
import { FreeTrialModal } from './FreeTrialModal';
import type { SpotlightMessageDefinition } from './SpotlightContent';
import { SpotlightContent } from './SpotlightContent';
import { InviteIcon } from './SpotlightIcon';

import './Spotlight.scss';

export const Spotlight: VFC = () => {
    const timer = useRef<NodeJS.Timeout>();
    const [open, setOpen] = useState(false);
    const { acceptInvite } = useInviteContext();

    const latestInvite = useSelector(selectMostRecentInvite);
    const onboarding = useOnboardingMessage();

    const inviteMessage = useMemo<MaybeNull<SpotlightMessageDefinition>>(
        () =>
            latestInvite
                ? {
                      id: latestInvite.token,
                      weak: true,
                      dense: false,
                      title: c('Title').t`Shared vault invitation`,
                      message: c('Info').t`You've been invited to a vault. Click here to see the invitation.`,
                      icon: InviteIcon,
                      action: {
                          label: c('Label').t`Respond`,
                          type: 'button',
                          onClick: () => {
                              console.log(latestInvite);
                              acceptInvite(latestInvite);
                          },
                      },
                  }
                : null,
        [latestInvite, acceptInvite]
    );

    const [message, setMessage] = useState<MaybeNull<SpotlightMessageDefinition>>(null);

    useEffect(() => {
        clearTimeout(timer.current);
        const nextMessage = inviteMessage ?? onboarding.message;

        setOpen(false);

        if (nextMessage) {
            timer.current = setTimeout(() => {
                setOpen(true);
                setMessage(nextMessage);
            }, 250);
        } else setMessage(null);

        return () => clearTimeout(timer.current);
    }, [message, inviteMessage?.id, onboarding.message?.id]);

    return (
        <>
            <div className={clsx('pass-spotlight-panel', !open && 'pass-spotlight-panel--hidden')}>
                {message && <SpotlightContent {...message} />}
            </div>
            <FreeTrialModal open={onboarding.trial} onClose={() => onboarding.message?.onClose?.()} />
        </>
    );
};
