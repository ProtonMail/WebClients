import { IcClock } from '@proton/icons/icons/IcClock';
import { IcEnvelopes } from '@proton/icons/icons/IcEnvelopes';
import { IcFileLines } from '@proton/icons/icons/IcFileLines';
import { IcInbox } from '@proton/icons/icons/IcInbox';
import { IcPaperPlane } from '@proton/icons/icons/IcPaperPlane';

import * as useLocationFieldOptionsModule from './useLocationFieldOptions';

jest.mock('./useLocationFieldOptions', () => ({
    __esModule: true,
    ...jest.requireActual('./useLocationFieldOptions'),
    useLocationFieldOptions: jest.fn(),
}));

const defaultFolders: useLocationFieldOptionsModule.ItemDefaultFolder[] = [
    {
        value: '5',
        text: 'All mail',
        url: '/all-mail',
        icon: IcEnvelopes,
    },
    {
        value: '0',
        text: 'Inbox',
        url: '/inbox',
        icon: IcInbox,
    },
    {
        value: '8',
        text: 'Drafts',
        url: '/drafts',
        icon: IcFileLines,
    },
    {
        value: '12',
        text: 'Scheduled',
        url: '/scheduled',
        icon: IcClock,
    },
    {
        value: '7',
        text: 'Sent',
        url: '/sent',
        icon: IcPaperPlane,
    },
];

const folders: useLocationFieldOptionsModule.ItemCustomFolder[] = [
    {
        text: 'news',
        value: '31dixxUc6tNkpKrI-abC_IQcnG4_K2brHumXkQb_Ib4-FEl5Q3n27dbhIkfBTnYrNonJ8DsySBbUM0RtQdhYhA==',
        className: '',
        folderEntity: {
            ID: '31dixxUc6tNkpKrI-abC_IQcnG4_K2brHumXkQb_Ib4-FEl5Q3n27dbhIkfBTnYrNonJ8DsySBbUM0RtQdhYhA==',
            Name: 'news',
            Path: 'news',
            Type: 3,
            Color: '#54473f',
            Order: 1,
            Notify: 1,
            Expanded: 0,
            subfolders: [],
            LastUnseenMessageEventID: null,
        },
    },
];

const labels: useLocationFieldOptionsModule.ItemLabel[] = [
    { color: 'white', text: 'Highlighted', value: '36', url: '/highlighted' },
];

const all: useLocationFieldOptionsModule.Item[] = [...defaultFolders, ...folders, ...labels];

const grouped: useLocationFieldOptionsModule.ItemsGroup = [
    {
        id: 'DEFAULT_FOLDERS',
        title: 'Default folders',
        items: defaultFolders,
    },
    {
        id: 'CUSTOM_FOLDERS',
        title: 'Custom folders',
        items: folders,
    },
    {
        id: 'LABELS',
        title: 'Labels',
        items: labels,
    },
];

export const mockUseLocationFieldOptions = (
    value?: Partial<ReturnType<typeof useLocationFieldOptionsModule.useLocationFieldOptions>>
) => {
    const mockedUseLocationFieldOptions = jest.mocked(useLocationFieldOptionsModule.useLocationFieldOptions);

    mockedUseLocationFieldOptions.mockReturnValue({
        all,
        grouped,
        findItemByValue: (value: string) => all.find((item) => item.value === value),
        ...value,
    });

    return mockedUseLocationFieldOptions;
};
