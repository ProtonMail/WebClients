import { type FC, type MouseEvent, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button, type ButtonLikeShape } from '@proton/atoms/Button';
import type { IconName } from '@proton/components';
import { Icon } from '@proton/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useItems } from '@proton/pass/components/Item/Context/ItemsProvider';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { itemTypeToIconName } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { SubTheme } from '@proton/pass/components/Layout/Theme/types';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getNewItemRoute } from '@proton/pass/components/Navigation/routing';
import { UpsellRef } from '@proton/pass/constants';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { isWritableVault } from '@proton/pass/lib/vaults/vault.predicates';
import { selectAllVaults, selectOwnReadOnlyVaults, selectShare, selectVaultLimits } from '@proton/pass/store/selectors';
import type { ItemType } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { prop } from '@proton/pass/utils/fp/lens';
import clsx from '@proton/utils/clsx';

type ItemQuickAction = {
    hidden?: boolean;
    icon: IconName;
    label: string;
    shape?: ButtonLikeShape;
    subTheme?: SubTheme;
    type: ItemType | 'import';
    onClick: (event: MouseEvent<HTMLElement>) => void;
};

type Props = {
    /** When `noActions` is `true`, item quick actions will not render */
    noActions?: boolean;
};

export const ItemsListPlaceholder: FC<Props> = ({ noActions }) => {
    const { openSettings } = usePassCore();
    const { navigate, matchTrash, filters } = useNavigation();
    const { search, selectedShareId } = filters;
    const { totalCount } = useItems();

    const identityEnabled = useFeatureFlag(PassFeature.PassIdentityV1);

    const { didDowngrade } = useSelector(selectVaultLimits);
    const selectedShare = useSelector(selectShare(selectedShareId));
    const ownedReadOnlyShareIds = useSelector(selectOwnReadOnlyVaults).map(prop('shareId'));
    const isOwnedReadOnly = selectedShareId && ownedReadOnlyShareIds.includes(selectedShareId);
    const hasMultipleVaults = useSelector(selectAllVaults).length > 1;

    const empty = totalCount === 0;
    const hasSearch = Boolean(search.trim());
    const showUpgrade = isOwnedReadOnly && totalCount === 0 && didDowngrade;

    const quickActions = useMemo<ItemQuickAction[]>(
        () => [
            {
                icon: itemTypeToIconName.login,
                label: c('Label').t`Create a login`,
                subTheme: SubTheme.VIOLET,
                type: 'login',
                onClick: () => navigate(getNewItemRoute('login')),
            },
            {
                icon: itemTypeToIconName.alias,
                label: c('Label').t`Create a hide-my-email alias`,
                subTheme: SubTheme.TEAL,
                type: 'alias',
                onClick: () => navigate(getNewItemRoute('alias')),
            },
            {
                icon: itemTypeToIconName.creditCard,
                label: c('Label').t`Create a credit card`,
                subTheme: SubTheme.LIME,
                type: 'creditCard',
                onClick: () => navigate(getNewItemRoute('creditCard')),
            },
            {
                icon: itemTypeToIconName.note,
                label: c('Label').t`Create an encrypted note`,
                subTheme: SubTheme.ORANGE,
                type: 'note',
                onClick: () => navigate(getNewItemRoute('note')),
            },
            {
                icon: itemTypeToIconName.identity,
                label: c('Label').t`Create an Identity`,
                type: 'identity',
                hidden: !identityEnabled,
                onClick: () => navigate(getNewItemRoute('identity')),
            },
            {
                type: 'import',
                icon: 'arrow-up-line',
                shape: identityEnabled ? 'outline' : 'solid',
                label: c('Label').t`Import passwords`,
                onClick: () => openSettings?.('import'),
            },
        ],
        [identityEnabled]
    );

    if (showUpgrade && !matchTrash) {
        return (
            <div
                className="flex flex-column items-center gap-3 text-center p-2 w-2/3 max-w-custom"
                style={{ '--max-w-custom': '20rem' }}
            >
                <span className="text-semibold inline-block">{c('Title').t`Your vault is empty`}</span>
                <Card type="primary" className="text-sm">
                    {c('Info')
                        .t`You have exceeded the number of vaults included in your subscription. New items can only be created in your first two vaults. To create new items in all vaults upgrade your subscription.`}
                </Card>
                <UpgradeButton upsellRef={UpsellRef.LIMIT_VAULT} className="pass-sub-sidebar--hidable" />
            </div>
        );
    }

    if (empty && !matchTrash) {
        return (
            <div className="flex flex-column gap-3 text-center">
                <div className="flex flex-column gap-1">
                    <strong className="inline-block">{c('Title').t`Your vault is empty`}</strong>
                    <span className="color-weak inline-block mb-2">
                        {hasMultipleVaults
                            ? c('Info').t`Switch to another vault or create an item in this vault`
                            : c('Info').t`Let's get you started by creating your first item`}
                    </span>
                </div>

                {!noActions &&
                    quickActions
                        .filter(({ hidden }) => !hidden)
                        .map(({ type, icon, label, shape, subTheme, onClick }) => (
                            <Button
                                pill
                                shape={shape ?? 'solid'}
                                color="weak"
                                key={`quick-action-${type}`}
                                className={clsx('pass-sub-sidebar--hidable w-full relative', subTheme)}
                                onClick={onClick}
                                disabled={selectedShare && !isWritableVault(selectedShare)}
                                size={EXTENSION_BUILD ? 'small' : 'medium'}
                            >
                                <Icon
                                    name={icon}
                                    color="var(--interaction-norm)"
                                    className="absolute left-custom top-0 bottom-0 my-auto"
                                    style={{ '--left-custom': '1rem' }}
                                />
                                <span className="max-w-full px-8 text-ellipsis">{label}</span>
                            </Button>
                        ))}
            </div>
        );
    }

    return (
        <span className="block color-weak text-sm p-2 text-center text-break">
            {(() => {
                if (matchTrash) {
                    return empty || !hasSearch ? (
                        <span>
                            <strong>{c('Title').t`Trash empty`}</strong>
                            <br /> {c('Info').t`Deleted items will be moved here first`}
                        </span>
                    ) : (
                        <span>
                            {c('Warning').t`No items in trash matching`}
                            <br />"{search}"
                        </span>
                    );
                }

                return hasSearch ? (
                    <span>
                        {c('Warning').t`No items matching`}
                        <br />"{search}"
                    </span>
                ) : (
                    c('Warning').t`No items`
                );
            })()}
        </span>
    );
};
