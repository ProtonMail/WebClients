import { Feature } from '@proton/components/containers';
import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import {
    addParentAppToUrl,
    authorizedApps,
    drawerIframeApps,
    drawerNativeApps,
    getDisplayContactsInDrawer,
    getIsAuthorizedApp,
    getIsIframedDrawerApp,
    getIsNativeDrawerApp,
} from '@proton/shared/lib/drawer/helpers';
import { DrawerFeatureFlag } from '@proton/shared/lib/interfaces/Drawer';

// const windowHostname = 'mail.proton.me';

describe('drawer helpers', () => {
    describe('isNativeDrawerApp', () => {
        it('should be a drawer native app', () => {
            drawerNativeApps.forEach((app) => {
                expect(getIsNativeDrawerApp(app)).toBeTruthy();
            });
        });

        it('should not be a drawer native app', () => {
            Object.values(APPS).forEach((app) => {
                if (!drawerNativeApps.includes(app)) {
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
                if (!drawerIframeApps.includes(app)) {
                    expect(getIsIframedDrawerApp(app)).toBeFalsy();
                }
            });
        });
    });

    // describe('isAuthorizedDrawerUrl', () => {
    //     beforeEach(() => {
    //         mockWindowLocation(undefined, windowHostname);
    //     });
    //
    //     afterEach(() => {
    //         resetWindowLocation();
    //     });
    //
    //     it('should be a url from an authorized domain', () => {
    //         drawerAuthorizedApps.forEach((appDomain) => {
    //             const url = `https://${appDomain}.proton.me`;
    //
    //             expect(isAuthorizedDrawerUrl(url)).toBeTruthy();
    //         });
    //     });
    //
    //     it('should not be a url from an authorized domain', () => {
    //         const url1 = 'https://scam.proton.me';
    //         const url2 = 'https://mail.scam.me';
    //         expect(isAuthorizedDrawerUrl(url1)).toBeFalsy();
    //         expect(isAuthorizedDrawerUrl(url2)).toBeFalsy();
    //     });
    // });

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

    // describe('getIsDrawerPostMessage', () => {
    //     beforeEach(() => {
    //         mockWindowLocation(undefined, windowHostname);
    //     });
    //
    //     afterEach(() => {
    //         resetWindowLocation();
    //     });
    //
    //     it('should be a drawer message', () => {
    //         drawerAuthorizedApps.forEach((app) => {
    //             const event = {
    //                 origin: `https://${app}.proton.me`,
    //                 data: {
    //                     type: DRAWER_EVENTS.READY,
    //                 },
    //             } as MessageEvent;
    //
    //             expect(getIsDrawerPostMessage(event)).toBeTruthy();
    //         });
    //     });
    //
    //     it('should not be a drawer message when app is not authorized', () => {
    //         Object.values(APPS).forEach((app) => {
    //             if (!drawerAuthorizedApps.includes(APPS_CONFIGURATION[app].subdomain)) {
    //                 const appSubdomain = APPS_CONFIGURATION[app].subdomain;
    //
    //                 const event = {
    //                     origin: `https://${appSubdomain}.proton.me`,
    //                     data: {
    //                         type: DRAWER_EVENTS.READY,
    //                     },
    //                 } as MessageEvent;
    //
    //                 expect(getIsDrawerPostMessage(event)).toBeFalsy();
    //             }
    //         });
    //     });
    //
    //     it('should not be a drawer message when event type is invalid', () => {
    //         const appSubdomain = drawerAuthorizedApps[0];
    //
    //         const event = {
    //             origin: `https://${appSubdomain}.proton.me`,
    //             data: {
    //                 type: 'something else',
    //             },
    //         } as MessageEvent;
    //
    //         expect(getIsDrawerPostMessage(event)).toBeFalsy();
    //     });
    // });

    // describe('postMessageFromIframe', () => {
    //     beforeEach(() => {
    //         mockWindowLocation(undefined, windowHostname);
    //     });
    //
    //     afterEach(() => {
    //         resetWindowLocation();
    //     });
    //
    //     it('should not post a message from the iframe', () => {
    //         window.parent.postMessage = jest.fn();
    //
    //         const message: DRAWER_ACTION = {
    //             type: DRAWER_EVENTS.READY,
    //         };
    //
    //         authorizedApps.forEach((app) => {
    //             const parentApp = app as APP_NAMES;
    //
    //             postMessageFromIframe(message, parentApp);
    //
    //             const sentMessage = {
    //                 ...message,
    //             };
    //
    //             const targetOrigin = `http://${APPS_CONFIGURATION[parentApp].subdomain}.proton.me`;
    //
    //             expect(window.parent.postMessage).toHaveBeenCalledWith(sentMessage, targetOrigin);
    //         });
    //     });
    //
    //     it('should not post a message from the iframe', () => {
    //         window.parent.postMessage = jest.fn();
    //
    //         const message: DRAWER_ACTION = {
    //             type: DRAWER_EVENTS.READY,
    //         };
    //
    //         Object.values(APPS).forEach((app) => {
    //             if (!drawerAuthorizedApps.includes(APPS_CONFIGURATION[app].subdomain)) {
    //                 postMessageFromIframe(message, app);
    //
    //                 expect(window.parent.postMessage).not.toHaveBeenCalled();
    //             }
    //         });
    //     });
    // });

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
            const drawerFeature = {
                Value: {
                    ContactsInMail: true,
                    ContactsInCalendar: true,
                    ContactsInDrive: true,
                } as DrawerFeatureFlag,
            } as Feature;

            apps.forEach((app) => {
                expect(getDisplayContactsInDrawer(app, drawerFeature)).toBeTruthy();
            });
        });

        it('should not be possible to display contacts in Drawer', function () {
            const apps: APP_NAMES[] = [APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONDRIVE, APPS.PROTONACCOUNTLITE];
            const drawerFeature = {
                Value: {
                    ContactsInMail: false,
                    ContactsInCalendar: false,
                    ContactsInDrive: false,
                } as DrawerFeatureFlag,
            } as Feature;

            apps.forEach((app) => {
                expect(getDisplayContactsInDrawer(app, drawerFeature)).toBeFalsy();
            });
        });
    });
});
