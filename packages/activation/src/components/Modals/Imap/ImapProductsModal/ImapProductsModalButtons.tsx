import type { MouseEvent, ReactNode } from 'react';

import { c } from 'ttag';

import { ImportType } from '@proton/activation/src/interface';
import calendarIllustration from '@proton/styles/assets/img/import/importTypes/calendar.svg';
import contactsIllustration from '@proton/styles/assets/img/import/importTypes/contacts.svg';
import mailIllustration from '@proton/styles/assets/img/import/importTypes/mail.svg';
import clsx from '@proton/utils/clsx';

interface ImportTypeButtonProps {
    importType: ImportType;
    onClick: () => void;
    disabled: boolean;
    disabledText?: ReactNode;
}

const ImportTypeButton = ({ importType, onClick, disabled, disabledText }: ImportTypeButtonProps) => {
    const typeMap = {
        [ImportType.MAIL]: {
            title: c('Action').t`Import emails`,
            text: c('Label').t`Emails`,
            illustration: mailIllustration,
        },
        [ImportType.CALENDAR]: {
            title: c('Action').t`Import calendars`,
            text: c('Label').t`Calendars`,
            illustration: calendarIllustration,
        },
        [ImportType.CONTACTS]: {
            title: c('Action').t`Import contacts`,
            text: c('Label').t`Contacts`,
            illustration: contactsIllustration,
        },
    };

    // The button might be disabled, but CTAs inside should still be clickable
    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
        if (disabled) {
            e.preventDefault();
            return;
        }
        onClick?.();
    };

    return (
        <button
            aria-label={typeMap[importType].title}
            className={clsx([
                'flex flex-column p-4 w-full items-start text-left rounded',
                !disabled && 'relative interactive-pseudo-inset',
                disabled && 'cursor-not-allowed',
            ])}
            aria-disabled={disabled}
            onClick={handleClick}
            title={typeMap[importType].title}
            data-testid="MailModal:ProductButton"
            type="button"
        >
            <div className="flex flex-nowrap gap-4 items-center">
                <img
                    src={typeMap[importType].illustration}
                    alt=""
                    className={clsx(['w-custom ratio-square shrink-0', disabled && 'opacity-50'])}
                    style={{ '--w-custom': '2.5rem' }}
                />

                <span className={clsx(disabled && 'color-disabled')}>{typeMap[importType].text}</span>
            </div>
            {disabled && disabledText && (
                <div className="flex flex-nowrap gap-4 items-center">
                    <div className="block w-custom shrink-0" style={{ '--w-custom': '2.5rem' }}></div>
                    <span className="block text-sm color-weak">{disabledText}</span>
                </div>
            )}
        </button>
    );
};

export default ImportTypeButton;
