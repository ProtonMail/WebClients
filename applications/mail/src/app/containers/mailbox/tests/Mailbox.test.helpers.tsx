import { act } from '@testing-library/react';
import loudRejection from 'loud-rejection';

import { LABEL_TYPE, VIEW_MODE } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { Label } from '@proton/shared/lib/interfaces/Label';
import range from '@proton/utils/range';

import { filterToString, keywordToString, sortToString } from '../../../helpers/mailboxUrl';
import { addApiMock, addToCache, getHistory, minimalCache, render, triggerEvent } from '../../../helpers/test/helper';
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
    mailSettings?: MailSettings;
}

export interface SetupArgs extends PropsArgs {
    messages?: Element[];
    conversations?: Element[];
    inputLabelID?: string;
    page?: number;
    totalMessages?: number;
    totalConversations?: number;
    mockMessages?: boolean;
    mockConversations?: boolean;
    Component?: typeof MailboxContainer;
    mailSettings?: MailSettings;
}

export const props = {
    labelID: 'labelID',
    userSettings: {} as UserSettings,
    breakpoints: { isDesktop: true } as Breakpoints,
    elementID: undefined,
    onCompose: jest.fn(),
    isComposerOpened: false,
};

const defaultSort = { sort: 'Time', desc: true } as Sort;
const defaultFilter = {};
const defaultSearch = {};
const defaultMailSettings = { ViewMode: VIEW_MODE.GROUP, Shortcuts: 1 } as MailSettings;

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
    mailSettings = defaultMailSettings,
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

    getHistory().push(`#${urlSearchParams.toString()}`);

    return { ...props, labelID, elementID, mailSettings };
};

export const baseApiMocks = () => {
    addApiMock('importer/v1/importers', () => ({ Importers: [] }));
    addApiMock('settings/calendar', () => ({}));
    addApiMock('calendar/v1', () => ({}));
    addApiMock('payments/plans', () => ({}));
};

export const setup = async ({
    messages = [],
    conversations = [],
    totalMessages = messages.length,
    totalConversations = conversations.length,
    mockMessages = true,
    mockConversations = true,
    Component = MailboxContainer,
    ...propsArgs
}: SetupArgs = {}) => {
    minimalCache();
    baseApiMocks();
    const props = getProps(propsArgs);

    addToCache('Labels', [{ ID: props.labelID }]);
    if (mockMessages) {
        addApiMock('mail/v4/messages', () => ({ Total: totalMessages, Messages: messages }));
    }
    if (mockConversations) {
        addApiMock('mail/v4/conversations', () => ({ Total: totalConversations, Conversations: conversations }));
    }

    addToCache('Labels', [...labels, ...folders]);
    addToCache('MessageCounts', [{ LabelID: props.labelID, Total: totalMessages, Unread: totalMessages }]);
    addToCache('ConversationCounts', [
        { LabelID: props.labelID, Total: totalConversations, Unread: totalConversations },
    ]);
    addToCache('MailSettings', props.mailSettings);

    const result = await render(<Component {...props} />, false);
    const rerender = (propsArgs: PropsArgs) => result.rerender(<Component {...getProps(propsArgs)} />);
    const getItems = () => result.getAllByTestId('message-item', { exact: false });

    return { ...result, rerender, getItems };
};

export const sendEvent = async (event: Event) => {
    await act(async () => {
        triggerEvent(event);
        await wait(0);
    });
};

export const expectElements = (getItems: () => HTMLElement[], total: number, isPlaceholder: boolean) => {
    const items = getItems();
    expect(items.length).toBe(total);
    items.forEach((item) => {
        if (isPlaceholder) {
            expect(item.getAttribute('data-element-id')).toContain('placeholder');
        } else {
            expect(item.getAttribute('data-element-id')).not.toContain('placeholder');
        }
    });
};
