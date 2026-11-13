import { useEffect, useRef } from 'react';

import data from '@emoji-mart/data';
import { Picker } from 'emoji-mart';

import { useFlag } from '@proton/unleash/useFlag';

import { getLumoEmojiPickerOptions } from '../../utils/lumoEmojis/lumoEmojiPicker';

import emojiPickerStyles from './EmojiPicker.raw.scss';

const EMOJI_MART_DEFAULT_EMOJI_BUTTON_SIZE = 36;

interface EmojiPickerProps {
    autoFocus: boolean;
    onEmojiSelect: (text: string) => void;
    set: string;
    skinTonePosition: string;
    previewPosition: string;
    perLine: number;
    emojiButtonSize?: number;
    showLumoSection?: boolean;
}

export const EmojiPicker = ({
    autoFocus,
    onEmojiSelect,
    set,
    skinTonePosition,
    previewPosition,
    perLine,
    emojiButtonSize = EMOJI_MART_DEFAULT_EMOJI_BUTTON_SIZE,
    showLumoSection = true,
}: EmojiPickerProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const isLumoEmojisEnabled = useFlag('MeetChatLumoEmojis');

    useEffect(() => {
        const picker = new Picker({
            ...getLumoEmojiPickerOptions(onEmojiSelect, { isLumoEmojisEnabled, showLumoSection }),
            autoFocus,
            set,
            skinTonePosition,
            previewPosition,
            perLine,
            emojiButtonSize,
            data,
            ref,
            theme: 'dark',
        }) as unknown as HTMLElement;

        const style = document.createElement('style');
        style.textContent = emojiPickerStyles;
        picker.shadowRoot?.appendChild(style);
    }, [
        autoFocus,
        emojiButtonSize,
        isLumoEmojisEnabled,
        showLumoSection,
        onEmojiSelect,
        perLine,
        previewPosition,
        set,
        skinTonePosition,
    ]);

    return <div ref={ref} />;
};
