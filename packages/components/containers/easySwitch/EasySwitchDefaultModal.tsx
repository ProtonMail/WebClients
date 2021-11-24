import React, { useMemo } from 'react';
import { c } from 'ttag';

import { Address } from '@proton/shared/lib/interfaces';
import { ImportType, NON_OAUTH_PROVIDER } from '@proton/shared/lib/interfaces/EasySwitch';
import { noop } from '@proton/shared/lib/helpers/function';
import {
    DEFAULT_CALENDAR_USER_SETTINGS,
    getDefaultCalendar,
    getProbablyActiveCalendars,
} from '@proton/shared/lib/calendar/calendar';
import { partition } from '@proton/shared/lib/helpers/array';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { getIsPersonalCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';

import mailIllu from '@proton/styles/assets/img/import/importTypes/mail.svg';
import calendarIllu from '@proton/styles/assets/img/import/importTypes/calendar.svg';
import contactsIllu from '@proton/styles/assets/img/import/importTypes/contacts.svg';

import { Button, ButtonProps, FormModal, Loader, Tooltip } from '../../components';
import { useCalendars, useCalendarUserSettings, useModals } from '../../hooks';

import ImportMailModal from './mail/modals/ImportMailModal';
import { ImportModal as ImportCalendarModal } from '../calendar/importModal';
import ImportContactsModal from '../contacts/import/ImportModal';

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
}

const EasySwitchDefaultModal = ({
    addresses,
    onClose = noop,
    provider = NON_OAUTH_PROVIDER.DEFAULT,
    ...rest
}: Props) => {
    const { createModal } = useModals();

    const [calendars, loadingCalendars] = useCalendars();
    const [calendarUserSettings = DEFAULT_CALENDAR_USER_SETTINGS, loadingCalendarUserSettings] =
        useCalendarUserSettings();

    const memoizedCalendars = useMemo(() => calendars || [], [calendars]);

    const { activeCalendars } = useMemo(() => {
        return {
            calendars: memoizedCalendars,
            activeCalendars: getProbablyActiveCalendars(memoizedCalendars),
        };
    }, [calendars]);

    const [personalActiveCalendars] = partition<Calendar>(activeCalendars, getIsPersonalCalendar);

    const defaultCalendar = getDefaultCalendar(personalActiveCalendars, calendarUserSettings.DefaultCalendarID);

    const canImportCalendars = !!personalActiveCalendars.length;

    const handleCancel = () => onClose();

    const titleRenderer = () => {
        return c('Title').t`Select what to import`;
    };

    const isLoading = loadingCalendars || loadingCalendarUserSettings;

    const handleClick = (importType: ImportType) => {
        if (provider === NON_OAUTH_PROVIDER.DEFAULT) {
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
            return;
        }

        createModal(
            <EasySwitchInstructionsModal
                importType={importType}
                addresses={addresses}
                provider={provider}
                defaultCalendar={defaultCalendar}
                activeCalendars={activeCalendars}
            />
        );
        onClose();
    };

    const calendarButton = (
        <ImportTypeButton
            importType={ImportType.CALENDAR}
            disabled={!canImportCalendars}
            onClick={() => handleClick(ImportType.CALENDAR)}
        />
    );

    return (
        <FormModal
            title={titleRenderer()}
            submit={null}
            close={c('Action').t`Cancel`}
            onClose={handleCancel}
            className="easy-switch-modal"
            {...rest}
        >
            {isLoading ? (
                <Loader />
            ) : (
                <>
                    <div className="mb2">{c('Info').t`What do you want to import?`}</div>
                    <div className="import-buttons mb1">
                        <ImportTypeButton importType={ImportType.MAIL} onClick={() => handleClick(ImportType.MAIL)} />
                        {!canImportCalendars ? (
                            <Tooltip
                                title={c('Info').t`You need to have an active personal calendar to import your events.`}
                            >
                                <span>{calendarButton}</span>
                            </Tooltip>
                        ) : (
                            calendarButton
                        )}
                        <ImportTypeButton
                            importType={ImportType.CONTACTS}
                            onClick={() => handleClick(ImportType.CONTACTS)}
                        />
                    </div>
                </>
            )}
        </FormModal>
    );
};

export default EasySwitchDefaultModal;
