import { useRef } from 'react';
import { MemoryRouter, Route, Switch } from 'react-router';
import { Link } from 'react-router-dom';

import { fireEvent, render, screen } from '@testing-library/react';

import { useFocusMainOnNavigation } from './useFocusMainOnNavigation';

const Page = ({ title }: { title?: string }) => {
    const mainRef = useRef<HTMLElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);

    useFocusMainOnNavigation(mainRef, titleRef);

    return (
        <main ref={mainRef} tabIndex={-1} data-testid="main">
            {title && (
                <h1 ref={titleRef} tabIndex={-1}>
                    {title}
                </h1>
            )}
            <Link to="/second">Content link</Link>
        </main>
    );
};

const renderApp = (initialEntry = '/first') =>
    render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <nav className="sidebar">
                <Link to="/second">Sidebar link</Link>
                <Link to="/no-title">Sidebar link without title</Link>
                <Link to="/second#section">Sidebar link with hash</Link>
            </nav>
            <Switch>
                <Route path="/first">
                    <Page title="First page" />
                </Route>
                <Route path="/second">
                    <Page title="Second page" />
                </Route>
                <Route path="/no-title">
                    <Page />
                </Route>
            </Switch>
        </MemoryRouter>
    );

const navigateWith = (name: string) => {
    const link = screen.getByRole('link', { name });
    link.focus();
    fireEvent.click(link);
};

describe('useFocusMainOnNavigation', () => {
    it('focuses the page title when navigating from the sidebar', () => {
        renderApp();

        navigateWith('Sidebar link');

        expect(screen.getByRole('heading', { name: 'Second page' })).toHaveFocus();
    });

    it('focuses the main area when the page has no title', () => {
        renderApp();

        navigateWith('Sidebar link without title');

        expect(screen.getByTestId('main')).toHaveFocus();
    });

    it('keeps focus when navigating from outside the sidebar', () => {
        renderApp();

        const link = screen.getByRole('link', { name: 'Content link' });
        link.focus();
        fireEvent.click(link);

        expect(screen.getByRole('heading', { name: 'Second page' })).not.toHaveFocus();
    });

    it('keeps focus when navigating to a fragment', () => {
        renderApp();

        navigateWith('Sidebar link with hash');

        expect(screen.getByRole('link', { name: 'Sidebar link with hash' })).toHaveFocus();
    });

    it('does not take focus on initial render', () => {
        renderApp('/second');

        expect(screen.getByRole('heading', { name: 'Second page' })).not.toHaveFocus();
    });
});
