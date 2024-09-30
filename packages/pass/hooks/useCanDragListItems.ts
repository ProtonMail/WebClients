import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';

/** Items from packages/pass/components/Item/List/ItemsListItem.tsx can be dragged from any view
 * including Pass Monitor view, except in the cases defined in this hook */
export const useCanDragListItems = () => {
    const { matchTrash } = useNavigation();

    return !EXTENSION_BUILD && !matchTrash;
};
