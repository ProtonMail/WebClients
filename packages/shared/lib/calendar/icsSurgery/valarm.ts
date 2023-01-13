import { DAY_IN_SECONDS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import { normalize } from '../../helpers/string';
import {
    DateTimeValue,
    VcalDateOrDateTimeProperty,
    VcalStringProperty,
    VcalValarmComponent,
    VcalValarmRelativeComponent,
} from '../../interfaces/calendar';
import { getIsAbsoluteTrigger, normalizeDurationToUnit, normalizeTrigger } from '../alarms/trigger';
import { ICAL_ALARM_ACTION, MAX_NOTIFICATIONS, NOTIFICATION_UNITS, NOTIFICATION_UNITS_MAX } from '../constants';
import { getIsDateTimeValue, getIsPropertyAllDay } from '../vcalHelper';

const { DISPLAY, EMAIL, AUDIO } = ICAL_ALARM_ACTION;

export const getSupportedAlarmAction = (action: VcalStringProperty) => {
    if (normalize(action.value) === 'email') {
        return { value: EMAIL };
    }

    return { value: DISPLAY };
};

/**
 * Determine if a VALARM component is correct according to the RFC
 */
export const getIsValidAlarm = (alarm: VcalValarmComponent) => {
    const { action, trigger, duration, repeat } = alarm;
    const supportedActions: string[] = [DISPLAY, EMAIL, AUDIO];

    if (!supportedActions.includes(action?.value)) {
        return false;
    }
    if (!trigger) {
        return false;
    }
    // absolute triggers should have the right format
    if (getIsAbsoluteTrigger(trigger) && !getIsDateTimeValue(trigger.value as DateTimeValue)) {
        return false;
    }
    // duration and repeat must be both present or absent
    if (+!duration ^ +!repeat) {
        return false;
    }
    return true;
};

/**
 * Given a VALARM component, try to transform it into something that we support.
 * Return undefined otherwise
 */
export const getSupportedAlarm = (
    alarm: VcalValarmComponent,
    dtstart: VcalDateOrDateTimeProperty
): VcalValarmRelativeComponent | undefined => {
    if (!getIsValidAlarm(alarm)) {
        return;
    }

    const supportedAction = getSupportedAlarmAction(alarm.action);

    const { trigger } = alarm;

    if (!getIsAbsoluteTrigger(trigger) && trigger.parameters?.related?.toLocaleLowerCase() === 'end') {
        return;
    }

    const normalizedTrigger = normalizeTrigger(trigger, dtstart);
    const triggerDurationInSeconds = normalizeDurationToUnit(normalizedTrigger, 1);

    const inFuture = getIsPropertyAllDay(dtstart)
        ? !normalizedTrigger.isNegative && triggerDurationInSeconds >= DAY_IN_SECONDS
        : !normalizedTrigger.isNegative && triggerDurationInSeconds !== 0;
    const nonSupportedTrigger =
        normalizedTrigger.seconds !== 0 ||
        normalizedTrigger.minutes > NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.MINUTE] ||
        normalizedTrigger.hours > NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.HOUR] ||
        normalizedTrigger.days > NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.DAY] ||
        normalizedTrigger.weeks > NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.WEEK];

    if (inFuture || nonSupportedTrigger) {
        return;
    }

    return {
        component: 'valarm',
        action: supportedAction,
        trigger: { value: normalizedTrigger },
    };
};

export const getSupportedAlarms = (valarms: VcalValarmComponent[], dtstart: VcalDateOrDateTimeProperty) => {
    return valarms
        .map((alarm) => getSupportedAlarm(alarm, dtstart))
        .filter(isTruthy)
        .slice(0, MAX_NOTIFICATIONS);
};
