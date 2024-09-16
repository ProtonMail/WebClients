import { useState } from 'react';

import { Button } from '@proton/atoms';
import type { DropdownProps } from '@proton/components';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    DropdownSizeUnit,
    Icon,
    Option,
    SelectTwo,
    usePopperAnchor,
} from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './Dropdown.mdx';

export default {
    component: Dropdown,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <DropdownButton ref={anchorRef} isOpen={isOpen} onClick={toggle} hasCaret>
                Click me
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
                    {['Foo', 'Bar'].map((i) => {
                        return (
                            <DropdownMenuButton className="text-left" key={i}>
                                {i}
                            </DropdownMenuButton>
                        );
                    })}
                </DropdownMenu>
                <div className="p-4">
                    <Button className="w-full" color="norm">
                        Action
                    </Button>
                </div>
            </Dropdown>
        </>
    );
};

export const Size = () => {
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
                {[...options, { title: `custom${!exists ? ` (${value})` : ''}`, value: 'custom' }].map((option) => {
                    return <Option key={option.value} title={option.title} value={option.value} />;
                })}
            </SelectTwo>
        );
    };

    const getOption = (unit: DropdownSizeUnit) => {
        return { title: `${unit}`, value: unit };
    };

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
                ].map((row) => {
                    return (
                        <div className="flex items-center">
                            <pre className="w-custom" style={{ '--w-custom': '20em' }}>
                                {row.sizeKey}:
                            </pre>
                            <div className="flex-auto">
                                <Editor sizeKey={row.sizeKey} options={row.options.map(getOption)} />
                            </div>
                        </div>
                    );
                })}
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
};
