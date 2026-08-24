import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ChargebeeIdealProcessorHook } from '../react-extensions/useChargebeeIdeal';
import { IdealAccountHolderInput } from './IdealAccountHolderInput';

function renderInput(overrides: Partial<ChargebeeIdealProcessorHook> = {}) {
    const setAccountHolderName = jest.fn();

    render(
        <IdealAccountHolderInput
            chargebeeIdeal={
                {
                    accountHolderName: '',
                    setAccountHolderName,
                    accountHolderNameError: '',
                    touchAccountHolderName: jest.fn(),
                    initializing: false,
                    ...overrides,
                } as ChargebeeIdealProcessorHook
            }
        />
    );

    return { setAccountHolderName, input: screen.getByTestId('ideal-account-holder-name') };
}

describe('IdealAccountHolderInput', () => {
    it('should report every keystroke while the iDEAL iframe is still initializing', async () => {
        const { setAccountHolderName, input } = renderInput({ initializing: true });

        await userEvent.type(input, 'Jan');

        expect(setAccountHolderName).toHaveBeenCalledTimes(3);
    });
});
