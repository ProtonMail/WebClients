import { c, msgid } from 'ttag';

import { Loader, ModalTwo, ModalTwoContent, TextLoader } from '@proton/components';

import useStepLoadingImporting from './useStepLoadingImporting';

const StepLoadingImporting = () => {
    const { createdCalendarCount, calendarsToBeCreated, isCreatingCalendar, isCreatingImportTask } =
        useStepLoadingImporting();

    const renderContent = () => {
        if (isCreatingCalendar) {
            // translator: the variables here are numbers, e.g. "Amount of calendars created: 3 out of 5"
            const progressCopy = c('Loading info').ngettext(
                msgid`Amount of calendar created:  ${createdCalendarCount} of ${calendarsToBeCreated}`,
                `Amount of calendars created: ${createdCalendarCount} out of ${calendarsToBeCreated}`,
                calendarsToBeCreated
            );

            return (
                <>
                    <h4>{c('Loading info').t`Creating new calendars`}</h4>
                    <TextLoader>{progressCopy}</TextLoader>
                </>
            );
        }

        if (isCreatingImportTask) {
            return (
                <>
                    <h4>{c('Loading info').t`Your import is starting`}</h4>
                    <TextLoader>{c('Loading info').t`Almost there`}</TextLoader>
                </>
            );
        }

        return null;
    };

    return (
        <ModalTwo open size="large">
            <ModalTwoContent>
                <div className="p-14 text-center w-full" data-testid="StepLoadingImporting:modal">
                    <Loader size="large" className="mb-4" />
                    {renderContent()}
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default StepLoadingImporting;
