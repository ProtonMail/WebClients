import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { type ApiBalanceSettings, ApiBalanceSettingsModal } from './ApiBalanceSettingsModal';

const settings: ApiBalanceSettings = {
    autoTopUp: { enabled: true, amount: 50, threshold: 20 },
    spendingLimit: { enabled: true, limit: 250 },
};

const setup = ({
    onSave = jest.fn().mockResolvedValue(undefined),
    canChargeAutoTopUp = true,
    initialSettings = settings,
}: {
    onSave?: jest.Mock;
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
            spent={12.5}
            canChargeAutoTopUp={canChargeAutoTopUp}
            onSave={onSave}
        />
    );
    return { onSave, onClose };
};

const amountInput = () => screen.getByLabelText('Top up by');
const limitInput = () => screen.getByLabelText('Limit', { exact: true });
const autoTopUpToggle = () => screen.getByLabelText(/^Automatic top-up/);
const saveButton = () => screen.getByText('Save settings').closest('button')!;
const rangeError = 'Top-up amount must be a whole amount between $25.00 and $100.00';

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

    it('shows the spending limit only while automatic top-up is on', () => {
        setup({ initialSettings: { ...settings, autoTopUp: { ...settings.autoTopUp, enabled: false } } });

        expect(screen.queryByText('Monthly spending limit')).not.toBeInTheDocument();

        fireEvent.click(autoTopUpToggle());

        expect(screen.getByText('Monthly spending limit')).toBeInTheDocument();
        expect(screen.getByText('$12.50 of $250.00 bought automatically this month')).toBeInTheDocument();
    });

    it.each(['49', '50.5', ''])('rejects a spending limit of %p for a $50 top-up', (limit) => {
        setup();

        fireEvent.change(limitInput(), { target: { value: limit } });

        expect(screen.getByText('Limit must be a whole amount of at least $50.00')).toBeInTheDocument();
        expect(saveButton()).toBeDisabled();
    });

    it('accepts a spending limit equal to the top-up amount', () => {
        setup();

        fireEvent.change(limitInput(), { target: { value: '50' } });

        expect(screen.queryByText(/^Limit must be a whole amount/)).not.toBeInTheDocument();
        expect(saveButton()).toBeEnabled();
    });

    it('saves the top-up and its spending limit together, then closes', async () => {
        let resolveSave: () => void = () => {};
        const onSave = jest.fn(() => new Promise<void>((resolve) => (resolveSave = resolve)));
        const { onClose } = setup({ onSave });

        fireEvent.change(limitInput(), { target: { value: '300' } });
        fireEvent.click(saveButton());

        expect(onSave).toHaveBeenCalledWith({
            autoTopUp: { enabled: true, amount: 50, threshold: 20 },
            spendingLimit: { enabled: true, limit: 300 },
        });
        expect(saveButton()).toBeDisabled();
        expect(onClose).not.toHaveBeenCalled();

        resolveSave();

        await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    });

    it('closes without saving a top-up that stays off', () => {
        const { onSave, onClose } = setup({
            initialSettings: { ...settings, autoTopUp: { ...settings.autoTopUp, enabled: false, amount: 60 } },
        });

        fireEvent.click(autoTopUpToggle());
        fireEvent.change(amountInput(), { target: { value: '80' } });
        fireEvent.click(autoTopUpToggle());
        fireEvent.click(saveButton());

        expect(onSave).not.toHaveBeenCalled();
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('compares the edits with the settings it was opened with', () => {
        const onSave = jest.fn().mockResolvedValue(undefined);
        const props = { open: true, onClose: jest.fn(), onExit: jest.fn(), currency: 'USD' as const, spent: 0 };
        const { rerender } = render(
            <ApiBalanceSettingsModal {...props} settings={settings} canChargeAutoTopUp onSave={onSave} />
        );
        rerender(
            <ApiBalanceSettingsModal
                {...props}
                settings={{ ...settings, autoTopUp: { ...settings.autoTopUp, amount: 90 } }}
                canChargeAutoTopUp
                onSave={onSave}
            />
        );

        fireEvent.click(saveButton());

        expect(onSave).not.toHaveBeenCalled();
    });

    it.each([
        [500, 0, 'Automatic top-up could not be saved. Please try again.'],
        [422, 2001, 'Automatic top-up could not be saved. Please try again.'],
        [422, 2011, "Only the organization's primary admin can change these settings."],
        [403, 9100, "Only the organization's primary admin can change these settings."],
    ])('stays open after the save failed with %p/%p', async (status, Code, message) => {
        const error = { status, data: { Code, Error: 'From the API' } };
        const { onClose } = setup({ onSave: jest.fn().mockRejectedValue(error) });

        fireEvent.change(amountInput(), { target: { value: '75' } });
        fireEvent.click(saveButton());

        expect(await screen.findByText(message)).toBeInTheDocument();
        expect(screen.queryByText('From the API')).not.toBeInTheDocument();
        expect(onClose).not.toHaveBeenCalled();
        expect(saveButton()).toBeEnabled();
    });

    it('clears the previous error when the save is retried', async () => {
        const error = { status: 500, data: { Code: 0, Error: 'From the API' } };
        const onSave = jest
            .fn()
            .mockRejectedValueOnce(error)
            .mockReturnValueOnce(new Promise(() => {}));
        setup({ onSave });
        const message = 'Automatic top-up could not be saved. Please try again.';

        fireEvent.change(amountInput(), { target: { value: '75' } });
        fireEvent.click(saveButton());
        expect(await screen.findByText(message)).toBeInTheDocument();

        fireEvent.click(saveButton());

        await waitFor(() => expect(screen.queryByText(message)).not.toBeInTheDocument());
    });

    it('warns when an enabled top-up cannot be charged', () => {
        setup({
            canChargeAutoTopUp: false,
            initialSettings: { ...settings, autoTopUp: { ...settings.autoTopUp, enabled: false } },
        });
        const warning =
            'Automatic top-up needs a card or PayPal set as default payment method with automatic payments on.';

        expect(screen.queryByText(warning)).not.toBeInTheDocument();

        fireEvent.click(autoTopUpToggle());

        expect(screen.getByText(warning)).toBeInTheDocument();
    });

    it('does not warn when the top-up can be charged', () => {
        setup();

        expect(screen.queryByText(/Automatic top-up needs/)).not.toBeInTheDocument();
    });
});
