import { clusters as clusters$1, dom, domQuery, out, rule, ruleset, score, type, utils } from './fathom.js';
import * as fathomWeb from './fathom.js';
import { CCFieldType, FieldType, FormType, IdentityFieldType, ccFields, identityFields } from './labels.js';

export { fathomWeb as fathom };

const FORM_CLUSTER_ATTR = 'data-protonpass-form';

const kFieldSelector = 'input, select, textarea';

const kFieldLabelSelector = `[class*="label"], [id*="label"]`;

const kEmailSelector = 'input[name="email"], input[id="email"], input[name="user_email"]';

const kPasswordSelector = 'input[type="password"], input[type="text"][id="password"]';

const kCaptchaSelector = `[class*="captcha"], [id*="captcha"], [name*="captcha"]`;

const kSocialSelector = `[class*=social], [aria-label*=with]`;

const kEditorElements = ['body', 'div', 'section', 'main'];

const kEditorPatterns = [
    '[class*="editor"]',
    '[class*="Editor"]',
    '[class*="EDITOR"]',
    '[id*="editor"]',
    '[id*="Editor"]',
    '[id*="EDITOR"]',
    '[class*="composer" i]',
    '[id*="composer" i]',
    '[class*="wysiwyg" i]',
    '[id*="wysiwyg" i]',
    '[class*="tinymce" i]',
    '[id*="tinymce" i]',
];

const kEditorSelector = `[contenteditable="true"], :is(${kEditorElements.join(',')}):is(${kEditorPatterns.join(',')})`;

const kDomGroupSelector = `[role="dialog"], [role="tabpanel"], [role="group"], [role="form"], [id*="modal"], [class*="modal"], header, section, nav, footer, aside`;

const kUsernameSelector = [
    'input[type="login"]',
    'input[type="username"]',
    'input[type="search"][name="loginName"]',
    'input[type="password"][name="userID"]',
    'input[type="password"][name="USERNAME"]',
    'input[name="account"]',
    'input[name="quickconnect-id"]',
].join(',');

const kHiddenUsernameSelector = [
    '[name*="user" i]',
    '[id*="user" i]',
    '[name*="login" i]',
    '[id*="login" i]',
    '[name*="email" i]',
    '[id*="email" i]',
    '[name*="identifier" i]',
    '[id*="identifier" i]',
].join(',');

const kHeadingSelector = [
    ...[1, 2, 3, 4, 5].flatMap((level) => [`h${level}, [aria-level="${level}"]`]),
    '[role="heading"]',
    '[class*="title"]',
    '[class*="header"]',
    '[name="title"]',
    'div[style*="font-size: 2"]',
    'div[style*="font-size: 3"]',
].join(',');

const kButtonSubmitSelector = [
    'input[type="submit"]',
    'button[id*="password" i]',
    'button[type="submit"]',
    'button[type="button"]',
    'button[name="submit"]',
    'a[role="submit"]',
    'div[role="button"]',
    'div[role="submit"]',
].join(',');

const kLayoutSelector = `div, section, aside, main, nav`;

const kAnchorLinkSelector = `a, span[role="button"]`;

const formCandidateSelector = `form, [${FORM_CLUSTER_ATTR}]`;

const inputCandidateSelector =
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="checkbox"])';

const buttonSelector = `button:not([type]), a[role="button"], ${kButtonSubmitSelector}`;

const otpSelector = '[type="tel"], [type="number"], [type="text"], input:not([type])';

const and =
    (...predicates) =>
    (value) =>
        predicates.every((pred) => pred(value));

const or =
    (...predicates) =>
    (value) =>
        predicates.some((pred) => pred(value));

const not = (predicate) => (value) => !predicate(value);

const any = (predicate) => (values) => values.some(predicate);

const closestParent = (start, match) => {
    const parent = start.parentElement;
    if (!parent) return null;
    return match(parent) ? parent : closestParent(parent, match);
};

const parentQuery = (start, match, maxIterations = 1) => {
    const parent = start?.parentElement;
    if (!parent) return null;
    const result = match(parent);
    return result || maxIterations <= 0 ? result : parentQuery(parent, match, maxIterations - 1);
};

const walkUpWhile = (start, maxIterations) => (check) => {
    const parent = start.parentElement;
    if (maxIterations <= 0 || parent === null) return start;
    return check(parent, start) ? walkUpWhile(parent, maxIterations - 1)(check) : start;
};

const getNthParent = (el) => (n) => {
    const parent = el.parentElement;
    return parent === null || n === 0 ? el : getNthParent(parent)(n - 1);
};

const uniqueNodes = (...nodes) => Array.from(new Set(nodes.flat()));

const getNodeRect = (el) => {
    const { height, width, top, bottom } = el.getBoundingClientRect();
    const area = height * width;
    return {
        height,
        width,
        top,
        bottom,
        area,
    };
};

const matchSibling = (el, match) => {
    const prevEl = el.previousElementSibling;
    if (prevEl === null) return null;
    if (match(prevEl)) return prevEl;
    return matchSibling(prevEl, match);
};

const matchNonEmptySibling = (el) =>
    matchSibling(el, (el) => el instanceof HTMLElement && el.innerText.trim().length > 0);

const getLabelFor = (el) => {
    const forId = el.getAttribute('id') ?? el.getAttribute('name');
    const label = document.querySelector(`label[for="${forId}"]`);
    if (label) return label;
    const parentLabel = el.closest('label');
    if (parentLabel) return parentLabel;
    const closestLabel = parentQuery(el, (parent) => parent.querySelector('label'), 1);
    if (closestLabel) return closestLabel;
    const labelLike = parentQuery(el, (parent) => parent.querySelector(kFieldLabelSelector), 1);
    if (labelLike) return labelLike;
    const textNodeAbove = matchNonEmptySibling(el);
    if (textNodeAbove) return textNodeAbove;
    return null;
};

const getRectCenter = (rect) => ({
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
});

const getRectMinDistance = (rectA, rectB) => {
    const centerA = getRectCenter(rectA);
    const centerB = getRectCenter(rectB);
    const dx = Math.abs(centerA.x - centerB.x) - (rectA.width + rectB.width) / 2;
    const dy = Math.abs(centerA.y - centerB.y) - (rectA.height + rectB.height) / 2;
    return {
        dx,
        dy,
    };
};

const pruneNested = (els) =>
    els.reduce((acc, el) => {
        for (let i = 0; i <= acc.length - 1; i++) {
            if (acc[i] === el) continue;
            if (acc[i].contains(el)) return acc;
            if (el.contains(acc[i])) {
                acc[i] = el;
                return acc;
            }
        }
        acc.push(el);
        return acc;
    }, []);

const getCommonAncestor = (elementA, elementB) => {
    if (elementA === elementB) return elementA;
    return elementA.contains(elementB)
        ? elementA
        : elementA.parentElement
          ? getCommonAncestor(elementA.parentElement, elementB)
          : elementA;
};

const findStackedParent = (el, cache = [], maxIterations) => {
    if (cache.some((group) => group.contains(el))) return null;
    const parent = el.parentElement;
    if (maxIterations === 0 || !parent) return null;
    const computedStyle = getComputedStyle(parent);
    const position = computedStyle.getPropertyValue('position');
    if (position === 'fixed' || position === 'absolute') {
        cache.push(parent);
        return parent;
    }
    return findStackedParent(parent, cache, maxIterations - 1);
};

const findStackedParents = (els, maxIterations) => {
    const cache = [];
    return els.map((input) => findStackedParent(input, cache, maxIterations)).filter((el) => Boolean(el));
};

const isCluster = (el) => el.getAttribute(FORM_CLUSTER_ATTR) !== null;

const flagCluster = (el) => el.setAttribute(FORM_CLUSTER_ATTR, '');

const isHidden = (el) => el.__PP_HIDDEN__ === true;

const flagAsHidden = (el) => (el.__PP_HIDDEN__ = true);

const removeHiddenFlag = (el) => delete el.__PP_HIDDEN__;

const attrIgnored = (el) => el.getAttribute('data-protonpass-ignore') !== null;

const isIgnored = (el) => el.__PP_SKIP__ === true;

const getIgnoredParent = (el) => (el ? closestParent(el, isIgnored) : null);

const flagAsIgnored = (el) => (el.__PP_SKIP__ = true);

const removeIgnoredFlag = (el) => delete el.__PP_SKIP__;

const flagSubtreeAsIgnored = (el) => {
    flagAsIgnored(el);
    el.querySelectorAll(kFieldSelector).forEach(flagAsIgnored);
};

const isProcessed = (el) => el.__PP_SEEN__ === true;

const flagAsProcessed = (el) => (el.__PP_SEEN__ = true);

const removeProcessedFlag = (el) => delete el.__PP_SEEN__;

const isPrediction = (el) => el.__PP_TYPE__ !== undefined;

const removePredictionFlag = (el) => {
    delete el.__PP_TYPE__;
    delete el.__PP_SUBTYPE__;
};

const getParentFormPrediction = (el) => (el ? closestParent(el, isPrediction) : null);

const TYPE_SEPARATOR = ',';

const SCORE_SEPARATOR = ':';

const setCachedSubType = (_el, subType) => {
    const el = _el;
    el.__PP_SUBTYPE__ = subType;
};

const getCachedSubType = (el) => el.__PP_SUBTYPE__;

const matchPredictedType = (type) => (str) => str.split(SCORE_SEPARATOR)?.[0] === type;

const setCachedPredictionScore = (_el, type, score) => {
    const el = _el;
    const currentType = el.__PP_TYPE__;
    const flag = `${type}${SCORE_SEPARATOR}${score.toFixed(2)}`;
    if (!currentType) {
        el.__PP_TYPE__ = flag;
        return;
    }
    const types = currentType.split(TYPE_SEPARATOR);
    const existingIndex = types.findIndex(matchPredictedType(type));
    if (existingIndex !== -1) types[existingIndex] = flag;
    else types.push(flag);
    el.__PP_TYPE__ = types.join(TYPE_SEPARATOR);
};

const getCachedPredictionScore = (type) => (fnode) => {
    const types = fnode.element.__PP_TYPE__;
    if (!types) return -1;
    const predForType = types.split(TYPE_SEPARATOR).find(matchPredictedType(type));
    if (!predForType) return -1;
    const [, scoreStr] = predForType.split(SCORE_SEPARATOR);
    const score = parseFloat(scoreStr);
    return Number.isFinite(score) ? score : -1;
};

const isPredictedType = (type) => (fnode) => getCachedPredictionScore(type)(fnode) !== -1;

const isPredictedForm = or(...Object.values(FormType).map((type) => isPredictedType(type)));

const isPredictedField = or(...Object.values(FieldType).map((type) => isPredictedType(type)));

const isClassifiable = (el) => !(isPrediction(el) || isIgnored(el) || attrIgnored(el));

const removeClassifierFlags = (target, options) => {
    const clean = (el) => {
        removeProcessedFlag(el);
        removePredictionFlag(el);
        if (!options.preserveIgnored) removeIgnoredFlag(el);
    };
    clean(target);
    target.querySelectorAll(kFieldSelector).forEach(clean);
    options.fields?.forEach(clean);
};

const isShadowRoot = (el) => el instanceof ShadowRoot;

const isShadowElement = (el) => isShadowRoot(el.getRootNode());

const isCustomElementWithShadowRoot = (el) => Boolean(el.tagName.includes('-') && el.shadowRoot);

const shadowPiercingAncestors = function* (element) {
    yield element;
    let current = element;
    let parent;
    while ((parent = getShadowPiercingParent(current)) && parent?.nodeType === Node.ELEMENT_NODE) {
        yield parent;
        current = parent;
    }
};

const getShadowPiercingParent = (node) => {
    const parent = node.parentNode;
    if (!parent) return null;
    if (isShadowRoot(parent)) return parent.host;
    else return parent;
};

const shadowPiercingContains = (container, el) => {
    let current = el;
    if (container.contains(el)) return true;
    if (!isShadowElement(el)) return false;
    const containerShadowRoot = 'shadowRoot' in container ? container.shadowRoot : null;
    if (containerShadowRoot?.contains(el)) return true;
    while (current) {
        const rootNode = current.getRootNode();
        if (rootNode === document) return false;
        if (!isShadowRoot(rootNode)) return false;
        const host = rootNode.host;
        if (host === container) return true;
        if (container.contains(host)) return true;
        if (containerShadowRoot?.contains(host)) return true;
        current = host;
    }
    return false;
};

const shallowShadowQuerySelector = (el, selector) => {
    if (!(el instanceof HTMLElement)) return el.querySelector(selector);
    return el.querySelector(selector) ?? el.shadowRoot?.querySelector(selector) ?? null;
};

const MAX_FORM_FIELD_WALK_UP = 3;

const MAX_FORM_HEADING_WALK_UP = 3;

const MAX_HEADING_HORIZONTAL_DIST = 75;

const MAX_HEADING_VERTICAL_DIST = 150;

const MIN_AREA_SUBMIT_BTN = 3500;

const MIN_FIELD_HEIGHT = 15;

const MIN_FIELD_WIDTH = 30;

const MAX_INPUTS_PER_FORM = 50;

const MAX_FIELDS_PER_FORM = 100;

const MAX_HIDDEN_FIELD_VALUE_LENGTH = 320;

const HIDDEN_FIELD_IGNORE_VALUES = ['0', '1', 'true', 'false'];

const OTP_PATTERNS = [
    [1, 'd*'],
    [6, 'd{6}'],
    [1, '[0-9]*'],
    [6, '[0-9]{6}'],
    [5, '([0-9a-fA-F]{5}-?[0-9a-fA-F]{5})'],
];

const VALID_INPUT_TYPES = ['text', 'email', 'number', 'tel', 'password', 'hidden', 'search'];

const normalizeString = (str, allowedChars = '') =>
    str
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(new RegExp(`[^a-zA-Z0-9${allowedChars}]`, 'g'), '');

const sanitizeString = (str) => normalizeString(str, '\\[\\]');

const sanitizeStringWithSpaces = (str) => normalizeString(str, '\\s\\[\\]');

const TEXT_ATTRIBUTES = [
    'title',
    'aria-label',
    'aria-labelledby',
    'aria-describedby',
    'placeholder',
    'autocomplete',
    'legend',
    'label',
];

const EL_ATTRIBUTES = [
    'id',
    'class',
    'role',
    'jsaction',
    'ng-controller',
    'data-bind',
    'ng-model',
    'v-model',
    'v-bind',
    'data-testid',
    'href',
];

const FORM_ATTRIBUTES = [EL_ATTRIBUTES, 'name', 'action'].flat();

const FIELD_ATTRIBUTES = [EL_ATTRIBUTES, 'name', 'inputmode'].flat();

const getAttributes = (attributes) => (el) =>
    attributes
        .filter((key) => key !== 'data-fathom')
        .map((attr) => el.getAttribute(attr))
        .filter(Boolean)
        .map(sanitizeStringWithSpaces);

const getBaseAttributes = getAttributes(EL_ATTRIBUTES);

const getTextAttributes = getAttributes(TEXT_ATTRIBUTES);

const getFieldAttributes = getAttributes(FIELD_ATTRIBUTES);

const getFormAttributes = getAttributes(FORM_ATTRIBUTES);

const getAutocompletes = (field) => (field.getAttribute('autocomplete') ?? '').split(/\s+/);

const getPageDescriptionText = (doc) => {
    const pageTitle = doc.title;
    const metaDescription = doc.querySelector('meta[name="description"]');
    const descriptionContent = metaDescription?.getAttribute('content') ?? '';
    return sanitizeString(`${pageTitle} ${descriptionContent}`);
};

const getNodeText = (node) => {
    const textAttrs = getTextAttributes(node).join('');
    return sanitizeString(`${node.innerText}${textAttrs}`);
};

const getNodeAttributes = (node) => sanitizeStringWithSpaces(getBaseAttributes(node).join(''));

const getAllNodeHaystacks = (node) => [getNodeText(node), getNodeAttributes(node)];

const getFormText = (form) => {
    const textAttrs = getTextAttributes(form).join('');
    const fieldsets = Array.from(form.querySelectorAll('fieldset'));
    return sanitizeString(
        `${textAttrs}${fieldsets.reduce((text, fieldset) => text.concat(getTextAttributes(fieldset).join('')), '')}`
    );
};

const getFieldLabelText = (field) => {
    const label = getLabelFor(field);
    return label ? getNodeText(label) : '';
};

const getFieldHaystacks = (field) => {
    const isHiddenInput = field instanceof HTMLInputElement && field.type === 'hidden';
    const checkLabel = field instanceof HTMLInputElement && ['text', 'email', 'tel', 'password'].includes(field.type);
    const fieldAttrs = getFieldAttributes(field);
    const fieldText = isHiddenInput ? '' : getNodeText(field);
    const labelText = checkLabel && !isHiddenInput ? getFieldLabelText(field) : '';
    return {
        fieldAttrs,
        fieldText,
        labelText,
    };
};

const getAllFieldHaystacks = (field) => {
    const { fieldAttrs, fieldText, labelText } = getFieldHaystacks(field);
    return [fieldText, labelText, ...fieldAttrs];
};

const getNearestHeadingsText = (el) => {
    const originRect = el.getBoundingClientRect();
    const parent = walkUpWhile(
        el,
        MAX_FORM_HEADING_WALK_UP
    )((parentEl, candidate) => {
        if (parentEl === document.body) return false;
        if (candidate.matches(kDomGroupSelector)) return false;
        return true;
    });
    const headings = Array.from(parent.querySelectorAll(kHeadingSelector)).filter((heading) => {
        if (el.contains(heading)) return true;
        const headingRect = heading.getBoundingClientRect();
        const { dx, dy } = getRectMinDistance(originRect, headingRect);
        return dx < MAX_HEADING_HORIZONTAL_DIST && dy < MAX_HEADING_VERTICAL_DIST;
    });
    const textAbove = (headings.length === 0 ? matchNonEmptySibling(el) : null)?.innerText ?? '';
    return sanitizeString(textAbove + headings.map((el) => el.innerText).join(''));
};

const TOLERANCE_LEVEL = 0.5;

const boolInt = (val) => Number(val);

const safeInt = (val, fallback = 0) => (Number.isFinite(val) ? val : fallback);

const throughEffect = (effect) => (fnode) => {
    effect(fnode);
    return fnode;
};

const typeEffect = (type) =>
    throughEffect((fnode) => {
        flagAsProcessed(fnode.element);
        if (!fnode.hasNoteFor(`${type}-prediction`)) {
            setCachedPredictionScore(fnode.element, type, getTypeScore(fnode, type));
        }
    });

const processFormEffect = throughEffect((fnode) => flagAsProcessed(fnode.element));

const processFieldEffect = throughEffect((fnode) => {
    const { visible, type } = fnode.noteFor('field');
    if (visible || type === 'hidden') flagAsProcessed(fnode.element);
});

const normalize = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'boolean') return boolInt(val);
    return 0;
};

const featureScore = (noteFor, feat) =>
    score((fnode) => {
        const features = fnode.noteFor(noteFor);
        if (Array.isArray(feat)) return feat.map((k) => features[k]).reduce((a, b) => normalize(a) * normalize(b));
        return normalize(features[feat]);
    });

const getFieldScoreRules = (featureType, fieldType, fieldFeatures) => {
    const base = ['isCC', 'isIdentity'].map((key) =>
        rule(type(fieldType), featureScore('field', key), {
            name: `${fieldType}-${key}`,
        })
    );
    const specific = fieldFeatures.map((key) =>
        rule(type(fieldType), featureScore(featureType, key), {
            name: `${fieldType}-${key.toString()}`,
        })
    );
    return base.concat(specific);
};

