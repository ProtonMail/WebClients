import React from 'react';

import { c } from 'ttag';

import type { EasySwitchFeatureFlag } from '@proton/activation/src/interface';
import { ImportType } from '@proton/activation/src/interface';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import { Loader, ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components';
import { FeatureCode, useFeature } from '@proton/features';
import {
    getProbablyActiveCalendars,
    getVisualCalendars,
    getWritableCalendars,
} from '@proton/shared/lib/calendar/calendar';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/constants';

import ImapProductsModalButtons from './ImapProductsModalButtons';

interface Props {
    onClick: (importType: ImportType) => void;
    onClose: () => void;
}

const ImapProductsModal = ({ onClick, onClose }: Props) => {
    const { feature, loading: FFLoading } = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);
    const [calendars = [], calendarLoading] = useCalendars();
    const activeWritableCalendars = getWritableCalendars(getProbablyActiveCalendars(getVisualCalendars(calendars)));
    const loading = FFLoading || calendarLoading;

    return (
        <ModalTwo
            key="easy-switch-imap-modal"
            className="easy-switch-modal"
            size="large"
            open
            onClose={onClose}
            data-testid="MailModal:ProductModal"
        >
            <ModalTwoHeader title={c('Title').t`What would you like to import?`} />
            <ModalTwoContent className="mb-8">
                {loading ? (
                    <Loader />
                ) : (
                    <div>
                        <div className="mb-8">{c('Info').t`You can import one data type at a time.`}</div>
                        <div className="import-buttons">
                            <ImapProductsModalButtons
                                importType={ImportType.MAIL}
                                onClick={() => onClick(ImportType.MAIL)}
                                disabled={!feature?.Value?.OtherMail}
                                disabledTooltipTitle={c('Info').t`Temporarily unavailable. Please check back later.`}
                            />
                            <ImapProductsModalButtons
                                importType={ImportType.CALENDAR}
                                onClick={() => onClick(ImportType.CALENDAR)}
                                disabled={!feature?.Value?.OtherCalendar || activeWritableCalendars.length === 0}
                                disabledTooltipTitle={
                                    feature?.Value?.OtherCalendar
                                        ? c('Info')
                                              .t`To import events, first create a calendar in ${CALENDAR_APP_NAME}. This is where the events will appear after the import.`
                                        : c('Info').t`Temporarily unavailable. Please check back later.`
                                }
                            />
                            <ImapProductsModalButtons
                                importType={ImportType.CONTACTS}
                                onClick={() => onClick(ImportType.CONTACTS)}
                                disabled={!feature?.Value?.OtherContacts}
                                disabledTooltipTitle={c('Info').t`Temporarily unavailable. Please check back later.`}
                            />
                        </div>
                    </div>
                )}
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default ImapProductsModal;
