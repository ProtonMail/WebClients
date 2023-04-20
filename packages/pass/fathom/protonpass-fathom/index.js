import { clusters as clusters$1, dom, domQuery, out, rule, ruleset, score, type, utils } from './fathom.js';
import * as fathomWeb from './fathom.js';

export { fathomWeb as fathom };

const sanitizeString = (str) =>
    str
        .toLowerCase()
        .replace(/&nbsp;/g, ' ')
        .trim();

const getText = (el) => sanitizeString(el.innerText || '');

const getParentText = (el) => {
    var _a;
    return sanitizeString(((_a = el.parentElement) === null || _a === void 0 ? void 0 : _a.innerText) || '');
};

const FORM_ATTRIBUTES = ['id', 'class', 'name', 'action', 'jsaction', 'role'];

const OAUTH_FORM_ATTRIBUTES = ['id', 'name'];

const INPUT_ATTRIBUTES = ['id', 'class', 'name', 'aria-label', 'aria-labelledby', 'autocomplete', 'placeholder'];

const LABEL_ATTRIBUTES = ['id', 'class', 'name'];

const SUBMIT_ATTRIBUTES = ['id', 'class', 'href', 'value', 'aria-label', 'aria-labelledby'];

const LINK_ATTRIBUTES = ['id', 'href', 'class', 'aria-label', 'aria-labelledby'];

const getAttributes = (attributes) => (el) =>
    attributes
        .map((attr) => el.getAttribute(attr))
        .filter(Boolean)
        .map(sanitizeString);

const getAllAttributes = (el) => el.getAttributeNames().filter((key) => key !== 'data-fathom');

const { saturation, rgbaFromString } = utils;

const COLOR_REGEX = /^rgb(?:a)?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+)\s*)?\)$/i;

const parseSaturation = (color) => {
    var _a;
    const match = color.match(COLOR_REGEX);
    if (match) {
        const rgba = rgbaFromString(
            `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${(_a = match[4]) !== null && _a !== void 0 ? _a : 1})`
        );
        return saturation(rgba[0], rgba[1], rgba[2]);
    }
    return 0;
};

const getCommonAncestor = (elementA, elementB) => {
    if (elementA === elementB) return elementA;
    return elementA.contains(elementB)
        ? elementA
        : elementA.parentElement
        ? getCommonAncestor(elementA.parentElement, elementB)
        : elementA;
};

const { isVisible: fathomIsVisible, isDomElement } = utils;

const isInput = (el) => el.tagName === 'INPUT' && !el.matches('input[type="submit"]');

const isVisible = (node) => {
    const el = isDomElement(node) ? node : node.element;
    const hidden = el.classList.contains('hidden') || el.matches(`[aria-hidden="true"]`);
    const visible = fathomIsVisible(el) && !hidden;
    return isInput(el) ? visible || (el.readOnly && el.type !== 'hidden' && !hidden) : visible;
};

const headingSelector = [
    ...[1, 2, 3, 4, 5].flatMap((level) => [`h${level}, [aria-level="${level}"]`]),
    '[role="heading"]',
    '[class="title"]',
].join(', ');

const overlayDialogSelector = () => `[role="dialog"], [role="group"], [role="form"]`;

const inputFieldSelector = (options) =>
    `input[type="email"],input[type="text"],input[type="tel"],input[type="password"]${
        !(options === null || options === void 0 ? void 0 : options.excludeEmptyType)
            ? ',input[type=""],input:not([type])'
            : ''
    }`;

const inputChoiceFieldSelector = () => `input[type="checkbox"],input[type="radio"]`;

const usernameFieldSelector = (options) =>
    `input[type="email"],input[type="text"],input[type="tel"],input[type=""],input:not([type])${
        (options === null || options === void 0 ? void 0 : options.includeHiddenFields) ? ',input[type="hidden"]' : ''
    }`;

const submitButtonSelector = () =>
    'button:not([type]), button[type="submit"], button[type="button"], button[name="submit"], button[jsaction], [role="submit"]:not(input), [role="button"]:not(input), [aria-label*="button"]:not(input)';

const anchorLinkSelector = () => `a, span[role="button"]`;

const walkUp = (maxDepth) => (el) => (match) => {
    const parent = el.parentElement;
    if (maxDepth === 0 || parent === null) return [];
    const result = [match(parent) || []].flat();
    return result.length === 0 ? [walkUp(maxDepth - 1)(parent)(match)].flat() : result;
};

const walkUpWhile = (maxDepth) => (el) => (check) => {
    const parent = el.parentElement;
    if (maxDepth === 0 || parent === null) return el;
    return check(parent) ? walkUpWhile(maxDepth - 1)(parent)(check) : parent;
};

const walkUpMatch = (maxDepth) => (el) => (match) => {
    const parent = el.parentElement;
    if (maxDepth === 0 || parent === null) return match(el);
    return match(parent) ? true : walkUpMatch(maxDepth - 1)(parent)(match);
};

const getNthParent = (el) => (n) => {
    const parent = el.parentElement;
    if (parent === null || n === 0) return el;
    return getNthParent(parent)(n - 1);
};

const getInputLabel = (el) => {
    const id = el.getAttribute('id');
    const label = el.querySelector(`label[for="${id}"`);
    const closestLabel = el.closest('label');
    return label || closestLabel || el.parentElement || el;
};

const isInputElement = (el) => el.tagName === 'INPUT';

const isFieldInputOfInterest = (el, options) => {
    var _a;
    const { maxLength } = el;
    return (
        el.matches(
            (_a = options === null || options === void 0 ? void 0 : options.selector) !== null && _a !== void 0
                ? _a
                : inputFieldSelector()
        ) &&
        (maxLength <= 0 || (maxLength >= 8 && maxLength <= 1024)) &&
        !el.matches(`[role="search"]`) &&
        !el.matches(`[aria-label="search"]`) &&
        ((options === null || options === void 0 ? void 0 : options.includeDisabled) ||
            ((el.getAttribute('disabled') === null || !el.disabled) && !Boolean(el.getAttribute('aria-disabled'))))
    );
};

