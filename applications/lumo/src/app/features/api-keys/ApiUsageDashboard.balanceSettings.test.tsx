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
jest.mock('@proton/payments-ui/ui/containers/LumoCreditsModal', () => ({ LumoCreditsModal: () => null }));

const getUrl = 'payments/v5/products/lumo-credit';
const autoTopUpUrl = 'payments/v5/products/lumo-credit/auto-top-up';

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
    credits?: Partial<LumoCreditResponse['AutoTopUp']>;
    failures?: Record<string, Error>;
    autoTopUpFlag?: boolean;
    canManageBalance?: boolean;
    canChargeAutoTopUp?: boolean;
} = {}) => {
    let response: LumoCreditResponse = {
        ...MOCK_LUMO_CREDIT_RESPONSE,
        AutoTopUp: { ...MOCK_LUMO_CREDIT_RESPONSE.AutoTopUp, ...credits },
    };
    const api = jest.fn(
        ({
            url,
            data,
        }: {
            url: string;
            data?: { Enabled: boolean; Quantity: number; SpendingLimitEnabled: boolean; SpendingLimit: number };
        }) => {
            if (failures[url]) {
                return Promise.reject(failures[url]);
            }
            if (url === autoTopUpUrl && data) {
                response = {
                    ...response,
                    AutoTopUp: {
                        ...response.AutoTopUp,
                        Enabled: data.Enabled,
                        Quantity: data.Quantity,
                        SpendingLimitEnabled: data.SpendingLimitEnabled,
                        SpendingLimit: data.SpendingLimit,
                    },
                };
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
    const autoTopUpOn = { Enabled: true, Threshold: 20, Quantity: 50 };

    it('opens Manage with the settings from the balance', async () => {
        setup({
            credits: { ...autoTopUpOn, Quantity: 75, SpendingLimitEnabled: true, SpendingLimit: 300, Spent: 40 },
        });
        await waitForBalance();

        openManage();

        expect(screen.getByLabelText(/^Automatic top-up/)).toBeChecked();
        expect(screen.getByLabelText('Top up by')).toHaveValue(75);
        expect(screen.getByLabelText('When balance falls below')).toHaveValue(20);
        expect(screen.getByLabelText(/^Monthly spending limit/)).toBeChecked();
        expect(screen.getByLabelText('Limit')).toHaveValue(300);
        expect(screen.getByText('$40.00 of $300.00 bought automatically this month')).toBeInTheDocument();
    });

    it('summarises the automatic top-up from the balance', async () => {
        setup({ credits: { ...autoTopUpOn, Quantity: 75 } });

        await waitFor(() => expect(settingsRow()).toHaveTextContent('Automatic top-up enabled'));
        expect(settingsRow()).toHaveTextContent('Adding $75.00 when your balance falls below $20.00');
    });

    it('shows the credits bought automatically against the limit', async () => {
        setup({ credits: { ...autoTopUpOn, SpendingLimitEnabled: true, SpendingLimit: 250, Spent: 150 } });

        await waitFor(() =>
            expect(settingsRow()).toHaveTextContent(
                'Monthly spending limit: $150.00 of $250.00 bought automatically (60%)'
            )
        );
    });

    it('keeps manual top-ups available once the spending limit is reached', async () => {
        setup({ credits: { ...autoTopUpOn, SpendingLimitEnabled: true, SpendingLimit: 250, Spent: 225 } });

        await waitFor(() =>
            expect(settingsRow()).toHaveTextContent(
                'Monthly spending limit reached. Automatic top-ups are paused until next month.'
            )
        );
        expect(screen.getByRole('button', { name: 'Top up balance' })).toBeEnabled();
    });

    it('says automatic top-ups have no limit when it is off', async () => {
        setup({ credits: autoTopUpOn });

        await waitFor(() => expect(settingsRow()).toHaveTextContent('No monthly limit on automatic top-ups'));
    });

    it('shows no spending limit while automatic top-up is off', async () => {
        setup({ credits: { SpendingLimitEnabled: true, SpendingLimit: 250, Spent: 225 } });

        await waitFor(() => expect(settingsRow()).toHaveTextContent('Automatic top-up off'));
        expect(settingsRow()).not.toHaveTextContent('Monthly spending limit');
    });

    it('saves the automatic top-up with its spending limit, closes and shows the refetched values', async () => {
        const api = setup();
        await waitForBalance();
        openManage();

        fireEvent.click(screen.getByLabelText(/^Automatic top-up/));
        fireEvent.change(screen.getByLabelText('Top up by'), { target: { value: '30' } });
        fireEvent.click(screen.getByLabelText(/^Monthly spending limit/));
        fireEvent.change(screen.getByLabelText('Limit'), { target: { value: '120' } });
        saveSettings();

        await waitFor(() => expect(document.querySelector('.modal-two--out')).toBeInTheDocument());
        expect(callsTo(api, autoTopUpUrl)).toEqual([
            [
                {
                    url: autoTopUpUrl,
                    method: 'put',
                    data: { Enabled: true, Quantity: 30, SpendingLimitEnabled: true, SpendingLimit: 120 },
                    silence: true,
                },
            ],
        ]);
        expect(callsTo(api, getUrl)).toHaveLength(2);
        expect(settingsRow()).toHaveTextContent('Adding $30.00 when your balance falls below $20.00');
        expect(settingsRow()).toHaveTextContent('Monthly spending limit: $0.00 of $120.00 bought automatically (0%)');
    });

    it.each([
        [
            'an invalid quantity or spending limit',
            apiError(2001, 'Invalid spending limit'),
            'Automatic top-up could not be saved. Please try again.',
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

    it('hides the balance settings while the automatic top-up feature is off', async () => {
        setup({ autoTopUpFlag: false, credits: { SpendingLimitEnabled: true, SpendingLimit: 250 } });
        await waitForBalance();

        expect(settingsRow()).toBeNull();
        expect(queryManage()).not.toBeInTheDocument();
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

    const failedAutoTopUp = (Reason?: string) => ({ ...autoTopUpOn, Status: 'Failed' as const, Reason });
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
        setup({ credits: { ...autoTopUpOn, Status: 'Paused' } });

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
        setup({ credits: autoTopUpOn });

        await waitFor(() => expect(settingsRow()).toHaveTextContent('Automatic top-up enabled'));
        expect(balanceCard()).not.toHaveTextContent('Update your payment method');
    });
});
