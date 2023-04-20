import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { SafeLoginItem, WorkerMessageType } from '@proton/pass/types';
import { isMainFrame } from '@proton/pass/utils/dom';
import { pipe, tap } from '@proton/pass/utils/fp';

import CSContext from '../context';
import { FormType } from '../types';

export const createAutofillService = () => {
    const queryItems = async (): Promise<SafeLoginItem[]> =>
        sendMessage.map(
            contentScriptMessage({
                type: WorkerMessageType.AUTOFILL_QUERY,
                payload: { mainFrame: isMainFrame() },
            }),
            (response) => (response.type === 'success' ? response.items ?? [] : [])
        );

    const setLoginItemsCount = (count: number): void => {
        const forms = CSContext.get().formManager.getForms();
        const loginForms = forms.filter((form) => form.formType === FormType.LOGIN);

        if (loginForms.length > 0) {
            loginForms.forEach((form) => {
                Object.values(form.fields)
                    .flat()
                    .forEach((field) => {
                        if (field.icon !== null) {
                            field.icon.setCount(count);
                        }
                    });
            });
        }
    };

    return {
        queryItems: pipe(
            queryItems,
            tap(({ length }) => setLoginItemsCount(length))
        ),
        setLoginItemsCount,
    };
};
