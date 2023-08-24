import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { Label } from '@proton/shared/lib/interfaces/Label';

import MailImportFoldersParser, { MailImportFolder } from './MailImportFoldersParser/MailImportFoldersParser';
import { getApiFoldersTestHelper } from './MailImportFoldersParser/MailImportFoldersParser.test';
import {
    isNameAlreadyUsed,
    isNameEmpty,
    isNameReserved,
    isNameTooLong,
    mappingHasNameTooLong,
    mappingHasReservedNames,
    mappingHasUnavailableNames,
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
        it('Should return false if the name not present in collection', () => {
            const isLabelMapping = false;
            const collection = new MailImportFoldersParser(
                getApiFoldersTestHelper(['path1', 'path2', 'path3']),
                isLabelMapping
            ).folders;
            const item = collection[0];

            const res = isNameAlreadyUsed(item, collection, [], [], false);
            expect(res).toBe(false);
        });

        it('Should return false if a parent has same name as the child', () => {
            const isLabelMapping = false;
            const collection = new MailImportFoldersParser(
                getApiFoldersTestHelper(['marco', 'marco/marco']),
                isLabelMapping
            ).folders;
            const item = collection[0];

            const res = isNameAlreadyUsed(item, collection, [], [], false);
            expect(res).toBe(false);
        });

        it('Should return false if name not present in array', () => {
            const isLabelMapping = false;
            const collection = new MailImportFoldersParser(getApiFoldersTestHelper(['path1', 'path2']), isLabelMapping)
                .folders;
            const item = new MailImportFoldersParser(getApiFoldersTestHelper(['path3']), isLabelMapping).folders[0];
            const res = isNameAlreadyUsed(item, collection, [], [], false);
            expect(res).toBe(false);
        });

        it('Should return false if name not present in array', () => {
            const isLabelMapping = false;
            const item = new MailImportFoldersParser(getApiFoldersTestHelper(['path3']), isLabelMapping).folders[0];
            const collection = new MailImportFoldersParser(getApiFoldersTestHelper(['path1', 'path2']), isLabelMapping)
                .folders;
            const res = isNameAlreadyUsed(item, collection, [], [], false);
            expect(res).toBe(false);
        });

        it('Should return true if name present in array', () => {
            const isLabelMapping = false;
            const item = new MailImportFoldersParser(getApiFoldersTestHelper(['path3']), isLabelMapping).folders[0];
            // @ts-expect-error need to override the ID because test will think it's the same item
            item.id = 'anothername';
            const collection = new MailImportFoldersParser(
                getApiFoldersTestHelper(['path1', 'path2', 'path3']),
                isLabelMapping
            ).folders;

            const res = isNameAlreadyUsed(item, collection, [], [], false);
            expect(res).toBe(true);
        });

        it('Should return false if name present in an empty array', () => {
            const isLabelMapping = false;
            const item = new MailImportFoldersParser(getApiFoldersTestHelper(['path1']), isLabelMapping).folders[0];
            const collection = new MailImportFoldersParser(getApiFoldersTestHelper([]), isLabelMapping).folders;

            const res = isNameAlreadyUsed(item, collection, [], [], false);
            expect(res).toBe(false);
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

    describe('mappingHasUnavailableNames', () => {
        it('Should return false if the mapping has no duplicate folder names', () => {
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

            const collection: Folder[] = [
                {
                    ID: 'folder1',
                    Name: 'folder1',
                    Color: 'folder1',
                    Path: 'folder1',
                    Expanded: 1,
                    Type: 1,
                    Order: 1,
                    ParentID: 'folder1',
                    Notify: 1,
                },
                {
                    ID: 'folder2',
                    Name: 'folder2',
                    Color: 'folder2',
                    Path: 'folder2',
                    Expanded: 2,
                    Type: 2,
                    Order: 2,
                    ParentID: 'folder2',
                    Notify: 2,
                },
            ];

            const res = mappingHasUnavailableNames(mapping, collection, false);
            expect(res).toBe(false);
        });
        it('Should return false if the mapping has no duplicate label names', () => {
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

            const collection: Label[] = [
                {
                    ID: 'label1',
                    Name: 'label1',
                    Color: 'label1',
                    ContextTime: 1,
                    Type: 1,
                    Order: 1,
                    Path: 'label1',
                    Display: 1,
                },
                {
                    ID: 'label2',
                    Name: 'label2',
                    Color: 'label2',
                    ContextTime: 2,
                    Type: 2,
                    Order: 2,
                    Path: 'label2',
                    Display: 2,
                },
            ];

            const res = mappingHasUnavailableNames(mapping, collection, true);
            expect(res).toBe(false);
        });
        it('Should return true if the mapping has duplicate folder names', () => {
            const mapping = [
                {
                    protonPath: ['folder1'],
                    separator: '/',
                } as MailImportFolder,
                {
                    protonPath: ['folder2'],
                    separator: '/',
                } as MailImportFolder,
            ];

            const collection: Folder[] = [
                {
                    ID: 'folder1',
                    Name: 'folder1',
                    Color: 'folder1',
                    Path: 'folder1',
                    Expanded: 1,
                    Type: 1,
                    Order: 1,
                    ParentID: 'folder1',
                    Notify: 1,
                },
                {
                    ID: 'folder2',
                    Name: 'folder2',
                    Color: 'folder2',
                    Path: 'folder2',
                    Expanded: 2,
                    Type: 2,
                    Order: 2,
                    ParentID: 'folder2',
                    Notify: 2,
                },
            ];

            const res = mappingHasUnavailableNames(mapping, collection, false);
            expect(res).toBe(true);
        });
        it('Should return false if the mapping has duplicate label names', () => {
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

            const collection: Label[] = [
                {
                    ID: 'label1',
                    Name: 'label1',
                    Color: 'label1',
                    ContextTime: 1,
                    Type: 1,
                    Order: 1,
                    Path: 'label1',
                    Display: 1,
                },
                {
                    ID: 'label2',
                    Name: 'label2',
                    Color: 'label2',
                    ContextTime: 2,
                    Type: 2,
                    Order: 2,
                    Path: 'label2',
                    Display: 2,
                },
            ];

            const res = mappingHasUnavailableNames(mapping, collection, true);
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
