import type { ChangeEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import { useLoading } from '@proton/hooks';
import { validateSubscription } from '@proton/shared/lib/api/calendars';
import { CALENDAR_TYPE, MAX_CHARS_API } from '@proton/shared/lib/calendar/constants';
import { getCalendarStatusInfo } from '@proton/shared/lib/calendar/subscribe/helpers';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { truncateMore } from '@proton/shared/lib/helpers/string';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { CALENDAR_SUBSCRIPTION_STATUS } from '@proton/shared/lib/interfaces/calendar';

import { BasicModal, InputFieldTwo, Loader } from '../../../../components';
import { useApi } from '../../../../hooks';
import { GenericError } from '../../../error';
import useGetCalendarActions from '../../hooks/useGetCalendarActions';
import useGetCalendarSetup from '../../hooks/useGetCalendarSetup';
import BusySlotsCheckbox from '../BusySlotsCheckbox';
import {
    getCalendarPayload,
    getCalendarSettingsPayload,
    getDefaultModel,
} from '../personalCalendarModal/calendarModalState';

interface Props {
    open: boolean;
    onClose?: () => void;
    onExit?: () => void;
    onCreateCalendar?: (id: string) => void;
}

const SubscribedCalendarModal = ({ open, onClose, onExit, onCreateCalendar }: Props) => {
    const [, setCalendar] = useState<VisualCalendar | undefined>();
    const [calendarURL, setCalendarURL] = useState('');
    const [model, setModel] = useState(() => getDefaultModel(CALENDAR_TYPE.SUBSCRIPTION));
    const [error, setError] = useState(false);
    const [validationError, setValidationError] = useState<CALENDAR_SUBSCRIPTION_STATUS>();

    const [loadingAction, withLoadingAction] = useLoading();
    const api = useApi();

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
            name: truncateMore({ string: calendarURL, charsToDisplay: MAX_CHARS_API.CALENDAR_NAME }),
            url: calendarURL,
        };
        const calendarPayload = getCalendarPayload(formattedModel);
        const calendarSettingsPayload = getCalendarSettingsPayload(formattedModel);

        const {
            ValidationResult: { Result: result },
        } = await api<{ ValidationResult: { Result: CALENDAR_SUBSCRIPTION_STATUS } }>({
            ...validateSubscription({ url: calendarURL }),
            silence: true,
        }).catch((error) => {
            if (error?.status === HTTP_STATUS_CODE.UNPROCESSABLE_ENTITY) {
                return { ValidationResult: { Result: CALENDAR_SUBSCRIPTION_STATUS.INVALID_URL } };
            }

            return { ValidationResult: { Result: CALENDAR_SUBSCRIPTION_STATUS.OK } };
        });

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
        const disabled = !calendarURL || !!validationError;

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
        if (validationError === CALENDAR_SUBSCRIPTION_STATUS.INVALID_URL) {
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
            className="modal--shorter-labels w-full"
            onClose={handleClose}
            as={Form}
            dense
            onSubmit={() => {
                if (!submitProps.loading) {
                    void onSubmit();
                }
            }}
            onExit={onExit}
        >
            {loadingSetup ? (
                <Loader />
            ) : (
                errorContent || (
                    <>
                        <p className="mt-0 text-pre-wrap">{c('Subscribe to calendar modal')
                            .jt`To subscribe to an external or public calendar and its updates, enter the URL. A read-only version of the calendar will be added to your Other calendars.
${kbLink}
`}</p>
                        <InputFieldTwo
                            autoFocus
                            error={getError()}
                            label={c('Subscribe to calendar modal').t`Calendar URL`}
                            value={calendarURL}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                setValidationError(undefined);
                                setCalendarURL(e.target.value.trim());
                            }}
                            data-testid="input:calendar-subscription"
                            className="mb-4"
                        />

                        <BusySlotsCheckbox
                            value={model.shareBusySlots}
                            onChange={(shareBusySlots) => {
                                setModel({ ...model, shareBusySlots });
                            }}
                        />
                    </>
                )
            )}
        </BasicModal>
    );
};

export default SubscribedCalendarModal;
