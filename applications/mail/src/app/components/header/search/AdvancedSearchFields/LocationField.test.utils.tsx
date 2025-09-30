import * as useLocationFieldOptionsModule from './useLocationFieldOptions';

const defaultFolders: useLocationFieldOptionsModule.ItemDefaultFolder[] = [
    {
        value: '5',
        text: 'All mail',
        url: '/all-mail',
        icon: 'envelopes',
    },
    {
        value: '0',
        text: 'Inbox',
        url: '/inbox',
        icon: 'inbox',
    },
    {
        value: '8',
        text: 'Drafts',
        url: '/drafts',
        icon: 'file-lines',
    },
    {
        value: '12',
        text: 'Scheduled',
        url: '/scheduled',
        icon: 'clock',
    },
    {
        value: '7',
        text: 'Sent',
        url: '/sent',
        icon: 'paper-plane',
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
    const mockedUseLocationFieldOptions = jest.spyOn(useLocationFieldOptionsModule, 'useLocationFieldOptions');

    mockedUseLocationFieldOptions.mockReturnValue({
        all,
        grouped,
        findItemByValue: (value: string) => all.find((item) => item.value === value),
        ...value,
    });

    return mockedUseLocationFieldOptions;
};