const matchAny = (regexes) => (haystack) =>
    haystack.some((value) => regexes.some((regex) => value.match(regex) !== null));

const { attributesMatch } = utils;

const attributesRegexSmells = (el) => (attributes) => (regexes) => {
    const haystack = getAttributes(Array.from(new Set(attributes)))(el);
    return matchAny(regexes)(haystack);
};

const inputAttributeRegexSmells = (el) => (regexes) => attributesRegexSmells(el)(INPUT_ATTRIBUTES)(regexes);

const attributesMatchWith = (attributes, predicate) => (fnode) => attributesMatch(fnode.element, predicate, attributes);

const LOGIN_ATTR = /sign-in|sign_in|signin|openid|account|step|login|log-in|log_in|submit/gi;

const LOGIN_WORDS = /login|log in|signin|sign in|enter (password|username)/gi;

const REGISTER_ATTR = /sign-up|sign_up|signup|register|join|signon|sign-on|sign_on|^reg$/gi;

const REGISTER_WORDS = /create|register|sign up|signup|join|new|create account|create an account|get started/gi;

const REMEMBER_ME_WORDS = /(keep|remember) me|stay (signed|logged)/gi;

const RECOVERY_WORDS = /help|recover|restor|reset|verify|trouble/gi;

const TOTP_WORDS = /two(-| )factor|totp|2fa|mfa|authenticator/gi;

const SEARCH_WORDS = /search|find|busca/gi;

const MULTI_STEP_WORDS = /continue|next/gi;

const ISSUE_WORDS = /forgot|problem|issue|trouble|help|lost/gi;

const OAUTH_PROVIDERS = /apple|facebook|google|twitch/gi;

const TERMS_OF_SERVICE = /terms|privacy|agree/gi;

const SAVE_WORDS = /save/gi;

const PASSWORD_WORDS = /password|secret|passphrase|pass|key/gi;

const CONFIRM_PASSWORD_ATTR = /confirmation|confirm|repeat|password2/gi;

const NEW_PASSWORD_ATTR = /new-pass|new_pass|new pass|new|reset/gi;

const NEW_PASSWORD_WORDS = /(\d* c(h)ar)|a password/gi;

const EMAIL_ATTR = /email|e-mail|courriel/gi;

const USERNAME_ATTR = /(^user)|username|user-name|user_name|(login$)|login-name|login_name|usr|-id|identif/gi;

const TELEPHONE_ATTR = /telephone|tel|phone/gi;

const REGEXES = {
    login: {
        LOGIN_ATTR,
        LOGIN_WORDS,
    },
    register: {
        REGISTER_ATTR,
        REGISTER_WORDS,
    },
    actions: {
        ISSUE_WORDS,
        REMEMBER_ME_WORDS,
        RECOVERY_WORDS,
        SEARCH_WORDS,
        MULTI_STEP_WORDS,
        SAVE_WORDS,
        OAUTH_PROVIDERS,
        TOTP_WORDS,
        TERMS_OF_SERVICE,
    },
    fields: {
        password: {
            PASSWORD_WORDS,
            CONFIRM_PASSWORD_ATTR,
            NEW_PASSWORD_ATTR,
            NEW_PASSWORD_WORDS,
        },
        email: {
            EMAIL_ATTR,
        },
        username: {
            USERNAME_ATTR,
        },
        telephone: {
            TELEPHONE_ATTR,
        },
    },
};

const smellsLikeSubmitButton = (el) => {
    const submitAttrSmells = attributesRegexSmells(el)(SUBMIT_ATTRIBUTES)([
        REGEXES.login.LOGIN_ATTR,
        REGEXES.register.REGISTER_ATTR,
    ]);
    const submitSmells = matchAny([
        REGEXES.actions.MULTI_STEP_WORDS,
        REGEXES.login.LOGIN_WORDS,
        REGEXES.register.REGISTER_WORDS,
        REGEXES.actions.RECOVERY_WORDS,
        REGEXES.actions.SAVE_WORDS,
    ])([el.innerText]);
    return submitSmells || submitAttrSmells;
};

const getPossibleSubmitButtons = (target) => {
    const doc = target !== null && target !== void 0 ? target : document;
    const submitAttributes = '[type="submit"], [name="submit"], [role="submit"], [aria-label*="submit"], [jsaction]';
    const buttonLikeSelector = ['[role="button"]', '[name="button"]', '[aria-label*="button"]']
        .map((selector) => `${selector}:not(button, input)`)
        .join(',');
    const buttonLike = Array.from(doc.querySelectorAll(buttonLikeSelector)).filter(smellsLikeSubmitButton);
    const inputSubmits = Array.from(doc.querySelectorAll('input[type="submit"]'));
    const buttons = Array.from(doc.querySelectorAll('button')).filter(
        (el) => el.matches(submitAttributes) || smellsLikeSubmitButton(el)
    );
    return buttonLike.concat(inputSubmits).concat(buttons);
};

const boolScore = (predicate) => score((fnode) => (predicate(fnode) ? 1 : 0));

const MAX_FORM_WALK_UP_FOR_FIELDS = 5;

const MAX_FORM_WALK_UP_FOR_HEADINGS = 3;

const MAX_FIELD_WALK_UP_FOR_FORM = 10;

const MIN_SUBMIT_BUTTON_AREA = 2275;

const MAX_VERTICAL_DELTA_FOR_HORIZONTAL_ALIGNMENT = 5;

const MAX_SUBMIT_AREA_HEIGHT = 300;

const MAX_DISTANCE_FOR_FIELDS_CLUSTER_SPLIT = 400;

const { clusters, euclidean } = clusters$1;