const getFeaturesFromRules = (rules) => rules.map((rule) => rule.name);

const getFeatureCoeffs = (features, results) =>
    features.map((feat) => [feat, results.coeffs.find(([feature]) => feature === feat)?.[1] ?? 0]);

const getParentFormFnode = (fieldFnode) => {
    const field = fieldFnode.element;
    const ruleset = fieldFnode._ruleset;
    const parentForms = ruleset.get(type('form'));
    const form = parentForms.find(({ element }) => element.contains(field));
    if (form) return form;
    const preDetectedForm = getParentFormPrediction(field);
    if (preDetectedForm) return ruleset.get(preDetectedForm);
    return null;
};

const typeScoreToleranceTest = (type) => (fnode) => fnode.scoreFor(type) > TOLERANCE_LEVEL;

const getTypeScore = (node, type) => {
    if (!node) return 0;
    if (node.hasNoteFor(`${type}-prediction`)) return node.noteFor(`${type}-prediction`) ?? 0;
    return node.scoreFor(type);
};

const outRuleWithCache = (candidateType, predictionType, typeScoreTest = typeScoreToleranceTest) => [
    rule(
        type(candidateType).when(isPredictedType(predictionType)),
        type(`${predictionType}-prediction`).note(getCachedPredictionScore(predictionType)),
        {}
    ),
    rule(type(predictionType).when(typeScoreTest(predictionType)), type(`${predictionType}-prediction`), {}),
    rule(type(`${predictionType}-prediction`), out(predictionType).through(typeEffect(predictionType)), {}),
];

const combineFeatures = (arr1, arr2) => arr1.flatMap((item1) => arr2.map((item2) => [item1, item2]));

const withFnodeEl = (fn) => (fnode) => fn(fnode.element);

const getFormClassification = (formFnode) => {
    const login = getTypeScore(formFnode, FormType.LOGIN) > 0.5;
    const register = getTypeScore(formFnode, FormType.REGISTER) > 0.5;
    const pwChange = getTypeScore(formFnode, FormType.PASSWORD_CHANGE) > 0.5;
    const recovery = getTypeScore(formFnode, FormType.RECOVERY) > 0.5;
    const detectionResults = [login, register, pwChange, recovery];
    const noop = detectionResults.every((detected) => !detected);
    return {
        login,
        register,
        pwChange,
        recovery,
        noop,
    };
};

const isNoopForm = (formFnode) => getFormClassification(formFnode).noop;

const LOGIN_RE =
    /(?:(?:n(?:ouvelleses|uevase|ewses)s|iniciarses|connex)io|anmeldedate|inlogge|sign[io])n|in(?:iciarsessao|troduce)|a(?:uthenticate|nmeld(?:ung|en))|authentifier|s(?:econnect|identifi)er|novasessao|(?:introduci|conecta|entr[ae])r|prihlasit|connect|acceder|login/i;

const REGISTER_RE =
    /kontoerstellen|cr(?:ea(?:teaccount|rcuenta)|iarconta)|(?:nouveaucompt|creeruncompt|s?inscrir|unirs)e|re(?:gist(?:r(?:ieren|arse|ar)|er)|joindre)|nuevacuenta|getstarted|neueskonto|newaccount|novaconta|(?:com(?:mence|eca)|(?:empez|junt)a)r|signup|join/i;

const RECOVERY_RE =
    /(?:wiederherstell|zurucksetz)en|re(?:(?:initialis|stablec)er|(?:defini|staur[ae])r|c(?:uper[ae]|ove)r|set)|problem|(?:troubl|restor|aid)e|a[jy]uda|h(?:ilfe|elp)/i;

const MULTI_STEP_RE = /p(?:rogres(?:s(?:ion|o)|o)|aso)|fortschritt|progress|s(?:chritt|t(?:age|ep))|etap[ae]|phase/i;

const TROUBLE_RE =
    /schwierigkeit|(?:difficult|troubl|oubli|hilf)e|i(?:nciden(?:cia|t)|ssue)|vergessen|esquecido|olvidado|needhelp|questao|problem|forgot|ayuda/i;

const PASSWORD_RE =
    /p(?:hrasesecrete|ass(?:(?:phras|cod)e|wor[dt]))|(?:c(?:havesecret|lavesecret|ontrasen)|deseguranc)a|(?:(?:zugangs|secret)cod|clesecret)e|wachtwoord|codesecret|motdepasse|geheimnis|secret|heslo|senha|key/i;

const PASSWORD_OUTLIER_RE = /socialsecurity|nationalid|userid/i;

const USERNAME_RE =
    /gebruikersnaam|(?:identifi(?:cado|e)|benutze)r|identi(?:fiant|ty)|u(?:tilisateur|s(?:ername|uario))|(?:screen|nick)name|nutzername|(?:anmeld|handl)e|pseudo/i;

const USERNAME_ATTR_RE = /(?:custom|us)erid|login(?:name|id)|a(?:cc(?:ountid|t)|ppleid)/i;

const USERNAME_OUTLIER_RE =
    /(?:nom(?:defamill|br)|tit[lr])e|(?:primeiro|sobre)nome|(?:company|middle|nach|vor)name|firstname|apellido|lastname|prenom/i;

const EMAIL_RE = /co(?:urriel|rrei?o)|email/i;

const EMAIL_ATTR_RE = /usermail/i;

const CREATE_ACTION_RE = /erstellen|n(?:o(?:uveau|vo)|uevo|e[uw])|cr(?:e(?:a(?:te|r)|er)|iar)|set/i;

const CREATE_ACTION_ATTR_END_RE = /\b\S*(?:fst|1)\b/i;

const RESET_ACTION_RE =
    /(?:a(?:ktualisiere|nder)|zurucksetze)n|(?:re(?:initialise|stablece|defini)|mettreajou)r|a(?:ctualiz|tualiz|lter)ar|c(?:ambiar|hange)|update|reset/i;

const CONFIRM_ACTION_RE =
    /digitarnovamente|v(?:olveraescribi|erifi(?:ca|e))r|saisiranouveau|(?:erneuteingeb|wiederhol|bestatig)en|verif(?:izieren|y)|re(?:pe(?:t[ei]r|at)|type)|confirm|again/i;

const CONFIRM_ACTION_ATTR_END_RE = /\b\S*(?:snd|bis|2)\b/i;

const STEP_ACTION_RE =
    /(?:f(?:ertigstell|ortfahr)|abschlie)en|getstarted|siguiente|(?:preceden|suivan|accep)t|(?:finaliza|termin[ae]|anterio|weite)r|co(?:mplet(?:ar|e)|ntinu(?:ar|e))|pro(?:c(?:hain|eed)|ximo)|finish|zuruck|back|next/i;

const REMEMBER_ACTION_RE =
    /angemeldetbleiben|lembrardemim|micherinnern|sesouvenirde|re(?:cordarme|member|ster)|manterme|mantener|stay|keep/i;

const SEARCH_ACTION_RE = /recherche|buscar|s(?:earch|uche)|query/i;

const CURRENT_VALUE_RE =
    /(?:be(?:stehend|for)|vorherig|aktuell)e|exist(?:ente|ing)|pre(?:cedent|vious)|a(?:n(?:t(?:erior|igo)|cien)|ctu[ae]l|tual)|existant|dernier|current|(?:ultim|viej)o|(?:letz|al)te|last|old/i;

const HIDDEN_ATTR_RE = /s(?:creenreade)?ronly|(?:move)?offscreen|(?:displaynon|a11yhid)e|\b((?:is)?hidden)\b/i;

const OAUTH_ATTR_RE = /facebook|twitch|google|apple/i;

const TOS_RE =
    /(?:datenschutzrichtlini|politicadeprivacidad|confidentialit|a(?:cknowledg|gre))e|nutzungsbedingungen|(?:consentimi?ent|ac(?:ue|o)rd)o|(?:einwillig|zustimm)ung|consentement|condi(?:cione|tion)s|term(?:osdeuso|inos|sof)|(?:privacida|understan)d|guideline|consent|p(?:riva|oli)cy|accord/i;

const MFA_RE =
    /(?:authentifizierung|doisfatore|doispasso)s|(?:auth(?:entication)?cod|securitycod|doubleetap)e|(?:authentication|generator)app|(?:(?:authentifica|doublefac)teu|(?:(?:authentifika|doblefac|zweifak|twofac)t|aut(?:henticat|enticad))o)r|verifica(?:c(?:ion|ao)|tion)|multifa(?:ct(?:eu|o)|k?to)r|zweischritte|generadora|doblepaso|2(?:s(?:chritte|tep)|(?:etap[ae]|paso)s|fa)|twostep/i;

const MFA_ATTR_RE =
    /phoneverification|(?:approvals|login)code|challenge|t(?:wo(?:fa(?:ctor)?|step)|facode)|2fa|\b([mt]fa)\b/i;

const OTP_ATTR_RE = /totp(?:pin)?|o(?:netime|t[cp])|1time/i;

const OTP_OUTLIER_RE =
    /n(?:(?:ue|o)vocodigo|ouveaucode|e(?:usenden|(?:uer|w)code))|re(?:enviar|send)|envoyer|senden|enviar|send/i;

const OTP_OUTLIER_ATTR_RE = /(?:phone(?:verification)?|email|tel)pin|email|sms/i;

const NEWSLETTER_RE = /newsletter|b(?:ul|o)letin|mailing/i;

const NEWSLETTER_ATTR_RE = /subscription|mailinglist|newsletter|emailform/i;

const IDENTITY_FULLNAME_ATTR_RE = /addresscontact|contactperson|addressname|yourname|fullname|\b(name)\b/i;

const IDENTITY_FIRSTNAME_ATTR_RE = /givenname|firstn(?:ame)?|\b(fname)\b/i;

const IDENTITY_MIDDLENAME_ATTR_RE = /additionalname|middlen(?:ame)?|\b(mname)\b/i;

const IDENTITY_LASTNAME_ATTR_RE = /familyn(?:ame)?|lastn(?:ame)?|surname|\b([ls]name)\b/i;

const IDENTITY_TELEPHONE_ATTR_RE = /(?:national|contact)number|(?:tele)?phone|mobile|\b(tel(?:national|local)?)\b/i;

const IDENTITY_TELEPHONE_OUTLIER_ATTR_RE = /extension|security|co(?:untry|de)|p(?:refix|in)/i;

const IDENTITY_ADDRESS_ATTR_RE =
    /(?:preferred|street)address|address(?:line(?:one|[1s])|1)|mailingaddr|bill(?:ing)?addr|\b(mailaddr|addr(?:ess)?|street|line1)\b/i;

const IDENTITY_ADDRESS_LINES_ATTR_END_RE = /\b\S*(?:line(?:t(?:hree|wo)|[23]))\b/i;

const IDENTITY_STATE_ATTR_RE = /address(?:(?:provinc|stat)e|level1)|stateprovince|\b(province|county|region|state)\b/i;

const IDENTITY_CITY_ATTR_RE = /address(?:level2|town|city)|personalcity|\b((?:local|c)ity|town)\b/i;

const IDENTITY_ZIPCODE_ATTR_RE =
    /(?:address(?:postal|zip)|post)code|address(?:postal|zip)|postalcode|zipcode|\b(zip)\b/i;

const IDENTITY_ORGANIZATION_ATTR_RE = /organization(?:name)?|companyname|\b(organization)\b/i;

const IDENTITY_COUNTRY_ATTR_RE = /addresscountry(?:name)?|countryname|\b(country)\b/i;

const IDENTITY_COUNTRY_CODE_ATTR_RE = /countrycode/i;

const CC_PREFIX_ATTR_RE = /(?:payments|new)card|paymentcard|c(?:ar(?:tecredit|d)|red(?:it)?card)|stripe|vads/i;

const CC_NUMBER_ATTR_RE = /num(?:ero)?carte|c(?:ardn(?:um|[or])|bnum|cno)|\b(c(?:ard |c)number)\b/i;

const CC_OUTLIER_ATTR_RE = /c(?:ertificate|oupon)|logincard|voucher|promo/i;

const CC_CVC_ATTR_RE = /c(?:ard(?:verification|code)|sc|v[cv])|payments?code|\b(ccc(?:ode|vv|sc))\b/i;

const CC_CODE_ATTR_RE = /securitycode|cardpin|pincode/i;

const CC_NAME_ATTR_RE = /accountholdername|card(?:holder)?name|cardholder|nameoncard|holdername|\b(ccname)\b/i;

const CC_EXP_ATTR_RE =
    /expir(?:ation(?:monthyear|date)|ation|ydate|y)|cardexp(?:iration)?|\b(ccexp(?:iration)?|expiry date)\b/i;

const CC_EXP_MONTH_ATTR_RE =
    /exp(?:ir(?:y(?:date(?:field)?mo|m[mo]?)|ationdatem[mo]|(?:ation|e)m[mo]?)|m[mo]?)|m(?:expiration|oisexp)|cbdatemo|cardm[mo]?|\b(cc(?:expmonth|m(?:onth|m)))\b/i;

const CC_EXP_MONTH_ATTR_END_RE = /\b\S*(?:m(?:onth|o|m))\b/i;

const CC_EXP_YEAR_ATTR_RE =
    /exp(?:ir(?:y(?:date(?:field)?year|y(?:yyy|ear|y)?)|ationdatey(?:y(?:yy)?|ear)|(?:ation|e)y(?:yyy|ear|y)?)|y(?:yyy|ear|y)?)|yexpiration|cbdateann|anne(?:ee)?xp|cardy(?:yyy|ear|y)?|\b(cc(?:expyear|y(?:ear|[ry])))\b/i;

const CC_EXP_YEAR_ATTR_END_RE = /\b\S*(?:y(?:ear|y))\b/i;

const IFRAME_FIELD_ATTR_RE = /s(?:tripeframe|ecurity)|c(?:ontrol|v[cv])|expiry|input|f(?:ield|orm)|p(?:bf|ci)/i;

const PAYMENT_ATTR_RE = /c(?:heckout|ar[dt])|payment/i;

const DOCUMENT_ATTR_RE =
    /s(?:ocialsecurity|ubscription)|membership|nationalid|i(?:nsurance|dcard)|p(?:asse?por|ermi)t|contract|licen[cs]e/i;

const EMAIL_VALUE_RE = /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,5}$/;

const TEL_VALUE_RE = /^[\d()+-]{6,25}$/;

const USERNAME_VALUE_RE = /^[\w\-\.]{7,30}$/;

const reSanityCheck = (cb, options) => (str) => {
    if (options.maxLength && str.length > options.maxLength) return false;
    if (options.minLength && str.length < options.minLength) return false;
    return cb(str);
};

const test = (re, options) =>
    reSanityCheck(
        (str) => re.test(str),
        options ?? {
            maxLength: 5e3,
            minLength: 2,
        }
    );

const notRe = (reg, options) => (str) => !test(reg, options)(str);

const andRe = (reg, options) => and(...reg.map((re) => test(re, options)));

const orRe = (reg, options) => or(...reg.map((re) => test(re, options)));

const matchLogin = test(LOGIN_RE);

const matchRegister = test(REGISTER_RE);

const matchUsername = test(USERNAME_RE);

const matchUsernameAttr = orRe([USERNAME_ATTR_RE, USERNAME_RE]);

const matchUsernameValue = test(USERNAME_VALUE_RE);

const matchUsernameOutlier = test(USERNAME_OUTLIER_RE);

const matchEmailAttr = orRe([EMAIL_ATTR_RE, EMAIL_RE]);

const matchEmailValue = test(EMAIL_VALUE_RE, {
    maxLength: 230,
    minLength: 5,
});

const matchEmail = or(test(EMAIL_RE), matchEmailValue);

const matchTelValue = test(TEL_VALUE_RE, {
    maxLength: 25,
    minLength: 6,
});

const matchRememberMe = test(REMEMBER_ACTION_RE);

const matchTOS = test(TOS_RE);

const matchTrouble = test(TROUBLE_RE);

const matchRecovery = orRe([RECOVERY_RE, TROUBLE_RE]);

const matchMultiStep = test(MULTI_STEP_RE);

const matchStepAction = orRe([STEP_ACTION_RE, MULTI_STEP_RE]);

const matchOAuth = test(OAUTH_ATTR_RE);

const matchSearchAction = test(SEARCH_ACTION_RE);

const matchPasswordReset = and(andRe([PASSWORD_RE, RESET_ACTION_RE]), notRe(CONFIRM_ACTION_RE));

const matchPasswordResetAttr = and(matchPasswordReset, notRe(CONFIRM_ACTION_ATTR_END_RE));

const matchPasswordCreate = and(andRe([PASSWORD_RE, CREATE_ACTION_RE]), notRe(CONFIRM_ACTION_RE));

const matchPasswordCreateAttr = and(matchPasswordCreate, notRe(CONFIRM_ACTION_ATTR_END_RE));

const matchPasswordConfirm = andRe([PASSWORD_RE, CONFIRM_ACTION_RE]);

const matchPasswordConfirmAttr = and(andRe([PASSWORD_RE, CONFIRM_ACTION_RE]), notRe(CREATE_ACTION_ATTR_END_RE));

const matchPasswordCurrent = and(andRe([PASSWORD_RE, CURRENT_VALUE_RE]), notRe(CONFIRM_ACTION_RE));

const matchPasswordCurrentAttr = and(matchPasswordCurrent, notRe(CONFIRM_ACTION_ATTR_END_RE));

const matchPasswordOutlier = test(PASSWORD_OUTLIER_RE);

const matchHidden = test(HIDDEN_ATTR_RE);

const matchMfa = test(MFA_RE);

const matchMfaAttr = test(MFA_ATTR_RE);

const matchOtpAttr = test(OTP_ATTR_RE);

const matchOtpOutlier = orRe([OTP_OUTLIER_ATTR_RE, OTP_OUTLIER_RE]);

const matchNewsletter = test(NEWSLETTER_RE);

orRe([NEWSLETTER_RE, NEWSLETTER_ATTR_RE]);

const matchFullName = and(test(IDENTITY_FULLNAME_ATTR_RE), (str) => !str.includes('[name]'));

const matchFirstName = test(IDENTITY_FIRSTNAME_ATTR_RE);

const matchMiddleName = test(IDENTITY_MIDDLENAME_ATTR_RE);

const matchLastName = test(IDENTITY_LASTNAME_ATTR_RE);

const matchTelephone = and(test(IDENTITY_TELEPHONE_ATTR_RE), notRe(IDENTITY_TELEPHONE_OUTLIER_ATTR_RE));

const matchOrganization = test(IDENTITY_ORGANIZATION_ATTR_RE);

const matchCity = test(IDENTITY_CITY_ATTR_RE);

const matchZipCode = test(IDENTITY_ZIPCODE_ATTR_RE);

const matchState = test(IDENTITY_STATE_ATTR_RE);

const matchCountry = and(test(IDENTITY_COUNTRY_ATTR_RE), notRe(IDENTITY_COUNTRY_CODE_ATTR_RE));

const matchAddress = and(test(IDENTITY_ADDRESS_ATTR_RE), notRe(IDENTITY_ADDRESS_LINES_ATTR_END_RE));

const matchCCName = test(CC_NAME_ATTR_RE);

const matchCCFirstName = andRe([CC_PREFIX_ATTR_RE, IDENTITY_FIRSTNAME_ATTR_RE]);

const matchCCLastName = andRe([CC_PREFIX_ATTR_RE, IDENTITY_LASTNAME_ATTR_RE]);

const matchCCNumber = test(CC_NUMBER_ATTR_RE);

