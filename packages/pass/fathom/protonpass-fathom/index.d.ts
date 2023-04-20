import { Fnode, domQuery, rule, ruleset, score } from './fathom.js';
import * as fathomWeb from './fathom.js';

export { fathomWeb as fathom };

type AnyRule = ReturnType<typeof rule>;
type Coeff = [string, number];
type ProtonPassTrainee = {
    name: string;
    coeffs: Coeff[];
    bias: number;
    getRules: () => AnyRule[];
};
declare const rulesetMaker: () => ReturnType<typeof ruleset>;
declare const trainees: {
    [key: string]: ProtonPassTrainee;
};

declare const FORM_ATTRIBUTES: string[];
declare const OAUTH_FORM_ATTRIBUTES: string[];
declare const INPUT_ATTRIBUTES: string[];
declare const LABEL_ATTRIBUTES: string[];
declare const SUBMIT_ATTRIBUTES: string[];
declare const LINK_ATTRIBUTES: string[];
declare const getAttributes: (attributes: string[]) => (el: HTMLElement) => string[];
declare const getAllAttributes: (el: HTMLElement) => string[];

declare const parseSaturation: (color: string) => number;

declare const getCommonAncestor: (elementA: HTMLElement, elementB: HTMLElement) => HTMLElement;

declare const isVisible: (node: Fnode | HTMLElement) => boolean;

declare const headingSelector: string;
declare const overlayDialogSelector: () => string;
declare const inputFieldSelector: (options?: { excludeEmptyType: boolean }) => string;
declare const inputChoiceFieldSelector: () => string;
declare const usernameFieldSelector: (options?: { includeHiddenFields: boolean }) => string;
declare const submitButtonSelector: () => string;
declare const anchorLinkSelector: () => string;

declare const sanitizeString: (str: string) => string;
declare const getText: (el: HTMLElement) => string;
declare const getParentText: (el: HTMLElement) => string;

declare const walkUp: (
    maxDepth: number
) => (el: HTMLElement) => (match: (el: HTMLElement) => null | HTMLElement | HTMLElement[]) => HTMLElement[];
declare const walkUpWhile: (
    maxDepth: number
) => (el: HTMLElement) => (check: (el: HTMLElement) => boolean) => HTMLElement;
declare const walkUpMatch: (maxDepth: number) => (el: HTMLElement) => (match: (el: HTMLElement) => boolean) => boolean;
declare const getNthParent: (el: HTMLElement) => (n: number) => HTMLElement;

declare const getInputLabel: (el: HTMLElement) => HTMLElement;

declare const isInputElement: (el: HTMLElement) => el is HTMLInputElement;
declare const isFieldInputOfInterest: (
    el: HTMLInputElement,
    options?: {
        selector?: string;
        includeDisabled?: boolean;
    }
) => boolean;

declare const smellsLikeSubmitButton: (el: HTMLElement) => boolean;
declare const getPossibleSubmitButtons: (target?: HTMLElement | Document) => HTMLElement[];

type FnodeScoringFunc = (node: Fnode) => number;
type FnodeMatchFunc = (node: Fnode) => boolean;

declare const boolScore: (predicate: FnodeMatchFunc) => ReturnType<typeof score>;

declare const getFormLikeClusters: (doc: Document) => HTMLElement[];
declare const formLikeDom: () => ReturnType<typeof domQuery>;

declare const attributesRegexSmells: (el: HTMLElement) => (attributes: string[]) => (regexes: RegExp[]) => boolean;
declare const inputAttributeRegexSmells: (el: HTMLInputElement) => (regexes: RegExp[]) => boolean;
declare const attributesMatchWith: (attributes: string[], predicate: (attr: string) => boolean) => FnodeMatchFunc;

declare const matchClosestSiblingForms: (forms: Fnode[]) => (fnode: Fnode) => Fnode | undefined;
declare const belongsToFormType: (formType: string) => FnodeMatchFunc;
declare const belongsToFormTypes: (formTypes: string[]) => FnodeScoringFunc;

type FieldFeatures = {
    form: Fnode | undefined;
};
declare const getFieldFeatures: (fnode: Fnode) => FieldFeatures;
declare const getNoteForField: (fnode: Fnode) => FieldFeatures;

