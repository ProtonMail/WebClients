import { renderHook } from '@testing-library/react-hooks';

import { MAILBOX_LABEL_IDS as IDS } from '@proton/shared/lib/constants';
import { mockUseFeature, mockUseMailSettings, mockUseUser } from '@proton/testing';

import { LABEL_IDS_TO_HUMAN as TO_HUMAN } from '../../../../constants';
import useAutoDeleteBanner from './useAutodeleteBanner';

describe('AutoDeleteBanner', () => {
    beforeEach(() => {
        mockUseFeature({ feature: { Value: true } as any });
        mockUseUser();
        mockUseMailSettings();
    });

    describe('when feature is not active', () => {
        it('should not render when', async () => {
            mockUseFeature({ feature: { Value: false } as any });
            mockUseUser([{ isFree: true }]);

            const { result } = await renderHook(() => useAutoDeleteBanner(IDS.SPAM));
            expect(result.current).toBe('hide');
        });
    });

    describe('when setting is deactivated and user is paid', () => {
        it('should not render banner', async () => {
            mockUseFeature({ feature: { Value: true } as any });
            mockUseUser([{ isPaid: true }]);

            const { result } = await renderHook(() => useAutoDeleteBanner(IDS.SPAM));
            expect(result.current).toBe('disabled');
        });
    });

    describe('user is not in enabled location', () => {
        it.each`
            labelID                | labelName
            ${IDS.ALL_DRAFTS}      | ${TO_HUMAN[IDS.ALL_DRAFTS] + ' label'}
            ${IDS.ALL_MAIL}        | ${TO_HUMAN[IDS.ALL_MAIL] + ' label'}
            ${IDS.ALL_SENT}        | ${TO_HUMAN[IDS.ALL_SENT] + ' label'}
            ${IDS.ALMOST_ALL_MAIL} | ${TO_HUMAN[IDS.ALMOST_ALL_MAIL] + ' label'}
            ${IDS.ARCHIVE}         | ${TO_HUMAN[IDS.ARCHIVE] + ' label'}
            ${IDS.DRAFTS}          | ${TO_HUMAN[IDS.DRAFTS] + ' label'}
            ${IDS.INBOX}           | ${TO_HUMAN[IDS.INBOX] + ' label'}
            ${IDS.OUTBOX}          | ${TO_HUMAN[IDS.OUTBOX] + ' label'}
            ${IDS.SCHEDULED}       | ${TO_HUMAN[IDS.SCHEDULED] + ' label'}
            ${IDS.SENT}            | ${TO_HUMAN[IDS.SENT] + ' label'}
            ${IDS.STARRED}         | ${TO_HUMAN[IDS.STARRED] + ' label'}
            ${'qwdiwfsdas'}        | ${'random folder or label id'}
        `('should not render banner inside $labelName', async ({ labelID }) => {
            mockUseFeature({ feature: { Value: true } as any });
            mockUseUser([{ isFree: true }]);

            const { result } = await renderHook(() => useAutoDeleteBanner(labelID));
            expect(result.current).toBe('hide');
        });
    });

    describe('user is in enabled location', () => {
        it.each`
            labelID      | labelName
            ${IDS.SPAM}  | ${TO_HUMAN[IDS.SPAM]}
            ${IDS.TRASH} | ${TO_HUMAN[IDS.TRASH]}
        `('should render banner inside $labelName', async ({ labelID }) => {
            mockUseFeature({ feature: { Value: true } as any });
            mockUseUser([{ hasPaidMail: false, isFree: true }]);

            const { result } = await renderHook(() => useAutoDeleteBanner(labelID));
            expect(result.current).toBe('free-banner');
        });
    });

    describe('When user is free', () => {
        const isFree = true;

        describe('Setting is null', () => {
            it('Should rneder free banner', async () => {
                mockUseFeature({ feature: { Value: true } as any });
                mockUseUser([{ hasPaidMail: !isFree, isFree }]);

                const { result } = await renderHook(() => useAutoDeleteBanner(IDS.SPAM));
                expect(result.current).toBe('free-banner');
            });
        });

        describe('Setting is enabled (API should not allow this case)', () => {
            it('should rneder free banner', async () => {
                mockUseFeature({ feature: { Value: true } as any });
                mockUseUser([{ hasPaidMail: !isFree, isFree }]);
                mockUseMailSettings([{ AutoDeleteSpamAndTrashDays: 30 }]);

                const { result } = await renderHook(() => useAutoDeleteBanner(IDS.SPAM));
                expect(result.current).toBe('free-banner');
            });
        });

        describe('Setting is explicitly deactivated (API should not allow this case)', () => {
            it('Should rneder free banner', async () => {
                mockUseFeature({ feature: { Value: true } as any });
                mockUseUser([{ hasPaidMail: !isFree, isFree }]);
                mockUseMailSettings([{ AutoDeleteSpamAndTrashDays: 0 }]);

                const { result } = await renderHook(() => useAutoDeleteBanner(IDS.SPAM));
                expect(result.current).toBe('free-banner');
            });
        });
    });

    describe('User is paid', () => {
        const isFree = false;

        describe('Setting is null and user is paid', () => {
            it('Should render paid banner', async () => {
                mockUseFeature({ feature: { Value: true } as any });
                mockUseUser([{ hasPaidMail: !isFree, isFree }]);
                mockUseMailSettings([{ AutoDeleteSpamAndTrashDays: null }]);

                const { result } = await renderHook(() => useAutoDeleteBanner(IDS.SPAM));
                expect(result.current).toBe('paid-banner');
            });
        });

        describe('Setting is enabled and user is paid', () => {
            it('Should render enabled banner', async () => {
                mockUseUser([{ hasPaidMail: !isFree, isFree }]);
                mockUseFeature({ feature: { Value: true } as any });
                mockUseMailSettings([{ AutoDeleteSpamAndTrashDays: 30 }]);

                const { result } = await renderHook(() => useAutoDeleteBanner(IDS.SPAM));
                expect(result.current).toBe('enabled');
            });
        });
    });
});
