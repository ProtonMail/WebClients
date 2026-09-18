import { type FC, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';

import { useMemoSelector } from '../../../hooks/useMemoSelector';
import { isWritableVault } from '../../../lib/vaults/vault.predicates';
import { itemCreate } from '../../../store/actions';
import {
    selectDefaultVault,
    selectMostRecentVaultShareID,
    selectShare,
    selectVaultLimits,
} from '../../../store/selectors';
import type { ItemCreateIntent, ItemType } from '../../../types';
import { usePassCore } from '../../Core/PassCoreProvider';
import { useFoldersAccess } from '../../Folders/useFoldersAccess';
import { useNavigationActions } from '../../Navigation/NavigationActions';
import { useNavigationFilters } from '../../Navigation/NavigationFilters';
import { useItemScope } from '../../Navigation/NavigationMatches';
import { type ItemNewRouteParams, getLocalPath } from '../../Navigation/routing';
import type { ItemNewViewProps } from '../../Views/types';
import { AliasNew } from '../Alias/Alias.new';
import { CreditCardNew } from '../CreditCard/CreditCard.new';
import { CustomNew } from '../Custom/Custom.new';
import { IdentityNew } from '../Identity/Identity.new';
import { LoginNew } from '../Login/Login.new';
import { NoteNew } from '../Note/Note.new';

const itemNewMap: { [T in ItemType]: FC<ItemNewViewProps<T>> } = {
    login: LoginNew,
    note: NoteNew,
    alias: AliasNew,
    creditCard: CreditCardNew,
    identity: IdentityNew,
    sshKey: CustomNew,
    wifi: CustomNew,
    custom: CustomNew,
};

export const ItemNew: FC = () => {
    const { getExtensionClientState } = usePassCore();
    const { selectItem, navigate } = useNavigationActions();
    const { filters, setFilters } = useNavigationFilters();
    const scope = useItemScope();

    const selectedShareId = filters.selectedShareId;
    const history = useHistory();
    const dispatch = useDispatch();

    const { type } = useParams<ItemNewRouteParams>();
    const { didDowngrade } = useSelector(selectVaultLimits);
    const { canUseFolders } = useFoldersAccess();

    const defaultVault = useSelector(selectDefaultVault);
    const mostRecentVaultShareID = useSelector(selectMostRecentVaultShareID);
    const selectedVault = useMemoSelector(selectShare, [selectedShareId]);

    const hasSelectedWritableVault = selectedVault && isWritableVault(selectedVault);

    const shareId = (() => {
        /** If user downgraded : always auto-select the default vault id */
        if (didDowngrade) return defaultVault?.shareId;
        /** If we have a selected share : ensure it is writable */
        if (hasSelectedWritableVault) return selectedShareId;
        /** Else select the most recently used writable/own vault */
        return mostRecentVaultShareID;
    })();

    /** Only keep the selected folder if we are creating in the selected vault.
     * If we fell back to another vault (read-only selection or downgrade), the
     * selected folder does not belong to it and should be omitted.
     * Future TODO: when folder sharing is released, we should look if
     * folder is writable rather than vault being writable. */
    const folderId = canUseFolders && shareId === selectedShareId ? filters.selectedFolderId : null;

    /** If a user's first route is an item creation route
     * (draft recovery), there won't be any history to go back
     * to, so we navigate to the selected share view. */
    const handleCancel = useCallback(() => {
        if (history.length > 1) history.goBack();
        else navigate(getLocalPath(scope), { filters: { selectedShareId } });
    }, [selectedShareId, scope]);

    if (!shareId) handleCancel();

    const handleSubmit = (createIntent: ItemCreateIntent) => {
        dispatch(itemCreate.intent(createIntent));

        /* if the user put the item in a vault or folder which is currently not
         * selected, autoselect it so the following call to `selectItem` passes */
        if (
            selectedShareId &&
            (selectedShareId !== createIntent.shareId || filters.selectedFolderId !== createIntent.folderId)
        ) {
            setFilters({ selectedShareId: createIntent.shareId, selectedFolderId: createIntent.folderId });
        }

        selectItem(createIntent.shareId, createIntent.optimisticId, { mode: 'replace' });
    };

    const ItemNewComponent = itemNewMap[type] as FC<ItemNewViewProps>;

    return (
        shareId && (
            <ItemNewComponent
                type={type}
                onCancel={handleCancel}
                onSubmit={handleSubmit}
                shareId={shareId}
                folderId={folderId}
                url={getExtensionClientState?.()?.url ?? null}
            />
        )
    );
};
