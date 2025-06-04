import { type FC, type ReactNode } from 'react';

import { c } from 'ttag';

import type { IconName } from '@proton/components';
import { Badge, Dropdown, DropdownMenu, DropdownSizeUnit, usePopperAnchor } from '@proton/components';
import { useItemsActions } from '@proton/pass/components/Item/ItemActionsProvider';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { DropdownMenuLabel } from '@proton/pass/components/Layout/Dropdown/DropdownMenuLabel';
import { useSpotlightFor } from '@proton/pass/components/Spotlight/WithSpotlight';
import type { AutotypeProperties } from '@proton/pass/types';
import { SpotlightMessage } from '@proton/pass/types';

export type AutotypeDropdownActions = {
    getAutotypeProps: () => AutotypeProperties;
    key: string;
    title: ReactNode;
    subtitle?: string;
    icon?: IconName;
};

type AutotypeDropdownProps = {
    actions: AutotypeDropdownActions[];
};

export const AutotypeDropdown: FC<AutotypeDropdownProps> = ({ actions }) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLDivElement>();
    const { autotype } = useItemsActions();
    const autotypeDiscoverySpotlight = useSpotlightFor(SpotlightMessage.AUTOTYPE_DISCOVERY);
    const autotypeConfirmSpotlight = useSpotlightFor(SpotlightMessage.AUTOTYPE_CONFIRM);

    return (
        <>
            <DropdownMenuButton
                onClick={(evt) => {
                    evt.stopPropagation();
                    toggle();
                    if (autotypeDiscoverySpotlight.open) autotypeDiscoverySpotlight.close();
                }}
                ref={anchorRef}
                label={c('Action').t`Auto-type`}
                icon="magic-wand"
                extra={autotypeDiscoverySpotlight.open && <Badge type="info">{c('Label').t`New`}</Badge>}
            />

            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                originalPlacement="left-start"
                size={{
                    height: DropdownSizeUnit.Dynamic,
                    width: DropdownSizeUnit.Dynamic,
                    maxHeight: DropdownSizeUnit.Viewport,
                    maxWidth: '100rem',
                }}
            >
                {<div className="text-bold px-4 my-2">{c('Label').t`Auto-type in previous window`}</div>}
                <DropdownMenu className="flex flex-column">
                    {actions.map((action, index) => (
                        <>
                            <DropdownMenuButton
                                key={action.key}
                                onClick={() => {
                                    const autotypeProps = action.getAutotypeProps();

                                    if (autotypeConfirmSpotlight.open) {
                                        return autotype(autotypeProps);
                                    }

                                    // else skip confirmation modal
                                    return window.ctxBridge?.autotype(autotypeProps);
                                }}
                                label={<DropdownMenuLabel title={action.title} subtitle={action.subtitle} />}
                                icon={action.icon}
                            />
                            {index === 0 && actions.length > 1 && (
                                <hr className="my-2" aria-hidden="true" key="autotype-dropdown-hr" />
                            )}
                        </>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
