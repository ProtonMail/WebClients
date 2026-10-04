import { fireEvent, render, screen } from '@testing-library/react';

import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import AddBYOEModal from './AddBYOEModal';

jest.mock('@proton/unleash/useFlag', () => ({
    __esModule: true,
    useFlag: jest.fn(() => true),
}));

describe('AddBYOEModal', () => {
    beforeEach(() => {
        jest.mocked(useFlag).mockReturnValue(true);
    });

    it('should hide the import period and not send it when the feature flag is off', () => {
        jest.mocked(useFlag).mockReturnValue(false);
        const onSubmit = jest.fn();
        render(<AddBYOEModal onSubmit={onSubmit} isLoading={false} open />);

        expect(screen.queryByTestId('AddBYOEModal:importPeriod')).toBeNull();
        fireEvent.click(screen.getByText('Connect your email'));
        expect(onSubmit).toHaveBeenCalledWith(true, undefined);
    });

    it('should show the import checkbox ticked by default', () => {
        render(<AddBYOEModal onSubmit={noop} isLoading={false} open />);

        screen.getByText(`Bring your Gmail into ${MAIL_APP_NAME}`);
        screen.getByText('Import your emails');
        const checkbox = screen.getByTestId('AddBYOEModal:importCheckbox') as HTMLInputElement;
        expect(checkbox.checked).toBe(true);
    });

    it('should show the import checkbox unticked when converting a forwarding to a BYOE', () => {
        render(<AddBYOEModal onSubmit={noop} isLoading={false} open expectedEmailAddress="test@gmail.com" />);

        screen.getByText(`Bring your Gmail into ${MAIL_APP_NAME}`);
        const checkbox = screen.getByTestId('AddBYOEModal:importCheckbox') as HTMLInputElement;
        expect(checkbox.checked).toBe(false);
    });

    it('should disable the import period when the import checkbox is unticked', () => {
        render(<AddBYOEModal onSubmit={noop} isLoading={false} open />);

        screen.getByText('Import all messages');
        expect(screen.getByTestId('AddBYOEModal:importPeriod')).not.toBeDisabled();

        fireEvent.click(screen.getByTestId('AddBYOEModal:importCheckbox'));
        expect(screen.getByTestId('AddBYOEModal:importPeriod')).toBeDisabled();
    });
});
