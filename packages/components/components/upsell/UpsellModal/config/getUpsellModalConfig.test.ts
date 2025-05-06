import { MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';

import * as composerAssistantConfigModule from '../configs/getUpsellModalComposerAssistantConfig';
import * as defaultConfigModule from '../configs/getUpsellModalDefaultConfig';
import * as freeUserConfigModule from '../configs/getUpsellModalFreeUserConfig';
import * as protonSentinelConfigModule from '../configs/getUpsellModalProtonSentinelConfig';
import { getMailUpsellConfig } from './getUpsellModalConfig';

jest.mock('../configs/getUpsellModalComposerAssistantConfig');
jest.mock('../configs/getUpsellModalDefaultConfig');
jest.mock('../configs/getUpsellModalFreeUserConfig');
jest.mock('../configs/getUpsellModalProtonSentinelConfig');

const getSpies = () => {
    return {
        composerAssistantConfig: jest.spyOn(composerAssistantConfigModule, 'getUpsellModalComposerAssistantConfig'),
        protonSentinelConfig: jest.spyOn(protonSentinelConfigModule, 'getUpsellModalProtonSentinelConfig'),
        defaultConfig: jest.spyOn(defaultConfigModule, 'getUpsellModalDefaultConfig'),
        freeUserConfig: jest.spyOn(freeUserConfigModule, 'getUpsellModalFreeUserConfig'),
    };
};

describe('getMailUpsellConfig', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Should call the composer assistant upsell config', () => {
        const config = getMailUpsellConfig({
            upsellRef: getUpsellRef({
                app: 'upsell_mail-',
                feature: MAIL_UPSELL_PATHS.ASSISTANT_COMPOSER,
            }),
            // @ts-expect-error
            user: { isFree: true },
        });

        const { composerAssistantConfig, protonSentinelConfig, defaultConfig, freeUserConfig } = getSpies();

        expect(config).toBeDefined();
        expect(composerAssistantConfig).toHaveBeenCalled();
        expect(protonSentinelConfig).not.toHaveBeenCalled();
        expect(defaultConfig).not.toHaveBeenCalled();
        expect(freeUserConfig).not.toHaveBeenCalled();
    });

    it('Should call the proton sentinel upsell config', () => {
        const config = getMailUpsellConfig({
            upsellRef: getUpsellRef({
                app: 'upsell_mail-',
                feature: MAIL_UPSELL_PATHS.PROTON_SENTINEL,
            }),
            // @ts-expect-error
            user: { isFree: true },
        });

        const { composerAssistantConfig, protonSentinelConfig, defaultConfig, freeUserConfig } = getSpies();

        expect(config).toBeDefined();
        expect(composerAssistantConfig).not.toHaveBeenCalled();
        expect(protonSentinelConfig).toHaveBeenCalled();
        expect(defaultConfig).not.toHaveBeenCalled();
        expect(freeUserConfig).not.toHaveBeenCalled();
    });

    it('Should call the free upsell config', () => {
        // @ts-expect-error - not all params are needed
        const config = getMailUpsellConfig({ upsellRef: undefined, user: { isFree: true } });

        const { composerAssistantConfig, protonSentinelConfig, defaultConfig, freeUserConfig } = getSpies();

        expect(config).toBeDefined();
        expect(composerAssistantConfig).not.toHaveBeenCalled();
        expect(protonSentinelConfig).not.toHaveBeenCalled();
        expect(defaultConfig).not.toHaveBeenCalled();
        expect(freeUserConfig).toHaveBeenCalled();
    });

    it('Should call the default upsell config', () => {
        // @ts-expect-error - not all params are needed
        const config = getMailUpsellConfig({ upsellRef: undefined, user: { isFree: false } });

        const { composerAssistantConfig, protonSentinelConfig, defaultConfig, freeUserConfig } = getSpies();

        expect(config).toBeDefined();
        expect(composerAssistantConfig).not.toHaveBeenCalled();
        expect(protonSentinelConfig).not.toHaveBeenCalled();
        expect(defaultConfig).toHaveBeenCalled();
        expect(freeUserConfig).not.toHaveBeenCalled();
    });
});
