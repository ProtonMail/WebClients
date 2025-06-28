import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { fireEvent, queryByTestId, render, screen } from '@testing-library/react';

import { Button } from '@proton/atoms';
import type { HotkeyTuple } from '@proton/components/hooks/useHotkeys';

import ModalTwo from './Modal';

// Mocked so that the modal renders in the same container
jest.mock('react-dom', () => {
    const original = jest.requireActual('react-dom');
    return {
        ...original,
        createPortal: (node: any) => node,
    };
});

const Inner = ({ onMount }: { onMount: () => void }) => {
    useEffect(() => {
        onMount();
    }, []);
    return <div data-testid="inner">I'm only mounted once</div>;
};

const MyModal = ({
    open,
    onClose,
    children,
    disableCloseOnEscape,
    hotkeys,
}: {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    disableCloseOnEscape?: boolean;
    hotkeys?: HotkeyTuple[];
}) => {
    return (
        <ModalTwo open={open} onClose={onClose} disableCloseOnEscape={disableCloseOnEscape} hotkeys={hotkeys}>
            {children}
            <Button data-testid="close-button" onClick={onClose} />
        </ModalTwo>
    );
};

const Container = ({
    children,
    open: initialOpen = false,
    hotkeys = [],
    disableCloseOnEscape,
}: {
    children: ReactNode;
    open?: boolean;
    disableCloseOnEscape?: boolean;
    hotkeys?: HotkeyTuple[];
}) => {
    const [open, setOpen] = useState(initialOpen);
    return (
        <>
            <Button data-testid="open-button" onClick={() => setOpen(true)} />
            <MyModal
                open={open}
                hotkeys={hotkeys}
                onClose={() => setOpen(false)}
                disableCloseOnEscape={disableCloseOnEscape}
            >
                {children}
            </MyModal>
        </>
    );
};

const getOutModal = (container: Element) => {
    return container.querySelector('.modal-two--out');
};
const maybeTriggerOutAnimation = (div?: Element | null) => {
    if (!div) {
        return;
    }
    fireEvent.animationEnd(div, { animationName: 'anime-modal-two-out' });
};

describe('ModalTwo rendering', () => {
    it('should not render children when closed', () => {
        const { queryByTestId } = render(
            <ModalTwo>
                <div data-testid="inner">Not rendered</div>
            </ModalTwo>
        );
        expect(queryByTestId('inner')).toBeNull();
    });

    it('should render children when open', () => {
        const { queryByTestId } = render(
            <ModalTwo open>
                <div data-testid="inner">Rendered</div>
            </ModalTwo>
        );
        expect(queryByTestId('inner')).toHaveTextContent('Rendered');
    });

    it('should render children when going from closed to open', () => {
        const { getByTestId, queryByTestId } = render(
            <Container>
                <div data-testid="inner">Rendered</div>
            </Container>
        );
        expect(queryByTestId('inner')).toBeNull();
        fireEvent.click(getByTestId('open-button'));
        expect(queryByTestId('inner')).toHaveTextContent('Rendered');
    });

    it('should not render children when going from open to closed', () => {
        const { container, getByTestId, queryByTestId } = render(
            <Container open>
                <div data-testid="inner">Rendered</div>
            </Container>
        );
        expect(getOutModal(container)).toBeNull();
        expect(queryByTestId('inner')).toHaveTextContent('Rendered');
        fireEvent.click(getByTestId('close-button'));
        maybeTriggerOutAnimation(getOutModal(container));
        expect(queryByTestId('inner')).toBeNull();
    });

    it('should only trigger mount once per render', async () => {
        const handleMount = jest.fn();
        const { container, getByTestId, queryByTestId } = render(
            <Container>
                <Inner onMount={handleMount} />
            </Container>
        );

        const run = (n: number) => {
            expect(getOutModal(container)).toBeNull();
            expect(handleMount).toHaveBeenCalledTimes(n);
            expect(queryByTestId('inner')).toBeNull();

            fireEvent.click(getByTestId('open-button'));
            expect(getOutModal(container)).toBeNull();
            expect(handleMount).toHaveBeenCalledTimes(n + 1);
            expect(queryByTestId('inner')).toHaveTextContent('mounted once');

            fireEvent.click(getByTestId('close-button'));
            maybeTriggerOutAnimation(getOutModal(container));
            expect(queryByTestId('inner')).toBeNull();
            expect(handleMount).toHaveBeenCalledTimes(n + 1);
        };

        run(0);
        run(1);
        run(2);
    });

    it('should only trigger mount once per render if initially opened', async () => {
        const handleMount = jest.fn();
        const { container, getByTestId, queryByTestId } = render(
            <Container open={true}>
                <Inner onMount={handleMount} />
            </Container>
        );

        const run = (n: number) => {
            expect(getOutModal(container)).toBeNull();
            expect(handleMount).toHaveBeenCalledTimes(n);
            expect(queryByTestId('inner')).toHaveTextContent('mounted once');

            fireEvent.click(getByTestId('close-button'));
            maybeTriggerOutAnimation(getOutModal(container));
            expect(queryByTestId('inner')).toBeNull();
            expect(handleMount).toHaveBeenCalledTimes(n);

            fireEvent.click(getByTestId('open-button'));
            expect(getOutModal(container)).toBeNull();
            expect(handleMount).toHaveBeenCalledTimes(n + 1);
            expect(queryByTestId('inner')).toHaveTextContent('mounted once');
        };

        run(1);
        run(2);
        run(3);
    });
});

