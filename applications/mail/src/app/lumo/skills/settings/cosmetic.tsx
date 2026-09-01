import { c } from 'ttag';

import type { PickerOption } from '@proton/components/components/lumoAgent/cardBodies/PickerFieldBody';
import PickerFieldBody from '@proton/components/components/lumoAgent/cardBodies/PickerFieldBody';
import type { CardRenderer } from '@proton/components/components/lumoAgent/types';
import { IcCogWheel } from '@proton/icons/icons/IcCogWheel';
import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import { DENSITY } from '@proton/shared/lib/constants';
import { VIEW_LAYOUT, VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';
import { getThemes } from '@proton/shared/lib/themes/themes';

import type { MailToolDeps, MailToolModule } from '../../toolModule';

/** The cosmetic settings this pair covers — the one vocabulary both tools speak. */
export enum CosmeticSetting {
    LAYOUT = 'layout',
    CONVERSATION_GROUPING = 'conversation_grouping',
    DENSITY = 'density',
    THEME = 'theme',
}

/** Theme's values are the account's live theme names, so it has no token table. */
type FixedSetting = Exclude<CosmeticSetting, CosmeticSetting.THEME>;

export enum LayoutToken {
    COLUMN = 'column',
    ROW = 'row',
}

export enum GroupingToken {
    GROUPED = 'grouped',
    SINGLE = 'single',
}

export enum DensityToken {
    COMFORTABLE = 'comfortable',
    COMPACT = 'compact',
}

type FixedToken = LayoutToken | GroupingToken | DensityToken;

const LAYOUT_TOKENS: Record<VIEW_LAYOUT, LayoutToken> = {
    [VIEW_LAYOUT.COLUMN]: LayoutToken.COLUMN,
    [VIEW_LAYOUT.ROW]: LayoutToken.ROW,
};

const VIEW_LAYOUTS: Record<LayoutToken, VIEW_LAYOUT> = {
    [LayoutToken.COLUMN]: VIEW_LAYOUT.COLUMN,
    [LayoutToken.ROW]: VIEW_LAYOUT.ROW,
};

const GROUPING_TOKENS: Record<VIEW_MODE, GroupingToken> = {
    [VIEW_MODE.GROUP]: GroupingToken.GROUPED,
    [VIEW_MODE.SINGLE]: GroupingToken.SINGLE,
};

const VIEW_MODES: Record<GroupingToken, VIEW_MODE> = {
    [GroupingToken.GROUPED]: VIEW_MODE.GROUP,
    [GroupingToken.SINGLE]: VIEW_MODE.SINGLE,
};

const DENSITY_TOKENS: Record<DENSITY, DensityToken> = {
    [DENSITY.COMFORTABLE]: DensityToken.COMFORTABLE,
    [DENSITY.COMPACT]: DensityToken.COMPACT,
};

const DENSITIES: Record<DensityToken, DENSITY> = {
    [DensityToken.COMFORTABLE]: DENSITY.COMFORTABLE,
    [DensityToken.COMPACT]: DENSITY.COMPACT,
};

const FIXED_SETTING_TOKENS: Record<FixedSetting, readonly FixedToken[]> = {
    [CosmeticSetting.LAYOUT]: Object.values(LayoutToken),
    [CosmeticSetting.CONVERSATION_GROUPING]: Object.values(GroupingToken),
    [CosmeticSetting.DENSITY]: Object.values(DensityToken),
};

/**
 * How each setting's current value is read, in the vocabulary both tools speak. Shared by
 * `read_settings` and by `change_settings`' no-op guard, so the guard is answered by the store rather
 * than by whatever an earlier read left in the model's context.
 */
const CURRENT_VALUES = {
    [CosmeticSetting.LAYOUT]: (mail: MailToolDeps): LayoutToken => LAYOUT_TOKENS[mail.getMailSettings().ViewLayout],
    [CosmeticSetting.CONVERSATION_GROUPING]: (mail: MailToolDeps): GroupingToken =>
        GROUPING_TOKENS[mail.getMailSettings().ViewMode],
    [CosmeticSetting.DENSITY]: (mail: MailToolDeps): DensityToken => DENSITY_TOKENS[mail.getUserSettings().Density],
    [CosmeticSetting.THEME]: (mail: MailToolDeps): string => mail.getThemeInformation().label,
} satisfies Record<CosmeticSetting, (mail: MailToolDeps) => string>;

export interface ReadSettingsResult {
    layout: LayoutToken;
    conversation_grouping: GroupingToken;
    density: DensityToken;
    /** The applied theme's name, e.g. "Carbon" — the same names `change_settings` accepts. */
    theme: string;
}

export const readSettingsDefinition: ToolDefinition<Record<string, never>, ReadSettingsResult> = {
    name: 'read_settings',
    kind: 'read',
    toolDescription:
        'Read the user\'s current cosmetic display settings: layout (column/row), conversation grouping ("grouped" shows a thread\'s messages as one conversation, "single" lists every message separately — so "single" is grouping switched OFF), density (comfortable/compact) and theme (the applied theme\'s name). Use it to answer questions about the current settings. You do not need it before a change_settings — that tool reads the current value itself. The values it reports are exactly the values change_settings accepts. Read-only.',
    paramsSchema: { type: 'object', additionalProperties: false, required: [], properties: {} },
    serializeForLumo: (result) =>
        [
            'Current settings:',
            `- layout: ${result.layout}`,
            `- conversation_grouping: ${result.conversation_grouping}`,
            `- density: ${result.density}`,
            `- theme: ${result.theme}`,
        ].join('\n'),
    summarizeChip: () => ({ label: c('Info').t`Read your display settings` }),
};

export const createReadSettingsHandler =
    (mail: MailToolDeps): ToolHandler<Record<string, never>, ReadSettingsResult> =>
    async () => ({
        layout: CURRENT_VALUES[CosmeticSetting.LAYOUT](mail),
        conversation_grouping: CURRENT_VALUES[CosmeticSetting.CONVERSATION_GROUPING](mail),
        density: CURRENT_VALUES[CosmeticSetting.DENSITY](mail),
        theme: CURRENT_VALUES[CosmeticSetting.THEME](mail),
    });

export const readSettingsModule: MailToolModule = {
    definition: readSettingsDefinition,
    createHandler: createReadSettingsHandler,
};

/** Both params carry the model's own words rather than a reference, so both are free text. */
export enum ChangeSettingsField {
    SETTING = 'setting',
    VALUE = 'value',
}

export interface ChangeSettingsParams {
    setting: string;
    value: string;
}

export interface ChangeSettingsResult {
    setting: CosmeticSetting;
    /** As actually applied — the account's spelling of a theme name, not the model's. */
    value: string;
    /** What it was before, so a later "put it back" has the target without a re-read. */
    previous: string;
}

export const changeSettingsDefinition: ToolDefinition<ChangeSettingsParams, ChangeSettingsResult> = {
    name: 'change_settings',
    kind: 'mutation',
    toolDescription:
        'Change one of the user\'s cosmetic display settings. `setting` is exactly one of: "layout" (values "column" or "row"), "conversation_grouping" ("grouped" shows a thread\'s messages as one conversation, "single" lists every message separately — so turning grouping OFF means "single" and turning it ON means "grouped"), "density" (values "comfortable" or "compact"), or "theme" (values are theme names, e.g. Proton, Classic, Snow, Legacy, Carbon, Monokai — the account decides which exist, and an unknown name is rejected with the ones it offers). You do NOT need to read the setting first — this tool reads the current value itself. Change ONE setting per call; to change several, propose a separate confirmed call for each. This only changes how the mailbox looks for this user — nothing is deleted and no mail is affected. Proposed to the user for confirmation before it runs.',
    // No enum in the schema: enum under the backend's tool-schema handling is unproven and no shipped
    // definition uses it. The values are enumerated in the description and enforced in the handler,
    // where a bad one becomes a self-correcting error.
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['setting', 'value'],
        properties: { setting: { type: 'string' }, value: { type: 'string' } },
    },
    freeTextParams: Object.values(ChangeSettingsField),
    examples: [
        {
            context:
                'The user asks to turn conversation grouping off. Grouping off is the "single" value, and no read comes first — if that is already what it holds, the tool says so.',
            call: { setting: CosmeticSetting.CONVERSATION_GROUPING, value: GroupingToken.SINGLE },
        },
    ],
    // Unusually for a mutation, this DOES serialise: the engine appends it to the applied-tool result,
    // and it is the only thing that supersedes the now-stale read_settings still in the working set.
    serializeForLumo: (result) => `${result.setting} is now ${result.value} (was ${result.previous}).`,
    summarizeChip: () => ({ label: c('Info').t`Change display setting` }),
};

