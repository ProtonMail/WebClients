export type SelectorV1 = string;

export interface DetectionRulesV1 {
    /**
     * rules version to know the structure to parse at runtime
     */
    version: '1';
    rules: {
        /**
         * This interface was referenced by `undefined`'s JSON-Schema definition
         * via the `patternProperty` "^(\w+)(\.(\w+))*(/\w+)*$".
         */
        [k: string]: SelectorV1[];
    };
}
