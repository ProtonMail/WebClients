import { ChangeEvent, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { isToday, isTomorrow } from 'date-fns';
import { c, msgid } from 'ttag';

import { Checkbox, FeatureCode, Href, generateUID, useFeatures, useNotifications } from '@proton/components';
import { setBit } from '@proton/shared/lib/helpers/bitset';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import range from '@proton/utils/range';

import { MAX_EXPIRATION_TIME } from '../../../constants';
import { formatDateToHuman } from '../../../helpers/date';
import { useExternalExpiration } from '../../../hooks/composer/useExternalExpiration';
import { updateExpires } from '../../../logic/messages/draft/messagesDraftActions';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { MessageChange } from '../Composer';
import ComposerInnerModal from './ComposerInnerModal';
import PasswordInnerModalForm from './PasswordInnerModalForm';

// expiresIn value is in seconds and default is 7 days
const ONE_WEEK = 3600 * 24 * 7;

const initValues = ({ draftFlags = {} }: Partial<MessageState> = {}) => {
    const { expiresIn = ONE_WEEK } = draftFlags;
    const deltaHours = expiresIn / 3600;
    const deltaDays = Math.floor(deltaHours / 24);

    return {
        days: deltaDays,
        hours: deltaHours % 24,
    };
};

const computeHours = ({ days, hours }: { days: number; hours: number }) => hours + days * 24;

const optionRange = (size: number) =>
    range(0, size).map((value) => (
        <option key={value} value={value}>
            {value}
        </option>
    ));

const getExpirationText = (days: number, hours: number) => {
    const expirationDate = new Date().getTime() + (days * 3600 * 24 + hours * 3600) * 1000;
    const { dateString, formattedTime } = formatDateToHuman(expirationDate);

    if (isToday(expirationDate)) {
        /*
         * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
         * Full sentence for reference: "Your message will be deleted from the recipient's inbox and your sent folder today at 12:30 PM"
         */
        return c('Info')
            .t`Your message will be deleted from the recipient's inbox and your sent folder today at ${formattedTime}`;
    } else if (isTomorrow(expirationDate)) {
        /*
         * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
         * Full sentence for reference: "Your message will be deleted from the recipient's inbox and your sent folder tomorrow at 12:30 PM"
         */
        return c('Info')
            .t`Your message will be deleted from the recipient's inbox and your sent folder tomorrow at ${formattedTime}`;
    } else {
        /*
         * translator: The variables here are the following.
         * ${dateString} can be either "on Tuesday, May 11", for example, or "today" or "tomorrow"
         * ${formattedTime} is the date formatted in user's locale (e.g. 11:00 PM)
         * Full sentence for reference: "Your message will be deleted from the recipient's inbox and your sent folder  on Tuesday, May 11 at 12:30 PM"
         */
        return c('Info')
            .t`Your message will be deleted from the recipient's inbox and your sent folder on ${dateString} at ${formattedTime}`;
    }
};

interface Props {
    message?: MessageState;
    onClose: () => void;
    onChange: MessageChange;
}

const ComposerExpirationModal = ({ message, onClose, onChange }: Props) => {
    const dispatch = useDispatch();
    const {
        password,
        setPassword,
        passwordHint,
        setPasswordHint,
        isPasswordSet,
        setIsPasswordSet,
        isMatching,
        setIsMatching,
        validator,
        onFormSubmit,
    } = useExternalExpiration(message);
    const [{ feature: EORedesignFeature, loading }] = useFeatures([FeatureCode.EORedesign]);

    const isEORedesign = EORedesignFeature?.Value;

    const [uid] = useState(generateUID('password-modal'));

    const [isSendOutside, setIsSendOutside] = useState(false);

    const values = initValues(message);

    const [days, setDays] = useState(values.days);
    const [hours, setHours] = useState(values.hours);
    const { createNotification } = useNotifications();

    const valueInHours = computeHours({ days, hours });

    const handleChange = (setter: (value: number) => void) => (event: ChangeEvent<HTMLSelectElement>) => {
        const value = Number(event.target.value);
        setter(value);

        if (setter === setDays && value === 28) {
            setHours(0);
        }
    };

    const handleCancel = () => {
        onChange({ draftFlags: { expiresIn: undefined } });
        onClose();
    };

    const handleSubmit = () => {
        onFormSubmit();

        if (isSendOutside && !isPasswordSet) {
            return;
        }

        if (Number.isNaN(valueInHours)) {
            createNotification({
                type: 'error',
                text: c('Error').t`Invalid expiration time`,
            });
            return;
        }

        if (valueInHours === 0) {
            handleCancel();
            return;
        }

        if (valueInHours > MAX_EXPIRATION_TIME) {
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
                    draftFlags: { expiresIn: valueInHours * 3600 },
                }),
                true
            );
        } else {
            onChange({ draftFlags: { expiresIn: valueInHours * 3600 } });
        }
        dispatch(updateExpires({ ID: message?.localID || '', expiresIn: valueInHours * 3600 }));
        onClose();
    };

    const disabled = Number.isNaN(valueInHours);

    // translator: this is a hidden text, only for screen reader, to complete a label
    const descriptionExpirationTime = c('Info').t`Expiration time`;

    const expirationText = useMemo(() => {
        return getExpirationText(days, hours);
    }, [days, hours]);

    if (loading) {
        return null;
    }

    return (
        <ComposerInnerModal
            title={isPasswordSet ? c('Info').t`Edit expiration time` : c('Info').t`Expiring message`}
            disabled={disabled}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
        >
            <div className="flex flex-column flex-nowrap mt1 mb1">
                <span className="sr-only" id={`composer-expiration-string-${uid}`}>
                    {descriptionExpirationTime}
                </span>
                <div className="flex flex-gap-0-5 flex-row">
                    <div className="flex-item-fluid flex flex-column flex-nowrap">
                        <label htmlFor={`composer-expiration-days-${uid}`} className="mr0-5 text-semibold">
                            {
                                // translator: the word is preceded by the number of days, between 0 and 28
                                c('Info').ngettext(msgid`Day`, `Days`, days)
                            }
                        </label>
                        <select
                            id={`composer-expiration-days-${uid}`}
                            className="field mr0-25"
                            value={days}
                            onChange={handleChange(setDays)}
                            placeholder={c('Info').ngettext(msgid`Day`, `Days`, days)}
                            aria-describedby={`composer-expiration-string-${uid}`}
                            data-testid="composer:expiration-days"
                        >
                            {optionRange(7 * 4 + 1)}
                        </select>
                    </div>
                    <div className="flex-item-fluid flex flex-column flex-nowrap">
                        <label htmlFor={`composer-expiration-hours-${uid}`} className="text-semibold">
                            {
                                // translator: the word is preceded by the number of hours, between 0 and 23
                                c('Info').ngettext(msgid`Hour`, `Hours`, hours)
                            }
                        </label>
                        <select
                            id={`composer-expiration-hours-${uid}`}
                            className="field mr0-25"
                            value={hours}
                            onChange={handleChange(setHours)}
                            disabled={days === 28}
                            aria-describedby={`composer-expiration-string-${uid}`}
                            data-testid="composer:expiration-hours"
                        >
                            {optionRange(24)}
                        </select>
                    </div>
                </div>
            </div>

            <p className="mt0 color-weak">{expirationText}</p>

            {isEORedesign && (
                <div className="flex flex-nowrap mb1">
                    <Checkbox
                        className="mr1 inline-block"
                        checked={isSendOutside}
                        onChange={() => setIsSendOutside(!isSendOutside)}
                    />
                    <span>
                        {c('Info').t`I'm sending this message to a non-Proton Mail user.`}
                        <Href href={getKnowledgeBaseUrl('/expiration/')} className="ml0-25">{c('Link')
                            .t`Learn more`}</Href>
                    </span>
                </div>
            )}

            {isSendOutside && (
                <PasswordInnerModalForm
                    message={message}
                    password={password}
                    setPassword={setPassword}
                    passwordHint={passwordHint}
                    setPasswordHint={setPasswordHint}
                    isPasswordSet={isPasswordSet}
                    setIsPasswordSet={setIsPasswordSet}
                    isMatching={isMatching}
                    setIsMatching={setIsMatching}
                    validator={validator}
                />
            )}
        </ComposerInnerModal>
    );
};

export default ComposerExpirationModal;