type NoteFormFeatures = {
    isForm: boolean;
    fields: {
        input: HTMLInputElement[];
        email: HTMLInputElement[];
        telephone: HTMLInputElement[];
        password: HTMLInputElement[];
        checkbox: HTMLInputElement[];
        radio: HTMLInputElement[];
        text: HTMLInputElement[];
        textarea: HTMLTextAreaElement[];
        select: HTMLSelectElement[];
        submit: HTMLInputElement[];
        button: (HTMLButtonElement | HTMLDivElement)[];
        link: (HTMLAnchorElement | HTMLSpanElement)[];
    };
    candidates: {
        username: HTMLInputElement[];
        submit: HTMLElement[];
    };
};
declare const getFormFeatures: (fnode: Fnode) => NoteFormFeatures;
declare const getNoteForForm: (fnode: Fnode) => NoteFormFeatures;

declare const nearestHeadingsMatch: (regexes: RegExp[]) => FnodeMatchFunc;

declare const matchAny: (regexes: RegExp[]) => (haystack: string[]) => boolean;

declare const REGEXES: {
    login: {
        LOGIN_ATTR: RegExp;
        LOGIN_WORDS: RegExp;
    };
    register: {
        REGISTER_ATTR: RegExp;
        REGISTER_WORDS: RegExp;
    };
    actions: {
        ISSUE_WORDS: RegExp;
        REMEMBER_ME_WORDS: RegExp;
        RECOVERY_WORDS: RegExp;
        SEARCH_WORDS: RegExp;
        MULTI_STEP_WORDS: RegExp;
        SAVE_WORDS: RegExp;
        OAUTH_PROVIDERS: RegExp;
        TOTP_WORDS: RegExp;
        TERMS_OF_SERVICE: RegExp;
    };
    fields: {
        password: {
            PASSWORD_WORDS: RegExp;
            CONFIRM_PASSWORD_ATTR: RegExp;
            NEW_PASSWORD_ATTR: RegExp;
            NEW_PASSWORD_WORDS: RegExp;
        };
        email: {
            EMAIL_ATTR: RegExp;
        };
        username: {
            USERNAME_ATTR: RegExp;
        };
        telephone: {
            TELEPHONE_ATTR: RegExp;
        };
    };
};

