import React from 'react';
import { c } from 'ttag';

import { Address } from '@proton/shared/lib/interfaces';
import { ImportType, NON_OAUTH_PROVIDER } from '@proton/shared/lib/interfaces/EasySwitch';
import { noop } from '@proton/shared/lib/helpers/function';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';

import { FormModal } from '../../components';
import { useModals } from '../../hooks';

import ImportMailModal from './mail/modals/ImportMailModal';
import { ImportModal as ImportCalendarModal } from '../calendar/importModal';
import ImportContactsModal from '../contacts/import/ImportModal';

import YahooMailInstructions from '../../components/easySwitch/instructions/yahoo/YahooMailInstructions';
import YahooCalendarInstructions from '../../components/easySwitch/instructions/yahoo/YahooCalendarInstructions';
import YahooContactsInstructions from '../../components/easySwitch/instructions/yahoo/YahooContactsInstructions';

import OutlookMailInstructions from '../../components/easySwitch/instructions/outlook/OutlookMailInstructions';
import OutlookCalendarInstructions from '../../components/easySwitch/instructions/outlook/OutlookCalendarInstructions';
import OutlookContactsInstructions from '../../components/easySwitch/instructions/outlook/OutlookContactsInstructions';

interface Props {
    onClose?: () => void;
    addresses: Address[];
    provider: NON_OAUTH_PROVIDER;
    importType: ImportType;
    defaultCalendar?: Calendar;
    activeCalendars: Calendar[];
}

const { YAHOO, OUTLOOK } = NON_OAUTH_PROVIDER;

const EasySwitchInstructionsModal = ({
    addresses,
    onClose = noop,
    defaultCalendar,
    activeCalendars,
    importType,
    provider,
    ...rest
}: Props) => {
    const { createModal } = useModals();

    const handleCancel = () => onClose();

    const titleRenderer = () => {
        if (importType === ImportType.MAIL) {
            if (provider === YAHOO) {
                return c('Modal title').t`Prepare Yahoo Mail for import`;
            }
            if (provider === OUTLOOK) {
                return c('Modal title').t`Prepare Outlook.com for import`;
            }
        }
        if (importType === ImportType.CALENDAR) {
            if (provider === YAHOO) {
                return c('Modal title').t`Export your calendars from Yahoo`;
            }
            if (provider === OUTLOOK) {
                return c('Modal title').t`Export your calendars from Outlook`;
            }
        }
        if (importType === ImportType.CONTACTS) {
            if (provider === YAHOO) {
                return c('Modal title').t`Export your contacts from Yahoo`;
            }
            if (provider === OUTLOOK) {
                return c('Modal title').t`Export your contacts from Outlook`;
            }
        }

        return null;
    };

    const handleSubmit = () => {
        if (importType === ImportType.MAIL) {
            createModal(<ImportMailModal addresses={addresses} provider={provider} />);
        }

        if (importType === ImportType.CALENDAR && defaultCalendar) {
            createModal(<ImportCalendarModal defaultCalendar={defaultCalendar} calendars={activeCalendars} />);
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
        }
        if (importType === ImportType.CALENDAR) {
            if (provider === YAHOO) {
                return <YahooCalendarInstructions />;
            }
            if (provider === OUTLOOK) {
                return <OutlookCalendarInstructions />;
            }
        }
        if (importType === ImportType.CONTACTS) {
            if (provider === YAHOO) {
                return <YahooContactsInstructions />;
            }
            if (provider === OUTLOOK) {
                return <OutlookContactsInstructions />;
            }
        }

        return null;
    };

    return (
        <FormModal
            title={titleRenderer()}
            onSubmit={handleSubmit}
            submit={c('Action').t`Continue to import`}
            close={c('Action').t`Cancel`}
            onClose={handleCancel}
            className="import-modal"
            {...rest}
        >
            {instructionsRenderer()}
        </FormModal>
    );
};

export default EasySwitchInstructionsModal;
