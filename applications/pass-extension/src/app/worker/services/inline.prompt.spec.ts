import type { Mock } from 'vitest';

import { getStateKey } from '@proton/pass/lib/auth/fork';
import { ReauthAction } from '@proton/pass/lib/auth/reauth';
import browser from '@proton/pass/lib/globals/browser';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import { WorkerMessageType } from '../../../types/messages';
import { InlineToastAction } from '../../content/constants.runtime';
import type * as ChannelMock from '../__mocks__/channel';
import { WorkerContext } from '../context/inject';
import { createInlineService } from './inline';

vi.mock('../channel');

const { mockHandlers } = (await import('../channel')) as typeof ChannelMock;

const tabsSendMessage = browser.tabs.sendMessage as Mock;
const tabsCreate = browser.tabs.create as Mock;
const sessionSet = vi.fn().mockResolvedValue(undefined);

const OWNER_TAB = 42;
const OTHER_TAB = 43;
const PROMPT_TRIGGER_DELAY = 3_000;
const TWO_PASSWORD_MODE = 2;

type UserOptions = { sso?: boolean; twoPassword?: boolean };

const createState = ({ sso = false, twoPassword = false }: UserOptions = {}, dismissedAt?: number) =>
    ({
        prompts: dismissedAt ? { 'offline-onpage': { count: 1, lastDismissedAt: dismissedAt } } : {},
        user: {
            user: { ID: 'user-id', Email: 'user@example.com', Flags: { sso } },
            userSettings: { Password: { Mode: twoPassword ? TWO_PASSWORD_MODE : 1 } },
        },
    }) as any;

const setContext = (state: any, { offlinePassword = false } = {}) =>
    WorkerContext.set({
        getState: () => ({ authorized: true }),
        authStore: { hasOfflineComponents: () => false, hasOfflinePassword: () => offlinePassword },
        service: { connectivity: { online: true }, store: { getState: () => state, dispatch: vi.fn() } },
    } as any);

const lastListener = (event: 'onUpdated' | 'onActivated' | 'onRemoved') => {
    const { calls } = (browser.tabs[event].addListener as Mock).mock;
    return calls[calls.length - 1][0];
};

const navigate = (tabId: number, { active = true } = {}) =>
    lastListener('onUpdated')(tabId, { status: 'complete' }, { id: tabId, url: 'https://example.com', active });

const activate = (tabId: number) => lastListener('onActivated')({ tabId });

const remove = (tabId: number) => lastListener('onRemoved')(tabId);

const flushPromptDelay = async () => {
    await vi.advanceTimersByTimeAsync(PROMPT_TRIGGER_DELAY);
};

const toastOpenCalls = () =>
    tabsSendMessage.mock.calls.filter(([, message]) => message.type === WorkerMessageType.INLINE_TOAST_OPEN);

