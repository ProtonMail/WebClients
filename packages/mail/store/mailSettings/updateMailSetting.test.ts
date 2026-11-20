import { type Reducer, type createSlice as CreateSlice, configureStore } from '@reduxjs/toolkit';

import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';

import { updateMailSetting, updateMailSettingWithRequest } from './updateMailSetting';

// The real slice pulls in @proton/account, which is not needed to test the thunk
vi.mock('./index', async () => {
    const slice = (await vi.importActual<{ createSlice: typeof CreateSlice }>('@reduxjs/toolkit')).createSlice({
        name: 'mailSettings',
        initialState: { value: undefined as unknown },
        reducers: {
            updateMailSettings: (state: any, action: any) => {
                state.value = { ...state.value, ...action.payload };
            },
        },
    });
    return {
        mailSettingsActions: slice.actions,
        mailSettingsReducer: slice.reducer,
        selectMailSettings: (state: any) => state.mailSettings,
    };
});

const { mailSettingsReducer } = (await import('./index')) as any;

const setup = (initial: Partial<MailSettings>) => {
    const api = vi.fn();
    const store = configureStore({
        reducer: { mailSettings: mailSettingsReducer as Reducer<{ value: Partial<MailSettings> }> },
        preloadedState: { mailSettings: { value: initial } },
        middleware: (getDefault: any) => getDefault({ thunk: { extraArgument: { api } } }),
    });
    const get = () => store.getState().mailSettings.value;
    const update = (...args: Parameters<typeof updateMailSetting>) =>
        (store.dispatch as any)(updateMailSetting(...args));
    return { api, get, update, store };
};

describe('updateMailSetting', () => {
    it('stores the new value before the server answers, then the server response', async () => {
        const { api, get, update } = setup({ PageSize: MAIL_PAGE_SIZE.FIFTY });
        let answer!: (response: unknown) => void;
        api.mockReturnValue(new Promise((resolve) => (answer = resolve)));

        const result = update('PageSize', MAIL_PAGE_SIZE.ONE_HUNDRED);
        expect(get().PageSize).toBe(MAIL_PAGE_SIZE.ONE_HUNDRED);

        answer({ MailSettings: { PageSize: MAIL_PAGE_SIZE.ONE_HUNDRED } });
        await result;
        expect(get().PageSize).toBe(MAIL_PAGE_SIZE.ONE_HUNDRED);
    });

    it('stores only the updated setting from the response', async () => {
        const { api, get, update } = setup({ PageSize: MAIL_PAGE_SIZE.FIFTY, ShowMoved: 1 });
        api.mockResolvedValue({ MailSettings: { PageSize: MAIL_PAGE_SIZE.ONE_HUNDRED, ShowMoved: 0 } });

        await update('PageSize', MAIL_PAGE_SIZE.ONE_HUNDRED);
        expect(get()).toMatchObject({ PageSize: MAIL_PAGE_SIZE.ONE_HUNDRED, ShowMoved: 1 });
    });

    it('does not undo a setting updated meanwhile when a late response arrives', async () => {
        const { api, get, update } = setup({ PageSize: MAIL_PAGE_SIZE.FIFTY, ShowMoved: 1 });
        const answers: ((response: unknown) => void)[] = [];
        api.mockImplementation(() => new Promise((resolve) => answers.push(resolve)));

        const first = update('PageSize', MAIL_PAGE_SIZE.ONE_HUNDRED);
        const second = update('ShowMoved', 0);
        // The server handled the page size first: its response still holds the old ShowMoved
        answers[1]({ MailSettings: { PageSize: MAIL_PAGE_SIZE.ONE_HUNDRED, ShowMoved: 0 } });
        answers[0]({ MailSettings: { PageSize: MAIL_PAGE_SIZE.ONE_HUNDRED, ShowMoved: 1 } });
        await Promise.all([first, second]);

        expect(get()).toMatchObject({ PageSize: MAIL_PAGE_SIZE.ONE_HUNDRED, ShowMoved: 0 });
    });

    it('stores the whole response for a raw request', async () => {
        const { api, get, store } = setup({ PageSize: MAIL_PAGE_SIZE.FIFTY, ShowMoved: 1 });
        api.mockResolvedValue({ MailSettings: { PageSize: MAIL_PAGE_SIZE.ONE_HUNDRED, ShowMoved: 0 } });

        await (store.dispatch as any)(updateMailSettingWithRequest({ url: 'some/url', method: 'put' }));
        expect(get()).toMatchObject({ PageSize: MAIL_PAGE_SIZE.ONE_HUNDRED, ShowMoved: 0 });
    });

    it('restores the previous value when the request fails', async () => {
        const { api, get, update } = setup({ PageSize: MAIL_PAGE_SIZE.FIFTY });
        api.mockRejectedValue(new Error('nope'));

        await expect(update('PageSize', MAIL_PAGE_SIZE.ONE_HUNDRED)).rejects.toThrow('nope');
        expect(get().PageSize).toBe(MAIL_PAGE_SIZE.FIFTY);
    });

    it('does not overwrite a newer value of the same setting when an older request fails', async () => {
        const { api, get, update } = setup({ PageSize: MAIL_PAGE_SIZE.FIFTY });
        const answers: { resolve: (response: unknown) => void; reject: (error: Error) => void }[] = [];
        api.mockImplementation(() => new Promise((resolve, reject) => answers.push({ resolve, reject })));

        const first = update('PageSize', MAIL_PAGE_SIZE.ONE_HUNDRED);
        const second = update('PageSize', MAIL_PAGE_SIZE.TWO_HUNDRED);
        answers[1].resolve({ MailSettings: { PageSize: MAIL_PAGE_SIZE.TWO_HUNDRED } });
        answers[0].reject(new Error('nope'));
        await second;
        await expect(first).rejects.toThrow('nope');

        expect(get().PageSize).toBe(MAIL_PAGE_SIZE.TWO_HUNDRED);
    });

    it('waits for the server for ImageProxy, its stored value is not the one given', async () => {
        const { api, get, update } = setup({ ImageProxy: 0b01 });
        api.mockReturnValue(new Promise(() => {}));

        void update('ImageProxy', { value: 0b10, action: 'add' });
        expect(get().ImageProxy).toBe(0b01);
    });
});
