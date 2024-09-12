import { c } from 'ttag';

import type { ImporterCalendar } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.interface';
import { Button } from '@proton/atoms/Button';
import type { ModalStateProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, PrimaryButton } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import CustomizeCalendarImportModalLimitReached from './CustomizeCalendarImportModalLimitReached';
import CustomizeCalendarImportModalTableHeader from './CustomizeCalendarImportModalTableHeader';
import CustomizeCalendarImportRow from './CustomizeCalendarImportRow';
import type { DerivedCalendarType } from './useCustomizeCalendarImportModal';

interface Props {
    modalProps: ModalStateProps;
    providerCalendarsState: ImporterCalendar[];
    derivedValues: DerivedCalendarType;
    activeWritableCalendars: VisualCalendar[];
    handleSubmit: () => void;
    handleCalendarToggle: (cal: ImporterCalendar) => void;
    handleMappingChange: (cal: ImporterCalendar, destinationCalendar?: VisualCalendar) => void;
}

const CustomizeCalendarImportModal = ({
    modalProps,
    providerCalendarsState,
    derivedValues,
    activeWritableCalendars,
    handleSubmit,
    handleCalendarToggle,
    handleMappingChange,
}: Props) => {
    const {
        canMerge,
        calendarLimitReached,
        calendarsToFixCount,
        calendarsToBeCreatedCount,
        selectedCalendarsCount,
        selectedCalendars,
        disabled,
    } = derivedValues;

    return (
        <ModalTwo {...modalProps} size="xlarge">
            <ModalTwoHeader title={c('Title').t`Customize calendar import`} />
            <ModalTwoContent>
                <div className="mb-4" data-testid="CustomizeCalendarImportModal:description">
                    {c('Info')
                        .t`Select which calendars to import. A new calendar will be created for each imported calendar according to the number of calendars available in your plan.`}
                    {canMerge &&
                        ` ${c('Info').t`You can also merge imported calendars with existing ${BRAND_NAME} calendars.`}`}
                </div>

                {calendarLimitReached && (
                    <CustomizeCalendarImportModalLimitReached
                        canMerge={canMerge}
                        calendarsToFixCount={calendarsToFixCount}
                    />
                )}
                <CustomizeCalendarImportModalTableHeader
                    calendarLimitReached={calendarLimitReached}
                    calendarsToBeCreatedCount={calendarsToBeCreatedCount}
                    selectedCalendarsTotal={selectedCalendarsCount}
                    selectedCalendars={selectedCalendars}
                />

                {providerCalendarsState.map((calendar) => (
                    <CustomizeCalendarImportRow
                        key={calendar.id}
                        calendar={calendar}
                        toggleChecked={handleCalendarToggle}
                        activeCalendars={activeWritableCalendars}
                        updateCalendarMapping={handleMappingChange}
                        calendarLimitReached={calendarLimitReached}
                    />
                ))}
            </ModalTwoContent>

            <ModalTwoFooter>
                <Button shape="outline" onClick={() => modalProps.onClose()}>{c('Action').t`Cancel`}</Button>
                <PrimaryButton disabled={disabled} onClick={handleSubmit}>{c('Action').t`Save`}</PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CustomizeCalendarImportModal;
