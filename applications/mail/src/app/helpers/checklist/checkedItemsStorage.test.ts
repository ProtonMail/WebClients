import { deleteCheckedItemsForUser, getSavedCheckedItemsForUser, saveCheckedItemsForUser } from './checkedItemsStorage';

describe('checkedItemsStorage', () => {
    it('Should save checked items', () => {
        saveCheckedItemsForUser('testUserId', ['checkedAccount']);
        const savedItems = getSavedCheckedItemsForUser('testUserId');
        expect(savedItems).toEqual(['checkedAccount']);
    });
    it('Should delete data for user', () => {
        saveCheckedItemsForUser('testUserId', ['checkedAccount']);
        deleteCheckedItemsForUser('testUserId');
        const savedItems = getSavedCheckedItemsForUser('testUserId');
        expect(savedItems).toEqual([]);
    });
    it('Should return empty array if no data', () => {
        const savedItems = getSavedCheckedItemsForUser('testUserId');
        expect(savedItems).toEqual([]);
    });
    it('Should return empty array if no data for user', () => {
        saveCheckedItemsForUser('testUserId', ['checkedAccount']);
        const savedItems = getSavedCheckedItemsForUser('testOtherUserId');
        expect(savedItems).toEqual([]);
    });
    it('Should not override other users data when present in storage', () => {
        saveCheckedItemsForUser('testUserId', ['checkedAccount']);
        saveCheckedItemsForUser('testOtherUserId', ['checkedAccount2, checkedAccount3']);
        const savedItems = getSavedCheckedItemsForUser('testUserId');
        expect(savedItems).toEqual(['checkedAccount']);
    });
    it('Should not delete other user data when deleting data for one user', () => {
        saveCheckedItemsForUser('testUserId', ['checkedAccount']);
        saveCheckedItemsForUser('testOtherUserId', ['checkedAccount2, checkedAccount3']);
        deleteCheckedItemsForUser('testUserId');
        const savedItems = getSavedCheckedItemsForUser('testOtherUserId');
        expect(savedItems).toEqual(['checkedAccount2, checkedAccount3']);
    });
    it('Should return empty array for user not present in storage when multiple other users present', () => {
        saveCheckedItemsForUser('testUserId', ['checkedAccount']);
        saveCheckedItemsForUser('testOtherUserId', ['checkedAccount2, checkedAccount3']);
        const savedItems = getSavedCheckedItemsForUser('testAnotherUserId');
        expect(savedItems).toEqual([]);
    });
});
