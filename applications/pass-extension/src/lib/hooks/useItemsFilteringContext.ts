import { useContext } from 'react';

import { ItemsFilteringContext } from '../components/Context/Items/ItemsFilteringContext';

export const useItemsFilteringContext = () => useContext(ItemsFilteringContext);