const matchCCSecurityCode = andRe([CC_CODE_ATTR_RE, CC_PREFIX_ATTR_RE]);

const matchCCV = test(CC_CVC_ATTR_RE);

const matchCCOutlier = orRe([CC_OUTLIER_ATTR_RE, DOCUMENT_ATTR_RE]);

const matchCCExp = and(test(CC_EXP_ATTR_RE), notRe(DOCUMENT_ATTR_RE));

const matchCCExpMonth = and(test(CC_EXP_MONTH_ATTR_RE), not(test(CC_EXP_YEAR_ATTR_END_RE)));

const matchCCExpYear = and(test(CC_EXP_YEAR_ATTR_RE), not(test(CC_EXP_MONTH_ATTR_END_RE)));

const matchIFrameField = orRe([IFRAME_FIELD_ATTR_RE, PAYMENT_ATTR_RE]);

const isActiveFieldFNode = (fnode) => {
    const { visible, readonly, disabled } = fnode.noteFor('field');
    return visible && !readonly && !disabled;
};

const splitFieldsByVisibility = (els) =>
    els.reduce(
        (acc, el) => {
            if (isVisibleField(el)) acc[0].push(el);
            else acc[1].push(el);
            return acc;
        },
        [[], []]
    );

const fType = (type) => (fnode) => fnode.hasType(type);

const fInput = (types) => (fnode) => types.includes(fnode.element.type);

const fMatch = (selector) => (fnode) => fnode.element.matches(selector);

const fMode = (mode) => (fnode) => fnode.element.inputMode === mode;

const fActive = (fnode) => isActiveFieldFNode(fnode);

const fList = (fnode) =>
    fnode.element.getAttribute('aria-autocomplete') === 'list' || fnode.element.role === 'combobox';

const maybeEmail = and(not(fList), or(fInput(['email', 'text']), fMode('email')), fActive);

const maybePassword = and(not(fList), fMatch(kPasswordSelector), fActive);

const maybeOTP = and(fMatch(otpSelector), fActive, not(fList));

const maybeUsername = and(
    not(fList),
    or(and(not(fMode('email')), fInput(['text', 'tel'])), fMatch(kUsernameSelector)),
    fActive
);

const maybeHiddenUsername = and(not(fList), fInput(['email', 'text', 'hidden']), not(fActive));

const isUsernameCandidate = (el) => !el.matches('input[type="email"]') && any(matchUsername)(getAllFieldHaystacks(el));

const isEmailCandidate = (el) => el.matches('input[type="email"]') || any(matchEmail)(getAllFieldHaystacks(el));

const isOAuthCandidate = (el) => any(matchOAuth)(getAllFieldHaystacks(el));

const isBtnCandidate = (btn) => {
    if (btn.getAttribute('type') === 'submit') return true;
    if (btn.innerText.trim().length <= 1) return false;
    const height = btn.offsetHeight;
    const width = btn.offsetWidth;
    return height * width > MIN_AREA_SUBMIT_BTN;
};

const isProcessableField = (input) => {
    const processed = isProcessed(input);
    const hidden = isHidden(input);
    return (
        (!processed || hidden) &&
        isVisibleField(input) &&
        isVisible(input, {
            opacity: false,
        })
    );
};

const isClassifiableField = (fnode) =>
    fnode.element.tagName === 'INPUT' && isClassifiable(fnode.element) && getParentFormFnode(fnode) !== null;

const selectInputCandidates = (target = document) =>
    Array.from(target.querySelectorAll(inputCandidateSelector)).filter(isClassifiable);

const isIFrameField = (iframe) => {
    const title = iframe.getAttribute('title') || '';
    const name = iframe.getAttribute('name') || '';
    const ariaLabel = iframe.getAttribute('aria-label') || '';
    const id = iframe.id;
    const src = iframe.src.substring(0, 150);
    const className = iframe.className.substring(0, 150);
    const haystack = sanitizeStringWithSpaces(`${title} ${name} ${ariaLabel} ${id} ${src} ${className}`);
    return matchIFrameField(haystack);
};

const cacheContext = {};

const getVisibilityCache = (key) => (cacheContext[key] = cacheContext[key] ?? new WeakMap());

const clearVisibilityCache = () => Object.keys(cacheContext).forEach((key) => delete cacheContext[key]);

const SCROLLBAR_WIDTH = 16;

const getCachedVisbility = (el, options) => {
    const opacityCache = getVisibilityCache('visibility:op');
    const cache = getVisibilityCache('visibility');
    if (options.opacity) return opacityCache.get(el) ?? cache.get(el);
    else return cache.get(el);
};

const setCachedVisibility = (cacheMap) => (els, visible) => els.forEach((el) => cacheMap.set(el, visible));

const containedInAncestor = (rect, ancestorRect) =>
    rect.top <= ancestorRect.bottom &&
    rect.bottom >= ancestorRect.top &&
    rect.left <= ancestorRect.right &&
    rect.right >= ancestorRect.left;

const isNegligibleRect = (rect) => rect.width <= 1 || rect.height <= 1;

const HIDDEN_CLIP = ['rect(0px, 0px, 0px, 0px)', 'rect(0, 0, 0, 0)', 'rect(1px, 1px, 1px, 1px)'];

const HIDDEN_CLIP_PATH = ['circle(0', 'polygon()', 'inset(100%)', 'inset(50% 50% 50% 50%)'];

const isClipped = (clip, path) => {
    if (clip && clip !== 'auto') return HIDDEN_CLIP.some((value) => clip.includes(value));
    if (path && path !== 'none') return HIDDEN_CLIP_PATH.some((value) => path.includes(value));
    return false;
};

const isVisible = (fnodeOrElement, options) => {
    const useCache = !options.skipCache;
    const element = utils.toDomElement(fnodeOrElement);
    const seen = [];
    let transparent = false;
    const cache = getVisibilityCache(options.opacity ? 'visibility:op' : 'visibility');
    const cachedVisibility = getCachedVisbility(element, options);
    if (useCache && cachedVisibility !== undefined) return cachedVisibility;
    const win = utils.windowForElement(element);
    const doc = win.document;
    const viewportWidth = win.innerWidth || doc.documentElement.clientWidth;
    const viewportHeight = win.innerHeight || doc.documentElement.clientHeight;
    const scrollWidth = Math.max(viewportWidth, doc.documentElement.scrollWidth, doc.body.scrollWidth);
    const scrollHeight = Math.max(viewportHeight, doc.documentElement.scrollHeight, doc.body.scrollHeight);
    const { scrollX, scrollY } = win;
    const isOnScreen = ({ x, y, width, height }) => {
        const left = x + scrollX;
        const right = x + scrollX + width;
        const top = y + scrollY;
        const bottom = y + scrollY + height;
        return (
            right >= 0 && left <= scrollWidth - SCROLLBAR_WIDTH && bottom >= 0 && top <= scrollHeight - SCROLLBAR_WIDTH
        );
    };
    const check = () => {
        let prevRef = null;
        for (const ancestor of shadowPiercingAncestors(element)) {
            let rect = null;
            const getRect = () => (rect = rect ?? ancestor.getBoundingClientRect());
            if (ancestor === doc.body) return prevRef?.absolute ? isOnScreen(prevRef.rect) : true;
            const cachedVisibility = getCachedVisbility(ancestor, options);
            if (useCache && cachedVisibility !== undefined) return cachedVisibility;
            const { opacity, display, position, overflow, visibility, clip, clipPath } = win.getComputedStyle(ancestor);
            seen.push(ancestor);
            const opacityValue = Math.floor(parseFloat(opacity) * 10);
            if (opacityValue === 0 && options.opacity) {
                transparent = true;
                return false;
            }
            if (visibility === 'hidden' || display === 'none') return false;
            if (prevRef?.absolute && position === 'static') {
                seen.pop();
                continue;
            }
            if (isClipped(clip, clipPath)) return false;
            if (overflow === 'hidden') {
                if (prevRef?.rect && !containedInAncestor(prevRef.rect, getRect())) return false;
                if (isNegligibleRect(getRect())) return false;
            }
            if (position === 'absolute' && !isOnScreen(getRect())) return false;
            if (position === 'fixed') return isOnScreen(prevRef?.rect ?? getRect());
            if (display === 'contents') {
                prevRef = null;
                continue;
            }
            prevRef = prevRef ?? {
                rect: getRect(),
            };
            prevRef.rect = getRect();
            prevRef.absolute = position === 'absolute';
            continue;
        }
        return true;
    };
    const visible = check();
    if (useCache) {
        if (options.opacity) {
            if (visible || !transparent) setCachedVisibility(getVisibilityCache('visibility'))(seen, visible);
            else setCachedVisibility(getVisibilityCache('visibility'))(seen.slice(0, -1), visible);
        }
        setCachedVisibility(cache)(seen, visible);
    }
    return visible;
};

const quickVisibilityCheck = (el, options) => {
    const cache = getVisibilityCache(`${options.minWidth}:${options.minHeight}`);
    if (cache.has(el)) return cache.get(el);
    const check = () => {
        const rect = el.getClientRects();
        if (rect.length === 0) return false;
        const classList = Array.from(el.classList).map(sanitizeStringWithSpaces);
        if (any(matchHidden)(classList)) return false;
        const { visibility, display, maxHeight } = getComputedStyle(el);
        if (visibility === 'hidden' || display === 'none' || maxHeight === '0px') return false;
        if (el.offsetHeight === 0 || el.offsetWidth === 0) return false;
        if (el.offsetHeight < options.minHeight || el.offsetWidth < options.minWidth) return false;
        return true;
    };
    const visible = check();
    setCachedVisibility(cache)([el], visible);
    return visible;
};

const isVisibleEl = (el) =>
    quickVisibilityCheck(el, {
        minHeight: 0,
        minWidth: 0,
    });

const isVisibleForm = (form, options = {}) => {
    const visible = (() => {
        if (
            !isVisible(form, {
                opacity: true,
                ...options,
            })
        )
            return false;
        if (isCustomElementWithShadowRoot(form) || isShadowElement(form)) return true;
        const inputs = Array.from(form.querySelectorAll(inputCandidateSelector)).filter((field) => !field.disabled);
        const iframes = Array.from(form.querySelectorAll('iframe')).filter(isIFrameField);
        const fields = [...inputs, ...iframes];
        return (
            fields.length > 0 &&
            fields.some((input) =>
                isVisible(input, {
                    opacity: false,
                    ...options,
                })
            )
        );
    })();
    if (!visible) flagAsHidden(form);
    return visible;
};

const isVisibleField = (field) => {
    if (field instanceof HTMLInputElement) {
        const { type, disabled, readOnly } = field;
        if (type === 'hidden' || disabled || readOnly || field.getAttribute('aria-hidden') === 'true') return false;
    }
    return quickVisibilityCheck(field, {
        minHeight: MIN_FIELD_HEIGHT,
        minWidth: MIN_FIELD_WIDTH,
    });
};

const OVERRIDE_FORMS = new Set();

const OVERRIDE_FIELDS = new Set();

const addFormOverride = (el) => OVERRIDE_FORMS.add(el);

const addFieldOverride = (el) => OVERRIDE_FIELDS.add(el);

const clearOverrides = () => {
    OVERRIDE_FORMS.clear();
    OVERRIDE_FORMS.clear();
};

const getOverridableForms = () => Array.from(OVERRIDE_FORMS);

const getOverridableFields = () => Array.from(OVERRIDE_FIELDS);

const matchFormOverrides = () => domQuery(getOverridableForms);

const matchFieldOverrides = () => domQuery(getOverridableFields);

const acceptFormOverride = (fnode) => isPredictedForm(fnode) && isVisibleForm(fnode.element);

const acceptFieldOverride = (fnode) => isPredictedField(fnode) && isVisibleField(fnode.element);

const overrides = [
    rule(matchFormOverrides(), type('override-form'), {}),
    rule(matchFieldOverrides(), type('override-field'), {}),
    rule(type('override-form').when(acceptFormOverride), type('form-candidate'), {}),
    rule(type('override-field').when(acceptFieldOverride), type('field-candidate'), {}),
];

const flagOverride = ({ form, formType, fields }) => {
    if (isVisibleForm(form)) {
        removePredictionFlag(form);
        setCachedPredictionScore(form, formType, 1);
        if (isShadowElement(form)) addFormOverride(form);
        else if (form.tagName !== 'FORM') flagCluster(form);
        fields.forEach(({ field, fieldType }) => {
            removePredictionFlag(field);
            setCachedPredictionScore(field, fieldType, 1);
            if (isShadowElement(field)) addFieldOverride(field);
        });
    }
};

const CC_ATTRIBUTES = [
    'autocomplete',
    'name',
    'id',
    'class',
    'aria-label',
    'aria-labelledby',
    'placeholder',
    'data-testid',
    'data-stripe',
    'data-recurly',
    'data-encrypted-name',
];

const CC_INPUT_TYPES = ['tel', 'phone', 'text', 'number', 'password'];

const CC_EXP_YEAR_FORMAT = ['YYYY', 'AAAA', 'YY', 'AA'];

const CC_EXP_MONTH_FORMAT = ['MM', 'LL'];

const CC_EXP_SEPARATOR = ['', '/', '-'];

const CC_EXP_DEFAULT_FORMAT = {
    separator: '/',
    fullYear: false,
    monthFirst: true,
};

const CC_EXP_FORMATS = [
    {
        fullYear: true,
        monthFirst: true,
    },
    {
        fullYear: false,
        monthFirst: true,
    },
    {
        fullYear: true,
        monthFirst: false,
    },
    {
        fullYear: false,
        monthFirst: false,
    },
];

const MAX_LENGTH_FORMAT_MAP = {
    4: {
        separator: '',
        fullYear: false,
        monthFirst: true,
    },
    5: {
        separator: '/',
        fullYear: false,
        monthFirst: true,
    },
    6: {
        separator: '',
        fullYear: true,
        monthFirst: true,
    },
    7: {
        separator: '/',
        fullYear: true,
        monthFirst: true,
    },
};

const YEAR_OPTION = (new Date().getFullYear() + 1).toString();

const generateExpirationString = ({ fullYear, separator, monthFirst }) => {
    const month = '01';
    const year = fullYear ? '2025' : '25';
    return monthFirst ? `${month}${separator}${year}` : `${year}${separator}${month}`;
};

const getExpirationFormatFromPattern = (pattern) => {
    try {
        const regex = new RegExp(`^${pattern}$`);
        for (const format of CC_EXP_FORMATS) {
            for (const separator of CC_EXP_SEPARATOR) {
                const testString = generateExpirationString({
                    ...format,
                    separator,
                });
                if (regex.test(testString)) {
                    return {
                        separator,
                        fullYear: format.fullYear,
                        monthFirst: format.monthFirst,
                    };
                }
            }
        }
    } catch {}
};

const getCCFormatHaystack = (input) => {
    const { placeholder, className, id, name } = input;
    const ariaLabel = input.getAttribute('aria-label');
    const label = getLabelFor(input)?.innerText;
    return [className, id, name, ariaLabel, placeholder.replace(/\s/g, ''), label?.replace(/\s/g, '')]
        .filter(Boolean)
        .join(' ')
        .toUpperCase();
};

const getExpirationFormatFromMaxLength = (maxLength) => MAX_LENGTH_FORMAT_MAP[maxLength];

const getExpirationFormatFromAttributes = (input) => {
    const haystack = getCCFormatHaystack(input);
    for (const separator of CC_EXP_SEPARATOR) {
        for (const year of CC_EXP_YEAR_FORMAT) {
            for (const monthFirst of [true, false]) {
                if (haystack.includes(monthFirst ? `MM${separator}${year}` : `${year}${separator}MM`)) {
                    return {
                        separator,
                        fullYear: year.length === 4,
                        monthFirst,
                    };
                }
            }
        }
    }
};

const getExpirationFormat = (field, allowFallback = true) => {
    if (field instanceof HTMLInputElement) {
        const validMaxLength = field.maxLength >= 4;
        const validPattern = field.pattern && (field.maxLength === -1 || validMaxLength);
        return (
            getExpirationFormatFromAttributes(field) ||
            (validPattern && getExpirationFormatFromPattern(field.pattern)) ||
            (validMaxLength && getExpirationFormatFromMaxLength(field.maxLength)) ||
            (allowFallback ? CC_EXP_DEFAULT_FORMAT : undefined)
        );
    }
};

const formatExpirationDate = (month, year, { fullYear, separator, monthFirst }) => {
    const formattedYear = fullYear ? year.slice(0, 4) : year.slice(-2);
    const formattedMonth = month.padStart(2, '0');
    const components = monthFirst ? [formattedMonth, formattedYear] : [formattedYear, formattedMonth];
    return components.join(separator);
};

const getSelectOptions = (el) =>
    Array.from(el.options)
        .map((opt) => opt.value)
        .filter(Boolean);

const getInputExpirationMonthFormat = (input) => {
    const haystack = getCCFormatHaystack(input);
    if (CC_EXP_MONTH_FORMAT.some((pattern) => haystack.includes(pattern)))
        return {
            padding: true,
        };
    return {
        padding: input.minLength === 2 || input.maxLength === 2,
    };
};

const getInputExpirationYearFormat = (input) => {
    if (input.minLength === 4)
        return {
            fullYear: true,
        };
    const haystack = getCCFormatHaystack(input);
    for (const year of CC_EXP_YEAR_FORMAT) {
        if (haystack.includes(year))
            return {
                fullYear: year.length === 4,
            };
    }
    return {
        fullYear: false,
    };
};

const getSelectExpirationYearFormat = (select) => {
    const options = getSelectOptions(select);
    if (options.some((value) => /^\d{4}$/.test(value)))
        return {
            fullYear: true,
        };
    if (options.some((value) => /^\d{2}$/.test(value)))
        return {
            fullYear: false,
        };
};

const getSelectExpirationMonthFormat = (select) => {
    const options = getSelectOptions(select);
    if (options.some((value) => /^0[1-9]$/.test(value)))
        return {
            padding: true,
        };
    if (options.some((value) => /^([1-9]|1[0-2])$/.test(value)))
        return {
            padding: false,
        };
};

const AUTOCOMPLETE_OUTLIERS = ['given-name', 'additional-name', 'family-name', 'name'];

const guard$1 = (options, predicate) => (field, autocompletes, haystack) => {
    if (!options.password && field.getAttribute('type') === 'password') return false;
    if (autocompletes.includes(options.autocomplete)) return true;
    if (autocompletes.some((autocomplete) => AUTOCOMPLETE_OUTLIERS.includes(autocomplete))) return false;
    return predicate(field, autocompletes, haystack) && not(matchCCOutlier)(haystack);
};

const notCCIdentityOutlier = (autocompletes) => {
    if (autocompletes.includes('billing')) return false;
    if (autocompletes.includes('shipping')) return false;
    return true;
};

const isCCFirstName = (_, autocompletes, haystack) => matchCCFirstName(haystack) && notCCIdentityOutlier(autocompletes);

const isCCLastName = (_, autocompletes, haystack) => matchCCLastName(haystack) && notCCIdentityOutlier(autocompletes);

const isCCName = (_, autocomplete, haystack) => matchCCName(haystack) && notCCIdentityOutlier(autocomplete);

const isCCSecurityCode = (_, _auto, haystack) => or(matchCCV, matchCCSecurityCode)(haystack);

const isCCNumber = (_, __, haystack) => matchCCNumber(haystack);

const isCCExp = (field, _, haystack) => field instanceof HTMLInputElement && matchCCExp(haystack);

