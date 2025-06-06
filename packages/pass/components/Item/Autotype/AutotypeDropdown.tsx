import { type FC, Fragment, type ReactNode } from 'react';

import { c } from 'ttag';

import type { IconName } from '@proton/components';
import { Badge, Dropdown, DropdownMenu, DropdownSizeUnit, usePopperAnchor } from '@proton/components';
import { useItemsActions } from '@proton/pass/components/Item/ItemActionsProvider';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { DropdownMenuLabel } from '@proton/pass/components/Layout/Dropdown/DropdownMenuLabel';
import { useSpotlightFor } from '@proton/pass/components/Spotlight/WithSpotlight';
import { SpotlightMessage } from '@proton/pass/types';
import type { AutotypeAction } from '@proton/pass/types/desktop/autotype';

export type AutotypeDropdownAction = AutotypeAction & {
    title: ReactNode;
    subtitle?: ReactNode;
    icon?: IconName;
};

type AutotypeDropdownProps = {
    actions: AutotypeDropdownAction[];
};

export const AutotypeDropdown: FC<AutotypeDropdownProps> = ({ actions }) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLDivElement>();
    const { autotypeConfirm } = useItemsActions();
    const autotypeDiscoverySpotlight = useSpotlightFor(SpotlightMessage.AUTOTYPE_DISCOVERY);
    const showConfirmation = useSpotlightFor(SpotlightMessage.AUTOTYPE_CONFIRM).open;

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
                        <Fragment key={action.key}>
                            <DropdownMenuButton
                                onClick={() => {
                                    const autotypeProps = action.getAutotypeProps();

                                    if (showConfirmation) {
                                        return autotypeConfirm(autotypeProps);
                                    }
                                    void window.ctxBridge?.autotype(autotypeProps);
                                }}
                                label={<DropdownMenuLabel title={action.title} subtitle={action.subtitle} />}
                                icon={action.icon}
                            />
                            {index === 0 && actions.length > 1 && <hr className="my-2" aria-hidden="true" />}
                        </Fragment>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
