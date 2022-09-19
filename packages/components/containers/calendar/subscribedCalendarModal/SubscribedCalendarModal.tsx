import { ChangeEvent, useState } from 'react';

import { c } from 'ttag';

import { validateSubscription } from '@proton/shared/lib/api/calendars';
import { MAX_LENGTHS_API } from '@proton/shared/lib/calendar/constants';
import { getCalendarStatusInfo } from '@proton/shared/lib/calendar/subscribe/helpers';
import { truncateMore } from '@proton/shared/lib/helpers/string';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { isURL } from '@proton/shared/lib/helpers/validators';
import { CALENDAR_SUBSCRIPTION_STATUS, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { BasicModal, Button, Form, Href, InputFieldTwo, Loader } from '../../../components';
import { useApi, useLoading } from '../../../hooks';
import { GenericError } from '../../error';
import { getCalendarPayload, getCalendarSettingsPayload, getDefaultModel } from '../calendarModal/calendarModalState';
import useGetCalendarActions from '../hooks/useGetCalendarActions';
import useGetCalendarSetup from '../hooks/useGetCalendarSetup';

const { CALENDAR_URL } = MAX_LENGTHS_API;

interface Props {
    open: boolean;
    onClose?: () => void;
    onCreateCalendar?: (id: string) => void;
}

const SubscribedCalendarModal = ({ open, onClose, onCreateCalendar }: Props) => {
    const [, setCalendar] = useState<VisualCalendar | undefined>();
    const [calendarURL, setCalendarURL] = useState('');
    const [model, setModel] = useState(() => getDefaultModel());
    const [error, setError] = useState(false);
    const [validationError, setValidationError] = useState<CALENDAR_SUBSCRIPTION_STATUS>();

    const [loadingAction, withLoadingAction] = useLoading();
    const api = useApi();

    const isGoogle = calendarURL.match(/^https?:\/\/calendar\.google\.com/);
    const isOutlook = calendarURL.match(/^https?:\/\/outlook\.live\.com/);
    const shouldProbablyHaveIcsExtension = (isGoogle || isOutlook) && !calendarURL.endsWith('.ics');
    const googleWillPossiblyBeMakePublic = calendarURL.match(/\/public\/\w+\.ics/);

    const { length: calendarURLLength } = calendarURL;
    const isURLTooLong = calendarURLLength > CALENDAR_URL;

    const getWarning = () => {
        if (shouldProbablyHaveIcsExtension) {
            return c('Subscribed calendar extension warning').t`This link might be wrong`;
        }

        if (isGoogle && googleWillPossiblyBeMakePublic) {
            return c('Subscribed calendar extension warning')
                .t`By using this link, Google will make the calendar you are subscribing to public`;
        }

        if (isURLTooLong) {
            return c('Subscribed calendar URL length warning').t`URL is too long`;
        }

        return null;
    };

    const isURLValid = isURL(calendarURL);

    const { error: setupError, loading: loadingSetup } = useGetCalendarSetup({ setModel });
    const handleClose = () => {
        setValidationError(undefined);
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

        const {
            ValidationResult: { Result: result },
        } = await api<{ ValidationResult: { Result: CALENDAR_SUBSCRIPTION_STATUS } }>({
            ...validateSubscription({ url: calendarURL }),
            silence: true,
        }).catch(() => ({ ValidationResult: { Result: CALENDAR_SUBSCRIPTION_STATUS.OK } }));

        if (result === CALENDAR_SUBSCRIPTION_STATUS.OK) {
            return handleCreateCalendar(formattedModel.addressID, calendarPayload, calendarSettingsPayload);
        }

        setValidationError(result);
    };

    const {
        title,
        submitProps,
        errorContent = null,
        onSubmit,
    } = (() => {
        const disabled = !calendarURL || !isURLValid || isURLTooLong;

        if (error || setupError) {
            const onSubmitError = () => window.location.reload();

            return {
                title: c('Title').t`Error`,
                errorContent: <GenericError />,
                onSubmit: onSubmitError,
                submitProps: {
                    children: c('Action').t`Close`,
                    disabled,
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
                disabled,
            },
        };
    })();

    const kbLink = (
        <Href key="kbLink" href={getKnowledgeBaseUrl('/subscribe-to-external-calendar')}>{c(
            'Subscribe to calendar modal description'
        ).t`Learn how to get a private calendar link.`}</Href>
    );

    const getError = () => {
        if (calendarURL && !isURLValid) {
            return c('Error message').t`Invalid URL`;
        }

        if (validationError) {
            return getCalendarStatusInfo(validationError)?.text;
        }

        return null;
    };

    return (
        <BasicModal
            title={title}
            footer={
                <>
                    <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button>
                    <Button type="submit" color="norm" {...submitProps} />
                </>
            }
            isOpen={open}
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
                            warning={getWarning()}
                            error={getError()}
                            label={c('Subscribe to calendar modal').t`Calendar URL`}
                            value={calendarURL}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                setValidationError(undefined);
                                setCalendarURL(e.target.value.trim());
                            }}
                            data-test-id="input:calendar-subscription"
                        />
                    </>
                )
            )}
        </BasicModal>
    );
};

export default SubscribedCalendarModal;
