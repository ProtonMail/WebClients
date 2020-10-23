import React from 'react';
import { fireEvent } from '@testing-library/react';
import { Location, History } from 'history';
import { UserSettings, MailSettings } from 'proton-shared/lib/interfaces';

import MailboxContainer from './MailboxContainer';
import { render, addApiMock, clearAll, addToCache, addApiResolver } from '../helpers/test/helper';
import { Breakpoints } from '../models/utils';

const props = {
    labelID: 'labelID',
    mailSettings: {} as MailSettings,
    userSettings: {} as UserSettings,
    breakpoints: {} as Breakpoints,
    elementID: undefined,
    location: {} as Location,
    history: {} as History,
    onCompose: jest.fn(),
};

const conversationsResult = {
    Total: 2,
    Conversations: [
        { ID: '1', Labels: [{ ID: props.labelID }] },
        { ID: '2', Labels: [{ ID: props.labelID }] },
    ],
};

describe('MailboxContainer', () => {
    beforeEach(() => {
        clearAll();
        addToCache('Labels', []);
        addApiMock('mail/v4/messages/count', () => ({}));
        addApiMock('mail/v4/conversations/count', () => ({}));
    });

    it('should show loader instead of list when elements loading', async () => {
        addApiResolver('mail/v4/conversations');

        const { container } = await render(<MailboxContainer {...props} />);

        const loader = container.querySelector('.items-column-list [alt="Loading"]') as Element;

        expect(loader).toBeDefined();
    });

    it('should show list when elements finish loading', async () => {
        addApiMock('mail/v4/conversations', () => conversationsResult);

        const { container } = await render(<MailboxContainer {...props} />);

        const items = container.querySelectorAll('.items-column-list .item-container') as NodeList;

        expect(items.length === conversationsResult.Conversations.length).toBe(true);
    });

    it('should select all', async () => {
        addApiMock('mail/v4/conversations', () => conversationsResult);

        const { container } = await render(<MailboxContainer {...props} />);

        const checkAll = container.querySelector('.toolbar .pm-checkbox') as Element;
        fireEvent.click(checkAll);

        const allChecks = container.querySelectorAll('input.item-checkbox') as NodeListOf<HTMLInputElement>;
        expect(allChecks.length > 0).toBe(true);

        const checked = [...allChecks].every((oneCheck) => oneCheck.checked);
        expect(checked).toBe(true);
    });
});