describe('on-page offline prompt trigger', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        tabsSendMessage.mockResolvedValue(true);
        tabsCreate.mockResolvedValue({});
        (browser as any).storage = { session: { set: sessionSet } };
        setContext(createState());
        createInlineService();
    });

    afterEach(() => {
        vi.useRealTimers();
        WorkerContext.clear();
        vi.clearAllMocks();
    });

    test('shows the prompt in the first tab that navigates', async () => {
        navigate(OWNER_TAB);
        await flushPromptDelay();

        expect(toastOpenCalls()).toEqual([
            [
                OWNER_TAB,
                expect.objectContaining({
                    payload: {
                        action: InlineToastAction.OFFLINE_SETUP,
                        data: expect.objectContaining({ id: 'offline-onpage', title: 'Enable offline mode' }),
                    },
                }),
                { frameId: 0 },
            ],
        ]);
    });

    test('does not show the prompt in a second tab', async () => {
        navigate(OWNER_TAB);
        await flushPromptDelay();
        tabsSendMessage.mockClear();

        navigate(OTHER_TAB);
        activate(OTHER_TAB);
        await flushPromptDelay();

        expect(toastOpenCalls()).toEqual([]);
    });

    test('does not give the prompt to a background tab', async () => {
        navigate(OTHER_TAB, { active: false });
        await flushPromptDelay();
        expect(toastOpenCalls()).toEqual([]);

        navigate(OWNER_TAB);
        await flushPromptDelay();
        expect(toastOpenCalls().map(([tabId]) => tabId)).toEqual([OWNER_TAB]);
    });

    test('shows the prompt again when the owner tab navigates', async () => {
        navigate(OWNER_TAB);
        await flushPromptDelay();
        tabsSendMessage.mockClear();

        navigate(OWNER_TAB);
        await flushPromptDelay();

        expect(toastOpenCalls().map(([tabId]) => tabId)).toEqual([OWNER_TAB]);
    });

    test('gives the prompt to the next navigation once the owner tab is closed', async () => {
        navigate(OWNER_TAB);
        await flushPromptDelay();
        tabsSendMessage.mockClear();

        remove(OWNER_TAB);
        navigate(OTHER_TAB);
        await flushPromptDelay();

        expect(toastOpenCalls().map(([tabId]) => tabId)).toEqual([OTHER_TAB]);
    });

    test('shows the prompt again when the owner tab is activated', async () => {
        navigate(OWNER_TAB);
        await flushPromptDelay();
        tabsSendMessage.mockClear();

        activate(OWNER_TAB);
        await flushPromptDelay();

        expect(toastOpenCalls().map(([tabId]) => tabId)).toEqual([OWNER_TAB]);
    });

    test('does not show the prompt again once it was dismissed', async () => {
        navigate(OWNER_TAB);
        await flushPromptDelay();
        tabsSendMessage.mockClear();

        setContext(createState({}, getEpoch()));
        activate(OWNER_TAB);
        await flushPromptDelay();

        expect(toastOpenCalls()).toEqual([]);
    });

    test('does not show the prompt again once its action was used', async () => {
        navigate(OWNER_TAB);
        await flushPromptDelay();
        tabsSendMessage.mockClear();

        await mockHandlers.get(WorkerMessageType.OFFLINE_SETUP_OPEN)?.(
            { type: WorkerMessageType.OFFLINE_SETUP_OPEN, payload: {} },
            {}
        );
        activate(OWNER_TAB);
        await flushPromptDelay();

        expect(toastOpenCalls()).toEqual([]);
    });

    test('opens one toast when the owner tab updates twice within the delay', async () => {
        navigate(OWNER_TAB);
        navigate(OWNER_TAB);
        await flushPromptDelay();

        expect(toastOpenCalls().map(([tabId]) => tabId)).toEqual([OWNER_TAB]);
    });

    test('does not open a pending prompt dismissed during the delay', async () => {
        navigate(OWNER_TAB);
        setContext(createState({}, getEpoch()));
        await flushPromptDelay();

        expect(toastOpenCalls()).toEqual([]);
    });

    test('does not show the prompt again once a dismissal reached the worker', async () => {
        navigate(OWNER_TAB);
        await mockHandlers.get(WorkerMessageType.PROMPT_DISMISS)?.(
            { type: WorkerMessageType.PROMPT_DISMISS, payload: { id: 'offline-onpage' } },
            {}
        );
        await flushPromptDelay();

        activate(OWNER_TAB);
        navigate(OWNER_TAB);
        await flushPromptDelay();

        expect(toastOpenCalls()).toEqual([]);
    });
});

describe('on-page offline prompt action', () => {
    const openSetup = () =>
        mockHandlers.get(WorkerMessageType.OFFLINE_SETUP_OPEN)?.(
            { type: WorkerMessageType.OFFLINE_SETUP_OPEN, payload: {} },
            {}
        );

    beforeEach(() => {
        tabsCreate.mockResolvedValue({});
        (browser as any).storage = { session: { set: sessionSet } };
        createInlineService();
    });

    afterEach(() => {
        WorkerContext.clear();
        vi.clearAllMocks();
    });

    test('opens the settings page for a regular user', async () => {
        setContext(createState());
        await openSetup();

        expect(tabsCreate).toHaveBeenCalledTimes(1);
        expect(tabsCreate.mock.calls[0][0].url).toMatch(/\/settings\.html#\/general\?offline=setup$/);
        expect(sessionSet).not.toHaveBeenCalled();
    });

    test.each([
        ['an SSO user', { sso: true }],
        ['a two-password user', { twoPassword: true }],
    ])('forks to account directly for %s', async (_, options) => {
        setContext(createState(options));
        await openSetup();

        expect(tabsCreate).toHaveBeenCalledTimes(1);
        const url = new URL(tabsCreate.mock.calls[0][0].url, 'https://account.example.com');
        expect(url.pathname).toMatch(/\/authorize$/);
        expect(url.searchParams.get('prompt')).toBe('login');
        expect(url.searchParams.get('promptBypass')).toBe('none');
        expect(url.searchParams.get('promptType')).toBe('offline');
        expect(url.searchParams.get('email')).toBe('user@example.com');

        const state = url.searchParams.get('state')!;
        expect(sessionSet).toHaveBeenCalledWith({
            [getStateKey(state)]: JSON.stringify({
                type: 'reauth',
                userID: 'user-id',
                reauth: { type: ReauthAction.OFFLINE_SETUP },
            }),
        });
    });

    test('opens the settings page when the SSO user already has an offline password', async () => {
        setContext(createState({ sso: true }), { offlinePassword: true });
        await openSetup();

        expect(tabsCreate.mock.calls[0][0].url).toMatch(/\/settings\.html#\/general\?offline=setup$/);
        expect(sessionSet).not.toHaveBeenCalled();
    });
});
