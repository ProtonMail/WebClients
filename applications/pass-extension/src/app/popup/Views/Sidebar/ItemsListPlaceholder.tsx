import { type MouseEvent, type VFC, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { useItems } from 'proton-pass-extension/lib/hooks/useItems';
import { useNavigationContext } from 'proton-pass-extension/lib/hooks/useNavigationContext';
import { useOpenSettingsTab } from 'proton-pass-extension/lib/hooks/useOpenSettingsTab';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import type { IconName } from '@proton/components/components';
import { Icon } from '@proton/components/components';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { itemTypeToIconName } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { SubTheme } from '@proton/pass/components/Layout/Theme/types';
import { isWritableVault } from '@proton/pass/lib/vaults/vault.predicates';
import { selectAllVaults, selectOwnReadOnlyVaults, selectShare, selectVaultLimits } from '@proton/pass/store/selectors';
import type { ItemType } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import clsx from '@proton/utils/clsx';

type QuickAction = {
    type: ItemType | 'import';
    icon: IconName;
    label: string;
    onClick: (e: MouseEvent<HTMLElement>) => void;
    subTheme?: SubTheme;
};

export const ItemsListPlaceholder: VFC = () => {
    const history = useHistory();
    const openSettings = useOpenSettingsTab();

    const { isCreating } = useNavigationContext();

    const { filtering, totalCount } = useItems();
    const { search } = filtering;

    const { didDowngrade } = useSelector(selectVaultLimits);
    const selectedShare = useSelector(selectShare(filtering.shareId));
    const ownedReadOnlyShareIds = useSelector(selectOwnReadOnlyVaults).map(prop('shareId'));
    const isOwnedReadOnly = filtering.shareId && ownedReadOnlyShareIds.includes(filtering.shareId);

    const hasMultipleVaults = useSelector(selectAllVaults).length > 1;

    const quickActions = useMemo<QuickAction[]>(
        () => [
            {
                type: 'login',
                icon: itemTypeToIconName.login,
                label: c('Label').t`Create a login`,
                onClick: () => history.push(`/item/new/login`),
                subTheme: SubTheme.VIOLET,
            },
            {
                type: 'alias',
                icon: itemTypeToIconName.alias,
                label: c('Label').t`Create a hide-my-email alias`,
                onClick: () => history.push(`/item/new/alias`),
                subTheme: SubTheme.TEAL,
            },
            {
                type: 'creditCard',
                icon: itemTypeToIconName.creditCard,
                label: c('Label').t`Create a credit card`,
                onClick: () => history.push(`/item/new/creditCard`),
                subTheme: SubTheme.LIME,
            },
            {
                type: 'note',
                icon: itemTypeToIconName.note,
                label: c('Label').t`Create an encrypted note`,
                onClick: () => history.push(`/item/new/note`),
                subTheme: SubTheme.ORANGE,
            },
            {
                type: 'import',
                icon: 'arrow-up-line',
                label: c('Label').t`Import passwords`,
                onClick: () => openSettings('import'),
            },
        ],
        []
    );

    if (isOwnedReadOnly && totalCount === 0 && didDowngrade) {
        return (
            <div
                className="flex flex-column flex-align-items-center gap-3 text-center p-2 w-2/3 max-w-custom"
                style={{ '--max-w-custom': '20rem' }}
            >
                <span className="text-semibold inline-block">{c('Title').t`Your vault is empty`}</span>
                <Card>
                    {c('Info')
                        .t`You have exceeded the number of vaults included in your subscription. New items can only be created in your first two vaults. To create new items in all vaults upgrade your subscription.`}
                </Card>
                <UpgradeButton />
            </div>
        );
    }

    if (totalCount === 0) {
        return (
            <div className="flex flex-column gap-3 text-center">
                <strong className="inline-block">{c('Title').t`Your vault is empty`}</strong>
                <span className="color-weak inline-block mb-4">
                    {hasMultipleVaults
                        ? c('Info').t`Switch to another vault or create an item in this vault`
                        : c('Info').t`Let's get you started by creating your first item`}
                </span>
                {!isCreating &&
                    quickActions.map(({ type, icon, label, onClick, subTheme }) => (
                        <Button
                            pill
                            shape="solid"
                            color="weak"
                            key={`quick-action-${type}`}
                            className={clsx('w-full relative', subTheme)}
                            onClick={onClick}
                            disabled={selectedShare && !isWritableVault(selectedShare)}
                        >
                            <Icon
                                name={icon}
                                color="var(--interaction-norm)"
                                className="absolute left-custom top bottom my-auto"
                                style={{ '--left-custom': '1rem' }}
                            />
                            <span>{label}</span>
                        </Button>
                    ))}
            </div>
        );
    }

    return (
        <span className="block text-break color-weak text-sm p-2 text-center text-break">
            {search.trim() ? (
                <span>
                    {c('Warning').t`No items matching`}
                    <br />"{search}"
                </span>
            ) : (
                <>{c('Warning').t`No items`}</>
            )}
        </span>
    );
};
