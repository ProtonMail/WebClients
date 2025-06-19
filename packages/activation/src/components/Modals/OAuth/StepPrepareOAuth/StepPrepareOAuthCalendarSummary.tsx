import { c, msgid } from 'ttag';

import { updateCalendarData } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '@proton/activation/src/logic/store';
import { Button } from '@proton/atoms';
import { Icon, useModalState } from '@proton/components';
import isTruthy from '@proton/utils/isTruthy';

import CustomizeCalendarImportModal from './CustomizeCalendarImportModal/CustomizeCalendarImportModal';
import useCustomizeCalendarImportModal from './CustomizeCalendarImportModal/useCustomizeCalendarImportModal';

interface Props {
    isSelected: boolean;
}

const StepPrepareCalendarSummary = ({ isSelected }: Props) => {
    const [displayCustomizeModalProps, handleDisplayCustomizeModal, renderCustomizeModal] = useModalState();

    const dispatch = useEasySwitchDispatch();

    const {
        providerCalendarsState,
        derivedValues,
        activeWritableCalendars,
        handleCalendarToggle,
        handleMappingChange,
    } = useCustomizeCalendarImportModal();

    const { calendarsToBeCreatedCount, totalCalendarsCount, calendarsToBeMergedCount } = derivedValues;
    const calendarCount = calendarsToBeCreatedCount + calendarsToBeMergedCount;

    if (!isSelected) {
        return null;
    }

    const handleSubmit = () => {
        dispatch(updateCalendarData(providerCalendarsState));
        displayCustomizeModalProps.onClose();
    };

    const calendarsFragment = c('Info').ngettext(
        msgid`Import ${calendarCount} of ${totalCalendarsCount} calendar`,
        `Import ${calendarCount} of ${totalCalendarsCount} calendars`,
        totalCalendarsCount
    );

    const toBeCreatedFragment = calendarsToBeCreatedCount
        ? c('Info').ngettext(
              msgid`Create ${calendarsToBeCreatedCount} new calendar`,
              `Create ${calendarsToBeCreatedCount} new calendars`,
              calendarsToBeCreatedCount
          )
        : null;

    const toBeMergedFragment = calendarsToBeMergedCount
        ? c('Info').ngettext(
              msgid`${calendarsToBeMergedCount} merged calendar`,
              `${calendarsToBeMergedCount} merged calendars`,
              calendarsToBeMergedCount
          )
        : null;

    const mappingFragment = [toBeCreatedFragment, toBeMergedFragment].filter(isTruthy).join(` ${c('Info').t`and`} `);
    const summary = `${calendarsFragment}: ${mappingFragment}`;

    return (
        <>
            {derivedValues.calendarLimitReached ? (
                <div className="flex color-danger">
                    <Icon name="exclamation-circle-filled" className="self-center mr-2" />
                    {c('Error').t`Calendar limit reached`}
                </div>
            ) : (
                <div className="color-weak" data-testid="StepPrepareCalendarSummary:summary">
                    {summary}
                </div>
            )}
            <Button
                shape="underline"
                color="norm"
                onClick={() => handleDisplayCustomizeModal(true)}
                className="self-start pb-0"
            >{c('Action').t`Customize`}</Button>
            {renderCustomizeModal && (
                <CustomizeCalendarImportModal
                    handleSubmit={handleSubmit}
                    modalProps={displayCustomizeModalProps}
                    providerCalendarsState={providerCalendarsState}
                    derivedValues={derivedValues}
                    activeWritableCalendars={activeWritableCalendars}
                    handleCalendarToggle={handleCalendarToggle}
                    handleMappingChange={handleMappingChange}
                />
            )}
        </>
    );
};

export default StepPrepareCalendarSummary;
