import { render, screen } from '@testing-library/react';

import Chip from './Chip';

describe('Chip', () => {
    it('renders the label and payload', () => {
        render(<Chip label="Searched mailbox" payload={'{"query":"unread"}'} />);
        expect(screen.getByText('Searched mailbox')).toBeInTheDocument();
        expect(screen.getByText('{"query":"unread"}')).toBeInTheDocument();
    });
});
