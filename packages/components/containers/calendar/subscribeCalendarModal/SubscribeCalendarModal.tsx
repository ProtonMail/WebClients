import { MAX_LENGTHS } from '@proton/shared/lib/calendar/constants';
import { truncateMore } from '@proton/shared/lib/helpers/string';
import React, { useState } from 'react';
import { c } from 'ttag';

import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { noop } from '@proton/shared/lib/helpers/function';
import { isURL } from '@proton/shared/lib/helpers/validators';
import { getCalendarPayload, getCalendarSettingsPayload, getDefaultModel } from '../calendarModal/calendarModalState';
import { FormModal, InputFieldTwo, Loader } from '../../../components';
import { useLoading } from '../../../hooks';
import { GenericError } from '../../error';
import { classnames } from '../../../helpers';
import useGetCalendarSetup from '../hooks/useGetCalendarSetup';
import useGetCalendarActions from '../hooks/useGetCalendarActions';

const CALENDAR_URL_MAX_LENGTH = 10000;

interface Props {
    onClose?: () => void;
}

const SubscribeCalendarModal = ({ ...rest }: Props) => {
    const [, setCalendar] = useState<Calendar | undefined>();
    const [calendarURL, setCalendarURL] = useState('');
    const [model, setModel] = useState(() => getDefaultModel());
    const [error, setError] = useState(false);

    const [loadingAction, withLoadingAction] = useLoading();

    const isURLValid = isURL(calendarURL);

    const { error: setupError, loading: loadingSetup } = useGetCalendarSetup({ setModel });
    const { handleCreateCalendar } = useGetCalendarActions({
        setCalendar,
        setError,
        onClose: rest?.onClose,
        isOtherCalendar: true,
    });

    const handleProcessCalendar = async () => {
        const formattedModel = {
            ...model,
            name: truncateMore({ string: calendarURL, charsToDisplay: MAX_LENGTHS.CALENDAR_NAME }),
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

        return {
            title: c('Title').t`Subscribe to calendar`,
            submit: c(`Action`).t`Subscribe`,
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

    return (
        <FormModal className="modal--shorter-labels w100" onClose={noop} {...modalProps} {...rest}>
            {loadingSetup ? (
                <Loader />
            ) : (
                <>
                    <p className="mt0">{c('Subscribe to calendar modal')
                        .t`You can subscribe to someone else's calendar by pasting its URL below. This will give you access to a read-only version of this calendar.`}</p>
                    <InputFieldTwo
                        autoFocus
                        hint={
                            <span className={classnames([isURLMaxLength && 'color-warning'])}>
                                {calendarURLLength}/{CALENDAR_URL_MAX_LENGTH}
                            </span>
                        }
                        error={calendarURL && !isURLValid && c('Error message').t`Invalid URL`}
                        maxLength={CALENDAR_URL_MAX_LENGTH}
                        label={c('Subscribe to calendar modal').t`Calendar URL`}
                        value={calendarURL}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCalendarURL(e.target.value.trim())}
                    />
                </>
            )}
        </FormModal>
    );
};

export default SubscribeCalendarModal;
