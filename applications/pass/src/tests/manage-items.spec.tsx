import { DEFAULT_CLIPBOARD_TTL } from '@proton/pass/lib/clipboard/types';
import { createItem, editItem, restoreItems, trashItems } from '@proton/pass/lib/items/item.requests';
import {
    copyField,
    createLogin,
    editLogin,
    itemList,
    openItem,
    openTrash,
    runItemAction,
    selectVault,
    sidebar,
} from '@proton/pass/utils/tests/actions';
import { createTestLogin } from '@proton/pass/utils/tests/fixtures/items';
import { createTestVault } from '@proton/pass/utils/tests/fixtures/shares';

import { renderPrivateApp } from './render';

jest.mock('@proton/pass/lib/items/item.requests');

describe('Manage items', () => {
    const personal = createTestVault({ name: 'Personal' });
    const bank = createTestLogin({
        shareId: personal.shareId,
        name: 'Bank',
        email: 'user@example.com',
        password: 'old-pass',
    });

    const state = { shares: [personal], items: [bank] };

    afterEach(() => jest.clearAllMocks());

    test('create a login', async () => {
        const { writeToClipboard } = renderPrivateApp({ state });

        await createLogin({ name: 'Github', email: 'dev@example.com', password: 's3cret-pass' });

        expect(createItem).toHaveBeenCalledWith(expect.objectContaining({ type: 'login', shareId: personal.shareId }));
        expect(itemList().getByText('Github')).toBeInTheDocument();

        await copyField('Password');
        expect(writeToClipboard).toHaveBeenCalledWith('s3cret-pass', DEFAULT_CLIPBOARD_TTL, false);
    });

    test('edit the password of a login', async () => {
        const { writeToClipboard } = renderPrivateApp({ state });

        await openItem('Bank');
        await editLogin({ password: 'new-pass' });

        expect(editItem).toHaveBeenCalledWith(
            expect.objectContaining({ shareId: personal.shareId, itemId: bank.itemId }),
            bank.revision,
            null
        );

        await copyField('Password');
        expect(writeToClipboard).toHaveBeenCalledWith('new-pass', DEFAULT_CLIPBOARD_TTL, false);
    });

    test('trash an item and restore it', async () => {
        renderPrivateApp({ state });

        await openItem('Bank');
        await runItemAction('Move to Trash');

        expect(trashItems).toHaveBeenCalledWith([expect.objectContaining({ itemId: bank.itemId })]);
        expect(itemList().queryByText('Bank')).not.toBeInTheDocument();
        expect(sidebar().getByRole('button', { name: /^Trash\s*1 item/ })).toBeInTheDocument();

        await openTrash();
        await openItem('Bank');
        await runItemAction('Restore item');

        expect(restoreItems).toHaveBeenCalledWith([expect.objectContaining({ itemId: bank.itemId })]);

        await selectVault('Personal');
        expect(await itemList().findByText('Bank')).toBeInTheDocument();
    });
});