declare const index_d_FORM_ATTRIBUTES: typeof FORM_ATTRIBUTES;
declare const index_d_OAUTH_FORM_ATTRIBUTES: typeof OAUTH_FORM_ATTRIBUTES;
declare const index_d_INPUT_ATTRIBUTES: typeof INPUT_ATTRIBUTES;
declare const index_d_LABEL_ATTRIBUTES: typeof LABEL_ATTRIBUTES;
declare const index_d_SUBMIT_ATTRIBUTES: typeof SUBMIT_ATTRIBUTES;
declare const index_d_LINK_ATTRIBUTES: typeof LINK_ATTRIBUTES;
declare const index_d_getAttributes: typeof getAttributes;
declare const index_d_getAllAttributes: typeof getAllAttributes;
declare const index_d_parseSaturation: typeof parseSaturation;
declare const index_d_getCommonAncestor: typeof getCommonAncestor;
declare const index_d_isVisible: typeof isVisible;
declare const index_d_headingSelector: typeof headingSelector;
declare const index_d_overlayDialogSelector: typeof overlayDialogSelector;
declare const index_d_inputFieldSelector: typeof inputFieldSelector;
declare const index_d_inputChoiceFieldSelector: typeof inputChoiceFieldSelector;
declare const index_d_usernameFieldSelector: typeof usernameFieldSelector;
declare const index_d_submitButtonSelector: typeof submitButtonSelector;
declare const index_d_anchorLinkSelector: typeof anchorLinkSelector;
declare const index_d_sanitizeString: typeof sanitizeString;
declare const index_d_getText: typeof getText;
declare const index_d_getParentText: typeof getParentText;
declare const index_d_walkUp: typeof walkUp;
declare const index_d_walkUpWhile: typeof walkUpWhile;
declare const index_d_walkUpMatch: typeof walkUpMatch;
declare const index_d_getNthParent: typeof getNthParent;
declare const index_d_getInputLabel: typeof getInputLabel;
declare const index_d_isInputElement: typeof isInputElement;
declare const index_d_isFieldInputOfInterest: typeof isFieldInputOfInterest;
declare const index_d_smellsLikeSubmitButton: typeof smellsLikeSubmitButton;
declare const index_d_getPossibleSubmitButtons: typeof getPossibleSubmitButtons;
declare const index_d_boolScore: typeof boolScore;
declare const index_d_getFormLikeClusters: typeof getFormLikeClusters;
declare const index_d_formLikeDom: typeof formLikeDom;
declare const index_d_attributesRegexSmells: typeof attributesRegexSmells;
declare const index_d_inputAttributeRegexSmells: typeof inputAttributeRegexSmells;
declare const index_d_attributesMatchWith: typeof attributesMatchWith;
declare const index_d_matchClosestSiblingForms: typeof matchClosestSiblingForms;
declare const index_d_belongsToFormType: typeof belongsToFormType;
declare const index_d_belongsToFormTypes: typeof belongsToFormTypes;
type index_d_FieldFeatures = FieldFeatures;
declare const index_d_getFieldFeatures: typeof getFieldFeatures;
declare const index_d_getNoteForField: typeof getNoteForField;
type index_d_NoteFormFeatures = NoteFormFeatures;
declare const index_d_getFormFeatures: typeof getFormFeatures;
declare const index_d_getNoteForForm: typeof getNoteForForm;
declare const index_d_nearestHeadingsMatch: typeof nearestHeadingsMatch;
declare const index_d_matchAny: typeof matchAny;
declare const index_d_REGEXES: typeof REGEXES;
declare namespace index_d {
    export {
        index_d_FORM_ATTRIBUTES as FORM_ATTRIBUTES,
        index_d_OAUTH_FORM_ATTRIBUTES as OAUTH_FORM_ATTRIBUTES,
        index_d_INPUT_ATTRIBUTES as INPUT_ATTRIBUTES,
        index_d_LABEL_ATTRIBUTES as LABEL_ATTRIBUTES,
        index_d_SUBMIT_ATTRIBUTES as SUBMIT_ATTRIBUTES,
        index_d_LINK_ATTRIBUTES as LINK_ATTRIBUTES,
        index_d_getAttributes as getAttributes,
        index_d_getAllAttributes as getAllAttributes,
        index_d_parseSaturation as parseSaturation,
        index_d_getCommonAncestor as getCommonAncestor,
        index_d_isVisible as isVisible,
        index_d_headingSelector as headingSelector,
        index_d_overlayDialogSelector as overlayDialogSelector,
        index_d_inputFieldSelector as inputFieldSelector,
        index_d_inputChoiceFieldSelector as inputChoiceFieldSelector,
        index_d_usernameFieldSelector as usernameFieldSelector,
        index_d_submitButtonSelector as submitButtonSelector,
        index_d_anchorLinkSelector as anchorLinkSelector,
        index_d_sanitizeString as sanitizeString,
        index_d_getText as getText,
        index_d_getParentText as getParentText,
        index_d_walkUp as walkUp,
        index_d_walkUpWhile as walkUpWhile,
        index_d_walkUpMatch as walkUpMatch,
        index_d_getNthParent as getNthParent,
        index_d_getInputLabel as getInputLabel,
        index_d_isInputElement as isInputElement,
        index_d_isFieldInputOfInterest as isFieldInputOfInterest,
        index_d_smellsLikeSubmitButton as smellsLikeSubmitButton,
        index_d_getPossibleSubmitButtons as getPossibleSubmitButtons,
        index_d_boolScore as boolScore,
        index_d_getFormLikeClusters as getFormLikeClusters,
        index_d_formLikeDom as formLikeDom,
        index_d_attributesRegexSmells as attributesRegexSmells,
        index_d_inputAttributeRegexSmells as inputAttributeRegexSmells,
        index_d_attributesMatchWith as attributesMatchWith,
        index_d_matchClosestSiblingForms as matchClosestSiblingForms,
        index_d_belongsToFormType as belongsToFormType,
        index_d_belongsToFormTypes as belongsToFormTypes,
        index_d_FieldFeatures as FieldFeatures,
        index_d_getFieldFeatures as getFieldFeatures,
        index_d_getNoteForField as getNoteForField,
        index_d_NoteFormFeatures as NoteFormFeatures,
        index_d_getFormFeatures as getFormFeatures,
        index_d_getNoteForForm as getNoteForForm,
        index_d_nearestHeadingsMatch as nearestHeadingsMatch,
        index_d_matchAny as matchAny,
        index_d_REGEXES as REGEXES,
    };
}

export { ProtonPassTrainee, rulesetMaker, trainees, index_d as utils };
