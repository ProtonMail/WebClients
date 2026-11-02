import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { type ApiBalanceSettings, ApiBalanceSettingsModal } from './ApiBalanceSettingsModal';

const settings: ApiBalanceSettings = {
    autoTopUp: { enabled: true, amount: 50, threshold: 20 },
    spendingLimit: { enabled: true, limit: 250 },
};

const setup = ({
    onSave = jest.fn().mockResolvedValue([]),
    showAutoTopUp = true,
    canChargeAutoTopUp = true,
    initialSettings = settings,
}: {
    onSave?: jest.Mock;
    showAutoTopUp?: boolean;
    canChargeAutoTopUp?: boolean;
    initialSettings?: ApiBalanceSettings;
} = {}) => {
    const onClose = jest.fn();
    render(
        <ApiBalanceSettingsModal
            open
            onClose={onClose}
            onExit={jest.fn()}
            settings={initialSettings}
            currency="USD"
            monthlySpend={12.5}
            showAutoTopUp={showAutoTopUp}
            canChargeAutoTopUp={canChargeAutoTopUp}
            onSave={onSave}
        />
    );
    return { onSave, onClose };
};

const amountInput = () => screen.getByLabelText('Top up by');
const saveButton = () => screen.getByText('Save settings').closest('button')!;
const rangeError = 'Top-up amount must be between $25.00 and $100.00';

describe('ApiBalanceSettingsModal', () => {
    it('shows the threshold from the balance as read-only', () => {
        setup();

        const threshold = screen.getByLabelText('When balance falls below');
        expect(threshold).toHaveValue(20);
        expect(threshold).toHaveAttribute('readonly');
        expect(screen.getByText('Adding $50.00 when your balance falls below $20.00')).toBeInTheDocument();
    });

    it.each(['24', '101', '25.5', ''])('rejects a top-up amount of %p', (amount) => {
        setup();

        fireEvent.change(amountInput(), { target: { value: amount } });

        expect(screen.getByText(rangeError)).toBeInTheDocument();
        expect(saveButton()).toBeDisabled();
    });

    it.each(['25', '100'])('accepts a top-up amount of %p', (amount) => {
        setup();

        fireEvent.change(amountInput(), { target: { value: amount } });

        expect(screen.queryByText(rangeError)).not.toBeInTheDocument();
        expect(saveButton()).toBeEnabled();
    });

    it('disables saving while the settings are saved, then closes', async () => {
        let resolveSave: (failedSections: string[]) => void = () => {};
        const onSave = jest.fn(() => new Promise((resolve) => (resolveSave = resolve)));
        const { onClose } = setup({ onSave });

        fireEvent.change(amountInput(), { target: { value: '75' } });
        fireEvent.click(saveButton());

        expect(onSave).toHaveBeenCalledWith({ autoTopUp: { enabled: true, amount: 75, threshold: 20 } });
        expect(saveButton()).toBeDisabled();
        expect(onClose).not.toHaveBeenCalled();

        resolveSave([]);

        await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    });

    it('saves only the spending limit when only it changed', () => {
        const { onSave } = setup();

        fireEvent.change(screen.getByLabelText('Limit', { exact: true }), { target: { value: '300' } });
        fireEvent.click(saveButton());

        expect(onSave).toHaveBeenCalledWith({ spendingLimit: { enabled: true, limit: 300 } });
    });

    it('ignores the amount of a top-up that stays off', () => {
        const { onSave } = setup({
            initialSettings: { ...settings, autoTopUp: { ...settings.autoTopUp, enabled: false, amount: 60 } },
        });

        fireEvent.click(screen.getByLabelText(/^Automatic top-up/));
        fireEvent.change(amountInput(), { target: { value: '80' } });
        fireEvent.click(screen.getByLabelText(/^Automatic top-up/));
        fireEvent.click(saveButton());

        expect(onSave).toHaveBeenCalledWith({});
    });

    it('compares the edits with the settings it was opened with', () => {
        const onSave = jest.fn().mockResolvedValue([]);
        const props = { open: true, onClose: jest.fn(), onExit: jest.fn(), currency: 'USD' as const, monthlySpend: 0 };
        const { rerender } = render(
            <ApiBalanceSettingsModal {...props} settings={settings} showAutoTopUp canChargeAutoTopUp onSave={onSave} />
        );
        rerender(
            <ApiBalanceSettingsModal
                {...props}
                settings={{ ...settings, autoTopUp: { ...settings.autoTopUp, amount: 90 } }}
                showAutoTopUp
                canChargeAutoTopUp
                onSave={onSave}
            />
        );

        fireEvent.click(saveButton());

        expect(onSave).toHaveBeenCalledWith({});
    });

    it.each([
        ['autoTopUp', 500, 0, 'Automatic top-up could not be saved. Please try again.'],
        ['spendingLimit', 500, 0, 'Monthly spending limit could not be saved. Please try again.'],
        ['autoTopUp', 422, 2001, 'Top-up amount must be between $25.00 and $100.00'],
        ['spendingLimit', 422, 2001, 'Monthly spending limit could not be saved. Please try again.'],
        ['autoTopUp', 422, 2011, "Only the organization's primary admin can change these settings."],
        ['spendingLimit', 403, 9100, "Only the organization's primary admin can change these settings."],
    ])('stays open after the %s section failed with %p/%p', async (section, status, Code, message) => {
        const error = { status, data: { Code, Error: 'From the API' } };
        const { onClose } = setup({ onSave: jest.fn().mockResolvedValue([{ section, error }]) });

        fireEvent.click(saveButton());

        expect(await screen.findByText(message)).toBeInTheDocument();
        expect(screen.queryByText('From the API')).not.toBeInTheDocument();
        expect(onClose).not.toHaveBeenCalled();
        expect(saveButton()).toBeEnabled();
    });

    it('names each failed section once', async () => {
        const notAdmin = { status: 422, data: { Code: 2011, Error: 'From the API' } };
        setup({
            onSave: jest.fn().mockResolvedValue([
                { section: 'autoTopUp', error: notAdmin },
                { section: 'spendingLimit', error: notAdmin },
            ]),
        });

        fireEvent.click(saveButton());

        expect(
            await screen.findAllByText("Only the organization's primary admin can change these settings.")
        ).toHaveLength(1);
    });

    it('hides the automatic top-up while it is unavailable', () => {
        setup({ showAutoTopUp: false });

        expect(screen.queryByText('Automatic top-up')).not.toBeInTheDocument();
        expect(screen.getByText('Monthly spending limit')).toBeInTheDocument();
    });

    it('warns when an enabled top-up cannot be charged', () => {
        setup({
            canChargeAutoTopUp: false,
            initialSettings: { ...settings, autoTopUp: { ...settings.autoTopUp, enabled: false } },
        });
        const warning =
            'Automatic top-up needs a card or PayPal set as default payment method with automatic payments on.';

        expect(screen.queryByText(warning)).not.toBeInTheDocument();

        fireEvent.click(screen.getByLabelText(/^Automatic top-up/));

        expect(screen.getByText(warning)).toBeInTheDocument();
    });

    it('does not warn when the top-up can be charged', () => {
        setup();

        expect(screen.queryByText(/Automatic top-up needs/)).not.toBeInTheDocument();
    });
});
