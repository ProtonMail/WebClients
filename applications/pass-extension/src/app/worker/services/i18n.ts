import { clientReady } from '@proton/pass/lib/client';
import { backgroundMessage } from '@proton/pass/lib/extension/message';
import { createI18nService as createCoreI18nService } from '@proton/pass/lib/i18n/service';
import { WorkerMessageType } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import locales from '../../locales';
import WorkerMessageBroker from '../channel';
import { withContext } from '../context';

export const createI18nService = () => {
    const service = createCoreI18nService({
        locales,
        loadDateLocale: false,
        getLocale: withContext(async (ctx) => {
            const { locale } = await ctx.service.settings.resolve();
            return locale;
        }),
        onLocaleChange: withContext(({ service, getState }, locale) => {
            WorkerMessageBroker.ports.broadcast(
                backgroundMessage({
                    type: WorkerMessageType.LOCALE_UPDATED,
                    payload: { locale },
                })
            );

            if (clientReady(getState().status)) {
                service.settings
                    .resolve()
                    .then((settings) => service.settings.sync({ ...settings, locale }))
                    .catch(noop);
            }
        }),
    });

    WorkerMessageBroker.registerMessage(WorkerMessageType.LOCALE_REQUEST, async () => ({
        locale: await service.getLocale(),
    }));

    return { ...service, init: () => service.getLocale().then(service.setLocale) };
};

export type I18NService = ReturnType<typeof createI18nService>;
