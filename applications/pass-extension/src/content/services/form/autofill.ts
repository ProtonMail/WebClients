import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { type SafeLoginItem, WorkerMessageType } from '@proton/pass/types';
import { pipe, tap } from '@proton/pass/utils/fp';

import { withContext } from '../../context/context';
import { FormType } from '../../types';

export const createCSAutofillService = () => {
    const queryItems: () => Promise<{ items: SafeLoginItem[]; needsUpgrade: boolean }> = withContext(
        async ({ mainFrame }) =>
            sendMessage.on(
                contentScriptMessage({
                    type: WorkerMessageType.AUTOFILL_QUERY,
                    payload: { mainFrame },
                }),
                (response) =>
                    response.type === 'success'
                        ? { items: response.items, needsUpgrade: response.needsUpgrade }
                        : { items: [], needsUpgrade: false }
            )
    );

    const setLoginItemsCount: (count: number) => void = withContext(({ service: { formManager } }, count): void => {
        const loginForms = formManager.getForms().filter((form) => form.formType === FormType.LOGIN);

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
    });

    return {
        queryItems: pipe(
            queryItems,
            tap(({ items }) => setLoginItemsCount(items.length))
        ),
        setLoginItemsCount,
    };
};

export type CSAutofillService = ReturnType<typeof createCSAutofillService>;