const getFormLikeClusters = (doc) => {
    const forms = Array.from(doc.querySelectorAll('form'));
    const groups = Array.from(doc.querySelectorAll(overlayDialogSelector())).filter((el) => {
        const childInputs = Array.from(el.querySelectorAll(inputFieldSelector()));
        const childButtons = Array.from(el.querySelectorAll(submitButtonSelector()));
        return childInputs.length + childButtons.length > 0;
    });
    const filterFormEls = (els) =>
        els.filter(
            (el) =>
                !forms.some((form) => form.contains(el)) &&
                (isInputElement(el) ? el.matches(inputChoiceFieldSelector()) || isFieldInputOfInterest(el) : true)
        );
    const inputs = filterFormEls(Array.from(doc.querySelectorAll(inputFieldSelector())));
    if (inputs.length === 0) return [];
    const buttons = filterFormEls(getPossibleSubmitButtons(doc));
    const candidates = Array.from(new Set([...inputs, ...buttons])).filter(isVisible);
    const theClusters = clusters(candidates, MAX_DISTANCE_FOR_FIELDS_CLUSTER_SPLIT, (a, b) => {
        const groupA = groups.find((group) => group.contains(a));
        const groupB = groups.find((group) => group.contains(b));
        if (groupA !== groupB) {
            if (groupA === undefined || groupB === undefined || !(groupA.contains(groupB) || groupB.contains(groupA)))
                return Number.MAX_SAFE_INTEGER;
        }
        return euclidean(a, b);
    });
    return theClusters
        .map((cluster) => cluster.reduce(getCommonAncestor))
        .filter(
            (ancestor, i, ancestors) =>
                isVisible(ancestor) &&
                !forms.some((form) => ancestor.contains(form) || form.contains(ancestor)) &&
                !ancestors.some((el, j) => (j === i ? false : ancestor.contains(el))) &&
                ancestor.querySelectorAll(inputFieldSelector()).length > 0
        );
};

const formLikeDom = () => domQuery(getFormLikeClusters);

const matchClosestSiblingForms = (forms) => (fnode) => {
    var _a;
    const siblingForm =
        (_a = walkUp(MAX_FIELD_WALK_UP_FOR_FORM)(fnode.element)((el) => el.querySelector('form'))) === null ||
        _a === void 0
            ? void 0
            : _a[0];
    return siblingForm !== undefined ? forms.find(({ element }) => element === siblingForm) : undefined;
};

const _belongsToFormType = (formType) => (fnode) => {
    var _a;
    const forms = fnode._ruleset.get(formType);
    const match =
        (_a = forms.find(({ element }) => element.contains(fnode.element))) !== null && _a !== void 0
            ? _a
            : matchClosestSiblingForms(forms)(fnode);
    return match !== undefined ? match.scoreFor(formType) : 0;
};

const belongsToFormType = (formType) => (fnode) => _belongsToFormType(formType)(fnode) > 0.5;

const belongsToFormTypes = (formTypes) => (fnode) =>
    Math.max(...formTypes.map((formType) => _belongsToFormType(formType)(fnode)));

const getFieldFeatures = (fnode) => {
    var _a;
    const field = fnode.element;
    const forms = fnode._ruleset.get('form');
    const form =
        (_a = forms.find(({ element }) => element.contains(field))) !== null && _a !== void 0
            ? _a
            : matchClosestSiblingForms(forms)(fnode);
    return {
        form,
    };
};

const getNoteForField = (fnode) => fnode.noteFor('field');

const getFormFeatures = (fnode) => {
    const isForm = fnode.element.nodeName === 'FORM';
    const formNode = fnode.element;
    const input = Array.from(formNode.querySelectorAll(inputFieldSelector()));
    const email = input.filter((el) => el.matches('[type="email"], [id="email"]'));
    const telephone = input.filter((el) => el.matches('[type="tel"]'));
    const password = input.filter((el) => el.matches('[type="password"]'));
    const radio = input.filter((el) => el.matches('[type="radio"]'));
    const checkbox = input.filter((el) => el.matches('[type="checkbox"]'));
    const text = input.filter((el) => el.matches('[type="text"]'));
    const select = Array.from(formNode.querySelectorAll('select'));
    const textarea = Array.from(formNode.querySelectorAll('textarea'));
    const submit = Array.from(formNode.querySelectorAll('input[type="submit"]'));
    const target = walkUpWhile(MAX_FORM_WALK_UP_FOR_FIELDS)(formNode)(
        (parent) => parent.querySelectorAll('form').length <= 1
    );
    const link = Array.from(target.querySelectorAll(anchorLinkSelector()));
    const button = Array.from(target.querySelectorAll(submitButtonSelector()));
    const usernameCandidates = Array.from(formNode.querySelectorAll(usernameFieldSelector())).filter(
        (el) =>
            isVisible(el) &&
            (el.matches('input[type="email"]') ||
                inputAttributeRegexSmells(el)([REGEXES.fields.username.USERNAME_ATTR, REGEXES.fields.email.EMAIL_ATTR]))
    );
    const { top, height } = formNode.getBoundingClientRect();
    const limit = top + height - MAX_SUBMIT_AREA_HEIGHT;
    const submitCandidates = [...submit, ...button].filter((el) => el.getBoundingClientRect().top > limit);
    return {
        isForm,
        fields: {
            input,
            email,
            telephone,
            password,
            radio,
            checkbox,
            text,
            select,
            textarea,
            submit,
            button,
            link,
        },
        candidates: {
            username: usernameCandidates,
            submit: submitCandidates,
        },
    };
};

const getNoteForForm = (fnode) => fnode.noteFor('form');

const nearestHeadingsMatch = (regexes) => (fnode) => {
    const matchHeadings = walkUpMatch(MAX_FORM_WALK_UP_FOR_HEADINGS)(fnode.element)((el) => {
        const headings = Array.from(el.querySelectorAll(headingSelector));
        const haystack = headings.map(getText);
        return matchAny(regexes)(haystack);
    });
    return matchHeadings;
};

