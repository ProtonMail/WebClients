import { MemoryRouter } from 'react-router-dom';

import { fireEvent, render, screen } from '@testing-library/react';

import { Sidebar } from './';

const { Branch, Leaf, Root } = Sidebar;

function renderInRouter(ui: React.ReactNode, { initialEntries = ['/'] } = {}) {
    return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

function UncontrolledBranch({ defaultOpen }: { defaultOpen?: boolean }) {
    return (
        <Root>
            <Branch defaultOpen={defaultOpen}>
                <Branch.Header>
                    <Branch.Text>Section</Branch.Text>
                    <Branch.Trigger />
                </Branch.Header>
                <Branch.Content>
                    <p>content</p>
                </Branch.Content>
            </Branch>
        </Root>
    );
}

function ControlledBranch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
    return (
        <Root>
            <Branch open={open} onOpenChange={onOpenChange}>
                <Branch.Header>
                    <Branch.Text>Section</Branch.Text>
                    <Branch.Trigger />
                </Branch.Header>
                <Branch.Content>
                    <p>content</p>
                </Branch.Content>
            </Branch>
        </Root>
    );
}
describe('useBranchContext', () => {
    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('throws when Branch.Header is rendered outside a Branch', () => {
        expect(() =>
            renderInRouter(
                <Root>
                    <Branch.Header>trigger</Branch.Header>
                </Root>
            )
        ).toThrow('<Branch.Header> must be used inside <Branch>');
    });

    it('throws when Branch.Trigger is rendered outside a Branch', () => {
        expect(() =>
            renderInRouter(
                <Root>
                    <Branch.Trigger />
                </Root>
            )
        ).toThrow('<Branch.Trigger> must be used inside <Branch>');
    });

    it('throws when Branch.Content is rendered outside a Branch', () => {
        expect(() =>
            renderInRouter(
                <Root>
                    <Branch.Content>
                        <p>x</p>
                    </Branch.Content>
                </Root>
            )
        ).toThrow('<Branch.Content> must be used inside <Branch>');
    });

    it('does not throw when consumers are inside a Branch', () => {
        expect(() => renderInRouter(<UncontrolledBranch />)).not.toThrow();
    });
});

describe('Branch (uncontrolled)', () => {
    it('is closed by default', () => {
        renderInRouter(<UncontrolledBranch />);
        expect(screen.getByText('content').closest('[data-component="animated-children"]')).toHaveAttribute(
            'data-state',
            'closed'
        );
    });

    it('opens when defaultOpen = true', () => {
        renderInRouter(<UncontrolledBranch defaultOpen />);
        expect(screen.getByText('content').closest('[data-component="animated-children"]')).toHaveAttribute(
            'data-state',
            'open'
        );
    });

    it('toggles open on header click', () => {
        renderInRouter(<UncontrolledBranch />);
        const trigger = screen.getByRole('button');
        const content = screen.getByText('content').closest('[data-component="animated-children"]')!;

        expect(content).toHaveAttribute('data-state', 'closed');
        fireEvent.click(trigger);
        expect(content).toHaveAttribute('data-state', 'open');
        fireEvent.click(trigger);
        expect(content).toHaveAttribute('data-state', 'closed');
    });

    it('sets aria-expanded on the header button', () => {
        renderInRouter(<UncontrolledBranch />);
        const btn = screen.getByRole('button');
        expect(btn).toHaveAttribute('aria-expanded', 'false');
        fireEvent.click(btn);
        expect(btn).toHaveAttribute('aria-expanded', 'true');
    });
});

