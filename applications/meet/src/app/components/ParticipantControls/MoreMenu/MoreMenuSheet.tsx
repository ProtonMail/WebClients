import { useRef } from 'react';

import { c } from 'ttag';

import { IcCross } from '@proton/icons/icons/IcCross';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import isTruthy from '@proton/utils/isTruthy';

import type { LayoutOptionsState } from '../../ParticipantsLayout/LayoutSelector/useLayoutOptions';
import { SlideClosable } from '../../SlideClosable/SlideClosable';
import { LayoutDropdownItem } from './LayoutDropdownItem';
import { MoreMenuEmojiReactions } from './MoreMenuEmojiReactions';
import { type MoreMenuAction, MoreMenuSections, type MoreMenuToggle } from './MoreMenuItems';
import { useMeetingActions } from './useMeetingActions';

interface Props {
    onClose: () => void;
    toggles: MoreMenuToggle[];
    actions: MoreMenuAction[];
    layout?: LayoutOptionsState;
}

export const MoreMenuSheet = ({ onClose, toggles, actions, layout }: Props) => {
    const { participants, chat, raiseHand, screenShare } = useMeetingActions();
    const contentRef = useRef<HTMLDivElement>(null);

    const meetingActions: MoreMenuAction[] = [participants, chat, raiseHand, screenShare].filter(isTruthy);

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
                        <MoreMenuEmojiReactions />
                    </div>

                    <div className="mt-4 px-4 pb-4 flex flex-column flex-nowrap gap-2 overflow-y-auto">
                        <div className="color-weak">{c('Title').t`Meeting actions`}</div>
                        <div className="flex flex-column flex-nowrap w-full">
                            <MoreMenuSections
                                leadingSections={[meetingActions]}
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