describe('ModalTwo Hotkeys', () => {
    it('should close on esc', () => {
        const { container, getByTestId, queryByTestId } = render(
            <Container open={true}>
                <div data-testid="inner">Rendered</div>
            </Container>
        );
        expect(getOutModal(container)).toBeNull();
        expect(queryByTestId('inner')).toHaveTextContent('Rendered');
        fireEvent.keyDown(getByTestId('close-button'), { key: 'Escape' });
        maybeTriggerOutAnimation(getOutModal(container));
        expect(queryByTestId('inner')).toBeNull();
    });

    it('should not close on esc if disabled', () => {
        const { container, getByTestId, queryByTestId } = render(
            <Container open={true} disableCloseOnEscape>
                <div data-testid="inner">Rendered</div>
            </Container>
        );
        expect(getOutModal(container)).toBeNull();
        expect(queryByTestId('inner')).toHaveTextContent('Rendered');
        fireEvent.keyDown(getByTestId('close-button'), { key: 'Escape' });
        maybeTriggerOutAnimation(getOutModal(container));
        expect(queryByTestId('inner')).toHaveTextContent('Rendered');
    });
});

describe('ModalTwo Hotkeys', () => {
    it('should allow extra hotkeys', () => {
        const spy = jest.fn();
        const { container, getByTestId } = render(
            <Container
                open={true}
                hotkeys={[
                    [
                        'Enter',
                        () => {
                            spy();
                        },
                    ],
                ]}
            >
                <div data-testid="inner">Hello world!</div>
            </Container>
        );
        expect(getOutModal(container)).toBeNull();
        expect(queryByTestId(container, 'inner')).toHaveTextContent('Hello world!');
        fireEvent.keyDown(getByTestId('close-button'), { key: 'Enter' });
        expect(spy).toHaveBeenCalled();
    });
});

/**
 * Due to a JSDom issue `dialog` tag is not understood correctly
 * Delete this test when the Jest will implement the fix
 * - Issue: https://github.com/jsdom/jsdom/issues/3294
 * - Fix pull request: https://github.com/jsdom/jsdom/pull/3403
 */
describe('ModalTwo GetByRole issue', () => {
    it('Content should be selectable by role', () => {
        render(
            <ModalTwo open>
                <Button>Hello</Button>
            </ModalTwo>
        );

        expect(screen.getByRole('button', { name: 'Hello' })).toBeVisible();
    });
});
