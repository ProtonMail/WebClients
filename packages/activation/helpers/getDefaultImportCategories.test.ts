import { MailImportDestinationFolder, MailImportGmailCategories } from '../interface';
import { MailImportFolder } from './MailImportFoldersParser/MailImportFoldersParser';
import { getDefaultImportCategoriesDestination } from './getDefaultImportCategories';

const dummyEmail: MailImportFolder = {
    id: 'id',
    checked: true,
    color: 'test color',
    isSystemFolderChild: false,
    folderChildIDS: [''],
    protonPath: ['path'],
    providerPath: ['providerPath'],
    separator: '/',
    size: 0,
    category: undefined,
    folderParentID: '',
    systemFolder: MailImportDestinationFolder.ARCHIVE,
};

const dummyEmailWithCategory: MailImportFolder = {
    id: 'id',
    checked: true,
    color: 'test color',
    isSystemFolderChild: false,
    folderChildIDS: [''],
    protonPath: ['path'],
    providerPath: ['providerPath'],
    separator: '/',
    size: 0,
    category: MailImportGmailCategories.SOCIAL,
    folderParentID: '',
    systemFolder: MailImportDestinationFolder.ARCHIVE,
};

const dummyEmailWithCategoryAndSystem: MailImportFolder = {
    id: 'id',
    checked: true,
    color: 'test color',
    isSystemFolderChild: false,
    folderChildIDS: [''],
    protonPath: ['path'],
    providerPath: ['providerPath'],
    separator: '/',
    size: 0,
    category: MailImportGmailCategories.SOCIAL,
    folderParentID: '',
    systemFolder: undefined,
};

describe('get default import category', () => {
    it('Should return inbox if no category folder', () => {
        const mapping: MailImportFolder[] = [dummyEmail, dummyEmail];
        const defaultDestination = getDefaultImportCategoriesDestination(mapping);
        expect(defaultDestination).toStrictEqual(MailImportDestinationFolder.INBOX);
    });

    it('Should return inbox if category but no system folder', () => {
        const mapping: MailImportFolder[] = [dummyEmail, dummyEmail, dummyEmailWithCategory];
        const defaultDestination = getDefaultImportCategoriesDestination(mapping);
        expect(defaultDestination).toStrictEqual(dummyEmailWithCategory.systemFolder);
    });

    it('Should return system folder if category', () => {
        const mapping: MailImportFolder[] = [dummyEmail, dummyEmail, dummyEmailWithCategoryAndSystem];
        const defaultDestination = getDefaultImportCategoriesDestination(mapping);
        expect(defaultDestination).toStrictEqual(MailImportDestinationFolder.INBOX);
    });
});
