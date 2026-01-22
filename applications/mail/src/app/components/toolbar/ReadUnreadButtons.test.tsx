import { screen } from '@testing-library/react';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { getElementContextIdentifier } from 'proton-mail/helpers/elements';
import type { Conversation } from 'proton-mail/models/conversation';
import type { ElementsStateParams } from 'proton-mail/store/elements/elementsTypes';

import { clearAll, mailTestRender, minimalCache } from '../../helpers/test/helper';
import { newElementsState } from '../../store/elements/elementsSlice';
import ReadUnreadButtons from './ReadUnreadButtons';

const defaultParams: ElementsStateParams = {
    labelID: MAILBOX_LABEL_IDS.INBOX,
    conversationMode: true,
    filter: {},
    sort: { sort: 'Time', desc: true },
    search: {},
    esEnabled: false,
    isSearching: false,
};

jest.mock('proton-mail/hooks/useSelectAll', () => ({
    useSelectAll: jest.fn(() => ({ selectAll: false })),
}));

const mockUseSelectAll = jest.requireMock('proton-mail/hooks/useSelectAll').useSelectAll;

const getProps = (selectedIDs: string[] = ['id1', 'id2']) => {
    return {
        labelID: MAILBOX_LABEL_IDS.INBOX,
        selectedIDs,
        onMarkAs: jest.fn(),
    };
};

const createConversation = (id: string, unread: boolean): Conversation =>
    ({
        ID: id,
        ContextNumUnread: unread ? 1 : 0,
        Labels: [{ ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: unread ? 1 : 0 }],
    }) as Conversation;

describe('ReadUnreadButtons', () => {
    const context = getElementContextIdentifier(defaultParams);

    afterEach(() => {
        mockUseSelectAll.mockReturnValue({ selectAll: false });
        clearAll();
    });

    it('should not show buttons when no items are selected', async () => {
        const props = getProps([]);
        minimalCache();

        await mailTestRender(<ReadUnreadButtons {...props} />, {
            preloadedState: {
                elements: newElementsState(),
            },
        });

        expect(screen.queryByTestId('toolbar:read')).toBeNull();
        expect(screen.queryByTestId('toolbar:unread')).toBeNull();
    });

    it('should show "Mark as read" button when all items are unread', async () => {
        const props = getProps(['id1', 'id2']);
        minimalCache();

        const elementsState = newElementsState();
        elementsState.elements = {
            id1: createConversation('id1', true),
            id2: createConversation('id2', true),
        };
        elementsState.pages = { [context]: [0] };

        await mailTestRender(<ReadUnreadButtons {...props} />, {
            preloadedState: {
                elements: elementsState,
            },
        });

        expect(screen.getByTestId('toolbar:read')).toBeInTheDocument();
        expect(screen.queryByTestId('toolbar:unread')).toBeNull();
    });

    it('should show "Mark as read" button when some items are unread', async () => {
        const props = getProps(['id1', 'id2']);
        minimalCache();

        const elementsState = newElementsState();
        elementsState.elements = {
            id1: createConversation('id1', true),
            id2: createConversation('id2', false),
        };
        elementsState.pages = { [context]: [0] };

        await mailTestRender(<ReadUnreadButtons {...props} />, {
            preloadedState: {
                elements: elementsState,
            },
        });

        expect(screen.getByTestId('toolbar:read')).toBeInTheDocument();
        expect(screen.queryByTestId('toolbar:unread')).toBeNull();
    });

    it('should show "Mark as unread" button when all items are read', async () => {
        const props = getProps(['id1', 'id2']);
        minimalCache();

        const elementsState = newElementsState();
        elementsState.elements = {
            id1: createConversation('id1', false),
            id2: createConversation('id2', false),
        };
        elementsState.pages = { [context]: [0] };

        await mailTestRender(<ReadUnreadButtons {...props} />, {
            preloadedState: {
                elements: elementsState,
            },
        });

        expect(screen.queryByTestId('toolbar:read')).toBeNull();
        expect(screen.getByTestId('toolbar:unread')).toBeInTheDocument();
    });

    it('should show both buttons when doing a selectAll', async () => {
        mockUseSelectAll.mockReturnValue({ selectAll: true });

        const props = getProps(['id1', 'id2']);
        minimalCache();

        const elementsState = newElementsState();
        elementsState.elements = {
            id1: createConversation('id1', true),
            id2: createConversation('id2', false),
        };
        elementsState.pages = { [context]: [0] };

        await mailTestRender(<ReadUnreadButtons {...props} />, {
            preloadedState: {
                elements: elementsState,
            },
        });

        expect(screen.getByTestId('toolbar:read')).toBeInTheDocument();
        expect(screen.getByTestId('toolbar:unread')).toBeInTheDocument();
    });
});