describe('Branch (controlled)', () => {
    it('reflects the open prop', () => {
        const { rerender } = renderInRouter(<ControlledBranch open={false} onOpenChange={() => {}} />);
        expect(screen.getByText('content').closest('[data-component="animated-children"]')).toHaveAttribute(
            'data-state',
            'closed'
        );

        rerender(
            <MemoryRouter>
                <ControlledBranch open={true} onOpenChange={() => {}} />
            </MemoryRouter>
        );
        expect(screen.getByText('content').closest('[data-component="animated-children"]')).toHaveAttribute(
            'data-state',
            'open'
        );
    });

    it('calls onOpenChange with the toggled value on header click', () => {
        const onOpenChange = jest.fn();
        renderInRouter(<ControlledBranch open={false} onOpenChange={onOpenChange} />);
        fireEvent.click(screen.getByRole('button'));
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('does not mutate internal state when controlled', () => {
        const onOpenChange = jest.fn();
        renderInRouter(<ControlledBranch open={false} onOpenChange={onOpenChange} />);
        const btn = screen.getByRole('button');

        fireEvent.click(btn);

        expect(btn).toHaveAttribute('aria-expanded', 'false');
    });
});

describe('AnimatedChildren', () => {
    it('sets aria-hidden=false and no inert when open', () => {
        renderInRouter(<UncontrolledBranch defaultOpen />);
        const el = screen.getByText('content').closest('[data-component="animated-children"]')!;
        expect(el).toHaveAttribute('aria-hidden', 'false');
        expect(el).not.toHaveAttribute('inert');
    });

    it('sets aria-hidden=true and inert when closed', () => {
        renderInRouter(<UncontrolledBranch />);
        const el = screen.getByText('content').closest('[data-component="animated-children"]')!;
        expect(el).toHaveAttribute('aria-hidden', 'true');
        expect(el).toHaveAttribute('inert');
    });

    it('removes inert after opening', () => {
        renderInRouter(<UncontrolledBranch />);
        const el = screen.getByText('content').closest('[data-component="animated-children"]')!;
        expect(el).toHaveAttribute('inert');
        fireEvent.click(screen.getByRole('button'));
        expect(el).not.toHaveAttribute('inert');
    });
});

describe('depth tracking', () => {
    it('Branch at root level gets data-sidebar-depth=1', () => {
        renderInRouter(
            <Root>
                <Branch>
                    <Branch.Header data-testid="trigger">
                        <Branch.Text>L1</Branch.Text>
                    </Branch.Header>
                    <Branch.Content>
                        <p>x</p>
                    </Branch.Content>
                </Branch>
            </Root>
        );

        expect(screen.getByText('L1').closest('[data-sidebar-depth]')).toHaveAttribute('data-sidebar-depth', '1');
    });

    it('increments depth for each nesting level', () => {
        renderInRouter(
            <Root>
                <Branch defaultOpen>
                    <Branch.Header>
                        <Branch.Text>L1</Branch.Text>
                    </Branch.Header>
                    <Branch.Content>
                        <Branch defaultOpen>
                            <Branch.Header>
                                <Branch.Text>L2</Branch.Text>
                            </Branch.Header>
                            <Branch.Content>
                                <Branch>
                                    <Branch.Header>
                                        <Branch.Text>L3</Branch.Text>
                                    </Branch.Header>
                                    <Branch.Content>
                                        <p>x</p>
                                    </Branch.Content>
                                </Branch>
                            </Branch.Content>
                        </Branch>
                    </Branch.Content>
                </Branch>
            </Root>
        );

        const depths = screen
            .getAllByRole('button')
            .map((btn) => btn.closest('[data-sidebar-depth]')?.getAttribute('data-sidebar-depth'));

        expect(depths).toEqual(['1', '2', '3']);
    });

    it('Leaf at root level gets data-sidebar-depth=1', () => {
        renderInRouter(
            <Root>
                <Leaf to="/x">
                    <Leaf.Text>Item</Leaf.Text>
                </Leaf>
            </Root>
        );
        expect(screen.getByRole('link')).toHaveAttribute('data-sidebar-depth', '1');
    });

    it('Leaf inside a Branch inherits the incremented depth', () => {
        renderInRouter(
            <Root>
                <Branch defaultOpen>
                    <Branch.Header>
                        <Branch.Text>Section</Branch.Text>
                    </Branch.Header>
                    <Branch.Content>
                        <Leaf to="/x">
                            <Leaf.Text>Item</Leaf.Text>
                        </Leaf>
                    </Branch.Content>
                </Branch>
            </Root>
        );
        expect(screen.getByRole('link')).toHaveAttribute('data-sidebar-depth', '2');
    });
});

describe('Leaf', () => {
    it('does not apply active class when route does not match', () => {
        renderInRouter(
            <Root>
                <Leaf to="/about">
                    <Leaf.Text>About</Leaf.Text>
                </Leaf>
            </Root>,
            { initialEntries: ['/home'] }
        );
        expect(screen.getByRole('link')).not.toHaveClass('active');
    });

    it('applies active class when route matches', () => {
        renderInRouter(
            <Root>
                <Leaf to="/about">
                    <Leaf.Text>About</Leaf.Text>
                </Leaf>
            </Root>,
            { initialEntries: ['/about'] }
        );
        expect(screen.getByRole('link')).toHaveClass('active');
    });

    it('calls onClick when clicked', () => {
        const onClick = jest.fn();
        renderInRouter(
            <Root>
                <Leaf to="/x" onClick={onClick}>
                    <Leaf.Text>Item</Leaf.Text>
                </Leaf>
            </Root>
        );
        fireEvent.click(screen.getByRole('link'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
