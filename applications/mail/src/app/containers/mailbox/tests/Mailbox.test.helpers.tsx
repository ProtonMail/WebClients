import React from 'react';
import { act } from '@testing-library/react';
import { History, Location } from 'history';
import loudRejection from 'loud-rejection';
import { range } from 'proton-shared/lib/helpers/array';
import { wait } from 'proton-shared/lib/helpers/promise';
import { MailSettings, UserSettings } from 'proton-shared/lib/interfaces';
import { LABEL_TYPE, VIEW_MODE } from 'proton-shared/lib/constants';
import { Label } from 'proton-shared/lib/interfaces/Label';
import { Folder } from 'proton-shared/lib/interfaces/Folder';
import { filterToString, keywordToString, sortToString } from '../../../helpers/mailboxUrl';
import { addApiMock } from '../../../helpers/test/api';
import { addToCache, minimalCache } from '../../../helpers/test/cache';
import { triggerEvent } from '../../../helpers/test/helper';
import { render } from '../../../helpers/test/render';
import { ConversationLabel } from '../../../models/conversation';
import { Element } from '../../../models/element';
import { Event } from '../../../models/event';
import { Filter, SearchParameters, Sort } from '../../../models/tools';
import { Breakpoints } from '../../../models/utils';
import MailboxContainer from '../MailboxContainer';

loudRejection();

interface PropsArgs {
    labelID?: string;
    elementID?: string;
    page?: number;
    sort?: Sort;
    filter?: Filter;
    search?: SearchParameters;
}

interface SetupArgs extends PropsArgs {
    messages?: Element[];
    conversations?: Element[];
    inputLabelID?: string;
    page?: number;
    totalMessages?: number;
    totalConversations?: number;
    mockMessages?: boolean;
    mockConversations?: boolean;
}

export const props = {
    labelID: 'labelID',
    mailSettings: { ViewMode: VIEW_MODE.GROUP } as MailSettings,
    userSettings: {} as UserSettings,
    breakpoints: {} as Breakpoints,
    elementID: undefined,
    location: {} as Location,
    history: ({ push: jest.fn(), location: { pathname: 'pathname', search: 'search' } } as any) as History,
    onCompose: jest.fn(),
};

const defaultSort = { sort: 'Time', desc: true } as Sort;
const defaultFilter = {};
const defaultSearch = {};

export const labels: Label[] = [
    { ID: 'labelID', Type: LABEL_TYPE.MESSAGE_LABEL, Name: 'label' },
    { ID: 'label1', Type: LABEL_TYPE.MESSAGE_LABEL, Name: 'label1' },
    { ID: 'label2', Type: LABEL_TYPE.MESSAGE_LABEL, Name: 'label2' },
    { ID: 'label3', Type: LABEL_TYPE.MESSAGE_LABEL, Name: 'label3' },
    { ID: 'label4', Type: LABEL_TYPE.MESSAGE_LABEL, Name: 'label4' },
] as Label[];

export const folders: Folder[] = [
    { ID: 'folder1', Type: LABEL_TYPE.MESSAGE_FOLDER, Name: 'folder1' },
    { ID: 'folder2', Type: LABEL_TYPE.MESSAGE_FOLDER, Name: 'folder2' },
    { ID: 'folder3', Type: LABEL_TYPE.MESSAGE_FOLDER, Name: 'folder3' },
    { ID: 'folder4', Type: LABEL_TYPE.MESSAGE_FOLDER, Name: 'folder4' },
] as Folder[];

export const getElements = (count: number, label = props.labelID, elementProps: any = {}): Element[] =>
    range(0, count).map((i) => ({
        ID: `id${i}`,
        Labels: [{ ID: label, ContextTime: i }] as ConversationLabel[],
        LabelIDs: [label],
        ...elementProps,
    }));

export const getProps = ({
    labelID = props.labelID,
    elementID,
    page = 0,
    sort = defaultSort,
    filter = defaultFilter,
    search = defaultSearch,
}: PropsArgs) => {
    const urlSearchParams = new URLSearchParams();
    if (page !== 0) {
        urlSearchParams.set('page', String(page + 1));
    }
    if (sort !== defaultSort) {
        urlSearchParams.set('sort', sortToString(sort) || '');
    }
    if (filter !== defaultFilter) {
        urlSearchParams.set('filter', filterToString(filter) || '');
    }
    if (search !== defaultSearch) {
        urlSearchParams.set('keyword', keywordToString(search.keyword || '') || '');
    }

    const location = { pathname: '/', hash: `#${urlSearchParams.toString()}` } as Location;

    return { ...props, location, labelID, elementID };
};

export const setup = async ({
    messages = [],
    conversations = [],
    totalMessages = messages.length,
    totalConversations = conversations.length,
    mockMessages = true,
    mockConversations = true,
    ...propsArgs
}: SetupArgs = {}) => {
    minimalCache();
    const props = getProps(propsArgs);

    addToCache('Labels', [{ ID: props.labelID }]);
    if (mockMessages) {
        addApiMock('mail/v4/messages', () => ({ Total: totalMessages, Messages: messages }));
    }
    if (mockConversations) {
        addApiMock('mail/v4/conversations', () => ({ Total: totalConversations, Conversations: conversations }));
    }
    addApiMock('mail/v4/importers', () => ({ Importers: [] }));
    addApiMock('core/v4/features/UsedMailMobileApp', () => ({
        Feature: {
            Code: 'UsedMailMobileApp',
            Type: 'boolean',
            Global: false,
            DefaultValue: false,
            Value: true,
            UpdateTime: 1616511553,
            Writable: true,
        },
    }));

    addToCache('Labels', [...labels, ...folders]);
    addToCache('MessageCounts', [{ LabelID: props.labelID, Total: totalMessages, Unread: totalMessages }]);
    addToCache('ConversationCounts', [
        { LabelID: props.labelID, Total: totalConversations, Unread: totalConversations },
    ]);

    const result = await render(<MailboxContainer {...props} />, false);
    const rerender = (propsArgs: PropsArgs) => result.rerender(<MailboxContainer {...getProps(propsArgs)} />);
    return { ...result, rerender };
};

export const sendEvent = async (event: Event) => {
    await act(async () => {
        triggerEvent(event);
        await wait(0);
    });
};

export const expectElements = (
    getAllByTestId: (testId: string) => HTMLElement[],
    total: number,
    isPlaceholder: boolean
) => {
    const items = getAllByTestId('item');
    expect(items.length).toBe(total);
    items.forEach((item) => {
        if (isPlaceholder) {
            expect(item.getAttribute('data-element-id')).toContain('placeholder');
        } else {
            expect(item.getAttribute('data-element-id')).not.toContain('placeholder');
        }
    });
};