const isCCExpMonth = (field, autocompletes, haystack) => {
    if (autocompletes.includes('cc-exp')) return false;
    if (matchCCExpMonth(haystack)) return true;
    if (field instanceof HTMLSelectElement && matchCCExp(haystack)) {
        return field.options.length >= 12 && field.options.length <= 14;
    }
    return false;
};

const isCCExpYear = (field, autocompletes, haystack) => {
    if (autocompletes.includes('cc-exp')) return false;
    if (matchCCExpYear(haystack)) return true;
    if (field instanceof HTMLSelectElement && matchCCExp(haystack)) {
        for (const option of field.options) {
            if (option.innerText === YEAR_OPTION) return true;
            if (option.value === YEAR_OPTION) return true;
        }
    }
    return false;
};

const CC_MATCHERS = [
    [
        CCFieldType.FIRSTNAME,
        guard$1(
            {
                autocomplete: 'cc-given-name',
            },
            isCCFirstName
        ),
    ],
    [
        CCFieldType.LASTNAME,
        guard$1(
            {
                autocomplete: 'cc-family-name',
            },
            isCCLastName
        ),
    ],
    [
        CCFieldType.NAME,
        guard$1(
            {
                autocomplete: 'cc-name',
            },
            isCCName
        ),
    ],
    [
        CCFieldType.EXP_YEAR,
        guard$1(
            {
                autocomplete: 'cc-exp-year',
            },
            isCCExpYear
        ),
    ],
    [
        CCFieldType.EXP_MONTH,
        guard$1(
            {
                autocomplete: 'cc-exp-month',
            },
            isCCExpMonth
        ),
    ],
    [
        CCFieldType.EXP,
        guard$1(
            {
                autocomplete: 'cc-exp',
            },
            isCCExp
        ),
    ],
    [
        CCFieldType.CSC,
        guard$1(
            {
                autocomplete: 'cc-csc',
                password: true,
            },
            isCCSecurityCode
        ),
    ],
    [
        CCFieldType.NUMBER,
        guard$1(
            {
                autocomplete: 'cc-number',
            },
            isCCNumber
        ),
    ],
];

const getCCHaystack = (field) => {
    const attrs = CC_ATTRIBUTES.map((attr) => field?.getAttribute(attr) ?? '');
    const label = sanitizeString(getLabelFor(field)?.innerText ?? '');
    return sanitizeStringWithSpaces(attrs.join(' ')) + ' ' + label;
};

const getCachedCCSubtype = (el) => {
    const subType = getCachedSubType(el);
    if (subType && ccFields.has(subType)) return subType;
};

const getCCFieldType = (field) => {
    const cachedSubType = getCachedCCSubtype(field);
    if (cachedSubType) return cachedSubType;
    const haystack = getCCHaystack(field);
    const autocompletes = getAutocompletes(field);
    if (haystack) return CC_MATCHERS.find(([, test]) => test(field, autocompletes, haystack))?.[0];
};

const matchCCInputField = (input, { type, visible }) => {
    if (getCachedCCSubtype(input)) return true;
    if (!visible) return false;
    if (type && !CC_INPUT_TYPES.includes(type)) return false;
    const ccType = getCCFieldType(input);
    if (ccType) setCachedSubType(input, ccType);
    return ccType !== undefined;
};

const isCCInputField = (fnode) => {
    const { isCC } = fnode.noteFor('field');
    return isCC;
};

const isCCSelectField = (fnode) => {
    const select = fnode.element;
    if (!(select instanceof HTMLSelectElement)) return false;
    if (getCachedCCSubtype(select)) return true;
    const visible = isVisible(select, {
        opacity: false,
    });
    if (!visible) return false;
    const isProcessable = isClassifiable(select);
    if (!isProcessable) return false;
    const ccType = getCCFieldType(select);
    if (ccType) setCachedSubType(select, ccType);
    return ccType !== undefined;
};

const getFormParent = (form) =>
    walkUpWhile(form, MAX_FORM_FIELD_WALK_UP)((el) => el.querySelectorAll(formCandidateSelector).length <= 1);

const createInputIterator = (form) => {
    const formEls = Array.from(form.querySelectorAll(inputCandidateSelector)).filter(isVisibleField);
    return {
        prev(input) {
            const idx = formEls.indexOf(input);
            return idx === -1 ? null : (formEls?.[idx - 1] ?? null);
        },
        next(input) {
            const idx = formEls.indexOf(input);
            return idx === -1 ? null : (formEls?.[idx + 1] ?? null);
        },
    };
};

const selectFormCandidates = (root = document) => {
    const candidates = Array.from(root.querySelectorAll(formCandidateSelector));
    return candidates.filter((form) => !isIgnored(form) && !attrIgnored(form));
};

const guard = (matches, predicate) => (autocompletes, haystack) => {
    if (matches.some((match) => autocompletes.includes(match))) return true;
    return predicate(haystack);
};

const IDENTITY_MATCHERS = [
    [IdentityFieldType.FIRSTNAME, guard(['given-name'], matchFirstName)],
    [IdentityFieldType.MIDDLENAME, guard(['additional-name'], matchMiddleName)],
    [IdentityFieldType.LASTNAME, guard(['family-name'], matchLastName)],
    [IdentityFieldType.FULLNAME, guard(['name'], matchFullName)],
    [IdentityFieldType.TELEPHONE, guard(['tel', 'tel-national', 'tel-local'], matchTelephone)],
    [IdentityFieldType.ORGANIZATION, guard(['organization'], matchOrganization)],
    [IdentityFieldType.CITY, guard(['address-level2'], matchCity)],
    [IdentityFieldType.ZIPCODE, guard(['postal-code'], matchZipCode)],
    [IdentityFieldType.STATE, guard(['address-level1'], matchState)],
    [IdentityFieldType.COUNTRY, guard(['country-name'], matchCountry)],
    [IdentityFieldType.ADDRESS, guard(['street-address', 'address-line1'], matchAddress)],
];

const IDENTITY_ATTRIBUTES = ['autocomplete', 'name', 'id', 'data-bhw'];

const IDENTITY_INPUT_TYPES = ['tel', 'phone', 'text', 'number'];

const getCachedIdentitySubType = (el) => {
    const subType = getCachedSubType(el);
    if (subType && identityFields.has(subType)) return subType;
};

const getIdentityHaystack = (input) => {
    const attrs = IDENTITY_ATTRIBUTES.map((attr) => input?.getAttribute(attr) ?? '');
    return sanitizeStringWithSpaces(attrs.join(' '));
};

const getIdentityFieldType = (input) => {
    const cachedSubType = getCachedIdentitySubType(input);
    if (cachedSubType) return cachedSubType;
    const haystack = getIdentityHaystack(input);
    const autocompletes = getAutocompletes(input);
    if (haystack) return IDENTITY_MATCHERS.find(([, test]) => test(autocompletes, haystack))?.[0];
};

const isAutocompleteListInput = (el) => el.getAttribute('aria-autocomplete') === 'list' || el.role === 'combobox';

const matchIdentityField = (input, { form, searchField, type, visible }) => {
    if (getCachedIdentitySubType(input)) return true;
    const outlierField =
        (type && !IDENTITY_INPUT_TYPES.includes(type)) || input.getAttribute('autocomplete')?.includes('email');
    const outlierForm = form.login || form.recovery;
    if (!visible || outlierForm || outlierField) return false;
    const identityType = getIdentityFieldType(input);
    if (!identityType) return false;
    const validIdentity = (() => {
        if (isAutocompleteListInput(input))
            return [IdentityFieldType.ADDRESS, IdentityFieldType.ZIPCODE].includes(identityType);
        if (type === 'number') return [IdentityFieldType.TELEPHONE, IdentityFieldType.ZIPCODE].includes(identityType);
        if (searchField)
            return [
                IdentityFieldType.ADDRESS,
                IdentityFieldType.ZIPCODE,
                identityType === IdentityFieldType.CITY,
            ].includes(identityType);
        return true;
    })();
    if (validIdentity) setCachedSubType(input, identityType);
    return true;
};

const isIdentity = (fnode) => {
    const { isIdentity, isCC } = fnode.noteFor('field');
    return isIdentity && !isCC;
};

const { linearScale } = utils;

const getFormFeatures = (fnode) => {
    const form = fnode.element;
    const parent = getFormParent(form);
    const fields = Array.from(form.querySelectorAll(kFieldSelector));
    const visibleFields = fields.filter(isVisibleField);
    const doc = form.ownerDocument;
    const inputs = fields.filter((el) => el.matches('input:not([type="submit"])'));
    const visibleInputs = visibleFields.filter((el) => el.matches('input:not([type="submit"])'));
    const fieldsets = form.querySelectorAll('fieldset');
    const textareas = visibleFields.filter((el) => el.matches('textarea'));
    const selects = visibleFields.filter(
        (el, idx, fields) => el.matches('select') && fields?.[idx + 1]?.type !== 'tel'
    );
    const optionsCount = selects.reduce((total, el) => total + el.querySelectorAll('option').length, 0);
    const submits = visibleFields.filter((el) => el.matches('[type="submit"]'));
    const hidden = inputs.filter((el) => el.matches('[type="hidden"]'));
    const texts = visibleInputs.filter((el) => el.matches('[type="text"]'));
    const usernames = inputs.filter(isUsernameCandidate);
    const emails = inputs.filter(isEmailCandidate);
    const tels = inputs.filter((el) => el.matches('[type="tel"]'));
    const pws = inputs.filter((el) => el.matches(kPasswordSelector));
    const ccs = inputs.concat(selects).filter((el) => getCCFieldType(el) !== undefined);
    const identities = inputs.filter((el) => getIdentityFieldType(el) !== undefined);
    const [identifiers, hiddenIdentifiers] = splitFieldsByVisibility(uniqueNodes(usernames, emails, tels));
    const [passwords, hiddenPasswords] = splitFieldsByVisibility(pws);
    const radios = visibleInputs.filter((el) => el.matches('[type="radio"]'));
    const checkboxes = visibleInputs.filter((el) => el.matches('[type="checkbox"]'));
    const numbers = visibleInputs.filter((el) => el.matches('[type="number"]'));
    const dates = visibleInputs.filter((el) => el.matches('[type="date"]'));
    const files = visibleInputs.filter((el) => el.matches('[type="file"]'));
    const mfas = tels.concat(numbers).concat(texts);
    const required = visibleInputs.filter((el) => el.matches('[required]'));
    const patterns = visibleInputs.filter((el) => el.matches('[pattern]'));
    const minMaxLengths = visibleInputs.filter((el) => el.matches('[minLength], [maxLength]'));
    const autofocused = visibleInputs.find((el) => el.matches('input[autofocus]:first-of-type'));
    const captchas = parent.querySelectorAll(kCaptchaSelector);
    const socialEls = Array.from(parent.querySelectorAll(kSocialSelector));
    const btns = Array.from(form.querySelectorAll(buttonSelector));
    const btnsTypeSubmit = btns.filter((el) => el.matches('[type="submit"]'));
    const candidateBtns = btns.filter(isBtnCandidate);
    const submitBtns = btnsTypeSubmit.length > 0 ? btnsTypeSubmit : candidateBtns;
    const anchors = Array.from(form.querySelectorAll(kAnchorLinkSelector)).filter(isVisibleEl);
    const oauths = socialEls.concat(candidateBtns).filter(isOAuthCandidate);
    const layouts = Array.from(form.querySelectorAll(kLayoutSelector));
    const autofocusedIsIdentifier = Boolean(autofocused && identifiers.includes(autofocused));
    const autofocusedIsPassword = Boolean(autofocused && passwords.includes(autofocused));
    const pageDescriptionText = getPageDescriptionText(doc);
    const nearestHeadingsText = getNearestHeadingsText(form);
    const formTextAttrText = getFormText(form);
    const formAttributes = getFormAttributes(form);
    const pwHaystack = pws.flatMap(getAllFieldHaystacks);
    const identifierHaystack = identifiers.flatMap(getAllFieldHaystacks);
    const btnHaystack = candidateBtns.flatMap(getAllFieldHaystacks);
    const submitBtnHaystack = submitBtns.flatMap(getAllFieldHaystacks);
    const checkboxesHaystack = checkboxes.flatMap(getAllFieldHaystacks);
    const anchorsHaystack = anchors.flatMap(getAllNodeHaystacks);
    const mfaInputsHaystack = mfas.flatMap(getAllFieldHaystacks);
    const layoutHaystack = layouts.map(getNodeAttributes);
    const outlierHaystack = [formTextAttrText, formTextAttrText, nearestHeadingsText];
    const pageLogin = matchLogin(pageDescriptionText);
    const formTextLogin = matchLogin(formTextAttrText);
    const formAttrsLogin = any(matchLogin)(formAttributes);
    const headingsLogin = matchLogin(nearestHeadingsText);
    const layoutLogin = any(matchLogin)(layoutHaystack);
    const rememberMeCheckbox = any(matchRememberMe)(checkboxesHaystack);
    const submitLogin = any(matchLogin)(submitBtnHaystack);
    const troubleLink = any(matchTrouble)(anchorsHaystack);
    const pageRegister = matchRegister(pageDescriptionText);
    const formTextRegister = matchRegister(formTextAttrText);
    const formAttrsRegister = any(matchRegister)(formAttributes);
    const headingsRegister = matchRegister(nearestHeadingsText);
    const layoutRegister = any(matchRegister)(layoutHaystack);
    const TOSRef = any(matchTOS)(checkboxesHaystack.concat(anchorsHaystack));
    const submitRegister = any(matchRegister)(submitBtnHaystack);
    const pwNewRegister = any(matchPasswordCreateAttr)(pwHaystack);
    const pwConfirmRegister = any(matchPasswordConfirmAttr)(pwHaystack);
    const pagePwReset = matchPasswordReset(pageDescriptionText);
    const formTextPwReset = matchPasswordReset(formTextAttrText);
    const formAttrsPwReset = any(matchPasswordResetAttr)(formAttributes);
    const headingsPwReset = matchPasswordReset(nearestHeadingsText);
    const layoutPwReset = any(matchPasswordResetAttr)(layoutHaystack);
    const pageRecovery = matchRecovery(pageDescriptionText);
    const formTextRecovery = matchRecovery(formTextAttrText);
    const formAttrsRecovery = any(matchRecovery)(formAttributes);
    const headingsRecovery = matchRecovery(nearestHeadingsText);
    const layoutRecovery = any(matchRecovery)(layoutHaystack);
    const submitRecovery = any(matchRecovery)(submitBtnHaystack);
    const identifierRecovery = any(matchRecovery)(identifierHaystack);
    const inputsMFA = any(matchMfaAttr)(mfaInputsHaystack);
    const inputsOTP = any(matchOtpAttr)(mfaInputsHaystack);
    const formTextMFA = matchMfa(formTextAttrText.concat(nearestHeadingsText));
    const formAttrsMFA = any(matchMfaAttr)(formAttributes);
    const formOTPOutlier = any(matchOtpOutlier)(formAttributes);
    const linkOTPOutlier = any(matchOtpOutlier)(anchorsHaystack.concat(btnHaystack));
    const newsletterForm = any(matchNewsletter)(outlierHaystack);
    const searchForm = any(matchSearchAction)(outlierHaystack);
    const buttonMultiStep = any(matchStepAction)(submitBtnHaystack);
    const headingsMultiStep = matchMultiStep(nearestHeadingsText);
    return {
        fieldsCount: linearScale(visibleFields.length, 1, 5),
        inputCount: linearScale(visibleInputs.length, 1, 5),
        fieldsetCount: linearScale(fieldsets.length, 1, 5),
        textCount: linearScale(texts.length, 0, 3),
        textareaCount: linearScale(textareas.length, 0, 2),
        selectCount: linearScale(selects.length, 0, 2),
        optionsCount: linearScale(optionsCount, 0, 5),
        checkboxCount: linearScale(checkboxes.length, 0, 2),
        radioCount: linearScale(radios.length, 0, 5),
        identifierCount: linearScale(identifiers.length, 0, 2),
        hiddenIdentifierCount: linearScale(hiddenIdentifiers.length, 0, 2),
        hiddenCount: linearScale(hidden.length, 0, 5),
        passwordCount: linearScale(passwords.length, 0, 2),
        hiddenPasswordCount: linearScale(hiddenPasswords.length, 0, 2),
        usernameCount: linearScale(usernames.length, 0, 2),
        emailCount: linearScale(emails.length, 0, 2),
        submitCount: linearScale(submits.length, 0, 2),
        identitiesCount: linearScale(identities.length, 0, 5),
        ccsCount: linearScale(ccs.length, 0, 2),
        hasTels: boolInt(tels.length > 0),
        hasOAuth: boolInt(oauths.length > 0),
        hasCaptchas: boolInt(captchas.length > 0),
        hasFiles: boolInt(files.length > 0),
        hasDate: boolInt(dates.length > 0),
        hasNumber: boolInt(numbers.length > 0),
        oneVisibleField: boolInt(visibleInputs.length === 1),
        twoVisibleFields: boolInt(visibleInputs.length === 2),
        threeOrMoreVisibleFields: boolInt(visibleInputs.length >= 3),
        noPasswords: boolInt(passwords.length === 0),
        onePassword: boolInt(passwords.length === 1),
        twoPasswords: boolInt(passwords.length === 2),
        threeOrMorePasswords: boolInt(passwords.length >= 3),
        noIdentifiers: boolInt(identifiers.length === 0),
        oneIdentifier: boolInt(identifiers.length === 1),
        twoIdentifiers: boolInt(identifiers.length === 2),
        threeOrMoreIdentifiers: boolInt(identifiers.length >= 3),
        autofocusedIsIdentifier: boolInt(autofocusedIsIdentifier),
        autofocusedIsPassword: boolInt(autofocusedIsPassword),
        visibleInputsCount: safeInt(visibleInputs.length),
        inputRatio: safeInt(inputs.length / fields.length),
        hiddenRatio: safeInt(hidden.length / fields.length),
        visibleRatio: safeInt(visibleInputs.length / fields.length),
        identifierRatio: safeInt(identifiers.length / visibleFields.length),
        emailRatio: safeInt(emails.length / visibleFields.length),
        usernameRatio: safeInt(usernames.length / visibleFields.length),
        passwordRatio: safeInt(passwords.length / visibleFields.length),
        checkboxRatio: safeInt(checkboxes.length / visibleFields.length),
        requiredRatio: safeInt(required.length / visibleFields.length),
        patternRatio: safeInt(patterns.length / visibleFields.length),
        minMaxLengthRatio: safeInt(minMaxLengths.length / visibleFields.length),
        pageLogin: boolInt(pageLogin),
        formTextLogin: boolInt(formTextLogin),
        formAttrsLogin: boolInt(formAttrsLogin),
        headingsLogin: boolInt(headingsLogin),
        layoutLogin: boolInt(layoutLogin),
        rememberMeCheckbox: boolInt(rememberMeCheckbox),
        troubleLink: boolInt(troubleLink),
        submitLogin: boolInt(submitLogin),
        pageRegister: boolInt(pageRegister),
        formTextRegister: boolInt(formTextRegister),
        formAttrsRegister: boolInt(formAttrsRegister),
        headingsRegister: boolInt(headingsRegister),
        layoutRegister: boolInt(layoutRegister),
        pwNewRegister: boolInt(pwNewRegister),
        pwConfirmRegister: boolInt(pwConfirmRegister),
        submitRegister: boolInt(submitRegister),
        TOSRef: boolInt(TOSRef),
        pagePwReset: boolInt(pagePwReset),
        formTextPwReset: boolInt(formTextPwReset),
        formAttrsPwReset: boolInt(formAttrsPwReset),
        headingsPwReset: boolInt(headingsPwReset),
        layoutPwReset: boolInt(layoutPwReset),
        pageRecovery: boolInt(pageRecovery),
        formTextRecovery: boolInt(formTextRecovery),
        formAttrsRecovery: boolInt(formAttrsRecovery),
        headingsRecovery: boolInt(headingsRecovery),
        layoutRecovery: boolInt(layoutRecovery),
        identifierRecovery: boolInt(identifierRecovery),
        submitRecovery: boolInt(submitRecovery),
        formMFA: boolInt(formTextMFA || formAttrsMFA),
        formTextMFA: boolInt(formTextMFA),
        formAttrsMFA: boolInt(formAttrsMFA),
        formOTPOutlier: boolInt(formOTPOutlier),
        linkOTPOutlier: boolInt(linkOTPOutlier),
        inputsMFA: boolInt(inputsMFA),
        inputsOTP: boolInt(inputsOTP),
        newsletterForm: boolInt(newsletterForm),
        searchForm: boolInt(searchForm),
        multiStepForm: boolInt(buttonMultiStep || headingsMultiStep),
        multiAuthForm: boolInt(submitRegister && submitLogin),
        formInputIterator: createInputIterator(form),
    };
};

