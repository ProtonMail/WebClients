import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, APPS_CONFIGURATION } from '@proton/shared/lib/constants';
import type { DRAWER_ACTION } from '@proton/shared/lib/drawer/interfaces';
import { DRAWER_EVENTS, DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';

import {
    addParentAppToUrl,
    authorizedApps,
    drawerAuthorizedApps,
    drawerIframeApps,
    drawerNativeApps,
    getDisplayContactsInDrawer,
    getDisplayDrawerApp,
    getIsAuthorizedApp,
    getIsDrawerPostMessage,
    getIsIframedDrawerApp,
    getIsNativeDrawerApp,
    isAppInView,
    isAuthorizedDrawerUrl,
    postMessageFromIframe,
} from '../../lib/drawer/helpers';
import window from '../../lib/window';
import { getMockedWindowLocation } from '../helpers/url.helper';

const windowHostname = 'mail.proton.me';

const tsDrawerNativeApps: string[] = [...drawerNativeApps];
const tsDrawerIframeApps: string[] = [...drawerIframeApps];

describe('drawer helpers', () => {
    describe('isNativeDrawerApp', () => {
        it('should be a drawer native app', () => {
            drawerNativeApps.forEach((app) => {
                expect(getIsNativeDrawerApp(app)).toBeTruthy();
            });
        });

        it('should not be a drawer native app', () => {
            Object.values(APPS).forEach((app) => {
                if (!tsDrawerNativeApps.includes(app)) {
                    expect(getIsNativeDrawerApp(app)).toBeFalsy();
                }
            });
        });
    });

    describe('isIframeDrawerApp', () => {
        it('should be a iframe drawer app', () => {
            drawerIframeApps.forEach((app) => {
                expect(getIsIframedDrawerApp(app)).toBeTruthy();
            });
        });

        it('should not be a iframe drawer native app', () => {
            Object.values(APPS).forEach((app) => {
                if (!tsDrawerIframeApps.includes(app)) {
                    expect(getIsIframedDrawerApp(app)).toBeFalsy();
                }
            });
        });
    });

    describe('isAuthorizedDrawerUrl', () => {
        const location = getMockedWindowLocation({ hostname: windowHostname });
        const hostname = location.hostname;

        it('should be a url from an authorized domain', () => {
            drawerAuthorizedApps.forEach((appDomain) => {
                const url = `https://${appDomain}.proton.me`;

                expect(isAuthorizedDrawerUrl(url, hostname)).toBeTruthy();
            });
        });

        it('should not be a url from an authorized domain', () => {
            const url1 = 'https://scam.proton.me';
            const url2 = 'https://mail.scam.me';
            expect(isAuthorizedDrawerUrl(url1, hostname)).toBeFalsy();
            expect(isAuthorizedDrawerUrl(url2, hostname)).toBeFalsy();
        });
    });

    describe('getIsAuthorizedApp', () => {
        it('should be an authorized app', () => {
            authorizedApps.forEach((app) => {
                expect(getIsAuthorizedApp(app)).toBeTruthy();
            });
        });

        it('should not be an authorized app', () => {
            Object.values(APPS).forEach((app) => {
                if (!authorizedApps.includes(app)) {
                    expect(getIsAuthorizedApp(app)).toBeFalsy();
                }
            });
        });
    });

    describe('getIsDrawerPostMessage', () => {
        const location = getMockedWindowLocation({ hostname: windowHostname });
        const hostname = location.hostname;

        it('should be a drawer message', () => {
            drawerAuthorizedApps.forEach((app) => {
                const event = {
                    origin: `https://${app}.proton.me`,
                    data: {
                        type: DRAWER_EVENTS.READY,
                    },
                } as MessageEvent;

                expect(getIsDrawerPostMessage(event, hostname)).toBeTruthy();
            });
        });

        it('should not be a drawer message when app is not authorized', () => {
            Object.values(APPS).forEach((app) => {
                if (!drawerAuthorizedApps.includes(APPS_CONFIGURATION[app].subdomain)) {
                    const appSubdomain = APPS_CONFIGURATION[app].subdomain;

                    const event = {
                        origin: `https://${appSubdomain}.proton.me`,
                        data: {
                            type: DRAWER_EVENTS.READY,
                        },
                    } as MessageEvent;

                    expect(getIsDrawerPostMessage(event, hostname)).toBeFalsy();
                }
            });
        });

        it('should not be a drawer message when event type is invalid', () => {
            const appSubdomain = drawerAuthorizedApps[0];

            const event = {
                origin: `https://${appSubdomain}.proton.me`,
                data: {
                    type: 'something else',
                },
            } as MessageEvent;

            expect(getIsDrawerPostMessage(event, hostname)).toBeFalsy();
        });
    });

    describe('postMessageFromIframe', () => {
        const location = getMockedWindowLocation({ hostname: windowHostname });

        it('should post a message from the iframe', () => {
            const spy = spyOn(window.parent, 'postMessage');

            const message: DRAWER_ACTION = {
                type: DRAWER_EVENTS.READY,
            };

            authorizedApps.forEach((app) => {
                const parentApp = app as APP_NAMES;

                postMessageFromIframe(message, parentApp, location);

                const sentMessage = {
                    ...message,
                };

                const targetOrigin = `http://${APPS_CONFIGURATION[parentApp].subdomain}.proton.me`;

                // @ts-ignore
                expect(spy).toHaveBeenCalledWith(sentMessage, targetOrigin);
            });
        });

        it('should not post a message from the iframe', () => {
            const spy = spyOn(window.parent, 'postMessage');

            const message: DRAWER_ACTION = {
                type: DRAWER_EVENTS.READY,
            };

            Object.values(APPS).forEach((app) => {
                if (!drawerAuthorizedApps.includes(APPS_CONFIGURATION[app].subdomain)) {
                    postMessageFromIframe(message, app, location);

                    expect(spy).not.toHaveBeenCalled();
                }
            });
        });
    });

    describe('addParentAppToUrl', () => {
        it('should add parent app to URL and replace path', () => {
            const urlParams = 'Action=VIEW&EventID=eventID&RecurrenceID=1670835600';
            const url = `https://calendar.proton.pink/u/0/event?${urlParams}`;
            const currentApp = APPS.PROTONMAIL;

            const expected = `https://calendar.proton.pink/u/0/mail?${urlParams}`;

            expect(addParentAppToUrl(url, currentApp, true)).toEqual(expected);
        });

        it('should add parent app to URL and not replace path', () => {
            const path = '/something';
            const url = `https://calendar.proton.pink/u/0${path}`;
            const currentApp = APPS.PROTONMAIL;

            const expected = `https://calendar.proton.pink/u/0/mail${path}`;

            expect(addParentAppToUrl(url, currentApp, false)).toEqual(expected);
        });
    });

    describe('getDisplayContactsInDrawer', () => {
        it('should be possible to display contacts in Drawer', () => {
            const apps: APP_NAMES[] = [APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONDRIVE];

            apps.forEach((app) => {
                expect(getDisplayContactsInDrawer(app)).toBeTruthy();
            });
        });

        it('should not be possible to display contacts in Drawer', () => {
            const apps: APP_NAMES[] = [APPS.PROTONACCOUNTLITE, APPS.PROTONACCOUNT];

            apps.forEach((app) => {
                expect(getDisplayContactsInDrawer(app)).toBeFalsy();
            });
        });
    });

    describe('isAppInView', () => {
        it('should be the app in view', () => {
            const appInView = DRAWER_NATIVE_APPS.CONTACTS;
            const currentApp = DRAWER_NATIVE_APPS.CONTACTS;
            expect(isAppInView(currentApp, appInView)).toBeTruthy();
        });

        it('should not be the app in view', () => {
            const appInView = DRAWER_NATIVE_APPS.CONTACTS;
            const currentApp = APPS.PROTONCALENDAR;
            expect(isAppInView(currentApp, appInView)).toBeFalsy();
        });
    });

    describe('getDisplayDrawerApp', () => {
        it('should be possible to open calendar app', () => {
            const apps: APP_NAMES[] = [APPS.PROTONMAIL, APPS.PROTONDRIVE];

            apps.forEach((app) => {
                expect(getDisplayDrawerApp(app, APPS.PROTONCALENDAR)).toBeTruthy();
            });
        });

        it('should not be possible to open calendar app', () => {
            const apps: APP_NAMES[] = [APPS.PROTONCALENDAR, APPS.PROTONCONTACTS, APPS.PROTONACCOUNT];

            apps.forEach((app) => {
                expect(getDisplayDrawerApp(app, APPS.PROTONCALENDAR)).toBeFalsy();
            });
        });

        it('should be possible to open contact app', () => {
            const apps: APP_NAMES[] = [APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONDRIVE];

            apps.forEach((app) => {
                expect(getDisplayDrawerApp(app, DRAWER_NATIVE_APPS.CONTACTS)).toBeTruthy();
            });
        });

        it('should not be possible to open contacts app', () => {
            const apps: APP_NAMES[] = [APPS.PROTONCONTACTS, APPS.PROTONACCOUNT];

            apps.forEach((app) => {
                expect(getDisplayDrawerApp(app, DRAWER_NATIVE_APPS.CONTACTS)).toBeFalsy();
            });
        });
    });
});
