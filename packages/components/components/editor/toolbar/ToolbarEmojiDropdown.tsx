import type { Ref } from 'react';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import data from '@emoji-mart/data';
import { Picker } from 'emoji-mart';
import { c } from 'ttag';

import { Icon } from '@proton/components/components';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import { COMPOSER_TOOLBAR_ICON_SIZE } from '@proton/shared/lib/constants';
import { getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import { locales } from '@proton/shared/lib/i18n/locales';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { useTheme } from '../../../containers/themes';
import type { ToolbarDropdownAction } from './ToolbarDropdown';
import ToolbarDropdown from './ToolbarDropdown';

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
    userSettings?: UserSettings;
}

const ToolbarEmojiDropdown = ({ onInsert, openRef, className, userSettings }: Props) => {
    const theme = useTheme();
    const dropdownRef = useRef<ToolbarDropdownAction>(null);
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
                .catch(() => {
                    // if file is not present, nothing more to do, added catch to remove error from logs
                    noop();
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
