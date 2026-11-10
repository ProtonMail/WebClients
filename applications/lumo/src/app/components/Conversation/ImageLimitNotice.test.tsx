import { render, screen } from '@testing-library/react';

import { ImageLimitNotice } from './ImageLimitNotice';

describe('ImageLimitNotice', () => {
    it('renders nothing while both budgets are respected', () => {
        const { container } = render(<ImageLimitNotice exceedsLimit={false} exceedsPageLimit={false} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('warns about uploaded images only', () => {
        render(<ImageLimitNotice exceedsLimit />);

        expect(screen.getByText(/many images/)).toBeInTheDocument();
        expect(screen.queryByText(/PDF pages/)).not.toBeInTheDocument();
    });

    it('warns about PDF pages only, and says the text is still read', () => {
        render(<ImageLimitNotice exceedsLimit={false} exceedsPageLimit />);

        expect(screen.getByText(/many PDF pages with images/)).toBeInTheDocument();
        expect(screen.getByText(/full text of every PDF/)).toBeInTheDocument();
        expect(screen.queryByText(/contains many images/)).not.toBeInTheDocument();
    });

    it('shows both warnings together', () => {
        render(<ImageLimitNotice exceedsLimit exceedsPageLimit />);

        expect(screen.getByText(/contains many images.*many PDF pages/)).toBeInTheDocument();
    });
});
