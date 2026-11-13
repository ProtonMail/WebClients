import { renderHook } from '@testing-library/react';

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

const createFakeApi = (unsubscribeFails: string[] = []) => {
    return jest.fn(async ({ url }: Request) => {
        if (url.endsWith('/unsubscribe') && unsubscribeFails.includes(getSubscriptionID(url))) {
            throw Object.assign(new Error('api error'), { status: 422, data: { Code: 2501, Error: 'api error' } });
        }
        return {};
    });
};

const getRequestedURLs = (api: jest.Mock) => {
    return api.mock.calls.map(([{ url }]: [Request]) => url);
};

describe('useBYOEInboxCleanupConfirm', () => {
    const createNotification = jest.fn();

    interface SetupOptions {
        api?: jest.Mock;
        hasPaidMail?: boolean;
    }

    const setup = ({ api = createFakeApi(), hasPaidMail = false }: SetupOptions = {}) => {
        mockUseApi(api);
        mockUseUser([{ hasPaidMail }]);
        mockUseNotifications({ createNotification });
        return renderHook(() => useBYOEInboxCleanupConfirm());
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each([
        { count: 3, text: 'Unsubscribed from 3 mailing lists and moved their messages to Archive.' },
        { count: 1, text: 'Unsubscribed from 1 mailing list and moved its messages to Archive.' },
    ])('shows the archive confirmation and resolves when every sender is done ($count)', async ({ count, text }) => {
        const { result } = setup();
        const onConfirm = result.current();

        await expect(onConfirm({ subscriptions: generateSubscriptionList(count), archive: true })).resolves.toBe(
            undefined
        );

        expect(createNotification).toHaveBeenCalledTimes(1);
        expect(createNotification).toHaveBeenCalledWith({ text });
    });

    it.each([
        { count: 2, text: 'Unsubscribed from 2 mailing lists.' },
        { count: 1, text: 'Unsubscribed from 1 mailing list.' },
    ])('shows the unsubscribe-only confirmation when archiving is off ($count)', async ({ count, text }) => {
        const { result } = setup();
        const onConfirm = result.current();

        await onConfirm({ subscriptions: generateSubscriptionList(count), archive: false });

        expect(createNotification).toHaveBeenCalledWith({ text });
    });

    it('shows one error naming no senders and rejects when some senders fail', async () => {
        const { result } = setup({ api: createFakeApi(['active-2']) });
        const onConfirm = result.current();

        await expect(onConfirm({ subscriptions: generateSubscriptionList(3), archive: true })).rejects.toThrow();

        expect(createNotification).toHaveBeenCalledTimes(1);
        expect(createNotification).toHaveBeenCalledWith({
            text: "Some mailing lists couldn't be unsubscribed. Try again to finish unsubscribing.",
            type: 'error',
        });
    });

    it.each([
        { name: 'paid', hasPaidMail: true, applyTo: 'All' },
        { name: 'free', hasPaidMail: false, applyTo: 'Existing' },
    ])('creates rules only for paid users ($name)', async ({ hasPaidMail, applyTo }) => {
        const api = createFakeApi();
        const { result } = setup({ api, hasPaidMail });

        await result.current()({ subscriptions: generateSubscriptionList(1), archive: true });

        const filterRequests = api.mock.calls.map(([request]: [Request]) => request).filter(({ data }) => data);
        expect(filterRequests.map(({ data }) => data?.ApplyTo)).toEqual([applyTo]);
    });

    it('on a second press only sends what failed the first time', async () => {
        const unsubscribeFails = ['active-2'];
        const api = createFakeApi(unsubscribeFails);
        const { result } = setup({ api });
        const onConfirm = result.current();
        const subscriptions = generateSubscriptionList(3);
        await expect(onConfirm({ subscriptions, archive: false })).rejects.toThrow();

        unsubscribeFails.length = 0;
        await expect(onConfirm({ subscriptions, archive: false })).resolves.toBe(undefined);

        expect(getRequestedURLs(api).slice(3)).toEqual(['mail/v4/newsletter-subscriptions/active-2/unsubscribe']);
        expect(createNotification).toHaveBeenLastCalledWith({ text: 'Unsubscribed from 3 mailing lists.' });
    });

    it('starts afresh for each new window', async () => {
        const api = createFakeApi();
        const { result } = setup({ api });
        const subscriptions = generateSubscriptionList(2);
        await result.current()({ subscriptions, archive: false });

        await result.current()({ subscriptions, archive: false });

        expect(getRequestedURLs(api)).toEqual([
            'mail/v4/newsletter-subscriptions/active-1/unsubscribe',
            'mail/v4/newsletter-subscriptions/active-2/unsubscribe',
            'mail/v4/newsletter-subscriptions/active-1/unsubscribe',
            'mail/v4/newsletter-subscriptions/active-2/unsubscribe',
        ]);
    });

    it("still shows the message when the requests finish after the hook's component has gone", async () => {
        let finishRequest = () => {};
        const api = jest.fn(() => {
            return new Promise((resolve) => {
                finishRequest = () => resolve({});
            });
        });
        const { result, unmount } = setup({ api });
        const running = result.current()({ subscriptions: generateSubscriptionList(1), archive: false });

        unmount();
        finishRequest();
        await running;

        expect(createNotification).toHaveBeenCalledWith({ text: 'Unsubscribed from 1 mailing list.' });
    });

    it('refreshes the mailbox after a run', async () => {
        const { result } = setup();

        await result.current()({ subscriptions: generateSubscriptionList(2), archive: true });

        expect(useEventManager.call).toHaveBeenCalledTimes(1);
    });
});
