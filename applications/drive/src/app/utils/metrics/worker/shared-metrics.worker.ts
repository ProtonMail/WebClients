/// <reference lib="webworker" />
import { expose } from 'comlink';

import metrics from '@proton/metrics';
import type { HttpsProtonMeDriveUsersSuccessRateTotalV1SchemaJson } from '@proton/metrics/types/drive_users_success_rate_total_v1.schema';

import type { MetricSharedWorkerInterface } from '../types/userSuccessMetricsTypes';
import { UserAvailabilityTypes } from '../types/userSuccessMetricsTypes';

declare const self: SharedWorkerGlobalScope;

const FIVE_MINUTES_IN_MILLISECONDS = 5 * 60 * 1000;

// Hold the availability status for all connections to the SharedWorker
// The primary key to access the information is the connectionId
// Map<connectionId, Map<UserAvailabilityTypes, number>>
let status: Map<string, Map<UserAvailabilityTypes, number>> = new Map();

// The one and ONLY interval on the SharedWorker
let intervalId: ReturnType<typeof setInterval>;

type UserProperties = 'uid' | 'accessToken' | 'appVersion' | 'clientID' | 'plan';
// The user informations on each connections to the SharedWorker
// The primary key to access the information is the connectionId
// Map<connectionId, Map<'uid' | 'accessToken' | 'appVersion' | 'clientID' | 'plan', string | undefined>> = new Map();
const users: Map<string, Map<UserProperties, string | undefined>> = new Map();

type Report = {
    user: Map<UserProperties, string | undefined>;
    mark: HttpsProtonMeDriveUsersSuccessRateTotalV1SchemaJson['Labels'];
};

export class MetricSharedWorker implements MetricSharedWorkerInterface {
    constructor() {
        this.init();
    }

    public init = () => {
        if (intervalId == null) {
            status = new Map();
            intervalId = setInterval(async () => {
                await this.reports();
            }, FIVE_MINUTES_IN_MILLISECONDS);
        }
    };

    public report = async (reports: Report[]) => {
        const grouped = new Map<
            string, // the user uid used for the backend request
            {
                clientID: string;
                appVersion: string;
                accessToken?: string;
                mark: HttpsProtonMeDriveUsersSuccessRateTotalV1SchemaJson['Labels'];
            }
        >();

        // We have a list of reports but they may be duplicate reports per user if user used the app in both private/public context in the same time
        // We group by user to ensure it's one report per user
        for (const { user, mark } of reports) {
            const clientID = user.get('clientID');
            const appVersion = user.get('appVersion');
            const uid = user.get('uid');
            // Mandatory fields for API calls
            if (!clientID || !appVersion || !uid) {
                continue;
            }

            // Most cases, user only in one app (either private or public)
            if (!grouped.has(uid)) {
                grouped.set(uid, {
                    mark,
                    clientID,
                    appVersion,
                    accessToken: user.get('accessToken'),
                });
            } else {
                // case where user is in both private and public
                // we should report only as one user and not two
                // we merge the mark
                const currentMark = grouped.get(uid);
                if (currentMark) {
                    for (const prop in currentMark.mark) {
                        if (Object.prototype.hasOwnProperty.call(currentMark.mark, prop)) {
                            const label = prop as keyof HttpsProtonMeDriveUsersSuccessRateTotalV1SchemaJson['Labels'];
                            // Report error for user (regardless of private/public app)
                            if (label !== 'plan' && mark[label] === 'true') {
                                currentMark.mark[label] = 'true';
                            }
                            // Report user plan if we know it
                            if (label === 'plan' && mark[label] !== 'unknown') {
                                currentMark.mark[label] = mark[label];
                            }
                        }
                    }
                }
            }
        }

        // Increment each user via a separate HTTP call to respect the backend headers
        for (const [uid, { clientID, appVersion, accessToken, mark }] of grouped) {
            metrics.setVersionHeaders(clientID, appVersion);
            metrics.setAuthHeaders(uid, accessToken);
            metrics.drive_users_success_rate_total.increment({
                ...mark,
            });
            try {
                await metrics.processAllRequests();
            } finally {
                metrics.clearAuthHeaders();
            }
        }
    };

