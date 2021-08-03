import { render } from '@testing-library/react';

import LearnMore from './LearnMore';

describe('LearnMore component', () => {
    const url = 'https://protonmail.com';

    it('should contain "Learn more" and be a link', () => {
        const { getByText } = render(<LearnMore url={url} />);
        const linkNode = getByText('Learn more');

        expect(linkNode.getAttribute('href')).toBe(url);
        expect(linkNode.getAttribute('target')).toBe('_blank');
        expect(linkNode.getAttribute('rel')).toBe('noopener noreferrer nofollow');
    });
});
