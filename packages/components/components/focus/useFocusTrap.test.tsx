import { ReactNode, useRef, useState } from 'react';
import { waitFor, render, fireEvent } from '@testing-library/react';
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

    it('should not focus the first focusable element', () => {
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
        expect(getByTestId('auto-focus')).not.toHaveFocus();
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

    it('should focus first fallback if requested', () => {
        const Component = () => {
            const rootRef = useRef<HTMLDivElement>(null);
            const props = useFocusTrap({ rootRef });
            return (
                <div ref={rootRef} {...props} data-testid="root">
                    <div data-testid="div" data-focus-trap-fallback="0" tabIndex={-1} />
                    <button data-testid="button" />
                </div>
            );
        };
        const { getByTestId } = render(<Component />);
        expect(getByTestId('div')).toHaveFocus();
    });

    it('should set tabIndex on root when active', () => {
        const Component = () => {
            const [active, setActive] = useState(false);
            const rootRef = useRef<HTMLDivElement>(null);
            const props = useFocusTrap({ active, rootRef });
            return (
                <div ref={rootRef} {...props} data-testid="root">
                    <button data-testid="button" autoFocus onClick={() => setActive(!active)} />
                </div>
            );
        };
        const { getByTestId } = render(<Component />);
        expect(getByTestId('root')).not.toHaveAttribute('tabIndex', '-1');
        const openerButton = getByTestId('button');
        openerButton.click();
        expect(getByTestId('root')).toHaveAttribute('tabIndex', '-1');
        openerButton.click();
        expect(getByTestId('root')).not.toHaveAttribute('tabIndex', '-1');
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

    it('should not restore focus if closed by click', async () => {
        const Component = () => {
            const [open, setOpen] = useState(false);
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
        fireEvent.mouseUp(openerButton);
        fireEvent.click(openerButton);
        expect(getByTestId('input')).toHaveFocus();
        const closeButton = getByTestId('close');
        fireEvent.mouseUp(closeButton);
        fireEvent.click(closeButton);
        await waitFor(() => {
            expect(openerButton).not.toHaveFocus();
        });
    });

    it('should restore focus if closed by keyboard', async () => {
        const Component = () => {
            const [open, setOpen] = useState(false);
            const rootRef = useRef<HTMLDivElement>(null);
            const props = useFocusTrap({ rootRef, active: open });
            return (
                <div>
                    <button data-testid="button" onClick={() => setOpen(true)} />
                    {open && (
                        <div {...props} ref={rootRef}>
                            <input autoFocus data-testid="input" onKeyDown={() => setOpen(false)} />
                        </div>
                    )}
                </div>
            );
        };
        const { getByTestId } = render(<Component />);
        const openerButton = getByTestId('button');
        openerButton.focus();
        fireEvent.mouseUp(openerButton);
        fireEvent.click(openerButton);
        expect(getByTestId('input')).toHaveFocus();
        fireEvent.keyDown(getByTestId('input'), { key: 'Esc' });
        await waitFor(() => {
            expect(openerButton).toHaveFocus();
        });
    });

    // TODO: Broken with latest jsdom
    it.skip('should not restore focus when another trap overrides it', async () => {
        const Dropdown = ({ open, children }: { open: boolean; children: ReactNode }) => {
            const rootRef = useRef<HTMLDivElement>(null);
            const props = useFocusTrap({ rootRef, active: open });
            return (
                <>
                    {open && (
                        <div {...props} ref={rootRef}>
                            {children}
                        </div>
                    )}
                </>
            );
        };
        const Component = () => {
            const [open, setOpen] = useState(false);
            const [open2nd, setOpen2nd] = useState(false);
            return (
                <div>
                    <button data-testid="button1" onClick={() => setOpen(!open)} />
                    <Dropdown open={open}>
                        <input autoFocus data-testid="input1" />
                    </Dropdown>
                    <button data-testid="button2" onClick={() => setOpen2nd(!open2nd)} />
                    <Dropdown open={open2nd}>
                        <input autoFocus data-testid="input2" />
                    </Dropdown>
                </div>
            );
        };
        const { getByTestId } = render(<Component />);
        const openerButton = getByTestId('button1');
        openerButton.focus();
        openerButton.click();
        await waitFor(() => {
            expect(getByTestId('input1')).toHaveFocus();
        });
        const openerButton2 = getByTestId('button2');
        openerButton2.focus();
        openerButton2.click();
        await waitFor(() => {
            expect(getByTestId('input2')).toHaveFocus();
        });
        openerButton.click();
        await waitFor(() => {
            expect(getByTestId('input2')).toHaveFocus();
        });
        openerButton2.click();
        await waitFor(() => {
            expect(openerButton2).toHaveFocus();
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

    it('should contain focus when elements are deleted', async () => {
        jest.useFakeTimers();

        const Component = () => {
            const rootRef = useRef<HTMLDivElement>(null);
            const [hidden, setHidden] = useState(false);
            const props = useFocusTrap({ rootRef });
            return (
                <div {...props} ref={rootRef} data-testid="root">
                    {!hidden && <button data-testid="1" autoFocus onClick={() => setHidden(true)} />}
                </div>
            );
        };
        const { getByTestId } = render(<Component />);
        expect(getByTestId('1')).toHaveFocus();
        fireEvent.click(getByTestId('1'));
        jest.runOnlyPendingTimers();
        expect(getByTestId('root')).toHaveFocus();

        jest.useRealTimers();
    });
});
