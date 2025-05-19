import { render, screen } from '@testing-library/react';

import PanelHeader from './PanelHeader';

describe('PanelHeader', () => {
    it('should display panel header with title', () => {
        render(<PanelHeader title="Test title" />);

        expect(screen.getByText('Test title')).toBeInTheDocument();
    });
});
