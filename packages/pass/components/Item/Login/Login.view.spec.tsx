import noop from '@proton/utils/noop';

import { itemBuilder } from '../../../lib/items/item.builder';
import { ShareRole } from '../../../types';
import { createTestItem } from '../../../utils/tests/fixtures/items';
import { createTestShare } from '../../../utils/tests/fixtures/shares';
import { render } from '../../../utils/tests/render';
import { LoginView } from './Login.view';

const itemActions = {
    handleCloneClick: noop,
    handleDeleteClick: noop,
    handleDismissClick: noop,
    handleEditClick: noop,
    handleHistoryClick: noop,
    handleLeaveItemClick: noop,
    handleManageClick: noop,
    handleMoveToTrashClick: noop,
    handleMoveToVaultClick: noop,
    handlePinClick: noop,
    handleRestoreClick: noop,
    handleRetryClick: noop,
    handleSecureLinkClick: noop,
    handleShareItemClick: noop,
    handleToggleFlagsClick: noop,
};

describe('Login.view', () => {
    const mockShare = createTestShare({ shareRoleId: ShareRole.MANAGER, owner: true, canAutofill: true });

    test('Happy path', async () => {
        const itemEmail = 'user@example.com';
        const loginData = itemBuilder('login');
        loginData.get('content').set('itemEmail', itemEmail);

        const login = {
            ...createTestItem('login'),
            data: loginData.data,
            optimistic: false,
            failed: false,
        };

        const { getByText } = render(<LoginView revision={login} share={mockShare} {...itemActions} />);
        expect(getByText(itemEmail)).toBeDefined();
    });
});
