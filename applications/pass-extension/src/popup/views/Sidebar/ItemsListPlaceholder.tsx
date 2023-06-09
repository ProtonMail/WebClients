import { type MouseEvent, type VFC, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import type { IconName } from '@proton/components/components';
import { Icon } from '@proton/components/components';
import { selectPrimaryVault, selectVaultLimits } from '@proton/pass/store';

import { UpgradeButton } from '../../../shared/components/upgrade/UpgradeButton';
import { itemTypeToIconName } from '../../../shared/items/icons';
import { ItemCard } from '../../components/Item/ItemCard';
import { useItems } from '../../hooks/useItems';
import { useNavigationContext } from '../../hooks/useNavigationContext';
import { useOpenSettingsTab } from '../../hooks/useOpenSettingsTab';

export const ItemsListPlaceholder: VFC = () => {
    const history = useHistory();
    const openSettings = useOpenSettingsTab();

    const { isCreating } = useNavigationContext();

    const { filtering, items } = useItems();
    const { search } = filtering;

    const primaryVaultId = useSelector(selectPrimaryVault).shareId;
    const inNonPrimaryVault = Boolean(filtering.shareId) && filtering.shareId !== primaryVaultId;
    const { didDowngrade } = useSelector(selectVaultLimits);

    const getQuickActions = useMemo<
        { type: string; icon: IconName; label: string; onClick: (e: MouseEvent<HTMLElement>) => void }[]
    >(
        () => [
            {
                type: 'login',
                icon: itemTypeToIconName.login,
                label: c('Label').t`Create a login`,
                onClick: () => history.push(`/item/new/login`),
            },
            {
                type: 'alias',
                icon: itemTypeToIconName.alias,
                label: c('Label').t`Create a Hide My Email alias`,
                onClick: () => history.push(`/item/new/alias`),
            },
            {
                type: 'note',
                icon: itemTypeToIconName.note,
                label: c('Label').t`Create an encrypted note`,
                onClick: () => history.push(`/item/new/note`),
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

    if (inNonPrimaryVault && items.totalCount === 0 && didDowngrade) {
        return (
            <div className="flex flex-column gap-3 text-center">
                <span className="text-semibold inline-block">{c('Title').t`Your vault is empty`}</span>
                <ItemCard>
                    {c('Info')
                        .t`You have exceeded the number of vaults included in your subscription. New items can only be created in your primary vault. To create new items in all vaults upgrade your subscription.`}
                </ItemCard>
                <UpgradeButton />
            </div>
        );
    }

    if (items.totalCount === 0) {
        return (
            <div className="flex flex-column gap-3 text-center">
                <strong className="inline-block">{c('Title').t`Your vault is empty`}</strong>
                <span className="color-weak inline-block mb-4">{c('Info')
                    .t`Let's get you started by creating your first item`}</span>

                {!isCreating &&
                    getQuickActions.map(({ type, icon, label, onClick }) => (
                        <Button
                            pill
                            shape="solid"
                            color="weak"
                            key={`quick-action-${type}`}
                            className={`ui-${type} w100 relative`}
                            onClick={onClick}
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
