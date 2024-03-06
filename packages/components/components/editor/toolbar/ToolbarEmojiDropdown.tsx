import { Ref, useEffect, useImperativeHandle, useRef, useState } from 'react';

import data from '@emoji-mart/data';
import { Picker } from 'emoji-mart';
import { c } from 'ttag';

import { DropdownSizeUnit, Icon } from '@proton/components/components';
import { useUserSettings } from '@proton/components/hooks';
import { COMPOSER_TOOLBAR_ICON_SIZE } from '@proton/shared/lib/constants';
import { getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import { locales } from '@proton/shared/lib/i18n/locales';
import clsx from '@proton/utils/clsx';

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
        picker.injectStyles(emojiPickerCss);
    }, []);

    return <div ref={ref} />;
};

interface Props {
    onInsert: (emoji: Emoji) => void;
    openRef: Ref<() => void>;
    className?: string;
}

const ToolbarEmojiDropdown = ({ onInsert, openRef, className }: Props) => {
    const theme = useTheme();
    const dropdownRef = useRef<ToolbarDropdownAction>(null);
    const [userSettings] = useUserSettings();
    const [pickerTranslationsLoading, setPickerTranslationsLoading] = useState(true);
    const [pickerTranslations, setPickerTranslations] = useState(undefined);

    // fr_FR => need only fr for locale
    const localeCode = getClosestLocaleCode(userSettings?.Locale, locales).slice(0, 2);

    const handleSelect = (emoji: Emoji) => {
        onInsert(emoji);
        dropdownRef.current?.close();
    };

    useImperativeHandle(openRef, () => {
        return () => {
            dropdownRef.current?.open();
        };
    });

    useEffect(() => {
        if (localeCode !== 'en') {
            void import(`@emoji-mart/data/i18n/${localeCode}.json`)
                .then((i18n) => {
                    setPickerTranslations(i18n);
                })
                .finally(() => {
                    setPickerTranslationsLoading(false);
                });
        } else {
            setPickerTranslationsLoading(false);
        }
    }, [localeCode]);

    return pickerTranslationsLoading === true ? null : (
        <ToolbarDropdown
            ref={dropdownRef}
            dropdownSize={{ maxWidth: DropdownSizeUnit.Viewport, maxHeight: DropdownSizeUnit.Viewport }}
            content={<Icon name="emoji" size={COMPOSER_TOOLBAR_ICON_SIZE} alt={c('Action').t`Emoji`} />}
            className={clsx(['shrink-0', className])}
            title={c('Action').t`Emoji`}
            autoClose={false}
            autoCloseOutside={true}
            data-testid="editor-emoji-picker"
        >
            <EmojiPicker
                autoFocus="true"
                onEmojiSelect={handleSelect}
                theme={theme.information.dark ? 'dark' : 'light'}
                set="native"
                skinTonePosition="none"
                previewPosition="none"
                perLine={8}
                i18n={pickerTranslations}
            />
        </ToolbarDropdown>
    );
};

export default ToolbarEmojiDropdown;
