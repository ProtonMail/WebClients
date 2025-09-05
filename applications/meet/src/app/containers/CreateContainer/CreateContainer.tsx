import { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PasswordInputTwo from '@proton/components/components/v2/input/PasswordInput';
import { IcArrowsRotate, IcKey, IcTextAlignLeft } from '@proton/icons';
import { useCreateMeeting } from '@proton/meet/hooks/useCreateMeeting';
import { getTimeZoneOptions, getTimezone } from '@proton/shared/lib/date/timezone';
import { MeetingType } from '@proton/shared/lib/interfaces/Meet';
import noop from '@proton/utils/noop';

import { CloseButton } from '../../atoms/CloseButton/CloseButton';
import { MeetingCreatedModal } from '../../components/MeetingCreatedModal/MeetingCreatedModal';
import { TimeInputBlock } from '../../components/TimeInputBlock';
import { combineDateAndTime, getInitialValues, validate } from './utils';

import './CreateContainer.scss';

const repeatOptions = [
    { label: 'No repeat', value: 'NO_REPEAT' },
    { label: 'Every day', value: 'FREQ=DAILY' },
    { label: 'Every weekday', sublabel: 'Monday to Friday', value: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' },
    { label: 'Every month', value: 'FREQ=MONTHLY' },
    { label: 'Every year', value: 'FREQ=YEARLY' },
];

const minutes = ['00', '15', '30', '45'];
const timeOptions = [...Array(24).keys()]
    .map((item) => {
        const hourString = item > 9 ? item : `${0}${item}`;

        return minutes.map((minute) => ({
            value: `${hourString}:${minute}`,
            label: `${hourString}:${minute}`,
        }));
    })
    .flat();

const timeZoneSelectOptions = getTimeZoneOptions().map((option) => ({ label: option.text, value: option.value }));
interface CreateContainerProps {
    isEdit?: boolean;
}

export const CreateContainer = ({ isEdit = false }: CreateContainerProps) => {
    const [user] = useUser();

    const userTimeZone = getTimezone();

    const history = useHistory();

    const [advancedOptions, setAdvancedOptions] = useState(false);

    const [showTimezones, setShowTimezones] = useState(false);

    const [result, setResult] = useState<{
        meetingLink: string;
        id: string;
    } | null>(null);

    const [values, setValues] = useState({
        ...getInitialValues(),
        timeZone: userTimeZone,
        meetingName: c('Info').t`${user.DisplayName}'s Meeting`,
    });

    const { createMeeting } = useCreateMeeting();

    const timeZoneAction = showTimezones ? c('Action').t`Hide timezones` : c('Action').t`Show timezones`;

    const errors = useMemo(() => validate(values), [values]);

    const isDisabled = useMemo(() => {
        return Object.values(errors).some((error) => error);
    }, [errors]);

    const handleSubmit = async () => {
        const { startDate, recurrence, ...restOfValues } = values;

        const startTime = combineDateAndTime(startDate, values.startTime);

        const endTime = combineDateAndTime(values.endDate, values.endTime);

        const type = recurrence ? MeetingType.RECURRING : MeetingType.SCHEDULED;

        const rrule = recurrence === 'NO_REPEAT' ? null : recurrence;

        try {
            const { meetingLink, id } = await createMeeting({
                ...restOfValues,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                recurrence: rrule,
                type,
            });

            setResult({
                meetingLink: `${window.location.origin}${meetingLink}`,
                id,
            });
        } catch (error) {
            window.alert(error instanceof Error ? error.message : c('Error').t`Failed to create meeting`);
        }
    };

    useEffect(() => {
        if (values.startTime >= values.endTime) {
            setValues((prev) => ({
                ...prev,
                endTime: timeOptions.find((option) => option.value > values.startTime)?.value ?? values.startTime,
            }));
        }
    }, [values.startTime, values.endTime]);

    const startTimeOptions = useMemo(() => {
        const now = new Date();
        return timeOptions.filter((option) => combineDateAndTime(values.startDate, option.value) > now);
    }, [values.startDate]);

    const endTimeOptions = useMemo(() => {
        const now = new Date();
        return timeOptions.filter((option) => combineDateAndTime(values.endDate, option.value) > now);
    }, [values.endDate]);

    return (
        <>
            {result && (
                <MeetingCreatedModal
                    values={values}
                    meetingLink={result.meetingLink}
                    startTime={combineDateAndTime(values.startDate, values.startTime)}
                    endTime={combineDateAndTime(values.endDate, values.endTime)}
                    timeZone={values.timeZone}
                    id={result.id}
                    onClose={() => history.push('/join')}
                />
            )}
            <div
                className="create-container w-full h-full flex items-center justify-center w-custom p-4"
                style={{ '--w-custom': '37.5rem' }}
            >
                <div className="mt-4 w-full absolute top-0 left-0 flex items-center justify-end gap-2">
                    {isEdit && (
                        <>
                            <Button className="secondary-action-button rounded-full" onClick={noop} size="large">
                                {c('Action').t`Delete`}
                            </Button>
                            <Button className="secondary-action-button rounded-full" onClick={noop} size="large">
                                {c('Action').t`Share`}
                            </Button>
                        </>
                    )}
                    <Button
                        className="bg-primary rounded-full"
                        onClick={handleSubmit}
                        size="large"
                        disabled={isDisabled}
                    >{c('Action').t`Create meeting`}</Button>

                    <CloseButton onClose={() => history.push('/join')} />
                </div>
                <div className="w-custom flex flex-column gap-2 my-auto" style={{ '--w-custom': '40rem' }}>
                    <div className="text-4xl mb-6 w-full text-center">{c('Title').t`Schedule a meeting`}</div>

                    <div className="w-full flex flex-nowrap items-center gap-4">
                        <IcTextAlignLeft size={5} />
                        <InputFieldTwo
                            id="meetingName"
                            name="meetingName"
                            placeholder={c('Placeholder').t`Enter meeting title`}
                            onChange={(e) => setValues({ ...values, meetingName: e.target.value })}
                            autoComplete="off"
                            value={values.meetingName}
                            error={errors.meetingName}
                        />
                    </div>
                    <div className="w-full flex flex-nowrap items-center justify-end gap-2">
                        <Button
                            className="text-underline color-primary ml-auto rounded-full"
                            shape="ghost"
                            onClick={() => setShowTimezones(!showTimezones)}
                        >
                            {timeZoneAction}
                        </Button>
                    </div>

                    <TimeInputBlock
                        name="start"
                        values={values}
                        setValues={setValues}
                        showTimezones={showTimezones}
                        timeOptions={startTimeOptions}
                        timeZoneOptions={timeZoneSelectOptions}
                        timeError={errors.startTime}
                    />

                    <TimeInputBlock
                        name="end"
                        values={values}
                        setValues={setValues}
                        showTimezones={showTimezones}
                        timeOptions={endTimeOptions}
                        timeZoneOptions={timeZoneSelectOptions}
                        showIcon={false}
                        editableTimeZone={false}
                        timeError={errors.endTime}
                    />
                    <div className="w-full flex flex-nowrap items-center gap-4">
                        <IcArrowsRotate size={5} />
                        <SelectTwo
                            onChange={(item: { value: string }) => {
                                setValues({ ...values, recurrence: item.value as string });
                            }}
                            value={values.recurrence}
                        >
                            {repeatOptions.map((option) => (
                                <Option key={option.value} value={option.value} title={option.label}>
                                    {option.label}
                                </Option>
                            ))}
                        </SelectTwo>
                    </div>

                    {advancedOptions && (
                        <>
                            <div className="w-full flex flex-nowrap items-center gap-1 text-center mt-4">
                                <IcKey className="visibility-hidden" size={5} />
                                <div className="flex flex-column flex-nowrap items-center gap-1">
                                    <div className="text-xl text-semibold">{c('Title').t`Secret Passphrase`}</div>
                                    <div className="color-weak px-2">{c('Info')
                                        .t`For extra security, you can set a passphrase. It won’t be included in the calendar invite—remember to share it with your guests separately.`}</div>
                                </div>
                            </div>
                            <div className="w-full flex flex-nowrap items-center gap-4">
                                <IcKey size={5} />
                                <InputFieldTwo
                                    id="customPassword"
                                    name="customPassword"
                                    placeholder={c('Placeholder').t`Enter secret passphrase`}
                                    as={PasswordInputTwo}
                                    autoComplete="off"
                                    value={values.customPassword}
                                    onChange={(e) => setValues({ ...values, customPassword: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    <div className="w-full flex flex-nowrap items-start gap-4">
                        {advancedOptions ? (
                            <Button
                                className="create-container-button text-underline color-primary rounded-full user-select-none ml-4"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setAdvancedOptions(false);
                                }}
                                shape="ghost"
                            >{c('Action').t`Hide advanced options`}</Button>
                        ) : (
                            <Button
                                className="create-container-button text-underline color-primary rounded-full user-select-none ml-4"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setAdvancedOptions(true);
                                }}
                                shape="ghost"
                            >{c('Action').t`Show advanced options`}</Button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
