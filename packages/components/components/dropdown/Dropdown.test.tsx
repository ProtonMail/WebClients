import { ReactNode, useRef, useState } from 'react';

import { fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Dropdown from './Dropdown';
import DropdownButton from './DropdownButton';

const Test = ({
    children,
    dropdownProps,
    ...rest
}: {
    children: ReactNode;
    dropdownProps?: any;
    [key: string]: any;
}) => {
    const anchorRef = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);
    return (
        <>
            <DropdownButton
                ref={anchorRef}
                isOpen={open}
                onClick={() => {
                    setOpen(true);
                }}
                {...rest}
            >
                Open
            </DropdownButton>
            <Dropdown
                isOpen={open}
                anchorRef={anchorRef}
                onClose={() => {
                    setOpen(false);
                }}
                {...dropdownProps}
            >
                {children}
            </Dropdown>
        </>
    );
};

describe('<Dropdown />', () => {
    it('should show a dropdown when opened', async () => {
        const { getByTestId, queryByTestId } = render(
            <Test data-testid="dropdown-open">
                <div data-testid="dropdown-inner">Hello world</div>
            </Test>
        );

        expect(queryByTestId('dropdown-inner')).toBeNull();
        await userEvent.click(getByTestId('dropdown-open'));
        expect(getByTestId('dropdown-inner')).toBeVisible();
    });

    it('should auto close when open', async () => {
        const { getByTestId, queryByTestId } = render(
            <div>
                <div data-testid="outside">outside dropdown</div>
                <Test data-testid="dropdown-open" dropdownProps={{ 'data-testid': 'dropdown' }}>
                    <div data-testid="dropdown-inner">Hello world</div>
                </Test>
            </div>
        );

        await userEvent.click(getByTestId('dropdown-open'));
        expect(getByTestId('dropdown')).toBeVisible();
        await userEvent.click(getByTestId('outside'));
        fireEvent.animationEnd(getByTestId('dropdown'), { animationName: 'anime-dropdown-out' });
        expect(queryByTestId('dropdown-test')).toBeNull();
    });
});
