import { render, screen } from '@testing-library/react';

import AddBYOEModal from '@proton/activation/src/components/Modals/AddBYOEModal/AddBYOEModal';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

describe('AddBYOEModal', () => {
    it('should show the import checkbox', () => {
        render(<AddBYOEModal onSubmit={noop} isLoading={false} source="existingUser" open />);

        screen.getByText(`Connect to Gmail, stay in ${BRAND_NAME}`);
        screen.queryByTestId('AddBYOEModal:importCheckbox');
    });

    it('should not show the import checkbox during signup', () => {
        render(<AddBYOEModal onSubmit={noop} isLoading={false} source="signup" open />);

        screen.getByText(`Connect to Gmail, stay in ${BRAND_NAME}`);
        expect(screen.queryByTestId('AddBYOEModal:importCheckbox')).toBeNull();
    });

    it('should not show the import checkbox when converting a forwarding to a BYOE', () => {
        render(
            <AddBYOEModal
                onSubmit={noop}
                isLoading={false}
                source="existingUser"
                open
                expectedEmailAddress="test@gmail.com"
            />
        );

        screen.getByText(`Connect to Gmail, stay in ${BRAND_NAME}`);
        expect(screen.queryByTestId('AddBYOEModal:importCheckbox')).toBeNull();
    });
});
