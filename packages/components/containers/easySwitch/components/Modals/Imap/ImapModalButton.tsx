import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Tooltip } from '@proton/components/components';
import calendarIllu from '@proton/styles/assets/img/import/importTypes/calendar.svg';
import contactsIllu from '@proton/styles/assets/img/import/importTypes/contacts.svg';
import mailIllu from '@proton/styles/assets/img/import/importTypes/mail.svg';

import { ImportType } from '../../../logic/types/shared.types';

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
            illustration: mailIllu,
        },
        [ImportType.CALENDAR]: {
            title: c('Action').t`Import calendars`,
            text: c('Label').t`Calendars`,
            illustration: calendarIllu,
        },
        [ImportType.CONTACTS]: {
            title: c('Action').t`Import contacts`,
            text: c('Label').t`Contacts`,
            illustration: contactsIllu,
        },
    };

    return (
        <Button
            aria-label={typeMap[importType].title}
            className="flex flex-align-center flex-justify-center pt1-5 pb1 pl2 pr2"
            color="weak"
            disabled={disabled}
            onClick={onClick}
            shape="outline"
            title={typeMap[importType].title}
            type="button"
        >
            <span className="flex flex-nowrap flex-column pl1 pr1">
                <img src={typeMap[importType].illustration} alt="" className="w5e mb1" />
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

const ImapModalButton = ({ importType, onClick, disabled, disabledTooltipTitle }: Props) => {
    const button = <ImportTypeButton importType={importType} onClick={onClick} disabled={disabled} />;

    return disabled ? (
        <Tooltip title={disabledTooltipTitle}>
            <span>{button}</span>
        </Tooltip>
    ) : (
        button
    );
};

export default ImapModalButton;