var index = Object.freeze({
    __proto__: null,
    FORM_ATTRIBUTES,
    OAUTH_FORM_ATTRIBUTES,
    INPUT_ATTRIBUTES,
    LABEL_ATTRIBUTES,
    SUBMIT_ATTRIBUTES,
    LINK_ATTRIBUTES,
    getAttributes,
    getAllAttributes,
    parseSaturation,
    getCommonAncestor,
    isVisible,
    headingSelector,
    overlayDialogSelector,
    inputFieldSelector,
    inputChoiceFieldSelector,
    usernameFieldSelector,
    submitButtonSelector,
    anchorLinkSelector,
    sanitizeString,
    getText,
    getParentText,
    walkUp,
    walkUpWhile,
    walkUpMatch,
    getNthParent,
    getInputLabel,
    isInputElement,
    isFieldInputOfInterest,
    smellsLikeSubmitButton,
    getPossibleSubmitButtons,
    boolScore,
    getFormLikeClusters,
    formLikeDom,
    attributesRegexSmells,
    inputAttributeRegexSmells,
    attributesMatchWith,
    matchClosestSiblingForms,
    belongsToFormType,
    belongsToFormTypes,
    getFieldFeatures,
    getNoteForField,
    getFormFeatures,
    getNoteForForm,
    nearestHeadingsMatch,
    matchAny,
    REGEXES,
});

const formNearestHeadings$1 = nearestHeadingsMatch([REGEXES.login.LOGIN_WORDS]);

const formAttributes$1 = attributesMatchWith(FORM_ATTRIBUTES, (attr) => attr.match(REGEXES.login.LOGIN_ATTR) !== null);

const formFieldsCount = (fnode) => {
    const formFeatures = getNoteForForm(fnode);
    const { fields } = formFeatures;
    const candidates = fields.input.filter(
        (el) =>
            isVisible(el) &&
            isFieldInputOfInterest(el, {
                selector: inputFieldSelector({
                    excludeEmptyType: true,
                }),
                includeDisabled: true,
            })
    );
    return candidates.length >= 1 && candidates.length <= 2 && fields.textarea.length === 0;
};

const formRememberMe = (fnode) => {
    const formFeatures = getNoteForForm(fnode);
    const { fields } = formFeatures;
    const haystack = fields.checkbox
        .flatMap((el) => {
            const label = getInputLabel(fnode.element);
            return [
                getText(el),
                getParentText(el),
                getAttributes(INPUT_ATTRIBUTES)(el),
                label && getAttributes(LABEL_ATTRIBUTES)(label),
                label && getText(label),
            ].filter(Boolean);
        })
        .join(' ');
    return haystack.match(REGEXES.actions.REMEMBER_ME_WORDS) !== null;
};

const loginFormOutlier = (fnode) => {
    const outlierRegexes = [
        REGEXES.actions.ISSUE_WORDS,
        REGEXES.actions.RECOVERY_WORDS,
        REGEXES.actions.SEARCH_WORDS,
        REGEXES.actions.TOTP_WORDS,
        REGEXES.register.REGISTER_WORDS,
        REGEXES.register.REGISTER_ATTR,
        REGEXES.fields.password.NEW_PASSWORD_WORDS,
    ];
    const matchHeadings = nearestHeadingsMatch(outlierRegexes)(fnode);
    const matchFormAttrs = matchAny([...outlierRegexes, REGEXES.register.REGISTER_ATTR])(
        getAttributes(FORM_ATTRIBUTES)(fnode.element)
    );
    return matchHeadings || matchFormAttrs;
};

const forgotPasswordLink = (fnode) => {
    const formFeatures = getNoteForForm(fnode);
    const { fields } = formFeatures;
    const haystack = [...fields.link, ...fields.button]
        .flatMap((el) => [getText(el), getAttributes(SUBMIT_ATTRIBUTES)(el)].filter(Boolean))
        .join(' ');
    return haystack.match(REGEXES.actions.ISSUE_WORDS) !== null;
};

const submitButtonText$1 = (fnode) => {
    const formFeatures = getNoteForForm(fnode);
    const { candidates } = formFeatures;
    const haystack = candidates.submit.flatMap((el) => [
        getText(el),
        getParentText(el),
        ...getAttributes(SUBMIT_ATTRIBUTES)(el),
    ]);
    return matchAny([REGEXES.login.LOGIN_ATTR, REGEXES.login.LOGIN_WORDS])(haystack);
};

const multiStepContinueButton = (fnode) => {
    const formFeatures = getNoteForForm(fnode);
    const { candidates } = formFeatures;
    const haystack = candidates.submit
        .flatMap((el) => [getText(el), getAttributes(SUBMIT_ATTRIBUTES)(el)].filter(Boolean))
        .join(' ');
    const hasContinueButton = haystack.match(REGEXES.actions.MULTI_STEP_WORDS) !== null;
    return hasContinueButton;
};

const multiStepSingleInput = (fnode) => {
    const formFeatures = getNoteForForm(fnode);
    const { fields } = formFeatures;
    const visibleInputs = fields.input.filter((el) => {
        const haystack = getAttributes(INPUT_ATTRIBUTES)(el);
        return (
            isVisible(el) &&
            isFieldInputOfInterest(el, {
                selector: inputFieldSelector({
                    excludeEmptyType: true,
                }),
                includeDisabled: false,
            }) &&
            !matchAny([
                REGEXES.actions.ISSUE_WORDS,
                REGEXES.actions.RECOVERY_WORDS,
                REGEXES.actions.SEARCH_WORDS,
                REGEXES.register.REGISTER_ATTR,
            ])(haystack)
        );
    });
    return visibleInputs.length === 1;
};

