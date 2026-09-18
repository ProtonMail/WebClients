import { fireEvent, render, screen } from '@testing-library/react';

import { LumoConversationHeaderActions } from './LumoConversationHeaderActions';

const reportButton = () => screen.queryByRole('button', { name: 'Report a problem' });

describe('LumoConversationHeaderActions', () => {
    it('drafts a report when the host supplied a composer', () => {
        const openDebugReport = jest.fn();
        render(<LumoConversationHeaderActions hasConversation clear={jest.fn()} openDebugReport={openDebugReport} />);

        fireEvent.click(reportButton()!);

        expect(openDebugReport).toHaveBeenCalledTimes(1);
    });

    it('offers no report button to a host with no composer', () => {
        render(<LumoConversationHeaderActions hasConversation clear={jest.fn()} />);

        expect(reportButton()).toBeNull();
        expect(screen.getByRole('button', { name: 'Clear conversation' })).toBeInTheDocument();
    });

    it('renders nothing before there is a conversation', () => {
        render(<LumoConversationHeaderActions hasConversation={false} clear={jest.fn()} openDebugReport={jest.fn()} />);

        expect(screen.queryAllByRole('button')).toHaveLength(0);
    });
});
