import type { ReactNode } from 'react';
import { useState } from 'react';

import { act, fireEvent, queryByTestId, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Button } from '@proton/atoms/Button/Button';
import type { ThemeColorUnion } from '@proton/colors/types';

import Prompt from './Prompt';

// Mocked so that the modal renders in the same container
jest.mock('react-dom', () => {
    const original = jest.requireActual('react-dom');
    return {
        ...original,
        createPortal: (node: any) => node,
    };
});
const Container = ({
    children,
    buttons,
    onClose = () => {},
    open: initialOpen = false,
}: {
    children: ReactNode;
    buttons: React.ComponentProps<typeof Prompt>['buttons'];
    open?: boolean;
    onSubmit?: () => void;
    onClose?: () => void;
}) => {
    const [open, setOpen] = useState(initialOpen);
    return (
        <>
            <Button data-testid="open-button" onClick={() => setOpen(true)} />
            <Prompt open={open} onClose={onClose} buttons={buttons}>
                {children}
            </Prompt>
        </>
    );
};

const getOutModal = (container: Element) => {
    return container.querySelector('.modal-two--out');
};

const getDialog = () => document.querySelector<HTMLElement>('.modal-two-dialog')!;

describe('Prompt Hotkeys', () => {
    it('should not click the cancel button', () => {
        const spy = jest.fn();
        const { container } = render(
            <Container
                open={true}
                buttons={
                    <Button color="weak" onClick={spy}>
                        Cancel!
                    </Button>
                }
            >
                <div data-testid="inner">Hello world!</div>
            </Container>
        );
        const el = queryByTestId(container, 'inner');
        expect(getOutModal(container)).toBeNull();
        expect(el).toHaveTextContent('Hello world!');
        fireEvent.keyDown(getDialog(), { key: 'Enter' });
        expect(spy).not.toHaveBeenCalled();
    });

    test.each([{ buttonType: 'norm' }, { buttonType: 'warning' }, { buttonType: 'success' }, { buttonType: 'info' }])(
        'should click on the $buttonType button',
        ({ buttonType }) => {
            const spy = jest.fn();
            const { container } = render(
                <Container
                    open={true}
                    buttons={
                        <Button color={buttonType as ThemeColorUnion} onClick={spy}>
                            Test
                        </Button>
                    }
                >
                    <div data-testid="inner">Hello world!</div>
                </Container>
            );
            const el = queryByTestId(container, 'inner');
            expect(getOutModal(container)).toBeNull();
            expect(el).toHaveTextContent('Hello world!');
            fireEvent.keyDown(getDialog(), { key: 'Enter' });
            expect(spy).toHaveBeenCalled();
        }
    );

    it("shouldn't click on destructive buttons", () => {
        const spy = jest.fn();
        render(
            <Container
                open={true}
                buttons={
                    <Button color="danger" onClick={spy}>
                        Delete me!
                    </Button>
                }
            >
                <div data-testid="inner">Hello world!</div>
            </Container>
        );
        fireEvent.keyDown(getDialog(), { key: 'Enter' });
        expect(spy).not.toHaveBeenCalled();
    });
    it('should click the second button', () => {
        const cancelSpy = jest.fn();
        const submitSpy = jest.fn();
        render(
            <Container
                open={true}
                buttons={[
                    <Button color="weak" onClick={cancelSpy}>
                        Cancel
                    </Button>,
                    <Button color="norm" onClick={submitSpy}>
                        Ok!
                    </Button>,
                ]}
            >
                <div data-testid="inner">Hello world!</div>
            </Container>
        );
        fireEvent.keyDown(getDialog(), { key: 'Enter' });
        expect(cancelSpy).not.toHaveBeenCalled();
        expect(submitSpy).toHaveBeenCalled();
    });

    describe('when an element inside the prompt has focus', () => {
        const renderWithCancelAndConfirm = () => {
            const cancelSpy = jest.fn();
            const confirmSpy = jest.fn();
            render(
                <Container
                    open={true}
                    buttons={[
                        <Button color="norm" onClick={confirmSpy}>
                            Confirm
                        </Button>,
                        <Button onClick={cancelSpy}>Cancel</Button>,
                    ]}
                >
                    <input aria-label="Name" />
                </Container>
            );
            return { cancelSpy, confirmSpy };
        };

        const focus = (element: HTMLElement) => act(() => element.focus());

        it.each(['{Enter}', ' '])('runs only the focused Cancel button on %s', async (key) => {
            const { cancelSpy, confirmSpy } = renderWithCancelAndConfirm();
            focus(screen.getByRole('button', { name: 'Cancel', hidden: true }));

            await userEvent.keyboard(key);

            expect(confirmSpy).not.toHaveBeenCalled();
            expect(cancelSpy).toHaveBeenCalledTimes(1);
        });

        it.each(['{Enter}', ' '])('runs the focused confirm button once on %s', async (key) => {
            const { cancelSpy, confirmSpy } = renderWithCancelAndConfirm();
            focus(screen.getByRole('button', { name: 'Confirm', hidden: true }));

            await userEvent.keyboard(key);

            expect(confirmSpy).toHaveBeenCalledTimes(1);
            expect(cancelSpy).not.toHaveBeenCalled();
        });

        it('does not confirm while typing in a field', async () => {
            const { confirmSpy } = renderWithCancelAndConfirm();
            const input = screen.getByRole('textbox', { name: 'Name', hidden: true });
            focus(input);

            await userEvent.keyboard('a b{Enter}');

            expect(input).toHaveValue('a b');
            expect(confirmSpy).not.toHaveBeenCalled();
        });
    });
});
