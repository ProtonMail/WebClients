import { IcArchiveBox } from '@proton/icons/icons/IcArchiveBox';
import { IcClock } from '@proton/icons/icons/IcClock';
import { IcEnvelopes } from '@proton/icons/icons/IcEnvelopes';
import { IcFileLines } from '@proton/icons/icons/IcFileLines';
import { IcFire } from '@proton/icons/icons/IcFire';
import { IcInbox } from '@proton/icons/icons/IcInbox';
import { IcPaperPlane } from '@proton/icons/icons/IcPaperPlane';
import { IcStar } from '@proton/icons/icons/IcStar';
import { IcTrash } from '@proton/icons/icons/IcTrash';

import type { ItemsGroup } from './useLocationFieldOptions';

export const expectedAll = [
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
        icon: IcClock,
        text: 'Snooze',
        url: '/snoozed',
        value: '16',
    },
    {
        value: '8',
        text: 'Drafts',
        url: '/drafts',
        icon: IcFileLines,
    },
    {
        value: '7',
        text: 'Sent',
        url: '/sent',
        icon: IcPaperPlane,
    },
    {
        value: '10',
        text: 'Starred',
        url: '/starred',
        icon: IcStar,
    },
    {
        value: '6',
        text: 'Archive',
        url: '/archive',
        icon: IcArchiveBox,
    },
    {
        value: '4',
        text: 'Spam',
        url: '/spam',
        icon: IcFire,
    },
    {
        value: '3',
        text: 'Trash',
        url: '/trash',
        icon: IcTrash,
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
            LastUnseenMessageEventID: null,
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
                icon: IcEnvelopes,
            },
            {
                value: '0',
                text: 'Inbox',
                url: '/inbox',
                icon: IcInbox,
            },
            {
                icon: IcClock,
                text: 'Snooze',
                url: '/snoozed',
                value: '16',
            },
            {
                value: '8',
                text: 'Drafts',
                url: '/drafts',
                icon: IcFileLines,
            },
            {
                value: '7',
                text: 'Sent',
                url: '/sent',
                icon: IcPaperPlane,
            },
            {
                value: '10',
                text: 'Starred',
                url: '/starred',
                icon: IcStar,
            },
            {
                value: '6',
                text: 'Archive',
                url: '/archive',
                icon: IcArchiveBox,
            },
            {
                value: '4',
                text: 'Spam',
                url: '/spam',
                icon: IcFire,
            },
            {
                value: '3',
                text: 'Trash',
                url: '/trash',
                icon: IcTrash,
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
                    LastUnseenMessageEventID: null,
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
