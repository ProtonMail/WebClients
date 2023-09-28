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

type SpotlightState = { open: boolean; message: MaybeNull<SpotlightMessageDefinition> };

export const Spotlight: VFC = () => {
    const timer = useRef<NodeJS.Timeout>();
    const [state, setState] = useState<SpotlightState>({ open: false, message: null });

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

    useEffect(() => {
        const prev = state.message;
        const next = inviteMessage ?? onboarding.message;

        if (prev?.id !== next?.id) {
            setState((curr) => ({ ...curr, open: false }));
            timer.current = setTimeout(
                () =>
                    setState({
                        message: next,
                        open: next !== null,
                    }),
                500
            );
        }
    }, [state.message?.id, inviteMessage?.id, onboarding.message?.id]);

    useEffect(() => () => clearTimeout(timer.current), []);

    return (
        <>
            <div className={clsx('pass-spotlight-panel', !state.open && 'pass-spotlight-panel--hidden')}>
                {state.message && <SpotlightContent {...state.message} />}
            </div>
            <FreeTrialModal open={onboarding.trial} onClose={() => onboarding.message?.onClose?.()} />
        </>
    );
};
