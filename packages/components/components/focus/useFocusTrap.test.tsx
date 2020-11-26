import React, { useRef } from 'react';
import { wait, render, fireEvent } from '@testing-library/react';
import useFocusTrap from './useFocusTrap';

describe('FocusTrap', () => {
    let initialFocus: HTMLElement;

    beforeEach(() => {
        initialFocus = document.createElement('button');
        document.body.appendChild(initialFocus);
        initialFocus.focus();
    });

    afterEach(() => {
        document.body.removeChild(initialFocus);
    });

    it('should focus the first focusable element', () => {
        const Component = () => {
            const rootRef = useRef<HTMLDivElement>(null);
            const props = useFocusTrap({ rootRef });
            return (
                <div ref={rootRef} {...props}>
                    <input data-testid="auto-focus" />
                </div>
            );
        };
        const { getByTestId } = render(<Component />);
        expect(getByTestId('auto-focus')).toHaveFocus();
    });

    it('should focus the root element if initial setting is off', () => {
        const Component = () => {
            const rootRef = useRef<HTMLDivElement>(null);
            const props = useFocusTrap({ rootRef, enableInitialFocus: false });
            return (
                <div ref={rootRef} {...props} data-testid="root-focus">
                    <input data-testid="auto-focus" />
                </div>
            );
        };
        const { getByTestId } = render(<Component />);
        expect(getByTestId('root-focus')).toHaveFocus();
    });

    it('should respect autoFocus in children', () => {
        const Component = () => {
            const rootRef = useRef<HTMLDivElement>(null);
            const props = useFocusTrap({ rootRef });
            return (
                <div ref={rootRef} {...props}>
                    <input />
                    <input autoFocus data-testid="auto-focus" />
                </div>
            );
        };
        const { getByTestId } = render(<Component />);
        expect(getByTestId('auto-focus')).toHaveFocus();
    });

    it('should set tabIndex on root if there are focusable elements', () => {
        const Component = () => {
            const rootRef = useRef<HTMLDivElement>(null);
            const props = useFocusTrap({ rootRef });
            return (
                <div ref={rootRef} {...props} data-testid="root">
                    <button autoFocus />
                </div>
            );
        };
        const { getByTestId } = render(<Component />);
        expect(getByTestId('root')).toHaveAttribute('tabIndex', '-1');
    });

    it('should set tabIndex on root if there are no focusable elements', () => {
        const Component = () => {
            const rootRef = useRef<HTMLDivElement>(null);
            const props = useFocusTrap({ rootRef });
            return (
                <div ref={rootRef} {...props} data-testid="root">
                    <div>No focusable element</div>
                </div>
            );
        };
        const { getByTestId } = render(<Component />);
        expect(getByTestId('root')).toHaveAttribute('tabIndex', '-1');
    });

    it('should restore focus', async () => {
        const Component = () => {
            const [open, setOpen] = React.useState(false);
            const rootRef = useRef<HTMLDivElement>(null);
            const props = useFocusTrap({ rootRef, active: open });
            return (
                <div>
                    <button data-testid="button" onClick={() => setOpen(true)} />
                    {open && (
                        <div {...props} ref={rootRef}>
                            <button data-testid="close" onClick={() => setOpen(false)} />
                            <input autoFocus data-testid="input" />
                        </div>
                    )}
                </div>
            );
        };
        const { getByTestId } = render(<Component />);
        const openerButton = getByTestId('button');
        openerButton.focus();
        openerButton.click();
        expect(getByTestId('input')).toHaveFocus();
        getByTestId('close').click();
        await wait(() => {
            expect(openerButton).toHaveFocus();
        });
    });

    it('should contain focus when tabbing', async () => {
        const Component = () => {
            const rootRef = useRef<HTMLDivElement>(null);
            const props = useFocusTrap({ rootRef });
            return (
                <div>
                    <button data-testid="outside-1" />
                    <div {...props} ref={rootRef} data-testid="root">
                        <button data-testid="1" />
                        <button data-testid="2" autoFocus />
                    </div>
                    <button data-testid="outside-2" />
                </div>
            );
        };
        const { getByTestId } = render(<Component />);
        expect(getByTestId('2')).toHaveFocus();
        fireEvent.keyDown(getByTestId('2'), {
            key: 'Tab',
        });
        expect(getByTestId('1')).toHaveFocus();
        fireEvent.keyDown(getByTestId('1'), {
            key: 'Tab',
            shiftKey: true,
        });
        expect(getByTestId('2')).toHaveFocus();
    });
});
