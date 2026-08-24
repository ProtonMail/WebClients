import { type FC, Fragment } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import Badge from '@proton/components/components/badge/Badge';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';

import { UpsellRef } from '../../../constants';
import { useAutotypeExecute } from '../../../hooks/autotype/useAutotypeExecute';
import { selectPassPlan } from '../../../store/selectors';
import { SpotlightMessage } from '../../../types';
import { UserPassPlan } from '../../../types/api/plan';
import type { AutotypeAction } from '../../../types/desktop/autotype';
import { DropdownMenuButton } from '../../Layout/Dropdown/DropdownMenuButton';
import { DropdownMenuLabel } from '../../Layout/Dropdown/DropdownMenuLabel';
import { useSpotlightFor } from '../../Spotlight/WithSpotlight';
import { PassPlusIcon } from '../../Upsell/PassPlusIcon';
import { useUpselling } from '../../Upsell/UpsellingProvider';
import { useItemsActions } from '../ItemActionsProvider';

type AutotypeDropdownProps = {
    actions: AutotypeAction[];
};

export const AutotypeDropdown: FC<AutotypeDropdownProps> = ({ actions }) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLDivElement>();
    const { autotypeConfirm } = useItemsActions();
    const executeAutotype = useAutotypeExecute();
    const upsell = useUpselling();
    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;
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
                label={
                    <>
                        <div className="text-ellipsis">{c('Action').t`Autotype`}</div>
                        {isFreePlan && <PassPlusIcon className="ml-2 shrink-0" />}
                    </>
                }
                icon="magic-wand"
                extra={
                    autotypeDiscoverySpotlight.open &&
                    !isFreePlan && (
                        <Badge type={BUILD_TARGET === 'linux' ? 'warning' : 'info'}>
                            {BUILD_TARGET === 'linux' ? (
                                <span className="text-sm">{c('Label').t`Experimental`}</span>
                            ) : (
                                c('Label').t`New`
                            )}
                        </Badge>
                    )
                }
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
                {
                    <div className="flex flex-nowrap text-bold px-4 my-2 gap-2">
                        {c('Action').t`Autotype in previous window`} {isFreePlan && <PassPlusIcon />}
                    </div>
                }
                <DropdownMenu className="flex flex-column">
                    {actions.map((action, index) => (
                        <Fragment key={action.key}>
                            <DropdownMenuButton
                                onClick={() => {
                                    if (isFreePlan) {
                                        return upsell({ type: 'pass-plus', upsellRef: UpsellRef.AUTOTYPE });
                                    }

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
