import { platform } from 'node:os';

import { truthy } from '@proton/pass/utils/fp/predicates';

import * as config from '../app/config';

/**
 * Desktop clients should use a custom user agent for all requests as specified
 * by 'Client HTTP Request Header and User Agent' (cf. 161284153)
 */
export const userAgent = (): string => {
    const osNameAndVersion = (() => {
        switch (platform()) {
            case 'win32':
                return 'Windows NT 10.0; Win64; x64';
            case 'darwin':
                return 'Macintosh; Intel Mac OS X 10_15_7';
            case 'linux':
                return 'X11; Linux x86_64';
        }
    })();

    const comments = osNameAndVersion && `(${osNameAndVersion})`;
    const productAndVersion = `ProtonPass/${config.APP_VERSION}`;

    return [productAndVersion, comments].filter(truthy).join(' ');
};
