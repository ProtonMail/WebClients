import noop from '@proton/utils/noop';

import { itemBuilder } from '../../../lib/items/item.builder';
import { PassFeature } from '../../../types/api/features';
import { ShareFlags, ShareRole } from '../../../types/data/shares';
import { createTestItem, createTestLogin } from '../../../utils/tests/fixtures/items';
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

    test('hides the reveal control and shows the hint when the share hides sensitive content', () => {
        const shareId = 'hidden-share';
        const login = {
            ...createTestLogin({ shareId, name: 'Test', password: 'hunter2' }),
            optimistic: false,
            failed: false,
        };
        const hiddenShare = createTestShare({
            shareId,
            shareRoleId: ShareRole.READ,
            flags: ShareFlags.HIDE_SENSITIVE_CONTENT,
        });

        const { getByText, queryByTitle } = render(
            <LoginView revision={login} share={hiddenShare} {...itemActions} />,
            {
                state: {
                    shares: [hiddenShare],
                    features: { [PassFeature.Pass__V1_44__ShareWithHiddenPassword]: true },
                },
            }
        );

        expect(queryByTitle('Show')).toBeNull();
        expect(getByText('Password hidden. You can still autofill it.')).toBeDefined();
    });

    test('keeps the password revealable when the feature flag is off, even if the share hides sensitive content', () => {
        const shareId = 'hidden-share-flag-off';
        const login = {
            ...createTestLogin({ shareId, name: 'Test', password: 'hunter2' }),
            optimistic: false,
            failed: false,
        };
        const hiddenShare = createTestShare({
            shareId,
            shareRoleId: ShareRole.READ,
            flags: ShareFlags.HIDE_SENSITIVE_CONTENT,
        });

        const { getByTitle, queryByText } = render(
            <LoginView revision={login} share={hiddenShare} {...itemActions} />,
            {
                state: { shares: [hiddenShare] },
            }
        );

        expect(getByTitle('Show')).toBeDefined();
        expect(queryByText('Password hidden. You can still autofill it.')).toBeNull();
    });
});
