import isTruthy from '@proton/utils/isTruthy';

import { normalize } from '../../helpers/string';
import {
    DateTimeValue,
    VcalDateOrDateTimeProperty,
    VcalStringProperty,
    VcalValarmComponent,
    VcalValarmRelativeComponent,
} from '../../interfaces/calendar';
import { MAX_NOTIFICATIONS, NOTIFICATION_UNITS, NOTIFICATION_UNITS_MAX } from '../constants';
import { getIsAbsoluteTrigger, normalizeDurationToUnit, normalizeTrigger } from '../trigger';
import { getIsDateTimeValue, getIsPropertyAllDay } from '../vcalHelper';

const getSupportedAlarmAction = (action: VcalStringProperty) => {
    if (normalize(action.value) === 'email') {
        return { value: 'EMAIL' };
    }

    return { value: 'DISPLAY' };
};

/**
 * Determine if a VALARM component is correct according to the RFC
 */
export const getIsValidAlarm = (alarm: VcalValarmComponent) => {
    const { action, trigger, duration, repeat } = alarm;
    if (!['AUDIO', 'DISPLAY', 'EMAIL'].includes(action?.value)) {
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
        ? !normalizedTrigger.isNegative && triggerDurationInSeconds >= 24 * 60 * 60
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
