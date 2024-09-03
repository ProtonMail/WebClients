import { useEffect, useState } from 'react';

import {
    addHours,
    addWeeks,
    differenceInSeconds,
    endOfDay,
    format,
    isAfter,
    isBefore,
    isSameDay,
    isToday,
    isTomorrow,
    roundToNearestMinutes,
    set,
    startOfDay,
} from 'date-fns';
import { c } from 'ttag';

import { Href } from '@proton/atoms';
import generateUID from '@proton/atoms/generateUID';
import {
    Checkbox,
    DateInputTwo,
    InputFieldTwo,
    TimeInput,
    useNotifications,
    useUserSettings,
} from '@proton/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { isValidDate } from '@proton/shared/lib/date/date';
import { setBit } from '@proton/shared/lib/helpers/bitset';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';

import { useMailDispatch } from 'proton-mail/store/hooks';

import { MAX_EXPIRATION_TIME } from '../../../constants';
import { useExternalExpiration } from '../../../hooks/composer/useExternalExpiration';
import { updateExpires } from '../../../store/messages/draft/messagesDraftActions';
import type { MessageState } from '../../../store/messages/messagesTypes';
import type { MessageChange } from '../Composer';
import ComposerInnerModal from './ComposerInnerModal';
import PasswordInnerModalForm from './PasswordInnerModalForm';

const formatDateInput = (value: Date, locale: Locale) => {
    if (isToday(value)) {
        return c('Date label').t`Today`;
    }

    if (isTomorrow(value)) {
        return c('Date label').t`Tomorrow`;
    }

    return format(value, 'PP', { locale });
};

interface Props {
    message?: MessageState;
    onClose: () => void;
    onChange: MessageChange;
}

const ComposerExpirationModal = ({ message, onClose, onChange }: Props) => {
    const dispatch = useMailDispatch();
    const { createNotification } = useNotifications();
    const [userSettings] = useUserSettings();

    const [uid] = useState(generateUID('password-modal'));
    const isExpirationSet = message?.draftFlags?.expiresIn;
    const [isSendOutside, setIsSendOutside] = useState(false);

    const { password, setPassword, passwordHint, setPasswordHint, validator, onFormSubmit } =
        useExternalExpiration(message);
    const isPasswordSet = !!password;
    const currentDate = new Date();
    const [date, setDate] = useState<Date>(set(addWeeks(currentDate, 1), { hours: 9, minutes: 0, seconds: 0 }));

    useEffect(() => {
        if (message?.draftFlags && message.draftFlags.expiresIn) {
            setDate(message.draftFlags.expiresIn);
        }
    }, []);

    const minDate = startOfDay(currentDate);
    const maxDate = addHours(currentDate, MAX_EXPIRATION_TIME);

    const timeError = isBefore(date, currentDate)
        ? c('Error').t`Choose a date in the future.`
        : isAfter(date, maxDate)
          ? c('Error').t`Maximum expiration time reached.`
          : undefined;
    const minTime = isToday(date) ? roundToNearestMinutes(currentDate, { nearestTo: 30 }) : startOfDay(date);
    const maxTime = isSameDay(date, maxDate) ? maxDate : endOfDay(date);

    const handleChange = (type: 'date' | 'time', newDate?: Date) => {
        if (!newDate) {
            return;
        }

        let newFormattedDate = date;
        if (type === 'date') {
            newFormattedDate = set(date, {
                year: newDate.getFullYear(),
                month: newDate.getMonth(),
                date: newDate.getDate(),
            });
        } else {
            newFormattedDate = set(date, {
                hours: newDate.getHours(),
                minutes: newDate.getMinutes(),
            });
        }

        setDate(newFormattedDate);
    };

    const handleCancel = () => {
        onClose();
    };

    const handleSubmit = () => {
        if (!onFormSubmit()) {
            return;
        }

        const secondsDelta = differenceInSeconds(date, currentDate);

        if (isSendOutside && !isPasswordSet) {
            return;
        }
        if (Number.isNaN(secondsDelta)) {
            createNotification({
                type: 'error',
                text: c('Error').t`Invalid expiration time`,
            });
            return;
        }
        if (secondsDelta === 0) {
            handleCancel();
            return;
        }

        if (secondsDelta > MAX_EXPIRATION_TIME * 3600) {
            createNotification({
                type: 'error',
                text: c('Error').t`The maximum expiration is 4 weeks`,
            });
            return;
        }
        if (isPasswordSet) {
            onChange(
                (message) => ({
                    data: {
                        Flags: setBit(message.data?.Flags, MESSAGE_FLAGS.FLAG_INTERNAL),
                        Password: password,
                        PasswordHint: passwordHint,
                    },
                    draftFlags: { expiresIn: date },
                }),
                true
            );
        } else {
            onChange({ draftFlags: { expiresIn: date } });
        }
        dispatch(updateExpires({ ID: message?.localID || '', expiresIn: date }));
        onClose();
    };

    // translator: this is a hidden text, only for screen reader, to complete a label
    const descriptionExpirationTime = c('Info').t`Expiration time`;

    return (
        <ComposerInnerModal
            title={
                isExpirationSet
                    ? c('Info').t`Edit expiration time`
                    : c('Adding expiration to a message will create an expiring message').t`Expiring message`
            }
            disabled={!isValidDate(date) || !!timeError}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
        >
            <div className="flex flex-column flex-nowrap mb-4">
                <div className="mb-4">
                    <span className="sr-only" id={`composer-expiration-string-${uid}`}>
                        {descriptionExpirationTime}
                    </span>
                    <p className="my-0">{c('Info')
                        .t`When do you want your message to be automatically deleted from the recipient's inbox and your sent folder?`}</p>
                    <Href href={getKnowledgeBaseUrl('/expiration/')}>{c('Link').t`Learn more`}</Href>
                </div>

                <div className="flex gap-2 flex-row">
                    <div className="flex-1">
                        <InputFieldTwo
                            as={DateInputTwo}
                            id="expiration-date"
                            label={c('Label attach to date input to select a date').t`Date`}
                            onChange={(date?: Date) => handleChange('date', date)}
                            value={date}
                            toFormatter={formatDateInput}
                            weekStartsOn={getWeekStartsOn({ WeekStart: userSettings.WeekStart })}
                            min={minDate}
                            max={maxDate}
                            preventValueReset
                            data-testid="composer:expiration-days"
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <InputFieldTwo
                            as={TimeInput}
                            id="expiration-time"
                            label={c('Label attach to time input to select hours').t`Time`}
                            onChange={(date?: Date) => handleChange('time', date)}
                            value={date}
                            min={minTime}
                            max={maxTime}
                            error={timeError}
                            data-testid="composer:expiration-hours"
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-nowrap mb-4">
                <Checkbox
                    className="mr-4 inline-block"
                    id="sentOutside"
                    checked={isSendOutside}
                    onChange={() => setIsSendOutside(!isSendOutside)}
                />
                <label htmlFor="sentOutside">
                    {
                        // translator: full sentence "I'm sending this message to a non-Proton Mail user."
                        c('Info').t`I'm sending this message to a non-${MAIL_APP_NAME} user.`
                    }
                </label>
            </div>

            {isSendOutside && (
                <PasswordInnerModalForm
                    password={password}
                    setPassword={setPassword}
                    passwordHint={passwordHint}
                    setPasswordHint={setPasswordHint}
                    validator={validator}
                />
            )}
        </ComposerInnerModal>
    );
};

export default ComposerExpirationModal;
