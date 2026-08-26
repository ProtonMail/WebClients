import { useUIState } from '../../../hooks/useUIState';

export const useItemFieldExpansion = (key: string, defaultValue: boolean) =>
    useUIState(`item-field-expansion:${key}`, defaultValue);
