const TEN_MINUTES_IN_MILLISECONDS = 10 * 60 * 1000;

export enum AvailabilityTypes {
    SENTRY = 'SENTRY',
    ERROR = 'ERROR',
    CRITICAL = 'CRITICAL',
}

export type AvailabilityReport = {
    [AvailabilityTypes.SENTRY]: boolean;
    [AvailabilityTypes.ERROR]: boolean;
    [AvailabilityTypes.CRITICAL]: boolean;
};
export class Availability {
    static status: Map<AvailabilityTypes, number> = new Map();

    static interval: ReturnType<typeof setInterval>;

    static init = (report: (status: AvailabilityReport) => void, interval: number = TEN_MINUTES_IN_MILLISECONDS) => {
        this.clear();
        this.interval = setInterval(() => {
            const sentry = this.status.get(AvailabilityTypes.SENTRY);
            const error = this.status.get(AvailabilityTypes.ERROR);
            const critical = this.status.get(AvailabilityTypes.CRITICAL);
            report({
                [AvailabilityTypes.SENTRY]: sentry !== undefined && Date.now() - sentry > TEN_MINUTES_IN_MILLISECONDS,
                [AvailabilityTypes.ERROR]: error !== undefined && Date.now() - error > TEN_MINUTES_IN_MILLISECONDS,
                [AvailabilityTypes.CRITICAL]:
                    critical !== undefined && Date.now() - critical > TEN_MINUTES_IN_MILLISECONDS,
            });
        }, interval);
    };

    static mark = (type: AvailabilityTypes) => {
        this.status.set(type, Date.now());
    };

    static clear = () => {
        clearInterval(this.interval);
        this.status = new Map();
    };
}
