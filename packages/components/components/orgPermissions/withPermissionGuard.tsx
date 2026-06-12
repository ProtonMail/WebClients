import type { ComponentType } from 'react';

import { useOrgPermissions } from '@proton/account/userPermissions/hooks';
import type { ButtonLikeOwnProps } from '@proton/atoms/Button/ButtonLike';
import type { Permission } from '@proton/shared/lib/interfaces/UserPermission';

import PermissionTooltip, { type Props as PermissionTooltipProps } from './PermissionTooltip';

type ExtendedTooltipProps = Omit<PermissionTooltipProps, 'hasPermission' | 'children'>;

/**
 * HOC that guards a ButtonLike component behind one or more org permissions.
 *
 * When the user lacks permission, the component is disabled and a tooltip is shown.
 * Multiple permissions use AND semantics — all must be held.
 * Defaults to blocked (`hasPermission = false`) while permissions are loading.
 *
 * Only works with ButtonLike components: `disabled` is required to block interaction,
 * and PermissionTooltip's span wrapper is needed to capture mouse events on disabled elements.
 *
 * @example
 * const GuardedButton = withPermissionGuard('account.user.create')(Button);
 * const GuardedButton = withPermissionGuard(['account.user.create', 'account.user.update'])(Button);
 */
const withPermissionGuard =
    (constraints: Permission | Permission[]) =>
    <P extends ButtonLikeOwnProps>(Component: ComponentType<P>) => {
        const WithPermissionGuard = (props: P & { tooltip?: ExtendedTooltipProps }) => {
            const [permissions] = useOrgPermissions();
            const hasPermission = Array.isArray(constraints)
                ? permissions !== null && constraints.every((permission) => permissions[permission])
                : (permissions?.[constraints] ?? false);

            const { tooltip, ...rest } = props;
            const overrideProps = {
                ...rest,
                disabled: props.disabled || !hasPermission,
            } as unknown as P;

            return (
                <PermissionTooltip {...tooltip} hasPermission={hasPermission}>
                    <Component {...overrideProps} />
                </PermissionTooltip>
            );
        };

        WithPermissionGuard.displayName = `WithPermissionGuard(${Component.displayName ?? Component.name})`;

        return WithPermissionGuard;
    };

export default withPermissionGuard;
