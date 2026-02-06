import { LoginView } from '@proton/pass/components/Item/Login/Login.view';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import { createTestItem } from '@proton/pass/lib/items/item.test.utils';
import type { ShareItem } from '@proton/pass/store/reducers';
import { ShareRole, ShareType } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { render } from '@proton/pass/utils/tests/render';
import noop from '@proton/utils/noop';

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
