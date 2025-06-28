import type { ReactNode } from 'react';
import { useState } from 'react';

import { fireEvent, queryByTestId, render } from '@testing-library/react';

import { Button } from '@proton/atoms';
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
        fireEvent.keyDown(el!, { key: 'Enter' });
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
            fireEvent.keyDown(el!, { key: 'Enter' });
            expect(spy).toHaveBeenCalled();
        }
    );

    it("shouldn't click on destructive buttons", () => {
        const spy = jest.fn();
        const { container } = render(
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
        const el = queryByTestId(container, 'inner');
        fireEvent.keyDown(el!, { key: 'Enter' });
        expect(spy).not.toHaveBeenCalled();
    });
    it('should click the second button', () => {
        const cancelSpy = jest.fn();
        const submitSpy = jest.fn();
        const { container } = render(
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
        const el = queryByTestId(container, 'inner');
        fireEvent.keyDown(el!, { key: 'Enter' });
        expect(cancelSpy).not.toHaveBeenCalled();
        expect(submitSpy).toHaveBeenCalled();
    });
});