const FORM_FEATURES = [
    'fieldsCount',
    'inputCount',
    'fieldsetCount',
    'textCount',
    'textareaCount',
    'selectCount',
    'optionsCount',
    'radioCount',
    'identifierCount',
    'hiddenIdentifierCount',
    'usernameCount',
    'emailCount',
    'hiddenCount',
    'hiddenPasswordCount',
    'submitCount',
    'identitiesCount',
    'ccsCount',
    'hasTels',
    'hasOAuth',
    'hasCaptchas',
    'hasFiles',
    'hasDate',
    'hasNumber',
    'oneVisibleField',
    'twoVisibleFields',
    'threeOrMoreVisibleFields',
    'noPasswords',
    'onePassword',
    'twoPasswords',
    'threeOrMorePasswords',
    'noIdentifiers',
    'oneIdentifier',
    'twoIdentifiers',
    'threeOrMoreIdentifiers',
    'autofocusedIsIdentifier',
    'autofocusedIsPassword',
    'visibleRatio',
    'inputRatio',
    'hiddenRatio',
    'identifierRatio',
    'emailRatio',
    'usernameRatio',
    'passwordRatio',
    'requiredRatio',
    'checkboxRatio',
    'pageLogin',
    'formTextLogin',
    'formAttrsLogin',
    'headingsLogin',
    'layoutLogin',
    'rememberMeCheckbox',
    'troubleLink',
    'submitLogin',
    'pageRegister',
    'formTextRegister',
    'formAttrsRegister',
    'headingsRegister',
    'layoutRegister',
    'pwNewRegister',
    'pwConfirmRegister',
    'submitRegister',
    'TOSRef',
    'pagePwReset',
    'formTextPwReset',
    'formAttrsPwReset',
    'headingsPwReset',
    'layoutPwReset',
    'pageRecovery',
    'formTextRecovery',
    'formAttrsRecovery',
    'headingsRecovery',
    'layoutRecovery',
    'identifierRecovery',
    'submitRecovery',
    'formTextMFA',
    'formAttrsMFA',
    'inputsMFA',
    'inputsOTP',
    'newsletterForm',
    'searchForm',
    'multiStepForm',
    'multiAuthForm',
];

const FORM_COMBINED_FEATURES = [
    ...FORM_FEATURES,
    ...combineFeatures(
        ['visibleRatio', 'identifierRatio', 'passwordRatio', 'requiredRatio'],
        [
            'fieldsCount',
            'identifierCount',
            'passwordCount',
            'hiddenIdentifierCount',
            'hiddenPasswordCount',
            'multiStepForm',
        ]
    ),
];

const results$9 = {
    coeffs: [
        ['login-fieldsCount', 2.1884686946868896],
        ['login-inputCount', -2.4522156715393066],
        ['login-fieldsetCount', -13.388813972473145],
        ['login-textCount', -6.24843692779541],
        ['login-textareaCount', -8235719724325463e-20],
        ['login-selectCount', -4.0417094230651855],
        ['login-optionsCount', -1.7528983354568481],
        ['login-radioCount', -1.003969268831284e-10],
        ['login-identifierCount', -2.442622661590576],
        ['login-hiddenIdentifierCount', 4.836703777313232],
        ['login-usernameCount', 2.292856216430664],
        ['login-emailCount', -4.723865985870361],
        ['login-hiddenCount', 2.263331413269043],
        ['login-hiddenPasswordCount', 13.013806343078613],
        ['login-submitCount', -2.5241591930389404],
        ['login-identitiesCount', -10.135244369506836],
        ['login-ccsCount', -15.762754440307617],
        ['login-hasTels', -6.245845794677734],
        ['login-hasOAuth', 0.8879042267799377],
        ['login-hasCaptchas', -0.05481240525841713],
        ['login-hasFiles', -1.1577368397297505e-8],
        ['login-hasDate', -5.746957302093506],
        ['login-hasNumber', -0.006089945789426565],
        ['login-oneVisibleField', 4.727501392364502],
        ['login-twoVisibleFields', 1.91348397731781],
        ['login-threeOrMoreVisibleFields', 3.0250799655914307],
        ['login-noPasswords', -11.500524520874023],
        ['login-onePassword', 5.686596870422363],
        ['login-twoPasswords', 0.6912050247192383],
        ['login-threeOrMorePasswords', -8988316403701901e-20],
        ['login-noIdentifiers', -6.252063274383545],
        ['login-oneIdentifier', -0.5346855521202087],
        ['login-twoIdentifiers', -4.186707973480225],
        ['login-threeOrMoreIdentifiers', 1.2370375394821167],
        ['login-autofocusedIsIdentifier', 5.520582675933838],
        ['login-autofocusedIsPassword', 5.120936393737793],
        ['login-visibleRatio', 3.8644399642944336],
        ['login-inputRatio', 2.6461386680603027],
        ['login-hiddenRatio', -3.7082626819610596],
        ['login-identifierRatio', 7.236349105834961],
        ['login-emailRatio', 1.9276024103164673],
        ['login-usernameRatio', -3.2022547721862793],
        ['login-passwordRatio', 1.0636183023452759],
        ['login-requiredRatio', 1.9747893810272217],
        ['login-checkboxRatio', 5.836816310882568],
        ['login-pageLogin', 6.3761515617370605],
        ['login-formTextLogin', -2.765072532895838e-20],
        ['login-formAttrsLogin', 4.8797831535339355],
        ['login-headingsLogin', 9.623096466064453],
        ['login-layoutLogin', 0.359914094209671],
        ['login-rememberMeCheckbox', -28988415400749146e-28],
        ['login-troubleLink', 4.90132999420166],
        ['login-submitLogin', 6.348006248474121],
        ['login-pageRegister', -5.778190612792969],
        ['login-formTextRegister', -18021038286012778e-39],
        ['login-formAttrsRegister', -9.447672843933105],
        ['login-headingsRegister', -5.71617317199707],
        ['login-layoutRegister', 0.041022125631570816],
        ['login-pwNewRegister', -11.48328685760498],
        ['login-pwConfirmRegister', -8.872979164123535],
        ['login-submitRegister', -8.447990417480469],
        ['login-TOSRef', -1.696659803390503],
        ['login-pagePwReset', -0.722548246383667],
        ['login-formTextPwReset', -7.294802539803413e-10],
        ['login-formAttrsPwReset', -3.382305145263672],
        ['login-headingsPwReset', -7.438139915466309],
        ['login-layoutPwReset', -2.1638119220733643],
        ['login-pageRecovery', -1.903069019317627],
        ['login-formTextRecovery', 7742341618607659e-39],
        ['login-formAttrsRecovery', -13.682883262634277],
        ['login-headingsRecovery', -2.7907838821411133],
        ['login-layoutRecovery', 1.375057339668274],
        ['login-identifierRecovery', 2.075185537338257],
        ['login-submitRecovery', -6.637446403503418],
        ['login-formTextMFA', -11.450064659118652],
        ['login-formAttrsMFA', -9.308587074279785],
        ['login-inputsMFA', -8.950748443603516],
        ['login-inputsOTP', -5.394989013671875],
        ['login-newsletterForm', -3.8884365558624268],
        ['login-searchForm', -0.8574001789093018],
        ['login-multiStepForm', 1.0402129888534546],
        ['login-multiAuthForm', 9.674283027648926],
        ['login-visibleRatio,fieldsCount', -4.081334590911865],
        ['login-visibleRatio,identifierCount', -10.887909889221191],
        ['login-visibleRatio,passwordCount', 11.27631950378418],
        ['login-visibleRatio,hiddenIdentifierCount', -6.778692245483398],
        ['login-visibleRatio,hiddenPasswordCount', -3.0386364459991455],
        ['login-visibleRatio,multiStepForm', 1.8686891794204712],
        ['login-identifierRatio,fieldsCount', -4.965449333190918],
        ['login-identifierRatio,identifierCount', 3.4849963188171387],
        ['login-identifierRatio,passwordCount', -3.608610153198242],
        ['login-identifierRatio,hiddenIdentifierCount', -7.099390983581543],
        ['login-identifierRatio,hiddenPasswordCount', 1.0577179193496704],
        ['login-identifierRatio,multiStepForm', 3.066842555999756],
        ['login-passwordRatio,fieldsCount', 3.336388111114502],
        ['login-passwordRatio,identifierCount', -3.5759830474853516],
        ['login-passwordRatio,passwordCount', 1.0269005298614502],
        ['login-passwordRatio,hiddenIdentifierCount', 6.498629570007324],
        ['login-passwordRatio,hiddenPasswordCount', 2.6814262866973877],
        ['login-passwordRatio,multiStepForm', -15.259577751159668],
        ['login-requiredRatio,fieldsCount', 9.758245468139648],
        ['login-requiredRatio,identifierCount', -5.650469779968262],
        ['login-requiredRatio,passwordCount', 0.7820699214935303],
        ['login-requiredRatio,hiddenIdentifierCount', -0.8526458740234375],
        ['login-requiredRatio,hiddenPasswordCount', 0.38142627477645874],
        ['login-requiredRatio,multiStepForm', 6.779309272766113],
    ],
    bias: -4.81813907623291,
    cutoff: 0.44,
};

const login = {
    name: FormType.LOGIN,
    coeffs: FORM_COMBINED_FEATURES.map((feat) => [
        `login-${feat}`,
        results$9.coeffs.find(([feature]) => feature === `login-${feat}`)?.[1] ?? 0,
    ]),
    bias: results$9.bias,
    cutoff: results$9.cutoff,
    getRules: () => [
        rule(type('form'), type(FormType.LOGIN), {}),
        ...FORM_COMBINED_FEATURES.map((feat) =>
            rule(type(FormType.LOGIN), featureScore('form', feat), {
                name: `login-${feat}`,
            })
        ),
        ...outRuleWithCache('form-candidate', FormType.LOGIN),
    ],
};

const results$8 = {
    coeffs: [
        ['pw-change-fieldsCount', -0.9874480366706848],
        ['pw-change-inputCount', -0.7323402166366577],
        ['pw-change-fieldsetCount', -0.0027682846412062645],
        ['pw-change-textCount', -2.7094967365264893],
        ['pw-change-textareaCount', -0.005656904075294733],
        ['pw-change-selectCount', -0.15384455025196075],
        ['pw-change-optionsCount', -0.3998875916004181],
        ['pw-change-radioCount', -0.00020407966803759336],
        ['pw-change-identifierCount', -2.2469072341918945],
        ['pw-change-hiddenIdentifierCount', -0.08718037605285645],
        ['pw-change-usernameCount', -1.0939913988113403],
        ['pw-change-emailCount', -1.397507905960083],
        ['pw-change-hiddenCount', 0.3042771816253662],
        ['pw-change-hiddenPasswordCount', -0.69037264585495],
        ['pw-change-submitCount', 0.17483192682266235],
        ['pw-change-identitiesCount', -0.3891929090023041],
        ['pw-change-ccsCount', -0.12835747003555298],
        ['pw-change-hasTels', -0.25062432885169983],
        ['pw-change-hasOAuth', -0.15918894112110138],
        ['pw-change-hasCaptchas', -1.2957428693771362],
        ['pw-change-hasFiles', -0.0022998026106506586],
        ['pw-change-hasDate', -2.1642627245910262e-8],
        ['pw-change-hasNumber', -0.0038117675576359034],
        ['pw-change-oneVisibleField', -2.7241475582122803],
        ['pw-change-twoVisibleFields', -1.1602745056152344],
        ['pw-change-threeOrMoreVisibleFields', -0.12543471157550812],
        ['pw-change-noPasswords', -3.9803054332733154],
        ['pw-change-onePassword', -2.456627368927002],
        ['pw-change-twoPasswords', 0.6415166258811951],
        ['pw-change-threeOrMorePasswords', 1.3680634498596191],
        ['pw-change-noIdentifiers', 0.13772524893283844],
        ['pw-change-oneIdentifier', -3.8557088375091553],
        ['pw-change-twoIdentifiers', -0.2826061248779297],
        ['pw-change-threeOrMoreIdentifiers', 1.0047260522842407],
        ['pw-change-autofocusedIsIdentifier', -0.5226410031318665],
        ['pw-change-autofocusedIsPassword', 1.4006041288375854],
        ['pw-change-visibleRatio', -2.5354082584381104],
        ['pw-change-inputRatio', -2.4758033752441406],
        ['pw-change-hiddenRatio', 0.29265108704566956],
        ['pw-change-identifierRatio', -2.642751932144165],
        ['pw-change-emailRatio', -2.353623628616333],
        ['pw-change-usernameRatio', -1.275691032409668],
        ['pw-change-passwordRatio', 2.678403854370117],
        ['pw-change-requiredRatio', 0.5615214109420776],
        ['pw-change-checkboxRatio', -0.009572625160217285],
        ['pw-change-pageLogin', -2.5947816371917725],
        ['pw-change-formTextLogin', -2.6433122002345044e-7],
        ['pw-change-formAttrsLogin', -2.210524797439575],
        ['pw-change-headingsLogin', -1.6288596391677856],
        ['pw-change-layoutLogin', -1.4056291580200195],
        ['pw-change-rememberMeCheckbox', -6.579193723155186e-7],
        ['pw-change-troubleLink', 0.2120497077703476],
        ['pw-change-submitLogin', -2.1167898178100586],
        ['pw-change-pageRegister', -0.9890440702438354],
        ['pw-change-formTextRegister', -74972740897917e-37],
        ['pw-change-formAttrsRegister', -0.3162177503108978],
        ['pw-change-headingsRegister', -0.794610321521759],
        ['pw-change-layoutRegister', -0.39427563548088074],
        ['pw-change-pwNewRegister', 4.206718444824219],
        ['pw-change-pwConfirmRegister', 0.7914554476737976],
        ['pw-change-submitRegister', -1.3258051872253418],
        ['pw-change-TOSRef', -1.9329612255096436],
        ['pw-change-pagePwReset', 1.126761794090271],
        ['pw-change-formTextPwReset', 0.9309775233268738],
        ['pw-change-formAttrsPwReset', 1.3843703269958496],
        ['pw-change-headingsPwReset', 3.414958953857422],
        ['pw-change-layoutPwReset', 2.037259817123413],
        ['pw-change-pageRecovery', -0.21336117386817932],
        ['pw-change-formTextRecovery', -38412603592214696e-40],
        ['pw-change-formAttrsRecovery', -0.08390343189239502],
        ['pw-change-headingsRecovery', 1.1497023105621338],
        ['pw-change-layoutRecovery', 0.880382776260376],
        ['pw-change-identifierRecovery', -0.002089242683723569],
        ['pw-change-submitRecovery', 0.8268365859985352],
        ['pw-change-formTextMFA', -0.0513712614774704],
        ['pw-change-formAttrsMFA', -0.0015445940662175417],
        ['pw-change-inputsMFA', -0.0010850263061001897],
        ['pw-change-inputsOTP', -0.02515420876443386],
        ['pw-change-newsletterForm', -8.84305748627412e-8],
        ['pw-change-searchForm', -0.02600892446935177],
        ['pw-change-multiStepForm', -1.9610707759857178],
        ['pw-change-multiAuthForm', -3.000978097134066e-7],
        ['pw-change-visibleRatio,fieldsCount', -0.65060955286026],
        ['pw-change-visibleRatio,identifierCount', -1.7839655876159668],
        ['pw-change-visibleRatio,passwordCount', 1.1120352745056152],
        ['pw-change-visibleRatio,hiddenIdentifierCount', 0.08139882981777191],
        ['pw-change-visibleRatio,hiddenPasswordCount', -0.3953840732574463],
        ['pw-change-visibleRatio,multiStepForm', -0.8682891726493835],
        ['pw-change-identifierRatio,fieldsCount', 0.38434305787086487],
        ['pw-change-identifierRatio,identifierCount', -1.30518639087677],
        ['pw-change-identifierRatio,passwordCount', 0.4165416657924652],
        ['pw-change-identifierRatio,hiddenIdentifierCount', -0.0015533248661085963],
        ['pw-change-identifierRatio,hiddenPasswordCount', -2216353823314421e-20],
        ['pw-change-identifierRatio,multiStepForm', -0.5634778141975403],
        ['pw-change-passwordRatio,fieldsCount', 0.8313246369361877],
        ['pw-change-passwordRatio,identifierCount', 0.43224313855171204],
        ['pw-change-passwordRatio,passwordCount', 2.9045727252960205],
        ['pw-change-passwordRatio,hiddenIdentifierCount', -0.05686015635728836],
        ['pw-change-passwordRatio,hiddenPasswordCount', -0.40516793727874756],
        ['pw-change-passwordRatio,multiStepForm', -0.17479519546031952],
        ['pw-change-requiredRatio,fieldsCount', -0.03331391140818596],
        ['pw-change-requiredRatio,identifierCount', -0.5386313199996948],
        ['pw-change-requiredRatio,passwordCount', 1.149383783340454],
        ['pw-change-requiredRatio,hiddenIdentifierCount', 0.3070600628852844],
        ['pw-change-requiredRatio,hiddenPasswordCount', -0.0002616644778754562],
        ['pw-change-requiredRatio,multiStepForm', -0.16321322321891785],
    ],
    bias: -2.636658191680908,
    cutoff: 0.99,
};

const passwordChange = {
    name: FormType.PASSWORD_CHANGE,
    coeffs: FORM_COMBINED_FEATURES.map((key) => [
        `pw-change-${key}`,
        results$8.coeffs.find(([feature]) => feature === `pw-change-${key}`)?.[1] ?? 0,
    ]),
    bias: results$8.bias,
    cutoff: results$8.cutoff,
    getRules: () => [
        rule(type('form'), type(FormType.PASSWORD_CHANGE), {}),
        ...FORM_COMBINED_FEATURES.map((key) =>
            rule(type(FormType.PASSWORD_CHANGE), featureScore('form', key), {
                name: `pw-change-${key}`,
            })
        ),
        ...outRuleWithCache('form-candidate', FormType.PASSWORD_CHANGE),
    ],
};

