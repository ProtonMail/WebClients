import { useContext } from 'react';

import { ItemsFilteringContext } from '../context/items/ItemsFilteringContext';

export const useItemsFilteringContext = () => useContext(ItemsFilteringContext);
