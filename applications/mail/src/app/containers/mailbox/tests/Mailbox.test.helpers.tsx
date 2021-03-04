import React from 'react';
import { act } from '@testing-library/react';
import { History, Location } from 'history';
import loudRejection from 'loud-rejection';
import { range } from 'proton-shared/lib/helpers/array';
import { wait } from 'proton-shared/lib/helpers/promise';
import { MailSettings, UserSettings } from 'proton-shared/lib/interfaces';
import { filterToString, keywordToString, sortToString } from '../../../helpers/mailboxUrl';
import { addApiMock } from '../../../helpers/test/api';
import { addToCache } from '../../../helpers/test/cache';
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
    page?: number;
    sort?: Sort;
    filter?: Filter;
    search?: SearchParameters;
}

interface SetupArgs extends PropsArgs {
    conversations?: Element[];
    messages?: Element[];
    inputLabelID?: string;
    page?: number;
    total?: number;
}

export const props = {
    labelID: 'labelID',
    mailSettings: {} as MailSettings,
    userSettings: {} as UserSettings,
    breakpoints: {} as Breakpoints,
    elementID: undefined,
    location: {} as Location,
    history: {} as History,
    onCompose: jest.fn(),
};

export const { labelID } = props;

const defaultSort = { sort: 'Time', desc: true } as Sort;
const defaultFilter = {};
const defaultSearch = {};

export const getElements = (count: number, label = props.labelID, elementProps: any = {}): Element[] =>
    range(0, count).map((i) => ({
        ID: `id${i}`,
        Labels: [{ ID: label, ContextTime: i }] as ConversationLabel[],
        LabelIDs: [label],
        ...elementProps,
    }));

export const getProps = ({
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
        urlSearchParams.set('sort', filterToString(filter) || '');
    }
    if (search !== defaultSearch) {
        urlSearchParams.set('keyword', keywordToString(search.keyword || '') || '');
    }

    const location = { pathname: '/', search: urlSearchParams.toString() } as Location;

    return { ...props, location };
};

export const setup = async ({
    conversations = [],
    messages = [],
    inputLabelID = labelID,
    total = conversations.length || messages.length,
    ...propsArgs
}: SetupArgs = {}) => {
    const counts = { LabelID: inputLabelID, Total: total };
    addToCache('ConversationCounts', conversations.length ? [counts] : []);
    addToCache('MessageCounts', messages.length ? [] : [counts]);
    addApiMock('mail/v4/conversations', () => ({ Total: total, Conversations: conversations }));
    addApiMock('mail/v4/messages', () => ({ Total: total, Messages: messages }));

    const result = await render(<MailboxContainer {...getProps(propsArgs)} />);
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
