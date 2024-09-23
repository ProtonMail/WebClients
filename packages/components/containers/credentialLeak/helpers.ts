import camelCase from 'lodash/camelCase';
import { c } from 'ttag';

import type { SampleBreach } from '@proton/components/containers/credentialLeak/models';
import { DARK_WEB_MONITORING_NAME } from '@proton/shared/lib/constants';
import breachIconAlertBig from '@proton/styles/assets/img/breach-alert/shield-bolt-danger-big.svg';
import breachIconAlertSmall from '@proton/styles/assets/img/breach-alert/shield-bolt-danger-small.svg';
import breachIconResolvedBig from '@proton/styles/assets/img/breach-alert/shield-bolt-resolved-big.svg';
import breachIconResolvedSmall from '@proton/styles/assets/img/breach-alert/shield-bolt-resolved-small.svg';
import breachIconWarningBig from '@proton/styles/assets/img/breach-alert/shield-bolt-warning-big.svg';
import breachIconWarningSmall from '@proton/styles/assets/img/breach-alert/shield-bolt-warning-small.svg';

import { BREACH_STATE } from './models';

export const enum SEVERITY_LEVELS {
    HIGH = 0.67,
    MEDIUM = 0.33,
}

export const enum BREACH_API_ERROR {
    GENERIC = 2902,
}

export const isUnread = (state: BREACH_STATE): boolean => {
    return state === BREACH_STATE.UNREAD;
};

export const isResolved = (state: BREACH_STATE): boolean => {
    return state === BREACH_STATE.RESOLVED;
};

export const getBreachIcon = (severity: number, options: { big?: boolean; resolved?: boolean } = {}) => {
    const { resolved = false, big = false } = options;
    if (resolved) {
        if (big) {
            return breachIconResolvedBig;
        }
        return breachIconResolvedSmall;
    }

    if (severity > SEVERITY_LEVELS.HIGH) {
        if (big) {
            return breachIconAlertBig;
        }
        return breachIconAlertSmall;
    }

    if (big) {
        return breachIconWarningBig;
    }
    return breachIconWarningSmall;

    // TO CHECK: no styles for low prio?
};

export const getStyle = (severity: number): { colorClass: string; iconAltText: string } => {
    const style = {
        high: {
            colorClass: 'color-danger',
            iconAltText: c('Info').t`High Priority`,
        },
        medium: {
            colorClass: 'color-warning',
            iconAltText: c('Info').t`Medium Priority`,
        },
        low: {
            colorClass: 'color-warning', // TO DISCUSS : color-info looks misleading
            iconAltText: c('Info').t`Low Priority`,
        },
    };

    // severity levels may be changed with updates to API if more levels are added in the future
    if (severity > SEVERITY_LEVELS.HIGH) {
        return style.high;
    } else if (severity > SEVERITY_LEVELS.MEDIUM) {
        return style.medium;
    } else {
        return style.low;
    }
};

export const getFillerBreachData = () => {
    return {
        publishedAt: '2023-10-17T00:00:00+00:00',
        source: {
            category: {
                name: c('Info').t`finance`,
            },
            country: {
                name: null,
            },
        },
        size: 5389441,
        exposedData: [
            {
                code: 'email',
                name: c('Info').t`email`,
            },
            {
                code: 'username',
                name: c('Info').t`username`,
            },
            {
                code: 'password',
                name: c('Info').t`password`,
            },
        ],
        passwordLastChars: null,
        actions: [
            {
                code: 'password',
                desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.',
                name: c('Info').t`Change your password`,
            },
            {
                code: 'accounts',
                desc: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ',
                name: c('Info').t`Monitor accounts`,
            },
        ],
    };
};

export function toCamelCase(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => toCamelCase(item));
    }

    const camelCaseObj: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const camelCaseKey = camelCase(key);
            camelCaseObj[camelCaseKey] = toCamelCase(obj[key]);
        }
    }

    return camelCaseObj;
}

export const getEnableString = (reason: string) => {
    return c('Log preference').t`Enable ${reason}`;
};

