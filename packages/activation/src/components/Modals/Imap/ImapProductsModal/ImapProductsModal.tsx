import React from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import BYOEClaimProtonAddressModal from '@proton/activation/src/components/Modals/BYOEClaimProtonAddressModal/BYOEClaimProtonAddressModal';
import type { EasySwitchFeatureFlag } from '@proton/activation/src/interface';
import { ImportType } from '@proton/activation/src/interface';
import { Button, InlineLinkButton } from '@proton/atoms';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import { Loader, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, useModalState } from '@proton/components';
import useGetOrCreateCalendarAndSettings from '@proton/components/hooks/useGetOrCreateCalendarAndSettings';
import { FeatureCode, useFeature } from '@proton/features';
import {
    getProbablyActiveCalendars,
    getVisualCalendars,
    getWritableCalendars,
} from '@proton/shared/lib/calendar/calendar';
import { APPS, BRAND_NAME, CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import { getIsBYOEOnlyAccount } from '@proton/shared/lib/helpers/address';

import ImportTypeButton from './ImapProductsModalButtons';

interface Props {
    onClick: (importType: ImportType) => void;
    onClose: () => void;
}

const ImapProductsModal = ({ onClick, onClose }: Props) => {
    const { feature, loading: FFLoading } = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);
    const [addresses] = useAddresses();
    const [calendars = [], calendarLoading] = useCalendars();
    const activeWritableCalendars = getWritableCalendars(getProbablyActiveCalendars(getVisualCalendars(calendars)));
    const loading = FFLoading || calendarLoading;
    const getOrCreateCalendarAndSettings = useGetOrCreateCalendarAndSettings();

    const [claimProtonAddressModalProps, setClaimProtonAddressModalOpen, renderClaimProtonAddressModal] =
        useModalState();

    const getCalendarDisabledText = () => {
        if (getIsBYOEOnlyAccount(addresses)) {
            const claimAddressButton = (
                <InlineLinkButton onClick={() => setClaimProtonAddressModalOpen(true)}>
                    {c('Action').t`Get a free ${BRAND_NAME} address`}
                </InlineLinkButton>
            );

            /*translator: full sentence is "Proton calendar requires a Proton address for secure event sync and encryption. Create a free Proton address."*/
            return c('Info')
                .jt`${CALENDAR_APP_NAME} requires a ${BRAND_NAME} address for secure event sync and encryption. ${claimAddressButton}.`;
        }

        if (feature?.Value?.OtherCalendar) {
            return c('Info')
                .t`To import events, first create a calendar in ${CALENDAR_APP_NAME}. This is where the events will appear after the import.`;
        }

        return c('Info').t`Temporarily unavailable. Please check back later.`;
    };

    return (
        <>
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
                            <div className="mb-6 color-weak">{c('Info')
                                .t`You can import one data type at a time.`}</div>
                            <div className="import-buttons">
                                <ImportTypeButton
                                    importType={ImportType.MAIL}
                                    onClick={() => onClick(ImportType.MAIL)}
                                    disabled={!feature?.Value?.OtherMail}
                                    disabledText={c('Info').t`Temporarily unavailable. Please check back later.`}
                                />
                                <hr className="m-0" />
                                <ImportTypeButton
                                    importType={ImportType.CONTACTS}
                                    onClick={() => onClick(ImportType.CONTACTS)}
                                    disabled={!feature?.Value?.OtherContacts}
                                    disabledText={c('Info').t`Temporarily unavailable. Please check back later.`}
                                />
                                <hr className="m-0" />
                                <ImportTypeButton
                                    importType={ImportType.CALENDAR}
                                    onClick={() => onClick(ImportType.CALENDAR)}
                                    disabled={!feature?.Value?.OtherCalendar || activeWritableCalendars.length === 0}
                                    disabledText={getCalendarDisabledText()}
                                />
                            </div>
                        </div>
                    )}
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button shape="outline" onClick={onClose}>
                        {c('Action').t`Cancel`}
                    </Button>
                </ModalTwoFooter>
            </ModalTwo>

            {renderClaimProtonAddressModal && (
                <BYOEClaimProtonAddressModal
                    toApp={APPS.PROTONMAIL}
                    onCreateCalendar={getOrCreateCalendarAndSettings}
                    {...claimProtonAddressModalProps}
                />
            )}
        </>
    );
};

export default ImapProductsModal;
