import React from 'react';
import { c } from 'ttag';

import { Address } from '@proton/shared/lib/interfaces';
import { EasySwitchFeatureFlag, ImportType, NON_OAUTH_PROVIDER } from '@proton/shared/lib/interfaces/EasySwitch';
import { noop } from '@proton/shared/lib/helpers/function';

import mailIllu from '@proton/styles/assets/img/import/importTypes/mail.svg';
import calendarIllu from '@proton/styles/assets/img/import/importTypes/calendar.svg';
import contactsIllu from '@proton/styles/assets/img/import/importTypes/contacts.svg';

import { Button, ButtonProps, FormModal, Loader, Tooltip } from '../../components';
import { useModals } from '../../hooks';

import EasySwitchInstructionsModal from './EasySwitchInstructionsModal';

import './EasySwitchModal.scss';

interface ImportTypeButtonProps extends ButtonProps {
    importType: ImportType;
}

const ImportTypeButton = ({ importType, ...rest }: ImportTypeButtonProps) => {
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
            shape="outline"
            color="weak"
            type="button"
            aria-label={typeMap[importType].title}
            title={typeMap[importType].title}
            className="flex flex-align-center flex-justify-center pt1-5 pb1 pl2 pr2"
            {...rest}
        >
            <span className="flex flex-nowrap flex-column pl1 pr1">
                <img src={typeMap[importType].illustration} alt="" className="w5e mb1" />
                <span>{typeMap[importType].text}</span>
            </span>
        </Button>
    );
};

interface Props {
    onClose?: () => void;
    addresses: Address[];
    provider?: NON_OAUTH_PROVIDER;
    onOpenCalendarModal: () => void;
    canImportCalendars: boolean;
    isLoading: boolean;
    featureMap?: EasySwitchFeatureFlag;
}

const EasySwitchDefaultModal = ({
    addresses,
    onClose = noop,
    provider = NON_OAUTH_PROVIDER.DEFAULT,
    onOpenCalendarModal,
    canImportCalendars,
    isLoading,
    featureMap,
    ...rest
}: Props) => {
    const isEasySwitchMailEnabled = featureMap?.OtherMail;
    const isEasySwitchContactsEnabled = featureMap?.OtherCalendar;
    const isEasySwitchCalendarEnabled = featureMap?.OtherContacts;

    const { createModal } = useModals();

    const handleCancel = () => onClose();

    const handleClick = (importType: ImportType) => {
        createModal(
            <EasySwitchInstructionsModal
                importType={importType}
                addresses={addresses}
                provider={provider}
                onOpenCalendarModal={onOpenCalendarModal}
            />
        );
        onClose();
    };

    const buttonRenderer = (importType: ImportType) => {
        let isDisabled = false;
        let title = c('Info').t`Temporarily unavailable. Please check back later.`;

        switch (importType) {
            case ImportType.MAIL:
                isDisabled = !isEasySwitchMailEnabled;
                break;
            case ImportType.CALENDAR:
                isDisabled = !isEasySwitchCalendarEnabled || !canImportCalendars;
                if (isEasySwitchCalendarEnabled) {
                    title = c('Info').t`You need to have an active personal calendar to import your events.`;
                }
                break;
            case ImportType.CONTACTS:
                isDisabled = !isEasySwitchContactsEnabled;
                break;
            default:
                break;
        }

        const button = (
            <ImportTypeButton importType={importType} onClick={() => handleClick(importType)} disabled={isDisabled} />
        );

        return isDisabled ? (
            <Tooltip title={title}>
                <span>{button}</span>
            </Tooltip>
        ) : (
            button
        );
    };

    return (
        <FormModal
            title={c('Title').t`What would you like to import?`}
            submit={null}
            close={null}
            onClose={handleCancel}
            className="easy-switch-modal"
            {...rest}
        >
            {isLoading ? (
                <Loader />
            ) : (
                <>
                    <div className="mb2">{c('Info').t`You can import one data type at a time.`}</div>
                    <div className="import-buttons mb1">
                        {buttonRenderer(ImportType.MAIL)}
                        {buttonRenderer(ImportType.CALENDAR)}
                        {buttonRenderer(ImportType.CONTACTS)}
                    </div>
                </>
            )}
        </FormModal>
    );
};

export default EasySwitchDefaultModal;
