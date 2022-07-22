import { Ref, useEffect, useImperativeHandle, useRef } from 'react';

import data from '@emoji-mart/data';
import { Picker } from 'emoji-mart';
import { c } from 'ttag';

import { DARK_THEMES } from '@proton/shared/lib/themes/themes';

import { useTheme } from '../../../containers/themes';
import ToolbarDropdown, { ToolbarDropdownAction } from './ToolbarDropdown';

import emojiPickerCss from './ToolbarEmojiDropdown.raw.scss';
import './ToolbarEmojiDropdown.scss';

export interface Emoji {
    id: string;
    name: string;
    native: string;
    unified: string;
    keywords: string[];
    shortcodes: string;
    emoticons: string[];
    aliases: string[];
}

const EmojiPicker = (props: any) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const picker = new Picker({ ...props, data, ref });

        // Inject custom CSS inside the custom elements of the emoji picker
        const style = document.createElement('style');
        style.innerHTML = emojiPickerCss;
        picker.shadowRoot?.appendChild(style);
    }, []);

    return <div ref={ref} />;
};

interface Props {
    onInsert: (emoji: Emoji) => void;
    openRef: Ref<() => void>;
}

const ToolbarEmojiDropdown = ({ onInsert, openRef }: Props) => {
    const dropdownRef = useRef<ToolbarDropdownAction>(null);

    const [theme] = useTheme();
    const isDarkTheme = DARK_THEMES.includes(theme);

    const handleSelect = (emoji: Emoji) => {
        onInsert(emoji);
        dropdownRef.current?.close();
    };

    useImperativeHandle(openRef, () => {
        return () => {
            dropdownRef.current?.open();
        };
    });

    return (
        <ToolbarDropdown
            ref={dropdownRef}
            noMaxSize
            content={'🙂'}
            className="flex-item-noshrink"
            title={c('Action').t`Emoji`}
            autoClose={false}
            autoCloseOutside={true}
        >
            <EmojiPicker
                autoFocus="true"
                onEmojiSelect={handleSelect}
                theme={isDarkTheme ? 'dark' : 'light'}
                set="native"
                skinTonePosition="none"
                previewPosition="none"
                perLine={8}
            />
        </ToolbarDropdown>
    );
};

export default ToolbarEmojiDropdown;
