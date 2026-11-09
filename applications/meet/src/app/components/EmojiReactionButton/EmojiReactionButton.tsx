import { c } from 'ttag';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import { IcEmoji } from '@proton/icons/icons/IcEmoji';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { EmojiReactionPopup } from '../EmojiReactionPopup/EmojiReactionPopup';

export const EmojiReactionButton = () => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <CircleButton
                anchorRef={anchorRef}
                IconComponent={IcEmoji}
                onClick={toggle}
                variant={isOpen ? 'active' : 'default'}
                ariaLabel={c('Alt').t`Toggle emoji reactions`}
                ariaPressed={isOpen}
                ariaExpanded={isOpen}
                ariaHasPopup="true"
            />
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                className="meet-dropdown meet-radius border-card"
                originalPlacement="top"
                availablePlacements={['top', 'top-end', 'top-start']}
                offset={16}
                size={{ width: DropdownSizeUnit.Dynamic, maxWidth: DropdownSizeUnit.Viewport }}
                autoClose={false}
                aria-label={c('Label').t`Reactions`}
                noCaret
            >
                <EmojiReactionPopup onClose={close} />
            </Dropdown>
        </>
    );
};