const results$7 = {
    coeffs: [
        ['recovery-fieldsCount', 5.674673557281494],
        ['recovery-inputCount', 5.242894649505615],
        ['recovery-fieldsetCount', 0.6837330460548401],
        ['recovery-textCount', -5.267282485961914],
        ['recovery-textareaCount', -6.0634565353393555],
        ['recovery-selectCount', -3.8453545570373535],
        ['recovery-optionsCount', -4.0065016746521],
        ['recovery-radioCount', -5.770152142758889e-7],
        ['recovery-identifierCount', -1.040993571281433],
        ['recovery-hiddenIdentifierCount', -7.145815849304199],
        ['recovery-usernameCount', 9.878787994384766],
        ['recovery-emailCount', -0.38926905393600464],
        ['recovery-hiddenCount', 5.5426025390625],
        ['recovery-hiddenPasswordCount', -13.108299255371094],
        ['recovery-submitCount', 6.324484348297119],
        ['recovery-identitiesCount', -10.596527099609375],
        ['recovery-ccsCount', -1.5854887962341309],
        ['recovery-hasTels', -2.860434055328369],
        ['recovery-hasOAuth', -2.9029600620269775],
        ['recovery-hasCaptchas', 1.7302414178848267],
        ['recovery-hasFiles', -12.106881141662598],
        ['recovery-hasDate', -1.9205516821330093e-7],
        ['recovery-hasNumber', -0.8531396389007568],
        ['recovery-oneVisibleField', -1.9773660898208618],
        ['recovery-twoVisibleFields', -3.9138710498809814],
        ['recovery-threeOrMoreVisibleFields', -2.3877627849578857],
        ['recovery-noPasswords', 2.3195104598999023],
        ['recovery-onePassword', -8.960136413574219],
        ['recovery-twoPasswords', -3.7855186462402344],
        ['recovery-threeOrMorePasswords', -1.2037618160247803],
        ['recovery-noIdentifiers', -7.881014823913574],
        ['recovery-oneIdentifier', 1.9636720418930054],
        ['recovery-twoIdentifiers', 1.1203242540359497],
        ['recovery-threeOrMoreIdentifiers', -5.450716972351074],
        ['recovery-autofocusedIsIdentifier', 0.22986948490142822],
        ['recovery-autofocusedIsPassword', -5564246112477189e-27],
        ['recovery-visibleRatio', 3.4059219360351562],
        ['recovery-inputRatio', -6.421257972717285],
        ['recovery-hiddenRatio', -0.45853930711746216],
        ['recovery-identifierRatio', -0.9442247152328491],
        ['recovery-emailRatio', -2.3184757232666016],
        ['recovery-usernameRatio', 0.9643603563308716],
        ['recovery-passwordRatio', -5.449034690856934],
        ['recovery-requiredRatio', -1.2555487155914307],
        ['recovery-checkboxRatio', -0.1938471794128418],
        ['recovery-pageLogin', -0.7617322206497192],
        ['recovery-formTextLogin', -0.0005536378594115376],
        ['recovery-formAttrsLogin', -1.6637537479400635],
        ['recovery-headingsLogin', 0.9554299712181091],
        ['recovery-layoutLogin', -7.565581798553467],
        ['recovery-rememberMeCheckbox', -0.7570791840553284],
        ['recovery-troubleLink', 6.763739109039307],
        ['recovery-submitLogin', -2.216869831085205],
        ['recovery-pageRegister', -5.148633003234863],
        ['recovery-formTextRegister', 178809176565838e-37],
        ['recovery-formAttrsRegister', -2.992501735687256],
        ['recovery-headingsRegister', -1.7158910036087036],
        ['recovery-layoutRegister', -5.165904521942139],
        ['recovery-pwNewRegister', -1.305804967880249],
        ['recovery-pwConfirmRegister', -1.1758781671524048],
        ['recovery-submitRegister', -2.061295747756958],
        ['recovery-TOSRef', -11.376678466796875],
        ['recovery-pagePwReset', -1.5232367515563965],
        ['recovery-formTextPwReset', -1.2049137353897095],
        ['recovery-formAttrsPwReset', 1.3937886953353882],
        ['recovery-headingsPwReset', 4.803446292877197],
        ['recovery-layoutPwReset', 0.01253981702029705],
        ['recovery-pageRecovery', 9.515142440795898],
        ['recovery-formTextRecovery', 16702416262168785e-39],
        ['recovery-formAttrsRecovery', 8.574402809143066],
        ['recovery-headingsRecovery', 5.197047710418701],
        ['recovery-layoutRecovery', 0.15674856305122375],
        ['recovery-identifierRecovery', 7.488249778747559],
        ['recovery-submitRecovery', 9.7875337600708],
        ['recovery-formTextMFA', -1.746304988861084],
        ['recovery-formAttrsMFA', 4.984002590179443],
        ['recovery-inputsMFA', -5.2032341957092285],
        ['recovery-inputsOTP', -1.9391424655914307],
        ['recovery-newsletterForm', -2.1542391777038574],
        ['recovery-searchForm', -2.4440646171569824],
        ['recovery-multiStepForm', 0.15941332280635834],
        ['recovery-multiAuthForm', -0.004891326650977135],
        ['recovery-visibleRatio,fieldsCount', -0.9068198800086975],
        ['recovery-visibleRatio,identifierCount', 1.0610864162445068],
        ['recovery-visibleRatio,passwordCount', -3.129828453063965],
        ['recovery-visibleRatio,hiddenIdentifierCount', -0.5238717794418335],
        ['recovery-visibleRatio,hiddenPasswordCount', -3.2704148292541504],
        ['recovery-visibleRatio,multiStepForm', 2.413360595703125],
        ['recovery-identifierRatio,fieldsCount', 1.9418317079544067],
        ['recovery-identifierRatio,identifierCount', 4.812512397766113],
        ['recovery-identifierRatio,passwordCount', -3.377063274383545],
        ['recovery-identifierRatio,hiddenIdentifierCount', -5.2673187255859375],
        ['recovery-identifierRatio,hiddenPasswordCount', -13.097164154052734],
        ['recovery-identifierRatio,multiStepForm', 0.7296380996704102],
        ['recovery-passwordRatio,fieldsCount', -2.8136239051818848],
        ['recovery-passwordRatio,identifierCount', -3.126211404800415],
        ['recovery-passwordRatio,passwordCount', -3.368232488632202],
        ['recovery-passwordRatio,hiddenIdentifierCount', -0.4998331367969513],
        ['recovery-passwordRatio,hiddenPasswordCount', -2.820486599830474e-7],
        ['recovery-passwordRatio,multiStepForm', -0.1164282038807869],
        ['recovery-requiredRatio,fieldsCount', -9.973189353942871],
        ['recovery-requiredRatio,identifierCount', 3.5156900882720947],
        ['recovery-requiredRatio,passwordCount', -0.13184207677841187],
        ['recovery-requiredRatio,hiddenIdentifierCount', 3.830899715423584],
        ['recovery-requiredRatio,hiddenPasswordCount', -3.187682062755215e-10],
        ['recovery-requiredRatio,multiStepForm', -4.8724236488342285],
    ],
    bias: -3.9541075229644775,
    cutoff: 0.5,
};

const recovery = {
    name: FormType.RECOVERY,
    coeffs: FORM_COMBINED_FEATURES.map((key) => [
        `recovery-${key}`,
        results$7.coeffs.find(([feature]) => feature === `recovery-${key}`)?.[1] ?? 0,
    ]),
    bias: results$7.bias,
    cutoff: results$7.cutoff,
    getRules: () => [
        rule(type('form'), type(FormType.RECOVERY), {}),
        ...FORM_COMBINED_FEATURES.map((key) =>
            rule(type(FormType.RECOVERY), featureScore('form', key), {
                name: `recovery-${key}`,
            })
        ),
        ...outRuleWithCache('form-candidate', FormType.RECOVERY),
    ],
};

const results$6 = {
    coeffs: [
        ['register-fieldsCount', 4.801680564880371],
        ['register-inputCount', 7.544517993927002],
        ['register-fieldsetCount', 7.860836982727051],
        ['register-textCount', 9.160674095153809],
        ['register-textareaCount', 3.2533576488494873],
        ['register-selectCount', -5.643256187438965],
        ['register-optionsCount', 0.9256923794746399],
        ['register-radioCount', -0.0018122862093150616],
        ['register-identifierCount', -0.5680729150772095],
        ['register-hiddenIdentifierCount', 13.946723937988281],
        ['register-usernameCount', 2.5040435791015625],
        ['register-emailCount', -3.297682285308838],
        ['register-hiddenCount', -11.975091934204102],
        ['register-hiddenPasswordCount', 3.822888135910034],
        ['register-submitCount', -0.5075709819793701],
        ['register-identitiesCount', -1.572052240371704],
        ['register-ccsCount', -11.559111595153809],
        ['register-hasTels', -2.069363832473755],
        ['register-hasOAuth', -0.7660719752311707],
        ['register-hasCaptchas', 3.826308250427246],
        ['register-hasFiles', -2.3452987670898438],
        ['register-hasDate', -1497183758534474e-29],
        ['register-hasNumber', 8.86275577545166],
        ['register-oneVisibleField', -2.4254777431488037],
        ['register-twoVisibleFields', 0.7471290826797485],
        ['register-threeOrMoreVisibleFields', -1.284441351890564],
        ['register-noPasswords', -5.791749477386475],
        ['register-onePassword', -0.7820603251457214],
        ['register-twoPasswords', 7.5217766761779785],
        ['register-threeOrMorePasswords', -0.030119625851511955],
        ['register-noIdentifiers', -2.701202869415283],
        ['register-oneIdentifier', -0.88741534948349],
        ['register-twoIdentifiers', 2.5786969661712646],
        ['register-threeOrMoreIdentifiers', -3.552288770675659],
        ['register-autofocusedIsIdentifier', 0.007198020815849304],
        ['register-autofocusedIsPassword', 2.651520252227783],
        ['register-visibleRatio', -1.7941482067108154],
        ['register-inputRatio', -5.136865615844727],
        ['register-hiddenRatio', 10.4721097946167],
        ['register-identifierRatio', 4.578858375549316],
        ['register-emailRatio', -1.5893025398254395],
        ['register-usernameRatio', -7.037765026092529],
        ['register-passwordRatio', -2.5261929035186768],
        ['register-requiredRatio', -2.2612900733947754],
        ['register-checkboxRatio', -11.618711471557617],
        ['register-pageLogin', -4.923034191131592],
        ['register-formTextLogin', -1.262025067783057e-10],
        ['register-formAttrsLogin', -1.4414982795715332],
        ['register-headingsLogin', -5.461226940155029],
        ['register-layoutLogin', 2.868037700653076],
        ['register-rememberMeCheckbox', -2.4571938514709473],
        ['register-troubleLink', -10.756691932678223],
        ['register-submitLogin', -6.701282024383545],
        ['register-pageRegister', 9.354900360107422],
        ['register-formTextRegister', 1127921841982779e-38],
        ['register-formAttrsRegister', 5.118102550506592],
        ['register-headingsRegister', 8.963815689086914],
        ['register-layoutRegister', 0.7095034718513489],
        ['register-pwNewRegister', 10.083203315734863],
        ['register-pwConfirmRegister', 6.466226577758789],
        ['register-submitRegister', 18.364501953125],
        ['register-TOSRef', 4.770318984985352],
        ['register-pagePwReset', -0.02326344884932041],
        ['register-formTextPwReset', -6300258590248272e-31],
        ['register-formAttrsPwReset', -0.0012819769326597452],
        ['register-headingsPwReset', -6.281157493591309],
        ['register-layoutPwReset', -16.37497901916504],
        ['register-pageRecovery', -0.9036808013916016],
        ['register-formTextRecovery', 12435006931059683e-39],
        ['register-formAttrsRecovery', -7.79600715637207],
        ['register-headingsRecovery', -1.6168458461761475],
        ['register-layoutRecovery', -1.8616007566452026],
        ['register-identifierRecovery', -10.535555839538574],
        ['register-submitRecovery', -15.599897384643555],
        ['register-formTextMFA', -3.543393135070801],
        ['register-formAttrsMFA', -6.237585544586182],
        ['register-inputsMFA', -0.2944011688232422],
        ['register-inputsOTP', -1.9189268350601196],
        ['register-newsletterForm', -8.702685356140137],
        ['register-searchForm', -3.450845718383789],
        ['register-multiStepForm', 0.004343567881733179],
        ['register-multiAuthForm', 3.7920355796813965],
        ['register-visibleRatio,fieldsCount', -8.817288398742676],
        ['register-visibleRatio,identifierCount', 0.6849320530891418],
        ['register-visibleRatio,passwordCount', -3.8469769954681396],
        ['register-visibleRatio,hiddenIdentifierCount', -3.1051340103149414],
        ['register-visibleRatio,hiddenPasswordCount', -7.71868371963501],
        ['register-visibleRatio,multiStepForm', 6.371583461761475],
        ['register-identifierRatio,fieldsCount', 1.2079743146896362],
        ['register-identifierRatio,identifierCount', 8.910799026489258],
        ['register-identifierRatio,passwordCount', -7.478923320770264],
        ['register-identifierRatio,hiddenIdentifierCount', -9.050546646118164],
        ['register-identifierRatio,hiddenPasswordCount', -0.10340980440378189],
        ['register-identifierRatio,multiStepForm', 6.417591094970703],
        ['register-passwordRatio,fieldsCount', -2.0376927852630615],
        ['register-passwordRatio,identifierCount', -6.181938648223877],
        ['register-passwordRatio,passwordCount', -4.623002529144287],
        ['register-passwordRatio,hiddenIdentifierCount', 4.687475204467773],
        ['register-passwordRatio,hiddenPasswordCount', -7.259174823760986],
        ['register-passwordRatio,multiStepForm', 7.993484020233154],
        ['register-requiredRatio,fieldsCount', -8.149347305297852],
        ['register-requiredRatio,identifierCount', 5.000447750091553],
        ['register-requiredRatio,passwordCount', 1.6360973119735718],
        ['register-requiredRatio,hiddenIdentifierCount', -2.475947856903076],
        ['register-requiredRatio,hiddenPasswordCount', -61245300457812846e-22],
        ['register-requiredRatio,multiStepForm', 2.9785444736480713],
    ],
    bias: -1.95111083984375,
    cutoff: 0.48,
};

const register = {
    name: FormType.REGISTER,
    coeffs: FORM_COMBINED_FEATURES.map((key) => [
        `register-${key}`,
        results$6.coeffs.find(([feature]) => feature === `register-${key}`)?.[1] ?? 0,
    ]),
    bias: results$6.bias,
    cutoff: results$6.cutoff,
    getRules: () => [
        rule(type('form'), type(FormType.REGISTER), {}),
        ...FORM_COMBINED_FEATURES.map((key) =>
            rule(type(FormType.REGISTER), featureScore('form', key), {
                name: `register-${key}`,
            })
        ),
        ...outRuleWithCache('form-candidate', FormType.REGISTER),
    ],
};

const getEmailFieldFeatures = (fnode) => {
    const field = fnode.element;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText } = fieldFeatures;
    const typeEmail = fieldFeatures.type === 'email';
    const exactAttrEmail = field.matches(kEmailSelector);
    const attrEmail = any(matchEmailAttr)(fieldAttrs);
    const textEmail = matchEmail(fieldText);
    const labelEmail = matchEmail(labelText);
    const placeholderEmail = any(or(matchEmailValue, matchEmail))(field.placeholder.split(' '));
    return {
        autocompleteUsername: boolInt(fieldFeatures.autocomplete === 'username'),
        autocompleteNickname: boolInt(fieldFeatures.autocomplete === 'nickname'),
        autocompleteEmail: boolInt(fieldFeatures.autocomplete === 'email'),
        autocompleteOff: boolInt(fieldFeatures.autocomplete === 'off'),
        typeEmail: boolInt(typeEmail),
        exactAttrEmail: boolInt(exactAttrEmail),
        attrEmail: boolInt(attrEmail),
        textEmail: boolInt(textEmail),
        labelEmail: boolInt(labelEmail),
        placeholderEmail: boolInt(placeholderEmail),
        searchField: boolInt(fieldFeatures.searchField),
    };
};

const EMAIL_FEATURES = [
    'autocompleteUsername',
    'autocompleteNickname',
    'autocompleteEmail',
    'typeEmail',
    'exactAttrEmail',
    'attrEmail',
    'textEmail',
    'labelEmail',
    'placeholderEmail',
    'searchField',
];

const results$5 = {
    coeffs: [
        ['email-isCC', -1.1584984064102173],
        ['email-isIdentity', -9.321990013122559],
        ['email-autocompleteUsername', 0.9154527187347412],
        ['email-autocompleteNickname', 7260546398465736e-39],
        ['email-autocompleteEmail', 0.6279792189598083],
        ['email-typeEmail', 11.18169116973877],
        ['email-exactAttrEmail', 10.24897289276123],
        ['email-attrEmail', 1.6084450483322144],
        ['email-textEmail', 11.330326080322266],
        ['email-labelEmail', 13.733778953552246],
        ['email-placeholderEmail', 3.3316915035247803],
        ['email-searchField', -1.610798716545105],
    ],
    bias: -7.584630012512207,
    cutoff: 0.5,
};

const scores$5 = getFieldScoreRules('email-field', FieldType.EMAIL, EMAIL_FEATURES);

const email = {
    name: FieldType.EMAIL,
    coeffs: getFeatureCoeffs(getFeaturesFromRules(scores$5), results$5),
    bias: results$5.bias,
    cutoff: results$5.cutoff,
    getRules: () => [
        rule(type('email-field'), type(FieldType.EMAIL), {}),
        ...scores$5,
        ...outRuleWithCache('field-candidate', FieldType.EMAIL),
    ],
};

const identity = [
    rule(type('field').when(isIdentity), type('identity-field'), {}),
    rule(type('identity-field'), type(FieldType.IDENTITY), {}),
    ...outRuleWithCache('field-candidate', FieldType.IDENTITY, () => () => true),
];

