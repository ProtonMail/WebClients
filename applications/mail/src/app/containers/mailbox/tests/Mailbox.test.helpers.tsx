import type { MutableRefObject, ReactElement, ReactNode } from 'react';

import { act } from '@testing-library/react';
import loudRejection from 'loud-rejection';

import { serverEvent } from '@proton/account';
import { getModelState } from '@proton/account/test';
import { getHumanLabelID } from '@proton/mail/helpers/location';
import { LABEL_TYPE } from '@proton/shared/lib/constants';
import { setBit } from '@proton/shared/lib/helpers/bitset';
import { NEWSLETTER_SUBSCRIPTIONS_BITS } from '@proton/shared/lib/helpers/newsletter';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';
import type { Label } from '@proton/shared/lib/interfaces/Label';
import { DEFAULT_MAILSETTINGS, VIEW_LAYOUT } from '@proton/shared/lib/mail/mailSettings';
import type { Filter, SearchParameters, Sort } from '@proton/shared/lib/mail/search';
import { mockDefaultBreakpoints } from '@proton/testing/lib/mockUseActiveBreakpoint';
import range from '@proton/utils/range';

import type { MailState } from 'proton-mail/store/rootReducer';

import { filterToString, keywordToString, sortToString } from '../../../helpers/mailboxUrl';
import { addApiMock, mailTestRender, minimalCache, triggerEvent } from '../../../helpers/test/helper';
import type { ConversationLabel } from '../../../models/conversation';
import type { Element } from '../../../models/element';
import type { Event } from '../../../models/event';
import { RouterMailboxContainer } from '../../../router/RouterMailboxContainer';

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
    Component?: typeof RouterMailboxContainer;
    mailSettings?: MailSettings;
    preloadedState?: Partial<MailState>;
}

export const props = {
    labelID: 'labelID',
    userSettings: {} as UserSettings,
    breakpoints: mockDefaultBreakpoints,
    elementID: undefined,
    onCompose: jest.fn(),
    isComposerOpened: false,
    drawerSidebarButtons: [] as ReactElement[],
    drawerSettingsButton: null as ReactNode,
    drawerSpotlightSeenRef: { current: false } as MutableRefObject<boolean>,
};

const defaultSort = { sort: 'Time', desc: true } as Sort;
const defaultFilter = {};
const defaultSearch = {};
const defaultMailSettings = { ...DEFAULT_MAILSETTINGS, ViewLayout: VIEW_LAYOUT.COLUMN } as MailSettings;

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
        NumMessages: 1,
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

    const readableLabelID = getHumanLabelID(labelID);
    let path = labelID ? readableLabelID : '';
    if (elementID) {
        path += `/${elementID}`;
    }
    return {
        ...props,
        labelID,
        elementID,
        mailSettings,
        initialPath: `${path}#${urlSearchParams.toString()}`,
    };
};

export const baseApiMocks = () => {
    addApiMock('importer/v1/importers', () => ({ Importers: [] }));
    addApiMock('settings/calendar', () => ({}));
    addApiMock('calendar/v1', () => ({}));
    addApiMock('payments/v5/plans', () => ({ Plans: [] }));
};

export const setup = async ({
    messages = [],
    conversations = [],
    totalMessages = messages.length,
    totalConversations = conversations.length,
    mockMessages = true,
    mockConversations = true,
    Component = RouterMailboxContainer,
    preloadedState = {},
    ...propsArgs
}: SetupArgs = {}) => {
    minimalCache();
    baseApiMocks();
    const { initialPath, ...props } = getProps(propsArgs);
    if (mockMessages) {
        addApiMock('mail/v4/messages', () => ({ Total: totalMessages, Messages: messages }));
    }

    if (mockConversations) {
        addApiMock('mail/v4/conversations', () => ({ Total: totalConversations, Conversations: conversations }));
    }

    const result = await mailTestRender(<Component />, {
        preloadedState: {
            userSettings: getModelState({
                News: setBit(0, NEWSLETTER_SUBSCRIPTIONS_BITS.IN_APP_NOTIFICATIONS),
                Email: {
                    Reset: 0,
                },
                Phone: {
                    Reset: 0,
                },
                '2FA': {
                    Enabled: 0,
                },
            } as UserSettings),
            mailSettings: getModelState(props.mailSettings),
            categories: getModelState([...labels, ...folders]),
            messageCounts: getModelState([{ LabelID: props.labelID, Total: totalMessages, Unread: totalMessages }]),
            conversationCounts: getModelState([
                {
                    LabelID: props.labelID,
                    Total: totalConversations,
                    Unread: totalConversations,
                },
                {
                    LabelID: '7',
                    Total: 0,
                    Unread: 0,
                },
            ]),
            elements: {
                params: {
                    labelID: props.labelID,
                    elementID: props.elementID,
                    messageID: undefined,
                    conversationMode: false,
                    sort: defaultSort,
                    filter: defaultFilter,
                    search: defaultSearch,
                    esEnabled: false,
                    isSearching: false,
                },
                beforeFirstLoad: false,
                invalidated: false,
                pendingRequest: false,
                pendingActions: 0,
                page: 0,
                total: {},
                elements: {},
                bypassFilter: [],
                pages: {},
                retry: { payload: null, count: 0, error: undefined },
                taskRunning: { labelIDs: [], timeoutID: undefined },
            },
            ...preloadedState, // TODO merge object instead of overwriting, if needed for new test-cases
        },
        initialPath,
    });
    const rerender = (propsArgs: PropsArgs) => {
        const { initialPath } = getProps(propsArgs);

        act(() => {
            result.history.push(initialPath);
        });

        return result.rerender(<Component />);
    };
    const getItems = () => result.getAllByTestId('message-item', { exact: false });
    return { ...result, rerender, getItems };
};

export const sendEvent = async (store: any, event: Event) => {
    await act(async () => {
        store.dispatch(serverEvent(event as any));
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
