import { camelCase } from 'lodash';
import { c } from 'ttag';

const enum SEVERITY_LEVELS {
    HIGH = 0.67,
    MEDIUM = 0.33,
}

export const enum BREACH_API_ERROR {
    GENERIC = 2902,
}

export const getStyle = (severity: number): { backgroundClass: string; colorClass: string; iconAltText: string } => {
    const style = {
        high: {
            colorClass: 'color-danger',
            backgroundClass: 'breach-icon-bg-danger',
            iconAltText: c('Info').t`High Priority`,
        },
        medium: {
            colorClass: 'color-warning',
            backgroundClass: 'breach-icon-bg-warning',
            iconAltText: c('Info').t`Medium Priority`,
        },
        low: {
            colorClass: 'color-info',
            backgroundClass: 'breach-icon-bg-info',
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
