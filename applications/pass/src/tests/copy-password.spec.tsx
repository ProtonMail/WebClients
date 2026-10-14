import { DEFAULT_CLIPBOARD_TTL } from '@proton/pass/lib/clipboard/types';
import {
    copyField,
    findNotification,
    itemList,
    itemView,
    openItem,
    selectVault,
} from '@proton/pass/utils/tests/actions';
import { createTestLogin } from '@proton/pass/utils/tests/fixtures/items';
import { createTestVault } from '@proton/pass/utils/tests/fixtures/shares';

import { renderPrivateApp } from './render';

describe('Copy a password', () => {
    const personal = createTestVault({ name: 'Personal' });
    const work = createTestVault({ name: 'Work' });

    const bank = createTestLogin({
        shareId: personal.shareId,
        name: 'Bank',
        email: 'user@example.com',
        password: 'correct-horse-battery',
    });

    const jira = createTestLogin({ shareId: work.shareId, name: 'Jira', username: 'jdoe', password: 'tr0ub4dor' });

    const state = { shares: [personal, work], items: [bank, jira] };

    test('from a login opened in the item list', async () => {
        const { writeToClipboard } = renderPrivateApp({ state });

        await openItem('Bank');
        expect(itemView().getByText('user@example.com')).toBeInTheDocument();
        expect(itemView().queryByText('correct-horse-battery')).not.toBeInTheDocument();

        await copyField('Password');
        expect(writeToClipboard).toHaveBeenCalledWith('correct-horse-battery', DEFAULT_CLIPBOARD_TTL, false);
        expect(await findNotification('Copied to clipboard (expires in 2 minutes)')).toBeInTheDocument();
    });

    test('from a login in a selected vault', async () => {
        const { writeToClipboard } = renderPrivateApp({ state });

        expect(await itemList().findByText('Bank')).toBeInTheDocument();
        expect(itemList().getByText('Jira')).toBeInTheDocument();

        await selectVault('Work');
        expect(itemList().queryByText('Bank')).not.toBeInTheDocument();

        await openItem('Jira');
        await copyField('Password');
        expect(writeToClipboard).toHaveBeenCalledWith('tr0ub4dor', DEFAULT_CLIPBOARD_TTL, false);
    });
});
