import { render, screen } from '@testing-library/react';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import EmptyView from './EmptyView';

jest.mock('@proton/components/hooks/drawer/useDrawer', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        toggleDrawerApp: jest.fn(),
        appInView: '',
    })),
}));

describe('Empty view', () => {
    describe('Pass placeholder tests', () => {
        it('Should render the Proton pass placeholder when in spam', () => {
            render(<EmptyView labelID={MAILBOX_LABEL_IDS.SPAM} isSearch={false} isUnread={false} />);

            const itemInView = screen.getByTestId('empty-view-placeholder--pass-placeholder');
            expect(itemInView).toBeInTheDocument();
        });

        it('Should not render the Proton pass placeholder when in spam and in search', () => {
            render(<EmptyView labelID={MAILBOX_LABEL_IDS.SPAM} isSearch={true} isUnread={false} />);

            const itemInView = screen.queryByTestId('empty-view-placeholder--pass-placeholder');
            expect(itemInView).not.toBeInTheDocument();
        });

        it('Should render the Proton pass placeholder when in spam and has unread', () => {
            render(<EmptyView labelID={MAILBOX_LABEL_IDS.SPAM} isSearch={false} isUnread={true} />);

            const itemInView = screen.getByTestId('empty-view-placeholder--pass-placeholder');
            expect(itemInView).toBeInTheDocument();
        });
    });

    describe('Title tests', () => {
        it('Should show search title when in search', () => {
            render(<EmptyView labelID={MAILBOX_LABEL_IDS.INBOX} isSearch={true} isUnread={false} />);

            const title = screen.getByTestId('empty-view-placeholder--empty-title');
            expect(title?.innerHTML).toBe('No results found');
        });

        it('Should show folder title when in custom folder', () => {
            render(<EmptyView labelID="custom" isSearch={false} isUnread={false} />);

            const title = screen.getByTestId('empty-view-placeholder--empty-title');
            expect(title?.innerHTML).toBe('No messages found');
        });

        it('Should show schedule title when in schedule', () => {
            render(<EmptyView labelID={MAILBOX_LABEL_IDS.SCHEDULED} isSearch={false} isUnread={false} />);

            const title = screen.getByTestId('empty-view-placeholder--empty-title');
            expect(title?.innerHTML).toBe('No messages scheduled');
        });
    });

    describe('Content test', () => {
        it('Should show folder description when in custom folder', () => {
            render(<EmptyView labelID="custom" isSearch={false} isUnread={false} />);

            const description = screen.getByTestId('empty-view-placeholder--empty-description');
            expect(description?.innerHTML).toBe('You do not have any messages here');
        });

        it('Should show schedule description when in schedule folder', () => {
            render(<EmptyView labelID={MAILBOX_LABEL_IDS.SCHEDULED} isSearch={false} isUnread={false} />);

            const createMessageBtn = screen.getByTestId('empty-view-placeholder--create-message-button');
            expect(createMessageBtn).toBeInTheDocument();
        });

        it('Should show default copy description when in inbox folder', () => {
            render(<EmptyView labelID={MAILBOX_LABEL_IDS.INBOX} isSearch={false} isUnread={false} />);

            const description = screen.getByTestId('empty-view-placeholder--empty-description');
            expect(description?.innerHTML).toBe('Seems like you are all caught up for now');
        });

        it('Should show search copy description when in server search folder', () => {
            render(<EmptyView labelID={MAILBOX_LABEL_IDS.INBOX} isSearch={true} isUnread={false} />);

            const description = screen.getByTestId('empty-view-placeholder--empty-description');
            expect(description?.innerHTML).toContain(
                'For more search results, try searching for this keyword in the content of your email messages.'
            );
        });
    });
});
