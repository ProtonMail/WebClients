import { type FC, Fragment } from 'react';

import { c } from 'ttag';

import Badge from '@proton/components/components/badge/Badge';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { useItemsActions } from '@proton/pass/components/Item/ItemActionsProvider';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { DropdownMenuLabel } from '@proton/pass/components/Layout/Dropdown/DropdownMenuLabel';
import { useSpotlightFor } from '@proton/pass/components/Spotlight/WithSpotlight';
import { useAutotypeExecute } from '@proton/pass/hooks/autotype/useAutotypeExecute';
import { SpotlightMessage } from '@proton/pass/types';
import type { AutotypeAction } from '@proton/pass/types/desktop/autotype';

type AutotypeDropdownProps = {
    actions: AutotypeAction[];
};

export const AutotypeDropdown: FC<AutotypeDropdownProps> = ({ actions }) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLDivElement>();
    const { autotypeConfirm } = useItemsActions();
    const executeAutotype = useAutotypeExecute();
    const autotypeDiscoverySpotlight = useSpotlightFor(SpotlightMessage.AUTOTYPE_DISCOVERY);
    const confirmationSpotlight = useSpotlightFor(SpotlightMessage.AUTOTYPE_CONFIRM);

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

                                    if (confirmationSpotlight.open) {
                                        return autotypeConfirm({
                                            autotypeProps,
                                            spotlightToClose: confirmationSpotlight,
                                        });
                                    }
                                    void executeAutotype?.(autotypeProps);
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
