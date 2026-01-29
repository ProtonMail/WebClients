import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { CopyLinkButton } from './CopyLinkButton';

describe('CopyLinkButton', () => {
    describe('toolbar button', () => {
        it('should call onClick when clicked', async () => {
            const onClick = jest.fn();
            render(<CopyLinkButton buttonType="toolbar" onClick={onClick} />);

            const button = screen.getByTestId('toolbar-copy-link');
            fireEvent.click(button);

            await waitFor(() => {
                expect(onClick).toHaveBeenCalledTimes(1);
            });
        });

        it('should handle async onClick', async () => {
            const onClick = jest.fn().mockImplementation(() => {
                return new Promise((resolve) => {
                    setTimeout(resolve, 50);
                });
            });
            render(<CopyLinkButton buttonType="toolbar" onClick={onClick} />);

            const button = screen.getByTestId('toolbar-copy-link');
            fireEvent.click(button);

            await waitFor(() => {
                expect(onClick).toHaveBeenCalledTimes(1);
            });
        });

        it('should not throw when clicking multiple times', async () => {
            const onClick = jest.fn();
            render(<CopyLinkButton buttonType="toolbar" onClick={onClick} />);

            const button = screen.getByTestId('toolbar-copy-link');
            fireEvent.click(button);
            fireEvent.click(button);

            await waitFor(() => {
                expect(onClick).toHaveBeenCalled();
            });
        });
    });

    describe('context menu button', () => {
        it('should call onClick when clicked', async () => {
            const onClick = jest.fn();
            const close = jest.fn();
            render(<CopyLinkButton buttonType="contextMenu" onClick={onClick} close={close} />);

            const button = screen.getByTestId('context-menu-copy-link');
            fireEvent.click(button);

            await waitFor(() => {
                expect(onClick).toHaveBeenCalledTimes(1);
            });
        });

        it('should handle async onClick', async () => {
            const onClick = jest.fn().mockImplementation(() => {
                return new Promise((resolve) => {
                    setTimeout(resolve, 50);
                });
            });
            const close = jest.fn();
            render(<CopyLinkButton buttonType="contextMenu" onClick={onClick} close={close} />);

            const button = screen.getByTestId('context-menu-copy-link');
            fireEvent.click(button);

            await waitFor(() => {
                expect(onClick).toHaveBeenCalledTimes(1);
            });
        });
    });
});
