import { hasReachedFolderLimit, hasReachedLabelLimit } from '@proton/shared/lib/helpers/folder';
import { Label, UserModel } from '@proton/shared/lib/interfaces';
import { Folder } from '@proton/shared/lib/interfaces/Folder';

describe('folders helpers', () => {
    describe('hasReachedFolderLimit', () => {
        it('should have reached folders limit on free user', () => {
            const user = { hasPaidMail: false } as UserModel;
            const folders: Folder[] = [
                { ID: 'folder1' } as Folder,
                { ID: 'folder2' } as Folder,
                { ID: 'folder3' } as Folder,
            ];

            expect(hasReachedFolderLimit(user, folders)).toBeTruthy();
        });

        it('should not have reached folders limit on free user when no filters', () => {
            const user = { hasPaidMail: false } as UserModel;
            const folders: Folder[] = [];

            expect(hasReachedFolderLimit(user, folders)).toBeFalsy();
        });

        it('should not have reached folders limit on paid user', () => {
            const user = { hasPaidMail: true } as UserModel;
            const folders: Folder[] = [
                { ID: 'folder1' } as Folder,
                { ID: 'folder2' } as Folder,
                { ID: 'folder3' } as Folder,
                { ID: 'folder4' } as Folder,
            ];

            expect(hasReachedFolderLimit(user, folders)).toBeFalsy();
        });
    });

    describe('hasReachedLabelsLimit', () => {
        it('should have reached labels limit on free user', () => {
            const user = { hasPaidMail: false } as UserModel;
            const labels: Label[] = [{ ID: 'label1' } as Label, { ID: 'label2' } as Label, { ID: 'label3' } as Label];

            expect(hasReachedLabelLimit(user, labels)).toBeTruthy();
        });

        it('should not have reached labels limit on free user when no filters', () => {
            const user = { hasPaidMail: false } as UserModel;
            const labels: Label[] = [];

            expect(hasReachedLabelLimit(user, labels)).toBeFalsy();
        });

        it('should not have reached labels limit on paid user', () => {
            const user = { hasPaidMail: true } as UserModel;
            const labels: Label[] = [
                { ID: 'label1' } as Label,
                { ID: 'label2' } as Label,
                { ID: 'label3' } as Label,
                { ID: 'label4' } as Label,
            ];

            expect(hasReachedLabelLimit(user, labels)).toBeFalsy();
        });
    });
});
