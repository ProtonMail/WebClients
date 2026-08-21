import { useRef } from 'react';

import { c } from 'ttag';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownCaret from '@proton/components/components/dropdown/DropdownCaret';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import clsx from '@proton/utils/clsx';

import { OptionButton } from '../../atoms/OptionButton/OptionButton';
import { useCaptionLanguage } from '../../hooks/captions/useCaptionLanguage';
import { getCaptionLanguageOptions } from '../../utils/captionLanguages';

import './CaptionLanguageSelect.scss';

const LABEL_ID = 'caption-language-label';
const BUTTON_ID = 'caption-language-button';

export const CaptionLanguageSelect = () => {
    const { language, setLanguage } = useCaptionLanguage();
    const { createNotification } = useNotifications();

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    // The panel is aligned to the row rather than to the button, so its trailing edge lands on the
    // edge of the settings column. Clicks on the button still count as anchor clicks, since the
    // button sits inside the row.
    const rowRef = useRef<HTMLDivElement>(null);

    const languageOptions = getCaptionLanguageOptions();
    const selectedOption = languageOptions.find((option) => option.value === language) ?? languageOptions[0];

    const handleSelect = async (value: string) => {
        close();

        if (value === selectedOption.value) {
            return;
        }

        try {
            await setLanguage(value);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to update caption language', error);
            createNotification({
                type: 'error',
                text: c('Error').t`Failed to update caption language. Please try again.`,
            });
        }
    };

    return (
        <div ref={rowRef} className="flex items-center justify-space-between flex-nowrap gap-2 w-full">
            <span id={LABEL_ID} className="text-lg color-norm">
                {c('Label').t`Spoken language`}
            </span>
            <button
                ref={anchorRef}
                id={BUTTON_ID}
                type="button"
                className="flex items-center flex-nowrap shrink-0 text-nowrap color-weak meet-font-weight"
                onClick={toggle}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-labelledby={`${LABEL_ID} ${BUTTON_ID}`}
            >
                {selectedOption.label}
                <DropdownCaret className="caption-language-caret shrink-0 ml-1" isOpen={isOpen} />
            </button>
            <Dropdown
                anchorRef={rowRef}
                isOpen={isOpen}
                onClose={close}
                // 272px wide, capped at 286px tall so the list scrolls.
                size={{ width: '17rem', maxWidth: '17rem', maxHeight: '17.875rem' }}
                className="caption-language-dropdown rounded-xxl"
                originalPlacement="bottom-end"
            >
                {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
                <div role="listbox" aria-labelledby={LABEL_ID} className="flex flex-column flex-nowrap p-2">
                    {languageOptions.map((option) => {
                        const isSelected = option.value === selectedOption.value;

                        return (
                            // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                            <OptionButton
                                key={option.value}
                                iconOnTheRight
                                showIcon={isSelected}
                                Icon={IcCheckmark}
                                label={option.label}
                                onClick={() => {
                                    void handleSelect(option.value);
                                }}
                                className={clsx('caption-language-option', isSelected && 'is-selected')}
                                role="option"
                                ariaSelected={isSelected}
                            />
                        );
                    })}
                </div>
            </Dropdown>
        </div>
    );
};