const login = {
    name: 'login',
    coeffs: [
        ['loginFormHeadings', 15.760825157165527],
        ['loginFormAttributes', -4.915223121643066],
        ['loginFormFieldsCount', 24.394296646118164],
        ['loginFormRememberMe', 0.032083868980407715],
        ['loginFormSubmitText', 13.081964492797852],
        ['loginFormForgotPassword', 2.478856086730957],
        ['loginFormOutlier', -18.15825843811035],
        ['loginMultiStepSingleInput', 2.8680360317230225],
        ['loginMultiStepSubmit', 4.426187515258789],
    ],
    bias: -28.54460906982422,
    getRules: () => [
        rule(type('form'), type('login'), {}),
        rule(type('login'), boolScore(formNearestHeadings$1), {
            name: 'loginFormHeadings',
        }),
        rule(type('login'), boolScore(formAttributes$1), {
            name: 'loginFormAttributes',
        }),
        rule(type('login'), boolScore(formFieldsCount), {
            name: 'loginFormFieldsCount',
        }),
        rule(type('login'), boolScore(formRememberMe), {
            name: 'loginFormRememberMe',
        }),
        rule(type('login'), boolScore(submitButtonText$1), {
            name: 'loginFormSubmitText',
        }),
        rule(type('login'), boolScore(forgotPasswordLink), {
            name: 'loginFormForgotPassword',
        }),
        rule(type('login'), boolScore(loginFormOutlier), {
            name: 'loginFormOutlier',
        }),
        rule(type('login'), boolScore(multiStepSingleInput), {
            name: 'loginMultiStepSingleInput',
        }),
        rule(type('login'), boolScore(multiStepContinueButton), {
            name: 'loginMultiStepSubmit',
        }),
        rule(type('login'), out('login'), {}),
    ],
};

const hasPasswordField = (fnode) => {
    const { fields } = getNoteForForm(fnode);
    return fields.password.filter(isVisible).length > 0;
};

const hasChoiceFields = (fnode) => {
    const { fields } = getNoteForForm(fnode);
    return [...fields.radio, ...fields.checkbox].filter(isVisible).length > 0;
};

const outlyingNumberOfInputs = (fnode) => {
    const { fields } = getNoteForForm(fnode);
    const numberOfInputs = fields.input.length;
    return numberOfInputs >= 2 && numberOfInputs <= 3;
};

const commonInputPatterns = (fnode) => {
    const counts = [
        {
            username: 1,
            password: 2,
        },
        {
            username: 2,
            password: 1,
        },
        {
            username: 2,
            password: 2,
        },
    ];
    const { fields, candidates } = getNoteForForm(fnode);
    return counts.some(
        (count) => fields.password.length === count.password && candidates.username.length === count.username
    );
};

const hasEmailOrTelephone = (fnode) => {
    const { fields } = getNoteForForm(fnode);
    return [...fields.email, ...fields.telephone].filter(isVisible).length > 0;
};

const formNearestHeadings = nearestHeadingsMatch([REGEXES.register.REGISTER_WORDS]);

const formAttributes = (fnode) =>
    attributesMatchWith(
        getAllAttributes(fnode.element),
        (attr) => attr.match(REGEXES.register.REGISTER_ATTR) !== null
    )(fnode);

const isExternalOAuth = (fnode) => {
    const { fields } = getNoteForForm(fnode);
    const haystack = [...fields.submit, ...fields.button].map(getText).join(' ');
    const textMatch = haystack.match(REGEXES.actions.OAUTH_PROVIDERS) !== null;
    const formAttrMatch = attributesMatchWith(
        OAUTH_FORM_ATTRIBUTES,
        (attr) => attr.match(REGEXES.actions.OAUTH_PROVIDERS) !== null
    )(fnode);
    return formAttrMatch || textMatch;
};

const submitButtonText = (fnode) => {
    const formFeatures = getNoteForForm(fnode);
    const { fields } = formFeatures;
    const haystack = [...fields.button, ...fields.submit].flatMap((el) => [
        getText(el),
        getParentText(el),
        ...getAttributes(SUBMIT_ATTRIBUTES)(el),
    ]);
    return matchAny([
        REGEXES.register.REGISTER_WORDS,
        REGEXES.register.REGISTER_ATTR,
        REGEXES.actions.MULTI_STEP_WORDS,
    ])(haystack);
};

const termsOfServiceLink = (fnode) => {
    const { fields } = getNoteForForm(fnode);
    const haystack = fields.link.map((el) => `${getAttributes(LINK_ATTRIBUTES)(el)} ${el.innerText}`);
    return matchAny([REGEXES.actions.TERMS_OF_SERVICE])(haystack);
};

const registerFormOutlier = (fnode) => {
    const matchHeadings = nearestHeadingsMatch([
        REGEXES.actions.ISSUE_WORDS,
        REGEXES.actions.RECOVERY_WORDS,
        REGEXES.actions.SEARCH_WORDS,
        REGEXES.login.LOGIN_WORDS,
    ])(fnode);
    const matchFormAttrs = matchAny([
        REGEXES.actions.ISSUE_WORDS,
        REGEXES.actions.RECOVERY_WORDS,
        REGEXES.actions.SEARCH_WORDS,
        REGEXES.login.LOGIN_WORDS,
        REGEXES.login.LOGIN_ATTR,
    ])(getAttributes(FORM_ATTRIBUTES)(fnode.element));
    return matchHeadings || matchFormAttrs;
};

const register = {
    name: 'register',
    coeffs: [
        ['registerFormPasswordField', 15.299241065979004],
        ['registerFormChoiceFields', 0.11667203903198242],
        ['registerFormOutlyingInputCount', -6.998233318328857],
        ['registerFormCommonPatterns', 16.917043685913086],
        ['registerFormEmailOrTelephone', 12.907506942749023],
        ['registerFormHeadings', 12.569401741027832],
        ['registerFormAttributes', 11.02485179901123],
        ['registerFormSubmitText', 12.964975357055664],
        ['registerHasTOSLink', 11.520500183105469],
        ['registerOAuthForm', -27.989044189453125],
        ['registerFormOutlier', -12.72606086730957],
    ],
    bias: -25.774303436279297,
    getRules: () => [
        rule(type('form'), type('register'), {}),
        rule(type('register'), boolScore(hasPasswordField), {
            name: 'registerFormPasswordField',
        }),
        rule(type('register'), boolScore(hasChoiceFields), {
            name: 'registerFormChoiceFields',
        }),
        rule(type('register'), boolScore(outlyingNumberOfInputs), {
            name: 'registerFormOutlyingInputCount',
        }),
        rule(type('register'), boolScore(commonInputPatterns), {
            name: 'registerFormCommonPatterns',
        }),
        rule(type('register'), boolScore(hasEmailOrTelephone), {
            name: 'registerFormEmailOrTelephone',
        }),
        rule(type('register'), boolScore(formNearestHeadings), {
            name: 'registerFormHeadings',
        }),
        rule(type('register'), boolScore(formAttributes), {
            name: 'registerFormAttributes',
        }),
        rule(type('register'), boolScore(submitButtonText), {
            name: 'registerFormSubmitText',
        }),
        rule(type('register'), boolScore(termsOfServiceLink), {
            name: 'registerHasTOSLink',
        }),
        rule(type('register'), boolScore(isExternalOAuth), {
            name: 'registerOAuthForm',
        }),
        rule(type('register'), boolScore(registerFormOutlier), {
            name: 'registerFormOutlier',
        }),
        rule(type('register'), out('register'), {}),
    ],
};

