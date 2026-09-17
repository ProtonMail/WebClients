import { SaveVCardContactError } from '@proton/components/containers/contacts/hooks/useSaveVCardContact';
import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

export const trimmed = (value: string | null): string => value?.trim() ?? '';

export const saveWithDuplicateGuard = async <T>(save: () => Promise<T>, duplicateMessage: string): Promise<T> => {
    try {
        return await save();
    } catch (error) {
        if (error instanceof SaveVCardContactError && error.code === API_CUSTOM_ERROR_CODES.ALREADY_EXISTS) {
            throw new ToolInputError(duplicateMessage);
        }
        throw error;
    }
};
