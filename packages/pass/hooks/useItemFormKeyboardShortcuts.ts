import { type FormikContextType } from 'formik';

import { useKeyPress } from '@proton/components/index';
import type { BaseItemValues } from '@proton/pass/types';

export const useItemFormKeyboardShortcuts = <T extends BaseItemValues>(
    form: FormikContextType<T>,
    options?: { canSubmit: boolean }
) => {
    const handleKeyPress = async (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();

            if (!form.isValid || !form.dirty || (options?.canSubmit !== undefined && !options.canSubmit)) {
                return;
            }
            void form.submitForm();
        }
    };

    useKeyPress(handleKeyPress, [form.isValid, form.dirty]);
};
