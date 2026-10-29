/** One skill inside a Proton plugin. Saved as `skills/<name>/SKILL.md`, so all three fields stay in English. */
export type ProtonPluginSkill = {
    name: string;
    description: string;
    instructions: string;
};

/**
 * A kind of tool the plugin's skills can use, saved as a row of `CONNECTORS.md`. `included` names
 * connectors Lumo Desktop offers; `alternatives` are shown only once the user has them.
 */
export type ProtonPluginConnector = {
    category: string;
    placeholder: `~~${string}`;
    included: string[];
    alternatives?: string[];
};
