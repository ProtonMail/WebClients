import { ChangeEvent, useState } from 'react';
import { MAX_LENGTHS_API } from '@proton/shared/lib/calendar/constants';
import { truncateMore } from '@proton/shared/lib/helpers/string';
import { c } from 'ttag';

import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { isURL } from '@proton/shared/lib/helpers/validators';
import { getCalendarPayload, getCalendarSettingsPayload, getDefaultModel } from '../calendarModal/calendarModalState';
import { Href, InputFieldTwo, Loader, Button, BasicModal, Form } from '../../../components';
import { useLoading } from '../../../hooks';
import { GenericError } from '../../error';
import { classnames } from '../../../helpers';
import useGetCalendarSetup from '../hooks/useGetCalendarSetup';
import useGetCalendarActions from '../hooks/useGetCalendarActions';

const CALENDAR_URL_MAX_LENGTH = 10000;

interface Props {
    onClose?: () => void;
    onCreateCalendar?: (id: string) => void;
    isOpen: boolean;
}

const SubscribeCalendarModal = ({ isOpen, onClose, onCreateCalendar }: Props) => {
    const [, setCalendar] = useState<Calendar | undefined>();
    const [calendarURL, setCalendarURL] = useState('');
    const [model, setModel] = useState(() => getDefaultModel());
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
    const handleClose = () => {
        setCalendarURL('');
        onClose?.();
    };
    const { handleCreateCalendar } = useGetCalendarActions({
        setCalendar,
        setError,
        onClose: handleClose,
        onCreateCalendar,
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

    const {
        title,
        submitProps,
        errorContent = null,
        onSubmit,
    } = (() => {
        if (error || setupError) {
            const onSubmitError = () => window.location.reload();

            return {
                title: c('Title').t`Error`,
                errorContent: <GenericError />,
                onSubmit: onSubmitError,
                submitProps: {
                    children: c('Action').t`Close`,
                    disabled: !calendarURL || !isURLValid,
                },
            };
        }

        const loading = loadingSetup || loadingAction;
        const onSubmit = () => withLoadingAction(handleProcessCalendar());
        const titleAndSubmitCopy = c('Modal title and action').t`Add calendar`;

        return {
            title: titleAndSubmitCopy,
            onSubmit,
            submitProps: {
                loading,
                children: titleAndSubmitCopy,
                disabled: !calendarURL || !isURLValid,
            },
        };
    })();

    const kbLink = (
        <Href key="kbLink" href="https://protonmail.com/support/knowledge-base/calendar-subscribe">{c(
            'Subscribe to calendar modal description'
        ).t`Learn how to get a private calendar link.`}</Href>
    );

    return (
        <BasicModal
            title={title}
            footer={
                <>
                    <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                    <Button type="submit" color="norm" {...submitProps} />
                </>
            }
            isOpen={isOpen}
            className="modal--shorter-labels w100"
            onClose={handleClose}
            as={Form}
            dense
            onSubmit={() => {
                if (!submitProps.loading) {
                    onSubmit();
                }
            }}
        >
            {loadingSetup ? (
                <Loader />
            ) : (
                errorContent || (
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
                )
            )}
        </BasicModal>
    );
};

export default SubscribeCalendarModal;
