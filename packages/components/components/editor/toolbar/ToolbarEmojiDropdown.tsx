import { Ref, useImperativeHandle, useRef } from 'react';
import { BaseEmoji, Picker } from 'emoji-mart';
import { c } from 'ttag';
import { DARK_THEMES } from '@proton/shared/lib/themes/themes';
import ToolbarDropdown, { ToolbarDropdownAction } from './ToolbarDropdown';
import { useTheme } from '../../../containers/themes';

import 'emoji-mart/css/emoji-mart.css';
import './ToolbarEmojiDropdown.scss';

interface Props {
    onInsert: (emoji: BaseEmoji) => void;
    openRef: Ref<() => void>;
}

const ToolbarEmojiDropdown = ({ onInsert, openRef }: Props) => {
    const dropdownRef = useRef<ToolbarDropdownAction>(null);

    const [theme] = useTheme();
    const isDarkTheme = DARK_THEMES.includes(theme);

    const handleSelect = (emoji: BaseEmoji) => {
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
            <div className="proton-emoji-mart">
                <Picker
                    autoFocus
                    onSelect={handleSelect}
                    theme={isDarkTheme ? 'dark' : 'light'}
                    title="Choose your emoji"
                    native
                    showSkinTones={false}
                    showPreview={false}
                />
            </div>
        </ToolbarDropdown>
    );
};

export default ToolbarEmojiDropdown;
