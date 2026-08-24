import { type FC, useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import Icon from '@proton/components/components/icon/Icon';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcPassLock } from '@proton/icons/icons/IcPassLock';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import noop from '@proton/utils/noop';

import { useVaultCreationPolicy } from '../../../hooks/organization/useVaultCreationPolicy';
import { useFeatureFlag } from '../../../hooks/useFeatureFlag';
import { useNewItemShortcut } from '../../../hooks/useNewItemShortcut';
import { selectAliasLimits, selectCanCreateItems, selectPassPlan } from '../../../store/selectors';
import type { ItemType, MaybeNull } from '../../../types';
import { OrganizationAliasCreateMode } from '../../../types';
import { PassFeature } from '../../../types/api/features';
import { UserPassPlan } from '../../../types/api/plan';
import { pipe } from '../../../utils/fp/pipe';
import { PillBadge } from '../../Layout/Badge/PillBadge';
import { DropdownMenuButtonLabel } from '../../Layout/Dropdown/DropdownMenuButton';
import { itemTypeToIconName } from '../../Layout/Icon/ItemIcon';
import { SubTheme, itemTypeToSubThemeClassName } from '../../Layout/Theme/types';
import { useNavigate } from '../../Navigation/NavigationActions';
import { useItemScope } from '../../Navigation/NavigationMatches';
import { getNewItemRoute } from '../../Navigation/routing';
import { OrganizationPolicyTooltip } from '../../Organization/OrganizationPolicyTooltip';
import { useOrganization } from '../../Organization/OrganizationProvider';
import { usePasswordGeneratorAction } from '../../Password/PasswordGeneratorAction';
import { usePasswordHistoryActions } from '../../Password/PasswordHistoryActions';
import { useCopyToClipboard } from '../../Settings/Clipboard/ClipboardProvider';

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
    const showCustomItem = useFeatureFlag(PassFeature.PassCustomTypeV1);

    const onCreate = useCallback((type: ItemType) => navigate(getNewItemRoute(type, scope)), [scope]);

    const org = useOrganization();
    const orgAliasCreationDisabled = org?.settings.AliasCreateMode === OrganizationAliasCreateMode.NOBODY;

    const { needsUpgrade, aliasLimit, aliasLimited, aliasTotalCount } = useSelector(selectAliasLimits);
    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;
    const freeCcFlag = useFeatureFlag(PassFeature.PassAllowCreditCardFreeUsers);
    const creditCardLock = !freeCcFlag && isFreePlan;

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
            { label: c('Label').t`Alias`, type: 'alias', hidden: orgAliasCreationDisabled },
            { label: c('Label').t`Card`, type: 'creditCard', locked: creditCardLock },
            { label: c('Label').t`Note`, type: 'note' },
            { label: c('Label').t`Identity`, type: 'identity' },
            { label: c('Label').t`Other`, type: 'custom', locked: isFreePlan, hidden: !showCustomItem },
        ];

        return actions.filter(({ hidden }) => !hidden);
    }, [showCustomItem, isFreePlan, orgAliasCreationDisabled]);

    const disabled = !useSelector(selectCanCreateItems);
    const { vaultCreationDisabled } = useVaultCreationPolicy();
    const orgDisabled = disabled && vaultCreationDisabled;

    return (
        <>
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
                    <IcPlus size={3.5} alt={c('Action').t`Add new item`} />
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
                                        return <IcPassLock size={3.5} className="mr-1.5" />;
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
                                    <IcKey className="absolute inset-center" color="var(--interaction-norm)" />
                                </span>
                            }
                        />
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
