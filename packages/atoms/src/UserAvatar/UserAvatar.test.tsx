import { render, screen } from '@testing-library/react';

import { UserAvatar, UserAvatarSizeEnum } from './UserAvatar';
import { AnonymousUserParticles, getRandomParticle } from './getRandomParticle';

jest.mock('./getRandomParticle');

const greekLetter = 'μ';
jest.mocked(getRandomParticle).mockReturnValue({
    name: greekLetter,
    color: { hsl: AnonymousUserParticles[greekLetter] },
});

describe('UserAvatar', () => {
    it('renders with default props', () => {
        render(<UserAvatar name="John Doe" />);
        const avatar = screen.getByTestId('user-avatar');
        expect(avatar).toBeInTheDocument();
        expect(avatar).toHaveTextContent('J');
        expect(avatar).toHaveStyle({ '--w-custom': '2rem', '--h-custom': '2rem' });
    });

    it('renders with small size', () => {
        render(<UserAvatar name="John Doe" size={UserAvatarSizeEnum.Small} />);
        const avatar = screen.getByTestId('user-avatar');
        expect(avatar).toHaveStyle({ '--w-custom': '1.75rem', '--h-custom': '1.75rem' });
    });

    it('renders with medium size', () => {
        render(<UserAvatar name="John Doe" size={UserAvatarSizeEnum.Medium} />);
        const avatar = screen.getByTestId('user-avatar');
        expect(avatar).toHaveStyle({ '--w-custom': '2rem', '--h-custom': '2rem' });
    });

    it('renders question mark when no name is provided', () => {
        render(<UserAvatar name="" />);
        const avatar = screen.getByTestId('user-avatar');
        expect(avatar).toHaveTextContent(greekLetter);
    });

    it('applies custom color when provided with hue', () => {
        render(<UserAvatar name="John Doe" color={{ hue: 180 }} />);
        const avatar = screen.getByTestId('user-avatar');
        expect(avatar).toHaveStyle({ backgroundColor: 'hsl(180, 100%, 90%)' });
    });

    it('applies custom color when provided with hsl string', () => {
        render(<UserAvatar name="John Doe" color={{ hsl: 'hsl(120, 100%, 50%)' }} />);
        const avatar = screen.getByTestId('user-avatar');
        expect(avatar).toHaveStyle({ backgroundColor: 'hsl(120, 100%, 90%)' });
    });
});
