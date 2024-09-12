import { type FC, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Dropdown, DropdownMenu, DropdownMenuButton, Icon, usePopperAnchor } from '@proton/components';
import { PillBadge } from '@proton/pass/components/Layout/Badge/PillBadge';
import { DropdownMenuButtonLabel } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { itemTypeToIconName } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { itemTypeToSubThemeClassName } from '@proton/pass/components/Layout/Theme/types';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { usePasswordContext } from '@proton/pass/components/Password/PasswordContext';
import { useCopyToClipboard } from '@proton/pass/hooks/useCopyToClipboard';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useNewItemShortcut } from '@proton/pass/hooks/useNewItemShortcut';
import { selectAliasLimits, selectPassPlan } from '@proton/pass/store/selectors';
import type { ItemType, MaybeNull } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { pipe } from '@proton/pass/utils/fp/pipe';
import noop from '@proton/utils/noop';

type QuickAction = { label: string; type: ItemType };

type Props = {
    disabled?: boolean;
    /** Current origin if in the extension to hydrate the generated
     * password origin on save */
    origin?: MaybeNull<string>;
    onCreate: (type: ItemType) => void;
};

export const ItemQuickActions: FC<Props> = ({ disabled = false, origin = null, onCreate }) => {
    const { matchItemList } = useNavigation();
    const passwordContext = usePasswordContext();
    const copyToClipboard = useCopyToClipboard();
    const identityItemEnabled = useFeatureFlag(PassFeature.PassIdentityV1);

    const { needsUpgrade, aliasLimit, aliasLimited, aliasTotalCount } = useSelector(selectAliasLimits);
    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;

    const { anchorRef, isOpen, toggle, close, open } = usePopperAnchor<HTMLButtonElement>();

    const withClose = <T extends (...args: any[]) => void>(action: T) => pipe(action, close) as T;

    const listRef = useRef<HTMLUListElement>(null);
    useNewItemShortcut(() => {
        if (isOpen || !matchItemList) return;
        open();
        setTimeout(() => listRef.current?.querySelector('button')?.focus(), 50);
    });

    const handleNewPasswordClick = () => {
        void passwordContext.generate({
            actionLabel: c('Action').t`Copy and close`,
            className: 'ui-red',
            onSubmit: (value) => {
                passwordContext.history.add({ value, origin });
                copyToClipboard(value).catch(noop);
            },
        });
    };

    const quickActions = useMemo(() => {
        const actions: QuickAction[] = [
            { label: c('Label').t`Login`, type: 'login' },
            { label: c('Label').t`Alias`, type: 'alias' },
            { label: c('Label').t`Card`, type: 'creditCard' },
            { label: c('Label').t`Note`, type: 'note' },
        ];

        if (identityItemEnabled) actions.push({ label: c('Label').t`Identity`, type: 'identity' });

        return actions;
    }, [identityItemEnabled]);

    return (
        <>
            <Button
                icon
                pill
                color="norm"
                disabled={disabled}
                onClick={toggle}
                ref={anchorRef}
                size="small"
                title={c('Action').t`Add new item`}
            >
                <Icon name="plus" alt={c('Action').t`Add new item`} />
            </Button>
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                autoClose={false}
                onClose={close}
                originalPlacement="bottom-start"
            >
                <DropdownMenu listRef={listRef}>
                    {quickActions.map(({ type, label }) => (
                        <DropdownMenuButton
                            key={`item-type-dropdown-button-${type}`}
                            className={itemTypeToSubThemeClassName[type]}
                            onClick={withClose(() => onCreate(type))}
                            disabled={isFreePlan && type === 'creditCard'}
                        >
                            <DropdownMenuButtonLabel
                                label={label}
                                labelClassname="text-left"
                                extra={(() => {
                                    if (type === 'alias' && aliasLimited) {
                                        return (
                                            <PillBadge
                                                label={`${aliasTotalCount}/${aliasLimit}`}
                                                {...(needsUpgrade
                                                    ? {
                                                          color: 'var(--signal-danger-contrast)',
                                                          backgroundColor: 'var(--signal-danger)',
                                                      }
                                                    : {})}
                                            />
                                        );
                                    }

                                    if (type === 'creditCard' && isFreePlan) {
                                        return <Icon name="pass-lock" size={3.5} className="mr-1.5" />;
                                    }
                                })()}
                                icon={
                                    <span
                                        className="mr-2 w-custom h-custom rounded-lg overflow-hidden relative pass-item-icon shrink-0"
                                        style={{ '--w-custom': `2em`, '--h-custom': `2em` }}
                                    >
                                        <Icon
                                            name={itemTypeToIconName[type]}
                                            className="absolute inset-center"
                                            color="var(--interaction-norm)"
                                        />
                                    </span>
                                }
                            />
                        </DropdownMenuButton>
                    ))}

                    <DropdownMenuButton className="ui-red" onClick={withClose(handleNewPasswordClick)}>
                        <DropdownMenuButtonLabel
                            label={c('Label').t`Password`}
                            icon={
                                <span
                                    className="mr-2 w-custom h-custom rounded-lg overflow-hidden relative pass-item-icon shrink-0"
                                    style={{ '--w-custom': `2em`, '--h-custom': `2em` }}
                                >
                                    <Icon
                                        name="key"
                                        className="absolute inset-center"
                                        color="var(--interaction-norm)"
                                    />
                                </span>
                            }
                        />
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
