import { EASY_SWITCH_FEATURES, EASY_SWITCH_SOURCES, OAUTH_PROVIDER } from '../../interface';
import { createTokenItem } from './sync.actions';

const mockApi = jest.fn();
const mockCreateNotification = jest.fn();

const errorNotification = { type: 'error', text: 'Address could not be added.' } as const;

const run = (props: { expectedEmailAddress?: string; silent?: boolean }) =>
    createTokenItem({
        Code: 'code',
        Provider: OAUTH_PROVIDER.GOOGLE,
        RedirectUri: 'https://account.proton.me/lite',
        Source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
        Features: [EASY_SWITCH_FEATURES.BYOE],
        errorNotification,
        ...props,
    })(jest.fn(), jest.fn(), {
        api: mockApi,
        notificationManager: { createNotification: mockCreateNotification },
        eventManager: {},
    } as any);

describe('createTokenItem', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockApi.mockResolvedValue({ Token: { ID: 'token-id', Account: 'test@gmail.com' } });
    });

    it('should return the token', async () => {
        const result = await run({});

        expect(result.type).toBe('token/create/fulfilled');
        expect(result.payload).toEqual({ ID: 'token-id', Account: 'test@gmail.com' });
        expect(mockCreateNotification).not.toHaveBeenCalled();
    });

    describe('when the api fails', () => {
        beforeEach(() => mockApi.mockRejectedValue({ data: { Code: 2000, Error: 'Invalid code' } }));

        it('should show the error notification', async () => {
            const result = await run({});

            expect(result.type).toBe('token/create/rejected');
            expect(mockCreateNotification).toHaveBeenCalledWith(errorNotification);
        });

        it('should not show any notification when silent', async () => {
            const result = await run({ silent: true });

            expect(result.type).toBe('token/create/rejected');
            expect(result.payload).toEqual({ Code: 2000, Error: 'Invalid code' });
            expect(mockCreateNotification).not.toHaveBeenCalled();
        });
    });

    describe('when the token is for another address than the expected one', () => {
        it('should reject with wrong_account and show a notification', async () => {
            const result = await run({ expectedEmailAddress: 'other@gmail.com' });

            expect(result.type).toBe('token/create/rejected');
            expect(result.payload).toEqual({ Code: 0, Error: 'wrong_account' });
            expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
        });

        it('should reject with wrong_account and no notification when silent', async () => {
            const result = await run({ expectedEmailAddress: 'other@gmail.com', silent: true });

            expect(result.payload).toEqual({ Code: 0, Error: 'wrong_account' });
            expect(mockCreateNotification).not.toHaveBeenCalled();
        });
    });
});
