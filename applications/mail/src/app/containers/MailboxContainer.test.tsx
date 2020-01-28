import React from 'react';
import { render } from '@testing-library/react';

import MailboxContainer from './MailboxContainer';
import { useElements } from '../hooks/useElements';
import { Location, History } from 'history';

jest.mock('../components/list/List', () => () => 'List');
jest.mock('../components/conversation/ConversationView', () => () => 'ConversationView');
jest.mock('../components/message/MessageOnlyView', () => () => 'MessageOnlyView');
jest.mock('../components/toolbar/Toolbar', () => () => 'Toolbar');
jest.mock('../components/view/PlaceholderView', () => () => 'PlaceholderView');

jest.mock('../hooks/useMailboxPageTitle', () => ({ useMailboxPageTitle: jest.fn() }));
jest.mock('../hooks/useElements', () => ({ useElements: jest.fn() }));

describe('MailboxContainer', () => {
    const labelID = 'labelID';
    const elementID = 'elementID';
    const emptyProps = {
        labelID,
        mailSettings: {},
        elementID,
        location: {} as Location,
        history: {} as History,
        onCompose: () => {
            /* not empty */
        }
    };

    it('should show loader instead of list when elements loading', () => {
        (useElements as jest.Mock).mockReturnValue([labelID, [], true, jest.fn()]);
        const result = render(<MailboxContainer {...emptyProps} />);
        expect(result).toMatchSnapshot();
    });

    it('should show list when elements finish loading', () => {
        (useElements as jest.Mock).mockReturnValue([labelID, [], false, jest.fn()]);
        const result = render(<MailboxContainer {...emptyProps} />);
        expect(result).toMatchSnapshot();
    });
});
