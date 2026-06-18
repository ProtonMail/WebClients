import { render, screen } from '@testing-library/react';

import AddBYOEModal from '@proton/activation/src/components/Modals/AddBYOEModal/AddBYOEModal';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

describe('AddBYOEModal', () => {
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
});
