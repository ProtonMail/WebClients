import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Collapsible from '@proton/components/components/collapsible/Collapsible';
import CollapsibleContent from '@proton/components/components/collapsible/CollapsibleContent';
import { CollapsibleGroup } from '@proton/components/components/collapsible/CollapsibleGroup';
import CollapsibleHeader from '@proton/components/components/collapsible/CollapsibleHeader';
import CollapsibleHeaderButton from '@proton/components/components/collapsible/CollapsibleHeaderButton';
import CollapsibleHeaderIconButton from '@proton/components/components/collapsible/CollapsibleHeaderIconButton';
import { IcBrandProton } from '@proton/icons/icons/IcBrandProton';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';

const loremIpsum =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';

const meta: Meta<typeof Collapsible> = {
    title: 'Components/Collapsible',
    component: Collapsible,
    subcomponents: {
        CollapsibleHeader: CollapsibleHeader as any,
        CollapsibleContent: CollapsibleContent as any,
        CollapsibleHeaderButton: CollapsibleHeaderButton as any,
        CollapsibleHeaderIconButton: CollapsibleHeaderIconButton as any,
        CollapsibleGroup: CollapsibleGroup as any,
    },
    parameters: {
        docs: {
            description: {
                component:
                    'A compound component for expandable/collapsible sections. Composed of Collapsible, CollapsibleHeader, CollapsibleContent, and toggle button subcomponents.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
    render: () => (
        <Collapsible>
            <CollapsibleHeader
                suffix={
                    <CollapsibleHeaderIconButton>
                        <IcChevronDown />
                    </CollapsibleHeaderIconButton>
                }
            >
                Collapsible header
            </CollapsibleHeader>
            <CollapsibleContent>{loremIpsum}</CollapsibleContent>
        </Collapsible>
    ),
};

export const ExpandedByDefault: Story = {
    render: () => (
        <Collapsible expandByDefault>
            <CollapsibleHeader
                suffix={
                    <CollapsibleHeaderIconButton>
                        <IcChevronDown />
                    </CollapsibleHeaderIconButton>
                }
            >
                Collapsible header
            </CollapsibleHeader>
            <CollapsibleContent>{loremIpsum}</CollapsibleContent>
        </Collapsible>
    ),
};

export const Disabled: Story = {
    render: () => (
        <Collapsible disabled>
            <CollapsibleHeader
                suffix={
                    <CollapsibleHeaderIconButton>
                        <IcChevronDown />
                    </CollapsibleHeaderIconButton>
                }
            >
                Disabled collapsible
            </CollapsibleHeader>
            <CollapsibleContent>{loremIpsum}</CollapsibleContent>
        </Collapsible>
    ),
};

export const IconVariants: Story = {
    render: () => (
        <>
            <Collapsible className="mb-4">
                <CollapsibleHeader
                    suffix={
                        <CollapsibleHeaderIconButton>
                            <IcChevronDown />
                        </CollapsibleHeaderIconButton>
                    }
                >
                    Chevron icon
                </CollapsibleHeader>
                <CollapsibleContent>{loremIpsum}</CollapsibleContent>
            </Collapsible>
            <Collapsible className="mb-4">
                <CollapsibleHeader
                    suffix={
                        <CollapsibleHeaderIconButton>
                            <IcBrandProton />
                        </CollapsibleHeaderIconButton>
                    }
                >
                    Proton icon
                </CollapsibleHeader>
                <CollapsibleContent>{loremIpsum}</CollapsibleContent>
            </Collapsible>
            <Collapsible>
                <CollapsibleHeader>Omitted icon</CollapsibleHeader>
                <CollapsibleContent>{loremIpsum}</CollapsibleContent>
            </Collapsible>
        </>
    ),
};

export const WithButton: Story = {
    render: () => (
        <Collapsible>
            <CollapsibleHeader suffix={<CollapsibleHeaderButton>Toggle</CollapsibleHeaderButton>}>
                Button toggle
            </CollapsibleHeader>
            <CollapsibleContent>{loremIpsum}</CollapsibleContent>
        </Collapsible>
    ),
};

export const CustomTooltipText: Story = {
    render: () => (
        <Collapsible>
            <CollapsibleHeader
                suffix={
                    <CollapsibleHeaderIconButton expandText="I can be opened" collapseText="I can be collapsed">
                        <IcChevronDown />
                    </CollapsibleHeaderIconButton>
                }
            >
                Collapsible header
            </CollapsibleHeader>
            <CollapsibleContent>{loremIpsum}</CollapsibleContent>
        </Collapsible>
    ),
};

export const DisableFullWidth: Story = {
    render: () => (
        <Collapsible>
            <CollapsibleHeader
                suffix={
                    <CollapsibleHeaderIconButton>
                        <IcChevronDown />
                    </CollapsibleHeaderIconButton>
                }
                disableFullWidth
            >
                Collapsible header not full width
            </CollapsibleHeader>
            <CollapsibleContent>{loremIpsum}</CollapsibleContent>
        </Collapsible>
    ),
};

export const DisableContainerToggle: Story = {
    render: () => (
        <Collapsible>
            <CollapsibleHeader
                suffix={
                    <CollapsibleHeaderIconButton>
                        <IcChevronDown />
                    </CollapsibleHeaderIconButton>
                }
                disableContainerToggle
            >
                Only the icon button triggers toggle
            </CollapsibleHeader>
            <CollapsibleContent>{loremIpsum}</CollapsibleContent>
        </Collapsible>
    ),
};

export const UncontrolledGroupedCollapsibles: Story = {
    render: () => (
        <CollapsibleGroup>
            <Collapsible key="0">
                <CollapsibleHeader
                    suffix={
                        <CollapsibleHeaderIconButton>
                            <IcChevronDown />
                        </CollapsibleHeaderIconButton>
                    }
                >
                    First collapsible header
                </CollapsibleHeader>
                <CollapsibleContent>{loremIpsum}</CollapsibleContent>
            </Collapsible>
            <Collapsible key="1">
                <CollapsibleHeader
                    suffix={
                        <CollapsibleHeaderIconButton>
                            <IcChevronDown />
                        </CollapsibleHeaderIconButton>
                    }
                >
                    Second collapsible header
                </CollapsibleHeader>
                <CollapsibleContent>{loremIpsum}</CollapsibleContent>
            </Collapsible>
        </CollapsibleGroup>
    ),
};

export const ControlledGroupedCollapsibles: Story = {
    render: () => {
        const [openId, setOpenId] = useState<string | null>('0');

        return (
            <CollapsibleGroup value={openId} onChange={setOpenId}>
                <Collapsible key="0">
                    <CollapsibleHeader
                        suffix={
                            <CollapsibleHeaderIconButton>
                                <IcChevronDown />
                            </CollapsibleHeaderIconButton>
                        }
                    >
                        First collapsible header
                    </CollapsibleHeader>
                    <CollapsibleContent>{loremIpsum}</CollapsibleContent>
                </Collapsible>
                <Collapsible key="1">
                    <CollapsibleHeader
                        suffix={
                            <CollapsibleHeaderIconButton>
                                <IcChevronDown />
                            </CollapsibleHeaderIconButton>
                        }
                    >
                        Second collapsible header
                    </CollapsibleHeader>
                    <CollapsibleContent>{loremIpsum}</CollapsibleContent>
                </Collapsible>
            </CollapsibleGroup>
        );
    },
};
