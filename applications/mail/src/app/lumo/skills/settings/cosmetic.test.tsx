import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import { DENSITY } from '@proton/shared/lib/constants';
import type { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import { VIEW_LAYOUT, VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';
import { ThemeTypes } from '@proton/shared/lib/themes/constants';
import type { ThemeInformation } from '@proton/shared/lib/themes/themes';

import type { MailToolDeps } from '../../toolModule';
import {
    ChangeSettingsField,
    CosmeticSetting,
    DensityToken,
    GroupingToken,
    LayoutToken,
    changeSettingsCardRenderer,
    changeSettingsDefinition,
    changeSettingsModule,
    readSettingsModule,
} from './cosmetic';

interface Stored {
    viewLayout?: VIEW_LAYOUT;
    viewMode?: VIEW_MODE;
    density?: DENSITY;
    theme?: string;
}

const anyReferences = createReferenceRegistry();

const setUp = ({
    viewLayout = VIEW_LAYOUT.COLUMN,
    viewMode = VIEW_MODE.GROUP,
    density = DENSITY.COMFORTABLE,
    theme = 'Proton',
}: Stored = {}) => {
    /** Keyed by setting, so a test can assert that the OTHER three settings were left alone. */
    const writes: Record<CosmeticSetting, jest.Mock> = {
        [CosmeticSetting.LAYOUT]: jest.fn().mockResolvedValue(undefined),
        [CosmeticSetting.CONVERSATION_GROUPING]: jest.fn().mockResolvedValue(undefined),
        [CosmeticSetting.DENSITY]: jest.fn().mockResolvedValue(undefined),
        [CosmeticSetting.THEME]: jest.fn(),
    };
    const deps = {
        getMailSettings: () => ({ ViewLayout: viewLayout, ViewMode: viewMode }) as MailSettings,
        getUserSettings: () => ({ Density: density }) as UserSettings,
        getThemeInformation: () => ({ label: theme }) as ThemeInformation,
        setViewLayout: writes[CosmeticSetting.LAYOUT],
        setViewMode: writes[CosmeticSetting.CONVERSATION_GROUPING],
        setDensity: writes[CosmeticSetting.DENSITY],
        setTheme: writes[CosmeticSetting.THEME],
    } as unknown as MailToolDeps;

    const read = () => readSettingsModule.createHandler(deps)({}, { references: createReferenceRegistry() });
    const change = (setting: string, value: string) =>
        changeSettingsModule.createHandler(deps)({ setting, value }, { references: createReferenceRegistry() });

    const expectNothingWritten = () => Object.values(writes).forEach((write) => expect(write).not.toHaveBeenCalled());

    return { writes, read, change, expectNothingWritten };
};

/** A refusal must carry ToolInputError, or the model is told a generic failure it cannot correct. */
const refusalFrom = async (write: Promise<void>): Promise<string> => {
    const error = await write.then(() => undefined).catch((thrown) => thrown);
    expect(error).toBeInstanceOf(ToolInputError);
    return (error as Error).message;
};

describe('readSettingsModule', () => {
    it.each([
        [
            { viewLayout: VIEW_LAYOUT.COLUMN, viewMode: VIEW_MODE.GROUP, density: DENSITY.COMFORTABLE },
            {
                layout: LayoutToken.COLUMN,
                conversation_grouping: GroupingToken.GROUPED,
                density: DensityToken.COMFORTABLE,
                theme: 'Proton',
            },
        ],
        [
            { viewLayout: VIEW_LAYOUT.ROW, viewMode: VIEW_MODE.SINGLE, density: DENSITY.COMPACT, theme: 'Carbon' },
            {
                layout: LayoutToken.ROW,
                conversation_grouping: GroupingToken.SINGLE,
                density: DensityToken.COMPACT,
                theme: 'Carbon',
            },
        ],
    ])('reports the stored values as the tokens change_settings accepts: %o', async (stored, reported) => {
        const { read } = setUp(stored);

        await expect(read()).resolves.toEqual(reported);
    });
});

describe('changeSettingsModule', () => {
    // Each row starts from the value it is NOT writing, or the no-op guard would refuse it.
    it.each([
        [{ viewLayout: VIEW_LAYOUT.ROW }, CosmeticSetting.LAYOUT, LayoutToken.COLUMN, VIEW_LAYOUT.COLUMN],
        [{}, CosmeticSetting.LAYOUT, LayoutToken.ROW, VIEW_LAYOUT.ROW],
        [{ viewMode: VIEW_MODE.SINGLE }, CosmeticSetting.CONVERSATION_GROUPING, GroupingToken.GROUPED, VIEW_MODE.GROUP],
        [{}, CosmeticSetting.CONVERSATION_GROUPING, GroupingToken.SINGLE, VIEW_MODE.SINGLE],
        [{ density: DENSITY.COMPACT }, CosmeticSetting.DENSITY, DensityToken.COMFORTABLE, DENSITY.COMFORTABLE],
        [{}, CosmeticSetting.DENSITY, DensityToken.COMPACT, DENSITY.COMPACT],
        // A theme is resolved to the app's own identifier by the name it displays, whatever case the
        // model sends it in — the other three are closed token sets.
        [{}, CosmeticSetting.THEME, 'Carbon', ThemeTypes.Carbon],
        [{}, CosmeticSetting.THEME, ' carbon ', ThemeTypes.Carbon],
    ])('writes %o %s=%s and touches no other setting', async (stored, setting, value, written) => {
        const { writes, change } = setUp(stored);

        await change(setting, value);

        expect(writes[setting]).toHaveBeenCalledWith(written);
        Object.entries(writes)
            .filter(([other]) => other !== setting)
            .forEach(([, write]) => expect(write).not.toHaveBeenCalled());
    });

    // The engine appends this to the applied-tool result. The new value supersedes the read_settings
    // going stale in the working set; the replaced one is the target of a later "put it back", which a
    // second read_settings would have overwritten.
    it.each([
        [CosmeticSetting.LAYOUT, LayoutToken.ROW, 'layout is now row (was column).'],
        [CosmeticSetting.DENSITY, DensityToken.COMPACT, 'density is now compact (was comfortable).'],
        // The account's spelling, not the model's — so a later "is it already X?" compares like with like.
        [CosmeticSetting.THEME, ' carbon ', 'theme is now Carbon (was Proton).'],
    ])('reports back the value it applied, and the one it replaced, for %s=%s', async (setting, value, reported) => {
        const { change } = setUp();

        const result = await change(setting, value);

        expect(changeSettingsDefinition.serializeForLumo(result, anyReferences)).toBe(reported);
    });

    it('refuses an unknown setting, naming the ones it does accept', async () => {
        const { change, expectNothingWritten } = setUp();

        expect(await refusalFrom(change('font', 'big'))).toContain('layout, conversation_grouping, density, theme');
        expectNothingWritten();
    });

    it.each([
        [CosmeticSetting.LAYOUT, 'column, row'],
        [CosmeticSetting.CONVERSATION_GROUPING, 'grouped, single'],
        [CosmeticSetting.DENSITY, 'comfortable, compact'],
    ])('refuses a value %s does not accept, listing the ones it does', async (setting, accepted) => {
        const { change, expectNothingWritten } = setUp();

        expect(await refusalFrom(change(setting, 'tiny'))).toContain(accepted);
        expectNothingWritten();
    });

    it('refuses a theme the account does not offer, listing the available names', async () => {
        const { change, expectNothingWritten } = setUp();

        expect(await refusalFrom(change(CosmeticSetting.THEME, 'Midnight'))).toContain('Carbon');
        expectNothingWritten();
    });

    // The guard is answered by the store, never by an earlier read the model may be misremembering.
    // The refusal names the value the store holds, in the store's own spelling, so the model can act on
    // it without a read; that its tense stops a replayed refusal being obeyed on a later turn is prose,
    // and is not asserted here.
    it.each([
        [CosmeticSetting.LAYOUT, LayoutToken.COLUMN, LayoutToken.COLUMN],
        [CosmeticSetting.CONVERSATION_GROUPING, GroupingToken.GROUPED, GroupingToken.GROUPED],
        [CosmeticSetting.DENSITY, DensityToken.COMFORTABLE, DensityToken.COMFORTABLE],
        [CosmeticSetting.THEME, 'proton', 'Proton'],
    ])('refuses %s=%s as a no-op, naming the %s it holds', async (setting, value, held) => {
        const { change, expectNothingWritten } = setUp();

        const refusal = await refusalFrom(change(setting, value));

        expect(refusal).toContain(setting);
        expect(refusal).toContain(held);
        expectNothingWritten();
    });

    it('exempts both params from the reference guard, since neither can hold an id', () => {
        const guarded = Object.keys(changeSettingsDefinition.paramsSchema.properties).filter(
            (param) => !changeSettingsDefinition.freeTextParams?.includes(param)
        );

        expect(guarded).toEqual([]);
    });
});

describe('changeSettingsCardRenderer', () => {
    const params = (setting: string, value: string) => ({
        [ChangeSettingsField.SETTING]: setting,
        [ChangeSettingsField.VALUE]: value,
    });

    // The picker renders nothing when it cannot resolve the options, so canApply is the only thing
    // standing between a value the card never showed and an applied write.
    it.each([
        ['a value the setting accepts', params(CosmeticSetting.DENSITY, DensityToken.COMPACT), true],
        ['a theme the account offers', params(CosmeticSetting.THEME, 'Carbon'), true],
        ['a value belonging to another setting', params(CosmeticSetting.DENSITY, LayoutToken.ROW), false],
        ['a theme the account does not offer', params(CosmeticSetting.THEME, 'Midnight'), false],
        ['an unknown setting', params('font', 'big'), false],
        ['no value at all', params(CosmeticSetting.DENSITY, ''), false],
    ])('allows Confirm only for %s', (_case, given, applyable) => {
        expect(changeSettingsCardRenderer.canApply?.(given)).toBe(applyable);
    });

    it('names the setting and its chosen value in the words the card showed, not in tokens', () => {
        const action = {
            type: 'change_settings',
            ...params(CosmeticSetting.CONVERSATION_GROUPING, GroupingToken.SINGLE),
        };

        expect(changeSettingsCardRenderer.subtitle?.(action, {})).toBe('Conversation grouping');
        expect(changeSettingsCardRenderer.detail?.(action, {})).toBe('Single messages');
    });

    it('leaves the tile unsubtitled rather than captioning it with a setting the card cannot render', () => {
        const action = { type: 'change_settings', ...params('font', 'big') };

        expect(changeSettingsCardRenderer.subtitle?.(action, {})).toBeUndefined();
    });
});
