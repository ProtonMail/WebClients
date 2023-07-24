import { render, screen } from '@testing-library/react';

import Panel from './Panel';

describe('Panel', () => {
    it('should display panel title + its content', () => {
        render(
            <Panel title="test title">
                <>Test content</>
            </Panel>
        );

        expect(screen.getByRole('heading', { level: 2, name: /test title/ }));
        expect(screen.getByText('Test content'));
    });
});
