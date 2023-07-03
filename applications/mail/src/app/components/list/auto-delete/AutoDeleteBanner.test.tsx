import { screen } from '@testing-library/react';

import { MAILBOX_LABEL_IDS as IDS } from '@proton/shared/lib/constants';

import { LABEL_IDS_TO_HUMAN as TO_HUMAN } from '../../../constants';
import { addToCache, minimalCache, setFeatureFlags } from '../../../helpers/test/helper';
import { render } from '../../../helpers/test/render';
import { elementsSliceActions } from '../../../logic/elements/elementsSlice';
import { store } from '../../../logic/store';
import AutoDeleteBanner from './AutoDeleteBanner';

const setup = ({
    isFree = false,
    isPaid = false,
    featureActive = false,
    setting = null,
}: Partial<Record<'isFree' | 'isPaid' | 'featureActive', boolean> & { setting: number | null }>) => {
    minimalCache();
    setFeatureFlags('AutoDelete', featureActive);
    addToCache('User', { UsedSpace: 10, MaxSpace: 100, isFree, hasPaidMail: isPaid });
    addToCache('MailSettings', { AutoDeleteSpamAndTrashDays: setting });
};

describe('AutoDeleteBanner', () => {
    describe('Should not render when', () => {
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
        `('User is on $labelName', async ({ labelID }) => {
            setup({ featureActive: true, isFree: true });
            await render(<AutoDeleteBanner labelID={labelID} />, false);
            expect(screen.queryByTestId('auto-delete:banner')).toBe(null);
        });

        it('Feature is not active', async () => {
            setup({ featureActive: false, isFree: true });
            await render(<AutoDeleteBanner labelID={IDS.SPAM} />, false);
            expect(screen.queryByTestId('auto-delete:banner')).toBe(null);
        });

        it('Setting is deactivated and user is paid', async () => {
            setup({ featureActive: true, isPaid: true, setting: 0 });
            await render(<AutoDeleteBanner labelID={IDS.SPAM} />, false);
            expect(screen.queryByTestId('auto-delete:banner')).toBe(null);
        });

        it('A moving task is running', async () => {
            setup({ featureActive: true, isPaid: true, setting: 30 });
            store.dispatch(
                elementsSliceActions.updateTasksRunning({
                    taskRunning: {
                        labelIDs: ['3', '4'],
                        timeoutID: 123 as unknown as NodeJS.Timeout,
                    },
                })
            );
            await render(<AutoDeleteBanner labelID={IDS.SPAM} />, false);

            expect(screen.queryByTestId('auto-delete:banner')).toBe(null);
            store.dispatch(
                elementsSliceActions.updateTasksRunning({
                    taskRunning: {
                        labelIDs: [],
                        timeoutID: 123 as unknown as NodeJS.Timeout,
                    },
                })
            );
        });
    });
    describe('Should render when', () => {
        it.each`
            labelID      | labelName
            ${IDS.SPAM}  | ${TO_HUMAN[IDS.SPAM]}
            ${IDS.TRASH} | ${TO_HUMAN[IDS.TRASH]}
        `('User is on $labelName label', async ({ labelID }) => {
            setup({ featureActive: true, isFree: true });
            await render(<AutoDeleteBanner labelID={labelID} />, false);
            expect(screen.queryByTestId('auto-delete:banner')).not.toBe(null);
        });
    });

    describe('Should render free banner when', () => {
        it('Setting is null and user is free', async () => {
            setup({ featureActive: true, isFree: true, setting: null });
            await render(<AutoDeleteBanner labelID={IDS.SPAM} />, false);
            expect(screen.queryByTestId('auto-delete:banner:free')).not.toBe(null);
        });

        it('Setting is enabled and user is free (API should not allow this case)', async () => {
            setup({ featureActive: true, isFree: true, setting: 30 });
            await render(<AutoDeleteBanner labelID={IDS.SPAM} />, false);
            expect(screen.queryByTestId('auto-delete:banner:free')).not.toBe(null);
        });

        it('Setting is explicitly deactivated and user is free (API should not allow this case)', async () => {
            setup({ featureActive: true, isFree: true, setting: 0 });
            await render(<AutoDeleteBanner labelID={IDS.SPAM} />, false);
            expect(screen.queryByTestId('auto-delete:banner:free')).not.toBe(null);
        });
    });

    describe('Should render paid banner when', () => {
        it('Setting is null and user is paid', async () => {
            setup({ featureActive: true, isPaid: true, setting: null });
            await render(<AutoDeleteBanner labelID={IDS.SPAM} />, false);
            expect(screen.queryByTestId('auto-delete:banner:paid')).not.toBe(null);
        });
    });

    describe('Should render enabled banner when', () => {
        it('Setting is enabled and user is paid', async () => {
            setup({ featureActive: true, isPaid: true, setting: 30 });
            await render(<AutoDeleteBanner labelID={IDS.SPAM} />, false);
            expect(screen.queryByTestId('auto-delete:banner:enabled')).not.toBe(null);
        });
    });
});