const asSetting = (value: string): CosmeticSetting | undefined =>
    Object.values(CosmeticSetting).find((setting) => setting === value);

const settingFrom = (value: string): CosmeticSetting => {
    const setting = asSetting(value);
    if (!setting) {
        throw new ToolInputError(
            `Unknown setting "${value}". The settings you can change are: ${Object.values(CosmeticSetting).join(', ')}.`
        );
    }
    return setting;
};

/** `tokens` is the token enum itself, so the accepted values cannot drift from the mapping tables. */
const tokenFrom = <T extends Record<string, string>>(setting: FixedSetting, value: string, tokens: T): T[keyof T] => {
    const allowed: string[] = Object.values(tokens);
    if (!allowed.includes(value)) {
        throw new ToolInputError(`Invalid value "${value}" for ${setting}. Valid values are: ${allowed.join(', ')}.`);
    }
    return value as T[keyof T];
};

/** Themes are resolved by the name the app displays, so the set always matches what it supports. */
const themeFrom = (value: string) => {
    const themes = getThemes();
    const theme = themes.find(({ label }) => label.toLowerCase() === value.trim().toLowerCase());
    if (!theme) {
        const available = themes.map(({ label }) => label).join(', ');
        throw new ToolInputError(`Unknown theme "${value}". The available themes are: ${available}.`);
    }
    return theme;
};