const belongsToLoginForm = (fnode) => belongsToFormType(login.name)(fnode);

const belongsToRegisterForm = (fnode) => belongsToFormType(register.name)(fnode);

const formHasNoUsernameFields = (fnode) => {
    const { form } = getNoteForField(fnode);
    const candidates = form !== undefined ? getNoteForForm(form).candidates : undefined;
    if (candidates === undefined) return false;
    return candidates.username.length === 0;
};

const firstPasswordFieldInForm = (fnode) => {
    const { form } = getNoteForField(fnode);
    const fields = form !== undefined ? getNoteForForm(form).fields : undefined;
    if (fields === undefined) return false;
    const position = fields.password.findIndex((el) => el === fnode.element);
    return position === 0;
};

const countPasswordFields = (fnode) => {
    const { form } = getNoteForField(fnode);
    const fields = form !== undefined ? getNoteForForm(form).fields : undefined;
    if (fields === undefined) return 0;
    return fields.password.length;
};

const exactPasswordFieldsCount = (n) => (fnode) => countPasswordFields(fnode) === n;

const atLeastPasswordFieldsCount = (n) => (fnode) => countPasswordFields(fnode) >= n;

const newPasswordSmells = (fnode) =>
    getAttributes(INPUT_ATTRIBUTES)(fnode.element).some(
        (haystack) => haystack.match(REGEXES.fields.password.NEW_PASSWORD_ATTR) !== null
    );

const confirmPasswordSmells = (fnode) =>
    getAttributes(INPUT_ATTRIBUTES)(fnode.element).some(
        (haystack) => haystack.match(REGEXES.fields.password.CONFIRM_PASSWORD_ATTR) !== null
    );

const password = {
    name: 'password',
    coeffs: [
        ['inputIsVisible', 21.720691680908203],
        ['inputBelongsToLoginForm', 10.121841430664062],
        ['inputBelongsToRegisterForm', 16.338586807250977],
        ['inputIsFirstPasswordField', 10.63953971862793],
        ['inputHasNewPasswordSmells', -10.784247398376465],
        ['inputHasConfirmPasswordSmells', 2.7729384899139404],
        ['formHasNoUsernameFields', -6.000030517578125],
        ['formHasOnePassword', -13.611120223999023],
        ['formHasAtLeastTwoPasswords', -7.200803279876709],
    ],
    bias: -13.419804573059082,
    getRules: () => [
        rule(
            type('field').when((fnode) => fnode.element.matches('input[type="password"]')),
            type('password'),
            {}
        ),
        rule(type('password'), boolScore(isVisible), {
            name: 'inputIsVisible',
        }),
        rule(type('password'), boolScore(belongsToLoginForm), {
            name: 'inputBelongsToLoginForm',
        }),
        rule(type('password'), boolScore(belongsToRegisterForm), {
            name: 'inputBelongsToRegisterForm',
        }),
        rule(type('password'), boolScore(firstPasswordFieldInForm), {
            name: 'inputIsFirstPasswordField',
        }),
        rule(type('password'), boolScore(newPasswordSmells), {
            name: 'inputHasNewPasswordSmells',
        }),
        rule(type('password'), boolScore(confirmPasswordSmells), {
            name: 'inputHasConfirmPasswordSmells',
        }),
        rule(type('password'), boolScore(formHasNoUsernameFields), {
            name: 'formHasNoUsernameFields',
        }),
        rule(type('password'), boolScore(exactPasswordFieldsCount(1)), {
            name: 'formHasOnePassword',
        }),
        rule(type('password'), boolScore(atLeastPasswordFieldsCount(2)), {
            name: 'formHasAtLeastTwoPasswords',
        }),
        rule(type('password'), out('password'), {}),
    ],
};

const inputSubmitAttributesSmells = (fnode) =>
    attributesRegexSmells(fnode.element)([...INPUT_ATTRIBUTES, ...SUBMIT_ATTRIBUTES])([
        REGEXES.login.LOGIN_ATTR,
        REGEXES.register.REGISTER_ATTR,
        REGEXES.actions.MULTI_STEP_WORDS,
    ]);

const inputTextSmells = (fnode) =>
    matchAny([
        REGEXES.login.LOGIN_WORDS,
        REGEXES.register.REGISTER_WORDS,
        REGEXES.actions.MULTI_STEP_WORDS,
        REGEXES.actions.RECOVERY_WORDS,
        REGEXES.actions.SEARCH_WORDS,
        REGEXES.actions.SAVE_WORDS,
    ])([fnode.element.innerText]);

const submitBelongsToOutlierForm = (fnode) => !(belongsToLoginForm(fnode) || belongsToRegisterForm(fnode));

const isInputSubmit = (fnode) => fnode.element.matches('input[type="submit"]');

const isButtonAgainstInputSubmit = (fnode) => {
    const { form } = getNoteForField(fnode);
    const candidates = form !== undefined ? getNoteForForm(form).candidates : undefined;
    if (form === undefined || candidates === undefined) return false;
    return fnode.element.matches('button') && candidates.submit.some((el) => el.matches('input[type="submit"]'));
};

const isAtBottomOfForm = (fnode) => {
    const { form } = getNoteForField(fnode);
    const noteForForm = form !== undefined ? getNoteForForm(form) : undefined;
    if (form === undefined || noteForForm === undefined) return false;
    return noteForForm.candidates.submit.includes(fnode.element);
};

