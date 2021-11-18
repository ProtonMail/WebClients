import { ChangeEvent, useState } from 'react';
import { MAX_LENGTHS_API } from '@proton/shared/lib/calendar/constants';
import { truncateMore } from '@proton/shared/lib/helpers/string';
import { c } from 'ttag';

import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { noop } from '@proton/shared/lib/helpers/function';
import { isURL } from '@proton/shared/lib/helpers/validators';
import { getCalendarPayload, getCalendarSettingsPayload, getDefaultModel } from '../calendarModal/calendarModalState';
import { FormModal, Href, InputFieldTwo, Loader } from '../../../components';
import { useLoading, useCalendarEmailNotificationsFeature } from '../../../hooks';
import { GenericError } from '../../error';
import { classnames } from '../../../helpers';
import useGetCalendarSetup from '../hooks/useGetCalendarSetup';
import useGetCalendarActions from '../hooks/useGetCalendarActions';

const CALENDAR_URL_MAX_LENGTH = 10000;

interface Props {
    onClose?: () => void;
    onCreateCalendar?: (id: string) => void;
}

const SubscribeCalendarModal = ({ ...rest }: Props) => {
    const [, setCalendar] = useState<Calendar | undefined>();
    const [calendarURL, setCalendarURL] = useState('');
    const emailNotificationsEnabled = useCalendarEmailNotificationsFeature();
    const [model, setModel] = useState(() => getDefaultModel(emailNotificationsEnabled));
    const [error, setError] = useState(false);

    const [loadingAction, withLoadingAction] = useLoading();

    const isGoogle = calendarURL.match(/^https?:\/\/calendar\.google\.com/);
    const isOutlook = calendarURL.match(/^https?:\/\/outlook\.live\.com/);
    const shouldProbablyHaveIcsExtension = (isGoogle || isOutlook) && !calendarURL.endsWith('.ics');
    const googleWillPossiblyBeMakePublic = calendarURL.match(/\/public\/\w+\.ics/);
    const warning = shouldProbablyHaveIcsExtension
        ? c('Subscribed calendar extension warning').t`This link might be wrong`
        : isGoogle && googleWillPossiblyBeMakePublic
        ? c('Subscribed calendar extension warning')
              .t`By using this link, Google will make the calendar you are subscribing to public`
        : null;

    const isURLValid = isURL(calendarURL);

    const { error: setupError, loading: loadingSetup } = useGetCalendarSetup({ setModel });
    const { handleCreateCalendar } = useGetCalendarActions({
        setCalendar,
        setError,
        onClose: rest?.onClose,
        onCreateCalendar: rest?.onCreateCalendar,
        isSubscribedCalendar: true,
    });

    const handleProcessCalendar = async () => {
        const formattedModel = {
            ...model,
            name: truncateMore({ string: calendarURL, charsToDisplay: MAX_LENGTHS_API.CALENDAR_NAME }),
            url: calendarURL,
        };
        const calendarPayload = getCalendarPayload(formattedModel);
        const calendarSettingsPayload = getCalendarSettingsPayload(formattedModel);

        return handleCreateCalendar(formattedModel.addressID, calendarPayload, calendarSettingsPayload);
    };

    const { length: calendarURLLength } = calendarURL;
    const isURLMaxLength = calendarURLLength === CALENDAR_URL_MAX_LENGTH;

    const { ...modalProps } = (() => {
        if (error || setupError) {
            return {
                title: c('Title').t`Error`,
                submit: c('Action').t`Close`,
                hasClose: false,
                section: <GenericError />,
                onSubmit() {
                    window.location.reload();
                },
            };
        }

        const loading = loadingSetup || loadingAction;
        const titleAndSubmitCopy = c('Modal title and action').t`Add calendar`;

        return {
            title: titleAndSubmitCopy,
            submit: titleAndSubmitCopy,
            loading,
            hasClose: true,
            submitProps: {
                disabled: !calendarURL || !isURLValid,
            },
            onSubmit: () => {
                void withLoadingAction(handleProcessCalendar());
            },
        };
    })();

    const kbLink = (
        <Href href="https://protonmail.com/support/knowledge-base/calendar-subscribe">{c(
            'Subscribe to calendar modal description'
        ).t`Learn how to get a private calendar link.`}</Href>
    );

    return (
        <FormModal className="modal--shorter-labels w100" onClose={noop} {...modalProps} {...rest}>
            {loadingSetup ? (
                <Loader />
            ) : (
                <>
                    <p className="mt0 text-pre-wrap">{c('Subscribe to calendar modal')
                        .jt`To subscribe to an external or public calendar and its updates, enter the URL. A read-only version of the calendar will be added to your Subscribed calendars.
${kbLink}
`}</p>
                    <InputFieldTwo
                        autoFocus
                        hint={
                            <span className={classnames([isURLMaxLength && 'color-warning'])}>
                                {calendarURLLength}/{CALENDAR_URL_MAX_LENGTH}
                            </span>
                        }
                        error={calendarURL && !isURLValid && c('Error message').t`Invalid URL`}
                        warning={warning}
                        maxLength={CALENDAR_URL_MAX_LENGTH}
                        label={c('Subscribe to calendar modal').t`Calendar URL`}
                        value={calendarURL}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setCalendarURL(e.target.value.trim())}
                    />
                </>
            )}
        </FormModal>
    );
};

export default SubscribeCalendarModal;
