import { getIsSubscribedCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';
import { useState, useMemo, ChangeEvent } from 'react';
import { c } from 'ttag';

import { Calendar, NotificationModel, SubscribedCalendar } from '@proton/shared/lib/interfaces/calendar';
import { dedupeNotifications, sortNotificationsByAscendingTrigger } from '@proton/shared/lib/calendar/alarms';
import { MAX_DEFAULT_NOTIFICATIONS, MAX_LENGTHS_API } from '@proton/shared/lib/calendar/constants';

import { Nullable } from '@proton/shared/lib/interfaces';
import {
    ColorPicker,
    Field,
    Loader,
    Option,
    SelectTwo,
    TextArea,
    Form,
    TooltipExclusive,
    Toggle,
    InputFieldTwo,
    ModalTwo,
    ModalTwoFooter,
    ModalTwoHeader,
    ModalTwoContent,
    Button,
} from '../../../components';
import { getCalendarPayload, getCalendarSettingsPayload, getDefaultModel, validate } from './calendarModalState';
import { useLoading } from '../../../hooks';
import Notifications from '../notifications/Notifications';
import useGetCalendarSetup from '../hooks/useGetCalendarSetup';
import useGetCalendarActions from '../hooks/useGetCalendarActions';
import { TruncatedText } from '../../../components/truncatedText';
import { SelectChangeEvent } from '../../../components/selectTwo/select';
import GenericError from '../../error/GenericError';

import './CalendarModal.scss';

const URL_MAX_DISPLAY_LENGTH = 100;

export interface CalendarModalProps {
    calendar?: Calendar | SubscribedCalendar;
    activeCalendars?: Calendar[];
    defaultCalendarID?: Nullable<string>;
    onClose?: () => void;
    onExit?: () => void;
    onCreateCalendar?: (id: string) => void;
    isOpen?: boolean;
}

export const CalendarModal = ({
    calendar: initialCalendar,
    activeCalendars = [],
    defaultCalendarID = '',
    isOpen,
    onClose,
    onExit,
    onCreateCalendar,
}: CalendarModalProps) => {
    const [loadingAction, withLoadingAction] = useLoading();

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState(false);
    const [calendar, setCalendar] = useState(initialCalendar);

    const [model, setModel] = useState(() => getDefaultModel());

    const addressText = useMemo(() => {
        const option = model.addressOptions.find(({ value: ID }) => ID === model.addressID);
        return (option && option.text) || '';
    }, [model.addressID, model.addressOptions]);

    const isSubscribedCalendar = initialCalendar && getIsSubscribedCalendar(initialCalendar);
    const subscribeURL =
        initialCalendar && getIsSubscribedCalendar(initialCalendar)
            ? initialCalendar.SubscriptionParameters.URL
            : undefined;

    const { error: setupError, loading: loadingSetup } = useGetCalendarSetup({ calendar: initialCalendar, setModel });
    const { handleCreateCalendar, handleUpdateCalendar } = useGetCalendarActions({
        calendar: initialCalendar,
        setCalendar,
        setError,
        defaultCalendarID,
        onClose,
        onCreateCalendar,
        activeCalendars,
    });

    const formattedModel = {
        ...model,
        name: model.name.trim(),
        description: model.description.trim(),
    };

    const errors = validate(formattedModel);

    const handleProcessCalendar = async () => {
        const formattedModelWithFormattedNotifications = {
            ...formattedModel,
            partDayNotifications: sortNotificationsByAscendingTrigger(dedupeNotifications(model.partDayNotifications)),
            fullDayNotifications: sortNotificationsByAscendingTrigger(dedupeNotifications(model.fullDayNotifications)),
        };
        const calendarPayload = getCalendarPayload(formattedModelWithFormattedNotifications);
        const calendarSettingsPayload = getCalendarSettingsPayload(formattedModelWithFormattedNotifications);
        if (calendar) {
            return handleUpdateCalendar(calendar, calendarPayload, calendarSettingsPayload);
        }
        return handleCreateCalendar(
            formattedModelWithFormattedNotifications.addressID,
            calendarPayload,
            calendarSettingsPayload
        );
    };

    const hasError = error || setupError;
    const getTitle = () => {
        if (hasError) {
            return c('Title').t`Error`;
        }

        return initialCalendar ? c('Title').t`Edit calendar` : c('Title').t`Create calendar`;
    };
    const handleSubmit = () => {
        if (hasError) {
            window.location.reload();
            return;
        }

        setIsSubmitted(true);

        if (Object.keys(errors).length > 0) {
            return;
        }

        void withLoadingAction(handleProcessCalendar());
    };

    const getFakeLabel = (labelText: string) => (
        <span className="flex inputform-label flex-justify-space-between flex-nowrap flex-align-items-end">
            <span className="inputform-label-text">{labelText}</span>
        </span>
    );

    const getFakeInputTwo = ({ content, label }: { content: React.ReactNode; label: string }) => {
        // classes taken from InputFieldTwo
        return (
            <div className="inputform-container w100">
                {getFakeLabel(label)}
                <div className="inputform-field-container relative">{content}</div>
            </div>
        );
    };

    const getAddressRow = () => {
        if (model.calendarID) {
            return getFakeInputTwo({ content: addressText, label: c('Label').t`Email address` });
        }

        return (
            <InputFieldTwo
                as={SelectTwo}
                id="calendar-address-select"
                value={model.addressID}
                // @ts-ignore
                onChange={({ value }: SelectChangeEvent<string>) => setModel({ ...model, addressID: value })}
                label={c('Label').t`Default email address`}
            >
                {model.addressOptions.map(({ value, text }) => (
                    <Option key={value} value={value} title={text} />
                ))}
            </InputFieldTwo>
        );
    };

    return (
        <TooltipExclusive>
            <ModalTwo
                size="large"
                fullscreenOnMobile
                className="w100"
                open={isOpen}
                onClose={onClose}
                as={Form}
                dense
                onSubmit={() => {
                    if (!loadingAction) {
                        handleSubmit();
                    }
                }}
                onExit={onExit}
            >
                {loadingSetup ? (
                    <Loader />
                ) : (
                    <>
                        <ModalTwoHeader title={getTitle()} />
                        <ModalTwoContent className="calendar-modal-content">
                            {hasError ? (
                                <GenericError />
                            ) : (
                                <>
                                    <InputFieldTwo
                                        id="calendar-name-input"
                                        label={c('Label').t`Name`}
                                        value={model.name}
                                        error={isSubmitted && errors.name}
                                        maxLength={MAX_LENGTHS_API.CALENDAR_NAME}
                                        disableChange={loadingAction}
                                        placeholder={c('Placeholder').t`Add a calendar name`}
                                        onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                                            setModel({ ...model, name: target.value })
                                        }
                                        autoFocus
                                    />
                                    <InputFieldTwo
                                        as={ColorPicker}
                                        label={c('Label').t`Color`}
                                        id="calendar-color"
                                        color={model.color}
                                        onChange={(color: string) => setModel({ ...model, color })}
                                    />
                                    {getAddressRow()}
                                    <div className="flex flex-nowrap flex-align-items-center">
                                        {getFakeLabel(c('Label').t`Display`)}
                                        <Field className="ml1">
                                            <Toggle
                                                id="calendar-display-toggle"
                                                className="p0"
                                                checked={model.display}
                                                onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                                                    setModel({ ...model, display: target.checked })
                                                }
                                            />
                                        </Field>
                                    </div>
                                    <InputFieldTwo
                                        as={TextArea}
                                        label={c('Label').t`Description`}
                                        autoGrow
                                        id="calendar-description-textarea"
                                        value={model.description}
                                        placeholder={c('Placeholder').t`Add a calendar description`}
                                        onChange={({ target }: ChangeEvent<HTMLTextAreaElement>) =>
                                            setModel({ ...model, description: target.value })
                                        }
                                        maxLength={MAX_LENGTHS_API.CALENDAR_DESCRIPTION}
                                        isSubmitted={isSubmitted}
                                        error={errors.description}
                                    />
                                    {!isSubscribedCalendar && (
                                        <InputFieldTwo
                                            as={SelectTwo}
                                            label={c('Label').t`Default event duration`}
                                            id="duration-select"
                                            data-test-id="create-calendar/event-settings:event-duration"
                                            value={model.duration}
                                            // @ts-ignore
                                            onChange={({ value }: SelectChangeEvent<string>) =>
                                                setModel({ ...model, duration: +value })
                                            }
                                        >
                                            {[
                                                { text: c('Duration').t`30 minutes`, value: 30 },
                                                { text: c('Duration').t`60 minutes`, value: 60 },
                                                { text: c('Duration').t`90 minutes`, value: 90 },
                                                { text: c('Duration').t`120 minutes`, value: 120 },
                                            ].map(({ value, text }) => (
                                                <Option key={value} value={value} title={text} />
                                            ))}
                                        </InputFieldTwo>
                                    )}
                                    {subscribeURL &&
                                        getFakeInputTwo({
                                            content: (
                                                <span className="text-break-all">
                                                    <TruncatedText maxChars={URL_MAX_DISPLAY_LENGTH}>
                                                        {subscribeURL}
                                                    </TruncatedText>
                                                </span>
                                            ),
                                            label: c('Label').t`URL`,
                                        })}
                                    {!isSubscribedCalendar && (
                                        <>
                                            <InputFieldTwo
                                                as={Notifications}
                                                label={c('Label').t`Default notifications`}
                                                data-test-id="create-calendar/event-settings:default-notification"
                                                hasType
                                                notifications={model.partDayNotifications}
                                                canAdd={model.partDayNotifications.length < MAX_DEFAULT_NOTIFICATIONS}
                                                defaultNotification={model.defaultPartDayNotification}
                                                onChange={(notifications: NotificationModel[]) => {
                                                    setModel({
                                                        ...model,
                                                        partDayNotifications: notifications,
                                                    });
                                                }}
                                            />

                                            <InputFieldTwo
                                                as={Notifications}
                                                label={c('Label').t`Default full day notifications`}
                                                data-test-id="create-calendar/event-settings:default-full-day-notification"
                                                hasType
                                                notifications={model.fullDayNotifications}
                                                canAdd={model.fullDayNotifications.length < MAX_DEFAULT_NOTIFICATIONS}
                                                defaultNotification={model.defaultFullDayNotification}
                                                onChange={(notifications: NotificationModel[]) => {
                                                    setModel({
                                                        ...model,
                                                        fullDayNotifications: notifications,
                                                    });
                                                }}
                                            />
                                        </>
                                    )}
                                </>
                            )}
                        </ModalTwoContent>
                        <ModalTwoFooter>
                            {hasError ? (
                                <Button onClick={() => window.location.reload()} className="mlauto" color="norm">{c(
                                    'Action'
                                ).t`Close`}</Button>
                            ) : (
                                <>
                                    <Button onClick={onClose} disabled={loadingAction}>
                                        {c('Action').t`Cancel`}
                                    </Button>
                                    <Button loading={loadingAction} type="submit" color="norm">{c('Action')
                                        .t`Save`}</Button>
                                </>
                            )}
                        </ModalTwoFooter>
                    </>
                )}
            </ModalTwo>
        </TooltipExclusive>
    );
};

export default CalendarModal;