const getOTPFieldFeatures = (fnode) => {
    const field = fnode.element;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, prevField, nextField, type, minLength, maxLength } = fieldFeatures;
    const formFeatures = fieldFeatures.formFeatures;
    const formMFA = Boolean(formFeatures?.formMFA);
    const formOTPOutlier = Boolean(formFeatures?.formOTPOutlier);
    const linkOutlier = Boolean(formFeatures?.linkOTPOutlier);
    const visibleInputsCount = formFeatures?.visibleInputsCount;
    const patternOTP = OTP_PATTERNS.some(
        ([maxLength, pattern]) => field.pattern.includes(pattern) && maxLength === field.maxLength
    );
    const exactNames = ['code', 'token', 'otp', 'otc', 'totp'];
    const nameMatch = exactNames.some((match) => field.name === match);
    const idMatch = exactNames.some((match) => field.id === match);
    const { area, top, bottom, width } = getNodeRect(field);
    const maybeGroup = width < 100;
    const prevRect = prevField ? getNodeRect(prevField) : null;
    const nextRect = nextField ? getNodeRect(nextField) : null;
    const prevCheck = maybeGroup && prevField && prevField?.getAttribute('type') === type;
    const nextCheck = maybeGroup && nextField && nextField?.getAttribute('type') === type;
    const prevAligned = prevCheck ? top === prevRect?.top && bottom === prevRect?.bottom : false;
    const prevArea = prevCheck ? area === prevRect?.area : false;
    const nextAligned = nextCheck ? top === nextRect?.top && bottom === nextRect?.bottom : false;
    const nextArea = nextCheck ? area === nextRect?.area : false;
    const attrOTP = any(matchOtpAttr)(fieldAttrs);
    const attrMFA = any(matchMfaAttr)(fieldAttrs);
    const attrOutlier = any(matchOtpOutlier)(fieldAttrs);
    const textOTP = matchOtpAttr(fieldText);
    const textMFA = matchMfa(fieldText);
    const labelOTP = matchOtpAttr(labelText);
    const labelMFA = matchMfa(labelText);
    const labelOutlier = matchOtpOutlier(labelText);
    const formText = fieldFeatures?.formFnode?.element?.innerText ?? '';
    const parents = [getNthParent(field)(1), getNthParent(field)(2)];
    const wrapperAttrs = parents.flatMap(getBaseAttributes);
    const wrapperOTP = any(matchOtpAttr)(wrapperAttrs);
    const wrapperOutlier = any(matchOtpOutlier)(wrapperAttrs);
    const invalidInputCount = !(visibleInputsCount === 1 || visibleInputsCount === 6);
    const maxLengthExpected = maxLength === 1 || maxLength === 6;
    const maxLengthInvalid = maxLength > 10;
    const siblingOfInterest = prevAligned || nextAligned;
    const otpSmells = wrapperOTP || attrOTP || textOTP || labelOTP;
    const emailOutlierCount = otpSmells ? (formText.match(/@/g)?.length ?? 0) : 0;
    return {
        formMFA: boolInt(fieldFeatures.isFormNoop && formMFA),
        formOutlier: boolInt(formOTPOutlier),
        fieldOutlier: boolInt(wrapperOutlier || attrOutlier || labelOutlier),
        linkOutlier: boolInt(linkOutlier),
        emailOutlierCount: boolInt(emailOutlierCount > 1),
        inputCountOutlier: boolInt(invalidInputCount),
        nameMatch: boolInt(nameMatch),
        idMatch: boolInt(idMatch),
        numericMode: boolInt(field.inputMode === 'numeric'),
        patternOTP: boolInt(patternOTP),
        maxLengthExpected: boolInt(maxLengthExpected),
        maxLengthInvalid: boolInt(maxLengthInvalid),
        maxLength1: boolInt(maxLength === 1),
        maxLength5: boolInt(maxLength === 5),
        minLength6: boolInt(minLength === 6),
        maxLength6: boolInt(maxLength === 6),
        autocompleteOTC: boolInt(fieldFeatures.autocomplete === 'one-time-code'),
        siblingOfInterest: boolInt(siblingOfInterest),
        prevAligned: boolInt(prevAligned),
        prevArea: boolInt(prevArea),
        nextAligned: boolInt(nextAligned),
        nextArea: boolInt(nextArea),
        attrOTP: boolInt(attrOTP),
        textOTP: boolInt(textOTP),
        wrapperOTP: boolInt(wrapperOTP),
        labelOTP: boolInt(labelOTP),
        attrMFA: boolInt(attrMFA),
        textMFA: boolInt(textMFA),
        labelMFA: boolInt(labelMFA),
    };
};

const OTP_FEATURES = [
    'formMFA',
    'formOutlier',
    'fieldOutlier',
    'linkOutlier',
    'emailOutlierCount',
    'inputCountOutlier',
    'nameMatch',
    'idMatch',
    'numericMode',
    'patternOTP',
    'maxLengthExpected',
    'maxLengthInvalid',
    'maxLength1',
    'maxLength5',
    'minLength6',
    'maxLength6',
    'autocompleteOTC',
    'prevAligned',
    'prevArea',
    'nextAligned',
    'nextArea',
    'attrMFA',
    'attrOTP',
    'textMFA',
    'textOTP',
    'labelMFA',
    'labelOTP',
    'wrapperOTP',
    ...combineFeatures(
        ['autocompleteOTC', 'siblingOfInterest', 'formMFA'],
        ['inputCountOutlier', 'maxLengthInvalid', 'attrOTP']
    ),
];

const results$4 = {
    coeffs: [
        ['otp-isCC', -7.4569315910339355],
        ['otp-isIdentity', -3.6619598865509033],
        ['otp-formMFA', 5.459969997406006],
        ['otp-formOutlier', -0.3674812316894531],
        ['otp-fieldOutlier', -11.14572811126709],
        ['otp-linkOutlier', -6.568876266479492],
        ['otp-emailOutlierCount', -5.850094318389893],
        ['otp-inputCountOutlier', -1.7196667194366455],
        ['otp-nameMatch', 5.165681838989258],
        ['otp-idMatch', 2.657701253890991],
        ['otp-numericMode', 3.8260021209716797],
        ['otp-patternOTP', 2.228879928588867],
        ['otp-maxLengthExpected', 2.360780715942383],
        ['otp-maxLengthInvalid', 0.5671682357788086],
        ['otp-maxLength1', 3.8324947357177734],
        ['otp-maxLength5', -1.5464770793914795],
        ['otp-minLength6', 5.636905670166016],
        ['otp-maxLength6', -1.4564234018325806],
        ['otp-autocompleteOTC', 4.642559051513672],
        ['otp-prevAligned', 2.2415823936462402],
        ['otp-prevArea', 1.0572495460510254],
        ['otp-nextAligned', 1.9892499446868896],
        ['otp-nextArea', 1.1664859056472778],
        ['otp-attrMFA', 15.991311073303223],
        ['otp-attrOTP', 11.044093132019043],
        ['otp-textMFA', 1.6663175821304321],
        ['otp-textOTP', -1.1763911247253418],
        ['otp-labelMFA', 5.6497111320495605],
        ['otp-labelOTP', 1.1642405986785889],
        ['otp-wrapperOTP', -5.602097511291504],
        ['otp-autocompleteOTC,inputCountOutlier', -0.5445464253425598],
        ['otp-autocompleteOTC,maxLengthInvalid', -8.103317260742188],
        ['otp-autocompleteOTC,attrOTP', 5449119433033322e-37],
        ['otp-siblingOfInterest,inputCountOutlier', -0.02591477520763874],
        ['otp-siblingOfInterest,maxLengthInvalid', -0.342193067073822],
        ['otp-siblingOfInterest,attrOTP', 4.748400783682882e-8],
        ['otp-formMFA,inputCountOutlier', -3.6052842140197754],
        ['otp-formMFA,maxLengthInvalid', -6.949362754821777],
        ['otp-formMFA,attrOTP', 1.4040424823760986],
    ],
    bias: -7.312558174133301,
    cutoff: 0.51,
};

const scores$4 = getFieldScoreRules('otp-field', FieldType.OTP, OTP_FEATURES);

const otp = {
    name: FieldType.OTP,
    coeffs: getFeatureCoeffs(getFeaturesFromRules(scores$4), results$4),
    bias: results$4.bias,
    cutoff: results$4.cutoff,
    getRules: () => [
        rule(type('otp-field'), type(FieldType.OTP), {}),
        ...getFieldScoreRules('otp-field', FieldType.OTP, OTP_FEATURES),
        ...outRuleWithCache('field-candidate', FieldType.OTP),
    ],
};

const isAutocompleteCurrentPassword = (value) => value === 'current-password' || value === 'password';

const isAutocompleteNewPassword = (value) => value === 'new-password';

const getPasswordFieldFeatures = (fnode) => {
    const fieldFeatures = fnode.noteFor('field');
    const { autocomplete, fieldAttrs, fieldText, labelText, prevField, nextField } = fieldFeatures;
    const attrCreate = any(matchPasswordCreateAttr)(fieldAttrs);
    const attrCurrent = any(matchPasswordCurrentAttr)(fieldAttrs);
    const attrConfirm = any(matchPasswordConfirmAttr)(fieldAttrs);
    const attrReset = any(matchPasswordResetAttr)(fieldAttrs);
    const textCreate = matchPasswordCreate(fieldText);
    const textCurrent = matchPasswordCurrent(fieldText);
    const textConfirm = matchPasswordConfirm(fieldText);
    const textReset = matchPasswordReset(fieldText);
    const labelCreate = matchPasswordCreate(labelText);
    const labelCurrent = matchPasswordCurrent(labelText);
    const labelConfirm = matchPasswordConfirm(labelText);
    const labelReset = matchPasswordReset(labelText);
    const passwordOutlier = any(matchPasswordOutlier)(fieldAttrs.concat(labelText, fieldText));
    const prevPwField = prevField && prevField.getAttribute('type') === 'password' ? prevField : null;
    const nextPwField = nextField && nextField.getAttribute('type') === 'password' ? nextField : null;
    const prevPwHaystack = prevPwField ? getAllFieldHaystacks(prevPwField) : [];
    const nextPwHaystack = nextPwField ? getAllFieldHaystacks(nextPwField) : [];
    const prevAutocomplete = prevPwField?.getAttribute('autocomplete');
    const prevAutocompleteCurrent = isAutocompleteCurrentPassword(prevAutocomplete);
    const prevPwCurrent = prevAutocompleteCurrent || any(matchPasswordCurrent)(prevPwHaystack);
    const prevAutocompleteNew = isAutocompleteNewPassword(prevAutocomplete);
    const prevPwNew = prevAutocompleteNew || any(matchPasswordCreate)(prevPwHaystack);
    const prevPwConfirm = any(matchPasswordConfirm)(prevPwHaystack);
    const nextAutocomplete = nextPwField?.getAttribute('autocomplete');
    const nextAutocompleteCurrent = isAutocompleteCurrentPassword(nextAutocomplete);
    const nextPwCurrent = nextAutocompleteCurrent || any(matchPasswordCurrent)(nextPwHaystack);
    const nextAutocompleteNew = isAutocompleteNewPassword(nextAutocomplete);
    const nextPwNew = nextAutocompleteNew || any(matchPasswordCreate)(nextPwHaystack);
    const nextPwConfirm = any(matchPasswordConfirm)(nextPwHaystack);
    return {
        loginScore: boolInt(fieldFeatures.isFormLogin),
        registerScore: boolInt(fieldFeatures.isFormRegister),
        pwChangeScore: boolInt(fieldFeatures.isFormPWChange),
        exotic: boolInt(fieldFeatures.isFormNoop),
        autocompleteNew: boolInt(isAutocompleteNewPassword(autocomplete)),
        autocompleteCurrent: boolInt(isAutocompleteCurrentPassword(autocomplete)),
        autocompleteOff: boolInt(fieldFeatures.autocomplete === 'off'),
        isOnlyPassword: fieldFeatures.formFeatures?.onePassword ?? 0,
        prevPwField: boolInt(prevPwField !== null),
        nextPwField: boolInt(nextPwField !== null),
        attrCreate: boolInt(attrCreate),
        attrCurrent: boolInt(attrCurrent),
        attrConfirm: boolInt(attrConfirm),
        attrReset: boolInt(attrReset),
        textCreate: boolInt(textCreate),
        textCurrent: boolInt(textCurrent),
        textConfirm: boolInt(textConfirm),
        textReset: boolInt(textReset),
        labelCreate: boolInt(labelCreate),
        labelCurrent: boolInt(labelCurrent),
        labelConfirm: boolInt(labelConfirm),
        labelReset: boolInt(labelReset),
        passwordOutlier: boolInt(passwordOutlier),
        prevPwNew: boolInt(prevPwNew),
        prevPwCurrent: boolInt(prevPwCurrent),
        prevPwConfirm: boolInt(prevPwConfirm),
        nextPwNew: boolInt(nextPwNew),
        nextPwCurrent: boolInt(nextPwCurrent),
        nextPwConfirm: boolInt(nextPwConfirm),
    };
};

const PW_FEATURES = [
    'loginScore',
    'registerScore',
    'pwChangeScore',
    'exotic',
    'autocompleteNew',
    'autocompleteCurrent',
    'autocompleteOff',
    'isOnlyPassword',
    'prevPwField',
    'nextPwField',
    'attrCreate',
    'attrCurrent',
    'attrConfirm',
    'attrReset',
    'textCreate',
    'textCurrent',
    'textConfirm',
    'textReset',
    'labelCreate',
    'labelCurrent',
    'labelConfirm',
    'labelReset',
    'prevPwNew',
    'prevPwCurrent',
    'prevPwConfirm',
    'nextPwNew',
    'nextPwCurrent',
    'nextPwConfirm',
    'passwordOutlier',
    ...combineFeatures(['prevPwCurrent'], ['nextPwNew']),
];

const results$3 = {
    coeffs: [
        ['password-isCC', -2.096844434738159],
        ['password-isIdentity', 10396838054292828e-39],
        ['password-loginScore', 10.63877010345459],
        ['password-registerScore', -5.467442035675049],
        ['password-pwChangeScore', 0.852442741394043],
        ['password-exotic', -2.096843957901001],
        ['password-autocompleteNew', -2.1027169227600098],
        ['password-autocompleteCurrent', 1.124208688735962],
        ['password-autocompleteOff', -0.35171422362327576],
        ['password-isOnlyPassword', 0.9232738018035889],
        ['password-prevPwField', -2.2691550254821777],
        ['password-nextPwField', -2.9572763442993164],
        ['password-attrCreate', -1.7777934074401855],
        ['password-attrCurrent', 1.257458209991455],
        ['password-attrConfirm', -0.6932287812232971],
        ['password-attrReset', -4552505239977786e-39],
        ['password-textCreate', -1.457291603088379],
        ['password-textCurrent', 1.3993545770645142],
        ['password-textConfirm', -0.27590957283973694],
        ['password-textReset', 13411362718511814e-39],
        ['password-labelCreate', -0.23382247984409332],
        ['password-labelCurrent', 3.559849500656128],
        ['password-labelConfirm', -0.3017123341560364],
        ['password-labelReset', -18359147225434124e-39],
        ['password-prevPwNew', -1.6614785194396973],
        ['password-prevPwCurrent', -1.354343295097351],
        ['password-prevPwConfirm', -8618145250775794e-39],
        ['password-nextPwNew', 5.944712162017822],
        ['password-nextPwCurrent', -0.002024318790063262],
        ['password-nextPwConfirm', -2.3229761123657227],
        ['password-passwordOutlier', -8.387641906738281],
        ['password-prevPwCurrent,nextPwNew', -1.2475861310958862],
    ],
    bias: -2.6557960510253906,
    cutoff: 0.5,
};

const scores$3 = getFieldScoreRules('password-field', FieldType.PASSWORD_CURRENT, PW_FEATURES);

const password = {
    name: FieldType.PASSWORD_CURRENT,
    coeffs: getFeatureCoeffs(getFeaturesFromRules(scores$3), results$3),
    bias: results$3.bias,
    cutoff: results$3.cutoff,
    getRules: () => [
        rule(type('password-field'), type(FieldType.PASSWORD_CURRENT), {}),
        ...scores$3,
        ...outRuleWithCache('field-candidate', FieldType.PASSWORD_CURRENT),
    ],
};

const results$2 = {
    coeffs: [
        ['new-password-isCC', -8.192595481872559],
        ['new-password-isIdentity', 10481427609159677e-39],
        ['new-password-loginScore', -10.807122230529785],
        ['new-password-registerScore', 5.5497541427612305],
        ['new-password-pwChangeScore', 1.4725885391235352],
        ['new-password-exotic', 0.8303464651107788],
        ['new-password-autocompleteNew', -0.4297574460506439],
        ['new-password-autocompleteCurrent', -0.8837066888809204],
        ['new-password-autocompleteOff', 1.1202404499053955],
        ['new-password-isOnlyPassword', 0.08950494229793549],
        ['new-password-prevPwField', 2.5294482707977295],
        ['new-password-nextPwField', 0.02855537459254265],
        ['new-password-attrCreate', 1.9702930450439453],
        ['new-password-attrCurrent', -1.4788950681686401],
        ['new-password-attrConfirm', 0.6527324318885803],
        ['new-password-attrReset', -3637349281552701e-39],
        ['new-password-textCreate', 1.6799567937850952],
        ['new-password-textCurrent', -1.6693533658981323],
        ['new-password-textConfirm', 0.4113938808441162],
        ['new-password-textReset', -17494415256070766e-39],
        ['new-password-labelCreate', 0.45138630270957947],
        ['new-password-labelCurrent', -3.906604290008545],
        ['new-password-labelConfirm', 0.47362062335014343],
        ['new-password-labelReset', 1972739175566014e-39],
        ['new-password-prevPwNew', 1.2320305109024048],
        ['new-password-prevPwCurrent', 1.3672574758529663],
        ['new-password-prevPwConfirm', 7661310615284262e-39],
        ['new-password-nextPwNew', -3.622988700866699],
        ['new-password-nextPwCurrent', 0.018896684050559998],
        ['new-password-nextPwConfirm', 3.9881210327148438],
        ['new-password-passwordOutlier', -11.853455543518066],
        ['new-password-prevPwCurrent,nextPwNew', 1.3521677255630493],
    ],
    bias: 1.245384931564331,
    cutoff: 0.5,
};

const scores$2 = getFieldScoreRules('password-field', FieldType.PASSWORD_NEW, PW_FEATURES);

const newPassword = {
    name: FieldType.PASSWORD_NEW,
    coeffs: getFeatureCoeffs(getFeaturesFromRules(scores$2), results$2),
    bias: results$2.bias,
    cutoff: results$2.cutoff,
    getRules: () => [
        rule(type('password-field'), type(FieldType.PASSWORD_NEW), {}),
        ...scores$2,
        ...outRuleWithCache('field-candidate', FieldType.PASSWORD_NEW),
    ],
};

const getUsernameFieldFeatures = (fnode) => {
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, prevField } = fieldFeatures;
    const attrUsername = any(matchUsernameAttr)(fieldAttrs);
    const textUsername = matchUsername(fieldText);
    const labelUsername = matchUsername(labelText);
    const outlierUsername = any(matchUsernameOutlier)(fieldAttrs.concat(fieldText, labelText));
    const haystack = fieldAttrs.concat(fieldText).concat(labelText);
    const outlier = outlierUsername || any(matchEmailAttr)(haystack);
    const loginForm = fieldFeatures.isFormLogin;
    const isFirstField = prevField === null;
    const loginUsername = loginForm && isFirstField && !outlier;
    return {
        autocompleteUsername: boolInt(fieldFeatures.autocomplete === 'username'),
        autocompleteNickname: boolInt(fieldFeatures.autocomplete === 'nickname'),
        autocompleteEmail: boolInt(fieldFeatures.autocomplete === 'email'),
        autocompleteOff: boolInt(fieldFeatures.autocomplete === 'off'),
        attrUsername: boolInt(attrUsername),
        textUsername: boolInt(textUsername),
        labelUsername: boolInt(labelUsername),
        outlierUsername: boolInt(outlier),
        loginUsername: boolInt(loginUsername),
        searchField: boolInt(fieldFeatures.searchField),
    };
};

const USERNAME_FEATURES = [
    'autocompleteUsername',
    'autocompleteNickname',
    'autocompleteEmail',
    'autocompleteOff',
    'attrUsername',
    'textUsername',
    'labelUsername',
    'outlierUsername',
    'loginUsername',
    'searchField',
];

const results$1 = {
    coeffs: [
        ['username-isCC', -1.4179900884628296],
        ['username-isIdentity', -1.8782519102096558],
        ['username-autocompleteUsername', 1.9585274457931519],
        ['username-autocompleteNickname', 1450062816732823e-38],
        ['username-autocompleteEmail', -0.4206032454967499],
        ['username-autocompleteOff', -0.6521573662757874],
        ['username-attrUsername', 13.157388687133789],
        ['username-textUsername', 11.052273750305176],
        ['username-labelUsername', 13.166759490966797],
        ['username-outlierUsername', 0.5020187497138977],
        ['username-loginUsername', 13.553890228271484],
        ['username-searchField', -8.30817699432373],
    ],
    bias: -7.5672125816345215,
    cutoff: 0.5,
};

const scores$1 = getFieldScoreRules('username-field', FieldType.USERNAME, USERNAME_FEATURES);

