import isTruthy from '../../helpers/isTruthy';
import {
    DateTimeValue,
    VcalDateOrDateTimeProperty,
    VcalValarmComponent,
    VcalValarmRelativeComponent,
} from '../../interfaces/calendar';
import { DAY, isAbsoluteTrigger, normalizeDurationToUnit, normalizeTrigger } from '../alarms';
import { MAX_NOTIFICATIONS, NOTIFICATION_UNITS, NOTIFICATION_UNITS_MAX } from '../constants';
import { getIsDateTimeValue, getIsPropertyAllDay } from '../vcalHelper';

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
    if (isAbsoluteTrigger(trigger) && !getIsDateTimeValue(trigger.value as DateTimeValue)) {
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

    const { trigger } = alarm;

    if (!isAbsoluteTrigger(trigger) && trigger.parameters?.related?.toLocaleLowerCase() === 'end') {
        return;
    }
    if (alarm.action.value === 'EMAIL') {
        return;
    }

    const normalizedTrigger = normalizeTrigger(trigger, dtstart);
    const triggerDurationInSeconds = normalizeDurationToUnit(normalizedTrigger, 1);

    const inFuture = getIsPropertyAllDay(dtstart)
        ? !normalizedTrigger.isNegative && triggerDurationInSeconds >= DAY
        : !normalizedTrigger.isNegative && triggerDurationInSeconds !== 0;
    const nonSupportedTrigger =
        normalizedTrigger.seconds !== 0 ||
        normalizedTrigger.minutes > NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.MINUTES] ||
        normalizedTrigger.hours > NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.HOURS] ||
        normalizedTrigger.days > NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.DAY] ||
        normalizedTrigger.weeks > NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.WEEK];

    if (inFuture || nonSupportedTrigger) {
        return;
    }

    return {
        component: 'valarm',
        action: { value: 'DISPLAY' },
        trigger: { value: normalizedTrigger },
    };
};

export const getSupportedAlarms = (valarms: VcalValarmComponent[], dtstart: VcalDateOrDateTimeProperty) => {
    return valarms
        .map((alarm) => getSupportedAlarm(alarm, dtstart))
        .filter(isTruthy)
        .slice(0, MAX_NOTIFICATIONS);
};
