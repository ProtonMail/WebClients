import { DriveSectionSortKeys } from '../../interfaces/link';
import { SortSetting } from '../../interfaces/userSettings';

export const fieldMap: { [key in SortSetting]: DriveSectionSortKeys } = {
    [SortSetting.ModifiedAsc]: 'ModifyTime',
    [SortSetting.ModifiedDesc]: 'ModifyTime',
    [SortSetting.NameAsc]: 'Name',
    [SortSetting.NameDesc]: 'Name',
    [SortSetting.SizeAsc]: 'Size',
    [SortSetting.SizeDesc]: 'Size',
    [SortSetting.TypeAsc]: 'MIMEType',
    [SortSetting.TypeDesc]: 'MIMEType',
};