export const getEnabledString = (reason: string) => {
    return c('Notification').t`${reason} has been enabled`;
};

export const getDisabledString = (reason: string) => {
    return c('Notification').t`${reason} has been disabled`;
};

export const getUpsellText = (
    sample: SampleBreach | null,
    total: number | null,
    link: React.JSX.Element,
    inAccountSettings?: boolean
) => {
    if (!sample || !total) {
        return;
    }
    const isUnknownSource = !sample.source.domain && sample.source.isAggregated === false;
    const isMultipleSources = !sample.source.domain && sample.source.isAggregated === true;

    const { name } = sample;
    const remainingCount = total - 1;

    if (inAccountSettings) {
        if (!name) {
            //translator: full sentence is: Your information was found in at least one data leak. Turn on Dark Web Monitoring to view details and take action. <Learn more>
            return c('Account Settings - Info')
                .jt`Your information was found in at least one data leak. Turn on ${DARK_WEB_MONITORING_NAME} to view details and take action. ${link}`;
        }
        //translator: full sentence is: <Name> and 1 other potential leak detected. Turn on Dark Web Monitoring to view details and take action. <Learn more>
        if (remainingCount === 1) {
            return c('Account Settings - Info')
                .jt`${name} and 1 other potential leak detected. Turn on ${DARK_WEB_MONITORING_NAME} to view details and take action. ${link}`;
        }
        //translator: full sentence is: <Name> and <count> other potential leaks detected. Turn on Dark Web Monitoring to view details and take action. <Learn more>
        if (remainingCount > 1) {
            return c('Account Settings - Info')
                .jt`${name} and ${remainingCount} other potential leaks detected. Turn on ${DARK_WEB_MONITORING_NAME} to view details and take action. ${link}`;
        }
        //translator: full sentence is: A potential leak from <Name> was detected. Turn on Dark Web Monitoring to view details and take action. <Learn more>
        if (isUnknownSource || isMultipleSources) {
            return c('Account Settings - Info')
                .jt`A potential leak from ${name} was detected. Turn on ${DARK_WEB_MONITORING_NAME} to view details and take action. ${link}`;
        }
        //translator: full sentence is: A potential <name> was detected. Turn on Dark Web Monitoring to view details and take action. <Learn more>
        return c('Account Settings - Info')
            .jt`A potential ${name} leak was detected. Turn on ${DARK_WEB_MONITORING_NAME} to view details and take action. ${link}`;
    }

    if (!name) {
        //translator: full sentence is: Your information was found in at least one data leak. Turn on Dark Web Monitoring to view details. <Learn more>
        return c('Security Center - Info')
            .jt`Your information was found in at least one data leak. Turn on ${DARK_WEB_MONITORING_NAME} to view details. ${link}`;
    }
    if (remainingCount === 1) {
        //translator: full sentence is: <Name> and 1 other potential leak detected. Turn on Dark Web Monitoring to view details. <Learn more>
        return c('Security Center - Info')
            .jt`${name} and 1 other potential leak detected. Turn on ${DARK_WEB_MONITORING_NAME} to view details. ${link}`;
    }
    if (remainingCount > 1) {
        //translator: full sentence is: <Name> and <count> other potential leaks detected. Turn on Dark Web Monitoring to view details. <Learn more>
        return c('Security Center - Info')
            .jt`${name} and ${remainingCount} other potential leaks detected. Turn on ${DARK_WEB_MONITORING_NAME} to view details. ${link}`;
    }
    if (isUnknownSource || isMultipleSources) {
        //translator: full sentence is: A potential leak from <Name> was detected. Turn on Dark Web Monitoring to view details and take action. <Learn more>
        return c('Account Settings - Info')
            .jt`A potential leak from ${name} was detected. Turn on ${DARK_WEB_MONITORING_NAME} to view details. ${link}`;
    }
    //translator: full sentence is: A potential <Name> leak was detected. Turn on Dark Web Monitoring to view details and take action. <Learn more>
    return c('Security Center - Info')
        .jt`A potential ${name} leak was detected. Turn on ${DARK_WEB_MONITORING_NAME} to view details. ${link}`;
};
