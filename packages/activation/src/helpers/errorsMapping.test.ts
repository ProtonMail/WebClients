import { MailImportFolder } from './MailImportFoldersParser/MailImportFoldersParser';
import {
    isNameAlreadyUsed,
    isNameEmpty,
    isNameReserved,
    isNameTooLong,
    mappingHasNameTooLong,
    mappingHasReservedNames,
} from './errorsMapping';

const smallString = '6NLaLHynY3YPM8gGLncefo5PP7n2Db';
const longString =
    'wIfm5MY1a2j7MwYAFNzQapBIXZdBxZaqRGwun6UBFNVimgw38tmmLhn7HewkHhvuNYf5QlC8a2NmfctV42tdfrJJm10okXooWV5f';

describe('Activation errors mapping', () => {
    describe('isNameTooLong', () => {
        it('Should return false if the folder/label name is smaller than limit', () => {
            const res = isNameTooLong(smallString);
            expect(res).toBe(false);
        });
        it('Should return true if the folder/label name is longer than limit', () => {
            const res = isNameTooLong(longString);
            expect(res).toBe(true);
        });
    });

    describe('isNameReserved', () => {
        it('Should return false if the name is not reserved', () => {
            const res = isNameReserved('folder');
            expect(res).toBe(false);
        });
        it('Should return true if the name is reserved and capitalized', () => {
            const res = isNameReserved('Scheduled');
            expect(res).toBe(true);
        });
        it('Should return true if the name is reserved and lowercase', () => {
            const res = isNameReserved('scheduled');
            expect(res).toBe(true);
        });
    });

    describe('isNameAlreadyUsed', () => {
        it('Should return false is name not present in array', () => {
            const paths = ['path1', 'path2'];
            const res = isNameAlreadyUsed('path3', paths);
            expect(res).toBe(false);
        });
        it('Should return true is name present in array', () => {
            const paths = ['path1', 'path2', 'path3'];
            const res = isNameAlreadyUsed('path3', paths);
            expect(res).toBe(true);
        });
        it('Should return false is name present in an empty array', () => {
            const paths: string[] = [];
            const res = isNameAlreadyUsed('path3', paths);
            expect(res).toBe(false);
        });
        it('Should return true if the name present in an array contains a space before', () => {
            const paths = ['path1', 'path2', ' path3'];
            const res = isNameAlreadyUsed('path3', paths);
            expect(res).toBe(true);
        });
        it('Should return true if the name present in an array contains a space after', () => {
            const paths = ['path1', 'path2', 'path3 '];
            const res = isNameAlreadyUsed('path3', paths);
            expect(res).toBe(true);
        });
        it('Should return true if the name present in an array contains a space before and after', () => {
            const paths = ['path1', 'path2', ' path3 '];
            const res = isNameAlreadyUsed('path3', paths);
            expect(res).toBe(true);
        });
        it('Should return true if the name present in an array contains a space before and after and is capitalized', () => {
            const paths = ['path1', 'path2', ' path3 '];
            const res = isNameAlreadyUsed('path3', paths);
            expect(res).toBe(true);
        });
        it('Should return true if the name present in an array contains two space before', () => {
            const paths = ['path1', 'path2', '  path3'];
            const res = isNameAlreadyUsed('path3', paths);
            expect(res).toBe(true);
        });
        it('Should return true if the name passed contains a space before and after', () => {
            const paths = ['path1', 'path2', 'path3'];
            const res = isNameAlreadyUsed(' path3 ', paths);
            expect(res).toBe(true);
        });
        it('Should return true if the name passed contains a space before and after and is capitalized', () => {
            const paths = ['path1', 'path2', 'path3'];
            const res = isNameAlreadyUsed(' Path3 ', paths);
            expect(res).toBe(true);
        });
    });

    describe('isNameEmpty', () => {
        it('Should return false if the name is not empty', () => {
            const res = isNameEmpty('folder');
            expect(res).toBe(false);
        });
        it('Should return true if the name is an empty string', () => {
            const res = isNameEmpty('');
            expect(res).toBe(true);
        });
        it('Should return true if the name is undefined', () => {
            const res = isNameEmpty(undefined);
            expect(res).toBe(true);
        });
    });

    describe('hasMergeWarning', () => {});

    describe('mappingHasNameTooLong', () => {
        it('Should return false if the folders/labels mapping has no issue', () => {
            const mapping = [
                {
                    protonPath: ['parent', 'child'],
                    separator: '/',
                } as MailImportFolder,
                {
                    protonPath: ['parent', 'child2'],
                    separator: '/',
                } as MailImportFolder,
            ];
            const res = mappingHasNameTooLong(mapping);
            expect(res).toBe(false);
        });
        it('Should return true if the folders mapping has a name too long', () => {
            const mapping = [
                {
                    protonPath: ['parent', longString],
                    separator: '/',
                } as MailImportFolder,
                {
                    protonPath: ['parent', 'child2'],
                    separator: '/',
                } as MailImportFolder,
            ];

            const res = mappingHasNameTooLong(mapping);
            expect(res).toBe(true);
        });
    });

    describe('mappingHasReservedNames', () => {
        it('Should return false if no names are reserved in folder mapping', () => {
            const mapping = [
                {
                    protonPath: ['label1'],
                    separator: '/',
                } as MailImportFolder,
                {
                    protonPath: ['label2'],
                    separator: '/',
                } as MailImportFolder,
            ];

            const res = mappingHasReservedNames(mapping);
            expect(res).toBe(false);
        });
        it('Should return false if no names are reserved in label mapping', () => {
            const mapping = [
                {
                    protonPath: ['label1'],
                    separator: '/',
                } as MailImportFolder,
                {
                    protonPath: ['label2'],
                    separator: '/',
                } as MailImportFolder,
            ];

            const res = mappingHasReservedNames(mapping);
            expect(res).toBe(false);
        });
        it('Should return true if a folder name is reserved', () => {
            const mapping = [
                {
                    protonPath: ['Scheduled'],
                    separator: '/',
                } as MailImportFolder,
            ];

            const res = mappingHasReservedNames(mapping);
            expect(res).toBe(true);
        });
        it('Should return true if a lowercase folder name is reserved in folder mapping', () => {
            const mapping = [
                {
                    protonPath: ['scheduled'],
                    separator: '/',
                } as MailImportFolder,
            ];

            const res = mappingHasReservedNames(mapping);
            expect(res).toBe(true);
        });
    });
});