const submitButtonSizeCheck = (fnode) => {
    const { width, height } = fnode.element.getBoundingClientRect();
    return width * height > MIN_SUBMIT_BUTTON_AREA;
};

const isOnlyElementOfInterest = (fnode) => {
    const { form } = getNoteForField(fnode);
    const noteForForm = form !== undefined ? getNoteForForm(form) : undefined;
    if (form === undefined || noteForForm === undefined) return false;
    const { fields } = noteForForm;
    const els = [...fields.submit, ...fields.button].filter((el) => el !== fnode.element);
    return els.length === 0;
};

const matchButtonOrderRelevance = (fnode) => {
    const { form } = getNoteForField(fnode);
    const candidates = form !== undefined ? getNoteForForm(form).candidates : undefined;
    if (form === undefined || candidates === undefined || candidates.submit.length === 0) return false;
    const position = candidates.submit.findIndex((el) => el === fnode.element);
    if (position === -1) return false;
    if (candidates.submit.length === 1) return true;
    if (candidates.submit.length === 2) {
        const dy = Math.abs(candidates.submit.map((el) => el.getBoundingClientRect().top).reduce((a, b) => a - b));
        return position === (dy < MAX_VERTICAL_DELTA_FOR_HORIZONTAL_ALIGNMENT ? 1 : 0);
    }
    return position === 0;
};

const isOAuthButton = (fnode) => {
    const haystack = [...getAllAttributes(fnode.element), getText(fnode.element)].join('');
    return haystack.match(REGEXES.actions.OAUTH_PROVIDERS) !== null;
};

const isButtonPrimaryColor = (fnode) => {
    if (fnode.element.classList.toString().includes('primary')) return true;
    const btn = fnode.element;
    const bgColor = window.getComputedStyle(btn).backgroundColor;
    const saturation = parseSaturation(bgColor);
    return saturation > 0.5 || (btn.disabled && saturation < 0.4);
};

const submit = {
    name: 'submit',
    coeffs: [
        ['submitIsVisible', 4.3586578369140625],
        ['submitIsInput', 2.761514902114868],
        ['submitIsButtonAgainstInput', -8.060600280761719],
        ['submitBelongsToLogin', -14.745720863342285],
        ['submitBelongsToRegister', -15.829598426818848],
        ['submitBelongsToOutlierForm', -15.404295921325684],
        ['submitHasAttributesSmells', 1.8346480131149292],
        ['submitIsOAuthButton', -15.902209281921387],
        ['submitHasTextSmells', 6.250668525695801],
        ['submitIsNearBottom', 8.454894065856934],
        ['inputIsOnlyElementOfInterest', 1.6336891651153564],
        ['submitButtonSizeCheck', 7.682969093322754],
        ['submitButtonLooksPrimary', 13.990431785583496],
        ['submitButtonOrderRelevance', 8.802809715270996],
    ],
    bias: -16.84701919555664,
    getRules: () => [
        rule(
            type('field').when((fnode) => {
                var _a;
                return ((_a = getNoteForField(fnode)) === null || _a === void 0 ? void 0 : _a.form) !== undefined;
            }),
            type('submit'),
            {}
        ),
        rule(type('submit'), boolScore(isVisible), {
            name: 'submitIsVisible',
        }),
        rule(type('submit'), boolScore(isInputSubmit), {
            name: 'submitIsInput',
        }),
        rule(type('submit'), boolScore(isButtonAgainstInputSubmit), {
            name: 'submitIsButtonAgainstInput',
        }),
        rule(type('submit'), boolScore(belongsToLoginForm), {
            name: 'submitBelongsToLogin',
        }),
        rule(type('submit'), boolScore(belongsToRegisterForm), {
            name: 'submitBelongsToRegister',
        }),
        rule(type('submit'), boolScore(submitBelongsToOutlierForm), {
            name: 'submitBelongsToOutlierForm',
        }),
        rule(type('submit'), boolScore(inputSubmitAttributesSmells), {
            name: 'submitHasAttributesSmells',
        }),
        rule(type('submit'), boolScore(isOAuthButton), {
            name: 'submitIsOAuthButton',
        }),
        rule(type('submit'), boolScore(inputTextSmells), {
            name: 'submitHasTextSmells',
        }),
        rule(type('submit'), boolScore(isAtBottomOfForm), {
            name: 'submitIsNearBottom',
        }),
        rule(type('submit'), boolScore(isOnlyElementOfInterest), {
            name: 'inputIsOnlyElementOfInterest',
        }),
        rule(type('submit'), boolScore(submitButtonSizeCheck), {
            name: 'submitButtonSizeCheck',
        }),
        rule(type('submit'), boolScore(isButtonPrimaryColor), {
            name: 'submitButtonLooksPrimary',
        }),
        rule(type('submit'), boolScore(matchButtonOrderRelevance), {
            name: 'submitButtonOrderRelevance',
        }),
        rule(type('submit'), out('submit'), {}),
    ],
};

const smellsLikeUsername = (options) => (fnode) =>
    inputAttributeRegexSmells(fnode.element)([
        REGEXES.fields.username.USERNAME_ATTR,
        ...(options.includeEmailSmells ? [REGEXES.fields.email.EMAIL_ATTR] : []),
    ]);

const isOnlyFieldOfInterest = (fnode) => {
    var _a;
    if (!belongsToLoginForm(fnode) || !belongsToRegisterForm(fnode)) return false;
    const { form } = getNoteForField(fnode);
    const candidates =
        form !== undefined
            ? (_a = getNoteForForm(form)) === null || _a === void 0
                ? void 0
                : _a.candidates
            : undefined;
    if (form === undefined || candidates === undefined) return false;
    return candidates.username.length === 1;
};

const isReadonlyField = (fnode) => fnode.element.readOnly;

const hasAutocompleteUsername = (fnode) => ['username', 'email'].includes(fnode.element.getAttribute('autocomplete'));

