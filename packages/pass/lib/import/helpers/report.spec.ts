import { createTestItem, createTestLogin } from '../../../utils/tests/fixtures/items';
import { getSampleLoginPreview } from './report';

describe('getSampleLoginPreview', () => {
    test('should return `null` when there are no items', () => {
        expect(getSampleLoginPreview([])).toBeNull();
    });

    test('should return `null` when no item is a login', () => {
        expect(getSampleLoginPreview([createTestItem('note'), createTestItem('alias')])).toBeNull();
    });

    test('should preview the first login item', () => {
        const note = createTestItem('note');
        const first = createTestLogin({
            shareId: 'share-1',
            itemId: 'item-1',
            name: 'Example',
            email: 'user@example.com',
            urls: ['https://example.com'],
        });
        const second = createTestLogin({ shareId: 'share-1', itemId: 'item-2', name: 'Other' });

        expect(getSampleLoginPreview([note, first, second])).toStrictEqual({
            itemId: 'item-1',
            shareId: 'share-1',
            name: 'Example',
            userIdentifier: 'user@example.com',
            url: 'https://example.com',
        });
    });
});
