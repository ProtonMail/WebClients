import { ClipboardTTL, DEFAULT_CLIPBOARD_TTL } from '../../lib/clipboard/types';
import { selectItem } from '../../store/selectors/items';
import { selectClipboardTTL } from '../../store/selectors/settings';
import { selectVisibleVaults } from '../../store/selectors/shares';
import { createTestItem } from './fixtures/items';
import { createTestShare } from './fixtures/shares';
import { createTestState } from './state';

describe('createTestState', () => {
    test('seeds shares and items as selectable state', () => {
        const share = createTestShare({ shareId: 'share-1', vaultId: 'vault-1' });
        const item = createTestItem('login', { shareId: 'share-1', itemId: 'item-1' });
        const state = createTestState({ shares: [share], items: [item] });

        expect(selectVisibleVaults(state).map(({ shareId }) => shareId)).toEqual(['share-1']);
        expect(selectItem('share-1', 'item-1')(state)).toEqual(item);
    });

    test('defaults clipboard TTL so copying skips the settings modal', () => {
        expect(selectClipboardTTL(createTestState())).toEqual(DEFAULT_CLIPBOARD_TTL);
    });

    test('settings overrides take precedence', () => {
        const state = createTestState({ settings: { clipboard: { timeoutMs: ClipboardTTL.TTL_NEVER } } });
        expect(selectClipboardTTL(state)).toEqual(ClipboardTTL.TTL_NEVER);
    });
});
