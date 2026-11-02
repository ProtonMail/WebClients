import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import type { LumoCreditResponse } from '@proton/payments/core/api/lumoCredit';
import { MOCK_LUMO_CREDIT_RESPONSE } from '@proton/payments/testing/lumo-credit';

import { ApiUsageDashboard } from './ApiUsageDashboard';

jest.mock('@proton/account/paymentStatus/hooks');
jest.mock('@proton/account/subscription/hooks');
jest.mock('@proton/account/user/hooks');
jest.mock('@proton/app-context/useApi');
jest.mock('@proton/app-context/useConfig', () => ({ useConfig: () => ({ APP_NAME: 'proton-lumo' }) }));
jest.mock('./ApiTokenUsageChart', () => ({ ApiTokenUsageChart: () => null }));
jest.mock('@proton/components/containers/payments/LumoCreditsModal', () => ({ LumoCreditsModal: () => null }));
jest.mock('./useCanBuyLumoCredits', () => ({ useCanBuyLumoCredits: () => true }));

const getUrl = 'payments/v5/products/lumo-credit';
const autoTopUpUrl = 'payments/v5/products/lumo-credit/auto-top-up';
const spendingLimitUrl = 'payments/v5/products/lumo-credit/spending-limit';

const apiError = (Code: number, Error: string, status = 422) =>
    Object.assign(new globalThis.Error(Error), { status, data: { Code, Error } });

const setup = ({
    credits = {},
    failures = {},
    autoTopUpFlag = true,
    canManageBalance = true,
    canChargeAutoTopUp = true,
    isOrgMember = false,
    firstGetReleased = Promise.resolve(),
}: {
    firstGetReleased?: Promise<void>;
    isOrgMember?: boolean;
    credits?: Partial<LumoCreditResponse>;
    failures?: Record<string, Error>;
    autoTopUpFlag?: boolean;
    canManageBalance?: boolean;
    canChargeAutoTopUp?: boolean;
} = {}) => {
    let response: LumoCreditResponse = { ...MOCK_LUMO_CREDIT_RESPONSE, ...credits };
    const api = jest.fn(
        ({ url, data }: { url: string; data?: { Enabled: boolean; Quantity?: number; Limit?: number } }) => {
            if (failures[url]) {
                return Promise.reject(failures[url]);
            }
            if (url === autoTopUpUrl && data) {
                response = {
                    ...response,
                    AutoTopUp: { ...response.AutoTopUp, Enabled: data.Enabled, Quantity: data.Quantity ?? null },
                };
            }
            if (url === spendingLimitUrl && data) {
                response = { ...response, UsageLimit: data.Enabled ? String(data.Limit) : '0' };
            }
            if (url === getUrl && callsTo(api, getUrl).length === 1) {
                return firstGetReleased.then(() => response);
            }
            return Promise.resolve(response);
        }
    );
    (useApi as jest.Mock).mockReturnValue(api);
    (useUser as jest.Mock).mockReturnValue([{ Credit: 0, Currency: 'USD' }]);
    (useSubscription as jest.Mock).mockReturnValue([{ Currency: 'USD' }]);
    (usePaymentStatus as jest.Mock).mockReturnValue([{ CountryCode: 'DE', VendorStates: {} }, false]);
    render(
        <ApiUsageDashboard
            isOrgAdmin={false}
            isOrgMember={isOrgMember}
            canManageBalance={canManageBalance}
            canChargeAutoTopUp={canChargeAutoTopUp}
            showAutoTopUp={autoTopUpFlag}
        />
    );
    return api;
};

const callsTo = (api: jest.Mock, url: string) => api.mock.calls.filter(([config]) => config.url === url);
const settingsRow = () => document.querySelector('.api-usage-balance-card__settings') as HTMLElement;
const balanceCard = () => document.querySelector('.api-usage-balance-card') as HTMLElement;
const openManage = () =>
    fireEvent.click(screen.getByRole('button', { name: 'Manage automatic top-up and spending limit' }));
const queryManage = () => screen.queryByRole('button', { name: 'Manage automatic top-up and spending limit' });
const saveSettings = () => fireEvent.click(screen.getByText('Save settings').closest('button')!);
const waitForBalance = () => waitFor(() => expect(balanceCard()).toHaveTextContent('US$15'));

