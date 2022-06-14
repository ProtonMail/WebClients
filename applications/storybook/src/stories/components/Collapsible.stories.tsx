import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderButton,
    CollapsibleHeaderIconButton,
    Icon,
} from '@proton/components';

import mdx from './Collapsible.mdx';

export default {
    component: Collapsible,
    subcomponents: { CollapsibleHeader, CollapsibleContent, CollapsibleHeaderButton, CollapsibleHeaderIconButton },
    title: 'components/Collapsible',
    parameters: { docs: { page: mdx } },
};

export const Basic = () => (
    <Collapsible>
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
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
            ea commodo consequat.
        </CollapsibleContent>
    </Collapsible>
);

export const ExpandedByDefault = () => (
    <Collapsible expandByDefault>
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
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
            ea commodo consequat.
        </CollapsibleContent>
    </Collapsible>
);

export const ExpandButton = () => (
    <>
        <Collapsible className="mb1">
            <CollapsibleHeader
                suffix={
                    <CollapsibleHeaderIconButton>
                        <Icon name="chevron-down" />
                    </CollapsibleHeaderIconButton>
                }
            >
                Chevron icon
            </CollapsibleHeader>
            <CollapsibleContent>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
                ex ea commodo consequat.
            </CollapsibleContent>
        </Collapsible>
        <Collapsible className="mb1">
            <CollapsibleHeader
                suffix={
                    <CollapsibleHeaderIconButton>
                        <Icon name="brand-proton" />
                    </CollapsibleHeaderIconButton>
                }
            >
                Proton icon
            </CollapsibleHeader>
            <CollapsibleContent>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
                ex ea commodo consequat.
            </CollapsibleContent>
        </Collapsible>
        <Collapsible>
            <CollapsibleHeader>Omitted icon</CollapsibleHeader>
            <CollapsibleContent>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
                ex ea commodo consequat.
            </CollapsibleContent>
        </Collapsible>

        <Collapsible>
            <CollapsibleHeader suffix={<CollapsibleHeaderButton>Toggle</CollapsibleHeaderButton>}>
                Button
            </CollapsibleHeader>
            <CollapsibleContent>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
                ex ea commodo consequat.
            </CollapsibleContent>
        </Collapsible>
    </>
);

export const TooltipText = () => (
    <Collapsible>
        <CollapsibleHeader
            suffix={
                <CollapsibleHeaderIconButton expandText="I can be opened" collapseText="I can be collapsed">
                    <Icon name="chevron-down" />
                </CollapsibleHeaderIconButton>
            }
        >
            Collapsible header
        </CollapsibleHeader>
        <CollapsibleContent>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
            ea commodo consequat.
        </CollapsibleContent>
    </Collapsible>
);

export const FullWidth = () => (
    <Collapsible>
        <CollapsibleHeader
            suffix={
                <CollapsibleHeaderIconButton>
                    <Icon name="chevron-down" />
                </CollapsibleHeaderIconButton>
            }
            disableFullWidth
        >
            Collapsible header not full width
        </CollapsibleHeader>
        <CollapsibleContent>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
            ea commodo consequat.
        </CollapsibleContent>
    </Collapsible>
);

export const TogglableContainer = () => (
    <Collapsible>
        <CollapsibleHeader
            suffix={
                <CollapsibleHeaderIconButton>
                    <Icon name="chevron-down" />
                </CollapsibleHeaderIconButton>
            }
            disableContainerToggle
        >
            Collapsible header not clickable
        </CollapsibleHeader>
        <CollapsibleContent>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
            ea commodo consequat.
        </CollapsibleContent>
    </Collapsible>
);
