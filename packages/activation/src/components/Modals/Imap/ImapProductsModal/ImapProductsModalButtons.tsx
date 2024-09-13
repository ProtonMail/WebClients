import { c } from 'ttag';

import { ImportType } from '@proton/activation/src/interface';
import { Button } from '@proton/atoms';
import { Tooltip } from '@proton/components';
import calendarIllustration from '@proton/styles/assets/img/import/importTypes/calendar.svg';
import contactsIllustration from '@proton/styles/assets/img/import/importTypes/contacts.svg';
import mailIllustration from '@proton/styles/assets/img/import/importTypes/mail.svg';

interface ImportTypeButtonProps {
    importType: ImportType;
    onClick: () => void;
    disabled: boolean;
}

const ImportTypeButton = ({ importType, onClick, disabled }: ImportTypeButtonProps) => {
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

    return (
        <Button
            aria-label={typeMap[importType].title}
            className="flex justify-center pt-5 pb-4 px-7"
            color="weak"
            disabled={disabled}
            onClick={onClick}
            shape="outline"
            title={typeMap[importType].title}
            type="button"
            data-testid="MailModal:ProductButton"
        >
            <span className="flex flex-nowrap flex-column px-4">
                <img
                    src={typeMap[importType].illustration}
                    alt=""
                    className="w-custom mb-4"
                    style={{ '--w-custom': '5em' }}
                />
                <span>{typeMap[importType].text}</span>
            </span>
        </Button>
    );
};

interface Props {
    importType: ImportType;
    onClick: () => void;
    disabled: boolean;
    disabledTooltipTitle: string;
}

const ImapProductsModalButtons = ({ importType, onClick, disabled, disabledTooltipTitle }: Props) => {
    const button = <ImportTypeButton importType={importType} onClick={onClick} disabled={disabled} />;

    return disabled ? (
        <Tooltip title={disabledTooltipTitle}>
            <span>{button}</span>
        </Tooltip>
    ) : (
        button
    );
};

export default ImapProductsModalButtons;
