import { GMAIL_CATEGORIES } from '../constants';
import { MailImportDestinationFolder } from '../interface';
import { MailImportFolder } from './MailImportFoldersParser/MailImportFoldersParser';

export const getDefaultImportCategoriesDestination = (foldersMapping: MailImportFolder[]) => {
    const firstMappingItemWithCategory = foldersMapping.find(
        (item) => item.category && GMAIL_CATEGORIES.includes(item.category)
    );
    return firstMappingItemWithCategory?.systemFolder || MailImportDestinationFolder.INBOX;
};
