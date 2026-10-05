import { useRef } from 'react';

import { supportsScreenSharing } from '@livekit/components-core';
import { c } from 'ttag';

import { IcCross } from '@proton/icons/icons/IcCross';
import { IcMeetChat } from '@proton/icons/icons/IcMeetChat';
import { IcMeetHand } from '@proton/icons/icons/IcMeetHand';
import { IcMeetParticipants } from '@proton/icons/icons/IcMeetParticipants';
import { IcMeetScreenShare } from '@proton/icons/icons/IcMeetScreenShare';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsLocalScreenShare } from '@proton/meet/store/slices/screenShareStatusSlice';
import { MeetingSideBars, toggleSideBarState } from '@proton/meet/store/slices/uiStateSlice';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import isTruthy from '@proton/utils/isTruthy';

import { useMeetContext } from '../../../contexts/MeetContext';
import { EMOJI_REACTIONS, type EmojiReaction, useEmojiReaction } from '../../../hooks/bridges/useEmojiReaction';
import { useRaiseHand } from '../../../hooks/bridges/useRaiseHand';
import type { LayoutOptionsState } from '../../ParticipantsLayout/LayoutSelector/useLayoutOptions';
import { SlideClosable } from '../../SlideClosable/SlideClosable';
import { LayoutDropdownItem } from './LayoutDropdownItem';
import { type MoreMenuAction, MoreMenuSections, type MoreMenuToggle } from './MoreMenuItems';

interface Props {
    onClose: () => void;
    toggles: MoreMenuToggle[];
    actions: MoreMenuAction[];
    layout?: LayoutOptionsState;
}

export const MoreMenuSheet = ({ onClose, toggles, actions, layout }: Props) => {
    const dispatch = useMeetDispatch();
    const { stopScreenShare, startScreenShare } = useMeetContext();
    const isSharing = useMeetSelector(selectIsLocalScreenShare);
    const { isHandRaised, toggleHand } = useRaiseHand();
    const sendEmojiReaction = useEmojiReaction();
    const contentRef = useRef<HTMLDivElement>(null);

    const meetingActions: MoreMenuAction[] = [
        {
            id: 'participants',
            Icon: IcMeetParticipants,
            label: c('Action').t`Participants`,
            onClick: () => dispatch(toggleSideBarState(MeetingSideBars.Participants)),
        },
        {
            id: 'chat',
            Icon: IcMeetChat,
            label: c('Action').t`Chat`,
            onClick: () => dispatch(toggleSideBarState(MeetingSideBars.Chat)),
        },
        {
            id: 'raise-hand',
            Icon: IcMeetHand,
            label: isHandRaised ? c('Action').t`Lower hand` : c('Action').t`Raise hand`,
            onClick: () => {
                void toggleHand();
            },
        },
        supportsScreenSharing() && {
            id: 'screen-share',
            Icon: IcMeetScreenShare,
            label: isSharing ? c('Action').t`Stop sharing` : c('Action').t`Share screen`,
            onClick: () => {
                if (isSharing) {
                    stopScreenShare();
                } else {
                    void startScreenShare();
                }
            },
        },
    ].filter(isTruthy);

    return (
        <SlideClosable onClose={onClose}>
            <div className="more-menu-sheet w-full border border-norm large-meet-radius user-select-none">
                <div
                    ref={contentRef}
                    className="more-menu-sheet-content large-meet-radius w-full pt-8 flex flex-column flex-nowrap max-h-custom"
                    style={{ '--max-h-custom': 'calc(100dvh - 6rem)' }}
                >
                    <div className="shrink-0 px-4 flex flex-column flex-nowrap gap-2">
                        {!isMobile() && (
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label={c('Action').t`Close`}
                                className="ml-auto cursor-pointer"
                            >
                                <IcCross className="color-hint" size={5} />
                            </button>
                        )}

                        <div className="color-weak">{c('Title').t`Quick reactions`}</div>
                        <div className="flex flex-nowrap justify-space-between gap-1">
                            {EMOJI_REACTIONS.map((emoji: EmojiReaction) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    className="emoji-reaction-button text-3xl w-custom h-custom flex items-center justify-center interactive border action-button-new rounded-full"
                                    style={{ '--w-custom': '2.75rem', '--h-custom': '2.75rem' }}
                                    onClick={() => {
                                        void sendEmojiReaction(emoji);
                                    }}
                                    aria-label={c('Action').t`React with ${emoji}`}
                                >
                                    <span aria-hidden="true">{emoji}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 px-4 pb-4 flex flex-column flex-nowrap gap-2 overflow-y-auto">
                        <div className="color-weak">{c('Title').t`Meeting actions`}</div>
                        <div className="flex flex-column flex-nowrap w-full">
                            <MoreMenuSections
                                leadingActions={meetingActions}
                                toggles={toggles}
                                layoutItem={
                                    layout && (
                                        <LayoutDropdownItem
                                            {...layout}
                                            containerRef={contentRef}
                                            onLayoutSelected={onClose}
                                        />
                                    )
                                }
                                actions={actions}
                                onClose={onClose}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </SlideClosable>
    );
};
