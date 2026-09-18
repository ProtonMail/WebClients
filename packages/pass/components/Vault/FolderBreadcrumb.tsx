import type { FC } from 'react';

import { useMemoSelector } from '../../hooks/useMemoSelector';
import { selectFolderPath } from '../../store/selectors';
import type { MaybeNull } from '../../types';
import type { VaultColor } from '../../types/protobuf/vault-v1.static';
import { FolderBreadcrumbCore } from './FolderBreadcrumbCore';
import type { VaultIconName } from './VaultIcon';

type Props = {
    shareId: string;
    folderId: MaybeNull<string>;
    vaultName: string;
    vaultColor?: VaultColor;
    vaultIcon?: VaultIconName;
};

export const FolderBreadcrumb: FC<Props> = ({ shareId, folderId, vaultName, vaultColor, vaultIcon }) => {
    const path = useMemoSelector(selectFolderPath, [shareId, folderId]);

    return (
        <FolderBreadcrumbCore
            shareId={shareId}
            vaultName={vaultName}
            vaultColor={vaultColor}
            vaultIcon={vaultIcon}
            path={path}
        />
    );
};
