import { useEffect, useState } from 'react';

import { getHours, getMinutes, isValid, parseISO, set } from 'date-fns';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';

import TimeInput from '../../input/TimeInput';
import InputFieldTwo from '../../v2/field/InputField';
import DateInputTwo from '../../v2/input/DateInputTwo';
import type { CardBodyProps } from '../types';

export interface DateTimeFieldSpec {
    /** The param this pair edits; its value is an ISO 8601 datetime. */
    param: string;
    dateLabel: string;
    timeLabel: string;
    /** Used when the param holds no usable datetime — the model may have supplied neither. Must be stable. */
    fallback: () => Date;
    /**
     * The registering tool's range rule (future-only, after the start field, …). Applied to the PROPOSAL
     * only — one it rejects is replaced by {@link fallback}, so the user never meets a disabled Confirm with
     * no cause, while a date the user goes on to pick is displayed exactly as picked.
     */
    accepts?: (date: Date) => boolean;
}

interface Props extends Pick<CardBodyProps, 'params' | 'onChange'> {
    /** One spec per datetime the card edits: one for a wake time, two for a window. */
    fields: DateTimeFieldSpec[];
}

const withTimeOfDay = (day: Date, time: Date) =>
    set(day, { hours: getHours(time), minutes: getMinutes(time), seconds: 0, milliseconds: 0 });

/** `parseISO` returns an Invalid Date for anything that isn't an ISO string, hence the cast over a type guard. */
const parseIso = (raw: unknown) => {
    const parsed = parseISO(raw as string);
    return isValid(parsed) ? parsed : undefined;
};

const usableProposal = (raw: unknown, accepts?: (date: Date) => boolean) => {
    const parsed = parseIso(raw);
    return parsed && (!accepts || accepts(parsed)) ? parsed : undefined;
};

/**
 * Editable date + time pairs for a Lumo confirm card, one pair per {@link DateTimeFieldSpec}. Product-blind:
 * the params it edits and the labels it shows arrive as props, so it never learns what a "wake time" is.
 * Both inputs read and write through `dateLocale`. Range rules (future-only, end after start) stay the
 * registering tool's to define — this only applies the one it passes as {@link DateTimeFieldSpec.accepts},
 * and only to the incoming proposal.
 */
const DateTimeBody = ({ params, onChange, fields }: Props) => {
    const [userSettings] = useUserSettings();

    const [resolved] = useState(() =>
        Object.fromEntries(
            fields.map(({ param, fallback, accepts }) => [
                param,
                (usableProposal(params[param], accepts) ?? fallback()).toISOString(),
            ])
        )
    );

    // The card shell captured `params` before this mounted, so a fallback that is only rendered would let
    // the user confirm a datetime the tool never receives. Report it once instead of waiting for an edit.
    useEffect(() => {
        if (fields.some(({ param, accepts }) => !usableProposal(params[param], accepts))) {
            onChange({ ...params, ...resolved });
        }
    }, []);

    const emit = (param: string, next: Date) => onChange({ ...params, [param]: next.toISOString() });

    return (
        <div className="flex flex-column gap-2">
            {fields.map(({ param, dateLabel, timeLabel }) => {
                const current = parseIso(params[param]) ?? new Date(resolved[param]);

                return (
                    <div key={param} className="flex flex-row flex-nowrap gap-2">
                        <InputFieldTwo
                            as={DateInputTwo}
                            dense
                            label={dateLabel}
                            value={current}
                            weekStartsOn={getWeekStartsOn(userSettings)}
                            preventValueReset
                            onChange={(date?: Date) => {
                                if (!date) {
                                    return;
                                }
                                emit(param, withTimeOfDay(date, current));
                            }}
                        />
                        <InputFieldTwo
                            as={TimeInput}
                            dense
                            label={timeLabel}
                            value={current}
                            onChange={(time: Date) => emit(param, withTimeOfDay(current, time))}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default DateTimeBody;