const username = {
    name: FieldType.USERNAME,
    coeffs: getFeatureCoeffs(getFeaturesFromRules(scores$1), results$1),
    bias: results$1.bias,
    cutoff: results$1.cutoff,
    getRules: () => [
        rule(type('username-field'), type(FieldType.USERNAME), {}),
        ...scores$1,
        ...outRuleWithCache('field-candidate', FieldType.USERNAME),
    ],
};

const getHiddenUserFieldFeatures = (fnode) => {
    const field = fnode.element;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, autocomplete } = fieldFeatures;
    const attrUsername = any(matchUsernameAttr)(fieldAttrs);
    const attrEmail = any(matchEmailAttr)(fieldAttrs);
    const usernameAttr = field.matches('[name="username"],[id="username"]');
    const autocompleteUsername = autocomplete === 'username';
    const visibleReadonly =
        field.readOnly &&
        isVisible(field, {
            opacity: true,
        }) &&
        field.type !== 'hidden';
    const valueEmail = matchEmailValue(fieldFeatures.value);
    const valueTel = matchTelValue(fieldFeatures.value);
    const valueUsername = matchUsernameValue(fieldFeatures.value);
    return {
        exotic: boolInt(fieldFeatures.isFormNoop),
        attrUsername: boolInt(attrUsername),
        attrEmail: boolInt(attrEmail),
        usernameAttr: boolInt(usernameAttr),
        autocompleteUsername: boolInt(autocompleteUsername),
        visibleReadonly: boolInt(visibleReadonly),
        hiddenEmailValue: boolInt(valueEmail),
        hiddenTelValue: boolInt(valueTel),
        hiddenUsernameValue: boolInt(valueUsername),
    };
};

const USERNAME_HIDDEN_FEATURES = [
    'exotic',
    'attrUsername',
    'attrEmail',
    'usernameAttr',
    'autocompleteUsername',
    'visibleReadonly',
    'hiddenEmailValue',
    'hiddenTelValue',
    'hiddenUsernameValue',
];

const results = {
    coeffs: [
        ['username-hidden-isCC', -192946542174921e-37],
        ['username-hidden-isIdentity', -2015981374946609e-38],
        ['username-hidden-exotic', -0.6459619402885437],
        ['username-hidden-attrUsername', 9.254805564880371],
        ['username-hidden-attrEmail', 7.95482873916626],
        ['username-hidden-usernameAttr', 9.126387596130371],
        ['username-hidden-autocompleteUsername', 1.2249045372009277],
        ['username-hidden-visibleReadonly', 6.314321041107178],
        ['username-hidden-hiddenEmailValue', 10.476245880126953],
        ['username-hidden-hiddenTelValue', 0.14738231897354126],
        ['username-hidden-hiddenUsernameValue', -0.032398343086242676],
    ],
    bias: -13.501507759094238,
    cutoff: 0.51,
};

const scores = getFieldScoreRules('username-hidden-field', FieldType.USERNAME_HIDDEN, USERNAME_HIDDEN_FEATURES);

const usernameHidden = {
    name: FieldType.USERNAME_HIDDEN,
    coeffs: getFeatureCoeffs(getFeaturesFromRules(scores), results),
    bias: results.bias,
    cutoff: results.cutoff,
    getRules: () => [
        rule(type('username-hidden-field'), type(FieldType.USERNAME_HIDDEN), {}),
        ...scores,
        ...outRuleWithCache('field-candidate', FieldType.USERNAME_HIDDEN),
    ],
};

const getFieldFeature = (fnode) => {
    const field = fnode.element;
    const fieldHaystacks = getFieldHaystacks(field);
    const formFnode = getParentFormFnode(fnode);
    if (formFnode !== null && !formFnode.hasNoteFor('form')) formFnode.setNoteFor('form', getFormFeatures(formFnode));
    const formFeatures = formFnode?.noteFor('form');
    const form = getFormClassification(formFnode);
    const value = field.value;
    const type = field.getAttribute('type');
    const readonly = field.readOnly;
    const required = field.required;
    const minLength = safeInt(field.minLength, 0);
    const maxLength = safeInt(field.maxLength, 250);
    const pattern = field.pattern;
    const autocomplete = field.getAttribute('autocomplete');
    const disabled = field.disabled;
    const typeValid = type !== 'hidden';
    const tabIndex = field.tabIndex;
    const visible = typeValid
        ? isVisibleField(field) &&
          isVisible(field, {
              opacity: false,
          })
        : false;
    if (typeValid) (visible ? removeHiddenFlag : flagAsHidden)(field);
    const searchField = visible && any(matchSearchAction)(fieldHaystacks.fieldAttrs.concat(fieldHaystacks.fieldText));
    const isCC = matchCCInputField(field, {
        visible,
        type,
    });
    const isIdentity =
        !isCC &&
        matchIdentityField(field, {
            visible,
            form,
            searchField,
            type,
        });
    const prevField = typeValid ? (formFeatures?.formInputIterator.prev(field) ?? null) : null;
    const nextField = typeValid ? (formFeatures?.formInputIterator.next(field) ?? null) : null;
    return {
        formFnode,
        formFeatures,
        isFormLogin: form.login,
        isFormRegister: form.register,
        isFormPWChange: form.pwChange,
        isFormRecovery: form.recovery,
        isFormNoop: form.noop,
        isIdentity,
        isCC,
        value,
        visible,
        type,
        readonly,
        required,
        disabled,
        pattern,
        autocomplete,
        minLength,
        maxLength,
        tabIndex,
        prevField,
        nextField,
        searchField,
        ...fieldHaystacks,
    };
};

const cc = [
    rule(type('field').when(isCCInputField), type('cc-field'), {}),
    rule(type('field-candidate').when(isCCSelectField), type('cc-field'), {}),
    rule(type('cc-field'), type(FieldType.CREDIT_CARD), {}),
    ...outRuleWithCache('field-candidate', FieldType.CREDIT_CARD, () => () => true),
];

const TABLE_MAX_COLS = 3;

const TABLE_MAX_AREA = 15e4;

const PAGE_FORM_RATIO = 0.7;

const isTopFrame = () => {
    try {
        return window.self === window.top;
    } catch (e) {
        return false;
    }
};

const nodeOfInterest = (el) => isClassifiable(el) && el.querySelector('input') !== null;

const excludeForms = (doc = document) => {
    const bodyElCount = document.body.querySelectorAll('*').length;
    return doc.querySelectorAll('form').forEach((form) => {
        if (nodeOfInterest(form)) {
            const fieldCount = form.querySelectorAll(kFieldSelector).length;
            const inputCount = form.querySelectorAll(inputCandidateSelector).length;
            const iframeCount = form.querySelectorAll('iframe').length;
            const invalidFieldCount =
                inputCount + iframeCount === 0 || inputCount > MAX_INPUTS_PER_FORM || fieldCount > MAX_FIELDS_PER_FORM;
            const topFrame = isTopFrame();
            const formElCount = form.querySelectorAll('*').length;
            const pageFormMatch = topFrame && form.matches('body > form');
            const pageFormSignal = topFrame && invalidFieldCount;
            const pageForm = (pageFormMatch || pageFormSignal) && formElCount / bodyElCount >= PAGE_FORM_RATIO;
            const invalidSignal = invalidFieldCount || pageForm;
            if (invalidSignal && !pageForm) return flagSubtreeAsIgnored(form);
            if (invalidSignal && pageForm) return flagAsIgnored(form);
            if (form.matches('table form') && form.closest('table').querySelectorAll('form').length > 2)
                return flagAsIgnored(form);
        }
    });
};

const excludeClusterableNodes = (doc = document) => {
    doc.querySelectorAll('table').forEach((table) => {
        if (nodeOfInterest(table) && !table.querySelector('table') && table.closest('form') === null) {
            const nestedForms = table.querySelectorAll('form');
            if (nestedForms.length > 2) return flagSubtreeAsIgnored(table);
            if (!nestedForms.length) {
                if (table.querySelector('thead') !== null) return flagSubtreeAsIgnored(table);
                const cellCount = Math.max(...Array.from(table.rows).map((row) => row.cells.length));
                if (cellCount > TABLE_MAX_COLS || getNodeRect(table).area > TABLE_MAX_AREA)
                    return flagSubtreeAsIgnored(table);
            }
        }
    });
    doc.querySelectorAll(kEditorSelector).forEach(flagSubtreeAsIgnored);
};

const excludeFields = (doc = document) => {
    doc.querySelectorAll('input').forEach((input) => {
        if (!isClassifiable(input)) return;
        const invalidType = !VALID_INPUT_TYPES.includes(input.type);
        if (invalidType) return flagAsIgnored(input);
        if (input.type === 'hidden') {
            const value = input.value.trim();
            const invalidValueLength = !value.length || value.length > MAX_HIDDEN_FIELD_VALUE_LENGTH;
            if (
                invalidValueLength ||
                HIDDEN_FIELD_IGNORE_VALUES.includes(value) ||
                !input.matches(kHiddenUsernameSelector)
            )
                return flagAsIgnored(input);
        }
    });
};

const { clusters } = clusters$1;

const CLUSTER_MAX_X_DIST = 50;

const CLUSTER_MAX_Y_DIST = 275;

const CLUSTER_ALIGNMENT_TOLERANCE = 0.05;

const CLUSTER_MAX_ELEMENTS = 50;

const context = {
    cache: new WeakMap(),
};

const getElementData = (el) => {
    const data = context.cache.get(el) ?? {
        isField: el.matches(kFieldSelector) && el.matches(':not([type="submit"])'),
        rect: el.getBoundingClientRect(),
    };
    context.cache.set(el, data);
    return data;
};

const compare = (elA, elB) => {
    const a = getElementData(elA);
    const b = getElementData(elB);
    const maxDx = CLUSTER_MAX_X_DIST;
    const maxDy = CLUSTER_MAX_Y_DIST / (a.isField && b.isField ? 2 : 1);
    const { dx, dy } = getRectMinDistance(a.rect, b.rect);
    const leftRatio = Math.abs(a.rect.left / b.rect.left);
    const topRatio = Math.abs(a.rect.top / b.rect.top);
    const xAlign = leftRatio > 1 - CLUSTER_ALIGNMENT_TOLERANCE && leftRatio < 1 + CLUSTER_ALIGNMENT_TOLERANCE;
    const yAlign = topRatio > 1 - CLUSTER_ALIGNMENT_TOLERANCE && topRatio < 1 + CLUSTER_ALIGNMENT_TOLERANCE;
    if (xAlign && yAlign) return true;
    if (xAlign && dy < maxDy) return true;
    if (yAlign && dx < maxDx) return true;
    if (dx < maxDx && dy < maxDy) return true;
    return false;
};

const handleSingletonCluster = (cluster) => {
    const node = cluster[0];
    return walkUpWhile(
        node,
        5
    )((parent, candidate) => {
        if (parent.tagName === 'HTML') return false;
        if (candidate === node) return true;
        return candidate.querySelectorAll(buttonSelector).length === 0;
    });
};

const resolveFormClusters = (doc) => {
    const forms = selectFormCandidates(doc);
    const clusterable = (els) => els.filter((el) => !forms.some((ex) => ex.contains(el)) && isVisibleField(el));
    const fields = Array.from(doc.querySelectorAll(kFieldSelector));
    const fieldsOfInterest = clusterable(
        fields.filter((el) => isClassifiable(el) && el.getAttribute('type') !== 'hidden')
    );
    const inputs = fieldsOfInterest.filter((field) => field.matches(inputCandidateSelector));
    if (inputs.length === 0 || inputs.length > CLUSTER_MAX_ELEMENTS) return [];
    const domGroups = Array.from(doc.querySelectorAll(kDomGroupSelector)).filter((el) => el !== document.body);
    const positionedEls = findStackedParents(inputs, 20);
    const groups = pruneNested(
        domGroups.filter((el) => !positionedEls.some((stack) => el.contains(stack))).concat(positionedEls)
    );
    const buttons = clusterable(Array.from(document.querySelectorAll(kButtonSubmitSelector)).filter(isBtnCandidate));
    const iframes = clusterable(Array.from(doc.querySelectorAll('iframe')).filter(isIFrameField));
    const candidates = uniqueNodes(fieldsOfInterest, buttons, iframes);
    if (candidates.length > CLUSTER_MAX_ELEMENTS) return [];
    const groupByInput = new WeakMap(candidates.map((el) => [el, groups.find((group) => group.contains(el))]));
    const theClusters = clusters(candidates, 1, (a, b) => {
        if (a.parentElement === b.parentElement) return 0;
        const groupA = groupByInput.get(a);
        const groupB = groupByInput.get(b);
        if (groupA !== groupB) return Number.MAX_SAFE_INTEGER;
        if (groupA && groupA === groupB) return 0;
        return compare(a, b) ? 0 : Number.MAX_SAFE_INTEGER;
    });
    const ancestors = theClusters
        .map((cluster) => (cluster.length === 1 ? handleSingletonCluster(cluster) : cluster.reduce(getCommonAncestor)))
        .filter((ancestor) => {
            if (isTopFrame() && document.body === ancestor) return false;
            return ancestor.querySelectorAll(inputCandidateSelector).length > 0;
        });
    const result = pruneNested(ancestors);
    result.forEach(flagCluster);
    context.cache = new WeakMap();
    return result;
};

const prepass = (doc = document) => {
    excludeForms(doc);
    excludeClusterableNodes(doc);
    excludeFields(doc);
    resolveFormClusters(doc);
};

const shouldRunClassifier = () => {
    const formCandidates = getOverridableForms().concat(selectFormCandidates());
    const shouldRunForForms = formCandidates.reduce((runDetection, form) => {
        if (isProcessed(form)) {
            const unprocessedFields = selectInputCandidates(form).some(isProcessableField);
            if (unprocessedFields)
                removeClassifierFlags(form, {
                    preserveIgnored: false,
                });
            return runDetection || unprocessedFields;
        }
        if (isVisibleForm(form)) {
            removeHiddenFlag(form);
            return true;
        }
        return runDetection;
    }, false);
    if (shouldRunForForms) return true;
    const fieldCandidates = getOverridableFields().concat(selectInputCandidates());
    return fieldCandidates.some(isProcessableField);
};

const noop = [
    rule(type('form').when(isNoopForm), type(FormType.NOOP), {}),
    ...outRuleWithCache('form-candidate', FormType.NOOP, () => () => true),
];

const definitions = [
    login,
    register,
    passwordChange,
    recovery,
    username,
    usernameHidden,
    email,
    password,
    newPassword,
    otp,
];

const trainees = {
    forms: {
        login,
        register,
        passwordChange,
        recovery,
    },
    fields: {
        username,
        usernameHidden,
        email,
        password,
        newPassword,
        otp,
    },
};

const rulesetMaker = () => {
    const aggregation = definitions.reduce(
        (acc, curr) => ({
            rules: [...acc.rules, ...curr.getRules()],
            coeffs: [...acc.coeffs, ...curr.coeffs],
            biases: [...acc.biases, [curr.name, curr.bias]],
        }),
        {
            rules: [
                rule(dom(formCandidateSelector), type('form-candidate'), {}),
                rule(dom('input, select'), type('field-candidate'), {}),
                ...overrides,
                rule(type('form-candidate').when(withFnodeEl(isClassifiable)), type('form-element'), {}),
                rule(type('form-element').when(withFnodeEl(isVisibleForm)), type('form').note(getFormFeatures), {}),
                rule(type('form-element'), out('form').through(processFormEffect), {}),
                ...noop,
                rule(type('field-candidate').when(isClassifiableField), type('field').note(getFieldFeature), {}),
                ...identity,
                ...cc,
                rule(type('field').when(maybeUsername), type('username-field').note(getUsernameFieldFeatures), {}),
                rule(
                    type('field').when(maybeHiddenUsername),
                    type('username-hidden-field').note(getHiddenUserFieldFeatures),
                    {}
                ),
                rule(type('field').when(maybeEmail), type('email-field').note(getEmailFieldFeatures), {}),
                rule(type('field').when(maybePassword), type('password-field').note(getPasswordFieldFeatures), {}),
                rule(type('field').when(maybeOTP), type('otp-field').note(getOTPFieldFeatures), {}),
                rule(type('field'), out('field').through(processFieldEffect), {}),
            ],
            coeffs: [],
            biases: [],
        }
    );
    const rules = ruleset(aggregation.rules, aggregation.coeffs, aggregation.biases);
    return rules;
};

const clearDetectionCache = () => {
    clearVisibilityCache();
    clearOverrides();
};

export {
    CC_ATTRIBUTES,
    CC_INPUT_TYPES,
    EL_ATTRIBUTES,
    FIELD_ATTRIBUTES,
    FORM_ATTRIBUTES,
    FORM_CLUSTER_ATTR,
    OVERRIDE_FIELDS,
    OVERRIDE_FORMS,
    TEXT_ATTRIBUTES,
    addFieldOverride,
    addFormOverride,
    attrIgnored,
    buttonSelector,
    cacheContext,
    clearDetectionCache,
    clearOverrides,
    clearVisibilityCache,
    createInputIterator,
    fType,
    flagAsHidden,
    flagAsIgnored,
    flagAsProcessed,
    flagCluster,
    flagOverride,
    flagSubtreeAsIgnored,
    formCandidateSelector,
    formatExpirationDate,
    getAttributes,
    getBaseAttributes,
    getCCFieldType,
    getCCHaystack,
    getCachedCCSubtype,
    getCachedIdentitySubType,
    getCachedPredictionScore,
    getCachedSubType,
    getExpirationFormat,
    getFieldAttributes,
    getFormAttributes,
    getFormParent,
    getIdentityFieldType,
    getIdentityHaystack,
    getIgnoredParent,
    getInputExpirationMonthFormat,
    getInputExpirationYearFormat,
    getOverridableFields,
    getOverridableForms,
    getParentFormPrediction,
    getSelectExpirationMonthFormat,
    getSelectExpirationYearFormat,
    getTextAttributes,
    getTypeScore,
    getVisibilityCache,
    inputCandidateSelector,
    isBtnCandidate,
    isCCInputField,
    isCCSelectField,
    isClassifiable,
    isClassifiableField,
    isCluster,
    isCustomElementWithShadowRoot,
    isEmailCandidate,
    isHidden,
    isIFrameField,
    isIdentity,
    isIgnored,
    isOAuthCandidate,
    isPredictedField,
    isPredictedForm,
    isPredictedType,
    isPrediction,
    isProcessableField,
    isProcessed,
    isShadowElement,
    isShadowRoot,
    isUsernameCandidate,
    isVisible,
    isVisibleEl,
    isVisibleField,
    isVisibleForm,
    kAnchorLinkSelector,
    kButtonSubmitSelector,
    kCaptchaSelector,
    kDomGroupSelector,
    kEditorElements,
    kEditorPatterns,
    kEditorSelector,
    kEmailSelector,
    kFieldLabelSelector,
    kFieldSelector,
    kHeadingSelector,
    kHiddenUsernameSelector,
    kLayoutSelector,
    kPasswordSelector,
    kSocialSelector,
    kUsernameSelector,
    matchCCInputField,
    matchIdentityField,
    matchPredictedType,
    maybeEmail,
    maybeHiddenUsername,
    maybeOTP,
    maybePassword,
    maybeUsername,
    otpSelector,
    overrides,
    prepass,
    removeClassifierFlags,
    removeHiddenFlag,
    removeIgnoredFlag,
    removePredictionFlag,
    removeProcessedFlag,
    rulesetMaker,
    selectFormCandidates,
    selectInputCandidates,
    setCachedPredictionScore,
    setCachedSubType,
    shadowPiercingAncestors,
    shadowPiercingContains,
    shallowShadowQuerySelector,
    shouldRunClassifier,
    splitFieldsByVisibility,
    trainees,
};
