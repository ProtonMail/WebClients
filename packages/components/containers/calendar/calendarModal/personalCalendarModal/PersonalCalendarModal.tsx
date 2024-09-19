import type { ChangeEvent } from 'react';
import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import ColorPicker from '@proton/components/components/input/ColorPicker';
import TextArea from '@proton/components/components/input/TextArea';
import Loader from '@proton/components/components/loader/Loader';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { getCalendarModalSize } from '@proton/components/containers/calendar/calendarModal/helpers';
import { CALENDAR_MODAL_TYPE } from '@proton/components/containers/calendar/calendarModal/interface';
import { useContactEmailsCache } from '@proton/components/containers/contacts/ContactEmailsProvider';
import { useLoading } from '@proton/hooks';
import { dedupeNotifications, sortNotificationsByAscendingTrigger } from '@proton/shared/lib/calendar/alarms';
import { getIsCalendarWritable, getIsSubscribedCalendar, getShowDuration } from '@proton/shared/lib/calendar/calendar';
import { MAX_CHARS_API, MAX_DEFAULT_NOTIFICATIONS } from '@proton/shared/lib/calendar/constants';
import { getSharedCalendarSubHeaderText } from '@proton/shared/lib/calendar/sharing/shareProton/shareProton';
import type { Nullable } from '@proton/shared/lib/interfaces';
import type { NotificationModel, SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { InputFieldTwo, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../../../components';
import type { SelectChangeEvent } from '../../../../components/selectTwo/select';
import { TruncatedText } from '../../../../components/truncatedText';
import GenericError from '../../../error/GenericError';
import useGetCalendarActions from '../../hooks/useGetCalendarActions';
import useGetCalendarSetup from '../../hooks/useGetCalendarSetup';
import Notifications from '../../notifications/Notifications';
import BusySlotsCheckbox from '../BusySlotsCheckbox';
import { getCalendarPayload, getCalendarSettingsPayload, getDefaultModel, validate } from './calendarModalState';

import './PersonalCalendarModal.scss';

const URL_MAX_DISPLAY_LENGTH = 100;

const { COMPLETE, VISUAL, SHARED } = CALENDAR_MODAL_TYPE;

export interface CalendarModalProps {
    calendar?: VisualCalendar | SubscribedCalendar;
    calendars?: VisualCalendar[];
    defaultCalendarID?: Nullable<string>;
    onClose?: () => void;
    onExit?: () => void;
    onCreateCalendar?: (id: string) => void;
    onEditCalendar?: () => void;
    open?: boolean;
    type?: CALENDAR_MODAL_TYPE;
}

export const PersonalCalendarModal = ({
    calendar: initialCalendar,
    calendars = [],
    defaultCalendarID = '',
    open,
    onClose,
    onExit,
    onCreateCalendar,
    onEditCalendar,
    type = COMPLETE,
}: CalendarModalProps) => {
    const [loadingAction, withLoadingAction] = useLoading();
    const { contactEmailsMap } = useContactEmailsCache() || {};

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState(false);
    const [calendar, setCalendar] = useState(initialCalendar);

    const [model, setModel] = useState(() => getDefaultModel());

    const addressText = useMemo(() => {
        const option = model.addressOptions.find(({ value: ID }) => ID === model.addressID);
        return (option && option.text) || '';
    }, [model.addressID, model.addressOptions]);

    const showDuration = initialCalendar ? getShowDuration(initialCalendar) : true;
    const subscribeURL =
        initialCalendar && getIsSubscribedCalendar(initialCalendar)
            ? initialCalendar.SubscriptionParameters.URL
            : undefined;

    const { error: setupError, loading: loadingSetup } = useGetCalendarSetup({ calendar: initialCalendar, setModel });
    const { handleCreateCalendar, handleUpdateCalendar } = useGetCalendarActions({
        type,
        setCalendar,
        setError,
        defaultCalendarID,
        onClose,
        onCreateCalendar,
        onEditCalendar,
        calendars,
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

    const getTitle = (type: CALENDAR_MODAL_TYPE) => {
        const editCalendarText = c('Title; edit calendar modal').t`Edit calendar`;
        if (hasError) {
            return c('Title').t`Error`;
        }

        if (type === VISUAL) {
            return editCalendarText;
        }

        return initialCalendar ? editCalendarText : c('Title; create calendar modal').t`Create calendar`;
    };

    const getSubline = () => {
        if (type !== CALENDAR_MODAL_TYPE.SHARED || !calendar || !contactEmailsMap) {
            return;
        }

        const subHeaderText = getSharedCalendarSubHeaderText(calendar, contactEmailsMap);

        return (
            subHeaderText && (
                <>
                    <div className="text-rg text-break mb-1 color-norm">{subHeaderText}</div>
                    {!getIsCalendarWritable(calendar) && (
                        <div className="text-rg text-ellipsis color-weak">
                            {c('Info; access rights for shared calendar').t`View only`}
                        </div>
                    )}
                </>
            )
        );
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
        <span className="flex field-two-label-container justify-space-between flex-nowrap items-end">
            <span className="field-two-label">{labelText}</span>
        </span>
    );

    const getFakeInputTwo = ({ content, label }: { content: React.ReactNode; label: string }) => {
        // classes taken from InputFieldTwo
        return (
            <div className="field-two-container w-full">
                {getFakeLabel(label)}
                <div className="field-two-field-container relative">{content}</div>
            </div>
        );
    };

    const calendarNameRow = (
        <InputFieldTwo
            id="calendar-name-input"
            label={c('Label').t`Name`}
            value={model.name}
            error={isSubmitted && errors.name}
            maxLength={MAX_CHARS_API.CALENDAR_NAME}
            disableChange={loadingAction}
            placeholder={c('Placeholder').t`Add a calendar name`}
            onChange={({ target }: ChangeEvent<HTMLInputElement>) => setModel({ ...model, name: target.value })}
            autoFocus
        />
    );

    const colorRow = (
        <InputFieldTwo
            as={ColorPicker}
            label={c('Label').t`Color`}
            id="calendar-color"
            color={model.color}
            onChange={(color: string) => setModel({ ...model, color })}
        />
    );

    const descriptionRow = (
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
            maxLength={MAX_CHARS_API.CALENDAR_DESCRIPTION}
            isSubmitted={isSubmitted}
            error={errors.description}
        />
    );

    const addressRow = model.calendarID ? (
        getFakeInputTwo({ content: addressText, label: c('Label').t`Email address` })
    ) : (
        <InputFieldTwo
            as={SelectTwo}
            id="calendar-address-select"
            value={model.addressID}
            // @ts-ignore
            onChange={({ value }: SelectChangeEvent<string>) => setModel({ ...model, addressID: value })}
            label={c('Label').t`Email address`}
        >
            {model.addressOptions.map(({ value, text }) => (
                <Option key={value} value={value} title={text} />
            ))}
        </InputFieldTwo>
    );

    const defaultEventDurationRow = showDuration ? (
        <InputFieldTwo
            as={SelectTwo}
            label={c('Label').t`Event duration`}
            id="duration-select"
            data-testid="create-calendar/event-settings:event-duration"
            value={model.duration}
            // @ts-ignore
            onChange={({ value }: SelectChangeEvent<string>) => setModel({ ...model, duration: +value })}
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
    ) : null;

    const defaultNotificationsRow = (
        <>
            <InputFieldTwo
                id="default-notification"
                as={Notifications}
                label={c('Label').t`Event notifications`}
                data-testid="create-calendar/event-settings:default-notification"
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
                id="default-full-day-notification"
                as={Notifications}
                label={c('Label').t`All-day event notifications`}
                data-testid="create-calendar/event-settings:default-full-day-notification"
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
    );

    const busySlotsCheckbox = (
        <BusySlotsCheckbox
            value={model.shareBusySlots}
            onChange={(shareBusySlots) => setModel({ ...model, shareBusySlots })}
        />
    );

    const subscribeURLRow =
        subscribeURL &&
        getFakeInputTwo({
            content: (
                <span className="text-break-all">
                    <TruncatedText maxChars={URL_MAX_DISPLAY_LENGTH}>{subscribeURL}</TruncatedText>
                </span>
            ),
            label: c('Label').t`URL`,
        });

    const getContentRows = (type: CALENDAR_MODAL_TYPE) => {
        if (type === VISUAL) {
            return (
                <>
                    {calendarNameRow}
                    {descriptionRow}
                    {colorRow}
                </>
            );
        }

        if (type === SHARED) {
            return (
                <>
                    {calendarNameRow}
                    {colorRow}
                    {addressRow}
                    {descriptionRow}
                    {defaultNotificationsRow}
                    {busySlotsCheckbox}
                </>
            );
        }

        return (
            <>
                {calendarNameRow}
                {colorRow}
                {addressRow}
                {descriptionRow}
                {defaultEventDurationRow}
                {defaultNotificationsRow}
                {subscribeURLRow}
                {busySlotsCheckbox}
            </>
        );
    };

    return (
        <ModalTwo
            size={getCalendarModalSize(type)}
            fullscreenOnMobile
            className="w-full"
            open={open}
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
                    <ModalTwoHeader title={getTitle(type)} subline={getSubline()} />
                    <ModalTwoContent className="calendar-modal-content">
                        {hasError ? <GenericError /> : getContentRows(type)}
                    </ModalTwoContent>
                    <ModalTwoFooter>
                        {hasError ? (
                            <Button onClick={() => window.location.reload()} className="ml-auto" color="norm">
                                {c('Action').t`Close`}
                            </Button>
                        ) : (
                            <>
                                <Button onClick={onClose} disabled={loadingAction}>
                                    {c('Action').t`Cancel`}
                                </Button>
                                <Button loading={loadingAction} type="submit" color="norm">
                                    {c('Action').t`Save`}
                                </Button>
                            </>
                        )}
                    </ModalTwoFooter>
                </>
            )}
        </ModalTwo>
    );
};

export default PersonalCalendarModal;
