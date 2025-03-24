import type { Location } from 'history';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { type MailUrlParams, getUrlPathname, setParamsInLocation } from './mailboxUrl';

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
});
