import { selectSubscription } from '@proton/account/subscription';
import { selectUser } from '@proton/account/user';
import {
    TelemetryMeasurementGroups,
    TelemetryMeetActionsEvents,
    TelemetryMeetDashboardEvents,
    TelemetryMeetPerformanceEvents,
} from '@proton/shared/lib/api/telemetry';
import { getDevice, isIpad } from '@proton/shared/lib/helpers/browser';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { getBaseTelemetryDimensions, sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { Api, SimpleMap } from '@proton/shared/lib/interfaces';

import { selectLocalParticipantIdentity, selectParticipantsMap } from '../store/slices/participants/participantsSlice';
import { selectIsGuest } from '../store/slices/userSlice';
import type { MeetState } from '../store/store';
import {
    type DeviceType,
    MEET_ACTIONS_WITH_ROLE,
    MEET_PERFORMANCE_WITH_ROLE,
    type MeetActionsDimensions,
    type MeetActionsValues,
    type MeetDashboardDimensions,
    type MeetPerformanceDimensions,
    type MeetPerformanceValues,
    type Platform,
    type Role,
    type UserType,
} from './events';

export { TelemetryMeetActionsEvents, TelemetryMeetDashboardEvents, TelemetryMeetPerformanceEvents };

type MeetEvent = TelemetryMeetActionsEvents | TelemetryMeetDashboardEvents | TelemetryMeetPerformanceEvents;

interface MeasurementGroupConfig {
    measurementGroup: TelemetryMeasurementGroups;
    withSubscription: boolean;
    eventsWithRole: ReadonlySet<MeetEvent>;
}

const measurementGroups = {
    actions: {
        measurementGroup: TelemetryMeasurementGroups.meetActions,
        withSubscription: true,
        eventsWithRole: MEET_ACTIONS_WITH_ROLE,
    },
    dashboard: {
        measurementGroup: TelemetryMeasurementGroups.meetDashboard,
        withSubscription: true,
        eventsWithRole: new Set(),
    },
    performance: {
        measurementGroup: TelemetryMeasurementGroups.meetPerformance,
        withSubscription: false,
        eventsWithRole: MEET_PERFORMANCE_WITH_ROLE,
    },
} satisfies Record<string, MeasurementGroupConfig>;

interface MeetTelemetryContext {
    api: Api;
    getState: () => MeetState;
    isEnabled: () => boolean;
}

let telemetryContext: MeetTelemetryContext | undefined;

export const initMeetTelemetry = (context: MeetTelemetryContext | undefined) => {
    telemetryContext = context;
};

export const isMeetTelemetryEnabled = () => !!telemetryContext?.isEnabled();

const getPlatform = (): Platform => (isElectronApp ? 'desktop' : 'web');

const getDeviceType = (): DeviceType => {
    const { type } = getDevice();

    if (type === 'mobile') {
        return 'mobile';
    }

    // iPadOS reports itself as a Mac
    if (type === 'tablet' || isIpad()) {
        return 'tablet';
    }

    return 'desktop';
};

const getRole = (state: MeetState): Role => {
    const participant = selectParticipantsMap(state)[selectLocalParticipantIdentity(state)];

    if (participant?.IsHost) {
        return 'host';
    }

    if (participant?.IsAdmin) {
        return 'admin';
    }

    return 'participant';
};

const getUserType = (state: MeetState): UserType => (selectIsGuest(state) ? 'guest' : 'auth');

const getSubscriptionDimensions = (state: MeetState): { subscription: string; isFree: string } => {
    const user = selectUser(state)?.value;

    if (selectIsGuest(state) || !user) {
        return { subscription: 'n/a', isFree: 'n/a' };
    }

    const subscription = selectSubscription(state)?.value;

    if (!subscription) {
        return { subscription: user.isFree ? 'free' : 'unknown', isFree: String(user.isFree) };
    }

    const { subscription: subscriptionName, isFree } = getBaseTelemetryDimensions({ user, subscription });

    return { subscription: subscriptionName, isFree };
};

const serializeDimensions = (dimensions: SimpleMap<string | boolean> | undefined) =>
    dimensions && Object.fromEntries(Object.entries(dimensions).map(([key, value]) => [key, String(value)]));

const roundValues = (values: SimpleMap<number> | undefined) => {
    if (!values) {
        return undefined;
    }

    return Object.fromEntries(
        Object.entries(values)
            .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]))
            .map(([key, value]) => [key, Math.round(value)])
    );
};

const send = (
    { measurementGroup, withSubscription, eventsWithRole }: MeasurementGroupConfig,
    event: MeetEvent,
    dimensions?: SimpleMap<string | boolean>,
    values?: SimpleMap<number>
) => {
    if (!telemetryContext || !isMeetTelemetryEnabled()) {
        return;
    }

    const { api, getState } = telemetryContext;
    const state = getState();

    void sendTelemetryReport({
        api,
        measurementGroup,
        event,
        dimensions: {
            ...serializeDimensions(dimensions),
            userType: getUserType(state),
            platform: getPlatform(),
            deviceType: getDeviceType(),
            ...(withSubscription && getSubscriptionDimensions(state)),
            ...(eventsWithRole.has(event) && { role: getRole(state) }),
        },
        values: roundValues(values),
        delay: false,
    });
};

type EventArgs<Dimensions, Values> = [Values] extends [never]
    ? Dimensions extends Record<string, never>
        ? []
        : [dimensions: Dimensions]
    : [dimensions: Dimensions, values: Values];

type ActionsEventArgs<E extends TelemetryMeetActionsEvents> = EventArgs<
    MeetActionsDimensions[E],
    E extends keyof MeetActionsValues ? MeetActionsValues[E] : never
>;

export const sendMeetActionsEvent = <E extends TelemetryMeetActionsEvents>(event: E, ...args: ActionsEventArgs<E>) => {
    const [dimensions, values] = args as [SimpleMap<string | boolean>?, SimpleMap<number>?];

    send(measurementGroups.actions, event, dimensions, values);
};

export const sendMeetDashboardEvent = <E extends TelemetryMeetDashboardEvents>(
    event: E,
    ...args: EventArgs<MeetDashboardDimensions[E], never>
) => {
    const [dimensions] = args as [SimpleMap<string | boolean>?];

    send(measurementGroups.dashboard, event, dimensions);
};

export const sendMeetPerformanceEvent = <E extends TelemetryMeetPerformanceEvents>(
    event: E,
    dimensions: MeetPerformanceDimensions[E],
    values: MeetPerformanceValues[E]
) => {
    send(measurementGroups.performance, event, dimensions, values);
};
