import React from 'react';
import { render } from 'react-testing-library';

import Href from './Href';

describe('LearnMore component', () => {
    const url = 'https://protonmail.com';
    const text = 'panda';

    it('should contain "Learn more" and be a link', () => {
        const { getByText } = render(<Href url={url}>{text}</Href>);
        const linkNode = getByText(text);

        expect(linkNode.getAttribute('href')).toBe(url);
        expect(linkNode.getAttribute('target')).toBe('_blank');
        expect(linkNode.getAttribute('rel')).toBe('noopener noreferrer');
    });
});
