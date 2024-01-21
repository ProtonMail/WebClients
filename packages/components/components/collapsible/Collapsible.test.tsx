import { fireEvent, render } from '@testing-library/react';

import Collapsible from './Collapsible';
import CollapsibleContent from './CollapsibleContent';
import CollapsibleHeader from './CollapsibleHeader';

// test accessibility?

describe('<Collapsible />', () => {
    it('renders only the header by default', () => {
        const { getByTestId } = render(
            <Collapsible>
                <CollapsibleHeader>Header</CollapsibleHeader>
                <CollapsibleContent>Content</CollapsibleContent>
            </Collapsible>
        );
        const header = getByTestId('collapsible-header');
        const content = getByTestId('collapsible-content');

        expect(header.textContent).toBe('Header');
        expect(content).not.toBeVisible();
    });

    it('renders content when expandByDefault is true', () => {
        const { getByTestId } = render(
            <Collapsible expandByDefault>
                <CollapsibleHeader>Header</CollapsibleHeader>
                <CollapsibleContent>Content</CollapsibleContent>
            </Collapsible>
        );
        const content = getByTestId('collapsible-content');

        expect(content.textContent).toBe('Content');
        expect(content).toBeVisible();
    });

    it('toggles content when header is clicked', async () => {
        const { getByTestId } = render(
            <Collapsible>
                <CollapsibleHeader>Header</CollapsibleHeader>
                <CollapsibleContent>Content</CollapsibleContent>
            </Collapsible>
        );

        const header = getByTestId('collapsible-header');
        const content = getByTestId('collapsible-content');

        expect(content).not.toBeVisible();

        fireEvent.click(header);
        expect(content).toBeVisible();

        fireEvent.click(header);
        expect(content).not.toBeVisible();
    });
});
