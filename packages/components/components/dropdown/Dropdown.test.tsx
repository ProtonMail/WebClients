import type { ReactNode } from 'react';
import { useRef, useState } from 'react';

import { fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { DropdownProps } from '@proton/components/components/dropdown/Dropdown';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';

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
        expect(queryByTestId('dropdown')).toBeNull();
    });

    it('should auto close when clicked inside a dropdown', async () => {
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
        await userEvent.click(getByTestId('dropdown-inner'));
        fireEvent.animationEnd(getByTestId('dropdown'), { animationName: 'anime-dropdown-out' });
        expect(queryByTestId('dropdown')).toBeNull();
    });

    it('should auto close when clicked inside a dropdown through keyboard event', async () => {
        const { getByTestId, queryByTestId } = render(
            <div>
                <div data-testid="outside">outside dropdown</div>
                <Test data-testid="dropdown-open" dropdownProps={{ 'data-testid': 'dropdown' }}>
                    <button data-testid="dropdown-inner">Hello world</button>
                </Test>
            </div>
        );

        await userEvent.click(getByTestId('dropdown-open'));
        expect(getByTestId('dropdown')).toBeVisible();
        const button = getByTestId('dropdown-inner');
        button.focus();
        await userEvent.keyboard('{Enter}');
        fireEvent.animationEnd(getByTestId('dropdown'), { animationName: 'anime-dropdown-out' });
        expect(queryByTestId('dropdown')).toBeNull();
    });

    it('should not auto close when clicked inside a dropdown through keyboard event', async () => {
        const Test2 = () => {
            const [state, setState] = useState('1');
            return (
                <div>
                    <div data-testid="outside">outside dropdown</div>
                    <Test data-testid="dropdown-open" dropdownProps={{ 'data-testid': 'dropdown' }}>
                        <input
                            type="radio"
                            data-testid="dropdown-inner-1"
                            value="1"
                            name="inputs"
                            checked={state === '1'}
                            onChange={() => setState('1')}
                        />
                        <input
                            type="radio"
                            data-testid="dropdown-inner-2"
                            value="2"
                            name="inputs"
                            checked={state === '2'}
                            onChange={() => setState('2')}
                        />
                        <button data-testid="dropdown-inner-button">Submit</button>
                    </Test>
                </div>
            );
        };
        const { getByTestId, queryByTestId } = render(<Test2 />);

        await userEvent.click(getByTestId('dropdown-open'));
        expect(getByTestId('dropdown')).toBeVisible();
        const input1 = getByTestId('dropdown-inner-1');
        const input2 = getByTestId('dropdown-inner-2');
        expect(input1).toBeChecked();
        expect(input2).not.toBeChecked();
        input1.focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(input2).toBeChecked();
        expect(getByTestId('dropdown')).toBeVisible();
        fireEvent.animationEnd(getByTestId('dropdown'), { animationName: 'anime-dropdown-out' });
        expect(getByTestId('dropdown')).toBeVisible();

        const button = getByTestId('dropdown-inner-button');
        button.focus();
        await userEvent.keyboard('{Enter}');
        fireEvent.animationEnd(getByTestId('dropdown'), { animationName: 'anime-dropdown-out' });
        expect(queryByTestId('dropdown')).toBeNull();
    });

    describe('dropdown size', () => {
        const Test = (props: { size: DropdownProps['size'] }) => {
            const ref = useRef<HTMLDivElement>(null);
            return (
                <Dropdown anchorRef={ref} isOpen={true} data-testid="dropdown" {...props}>
                    hello
                </Dropdown>
            );
        };

        it('should should set initial on viewport max size', async () => {
            const { getByTestId } = render(
                <Test size={{ maxWidth: DropdownSizeUnit.Viewport, maxHeight: DropdownSizeUnit.Viewport }} />
            );
            expect(getByTestId('dropdown')).toHaveStyle('--custom-max-width: initial; --custom-max-height: initial');
        });

        it('should should set custom max height', async () => {
            const { getByTestId } = render(<Test size={{ maxWidth: DropdownSizeUnit.Viewport, maxHeight: '13em' }} />);
            expect(getByTestId('dropdown')).toHaveStyle('--custom-max-width: initial; --custom-max-height: 13em');
        });

        it('should should set custom height', async () => {
            const { getByTestId } = render(
                <Test size={{ height: '15px', maxWidth: DropdownSizeUnit.Viewport, maxHeight: '13em' }} />
            );
            expect(getByTestId('dropdown')).toHaveStyle(
                '--height: 15px; --custom-max-width: initial; --custom-max-height: 13em'
            );
        });

        it('should should set custom width', async () => {
            const { getByTestId } = render(
                <Test
                    size={{
                        width: '13px',
                        height: '15px',
                        maxWidth: '13em',
                        maxHeight: DropdownSizeUnit.Viewport,
                    }}
                />
            );
            expect(getByTestId('dropdown')).toHaveStyle(
                '--width: 13px; --height: 15px; --custom-max-width: 13em; --custom-max-height: initial'
            );
        });
    });
});
