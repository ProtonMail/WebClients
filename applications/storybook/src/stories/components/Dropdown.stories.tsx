import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '@proton/atoms/Button/Button';
import Collapsible from '@proton/components/components/collapsible/Collapsible';
import CollapsibleContent from '@proton/components/components/collapsible/CollapsibleContent';
import CollapsibleHeader from '@proton/components/components/collapsible/CollapsibleHeader';
import CollapsibleHeaderIconButton from '@proton/components/components/collapsible/CollapsibleHeaderIconButton';
import type { DropdownProps } from '@proton/components/components/dropdown/Dropdown';
import Dropdown, { DropdownBorderRadius } from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import Icon from '@proton/components/components/icon/Icon';
import RadioGroup from '@proton/components/components/input/RadioGroup';
import Option from '@proton/components/components/option/Option';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';

const meta: Meta<typeof Dropdown> = {
    title: 'Components/Dropdown',
    component: Dropdown,
    parameters: {
        docs: {
            description: {
                component:
                    'A floating dropdown component anchored to a trigger element. Supports configurable size, border radius, auto-close behavior, focus trapping, and arrow navigation.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Dropdown>;

export const Default: Story = {
    render: () => {
        const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

        return (
            <>
                <DropdownButton ref={anchorRef} isOpen={isOpen} onClick={toggle} hasCaret>
                    Click me
                </DropdownButton>
                <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                    <DropdownMenu>
                        <DropdownMenuButton className="text-left">Item one</DropdownMenuButton>
                        <DropdownMenuButton className="text-left">Item two</DropdownMenuButton>
                    </DropdownMenu>
                    <div className="p-4">
                        <Button className="w-full" color="norm">
                            Action
                        </Button>
                    </div>
                </Dropdown>
            </>
        );
    },
};

export const BorderRadius: Story = {
    render: () => {
        const [borderRadius, setBorderRadius] = useState<DropdownProps['borderRadius']>(DropdownBorderRadius.MD);
        const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

        return (
            <>
                <RadioGroup
                    name="borderRadius"
                    className="mb-4"
                    onChange={(value) => setBorderRadius(value)}
                    value={borderRadius}
                    options={Object.values(DropdownBorderRadius).map((option) => ({
                        label: option,
                        value: option,
                    }))}
                />
                <DropdownButton ref={anchorRef} isOpen={isOpen} onClick={toggle} hasCaret>
                    Click me
                </DropdownButton>
                <Dropdown
                    isOpen={isOpen}
                    anchorRef={anchorRef}
                    onClose={close}
                    borderRadius={borderRadius}
                    className="p-4"
                >
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
                    et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                    aliquip ex ea commodo consequat.
                </Dropdown>
            </>
        );
    },
};

export const Size: Story = {
    render: () => {
        const [size, setSize] = useState<NonNullable<DropdownProps['size']>>({
            width: DropdownSizeUnit.Static,
            height: DropdownSizeUnit.Dynamic,
            maxHeight: '50em',
            maxWidth: '20em',
        });
        const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

        const Editor = ({
            sizeKey,
            options,
        }: Readonly<{
            sizeKey: keyof typeof size;
            options: { title: string; value: DropdownSizeUnit }[];
        }>) => {
            const value = size?.[sizeKey];
            const exists = options.find((option) => option.value === (value as any));
            return (
                <SelectTwo
                    value={exists ? value : 'custom'}
                    onChange={(change) => {
                        setSize((size) => ({
                            ...size,
                            [sizeKey]: change.value === 'custom' ? '10em' : change.value,
                        }));
                    }}
                >
                    {[...options, { title: `custom${!exists ? ` (${value})` : ''}`, value: 'custom' }].map((option) => (
                        <Option key={option.value} title={option.title} value={option.value} />
                    ))}
                </SelectTwo>
            );
        };

        const getOption = (unit: DropdownSizeUnit) => ({ title: `${unit}`, value: unit });

        return (
            <>
                <div>
                    {[
                        {
                            sizeKey: 'width' as const,
                            options: [DropdownSizeUnit.Static, DropdownSizeUnit.Dynamic, DropdownSizeUnit.Anchor],
                        },
                        {
                            sizeKey: 'height' as const,
                            options: [DropdownSizeUnit.Static, DropdownSizeUnit.Dynamic],
                        },
                        {
                            sizeKey: 'maxWidth' as const,
                            options: [DropdownSizeUnit.Viewport],
                        },
                        {
                            sizeKey: 'maxHeight' as const,
                            options: [DropdownSizeUnit.Viewport],
                        },
                    ].map((row) => (
                        <div className="flex items-center" key={row.sizeKey}>
                            <pre className="w-custom" style={{ '--w-custom': '20em' } as React.CSSProperties}>
                                {row.sizeKey}:
                            </pre>
                            <div className="flex-auto">
                                <Editor sizeKey={row.sizeKey} options={row.options.map(getOption)} />
                            </div>
                        </div>
                    ))}
                </div>
                <DropdownButton ref={anchorRef} isOpen={isOpen} onClick={toggle} hasCaret>
                    Click me to open
                </DropdownButton>
                <Dropdown
                    isOpen={isOpen}
                    anchorRef={anchorRef}
                    onClose={close}
                    size={size}
                    autoClose={false}
                    autoCloseOutside={false}
                >
                    <Collapsible className="p-4">
                        <CollapsibleHeader
                            suffix={
                                <CollapsibleHeaderIconButton>
                                    <Icon name="chevron-down" />
                                </CollapsibleHeaderIconButton>
                            }
                        >
                            Collapsible header
                        </CollapsibleHeader>
                        <CollapsibleContent>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
                            labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
                            laboris nisi ut aliquip ex ea commodo consequat.
                        </CollapsibleContent>
                    </Collapsible>
                </Dropdown>
            </>
        );
    },
};

export const NoCaret: Story = {
    render: () => {
        const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

        return (
            <>
                <DropdownButton ref={anchorRef} isOpen={isOpen} onClick={toggle}>
                    No caret dropdown
                </DropdownButton>
                <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} noCaret>
                    <DropdownMenu>
                        <DropdownMenuButton className="text-left">Item one</DropdownMenuButton>
                        <DropdownMenuButton className="text-left">Item two</DropdownMenuButton>
                    </DropdownMenu>
                </Dropdown>
            </>
        );
    },
};

export const DisableAutoClose: Story = {
    render: () => {
        const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

        return (
            <>
                <DropdownButton ref={anchorRef} isOpen={isOpen} onClick={toggle} hasCaret>
                    Click me (no auto-close)
                </DropdownButton>
                <Dropdown
                    isOpen={isOpen}
                    anchorRef={anchorRef}
                    onClose={close}
                    autoClose={false}
                    autoCloseOutside={false}
                >
                    <DropdownMenu>
                        <DropdownMenuButton className="text-left">Clicking here won't close</DropdownMenuButton>
                        <DropdownMenuButton className="text-left">Use Escape to close</DropdownMenuButton>
                    </DropdownMenu>
                </Dropdown>
            </>
        );
    },
};
