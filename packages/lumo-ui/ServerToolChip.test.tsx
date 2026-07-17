import { render, screen } from '@testing-library/react';

import { IcGlobe } from '@proton/icons/icons/IcGlobe';

import ServerToolChip from './ServerToolChip';

describe('ServerToolChip', () => {
    it('renders a static marker with no sources', () => {
        render(<ServerToolChip label="Searched the web" icon={IcGlobe} />);
        expect(screen.getByText('Searched the web')).toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('lists cited sources (domain + title) when provided', () => {
        render(
            <ServerToolChip
                label="Searched the web"
                icon={IcGlobe}
                sources={[{ url: 'https://www.proton.me/blog', title: 'Proton blog' }]}
            />
        );
        expect(screen.getByText('proton.me')).toBeInTheDocument();
        expect(screen.getByText('Proton blog')).toBeInTheDocument();
        expect(screen.getByRole('link')).toHaveAttribute('href', 'https://www.proton.me/blog');
    });
});
