import { c, msgid } from 'ttag';

import { Loader, FullLoader, TextLoader } from '../../../components';

interface Props {
    calendarsToBeCreated: number;
    createdCalendars: number;
    isLoadingOAuth: boolean;
    isLoadingCreateCalendars: boolean;
    isLoadingStartImportTask: boolean;
}

const IALoadingStep = ({
    calendarsToBeCreated,
    createdCalendars,
    isLoadingOAuth,
    isLoadingCreateCalendars,
    isLoadingStartImportTask,
}: Props) => {
    if (!isLoadingOAuth && !isLoadingCreateCalendars && !isLoadingStartImportTask) {
        return <Loader />;
    }

    const contentRenderer = () => {
        if (isLoadingOAuth) {
            return (
                <>
                    <h4>{c('Loading info').t`Gathering your data`}</h4>
                    <TextLoader>{c('Loading info').t`We're gathering your data from your provider`}</TextLoader>
                </>
            );
        }

        // translator: the variable here are numbers, e.g. "3 of 5 created"
        const progressCopy = c('Loading info').ngettext(
            msgid`${createdCalendars} of ${calendarsToBeCreated} created`,
            `${createdCalendars} of ${calendarsToBeCreated} created`,
            createdCalendars
        );

        if (isLoadingCreateCalendars) {
            return (
                <>
                    <h4>{c('Loading info').t`Creating new calendars`}</h4>
                    <TextLoader>{progressCopy}</TextLoader>
                </>
            );
        }

        if (isLoadingStartImportTask) {
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
        <div className="p1 text-center w100">
            <FullLoader size={100} className="mb1" />
            {contentRenderer()}
        </div>
    );
};

export default IALoadingStep;
