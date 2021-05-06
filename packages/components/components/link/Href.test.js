import React from 'react';
import { render } from '@testing-library/react';

import Href from './Href';

describe('Href component', () => {
    const url = 'https://protonmail.com';
    const text = 'panda';

    it('should render a link with proper attributes', () => {
        const { getByText } = render(<Href url={url}>{text}</Href>);
        const linkNode = getByText(text);

        expect(linkNode.getAttribute('href')).toBe(url);
        expect(linkNode.getAttribute('target')).toBe('_blank');
        expect(linkNode.getAttribute('rel')).toBe('noopener noreferrer nofollow');
    });
});
