import React from 'react';
import { render } from '@testing-library/react';

import Button from '../button/Button';
import SubSidebar from './SubSidebar';

describe('SubSidebar component', () => {
    const text = 'chocolat';
    const list = [{ text: 'panda', id: 'panda' }, { text: 'tiger', id: 'tiger' }, { text: 'turtle', id: 'turtle' }];

    it('should render the sub sidebar properly', () => {
        const { container } = render(
            <SubSidebar activeSection={list[0].id} list={list}>
                <Button>{text}</Button>
            </SubSidebar>
        );

        const anchors = [].slice.call(container.querySelectorAll('a'));
        const buttonNode = container.querySelector('button');

        expect(anchors.length).toBe(3);
        expect(buttonNode).not.toBe(null);
        expect(buttonNode.textContent).toBe(text);

        anchors.forEach((anchor, index) => {
            expect(anchor.getAttribute('href')).toBe(null);
            expect(anchor.textContent).toBe(list[index].text);
        });

        expect(anchors[0].getAttribute('aria-current')).toBe('true');
    });
});
