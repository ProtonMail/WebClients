import { type VFC, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { selectMostRecentInvite } from '@proton/pass/store/selectors/invites';
import type { MaybeNull } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import clsx from '@proton/utils/clsx';

import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { useInviteContext } from '../Invite/InviteContextProvider';
import { FreeTrialModal } from './FreeTrialModal';
import type { SpotlightMessageDefinition } from './SpotlightContent';
import { SpotlightContent } from './SpotlightContent';
import { InviteIcon } from './SpotlightIcon';

import './Spotlight.scss';

type SpotlightState = { open: boolean; message: MaybeNull<SpotlightMessageDefinition> };
type Props = {
    message: MaybeNull<SpotlightMessageDefinition>;
    trial: boolean;
};
export const Spotlight: VFC<Props> = (props) => {
    const timer = useRef<NodeJS.Timeout>();
    const [state, setState] = useState<SpotlightState>({ open: false, message: null });

    const { respondToInvite } = useInviteContext();

    const sharingEnabled = useFeatureFlag(PassFeature.PassSharingV1);
    const latestInvite = useSelector(selectMostRecentInvite);

    const inviteMessage = useMemo<MaybeNull<SpotlightMessageDefinition>>(
        () =>
            sharingEnabled && latestInvite && !latestInvite.fromNewUser
                ? {
                      id: latestInvite.token,
                      weak: true,
                      dense: false,
                      title: c('Title').t`Vault shared with you`,
                      message: c('Info').t`You're invited to a vault.`,
                      icon: InviteIcon,
                      action: {
                          label: c('Label').t`View details`,
                          type: 'button',
                          onClick: () => respondToInvite(latestInvite),
                      },
                  }
                : null,
        [latestInvite, respondToInvite]
    );

    useEffect(() => {
        const prev = state.message;
        const next = inviteMessage ?? props.message;

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
    }, [state.message?.id, inviteMessage?.id, props.message?.id]);

    useEffect(() => () => clearTimeout(timer.current), []);

    return (
        <>
            <div className={clsx('pass-spotlight-panel', !state.open && 'pass-spotlight-panel--hidden')}>
                {state.message && <SpotlightContent {...state.message} />}
            </div>
            <FreeTrialModal open={props.trial} onClose={() => props.message?.onClose?.()} />
        </>
    );
};
