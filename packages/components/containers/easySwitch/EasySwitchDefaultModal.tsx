import React from 'react';
import { c } from 'ttag';

import { Address } from '@proton/shared/lib/interfaces';
import { ImportType, NON_OAUTH_PROVIDER } from '@proton/shared/lib/interfaces/EasySwitch';
import { noop } from '@proton/shared/lib/helpers/function';

import mailIllu from '@proton/styles/assets/img/import/importTypes/mail.svg';
import calendarIllu from '@proton/styles/assets/img/import/importTypes/calendar.svg';
import contactsIllu from '@proton/styles/assets/img/import/importTypes/contacts.svg';

import ImportMailModal from './mail/modals/ImportMailModal';
import ImportContactsModal from '../contacts/import/ImportModal';

import { Button, FormModal } from '../../components';
import { useModals } from '../../hooks';

import './EasySwitchModal.scss';

interface ImportTypeButtonProps {
    type: ImportType;
    onClick: () => void;
}

const ImportTypeButton = ({ type, onClick }: ImportTypeButtonProps) => {
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
            aria-label={typeMap[type].title}
            title={typeMap[type].title}
            className="flex flex-align-center flex-justify-center pt1-5 pb1 pl2 pr2"
            onClick={onClick}
        >
            <span className="flex flex-nowrap flex-column pl1 pr1">
                <img src={typeMap[type].illustration} alt="" className="w5e mb1" />
                <span>{typeMap[type].text}</span>
            </span>
        </Button>
    );
};

interface Props {
    onClose?: () => void;
    addresses: Address[];
    provider?: NON_OAUTH_PROVIDER;
}

const EasySwitchDefaultModal = ({
    addresses,
    onClose = noop,
    provider = NON_OAUTH_PROVIDER.DEFAULT,
    ...rest
}: Props) => {
    const { createModal } = useModals();

    const handleCancel = () => onClose();

    const titleRenderer = () => {
        return c('Title').t`Select what to import`;
    };

    return (
        <FormModal
            title={titleRenderer()}
            submit={null}
            close={<Button shape="outline" onClick={handleCancel}>{c('Action').t`Cancel`}</Button>}
            onClose={handleCancel}
            className="easy-switch-modal"
            {...rest}
        >
            <div className="mb2">{c('Info').t`What do you want to import?`}</div>
            <div className="import-buttons mb1">
                <ImportTypeButton
                    type={ImportType.MAIL}
                    onClick={() => {
                        createModal(<ImportMailModal addresses={addresses} providerInstructions={provider} />);
                        onClose();
                    }}
                />
                <ImportTypeButton
                    type={ImportType.CALENDAR}
                    onClick={() => {
                        alert('@todo');
                        // onClose();
                    }}
                />
                <ImportTypeButton
                    type={ImportType.CONTACTS}
                    onClick={() => {
                        createModal(<ImportContactsModal />);
                        onClose();
                    }}
                />
            </div>
        </FormModal>
    );
};

export default EasySwitchDefaultModal;
