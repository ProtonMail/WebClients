import React from 'react';
import { c } from 'ttag';

import { Address } from '@proton/shared/lib/interfaces';
import { ImportType, NON_OAUTH_PROVIDER } from '@proton/shared/lib/interfaces/EasySwitch';
import { noop } from '@proton/shared/lib/helpers/function';

import { FormModal } from '../../components';
import { useModals } from '../../hooks';

import ImportMailModal from './mail/modals/ImportMailModal';
import ImportContactsModal from '../contacts/import/ImportModal';

import YahooMailInstructions from '../../components/easySwitch/instructions/yahoo/YahooMailInstructions';
import YahooCalendarInstructions from '../../components/easySwitch/instructions/yahoo/YahooCalendarInstructions';
import YahooContactsInstructions from '../../components/easySwitch/instructions/yahoo/YahooContactsInstructions';

import OutlookMailInstructions from '../../components/easySwitch/instructions/outlook/OutlookMailInstructions';
import OutlookCalendarInstructions from '../../components/easySwitch/instructions/outlook/OutlookCalendarInstructions';
import OutlookContactsInstructions from '../../components/easySwitch/instructions/outlook/OutlookContactsInstructions';

import DefaultMailInstructions from '../../components/easySwitch/instructions/default/DefaultMailInstructions';
import DefaultCalendarInstructions from '../../components/easySwitch/instructions/default/DefaultCalendarInstructions';
import DefaultContactsInstructions from '../../components/easySwitch/instructions/default/DefaultContactsInstructions';

interface Props {
    onClose?: () => void;
    addresses: Address[];
    provider: NON_OAUTH_PROVIDER;
    importType: ImportType;
    onOpenCalendarModal: () => void;
}

const { DEFAULT, YAHOO, OUTLOOK } = NON_OAUTH_PROVIDER;

const EasySwitchInstructionsModal = ({
    addresses,
    onClose = noop,
    importType,
    provider,
    onOpenCalendarModal,
    ...rest
}: Props) => {
    const { createModal } = useModals();

    const handleCancel = () => onClose();

    const titleRenderer = () => {
        if (importType === ImportType.MAIL) {
            if (provider === YAHOO) {
                return c('Modal title').t`How to import emails from Yahoo`;
            }
            if (provider === OUTLOOK) {
                return c('Modal title').t`How to import emails from Outlook`;
            }
            if (provider === DEFAULT) {
                return c('Modal title').t`How to import emails from another service`;
            }
        }
        if (importType === ImportType.CALENDAR) {
            if (provider === YAHOO) {
                return c('Modal title').t`How to import calendars from Yahoo`;
            }
            if (provider === OUTLOOK) {
                return c('Modal title').t`How to import calendars from Outlook`;
            }
            if (provider === DEFAULT) {
                return c('Modal title').t`How to import calendars from another service`;
            }
        }
        if (importType === ImportType.CONTACTS) {
            if (provider === YAHOO) {
                return c('Modal title').t`How to import contacts from Yahoo`;
            }
            if (provider === OUTLOOK) {
                return c('Modal title').t`How to import contacts from Outlook`;
            }
            if (provider === DEFAULT) {
                return c('Modal title').t`How to import contacts from another service`;
            }
        }

        return null;
    };

    const handleSubmit = () => {
        if (importType === ImportType.MAIL) {
            createModal(<ImportMailModal addresses={addresses} provider={provider} />);
        }

        if (importType === ImportType.CALENDAR) {
            onOpenCalendarModal();
        }
        if (importType === ImportType.CONTACTS) {
            createModal(<ImportContactsModal />);
        }

        onClose();
    };

    const instructionsRenderer = () => {
        if (importType === ImportType.MAIL) {
            if (provider === YAHOO) {
                return <YahooMailInstructions />;
            }
            if (provider === OUTLOOK) {
                return <OutlookMailInstructions />;
            }
            if (provider === DEFAULT) {
                return <DefaultMailInstructions />;
            }
        }
        if (importType === ImportType.CALENDAR) {
            if (provider === YAHOO) {
                return <YahooCalendarInstructions />;
            }
            if (provider === OUTLOOK) {
                return <OutlookCalendarInstructions />;
            }
            if (provider === DEFAULT) {
                return <DefaultCalendarInstructions />;
            }
        }
        if (importType === ImportType.CONTACTS) {
            if (provider === YAHOO) {
                return <YahooContactsInstructions />;
            }
            if (provider === OUTLOOK) {
                return <OutlookContactsInstructions />;
            }
            if (provider === DEFAULT) {
                return <DefaultContactsInstructions />;
            }
        }

        return null;
    };

    return (
        <FormModal
            title={titleRenderer()}
            onSubmit={handleSubmit}
            submit={c('Action').t`Continue`}
            close={c('Action').t`Close`}
            onClose={handleCancel}
            className="easy-switch-modal"
            {...rest}
        >
            {instructionsRenderer()}
        </FormModal>
    );
};

export default EasySwitchInstructionsModal;
