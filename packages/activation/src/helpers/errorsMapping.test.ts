import { Label } from '@proton/shared/lib/interfaces';
import { Folder } from '@proton/shared/lib/interfaces/Folder';

import MailImportFoldersParser from './MailImportFoldersParser/MailImportFoldersParser';
import { getApiFoldersTestHelper } from './MailImportFoldersParser/MailImportFoldersParser.test';
import { isNameAlreadyUsed, isNameEmpty, isNameReserved, isNameTooLong } from './errorsMapping';

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
        describe('Is folder mapping', () => {
            const isLabelMapping = false;
            it('Should return false if the name not present in collection', () => {
                const collection = new MailImportFoldersParser(
                    getApiFoldersTestHelper(['path1', 'path2', 'path3']),
                    isLabelMapping
                ).folders;
                const item = collection[0];

                const res = isNameAlreadyUsed(item, collection, [], [], isLabelMapping);
                expect(res).toBe(false);
            });

            it('Should return false if a parent has same name as the child', () => {
                const collection = new MailImportFoldersParser(
                    getApiFoldersTestHelper(['marco', 'marco/marco']),
                    isLabelMapping
                ).folders;
                const item = collection[0];

                const res = isNameAlreadyUsed(item, collection, [], [], isLabelMapping);
                expect(res).toBe(false);
            });

            it('Should return false if name not present in array', () => {
                const collection = new MailImportFoldersParser(
                    getApiFoldersTestHelper(['path1', 'path2']),
                    isLabelMapping
                ).folders;
                const item = new MailImportFoldersParser(getApiFoldersTestHelper(['path3']), isLabelMapping).folders[0];
                const res = isNameAlreadyUsed(item, collection, [], [], isLabelMapping);
                expect(res).toBe(false);
            });

            it('Should return false if name not present in array', () => {
                const item = new MailImportFoldersParser(getApiFoldersTestHelper(['path3']), isLabelMapping).folders[0];
                const collection = new MailImportFoldersParser(
                    getApiFoldersTestHelper(['path1', 'path2']),
                    isLabelMapping
                ).folders;
                const res = isNameAlreadyUsed(item, collection, [], [], isLabelMapping);
                expect(res).toBe(false);
            });

            it('Should return true if name present in array', () => {
                const item = new MailImportFoldersParser(getApiFoldersTestHelper(['path3']), isLabelMapping).folders[0];
                // @ts-expect-error need to override the ID because test will think it's the same item
                item.id = 'anothername';
                const collection = new MailImportFoldersParser(
                    getApiFoldersTestHelper(['path1', 'path2', 'path3']),
                    isLabelMapping
                ).folders;

                const res = isNameAlreadyUsed(item, collection, [], [], isLabelMapping);
                expect(res).toBe(true);
            });

            it('Should return false if name present in an empty array', () => {
                const item = new MailImportFoldersParser(getApiFoldersTestHelper(['path1']), isLabelMapping).folders[0];
                const collection = new MailImportFoldersParser(getApiFoldersTestHelper([]), isLabelMapping).folders;

                const res = isNameAlreadyUsed(item, collection, [], [], isLabelMapping);
                expect(res).toBe(false);
            });

            it('Should return false if label with similar name exists', () => {
                const item = new MailImportFoldersParser(getApiFoldersTestHelper(['path1']), isLabelMapping).folders[0];
                const collection = new MailImportFoldersParser(getApiFoldersTestHelper([]), isLabelMapping).folders;

                const res = isNameAlreadyUsed(item, collection, [], [], isLabelMapping);
                expect(res).toBe(false);
            });

            it('Should return true if label has same name', () => {
                const item = new MailImportFoldersParser(getApiFoldersTestHelper(['path1']), isLabelMapping).folders[0];

                const res = isNameAlreadyUsed(item, [], [{ Path: 'path1' } as Label], [], isLabelMapping);
                expect(res).toBe(true);
            });

            it('Should return false if folder has same name', () => {
                const item = new MailImportFoldersParser(getApiFoldersTestHelper(['path1']), isLabelMapping).folders[0];

                const res = isNameAlreadyUsed(item, [], [], [{ Path: 'path1' } as Folder], isLabelMapping);
                expect(res).toBe(false);
            });
        });

        describe('Is label mapping', () => {
            const isLabelMapping = true;
            it('Should return false if the name not present in collection', () => {
                const collection = new MailImportFoldersParser(
                    getApiFoldersTestHelper(['path1', 'path2', 'path3']),
                    isLabelMapping
                ).folders;
                const item = collection[0];

                const res = isNameAlreadyUsed(item, collection, [], [], isLabelMapping);
                expect(res).toBe(false);
            });

            it('Should return false if a parent has same name as the child', () => {
                const collection = new MailImportFoldersParser(
                    getApiFoldersTestHelper(['marco', 'marco/marco']),
                    isLabelMapping
                ).folders;
                const item = collection[0];

                const res = isNameAlreadyUsed(item, collection, [], [], isLabelMapping);
                expect(res).toBe(false);
            });

            it('Should return false if name not present in array', () => {
                const collection = new MailImportFoldersParser(
                    getApiFoldersTestHelper(['path1', 'path2']),
                    isLabelMapping
                ).folders;
                const item = new MailImportFoldersParser(getApiFoldersTestHelper(['path3']), isLabelMapping).folders[0];
                const res = isNameAlreadyUsed(item, collection, [], [], isLabelMapping);
                expect(res).toBe(false);
            });

            it('Should return false if name not present in array', () => {
                const item = new MailImportFoldersParser(getApiFoldersTestHelper(['path3']), isLabelMapping).folders[0];
                const collection = new MailImportFoldersParser(
                    getApiFoldersTestHelper(['path1', 'path2']),
                    isLabelMapping
                ).folders;
                const res = isNameAlreadyUsed(item, collection, [], [], isLabelMapping);
                expect(res).toBe(false);
            });

            it('Should return true if name present in array', () => {
                const item = new MailImportFoldersParser(getApiFoldersTestHelper(['path3']), isLabelMapping).folders[0];
                // @ts-expect-error need to override the ID because test will think it's the same item
                item.id = 'anothername';
                const collection = new MailImportFoldersParser(
                    getApiFoldersTestHelper(['path1', 'path2', 'path3']),
                    isLabelMapping
                ).folders;

                const res = isNameAlreadyUsed(item, collection, [], [], isLabelMapping);
                expect(res).toBe(true);
            });

            it('Should return false if name present in an empty array', () => {
                const item = new MailImportFoldersParser(getApiFoldersTestHelper(['path1']), isLabelMapping).folders[0];
                const collection = new MailImportFoldersParser(getApiFoldersTestHelper([]), isLabelMapping).folders;

                const res = isNameAlreadyUsed(item, collection, [], [], isLabelMapping);
                expect(res).toBe(false);
            });

            it('Should return false if label has same name', () => {
                const item = new MailImportFoldersParser(getApiFoldersTestHelper(['path1']), isLabelMapping).folders[0];

                const res = isNameAlreadyUsed(item, [], [{ Path: 'path1' } as Label], [], isLabelMapping);
                expect(res).toBe(false);
            });

            it('Should return true if folder has same name', () => {
                const item = new MailImportFoldersParser(getApiFoldersTestHelper(['path1']), isLabelMapping).folders[0];

                const res = isNameAlreadyUsed(item, [], [], [{ Path: 'path1' } as Folder], isLabelMapping);
                expect(res).toBe(true);
            });
        });

        describe('Spaces checks', () => {
            it('Should return true if name in collection contains a space before', () => {
                const isLabelMapping = false;
                const item = new MailImportFoldersParser(getApiFoldersTestHelper([' path3']), isLabelMapping)
                    .folders[0];
                // @ts-expect-error need to override the ID because test will think it's the same item
                item.id = 'anothername';
                const collection = new MailImportFoldersParser(
                    getApiFoldersTestHelper(['path1', 'path2', 'path3']),
                    isLabelMapping
                ).folders;

                const res = isNameAlreadyUsed(item, collection, [], [], false);
                expect(res).toBe(true);
            });

            it('Should return true if name in item contains a space after', () => {
                const isLabelMapping = false;
                const item = new MailImportFoldersParser(getApiFoldersTestHelper(['path3 ']), isLabelMapping)
                    .folders[0];
                // @ts-expect-error need to override the ID because test will think it's the same item
                item.id = 'anothername';
                const collection = new MailImportFoldersParser(
                    getApiFoldersTestHelper(['path1', 'path2', 'path3']),
                    isLabelMapping
                ).folders;

                const res = isNameAlreadyUsed(item, collection, [], [], false);
                expect(res).toBe(true);
            });

            it('Should return true if name in item contains a space before and after', () => {
                const isLabelMapping = false;
                const item = new MailImportFoldersParser(getApiFoldersTestHelper([' path3 ']), isLabelMapping)
                    .folders[0];
                // @ts-expect-error need to override the ID because test will think it's the same item
                item.id = 'anothername';
                const collection = new MailImportFoldersParser(
                    getApiFoldersTestHelper(['path1', 'path2', 'path3']),
                    isLabelMapping
                ).folders;

                const res = isNameAlreadyUsed(item, collection, [], [], false);
                expect(res).toBe(true);
            });

            it('Should return true if the name present in item contains a space before and after and is capitalized', () => {
                const isLabelMapping = false;
                const item = new MailImportFoldersParser(getApiFoldersTestHelper([' Path3 ']), isLabelMapping)
                    .folders[0];
                // @ts-expect-error need to override the ID because test will think it's the same item
                item.id = 'anothername';
                const collection = new MailImportFoldersParser(
                    getApiFoldersTestHelper(['path1', 'path2', 'path3']),
                    isLabelMapping
                ).folders;

                const res = isNameAlreadyUsed(item, collection, [], [], false);
                expect(res).toBe(true);
            });

            it('Should return true if the name present in item contains two space before', () => {
                const isLabelMapping = false;
                const item = new MailImportFoldersParser(getApiFoldersTestHelper(['  Path3']), isLabelMapping)
                    .folders[0];
                // @ts-expect-error need to override the ID because test will think it's the same item
                item.id = 'anothername';
                const collection = new MailImportFoldersParser(
                    getApiFoldersTestHelper(['path1', 'path2', 'path3']),
                    isLabelMapping
                ).folders;

                const res = isNameAlreadyUsed(item, collection, [], [], false);
                expect(res).toBe(true);
            });

            it('Should return true if the name in collection contains a space before and after', () => {
                const isLabelMapping = false;
                const item = new MailImportFoldersParser(getApiFoldersTestHelper(['path3']), isLabelMapping).folders[0];
                // @ts-expect-error need to override the ID because test will think it's the same item
                item.id = 'anothername';
                const collection = new MailImportFoldersParser(
                    getApiFoldersTestHelper(['path1', 'path2', ' path3 ']),
                    isLabelMapping
                ).folders;

                const res = isNameAlreadyUsed(item, collection, [], [], false);
                expect(res).toBe(true);
            });

            it('Should return true if the name passed in collection contains a space before and after and is capitalized', () => {
                const isLabelMapping = false;
                const item = new MailImportFoldersParser(getApiFoldersTestHelper(['path3']), isLabelMapping).folders[0];
                // @ts-expect-error need to override the ID because test will think it's the same item
                item.id = 'anothername';
                const collection = new MailImportFoldersParser(
                    getApiFoldersTestHelper(['path1', 'path2', ' Path3 ']),
                    isLabelMapping
                ).folders;

                const res = isNameAlreadyUsed(item, collection, [], [], false);
                expect(res).toBe(true);
            });
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
});
