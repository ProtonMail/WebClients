import { MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';

import * as getComposerAssistantUpsellConfigModule from './cases/getComposerAssistantUpsellConfig';
import * as getDefaultMailUpsellConfigModule from './cases/getDefaultMailUpsellConfig';
import * as getFreeUserUpsellConfigModule from './cases/getFreeUserUpsellConfig';
import * as getProtonSentinelUpsellConfigModule from './cases/getProtonSentinelUpsellConfig';
import { getMailUpsellConfig } from './getMailUpsellConfig';

jest.mock('./cases/getComposerAssistantUpsellConfig');
jest.mock('./cases/getProtonSentinelUpsellConfig');
jest.mock('./cases/getDefaultMailUpsellConfig');
jest.mock('./cases/getFreeUserUpsellConfig');

const getSpies = () => {
    return {
        getComposerAssistantUpsellConfig: jest.spyOn(
            getComposerAssistantUpsellConfigModule,
            'getComposerAssistantUpsellConfig'
        ),
        getProtonSentinelUpsellConfig: jest.spyOn(getProtonSentinelUpsellConfigModule, 'getProtonSentinelUpsellConfig'),
        getDefaultMailUpsellConfig: jest.spyOn(getDefaultMailUpsellConfigModule, 'getDefaultMailUpsellConfig'),
        getFreeUserUpsellConfig: jest.spyOn(getFreeUserUpsellConfigModule, 'getFreeUserUpsellConfig'),
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

        const {
            getComposerAssistantUpsellConfig,
            getProtonSentinelUpsellConfig,
            getDefaultMailUpsellConfig,
            getFreeUserUpsellConfig,
        } = getSpies();

        expect(config).toBeDefined();
        expect(getComposerAssistantUpsellConfig).toHaveBeenCalled();
        expect(getProtonSentinelUpsellConfig).not.toHaveBeenCalled();
        expect(getDefaultMailUpsellConfig).not.toHaveBeenCalled();
        expect(getFreeUserUpsellConfig).not.toHaveBeenCalled();
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

        const {
            getComposerAssistantUpsellConfig,
            getProtonSentinelUpsellConfig,
            getDefaultMailUpsellConfig,
            getFreeUserUpsellConfig,
        } = getSpies();

        expect(config).toBeDefined();
        expect(getComposerAssistantUpsellConfig).not.toHaveBeenCalled();
        expect(getProtonSentinelUpsellConfig).toHaveBeenCalled();
        expect(getDefaultMailUpsellConfig).not.toHaveBeenCalled();
        expect(getFreeUserUpsellConfig).not.toHaveBeenCalled();
    });

    it('Should call the free upsell config', () => {
        // @ts-expect-error - not all params are needed
        const config = getMailUpsellConfig({ upsellRef: undefined, user: { isFree: true } });

        const {
            getComposerAssistantUpsellConfig,
            getProtonSentinelUpsellConfig,
            getDefaultMailUpsellConfig,
            getFreeUserUpsellConfig,
        } = getSpies();

        expect(config).toBeDefined();
        expect(getComposerAssistantUpsellConfig).not.toHaveBeenCalled();
        expect(getProtonSentinelUpsellConfig).not.toHaveBeenCalled();
        expect(getDefaultMailUpsellConfig).not.toHaveBeenCalled();
        expect(getFreeUserUpsellConfig).toHaveBeenCalled();
    });

    it('Should call the default upsell config', () => {
        // @ts-expect-error - not all params are needed
        const config = getMailUpsellConfig({ upsellRef: undefined, user: { isFree: false } });

        const {
            getComposerAssistantUpsellConfig,
            getProtonSentinelUpsellConfig,
            getDefaultMailUpsellConfig,
            getFreeUserUpsellConfig,
        } = getSpies();

        expect(config).toBeDefined();
        expect(getComposerAssistantUpsellConfig).not.toHaveBeenCalled();
        expect(getProtonSentinelUpsellConfig).not.toHaveBeenCalled();
        expect(getDefaultMailUpsellConfig).toHaveBeenCalled();
        expect(getFreeUserUpsellConfig).not.toHaveBeenCalled();
    });
});
