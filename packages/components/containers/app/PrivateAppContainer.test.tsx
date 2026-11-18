import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PrivateMainArea from '../layout/PrivateMainArea';
import { MAIN_CONTENT_ID } from '../layout/constants';
import PrivateAppContainer from './PrivateAppContainer';

const renderApp = () =>
    render(
        <PrivateAppContainer
            top={<a href="#upgrade">Upgrade</a>}
            sidebar={
                <nav>
                    <a href="#dashboard">Dashboard</a>
                    <a href="#settings">Settings</a>
                </nav>
            }
        >
            <PrivateMainArea>
                <button type="button">Default language</button>
            </PrivateMainArea>
        </PrivateAppContainer>
    );

describe('PrivateAppContainer skip link', () => {
    it('is the first Tab stop, before the top banners and the sidebar', async () => {
        renderApp();

        await userEvent.tab();

        expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveFocus();
    });

    it('moves focus to the main content without changing the URL hash', async () => {
        renderApp();
        const hashBefore = window.location.hash;

        await userEvent.tab();
        await userEvent.keyboard('{Enter}');

        expect(screen.getByRole('main')).toHaveFocus();
        expect(window.location.hash).toBe(hashBefore);
    });

    it('lets the next Tab reach the first control in the main content', async () => {
        renderApp();

        await userEvent.tab();
        await userEvent.keyboard('{Enter}');
        await userEvent.tab();

        expect(screen.getByRole('button', { name: 'Default language' })).toHaveFocus();
    });

    it('keeps targeting the main content when a caller passes its own id', () => {
        render(
            <PrivateAppContainer sidebar={null}>
                {/* @ts-expect-error id is not a prop, it is always MAIN_CONTENT_ID */}
                <PrivateMainArea id="custom-id" />
            </PrivateAppContainer>
        );

        expect(screen.getByRole('main')).toHaveAttribute('id', MAIN_CONTENT_ID);
    });

    it('focuses the page content column when the view has no main content, without changing the URL hash', () => {
        render(
            <PrivateAppContainer sidebar={null}>
                <p>Loading</p>
            </PrivateAppContainer>
        );
        const link = screen.getByRole('link', { name: 'Skip to main content' });
        const click = createEvent.click(link);

        fireEvent(link, click);

        expect(click.defaultPrevented).toBe(true);
        expect(screen.getByText('Loading').parentElement).toHaveFocus();
    });
});
