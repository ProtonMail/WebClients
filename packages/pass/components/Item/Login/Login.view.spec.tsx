import noop from '@proton/utils/noop';

import { itemBuilder } from '../../../lib/items/item.builder';
import { createTestItem } from '../../../lib/items/item.test.utils';
import type { ShareItem } from '../../../store/reducers';
import { ShareRole, ShareType } from '../../../types';
import { uniqueId } from '../../../utils/string/unique-id';
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

jest.mock('webextension-polyfill', () => ({}));
jest.mock('imask/esm/masked/range', () => ({}));

describe('Login.view', () => {
    const mockShareId = uniqueId();

    const mockShare: ShareItem = {
        addressId: uniqueId(),
        content: '',
        createTime: 0,
        eventId: uniqueId(),
        newUserInvitesReady: 0,
        owner: true,
        shared: false,
        shareId: mockShareId,
        shareRoleId: ShareRole.MANAGER,
        targetId: uniqueId(),
        targetMaxMembers: 1,
        targetMembers: 1,
        targetType: ShareType.Vault,
        vaultId: uniqueId(),
        canAutofill: true,
        flags: 0,
        permission: 0,
        groupId: null,
    };

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