describe('ApiUsageDashboard balance settings', () => {
    it('opens Manage with the settings from the balance', async () => {
        setup({
            credits: { AutoTopUp: { Enabled: true, Threshold: 20, Quantity: 75 }, Usage: '40', UsageLimit: '300' },
        });
        await waitForBalance();

        openManage();

        expect(screen.getByLabelText(/^Automatic top-up/)).toBeChecked();
        expect(screen.getByLabelText('Top up by')).toHaveValue(75);
        expect(screen.getByLabelText('When balance falls below')).toHaveValue(20);
        expect(screen.getByLabelText(/^Monthly spending limit/)).toBeChecked();
        expect(screen.getByLabelText('Limit')).toHaveValue(300);
        expect(screen.getByText('$40.00 of $300.00 used this month')).toBeInTheDocument();
    });

    it('summarises the automatic top-up from the balance', async () => {
        setup({ credits: { AutoTopUp: { Enabled: true, Threshold: 20, Quantity: 75 } } });

        await waitFor(() => expect(settingsRow()).toHaveTextContent('Automatic top-up enabled'));
        expect(settingsRow()).toHaveTextContent('Adding $75.00 when your balance falls below $20.00');
    });

    it.each([
        ['147.5', 'Monthly spending limit: $147.50 of $250.00 used (59%)'],
        ['200', 'Monthly spending limit: $200.00 of $250.00 used (80%)'],
    ])('shows a usage of %p against the limit', async (Usage, text) => {
        setup({ credits: { Usage, UsageLimit: '250' } });

        await waitFor(() => expect(settingsRow()).toHaveTextContent(text));
        expect(screen.getByRole('button', { name: 'Top up balance' })).toBeEnabled();
    });

    it('blocks topping up once the spending limit is reached', async () => {
        setup({ credits: { Usage: '250', UsageLimit: '250' } });

        await waitFor(() =>
            expect(settingsRow()).toHaveTextContent(
                'Monthly spending limit reached. API requests are paused until next month.'
            )
        );
        expect(screen.getByRole('button', { name: 'Top up balance' })).toBeDisabled();
    });

    it('shows no limit when the limit is zero', async () => {
        setup({ credits: { Usage: '0', UsageLimit: '0' } });

        await waitFor(() => expect(settingsRow()).toHaveTextContent('No monthly spending limit'));
        expect(screen.getByRole('button', { name: 'Top up balance' })).toBeEnabled();
    });

    it('saves the changed settings, closes and shows the refetched values', async () => {
        const api = setup({ credits: { UsageLimit: '0' } });
        await waitForBalance();
        openManage();

        fireEvent.click(screen.getByLabelText(/^Automatic top-up/));
        fireEvent.change(screen.getByLabelText('Top up by'), { target: { value: '30' } });
        saveSettings();

        await waitFor(() => expect(document.querySelector('.modal-two--out')).toBeInTheDocument());
        expect(callsTo(api, autoTopUpUrl)).toEqual([
            [{ url: autoTopUpUrl, method: 'put', data: { Enabled: true, Quantity: 30 }, silence: true }],
        ]);
        expect(callsTo(api, spendingLimitUrl)).toHaveLength(0);
        expect(callsTo(api, getUrl)).toHaveLength(2);
        expect(settingsRow()).toHaveTextContent('Adding $30.00 when your balance falls below $20.00');
    });

    it.each([
        [
            'an out-of-range amount',
            apiError(2001, 'Invalid quantity'),
            'Top-up amount must be between $25.00 and $100.00',
        ],
        [
            'a user who is not the primary administrator',
            apiError(2011, 'Not the primary administrator'),
            "Only the organization's primary admin can change these settings.",
        ],
        [
            'a member without the payments scope',
            apiError(9100, 'Access token does not have sufficient scope', 403),
            "Only the organization's primary admin can change these settings.",
        ],
        [
            'a refused purchase guard',
            apiError(2000, 'Lumo credits cannot be purchased yet.', 400),
            'Automatic top-up could not be saved. Please try again.',
        ],
    ])('keeps the settings open after %s and explains the error in the modal only', async (_, error, message) => {
        const api = setup({ failures: { [autoTopUpUrl]: error } });
        await waitForBalance();
        openManage();

        fireEvent.click(screen.getByLabelText(/^Automatic top-up/));
        saveSettings();

        expect(await screen.findByText(message)).toBeInTheDocument();
        expect(screen.getByText('Balance settings')).toBeInTheDocument();
        expect(document.querySelector('.modal-two--out')).not.toBeInTheDocument();
        expect(callsTo(api, autoTopUpUrl)[0][0]).toHaveProperty('silence', true);
    });

    it('names the spending limit when only the automatic top-up saved', async () => {
        setup({ credits: { UsageLimit: '0' }, failures: { [spendingLimitUrl]: apiError(2001, 'Not found', 404) } });
        await waitForBalance();
        openManage();

        fireEvent.click(screen.getByLabelText(/^Automatic top-up/));
        fireEvent.click(screen.getByLabelText(/^Monthly spending limit/));
        saveSettings();

        expect(
            await screen.findByText('Monthly spending limit could not be saved. Please try again.')
        ).toBeInTheDocument();
        await waitFor(() => expect(settingsRow()).toHaveTextContent('Automatic top-up enabled'));
    });

    it('shows only the spending limit in the card while the automatic top-up is off', async () => {
        setup({ autoTopUpFlag: false, credits: { Usage: '147.5', UsageLimit: '250' } });

        await waitFor(() =>
            expect(settingsRow()).toHaveTextContent('Monthly spending limit: $147.50 of $250.00 used (59%)')
        );
        expect(settingsRow()).not.toHaveTextContent('Automatic top-up');
        expect(settingsRow()).not.toHaveTextContent('Keep API requests running');
    });

    it('hides the automatic top-up settings while the feature is off', async () => {
        setup({ autoTopUpFlag: false });
        await waitForBalance();

        openManage();

        expect(screen.queryByLabelText(/^Automatic top-up/)).not.toBeInTheDocument();
        expect(screen.getByLabelText(/^Monthly spending limit/)).toBeInTheDocument();
    });

    it('shows Manage only once the balance settings have loaded', async () => {
        let releaseFirstGet = () => {};
        setup({ firstGetReleased: new Promise((resolve) => (releaseFirstGet = resolve)) });

        expect(queryManage()).not.toBeInTheDocument();
        releaseFirstGet();

        await waitFor(() => expect(queryManage()).toBeInTheDocument());
    });

    it('hides Manage when the balance settings could not be loaded', async () => {
        setup({ failures: { [getUrl]: apiError(2001, 'Not found', 404) } });

        await waitFor(() => expect(balanceCard()).toHaveTextContent('Balance unavailable'));
        expect(queryManage()).not.toBeInTheDocument();
    });

    it('hides Manage from a user who cannot manage the balance', async () => {
        setup({ canManageBalance: false });
        await waitForBalance();

        expect(
            screen.queryByRole('button', { name: 'Manage automatic top-up and spending limit' })
        ).not.toBeInTheDocument();
        expect(settingsRow()).toHaveTextContent('Automatic top-up off');
    });

    it('warns when the automatic top-up cannot be charged', async () => {
        setup({ canChargeAutoTopUp: false });
        await waitForBalance();
        openManage();

        fireEvent.click(screen.getByLabelText(/^Automatic top-up/));

        expect(screen.getByText(/^Automatic top-up needs a card or PayPal/)).toBeInTheDocument();
    });

    const failedAutoTopUp = (Reason?: string) => ({
        AutoTopUp: { Enabled: true, Threshold: 20, Quantity: 50, Status: 'Failed' as const, Reason },
    });
    const statusBanner = () => balanceCard().querySelector('.api-usage-balance-status');

    it.each([
        ['PaymentFailed', 'The last payment did not go through.'],
        ['NoAutopay', 'Automatic payments are off for your payment method.'],
    ])('shows the known reason %p why the automatic top-up failed', async (reason, message) => {
        setup({ credits: failedAutoTopUp(reason) });

        await waitFor(() =>
            expect(statusBanner()).toHaveTextContent(
                `Automatic top-up failed. Update your payment method to resume automatic top-ups. ${message}`
            )
        );
    });

    it('does not show an unknown reason from the API', async () => {
        setup({ credits: failedAutoTopUp('card_declined: insufficient funds') });

        await waitFor(() =>
            expect(statusBanner()).toHaveTextContent(
                /^Automatic top-up failed. Update your payment method to resume automatic top-ups.$/
            )
        );
    });

    it('shows a paused automatic top-up', async () => {
        setup({ credits: { AutoTopUp: { Enabled: true, Threshold: 20, Quantity: 50, Status: 'Paused' } } });

        await waitFor(() =>
            expect(statusBanner()).toHaveTextContent(
                'Automatic top-up paused. Update your payment method to resume automatic top-ups.'
            )
        );
        expect(settingsRow()).toHaveTextContent('Automatic top-up paused');
    });

    it('does not show a failed automatic top-up as enabled', async () => {
        setup({ credits: failedAutoTopUp() });

        await waitFor(() => expect(settingsRow()).toHaveTextContent('Automatic top-up failed'));
        expect(settingsRow()).not.toHaveTextContent('Automatic top-up enabled');
        expect(settingsRow().querySelector('.api-usage-balance-row__badge')).toBeNull();
    });

    it('does not show the automatic top-up status to an organization member', async () => {
        setup({ credits: failedAutoTopUp('PaymentFailed'), isOrgMember: true });

        await waitFor(() => expect(balanceCard()).toHaveTextContent('US$15'));
        expect(balanceCard()).not.toHaveTextContent('Automatic top-up');
    });

    it('does not show the automatic top-up status while the feature is off', async () => {
        setup({ credits: failedAutoTopUp('PaymentFailed'), autoTopUpFlag: false });
        await waitForBalance();

        expect(statusBanner()).toBeNull();
    });

    it('shows only on or off without a status', async () => {
        setup({ credits: { AutoTopUp: { Enabled: true, Threshold: 20, Quantity: 50 } } });

        await waitFor(() => expect(settingsRow()).toHaveTextContent('Automatic top-up enabled'));
        expect(balanceCard()).not.toHaveTextContent('Update your payment method');
    });
});
