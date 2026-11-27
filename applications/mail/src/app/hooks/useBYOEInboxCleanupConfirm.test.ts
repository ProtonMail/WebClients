import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { mockUseUser } from '@proton/account/testing/mockUseUser';
import { mockUseApi } from '@proton/app-context/testing/mockUseApi';
import { mockUseNotifications } from '@proton/app-context/testing/mockUseNotifications';
import useEventManager from '@proton/components/hooks/useEventManager';

import { generateSubscriptionList } from '../components/view/NewsletterSubscription/testData';
import useBYOEInboxCleanupConfirm from './useBYOEInboxCleanupConfirm';

interface Request {
    url: string;
    data?: { ApplyTo: string };
}

const getSubscriptionID = (url: string) => {
    return url.split('/')[3];
};

const createFakeApi = (unsubscribeFails: string[] = [], archiveFails: string[] = []) => {
    return vi.fn(async ({ url }: Request) => {
        const subscriptionID = getSubscriptionID(url);
        if (url.endsWith('/unsubscribe') && unsubscribeFails.includes(subscriptionID)) {
            throw Object.assign(new Error('api error'), { status: 422, data: { Code: 2501, Error: 'api error' } });
        }
        if (url.endsWith('/filter') && archiveFails.includes(subscriptionID)) {
            throw Object.assign(new Error('api error'), { status: 500, data: { Code: 2500, Error: 'api error' } });
        }
        return {};
    });
};

const getIDs = (subscriptions: { ID: string }[]) => {
    return subscriptions.map(({ ID }) => ID);
};

const ERROR_NOTIFICATION = {
    text: "Some mailing lists couldn't be unsubscribed. Try again to finish unsubscribing.",
    type: 'error',
};

const getRequestedURLs = (api: Mock) => {
    return (api.mock.calls as [Request][]).map(([{ url }]) => url);
};

describe('useBYOEInboxCleanupConfirm', () => {
    const createNotification = vi.fn();

    interface SetupOptions {
        api?: Mock;
        hasPaidMail?: boolean;
    }

    const setup = ({ api = createFakeApi(), hasPaidMail = false }: SetupOptions = {}) => {
        mockUseApi(api);
        mockUseUser([{ hasPaidMail }]);
        mockUseNotifications({ createNotification });
        return renderHook(() => useBYOEInboxCleanupConfirm());
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('when every ticked sender is done, resolves as done with the senders it unsubscribed and shows no success message', async () => {
        const { result } = setup();
        const onConfirm = result.current;
        const subscriptions = generateSubscriptionList(3);

        const outcome = await onConfirm({ subscriptions, archive: true });

        expect(outcome).toEqual({ allDone: true, unsubscribed: subscriptions });
        expect(createNotification).not.toHaveBeenCalled();
    });

    it('when some fail, resolves as not done with the senders that worked and shows the error message', async () => {
        const { result } = setup({ api: createFakeApi(['active-2']) });
        const onConfirm = result.current;

        const outcome = await onConfirm({ subscriptions: generateSubscriptionList(3), archive: true });

        expect(outcome.allDone).toBe(false);
        expect(getIDs(outcome.unsubscribed)).toEqual(['active-1', 'active-3']);
        expect(createNotification).toHaveBeenCalledTimes(1);
        expect(createNotification).toHaveBeenCalledWith(ERROR_NOTIFICATION);
    });

    it('a sender done on the first press and unticked before the second still counts', async () => {
        const unsubscribeFails = ['active-2'];
        const { result } = setup({ api: createFakeApi(unsubscribeFails) });
        const onConfirm = result.current;
        const subscriptions = generateSubscriptionList(3);
        await onConfirm({ subscriptions, archive: false });

        unsubscribeFails.length = 0;
        const outcome = await onConfirm({ subscriptions: [subscriptions[1]], archive: false });

        expect(outcome.allDone).toBe(true);
        expect(getIDs(outcome.unsubscribed).sort()).toEqual(['active-1', 'active-2', 'active-3']);
    });

    it('a sender whose archive failed counts as unsubscribed but keeps the run not done until a later press archives it', async () => {
        const archiveFails = ['active-1'];
        const { result } = setup({ api: createFakeApi([], archiveFails) });
        const onConfirm = result.current;
        const subscriptions = generateSubscriptionList(2);

        const first = await onConfirm({ subscriptions, archive: true });

        expect(first.allDone).toBe(false);
        expect(getIDs(first.unsubscribed)).toEqual(['active-1', 'active-2']);
        expect(createNotification).toHaveBeenCalledWith(ERROR_NOTIFICATION);

        archiveFails.length = 0;
        const second = await onConfirm({ subscriptions, archive: true });

        expect(second.allDone).toBe(true);
        expect(getIDs(second.unsubscribed)).toEqual(['active-1', 'active-2']);
    });

    it.each([
        { name: 'paid', hasPaidMail: true, applyTo: 'All' },
        { name: 'free', hasPaidMail: false, applyTo: 'Existing' },
    ])('creates rules only for paid users ($name)', async ({ hasPaidMail, applyTo }) => {
        const api = createFakeApi();
        const { result } = setup({ api, hasPaidMail });

        await result.current({ subscriptions: generateSubscriptionList(1), archive: true });

        const filterRequests = api.mock.calls.map(([request]: [Request]) => request).filter(({ data }) => data);
        expect(filterRequests.map(({ data }) => data?.ApplyTo)).toEqual([applyTo]);
    });

    it('on a second press only sends what failed the first time, even after a re-render', async () => {
        const unsubscribeFails = ['active-2'];
        const api = createFakeApi(unsubscribeFails);
        const { result, rerender } = setup({ api });
        const subscriptions = generateSubscriptionList(3);
        await result.current({ subscriptions, archive: false });

        unsubscribeFails.length = 0;
        rerender();
        await result.current({ subscriptions, archive: false });

        expect(getRequestedURLs(api).slice(3)).toEqual(['mail/v4/newsletter-subscriptions/active-2/unsubscribe']);
    });

    it('starts afresh for each new window', async () => {
        const api = createFakeApi();
        const subscriptions = generateSubscriptionList(2);
        const { result: firstWindow } = setup({ api });
        await firstWindow.current({ subscriptions, archive: false });

        const { result: secondWindow } = setup({ api });
        await secondWindow.current({ subscriptions, archive: false });

        expect(getRequestedURLs(api)).toEqual([
            'mail/v4/newsletter-subscriptions/active-1/unsubscribe',
            'mail/v4/newsletter-subscriptions/active-2/unsubscribe',
            'mail/v4/newsletter-subscriptions/active-1/unsubscribe',
            'mail/v4/newsletter-subscriptions/active-2/unsubscribe',
        ]);
    });

    it('refreshes the mailbox after a run', async () => {
        const { result } = setup();

        await result.current({ subscriptions: generateSubscriptionList(2), archive: true });

        expect(useEventManager.call).toHaveBeenCalledTimes(1);
    });
});
