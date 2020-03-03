import React from 'react';
import { act } from 'react-dom/test-utils';
import { render } from '@testing-library/react';
import { Location, History } from 'history';
import { noop } from 'proton-shared/lib/helpers/function';

import MailboxContainer from './MailboxContainer';
import { useElements as useElementsSource } from '../hooks/useElements';
import * as ToolbarSource from '../components/toolbar/Toolbar';

const useElements = useElementsSource as jest.Mock;
const Toolbar = (ToolbarSource as any) as {
    props: { selectedIDs: string[]; onCheck: (IDs: string[], checked: boolean, replace: boolean) => void };
};

jest.mock('../components/list/List', () => () => 'List');
jest.mock('../components/conversation/ConversationView', () => () => 'ConversationView');
jest.mock('../components/message/MessageOnlyView', () => () => 'MessageOnlyView');
jest.mock('../components/toolbar/Toolbar');
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
        onCompose: noop
    };
    const elements = [{ ID: '0' }, { ID: '1' }, { ID: '2' }, { ID: '3' }, { ID: '4' }];

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Snapshots', () => {
        it('should show loader instead of list when elements loading', () => {
            useElements.mockReturnValue([labelID, [], true, jest.fn()]);
            const result = render(<MailboxContainer {...emptyProps} />);
            expect(result).toMatchSnapshot();
        });

        it('should show list when elements finish loading', () => {
            useElements.mockReturnValue([labelID, [], false, jest.fn()]);
            const result = render(<MailboxContainer {...emptyProps} />);
            expect(result).toMatchSnapshot();
        });
    });

    describe('Selections', () => {
        it('should select the right elements for replace false', () => {
            useElements.mockReturnValue([labelID, elements, false, jest.fn()]);
            render(<MailboxContainer {...emptyProps} />);
            act(() => Toolbar.props.onCheck(['1'], true, false));
            expect(Toolbar.props.selectedIDs).toEqual(['1']);
            act(() => Toolbar.props.onCheck(['2'], true, false));
            expect(Toolbar.props.selectedIDs).toEqual(['1', '2']);
        });

        it('should select the right elements for replace true', () => {
            useElements.mockReturnValue([labelID, elements, false, jest.fn()]);
            render(<MailboxContainer {...emptyProps} />);
            act(() => Toolbar.props.onCheck(['1'], true, true));
            expect(Toolbar.props.selectedIDs).toEqual(['1']);
            act(() => Toolbar.props.onCheck(['2'], true, true));
            expect(Toolbar.props.selectedIDs).toEqual(['2']);
        });
    });
});
