import { randomBytes } from 'crypto';
import type { CookiesSetDetails, Session } from 'electron';

import config from '../../app/config';

export const calculateUpdateDistribution = () => randomBytes(4).readUint32LE() / Math.pow(2, 32);

export const setTagCookie = async (session: Session, beta: boolean) => {
    const apiUrl = new URL(config.API_URL);

    const cookie: CookiesSetDetails = {
        url: apiUrl.origin,
        name: 'Tag',
        value: beta ? 'beta' : 'default',
        domain: apiUrl.hostname,
        path: '/',
        secure: true,
        httpOnly: false,
        expirationDate: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 31 * 3, // 3 months
        sameSite: 'no_restriction',
    };

    await session.cookies.set(cookie);
};