    private getPlan = (plan?: string): HttpsProtonMeDriveUsersSuccessRateTotalV1SchemaJson['Labels']['plan'] => {
        switch (plan) {
            case 'free':
                return 'free';
            case 'paid':
                return 'paid';
            default:
                return 'unknown';
        }
    };

    private initConnectionId = (connectionId: string) => {
        const id = status.get(connectionId);
        if (!id) {
            status.set(connectionId, new Map());
        }
    };

    public reports = async () => {
        const reports: Report[] = [];

        for (const [connectionId, value] of status) {
            const coreFeature = value.get(UserAvailabilityTypes.coreFeatureError);
            const recovered = value.get(UserAvailabilityTypes.recoveredError);
            const handled = value.get(UserAvailabilityTypes.handledError);
            const unhandled = value.get(UserAvailabilityTypes.unhandledError);
            const user = users.get(connectionId);
            const now = Date.now();

            if (user) {
                reports.push({
                    user,
                    mark: {
                        plan: this.getPlan(user.get('plan')),
                        [UserAvailabilityTypes.coreFeatureError]: Boolean(
                            typeof coreFeature === 'number' && now - coreFeature <= FIVE_MINUTES_IN_MILLISECONDS
                        )
                            ? 'true'
                            : 'false',
                        [UserAvailabilityTypes.recoveredError]: Boolean(
                            typeof recovered === 'number' && now - recovered <= FIVE_MINUTES_IN_MILLISECONDS
                        )
                            ? 'true'
                            : 'false',
                        [UserAvailabilityTypes.handledError]: Boolean(
                            typeof handled === 'number' && now - handled <= FIVE_MINUTES_IN_MILLISECONDS
                        )
                            ? 'true'
                            : 'false',
                        [UserAvailabilityTypes.unhandledError]: Boolean(
                            typeof unhandled === 'number' && now - unhandled <= FIVE_MINUTES_IN_MILLISECONDS
                        )
                            ? 'true'
                            : 'false',
                    },
                });
            }
        }
        await this.report(reports);
    };

    public mark = (connectionId: string, type: UserAvailabilityTypes) => {
        const id = status.get(connectionId);
        if (!id) {
            const map = new Map();
            map.set(type, Date.now());
            status.set(connectionId, map);
        } else {
            id.set(type, Date.now());
        }
    };

    private createOrUpdateUser = (
        connectionId: string,
        partialUser: Partial<{
            [K in UserProperties]: string | undefined;
        }>
    ) => {
        const user = users.get(connectionId);
        if (!user) {
            const map = new Map<UserProperties, string | undefined>();
            for (const key in partialUser) {
                map.set(key as UserProperties, partialUser[key as UserProperties]);
            }
            users.set(connectionId, map);
        } else {
            for (const key in partialUser) {
                user.set(key as UserProperties, partialUser[key as UserProperties]);
            }
        }
    };

    public setAuthHeaders = (connectionId: string, uid: string, accessToken?: string) => {
        this.initConnectionId(connectionId);

        this.createOrUpdateUser(connectionId, {
            uid,
            accessToken,
        });
    };

    public setVersionHeaders = (connectionId: string, clientID: string, appVersion: string) => {
        this.initConnectionId(connectionId);

        this.createOrUpdateUser(connectionId, {
            clientID,
            appVersion,
        });
    };

    public setLocalUser = (
        connectionId: string,
        uid: string,
        plan: HttpsProtonMeDriveUsersSuccessRateTotalV1SchemaJson['Labels']['plan']
    ) => {
        this.initConnectionId(connectionId);

        this.createOrUpdateUser(connectionId, {
            plan,
            uid,
        });
    };

    public disconnect = (connectionId: string) => {
        users.delete(connectionId);
    };

    // Used solely for testing purposes
    public _getStatus = () => status;

    // Used solely for testing purposes
    public _getUsers = () => users;
}

self.onconnect = function (event) {
    const port = event.ports[0];
    expose(new MetricSharedWorker(), port);
};