const isHiddenFieldOnPasswordStep = (fnode) => {
    if (!(belongsToLoginForm(fnode) || belongsToRegisterForm(fnode))) return false;
    const { form } = getNoteForField(fnode);
    const formFeatures = form !== undefined ? getNoteForForm(form) : undefined;
    if (formFeatures === undefined) return false;
    const { fields, candidates } = formFeatures;
    const usernames = candidates.username.filter((el) => el !== fnode.element);
    if (usernames.length > 0 || fields.password.length === 0) return false;
    const usernameSmells = smellsLikeUsername({
        includeEmailSmells: true,
    })(fnode);
    return usernameSmells && !isVisible(fnode);
};

const hasUsernameSmells = (fnode) =>
    smellsLikeUsername({
        includeEmailSmells: true,
    })(fnode);

const isEmailWithNoUsername = (fnode) => {
    var _a;
    const isEmail = fnode.element.matches('input[type="email"]');
    const { form } = getNoteForField(fnode);
    const candidates =
        form !== undefined
            ? (_a = getNoteForForm(form)) === null || _a === void 0
                ? void 0
                : _a.candidates
            : undefined;
    if (form === undefined || candidates === undefined) return isEmail;
    return candidates.username.filter((el) => el !== fnode.element).length === 0;
};

const isUsernameWithEmail = (fnode) => {
    const { form } = getNoteForField(fnode);
    const isEmail = fnode.element.matches('input[type="email"]');
    const usernameSmells = smellsLikeUsername({
        includeEmailSmells: false,
    })(fnode);
    if (form === undefined || isEmail || !usernameSmells) return false;
    const { fields } = getNoteForForm(form);
    return fields.email.length > 0;
};

const isEmailWithUsername = (fnode) => {
    if (!Boolean(belongsToRegisterForm(fnode))) return false;
    const { form } = getNoteForField(fnode);
    const isEmail = fnode.element.matches('input[type="email"]');
    if (!isEmail || form === undefined) return false;
    const { candidates } = getNoteForForm(form);
    return candidates.username.filter((el) => !el.matches('input[type="email"]')).length > 0;
};

const isFirstInElementsOfInterest = (fnode) => {
    var _a;
    const { form } = getNoteForField(fnode);
    const candidates =
        form !== undefined
            ? (_a = getNoteForForm(form)) === null || _a === void 0
                ? void 0
                : _a.candidates
            : undefined;
    if (form === undefined || candidates === undefined) return false;
    const position = candidates.username.findIndex((el) => el === fnode.element);
    return position === 0;
};

const username = {
    name: 'username',
    coeffs: [
        ['inputBelongsToLogin', -1.143570065498352],
        ['inputBelongsToRegister', 7.7137908935546875],
        ['inputHasUsernameSmells', 8.14673137664795],
        ['inputIsOnlyField', 12.346240997314453],
        ['inputIsUsernameWithEmail', 10.187163352966309],
        ['inputIsEmailNoUsername', 8.05987548828125],
        ['inputIsEmailWithUsername', -16.045352935791016],
        ['inputIsFirstInPosition', 10.960064888000488],
        ['inputIsReadonly', 5.978878021240234],
        ['inputIsAutocompleteUsername', -1.165616512298584],
        ['inputIsHiddenFieldOnPasswordStep', 8.383237838745117],
    ],
    bias: -21.832015991210938,
    getRules: () => [
        rule(
            type('field').when((fnode) =>
                fnode.element.matches(
                    usernameFieldSelector({
                        includeHiddenFields: true,
                    })
                )
            ),
            type('username'),
            {}
        ),
        rule(type('username'), boolScore(belongsToLoginForm), {
            name: 'inputBelongsToLogin',
        }),
        rule(type('username'), boolScore(belongsToRegisterForm), {
            name: 'inputBelongsToRegister',
        }),
        rule(type('username'), boolScore(hasUsernameSmells), {
            name: 'inputHasUsernameSmells',
        }),
        rule(type('username'), boolScore(isOnlyFieldOfInterest), {
            name: 'inputIsOnlyField',
        }),
        rule(type('username'), boolScore(isUsernameWithEmail), {
            name: 'inputIsUsernameWithEmail',
        }),
        rule(type('username'), boolScore(isEmailWithNoUsername), {
            name: 'inputIsEmailNoUsername',
        }),
        rule(type('username'), boolScore(isEmailWithUsername), {
            name: 'inputIsEmailWithUsername',
        }),
        rule(type('username'), boolScore(isFirstInElementsOfInterest), {
            name: 'inputIsFirstInPosition',
        }),
        rule(type('username'), boolScore(isReadonlyField), {
            name: 'inputIsReadonly',
        }),
        rule(type('username'), boolScore(hasAutocompleteUsername), {
            name: 'inputIsAutocompleteUsername',
        }),
        rule(type('username'), boolScore(isHiddenFieldOnPasswordStep), {
            name: 'inputIsHiddenFieldOnPasswordStep',
        }),
        rule(type('username'), out('username'), {}),
    ],
};

const definitions = [login, register, username, password, submit];

const rulesetMaker = () => {
    const aggregation = definitions.reduce(
        (acc, curr) => ({
            rules: [...acc.rules, ...curr.getRules()],
            coeffs: [...acc.coeffs, ...curr.coeffs],
            biases: [...acc.biases, [curr.name, curr.bias]],
        }),
        {
            rules: [
                rule(dom('form').when(isVisible), type('form').note(getFormFeatures), {}),
                rule(formLikeDom(), type('form').note(getFormFeatures), {}),
                rule(type('form'), out('form'), {}),
                rule(dom('input:not([type="submit"]'), type('field').note(getFieldFeatures), {}),
                rule(domQuery(getPossibleSubmitButtons), type('field').note(getFieldFeatures), {}),
            ],
            coeffs: [],
            biases: [],
        }
    );
    const rules = ruleset(aggregation.rules, aggregation.coeffs, aggregation.biases);
    return rules;
};

const trainees = {
    login,
    register,
    username,
    password,
    submit,
};

export { rulesetMaker, trainees, index as utils };
