import { ItemsGroup } from './useLocationFieldOptions';

export const expectedAll = [
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
        value: '7',
        text: 'Sent',
        url: '/sent',
        icon: 'paper-plane',
    },
    {
        value: '10',
        text: 'Starred',
        url: '/starred',
        icon: 'star',
    },
    {
        value: '6',
        text: 'Archive',
        url: '/archive',
        icon: 'archive-box',
    },
    {
        value: '4',
        text: 'Spam',
        url: '/spam',
        icon: 'fire',
    },
    {
        value: '3',
        text: 'Trash',
        url: '/trash',
        icon: 'trash',
    },
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
    {
        value: 'highlighted',
        text: 'highlighted',
        url: 'highlighted',
        color: '#EC3E7C',
    },
];

export const expectedGrouped: ItemsGroup = [
    {
        id: 'DEFAULT_FOLDERS',
        title: 'Default folders',
        items: [
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
                value: '7',
                text: 'Sent',
                url: '/sent',
                icon: 'paper-plane',
            },
            {
                value: '10',
                text: 'Starred',
                url: '/starred',
                icon: 'star',
            },
            {
                value: '6',
                text: 'Archive',
                url: '/archive',
                icon: 'archive-box',
            },
            {
                value: '4',
                text: 'Spam',
                url: '/spam',
                icon: 'fire',
            },
            {
                value: '3',
                text: 'Trash',
                url: '/trash',
                icon: 'trash',
            },
        ],
    },
    {
        id: 'CUSTOM_FOLDERS',
        title: 'Custom folders',
        items: [
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
        ],
    },
    {
        id: 'LABELS',
        title: 'Labels',
        items: [
            {
                value: 'highlighted',
                text: 'highlighted',
                url: 'highlighted',
                color: '#EC3E7C',
            },
        ],
    },
];
