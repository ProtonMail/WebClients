import { useRef } from 'react';

import { c } from 'ttag';

import Popper from '@proton/components/components/popper/Popper';
import usePopper from '@proton/components/components/popper/usePopper';
import { IcEmoji } from '@proton/icons/icons/IcEmoji';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectEmojiReactionPopupOpen, setEmojiReactionPopupOpen } from '@proton/meet/store/slices/uiStateSlice';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { EmojiReactionPopup } from '../EmojiReactionPopup/EmojiReactionPopup';

export const EmojiReactionButton = () => {
    const dispatch = useMeetDispatch();
    const emojiReactionPopupOpen = useMeetSelector(selectEmojiReactionPopupOpen);
    const anchorRef = useRef<HTMLButtonElement>(null);

    const { floating, position } = usePopper({
        reference: {
            mode: 'element',
            value: anchorRef.current,
        },
        isOpen: emojiReactionPopupOpen,
        originalPlacement: 'top',
        availablePlacements: ['top'],
        offset: 16,
    });

    return (
        <>
            <CircleButton
                anchorRef={anchorRef}
                IconComponent={IcEmoji}
                onClick={() => dispatch(setEmojiReactionPopupOpen(!emojiReactionPopupOpen))}
                variant={emojiReactionPopupOpen ? 'highlight' : 'default'}
                ariaLabel={c('Alt').t`Toggle emoji reactions`}
            />
            <Popper
                className="fixed w-fit-content h-fit-content z-up"
                divRef={floating}
                isOpen={emojiReactionPopupOpen}
                style={position}
            >
                <EmojiReactionPopup />
            </Popper>
        </>
    );
};