interface PlannedChange {
    /** The value as it will be stored — resolved and validated, so the guard compares like with like. */
    applied: string;
    apply: (mail: MailToolDeps) => Promise<void> | void;
}

/** A switch, not a table: each arm writes through a different endpoint into a different slice. */
const planChange = (setting: CosmeticSetting, value: string): PlannedChange => {
    switch (setting) {
        case CosmeticSetting.LAYOUT: {
            const token = tokenFrom(setting, value, LayoutToken);
            return { applied: token, apply: (mail) => mail.setViewLayout(VIEW_LAYOUTS[token]) };
        }
        case CosmeticSetting.CONVERSATION_GROUPING: {
            const token = tokenFrom(setting, value, GroupingToken);
            return { applied: token, apply: (mail) => mail.setViewMode(VIEW_MODES[token]) };
        }
        case CosmeticSetting.DENSITY: {
            const token = tokenFrom(setting, value, DensityToken);
            return { applied: token, apply: (mail) => mail.setDensity(DENSITIES[token]) };
        }
        case CosmeticSetting.THEME: {
            const theme = themeFrom(value);
            // setTheme returns void by design: the write is persisted by ThemeInjector's own
            // debounced listener.
            return { applied: theme.label, apply: (mail) => mail.setTheme(theme.identifier) };
        }
    }
};

export const createChangeSettingsHandler =
    (mail: MailToolDeps): ToolHandler<ChangeSettingsParams, ChangeSettingsResult> =>
    async ({ setting, value }) => {
        const chosen = settingFrom(setting);
        const { applied, apply } = planChange(chosen, value);
        const previous = CURRENT_VALUES[chosen](mail);
        if (applied === previous) {
            // Past tense, and no instruction about what to say: this refusal is replayed on every later
            // turn, where a standing "it is already X, do not change it" is both false and obeyed.
            throw new ToolInputError(
                `Nothing was changed: ${chosen} held ${applied} when this call ran. That was its value only then.`
            );
        }
        await apply(mail);
        return { setting: chosen, value: applied, previous };
    };

const settingLabels = (): Record<CosmeticSetting, string> => ({
    [CosmeticSetting.LAYOUT]: c('Label').t`Layout`,
    [CosmeticSetting.CONVERSATION_GROUPING]: c('Label').t`Conversation grouping`,
    [CosmeticSetting.DENSITY]: c('Label').t`Density`,
    [CosmeticSetting.THEME]: c('Label').t`Theme`,
});

const tokenLabels = (): Record<FixedToken, string> => ({
    [LayoutToken.COLUMN]: c('Label').t`Column`,
    [LayoutToken.ROW]: c('Label').t`Row`,
    [GroupingToken.GROUPED]: c('Label').t`Grouped conversations`,
    [GroupingToken.SINGLE]: c('Label').t`Single messages`,
    [DensityToken.COMFORTABLE]: c('Label').t`Comfortable`,
    [DensityToken.COMPACT]: c('Label').t`Compact`,
});

/** The card's params come from the model, so an unrecognised setting is a real case, not a hole. */
const settingOf = (params: Record<string, any>): CosmeticSetting | undefined =>
    asSetting(String(params[ChangeSettingsField.SETTING] ?? ''));

const settingLabel = (setting: CosmeticSetting | undefined): string => (setting ? settingLabels()[setting] : '');

const optionsFor = (setting: CosmeticSetting | undefined): PickerOption[] => {
    if (!setting) {
        return [];
    }
    if (setting === CosmeticSetting.THEME) {
        return getThemes().map(({ label }) => ({ value: label, label }));
    }
    const labels = tokenLabels();
    return FIXED_SETTING_TOKENS[setting].map((token) => ({ value: token, label: labels[token] }));
};

const chosenOption = (params: Record<string, any>): PickerOption | undefined => {
    const value = String(params[ChangeSettingsField.VALUE] ?? '');
    return optionsFor(settingOf(params)).find((option) => option.value === value);
};

export const changeSettingsCardRenderer: CardRenderer = {
    icon: IcCogWheel,
    title: () => c('Title').t`Change display setting`,
    subtitle: (action) => settingLabel(settingOf(action)) || undefined,
    renderBody: (props) => {
        const setting = settingOf(props.params);
        return (
            <PickerFieldBody
                {...props}
                field={ChangeSettingsField.VALUE}
                label={settingLabel(setting)}
                options={optionsFor(setting)}
            />
        );
    },
    // The picker renders nothing for an unknown setting or an unresolved value, so without this the
    // card would offer Confirm on something it never showed.
    canApply: (params) => !!chosenOption(params),
    detail: (action) => chosenOption(action)?.label,
};

export const changeSettingsModule: MailToolModule = {
    definition: changeSettingsDefinition,
    createHandler: createChangeSettingsHandler,
    cardRenderer: changeSettingsCardRenderer,
};
