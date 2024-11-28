import type { MailSettings } from '@proton/shared/lib/interfaces';
import { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';

import { getLabelID, getPageSizeString } from './mailMetricsHelper';

describe('mailMetrisHelper', () => {
    it.each([
        {
            value: { PageSize: undefined },
            expected: '50',
        },
        {
            value: { PageSize: MAIL_PAGE_SIZE.FIFTY },
            expected: '50',
        },
        {
            value: { PageSize: MAIL_PAGE_SIZE.ONE_HUNDRED },
            expected: '100',
        },
        {
            value: { PageSize: MAIL_PAGE_SIZE.TWO_HUNDRED },
            expected: '200',
        },
    ])('should return appropriate page size for $value', ({ value, expected }) => {
        expect(getPageSizeString(value as unknown as MailSettings)).toBe(expected);
    });

    it.each([
        {
            value: '0',
            expected: '0',
        },
        {
            value: '1',
            expected: '1',
        },
        {
            value: 'test',
            expected: 'custom',
        },
        {
            value: '-10',
            expected: 'custom',
        },
    ])('should return appropriate label for $value', ({ value, expected }) => {
        expect(getLabelID(value as unknown as string)).toBe(expected);
    });
});
