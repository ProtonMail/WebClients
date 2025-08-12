import { type FC, useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Dropdown, DropdownMenu, DropdownMenuButton, Icon, usePopperAnchor } from '@proton/components';
import { PillBadge } from '@proton/pass/components/Layout/Badge/PillBadge';
import { DropdownMenuButtonLabel } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { itemTypeToIconName } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { SubTheme, itemTypeToSubThemeClassName } from '@proton/pass/components/Layout/Theme/types';
import { useNavigate } from '@proton/pass/components/Navigation/NavigationActions';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { getNewItemRoute } from '@proton/pass/components/Navigation/routing';
import { OrganizationPolicyTooltip } from '@proton/pass/components/Organization/OrganizationPolicyTooltip';
import { usePasswordGeneratorAction } from '@proton/pass/components/Password/PasswordGeneratorAction';
import { usePasswordHistoryActions } from '@proton/pass/components/Password/PasswordHistoryActions';
import { UpgradeButton } from '@proton/pass/components/Upsell/UpgradeButton';
import { UpsellRef } from '@proton/pass/constants';
import { useCopyToClipboard } from '@proton/pass/hooks/useCopyToClipboard';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useMatchUser } from '@proton/pass/hooks/useMatchUser';
import { useNewItemShortcut } from '@proton/pass/hooks/useNewItemShortcut';
import {
    selectAliasLimits,
    selectCanCreateItems,
    selectOrganizationVaultCreationDisabled,
    selectPassPlan,
} from '@proton/pass/store/selectors';
import type { ItemType, MaybeNull } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { pipe } from '@proton/pass/utils/fp/pipe';
import noop from '@proton/utils/noop';

type QuickAction = {
    label: string;
    type: ItemType;
    locked?: boolean;
    hidden?: boolean;
};

type Props = {
    /** Current origin if in the extension to hydrate the generated
     * password origin on save */
    origin?: MaybeNull<string>;
};

export const ItemQuickActions: FC<Props> = ({ origin = null }) => {
    const scope = useItemScope();
    const navigate = useNavigate();
    const passwordHistory = usePasswordHistoryActions();
    const generatePassword = usePasswordGeneratorAction();
    const copyToClipboard = useCopyToClipboard();
    const paidUser = useMatchUser({ paid: true });
    const showCustomItem = useFeatureFlag(PassFeature.PassCustomTypeV1);

    const onCreate = useCallback((type: ItemType) => navigate(getNewItemRoute(type, scope)), [scope]);

    const { needsUpgrade, aliasLimit, aliasLimited, aliasTotalCount } = useSelector(selectAliasLimits);
    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;

    const { anchorRef, isOpen, toggle, close, open } = usePopperAnchor<HTMLButtonElement>();

    const withClose = <T extends (...args: any[]) => void>(action: T) => pipe(action, close) as T;

    const listRef = useRef<HTMLUListElement>(null);
    useNewItemShortcut(() => {
        if (isOpen || !scope) return;
        open();
        setTimeout(() => listRef.current?.querySelector('button')?.focus(), 50);
    });

    const handleNewPasswordClick = () => {
        void generatePassword({
            actionLabel: c('Action').t`Copy and close`,
            className: SubTheme.RED,
            onSubmit: (value) => {
                passwordHistory.add({ value, origin });
                copyToClipboard(value).catch(noop);
            },
        });
    };

    const quickActions = useMemo<QuickAction[]>(() => {
        const actions: QuickAction[] = [
            { label: c('Label').t`Login`, type: 'login' },
            { label: c('Label').t`Alias`, type: 'alias' },
            { label: c('Label').t`Card`, type: 'creditCard', locked: isFreePlan },
            { label: c('Label').t`Note`, type: 'note' },
            { label: c('Label').t`Identity`, type: 'identity' },
            { label: c('Label').t`Other`, type: 'custom', locked: isFreePlan, hidden: !showCustomItem },
        ];

        return actions.filter(({ hidden }) => !hidden);
    }, [showCustomItem, isFreePlan]);

    const disabled = !useSelector(selectCanCreateItems);
    const vaultCreationDisabled = useSelector(selectOrganizationVaultCreationDisabled);
    const orgDisabled = disabled && vaultCreationDisabled;

    return (
        <>
            {!paidUser && BUILD_TARGET !== 'safari' && (
                <UpgradeButton
                    upsellRef={UpsellRef.NAVBAR_UPGRADE}
                    iconName="upgrade"
                    iconSize={3.5}
                    iconGradient
                    gradient
                    style={{
                        '--upgrade-color-stop-1': '#9834ff',
                        '--upgrade-color-stop-2': '#F6CC88',
                    }}
                />
            )}
            <OrganizationPolicyTooltip
                enforced={orgDisabled}
                text={c('Warning').t`Your administrator needs to create a vault for you before you can create items`}
                placement="bottom"
            >
                <Button
                    pill
                    color="norm"
                    disabled={disabled}
                    className="flex gap-1.5 text-sm"
                    onClick={toggle}
                    ref={anchorRef}
                    size="small"
                    title={c('Action').t`Add new item`}
                >
                    <Icon size={3.5} name="plus" alt={c('Action').t`Add new item`} />
                    <span className="hidden md:block">{c('Action').t`Create item`}</span>
                </Button>
            </OrganizationPolicyTooltip>
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                autoClose={false}
                onClose={close}
                originalPlacement="bottom-start"
            >
                <DropdownMenu listRef={listRef}>
                    {quickActions.map(({ type, label, locked }) => (
                        <DropdownMenuButton
                            key={`item-type-dropdown-button-${type}`}
                            className={itemTypeToSubThemeClassName[type]}
                            onClick={withClose(() => onCreate(type))}
                            disabled={locked}
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

                                    if (locked) {
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
