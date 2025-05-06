import type { FC } from 'react';
import { type MouseEvent, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button, type ButtonLikeShape } from '@proton/atoms';
import type { IconName } from '@proton/components';
import { Icon } from '@proton/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { itemTypeToIconName } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { SubTheme } from '@proton/pass/components/Layout/Theme/types';
import { useNavigate } from '@proton/pass/components/Navigation/NavigationActions';
import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { getNewItemRoute } from '@proton/pass/components/Navigation/routing';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { isWritableVault } from '@proton/pass/lib/vaults/vault.predicates';
import { selectAllVaults, selectCanCreateItems, selectShare } from '@proton/pass/store/selectors';
import type { ItemType } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { truthy } from '@proton/pass/utils/fp/predicates';
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

export const QuickActionsPlaceholder: FC = () => {
    const { openSettings } = usePassCore();
    const { filters } = useNavigationFilters();
    const scope = useItemScope();

    const navigate = useNavigate();
    const hasMultipleVaults = useSelector(selectAllVaults).length > 1;
    const { selectedShareId } = filters;

    const selectedShare = useSelector(selectShare(selectedShareId));
    const onCreate = useCallback((type: ItemType) => navigate(getNewItemRoute(type, scope)), [scope]);

    const canCreate = useSelector(selectCanCreateItems);
    const showCustomItem = useFeatureFlag(PassFeature.PassCustomTypeV1);

    const quickActions = useMemo<ItemQuickAction[]>(
        () =>
            [
                {
                    icon: itemTypeToIconName.login,
                    label: c('Label').t`Create a login`,
                    subTheme: SubTheme.VIOLET,
                    type: 'login',
                    onClick: () => onCreate('login'),
                } as const,
                {
                    icon: itemTypeToIconName.alias,
                    label: c('Label').t`Create a hide-my-email alias`,
                    subTheme: SubTheme.TEAL,
                    type: 'alias',
                    onClick: () => onCreate('alias'),
                } as const,
                {
                    icon: itemTypeToIconName.creditCard,
                    label: c('Label').t`Create a credit card`,
                    subTheme: SubTheme.LIME,
                    type: 'creditCard',
                    onClick: () => onCreate('creditCard'),
                } as const,
                {
                    icon: itemTypeToIconName.note,
                    label: c('Label').t`Create an encrypted note`,
                    subTheme: SubTheme.ORANGE,
                    type: 'note',
                    onClick: () => onCreate('note'),
                } as const,
                {
                    icon: itemTypeToIconName.identity,
                    label: c('Label').t`Create an Identity`,
                    type: 'identity',
                    onClick: () => onCreate('identity'),
                } as const,
                showCustomItem &&
                    ({
                        icon: itemTypeToIconName.custom,
                        label: c('Label').t`Create a custom item`,
                        subTheme: SubTheme.GRAY,
                        type: 'custom',
                        onClick: () => onCreate('custom'),
                    } as const),
                {
                    type: 'import',
                    icon: 'arrow-up-line',
                    shape: 'outline',
                    label: c('Label').t`Import passwords`,
                    onClick: () => openSettings?.('import'),
                } as const,
            ].filter(truthy),
        [onCreate]
    );

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

            {quickActions
                .filter(({ hidden }) => !hidden)
                .map(({ type, icon, label, shape, subTheme, onClick }) => (
                    <Button
                        pill
                        shape={shape ?? 'solid'}
                        color="weak"
                        key={`quick-action-${type}`}
                        className={clsx('pass-sub-sidebar--hidable w-full relative', subTheme)}
                        onClick={onClick}
                        disabled={(selectedShare && !isWritableVault(selectedShare)) || !canCreate}
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
};
