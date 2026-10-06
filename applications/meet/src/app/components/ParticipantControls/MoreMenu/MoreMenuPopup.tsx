import { type RefObject, useRef, useState } from 'react';

import { c } from 'ttag';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import { useParticipantCountIndicator } from '../../ParticipantsButton';
import type { LayoutOptionsState } from '../../ParticipantsLayout/LayoutSelector/useLayoutOptions';
import { LayoutSubmenuItem } from './LayoutSubmenuItem';
import { MoreMenuEmojiReactions } from './MoreMenuEmojiReactions';
import { type MoreMenuAction, MoreMenuSections, type MoreMenuToggle } from './MoreMenuItems';
import { useMeetingActions } from './useMeetingActions';

interface Props {
    isOpen: boolean;
    anchorRef: RefObject<HTMLButtonElement>;
    onClose: () => void;
    toggles: MoreMenuToggle[];
    actions: MoreMenuAction[];
    layout?: LayoutOptionsState;
    showMeetingActions?: boolean;
}

export const MoreMenuPopup = ({ isOpen, anchorRef, onClose, toggles, actions, layout, showMeetingActions }: Props) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [isLayoutSubmenuOpen, setIsLayoutSubmenuOpen] = useState(false);
    const { participants, raiseHand, screenShare } = useMeetingActions();
    const { totalParticipantCount, indicatorStatus } = useParticipantCountIndicator();

    const participantsWithCount: MoreMenuAction = {
        ...participants,
        rightContent: (
            <span
                className={clsx(
                    'indicator rounded-full flex justify-center items-center shrink-0 w-custom h-custom text-xs',
                    `indicator-${indicatorStatus}`
                )}
                style={{ '--w-custom': '1.5rem', '--h-custom': '1.5rem' }}
            >
                {totalParticipantCount}
            </span>
        ),
    };

    const leadingSections = showMeetingActions
        ? [[raiseHand], [screenShare, participantsWithCount].filter(isTruthy)]
        : undefined;

    return (
        <Dropdown
            isOpen={isOpen}
            anchorRef={anchorRef}
            onClose={onClose}
            className="more-menu-popup meet-dropdown meet-radius border-card"
            originalPlacement="top"
            availablePlacements={['top', 'top-end', 'top-start']}
            offset={16}
            size={{ width: '20rem', maxWidth: '20rem', maxHeight: DropdownSizeUnit.Viewport }}
            autoClose={false}
            autoCloseOutside={!isLayoutSubmenuOpen}
            aria-label={c('Label').t`More options`}
            noCaret
        >
            <div ref={menuRef} className="flex flex-column flex-nowrap items-start gap-0.5 py-3 px-2">
                <MoreMenuSections
                    headerItem={showMeetingActions && <MoreMenuEmojiReactions buttonSize="2.5rem" className="pb-2" />}
                    leadingSections={leadingSections}
                    toggles={toggles}
                    layoutItem={
                        layout && (
                            <LayoutSubmenuItem
                                {...layout}
                                menuRef={menuRef}
                                onOpenChange={setIsLayoutSubmenuOpen}
                                onCloseMenu={onClose}
                            />
                        )
                    }
                    actions={actions}
                    onClose={onClose}
                    dividerClassName="my-0.5"
                />
            </div>
        </Dropdown>
    );
};
