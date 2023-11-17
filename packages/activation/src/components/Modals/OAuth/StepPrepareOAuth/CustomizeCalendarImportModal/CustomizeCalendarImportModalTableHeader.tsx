import { c, msgid } from 'ttag';

import useAvailableAddresses from '@proton/activation/src/hooks/useAvailableAddresses';
import { selectOauthImportStateImporterData } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    calendarLimitReached: boolean;
    calendarsToBeCreatedCount: number;
    selectedCalendarsTotal: number;
    selectedCalendars: any[];
}

const CustomizeCalendarImportModalTableHeader = ({
    calendarLimitReached,
    calendarsToBeCreatedCount,
    selectedCalendarsTotal,
    selectedCalendars,
}: Props) => {
    const { defaultAddress } = useAvailableAddresses();

    const importerData = useEasySwitchSelector(selectOauthImportStateImporterData);
    const providerCalendars = importerData?.calendars?.calendars!;
    const importedEmailAddress = importerData?.importedEmail;

    // translator: the variables here are the number of selected calendar and number of total calendar. Example of the complete sentence: "5 of 7 calendars"
    const calendarsSelectedCopy = c('Info').ngettext(
        msgid`${selectedCalendarsTotal} of ${providerCalendars.length} calendar`,
        `${selectedCalendarsTotal} of ${providerCalendars.length} calendars`,
        providerCalendars.length
    );

    // translator: the variable ${calendarsToBeCreatedCount} is the number of calendars to be created. Example of the complete sentence: "5 new calendars"
    const calendarsToBeCreatedCopy = c('Info').ngettext(
        msgid`${calendarsToBeCreatedCount} new calendar`,
        `${calendarsToBeCreatedCount} new calendars`,
        calendarsToBeCreatedCount
    );

    const calendarsToBeMergedCount = selectedCalendars.length - calendarsToBeCreatedCount;

    // translator: the variable ${calendarsToBeMergedCount} is the number of calendars to be merged with an existing Proton calendar. Example of the complete sentence: "5 merged calendars".
    const calendarsToBeMergedCopy = c('Info').ngettext(
        msgid`${calendarsToBeMergedCount} merged calendar`,
        `${calendarsToBeMergedCount} merged calendars`,
        calendarsToBeMergedCount
    );

    const importSummaryRenderer = () => {
        return (
            <>
                {!!calendarsToBeCreatedCount && calendarsToBeCreatedCopy}
                {!!calendarsToBeCreatedCount && !!calendarsToBeMergedCount && <br />}
                {!!calendarsToBeMergedCount && calendarsToBeMergedCopy}
            </>
        );
    };

    return (
        <div className="flex mt-8">
            <div className="flex-item-fluid">
                <div className="text-sm text-bold m-0 lh100 mb-2">{c('Info').t`Import from`}</div>
                <strong className="block mb-2">{importedEmailAddress}</strong>
                <div className="color-weak">{calendarsSelectedCopy}</div>
            </div>
            <div className="flex-item-fluid">
                <div className="text-sm text-bold m-0 lh100 mb-2">{c('Info').t`Create in`}</div>
                <strong className="block mb-2">{defaultAddress.Email}</strong>
                {selectedCalendarsTotal > 0 && (
                    <div className={clsx(['flex', calendarLimitReached ? 'color-danger' : 'color-weak'])}>
                        {calendarLimitReached && (
                            <Icon
                                name="exclamation-circle-filled"
                                className="color-danger self-center mr-2"
                            />
                        )}
                        {importSummaryRenderer()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomizeCalendarImportModalTableHeader;
