import type { Location } from 'history';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { type MailUrlParams, getUrlPathname, setParamsInLocation, sortFromUrl } from './mailboxUrl';

describe('Mailbox URL tests', () => {
    describe('getUrlPathname', () => {
        it('Should return the pathname with human label', () => {
            const params: MailUrlParams = { labelID: MAILBOX_LABEL_IDS.SNOOZED };
            const newPathname = getUrlPathname(params);
            expect(newPathname).toBe('/snoozed');
        });

        it('Should return the pathname with custom folder ID', () => {
            const params: MailUrlParams = { labelID: 'customFolder' };
            const newPathname = getUrlPathname(params);
            expect(newPathname).toBe('/customFolder');
        });

        it('Should add the elementID and messageID when given to the method', () => {
            const paramsElement: MailUrlParams = { labelID: 'customFolder', elementID: 'elementId' };
            const newPathname = getUrlPathname(paramsElement);
            expect(newPathname).toBe('/customFolder/elementId');

            const paramsMessage: MailUrlParams = { labelID: 'customFolder', elementID: 'elementId', messageID: '123' };
            const newPathnameMessage = getUrlPathname(paramsMessage);
            expect(newPathnameMessage).toBe('/customFolder/elementId/123');
        });

        it('Should not override element and message id', () => {
            const params: MailUrlParams = { labelID: 'customFolder', elementID: 'elementId', messageID: 'messageId' };

            const newPathname = getUrlPathname(params);
            expect(newPathname).toBe('/customFolder/elementId/messageId');
        });
    });

    describe('setParamsInLocation', () => {
        it('Should replace the labelID location', () => {
            const location = { pathname: '/inbox' } as Location;
            const params: MailUrlParams = { labelID: 'newLabel' };

            const newLocation = setParamsInLocation(location, params);
            expect(newLocation.pathname).toBe('/newLabel');
        });

        it('Should add the elementID to the location', () => {
            const location = { pathname: '/inbox' } as Location;
            const params: MailUrlParams = { labelID: 'inbox', elementID: 'newElement' };

            const newLocation = setParamsInLocation(location, params);
            expect(newLocation.pathname).toBe('/inbox/newElement');
        });

        it('Should add the messageID to the location', () => {
            const location = { pathname: '/inbox' } as Location;
            const params: MailUrlParams = { labelID: 'inbox', elementID: 'newElement', messageID: '123' };

            const newLocation = setParamsInLocation(location, params);
            expect(newLocation.pathname).toBe('/inbox/newElement/123');
        });
    });

    describe('sortFromUrl', () => {
        const loc = (sort?: string): Location => ({ hash: sort ? `#sort=${sort}` : '' }) as Location;

        it('should default to Time descending for a regular label', () => {
            expect(sortFromUrl(loc(), 'customLabel')).toEqual({ sort: 'Time', desc: true });
        });

        it('should return Time ascending when sort=date for a regular label', () => {
            expect(sortFromUrl(loc('date'), 'customLabel')).toEqual({ sort: 'Time', desc: false });
        });

        it('should return Size descending when sort=-size', () => {
            expect(sortFromUrl(loc('-size'), 'customLabel')).toEqual({ sort: 'Size', desc: true });
        });

        it('should return Size ascending when sort=size', () => {
            expect(sortFromUrl(loc('size'), 'customLabel')).toEqual({ sort: 'Size', desc: false });
        });

        it('should return SnoozeTime descending for Inbox with default sort', () => {
            expect(sortFromUrl(loc(), MAILBOX_LABEL_IDS.INBOX)).toEqual({ sort: 'SnoozeTime', desc: true });
        });

        it('should return SnoozeTime ascending for Inbox with sort=date', () => {
            expect(sortFromUrl(loc('date'), MAILBOX_LABEL_IDS.INBOX)).toEqual({ sort: 'SnoozeTime', desc: false });
        });

        it('should return SnoozeTime ascending for Snoozed with default sort', () => {
            // Snoozed flips desc so earliest-snoozed appears first
            expect(sortFromUrl(loc(), MAILBOX_LABEL_IDS.SNOOZED)).toEqual({ sort: 'SnoozeTime', desc: false });
        });

        it('should return SnoozeTime descending for Snoozed with sort=date', () => {
            expect(sortFromUrl(loc('date'), MAILBOX_LABEL_IDS.SNOOZED)).toEqual({ sort: 'SnoozeTime', desc: true });
        });

        it('should return Size unchanged for Inbox when sort is size-based', () => {
            expect(sortFromUrl(loc('-size'), MAILBOX_LABEL_IDS.INBOX)).toEqual({ sort: 'Size', desc: true });
            expect(sortFromUrl(loc('size'), MAILBOX_LABEL_IDS.SNOOZED)).toEqual({ sort: 'Size', desc: false });
        });

        it('should return Time ascending for Scheduled with default sort', () => {
            expect(sortFromUrl(loc(), MAILBOX_LABEL_IDS.SCHEDULED)).toEqual({ sort: 'Time', desc: false });
        });
    });
});
