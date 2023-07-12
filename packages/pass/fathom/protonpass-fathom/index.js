import { clusters as clusters$1, dom, domQuery, out, rule, ruleset, score, type, utils } from './fathom.js';
import * as fathomWeb from './fathom.js';

export { fathomWeb as fathom };

const MAX_FORM_FIELD_WALK_UP = 3;

const MAX_FORM_HEADING_WALK_UP = 3;

const MAX_HEADING_HORIZONTAL_DIST = 75;

const MAX_HEADING_VERTICAL_DIST = 150;

const MIN_AREA_SUBMIT_BTN = 3500;

const MIN_FIELD_HEIGHT = 15;

const MIN_FIELD_WIDTH = 30;

const MAX_INPUTS_PER_FORM = 40;

const MAX_FIELDS_PER_FORM = 60;

const MAX_HIDDEN_FIELD_VALUE_LENGTH = 320;

const HIDDEN_FIELD_IGNORE_VALUES = ['0', '1', 'true', 'false'];

const OTP_PATTERNS = ['d*', 'd{6}', '[0-9]*', '[0-9]{6}', '([0-9]{6})|([0-9a-fA-F]{5}-?[0-9a-fA-F]{5})'];

const sanitizeString = (str) =>
    str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\d\[\]]/g, '');

const TEXT_ATTRIBUTES = [
    'title',
    'aria-label',
    'aria-labelledby',
    'aria-describedby',
    'placeholder',
    'autocomplete',
    'legend',
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
        .map(sanitizeString);

const getBaseAttributes = getAttributes(EL_ATTRIBUTES);

const getTextAttributes = getAttributes(TEXT_ATTRIBUTES);

const getFieldAttributes = getAttributes(FIELD_ATTRIBUTES);

const getFormAttributes = getAttributes(FORM_ATTRIBUTES);

const DETECTED_FIELD_TYPE_ATTR = 'data-protonpass-field-type';

const DETECTED_FORM_TYPE_ATTR = 'data-protonpass-form-type';

const DETECTED_CLUSTER_ATTR = 'data-protonpass-cluster';

const IGNORE_ELEMENT_ATTR = 'data-protonpass-ignore';

const PROCESSED_FORM_ATTR = 'data-protonpass-form';

const PROCESSED_FIELD_ATTR = 'data-protonpass-field';

const kUsernameSelector = [
    'input[type="login"]',
    'input[type="username"]',
    'input[type="search"][name="loginName"]',
    'input[type="password"][name="userID"]',
    'input[type="password"][name="USERNAME"]',
    'input[name="account"]',
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

const kEmailSelector = 'input[name="email"], input[id="email"]';

const kPasswordSelector = ['input[type="text"][id="password"]'];

const headingSelector = [
    ...[1, 2, 3, 4, 5].flatMap((level) => [`h${level}, [aria-level="${level}"]`]),
    '[role="heading"]',
    '[class*="title"]',
    '[class*="header"]',
    '[name="title"]',
].join(',');

const fieldSelector = 'input, select, textarea';

const inputSelector =
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="checkbox"])';

const buttonSubmitSelector = [
    'button[type="submit"]',
    'button[type="button"]',
    'button[name="submit"]',
    'button[id*="password" i]',
    'a[role="submit"]',
    'div[role="button"]',
    'div[role="submit"]',
].join(',');

const buttonSelector = `button:not([type]), a[role="button"], ${buttonSubmitSelector}`;

const anchorLinkSelector = `a, span[role="button"]`;

const captchaSelector = `[class*="captcha"], [id*="captcha"], [name*="captcha"]`;

const socialSelector = `[class*=social],[aria-label*=with]`;

const domGroupSelector = `[role="dialog"], [role="tabpanel"], [role="group"], [role="form"], [id*="modal"], [class*="modal"], header, section, nav, footer, aside`;

const layoutSelector = `div, section, aside, main, nav`;

const passwordSelector = `[type="password"], ${kPasswordSelector}`;

const hiddenUsernameSelector = '[type="email"], [type="text"], [type="hidden"]';

const otpSelector = '[type="tel"], [type="number"], [type="text"], input:not([type])';

const unprocessedFormFilter = `:not([${PROCESSED_FORM_ATTR}]), [${DETECTED_CLUSTER_ATTR}]:not([${PROCESSED_FORM_ATTR}])`;

const unprocessedFieldFilter = `:not([${PROCESSED_FIELD_ATTR}])`;

const danglingFieldFilter = `${unprocessedFieldFilter}:not([${PROCESSED_FORM_ATTR}] input)`;

const detectedSelector = `[${DETECTED_FORM_TYPE_ATTR}], [${DETECTED_CLUSTER_ATTR}]`;

const detectedFormSelector = `[${DETECTED_FORM_TYPE_ATTR}]`;

const preDetectedClusterSelector = `[${DETECTED_CLUSTER_ATTR}]:not([${DETECTED_FORM_TYPE_ATTR}])`;

const ignoredSelector = `[${IGNORE_ELEMENT_ATTR}]`;

const withFlagEffect =
    (attr) =>
    (predicate) =>
    (el, ...args) => {
        const check = predicate(el, ...args);
        if (check) el.setAttribute(attr, '');
        return check;
    };

const throughEffect = (effect) => (fnode) => {
    effect(fnode);
    return fnode;
};

const withIgnoreFlag = withFlagEffect(IGNORE_ELEMENT_ATTR);

const setIgnoreFlag = (el) => el.setAttribute(IGNORE_ELEMENT_ATTR, '');

const getIgnoredParent = (el) => (el === null || el === void 0 ? void 0 : el.closest(ignoredSelector));

const setClusterFlag = (el) => el.setAttribute(DETECTED_CLUSTER_ATTR, '');

const setFormProcessed = (el) => el.setAttribute(PROCESSED_FORM_ATTR, '');

const setFieldProcessed = (el) => el.setAttribute(PROCESSED_FIELD_ATTR, '');

const setFieldProcessable = (field) => {
    field.removeAttribute(PROCESSED_FIELD_ATTR);
    field.removeAttribute(DETECTED_FIELD_TYPE_ATTR);
};

const setFormProcessable = (form) => {
    form.removeAttribute(PROCESSED_FORM_ATTR);
    form.removeAttribute(DETECTED_FORM_TYPE_ATTR);
    form.removeAttribute(IGNORE_ELEMENT_ATTR);
    form.querySelectorAll('input').forEach(setFieldProcessable);
};

const isFormProcessed = (form) => form.getAttribute(PROCESSED_FORM_ATTR) !== null;

const isFieldProcessed = (field) => field.getAttribute(PROCESSED_FIELD_ATTR) !== null;

const processFormEffect = throughEffect((fnode) => setFormProcessed(fnode.element));

const processFieldEffect = throughEffect((fnode) => {
    const { visible, type } = fnode.noteFor('field');
    if (visible || type === 'hidden' || fnode.element.matches(kHiddenUsernameSelector))
        setFieldProcessed(fnode.element);
});

const updateAttribute = (attr) => (element, value) => {
    const current = element.getAttribute(attr);
    if (!current) element.setAttribute(attr, value);
    else {
        const update = Array.from(new Set(current.split(',').concat(value)));
        element.setAttribute(attr, update.join(','));
    }
};

const setFieldType = updateAttribute(DETECTED_FIELD_TYPE_ATTR);

const setFormType = updateAttribute(DETECTED_FORM_TYPE_ATTR);

const getDetectedFormParent = (el) => (el === null || el === void 0 ? void 0 : el.closest(detectedFormSelector));

const typeFormEffect = (type) =>
    throughEffect((fnode) => {
        setFormProcessed(fnode.element);
        setFormType(fnode.element, type);
    });

const typeFieldEffect = (type) =>
    throughEffect((fnode) => {
        setFieldProcessed(fnode.element);
        setFieldType(fnode.element, type);
    });

const boolInt = (val) => Number(val);

const safeInt = (val, fallback = 0) => (Number.isFinite(val) ? val : fallback);

const featureScore = (noteFor, key) =>
    score((fnode) => {
        const features = fnode.noteFor(noteFor);
        if (Array.isArray(key)) return key.map((k) => features[k]).reduce((a, b) => a * b);
        return features[key];
    });

const getParentFnodeVisibleForm = (fieldFnode) => {
    const field = fieldFnode.element;
    const ruleset = fieldFnode._ruleset;
    const parentForms = ruleset.get(type('form'));
    const form = parentForms.find(({ element }) => element.contains(field));
    if (form) return form;
    const preDetectedForm = field.closest(`[${DETECTED_FORM_TYPE_ATTR}]`);
    if (preDetectedForm) return ruleset.get(preDetectedForm);
    return null;
};

const getFormTypeScore = (formFnode, type) => {
    if (!formFnode) return 0;
    if (formFnode.element.getAttribute(DETECTED_FORM_TYPE_ATTR) === type) return 1;
    return formFnode === null || formFnode === void 0 ? void 0 : formFnode.scoreFor(type);
};

const belongsToType = (type) => (fnode) => fnode.scoreFor(type) > 0.5;

const outRuleWithPredetectedAttr = (attr, throughFn) => (typeOut) =>
    [
        rule(dom(`[${attr}*="${typeOut}"]`), type(`${typeOut}-cache`), {}),
        rule(type(`${typeOut}-cache`), type('cache'), {}),
        rule(type(typeOut).when(belongsToType(typeOut)), type(`${typeOut}-result`), {}),
        rule(type(`${typeOut}-cache`), type(`${typeOut}-result`), {}),
        rule(type(`${typeOut}-result`), out(typeOut).through(throughFn(typeOut)), {}),
    ];

const outRuleForm = outRuleWithPredetectedAttr(DETECTED_FORM_TYPE_ATTR, typeFormEffect);

const outRuleField = outRuleWithPredetectedAttr(DETECTED_FIELD_TYPE_ATTR, typeFieldEffect);

const combineFeatures = (arr1, arr2) => arr1.flatMap((item1) => arr2.map((item2) => [item1, item2]));

const withFnodeEl = (fn) => (fnode) => fn(fnode.element);

const memoize = (fn) => {
    let cache = new WeakMap();
    const memoisedFn = (arg) => {
        if (cache.has(arg)) return cache.get(arg);
        const result = fn(arg);
        cache.set(arg, result);
        return result;
    };
    memoisedFn.clearCache = () => (cache = new WeakMap());
    return memoisedFn;
};

const VALID_INPUT_TYPES = ['text', 'email', 'number', 'tel', 'password', 'hidden', 'search'];

const inputFilter = (input) => {
    if (input.getAttribute(DETECTED_FIELD_TYPE_ATTR) !== null) return false;
    if (input.getAttribute(IGNORE_ELEMENT_ATTR) !== null) return false;
    if (input.matches(`[${IGNORE_ELEMENT_ATTR}] *`)) return false;
    if (!VALID_INPUT_TYPES.includes(input.type)) {
        setIgnoreFlag(input);
        return false;
    }
    if (input.type === 'hidden') {
        const value = input.value.trim();
        if (
            value === '' ||
            value.length > MAX_HIDDEN_FIELD_VALUE_LENGTH ||
            HIDDEN_FIELD_IGNORE_VALUES.includes(value) ||
            !input.matches(kHiddenUsernameSelector)
        ) {
            setIgnoreFlag(input);
            return false;
        }
    }
    if (input.getAttribute('aria-autocomplete') === 'list') {
        setIgnoreFlag(input);
        return false;
    }
    return true;
};

const fieldFilter = (fnode) => inputFilter(fnode.element) && getParentFnodeVisibleForm(fnode) !== null;

const selectInputs = memoize((root = document) => Array.from(root.querySelectorAll('input')).filter(inputFilter));

const selectUnprocessedInputs = (target = document) =>
    selectInputs(target).filter((el) => el.matches(unprocessedFieldFilter));

const selectDanglingInputs = (target = document) =>
    selectInputs(target).filter((el) => el.matches(danglingFieldFilter));

const walkUpWhile = (start, maxIterations) => (check) => {
    const parent = start.parentElement;
    if (maxIterations === 0 || parent === null) return start;
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

const getSiblingWith = (el, match) => {
    const prevEl = el.previousElementSibling;
    if (prevEl === null) return null;
    if (match(prevEl)) return prevEl;
    return getSiblingWith(prevEl, match);
};

const getLabelFor = (el) => {
    var _a;
    const forId = (_a = el.getAttribute('id')) !== null && _a !== void 0 ? _a : el.getAttribute('name');
    const label = document.querySelector(`label[for="${forId}"]`);
    if (label) return label;
    const closest = el.closest('label');
    if (closest) return closest;
    const siblingLabel = getSiblingWith(el, (sibling) => sibling.tagName === 'LABEL');
    if (siblingLabel) return siblingLabel;
    const parent = getNthParent(el)(2);
    const parentLabels = parent.querySelectorAll('label');
    if (parentLabels.length === 1) return parentLabels[0];
    const textNodeAbove = getSiblingWith(el, (el) => el instanceof HTMLElement && el.innerText.trim().length > 0);
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
        for (let i = 0; i < acc.length - 1; i++) {
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

const formFilter = (form) => {
    if (form.getAttribute(DETECTED_FORM_TYPE_ATTR) !== null) return false;
    if (form.getAttribute(IGNORE_ELEMENT_ATTR) !== null) return false;
    if (form.getAttribute('role') === 'search') {
        setIgnoreFlag(form);
        return false;
    }
    const fieldCount = form.querySelectorAll(fieldSelector).length;
    const inputCount = form.querySelectorAll(inputSelector).length;
    const invalidCount = inputCount === 0 || inputCount > MAX_INPUTS_PER_FORM || fieldCount > MAX_FIELDS_PER_FORM;
    const pageForm = form.matches('body > form') && form.offsetHeight >= form.ownerDocument.defaultView.outerHeight;
    if (invalidCount || pageForm) {
        if (!pageForm) setIgnoreFlag(form);
        return false;
    }
    if (form.matches('table form') && form.closest('table').querySelectorAll('form').length > 2) return false;
    return true;
};

const selectForms = memoize((root = document) => Array.from(root.querySelectorAll('form')).filter(formFilter));

const selectAllForms = (doc = document) =>
    uniqueNodes(selectForms(doc), Array.from(doc.querySelectorAll(detectedSelector)));

const selectUnprocessedForms = (target = document) =>
    selectAllForms(target).filter((el) => el.matches(unprocessedFormFilter));

const LOGIN_RE =
    /(?:(?:n(?:ouvelleses|uevase|ewses)s|iniciarses|connex)io|anmeldedate|sign[io])n|in(?:iciarsessao|troduce)|a(?:uthenticate|nmeld(?:ung|en))|authentifier|s(?:econnect|identifi)er|novasessao|(?:introduci|conecta|entr[ae])r|prihlasit|connect|acceder|login/i;

const REGISTER_RE =
    /kontoerstellen|cr(?:ea(?:teaccount|rcuenta)|iarconta)|(?:nouveaucompt|creeruncompt|s?inscrir|unirs)e|re(?:gist(?:r(?:ieren|arse|ar)|er)|joindre)|nuevacuenta|neueskonto|getstarted|newaccount|novaconta|(?:com(?:mence|eca)|(?:empez|junt)a)r|signup|join/i;

const RECOVERY_RE =
    /(?:wiederherstell|zurucksetz)en|re(?:(?:initialis|stablec)er|(?:defini|staur[ae])r|c(?:uper[ae]|ove)r|set)|problem|(?:troubl|restor|aid)e|a[jy]uda|h(?:ilfe|elp)/i;

const MULTI_STEP_RE = /p(?:rogres(?:s(?:ion|o)|o)|aso)|fortschritt|progress|s(?:chritt|t(?:age|ep))|etap[ae]|phase/i;

const TROUBLE_RE =
    /schwierigkeit|(?:difficult|troubl|oubli|hilf)e|i(?:nciden(?:cia|t)|ssue)|vergessen|esquecido|olvidado|needhelp|questao|problem|forgot|ayuda/i;

const PASSWORD_RE =
    /p(?:hrasesecrete|ass(?:(?:phras|cod)e|wor[dt]))|(?:c(?:havesecret|lavesecret|ontrasen)|deseguranc)a|(?:(?:zugangs|secret)cod|clesecret)e|codesecret|motdepasse|geheimnis|secret|heslo|senha|key/i;

const PASSWORD_OUTLIER_RE = /socialsecurity|nationalid/i;

const USERNAME_RE =
    /identi(?:fiant|ty)|u(?:tilisateur|s(?:ername|uario))|(?:identifi|benutz)er|(?:screen|nick)name|nutzername|(?:anmeld|handl)e|pseudo/i;

const USERNAME_ATTR_RE = /identifyemail|(?:custom|us)erid|loginname|a(?:cc(?:ountid|t)|ppleid)|loginid/i;

const USERNAME_OUTLIER_RE =
    /(?:nom(?:defamill|br)|tit[lr])e|(?:primeiro|sobre)nome|(?:company|middle|nach|vor)name|firstname|apellido|lastname|prenom/i;

const EMAIL_RE = /co(?:urriel|rrei?o)|email/i;

const EMAIL_ATTR_RE = /usermail/i;

const CREATE_ACTION_RE = /erstellen|n(?:o(?:uveau|vo)|uevo|e[uw])|cr(?:e(?:a(?:te|r)|er)|iar)|set/i;

const CREATE_ACTION_ATTR_END_RE = /\b.*(?:fst|1)$/i;

const RESET_ACTION_RE =
    /(?:a(?:ktualisiere|nder)|zurucksetze)n|(?:re(?:initialise|stablece|defini)|mettreajou)r|a(?:ctualiz|tualiz|lter)ar|c(?:ambiar|hange)|update|reset/i;

const CONFIRM_ACTION_RE =
    /digitarnovamente|v(?:olveraescribi|erifi(?:ca|e))r|saisiranouveau|(?:erneuteingeb|wiederhol|bestatig)en|verif(?:izieren|y)|re(?:pe(?:t[ei]r|at)|type)|confirm|again/i;

const CONFIRM_ACTION_ATTR_END_RE = /\b.*(?:snd|bis|2)$/i;

const STEP_ACTION_RE =
    /(?:f(?:ertigstell|ortfahr)|abschlie)en|getstarted|siguiente|(?:preceden|suivan|accep)t|(?:finaliza|termin[ae]|anterio|weite)r|co(?:mplet(?:ar|e)|ntinu(?:ar|e))|pro(?:c(?:hain|eed)|ximo)|finish|zuruck|back|next/i;

const REMEMBER_ACTION_RE =
    /angemeldetbleiben|lembrardemim|micherinnern|sesouvenirde|re(?:cordarme|member|ster)|manterme|mantener|stay|keep/i;

const SEARCH_ACTION_RE = /recherche|buscar|s(?:earch|uche)|query/i;

const CURRENT_VALUE_RE =
    /(?:be(?:stehend|for)|vorherig|aktuell)e|exist(?:ente|ing)|pre(?:cedent|vious)|a(?:n(?:t(?:erior|igo)|cien)|ctu[ae]l|tual)|existant|dernier|current|(?:ultim|viej)o|(?:letz|al)te|last|old/i;

const HIDDEN_ATTR_RE = /s(?:creenreade)?ronly|(?:move)?offscreen|(?:displaynon|a11yhid)e|hidden/i;

const OAUTH_ATTR_RE = /facebook|twitch|google|apple/i;

const TOS_RE =
    /(?:datenschutzrichtlini|politicadeprivacidad|confidentialit|a(?:cknowledg|gre))e|nutzungsbedingungen|(?:consentimi?ent|ac(?:ue|o)rd)o|(?:einwillig|zustimm)ung|consentement|condi(?:cione|tion)s|term(?:osdeuso|inos|sof)|(?:privacida|understan)d|guideline|consent|p(?:riva|oli)cy|accord/i;

const MFA_ACTION_RE = /enter(?:auth)?code|confirm|verify/i;

const MFA_RE =
    /(?:authentifizierung|doisfatore|doispasso)s|(?:auth(?:entication)?cod|(?:securityc|codig)od|doubleetap|coded)e|(?:authentication|generator)app|(?:(?:authentifica|doublefac)teu|(?:(?:authentifika|doblefac|zweifak|twofac)t|aut(?:henticat|enticad))o)r|verifica(?:c(?:ion|ao)|tion)|multifa(?:ct(?:eu|o)|k?to)r|zweischritte|generadora|doblepaso|2(?:s(?:chritte|tep)|(?:etap[ae]|paso)s|fa)|twostep/i;

const MFA_ATTR_RE =
    /phoneverification|(?:approvals|login)code|c(?:odeinput|hallenge)|two(?:factor|step)|twofa|tfa|[2m]fa/i;

const OTP_ATTR_RE = /totp(?:pin)?|o(?:netime|t[cp])|1time/i;

const OTP_OUTLIER_RE =
    /n(?:(?:ue|o)vocodigo|ouveaucode|e(?:usenden|(?:uer|w)code))|re(?:enviar|send)|envoyer|senden|enviar|send/i;

const OTP_OUTLIER_ATTR_RE = /(?:phone(?:verification)?|email|tel)pin|email|sms/i;

const NEWSLETTER_RE = /newsletter|b(?:ul|o)letin|mailing/i;

const NEWSLETTER_ATTR_RE = /subscription|mailinglist|newsletter|emailform/i;

const EMAIL_VALUE_RE = /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,5}$/;

const TEL_VALUE_RE = /^[\d()+-]{6,25}$/;

const USERNAME_VALUE_RE = /^[\w\-\.]{7,30}$/;

const reSanityCheck = (cb, options) => (str) => {
    if (options.maxLength && str.length > options.maxLength) return false;
    if (options.minLength && str.length < options.minLength) return false;
    return cb(str);
};

const notRe = (reg, options) => (str) => !test(reg, options)(str);

const andRe = (reg, options) => and(reg.map((re) => test(re, options)));

const orRe = (reg, options) => or(reg.map((re) => test(re, options)));

const test = (re, options) =>
    reSanityCheck(
        (str) => re.test(str),
        options !== null && options !== void 0
            ? options
            : {
                  maxLength: 5e3,
                  minLength: 2,
              }
    );

const and = (tests) => (str) => tests.every((test) => test(str));

const or = (tests) => (str) => tests.some((test) => test(str));

const any = (test) => (strs) => strs.some(test);

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

const matchEmail = or([test(EMAIL_RE), matchEmailValue]);

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

const matchPasswordReset = and([andRe([PASSWORD_RE, RESET_ACTION_RE]), notRe(CONFIRM_ACTION_RE)]);

const matchPasswordResetAttr = and([matchPasswordReset, notRe(CONFIRM_ACTION_ATTR_END_RE)]);

const matchPasswordCreate = and([andRe([PASSWORD_RE, CREATE_ACTION_RE]), notRe(CONFIRM_ACTION_RE)]);

const matchPasswordCreateAttr = and([matchPasswordCreate, notRe(CONFIRM_ACTION_ATTR_END_RE)]);

const matchPasswordConfirm = andRe([PASSWORD_RE, CONFIRM_ACTION_RE]);

const matchPasswordConfirmAttr = and([andRe([PASSWORD_RE, CONFIRM_ACTION_RE]), notRe(CREATE_ACTION_ATTR_END_RE)]);

const matchPasswordCurrent = and([andRe([PASSWORD_RE, CURRENT_VALUE_RE]), notRe(CONFIRM_ACTION_RE)]);

const matchPasswordCurrentAttr = and([matchPasswordCurrent, notRe(CONFIRM_ACTION_ATTR_END_RE)]);

const matchPasswordOutlier = test(PASSWORD_OUTLIER_RE);

const matchHidden = test(HIDDEN_ATTR_RE);

const matchMfaAction = test(MFA_ACTION_RE);

const matchMfa = test(MFA_RE);

const matchMfaAttr = test(MFA_ATTR_RE);

const matchOtpAttr = test(OTP_ATTR_RE);

const matchOtpOutlier = orRe([OTP_OUTLIER_ATTR_RE, OTP_OUTLIER_RE]);

const matchNewsletter = test(NEWSLETTER_RE);

orRe([NEWSLETTER_RE, NEWSLETTER_ATTR_RE]);

const cacheContext = {};

const getVisibilityCache = (key) => {
    var _a;
    return (cacheContext[key] = (_a = cacheContext[key]) !== null && _a !== void 0 ? _a : new WeakMap());
};

const clearVisibilityCache = () => Object.keys(cacheContext).forEach((key) => delete cacheContext[key]);

const withCache = (cacheMap) => (els, visible) => {
    els.forEach((el) => cacheMap.set(el, visible));
    return visible;
};

const isVisible = (fnodeOrElement, options) => {
    const element = utils.toDomElement(fnodeOrElement);
    const seen = [element];
    const cache = getVisibilityCache(JSON.stringify(options));
    if (cache.has(element)) return cache.get(element);
    const check = () => {
        const elementWindow = utils.windowForElement(element);
        const elementRect = element.getBoundingClientRect();
        const elementStyle = elementWindow.getComputedStyle(element);
        if (elementRect.width === 0 && elementRect.height === 0 && elementStyle.overflow !== 'hidden') return false;
        if (elementStyle.visibility === 'hidden') return false;
        if (elementRect.x + elementRect.width < 0 || elementRect.y + elementRect.height < 0) return false;
        for (const ancestor of utils.ancestors(element)) {
            if (ancestor === elementWindow.document.documentElement) continue;
            if (cache === null || cache === void 0 ? void 0 : cache.has(ancestor)) {
                const cachedVisible = cache.get(ancestor);
                if (!cachedVisible) return false;
                else continue;
            }
            const isElement = ancestor === element;
            if (!isElement) seen.push(ancestor);
            const style = isElement ? elementStyle : elementWindow.getComputedStyle(ancestor);
            if (style.opacity === '0' && options.opacity) return false;
            if (style.display === 'contents') continue;
            const rect = isElement ? elementRect : ancestor.getBoundingClientRect();
            if ((rect.width <= 1 || rect.height <= 1) && style.overflow === 'hidden') return false;
            if (
                style.position === 'fixed' &&
                (rect.x >= elementWindow.innerWidth || rect.y >= elementWindow.innerHeight)
            )
                return false;
        }
        return true;
    };
    const visible = check();
    return withCache(cache)(seen, visible);
};

const quickVisibilityCheck = (el, options) => {
    const cache = getVisibilityCache(JSON.stringify(options));
    if (cache.has(el)) return cache.get(el);
    const check = () => {
        const rect = el.getClientRects();
        if (rect.length === 0) return false;
        const classList = Array.from(el.classList).map(sanitizeString);
        if (any(matchHidden)(classList)) return false;
        const { visibility, display, maxHeight } = getComputedStyle(el);
        if (visibility === 'hidden' || display === 'none' || maxHeight === '0px') return false;
        if (el.offsetHeight === 0 || el.offsetWidth === 0) return false;
        if (el.offsetHeight < options.minHeight || el.offsetWidth < options.minWidth) return false;
        return true;
    };
    return withCache(cache)([el], check());
};

const isVisibleEl = (el) =>
    quickVisibilityCheck(el, {
        minHeight: 0,
        minWidth: 0,
    });

const isVisibleForm = (form) => {
    if (
        form.tagName !== 'FORM' &&
        !isVisible(form, {
            opacity: true,
        })
    )
        return false;
    const inputs = Array.from(form.querySelectorAll(inputSelector)).filter((field) => !field.disabled);
    return (
        inputs.length > 0 &&
        inputs.some((input) =>
            isVisible(input, {
                opacity: false,
            })
        )
    );
};

const isVisibleField = (field) => {
    if (field instanceof HTMLInputElement) {
        const { type, disabled, readOnly } = field;
        if (type === 'hidden' || disabled || readOnly) return false;
    }
    return quickVisibilityCheck(field, {
        minHeight: MIN_FIELD_HEIGHT,
        minWidth: MIN_FIELD_WIDTH,
    });
};

const getFormParent = (form) =>
    walkUpWhile(form, MAX_FORM_FIELD_WALK_UP)((el) => el.querySelectorAll('form').length <= 1);

const createInputIterator = (form) => {
    const formEls = Array.from(form.querySelectorAll(inputSelector)).filter(isVisibleField);
    return {
        prev(input) {
            var _a;
            const idx = formEls.indexOf(input);
            return idx === -1
                ? null
                : (_a = formEls === null || formEls === void 0 ? void 0 : formEls[idx - 1]) !== null && _a !== void 0
                ? _a
                : null;
        },
        next(input) {
            var _a;
            const idx = formEls.indexOf(input);
            return idx === -1
                ? null
                : (_a = formEls === null || formEls === void 0 ? void 0 : formEls[idx + 1]) !== null && _a !== void 0
                ? _a
                : null;
        },
    };
};

const getPageDescriptionText = (doc) => {
    var _a;
    const pageTitle = doc.title;
    const metaDescription = doc.querySelector('meta[name="description"]');
    const descriptionContent =
        (_a =
            metaDescription === null || metaDescription === void 0
                ? void 0
                : metaDescription.getAttribute('content')) !== null && _a !== void 0
            ? _a
            : '';
    return sanitizeString(`${pageTitle} ${descriptionContent}`);
};

const getNodeText = (node) => {
    const textAttrs = getTextAttributes(node).join('');
    return sanitizeString(`${node.innerText}${textAttrs}`);
};

const getNodeAttributes = (node) => sanitizeString(getBaseAttributes(node).join(''));

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
    var _a, _b;
    const originRect = el.getBoundingClientRect();
    const parent = walkUpWhile(
        el,
        MAX_FORM_HEADING_WALK_UP
    )((parentEl, candidate) => {
        if (parentEl === document.body) return false;
        if (candidate.matches(domGroupSelector)) return false;
        return true;
    });
    const headings = Array.from(parent.querySelectorAll(headingSelector)).filter((heading) => {
        if (el.contains(heading)) return true;
        const headingRect = heading.getBoundingClientRect();
        const { dx, dy } = getRectMinDistance(originRect, headingRect);
        return dx < MAX_HEADING_HORIZONTAL_DIST && dy < MAX_HEADING_VERTICAL_DIST;
    });
    const textAbove =
        (_b =
            (_a =
                headings.length === 0
                    ? getSiblingWith(el, (el) => el instanceof HTMLElement && el.innerText.trim().length > 0)
                    : null) === null || _a === void 0
                ? void 0
                : _a.innerText) !== null && _b !== void 0
            ? _b
            : '';
    return sanitizeString(textAbove + headings.map((el) => el.innerText).join(''));
};

const isActiveFieldFNode = (fnode) => {
    const { visible, readonly, disabled } = fnode.noteFor('field');
    return visible && !readonly && !disabled;
};

const isActiveField = (el) => {
    if (el.getAttribute(IGNORE_ELEMENT_ATTR) !== null) return false;
    if (el.matches(`[${IGNORE_ELEMENT_ATTR}] *`)) return false;
    const { readOnly, disabled, offsetHeight } = el;
    return (
        !readOnly &&
        !disabled &&
        offsetHeight > MIN_FIELD_HEIGHT &&
        isVisible(el, {
            opacity: false,
        })
    );
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

const fType = (fnode, types) => types.includes(fnode.element.type);

const fMatch = (fnode, selector) => fnode.element.matches(selector);

const fMode = (fnode, inputMode) => fnode.element.inputMode === inputMode;

const fActive = (fn) => (fnode) => fn(fnode) && isActiveFieldFNode(fnode);

const maybeEmail = fActive((fnode) => fType(fnode, ['email', 'text']) || fMode(fnode, 'email'));

const maybePassword = fActive((fnode) => fMatch(fnode, passwordSelector));

const maybeOTP = fActive((fnode) => fMatch(fnode, otpSelector));

const maybeUsername = fActive(
    (fnode) => (!fMode(fnode, 'email') && fType(fnode, ['text', 'tel'])) || fMatch(fnode, kUsernameSelector)
);

const maybeHiddenUsername = (fnode) => fMatch(fnode, hiddenUsernameSelector) && !isActiveFieldFNode(fnode);

const isUsernameCandidate = (el) => !el.matches('input[type="email"]') && any(matchUsername)(getAllFieldHaystacks(el));

const isEmailCandidate = (el) => el.matches('input[type="email"]') || any(matchEmail)(getAllFieldHaystacks(el));

const isOAuthCandidate = (el) => any(matchOAuth)(getAllFieldHaystacks(el));

const isSubmitBtnCandidate = (btn) => {
    if (btn.innerText === '') return false;
    const height = btn.offsetHeight;
    const width = btn.offsetWidth;
    return height * width > MIN_AREA_SUBMIT_BTN;
};

const { linearScale: linearScale$1 } = utils;

const getFormFeatures = (fnode) => {
    const form = fnode.element;
    const parent = getFormParent(form);
    const fields = Array.from(form.querySelectorAll(fieldSelector));
    const visibleFields = fields.filter(isVisibleField);
    const doc = form.ownerDocument;
    const inputs = fields.filter((el) => el.matches('input:not([type="submit"])'));
    const visibleInputs = visibleFields.filter((el) => el.matches('input:not([type="submit"])'));
    const fieldsets = form.querySelectorAll('fieldset');
    const textareas = visibleFields.filter((el) => el.matches('textarea'));
    const selects = visibleFields.filter((el) => el.matches('select'));
    const submits = visibleFields.filter((el) => el.matches('[type="submit"]'));
    const hidden = inputs.filter((el) => el.matches('[type="hidden"]'));
    const texts = visibleInputs.filter((el) => el.matches('[type="text"]'));
    const usernames = inputs.filter(isUsernameCandidate);
    const emails = inputs.filter(isEmailCandidate);
    const tels = inputs.filter((el) => el.matches('[type="tel"]'));
    const pws = inputs.filter((el) => el.matches(passwordSelector));
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
    const captchas = parent.querySelectorAll(captchaSelector);
    const socialEls = Array.from(parent.querySelectorAll(socialSelector));
    const btns = Array.from(form.querySelectorAll(buttonSelector));
    const submitBtns = btns.filter(isSubmitBtnCandidate);
    const btnCandidates = submits.concat(submitBtns);
    const anchors = Array.from(form.querySelectorAll(anchorLinkSelector)).filter(isVisibleEl);
    const oauths = socialEls.concat(submitBtns).filter(isOAuthCandidate);
    const layouts = Array.from(form.querySelectorAll(layoutSelector));
    const autofocusedIsIdentifier = Boolean(autofocused && identifiers.includes(autofocused));
    const autofocusedIsPassword = Boolean(autofocused && passwords.includes(autofocused));
    const pageDescriptionText = getPageDescriptionText(doc);
    const nearestHeadingsText = getNearestHeadingsText(form);
    const formTextAttrText = getFormText(form);
    const formAttributes = getFormAttributes(form);
    const pwHaystack = pws.flatMap(getAllFieldHaystacks);
    const identifierHaystack = identifiers.flatMap(getAllFieldHaystacks);
    const submitBtnHaystack = btnCandidates.flatMap(getAllFieldHaystacks);
    const checkboxesHaystack = checkboxes.flatMap(getAllFieldHaystacks);
    const anchorsHaystack = anchors.flatMap(getAllNodeHaystacks);
    const mfaInputsHaystack = mfas.flatMap(getAllFieldHaystacks);
    const layoutHaystack = layouts.map(getNodeAttributes);
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
    const formTextMFA = matchMfa(formTextAttrText);
    const formAttrsMFA = any(matchMfaAttr)(formAttributes);
    const headingsMFA = matchMfa(nearestHeadingsText);
    const layoutMFA = any(matchMfa)(layoutHaystack);
    const buttonVerify = any(matchMfaAction)(submitBtnHaystack);
    const inputsMFA = any(matchMfaAttr)(mfaInputsHaystack);
    const inputsOTP = any(matchOtpAttr)(mfaInputsHaystack);
    const linkOTPOutlier = any(matchOtpOutlier)(anchorsHaystack.concat(submitBtnHaystack));
    const newsletterForm = matchNewsletter(nearestHeadingsText);
    const buttonMultiStep = any(matchStepAction)(submitBtnHaystack);
    const headingsMultiStep = matchMultiStep(nearestHeadingsText);
    return {
        fieldsCount: linearScale$1(visibleFields.length, 1, 5),
        inputCount: linearScale$1(visibleInputs.length, 1, 5),
        fieldsetCount: linearScale$1(fieldsets.length, 1, 5),
        textCount: linearScale$1(texts.length, 0, 3),
        textareaCount: linearScale$1(textareas.length, 0, 2),
        selectCount: linearScale$1(selects.length, 0, 2),
        checkboxCount: linearScale$1(checkboxes.length, 0, 2),
        radioCount: linearScale$1(radios.length, 0, 5),
        identifierCount: linearScale$1(identifiers.length, 0, 2),
        hiddenIdentifierCount: linearScale$1(hiddenIdentifiers.length, 0, 2),
        hiddenCount: linearScale$1(hidden.length, 0, 5),
        passwordCount: linearScale$1(passwords.length, 0, 2),
        hiddenPasswordCount: linearScale$1(hiddenPasswords.length, 0, 2),
        usernameCount: linearScale$1(usernames.length, 0, 2),
        emailCount: linearScale$1(emails.length, 0, 2),
        submitCount: linearScale$1(submits.length, 0, 2),
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
        inputRatio: safeInt(inputs.length / fields.length),
        hiddenRatio: safeInt(hidden.length / fields.length),
        visibleRatio: safeInt(visibleInputs.length / fields.length),
        identifierRatio: safeInt(identifiers.length / visibleFields.length),
        emailRatio: safeInt(emails.length / visibleFields.length),
        usernameRatio: safeInt(usernames.length / visibleFields.length),
        passwordRatio: safeInt(passwords.length / visibleFields.length),
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
        formTextMFA: boolInt(formTextMFA),
        formAttrsMFA: boolInt(formAttrsMFA),
        headingsMFA: boolInt(headingsMFA),
        layoutMFA: boolInt(layoutMFA),
        buttonVerify: boolInt(buttonVerify),
        inputsMFA: boolInt(inputsMFA),
        inputsOTP: boolInt(inputsOTP),
        linkOTPOutlier: boolInt(linkOTPOutlier),
        newsletterForm: boolInt(newsletterForm),
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
    'checkboxCount',
    'radioCount',
    'identifierCount',
    'hiddenIdentifierCount',
    'usernameCount',
    'emailCount',
    'hiddenCount',
    'hiddenPasswordCount',
    'submitCount',
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
    'headingsMFA',
    'layoutMFA',
    'buttonVerify',
    'inputsMFA',
    'inputsOTP',
    'linkOTPOutlier',
    'newsletterForm',
    'multiStepForm',
    'multiAuthForm',
];

const results$a = {
    coeffs: [
        ['login-fieldsCount', 5.557280540466309],
        ['login-inputCount', 5.059881687164307],
        ['login-fieldsetCount', -9.66678524017334],
        ['login-textCount', -17.597736358642578],
        ['login-textareaCount', -6.081013202667236],
        ['login-selectCount', 20.7066707611084],
        ['login-checkboxCount', 18.316913604736328],
        ['login-radioCount', -6.036588668823242],
        ['login-identifierCount', -5.27437162399292],
        ['login-hiddenIdentifierCount', 6.310816764831543],
        ['login-usernameCount', 22.380258560180664],
        ['login-emailCount', -8.30627155303955],
        ['login-hiddenCount', 10.78964900970459],
        ['login-hiddenPasswordCount', 19.009666442871094],
        ['login-submitCount', -11.097455024719238],
        ['login-hasTels', -16.51204490661621],
        ['login-hasOAuth', -5.429686069488525],
        ['login-hasCaptchas', 2.1160402297973633],
        ['login-hasFiles', -5.916687965393066],
        ['login-hasDate', -8.93724250793457],
        ['login-hasNumber', -5.955525875091553],
        ['login-oneVisibleField', -6.249606132507324],
        ['login-twoVisibleFields', 0.8153921365737915],
        ['login-threeOrMoreVisibleFields', -2.3075568675994873],
        ['login-noPasswords', -11.563883781433105],
        ['login-onePassword', 9.871381759643555],
        ['login-twoPasswords', -19.958402633666992],
        ['login-threeOrMorePasswords', -6.24926233291626],
        ['login-noIdentifiers', -5.869405269622803],
        ['login-oneIdentifier', -0.20176084339618683],
        ['login-twoIdentifiers', -12.659523963928223],
        ['login-threeOrMoreIdentifiers', -6.855637550354004],
        ['login-autofocusedIsIdentifier', 13.542500495910645],
        ['login-autofocusedIsPassword', 31.83290672302246],
        ['login-visibleRatio', 6.113892078399658],
        ['login-inputRatio', 4.390734672546387],
        ['login-hiddenRatio', -10.136449813842773],
        ['login-identifierRatio', 13.953431129455566],
        ['login-emailRatio', -1.8048542737960815],
        ['login-usernameRatio', -20.301733016967773],
        ['login-passwordRatio', -1.3930528163909912],
        ['login-requiredRatio', 6.3970746994018555],
        ['login-pageLogin', 13.503825187683105],
        ['login-formTextLogin', 7.84074592590332],
        ['login-formAttrsLogin', 10.460926055908203],
        ['login-headingsLogin', 25.08554458618164],
        ['login-layoutLogin', 9.48417854309082],
        ['login-rememberMeCheckbox', 8.365181922912598],
        ['login-troubleLink', 16.677274703979492],
        ['login-submitLogin', 4.206870079040527],
        ['login-pageRegister', -3.1024248600006104],
        ['login-formTextRegister', -0.09130167216062546],
        ['login-formAttrsRegister', -6.6954874992370605],
        ['login-headingsRegister', -13.626882553100586],
        ['login-layoutRegister', 2.3442721366882324],
        ['login-pwNewRegister', -24.271934509277344],
        ['login-pwConfirmRegister', -16.410062789916992],
        ['login-submitRegister', -15.33606243133545],
        ['login-TOSRef', -2.5479812622070312],
        ['login-pagePwReset', -7.097908973693848],
        ['login-formTextPwReset', -6.039440155029297],
        ['login-formAttrsPwReset', -9.889033317565918],
        ['login-headingsPwReset', -12.879528999328613],
        ['login-layoutPwReset', -2.1774463653564453],
        ['login-pageRecovery', -2.6671578884124756],
        ['login-formTextRecovery', -0.03707438334822655],
        ['login-formAttrsRecovery', -26.464763641357422],
        ['login-headingsRecovery', -7.1520490646362305],
        ['login-layoutRecovery', -0.5202800035476685],
        ['login-identifierRecovery', -0.1852855235338211],
        ['login-submitRecovery', -3.1930229663848877],
        ['login-formTextMFA', -0.04357433319091797],
        ['login-formAttrsMFA', -22.843475341796875],
        ['login-headingsMFA', -43.8725700378418],
        ['login-layoutMFA', -4.535977840423584],
        ['login-buttonVerify', -6.622054576873779],
        ['login-inputsMFA', -29.313236236572266],
        ['login-inputsOTP', -11.090039253234863],
        ['login-linkOTPOutlier', -1.2586407661437988],
        ['login-newsletterForm', -8.314398765563965],
        ['login-multiStepForm', 1.0045841932296753],
        ['login-multiAuthForm', 19.459318161010742],
        ['login-visibleRatio,fieldsCount', -15.411693572998047],
        ['login-visibleRatio,identifierCount', -8.548486709594727],
        ['login-visibleRatio,passwordCount', 10.4813232421875],
        ['login-visibleRatio,hiddenIdentifierCount', 24.78273582458496],
        ['login-visibleRatio,hiddenPasswordCount', 5.834932327270508],
        ['login-identifierRatio,fieldsCount', -33.781944274902344],
        ['login-identifierRatio,identifierCount', 12.57809066772461],
        ['login-identifierRatio,passwordCount', -17.7615966796875],
        ['login-identifierRatio,hiddenIdentifierCount', -6.481559753417969],
        ['login-identifierRatio,hiddenPasswordCount', 5.034515380859375],
        ['login-passwordRatio,fieldsCount', 4.824157238006592],
        ['login-passwordRatio,identifierCount', -17.440053939819336],
        ['login-passwordRatio,passwordCount', -6.315474033355713],
        ['login-passwordRatio,hiddenIdentifierCount', -21.90196418762207],
        ['login-passwordRatio,hiddenPasswordCount', 12.713448524475098],
        ['login-requiredRatio,fieldsCount', 6.391036033630371],
        ['login-requiredRatio,identifierCount', -22.79534339904785],
        ['login-requiredRatio,passwordCount', 16.089658737182617],
        ['login-requiredRatio,hiddenIdentifierCount', -4.865629196166992],
        ['login-requiredRatio,hiddenPasswordCount', 16.2814998626709],
    ],
    bias: -4.75676965713501,
    cutoff: 0.51,
};

const FORM_COMBINED_FEATURES = [
    ...FORM_FEATURES,
    ...combineFeatures(
        ['visibleRatio', 'identifierRatio', 'passwordRatio', 'requiredRatio'],
        ['fieldsCount', 'identifierCount', 'passwordCount', 'hiddenIdentifierCount', 'hiddenPasswordCount']
    ),
];

const login = {
    name: 'login',
    coeffs: FORM_COMBINED_FEATURES.map((feat) => {
        var _a, _b;
        return [
            `login-${feat}`,
            (_b =
                (_a = results$a.coeffs.find(([feature]) => feature === `login-${feat}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$a.bias,
    cutoff: results$a.cutoff,
    getRules: () => [
        rule(type('form'), type('login'), {}),
        ...FORM_COMBINED_FEATURES.map((feat) =>
            rule(type('login'), featureScore('form', feat), {
                name: `login-${feat}`,
            })
        ),
        ...outRuleForm('login'),
    ],
};

const results$9 = {
    coeffs: [
        ['pw-change-fieldsCount', -2.7117929458618164],
        ['pw-change-inputCount', -2.45560884475708],
        ['pw-change-fieldsetCount', -5.989695072174072],
        ['pw-change-textCount', -6.094264030456543],
        ['pw-change-textareaCount', -6.053415775299072],
        ['pw-change-selectCount', -6.006941318511963],
        ['pw-change-checkboxCount', -5.966713905334473],
        ['pw-change-radioCount', -5.989431858062744],
        ['pw-change-identifierCount', -5.434870719909668],
        ['pw-change-hiddenIdentifierCount', -3.888850212097168],
        ['pw-change-usernameCount', -6.057318687438965],
        ['pw-change-emailCount', -4.8003950119018555],
        ['pw-change-hiddenCount', -4.087965488433838],
        ['pw-change-hiddenPasswordCount', -5.907230854034424],
        ['pw-change-submitCount', -3.58221697807312],
        ['pw-change-hasTels', -5.960107803344727],
        ['pw-change-hasOAuth', -5.96865177154541],
        ['pw-change-hasCaptchas', -6.028329849243164],
        ['pw-change-hasFiles', -5.965851306915283],
        ['pw-change-hasDate', -5.951476097106934],
        ['pw-change-hasNumber', -6.067984104156494],
        ['pw-change-oneVisibleField', -6.01706075668335],
        ['pw-change-twoVisibleFields', -3.224764108657837],
        ['pw-change-threeOrMoreVisibleFields', -0.589676022529602],
        ['pw-change-noPasswords', -5.980226039886475],
        ['pw-change-onePassword', -6.081719875335693],
        ['pw-change-twoPasswords', 7.775388240814209],
        ['pw-change-threeOrMorePasswords', 20.851795196533203],
        ['pw-change-noIdentifiers', -0.28919124603271484],
        ['pw-change-oneIdentifier', -6.081236362457275],
        ['pw-change-twoIdentifiers', -6.088187217712402],
        ['pw-change-threeOrMoreIdentifiers', 5.0441575050354],
        ['pw-change-autofocusedIsIdentifier', -6.0694899559021],
        ['pw-change-autofocusedIsPassword', 18.660432815551758],
        ['pw-change-visibleRatio', -3.826396942138672],
        ['pw-change-inputRatio', -3.987790107727051],
        ['pw-change-hiddenRatio', -4.706834316253662],
        ['pw-change-identifierRatio', -5.688721179962158],
        ['pw-change-emailRatio', -5.393861770629883],
        ['pw-change-usernameRatio', -6.108675479888916],
        ['pw-change-passwordRatio', 2.5491604804992676],
        ['pw-change-requiredRatio', -4.367903232574463],
        ['pw-change-pageLogin', -6.6573166847229],
        ['pw-change-formTextLogin', -6.082921504974365],
        ['pw-change-formAttrsLogin', -6.051820755004883],
        ['pw-change-headingsLogin', -5.976500988006592],
        ['pw-change-layoutLogin', -6.065547466278076],
        ['pw-change-rememberMeCheckbox', -6.095389366149902],
        ['pw-change-troubleLink', -3.6438140869140625],
        ['pw-change-submitLogin', -5.935122013092041],
        ['pw-change-pageRegister', -5.953001976013184],
        ['pw-change-formTextRegister', 0.029357127845287323],
        ['pw-change-formAttrsRegister', -6.028713226318359],
        ['pw-change-headingsRegister', -6.040992259979248],
        ['pw-change-layoutRegister', -6.067600250244141],
        ['pw-change-pwNewRegister', 11.011330604553223],
        ['pw-change-pwConfirmRegister', 7.438333511352539],
        ['pw-change-submitRegister', -7.847390651702881],
        ['pw-change-TOSRef', -7.163846492767334],
        ['pw-change-pagePwReset', 15.699227333068848],
        ['pw-change-formTextPwReset', 21.9506893157959],
        ['pw-change-formAttrsPwReset', 1.5518512725830078],
        ['pw-change-headingsPwReset', 17.18878936767578],
        ['pw-change-layoutPwReset', 16.30636978149414],
        ['pw-change-pageRecovery', -6.060823440551758],
        ['pw-change-formTextRecovery', 0.05196259170770645],
        ['pw-change-formAttrsRecovery', -5.908468246459961],
        ['pw-change-headingsRecovery', -5.966202735900879],
        ['pw-change-layoutRecovery', -3.8590941429138184],
        ['pw-change-identifierRecovery', -5.945972442626953],
        ['pw-change-submitRecovery', 0.022252734750509262],
        ['pw-change-formTextMFA', -0.08346237242221832],
        ['pw-change-formAttrsMFA', -5.926911354064941],
        ['pw-change-headingsMFA', -6.069354057312012],
        ['pw-change-layoutMFA', -5.963028907775879],
        ['pw-change-buttonVerify', -6.021482944488525],
        ['pw-change-inputsMFA', -5.954174995422363],
        ['pw-change-inputsOTP', -5.960052490234375],
        ['pw-change-linkOTPOutlier', -6.195285797119141],
        ['pw-change-newsletterForm', -5.91213846206665],
        ['pw-change-multiStepForm', -5.996321201324463],
        ['pw-change-multiAuthForm', -6.037351131439209],
        ['pw-change-visibleRatio,fieldsCount', -2.5495481491088867],
        ['pw-change-visibleRatio,identifierCount', -5.700111389160156],
        ['pw-change-visibleRatio,passwordCount', 3.2172672748565674],
        ['pw-change-visibleRatio,hiddenIdentifierCount', -2.7671475410461426],
        ['pw-change-visibleRatio,hiddenPasswordCount', -6.0095086097717285],
        ['pw-change-identifierRatio,fieldsCount', -4.284539222717285],
        ['pw-change-identifierRatio,identifierCount', -5.40241813659668],
        ['pw-change-identifierRatio,passwordCount', -4.218871593475342],
        ['pw-change-identifierRatio,hiddenIdentifierCount', -5.947969436645508],
        ['pw-change-identifierRatio,hiddenPasswordCount', -6.08881139755249],
        ['pw-change-passwordRatio,fieldsCount', 5.31189489364624],
        ['pw-change-passwordRatio,identifierCount', -4.094099521636963],
        ['pw-change-passwordRatio,passwordCount', 7.664299964904785],
        ['pw-change-passwordRatio,hiddenIdentifierCount', -0.7061247825622559],
        ['pw-change-passwordRatio,hiddenPasswordCount', -6.092044830322266],
        ['pw-change-requiredRatio,fieldsCount', -4.423570156097412],
        ['pw-change-requiredRatio,identifierCount', -6.0863494873046875],
        ['pw-change-requiredRatio,passwordCount', -0.33362218737602234],
        ['pw-change-requiredRatio,hiddenIdentifierCount', 3.8647866249084473],
        ['pw-change-requiredRatio,hiddenPasswordCount', -6.023009777069092],
    ],
    bias: -3.9472107887268066,
    cutoff: 1,
};

const passwordChange = {
    name: 'password-change',
    coeffs: FORM_COMBINED_FEATURES.map((key) => {
        var _a, _b;
        return [
            `pw-change-${key}`,
            (_b =
                (_a = results$9.coeffs.find(([feature]) => feature === `pw-change-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$9.bias,
    cutoff: results$9.cutoff,
    getRules: () => [
        rule(type('form'), type('password-change'), {}),
        ...FORM_COMBINED_FEATURES.map((key) =>
            rule(type('password-change'), featureScore('form', key), {
                name: `pw-change-${key}`,
            })
        ),
        ...outRuleForm('password-change'),
    ],
};

const results$8 = {
    coeffs: [
        ['register-fieldsCount', 5.2191925048828125],
        ['register-inputCount', 2.542583465576172],
        ['register-fieldsetCount', 12.496092796325684],
        ['register-textCount', 4.679668426513672],
        ['register-textareaCount', -2.961205244064331],
        ['register-selectCount', -16.601829528808594],
        ['register-checkboxCount', -17.39218521118164],
        ['register-radioCount', 8.216133117675781],
        ['register-identifierCount', 4.978825569152832],
        ['register-hiddenIdentifierCount', 17.682104110717773],
        ['register-usernameCount', -9.490167617797852],
        ['register-emailCount', 0.6972806453704834],
        ['register-hiddenCount', -16.412927627563477],
        ['register-hiddenPasswordCount', 7.610988616943359],
        ['register-submitCount', 2.47200608253479],
        ['register-hasTels', 3.1993191242218018],
        ['register-hasOAuth', 5.566296577453613],
        ['register-hasCaptchas', 2.9660251140594482],
        ['register-hasFiles', -6.033395767211914],
        ['register-hasDate', 10.179539680480957],
        ['register-hasNumber', 16.784807205200195],
        ['register-oneVisibleField', 2.0575907230377197],
        ['register-twoVisibleFields', 0.0672999694943428],
        ['register-threeOrMoreVisibleFields', -1.8939061164855957],
        ['register-noPasswords', -2.836602210998535],
        ['register-onePassword', 1.2955148220062256],
        ['register-twoPasswords', 4.504833698272705],
        ['register-threeOrMorePasswords', -13.2074556350708],
        ['register-noIdentifiers', -12.0170259475708],
        ['register-oneIdentifier', 1.816903829574585],
        ['register-twoIdentifiers', 13.439616203308105],
        ['register-threeOrMoreIdentifiers', 1.0467935800552368],
        ['register-autofocusedIsIdentifier', -6.819413185119629],
        ['register-autofocusedIsPassword', 3.126845121383667],
        ['register-visibleRatio', -4.594073295593262],
        ['register-inputRatio', -6.93326473236084],
        ['register-hiddenRatio', 0.6958938241004944],
        ['register-identifierRatio', -0.6560115218162537],
        ['register-emailRatio', -1.7735426425933838],
        ['register-usernameRatio', -4.377230167388916],
        ['register-passwordRatio', 4.549829483032227],
        ['register-requiredRatio', -14.256120681762695],
        ['register-pageLogin', -6.5749921798706055],
        ['register-formTextLogin', -6.156639575958252],
        ['register-formAttrsLogin', -1.8803240060806274],
        ['register-headingsLogin', -22.44216537475586],
        ['register-layoutLogin', 1.969581127166748],
        ['register-rememberMeCheckbox', -13.47929859161377],
        ['register-troubleLink', -17.91417121887207],
        ['register-submitLogin', -6.648924827575684],
        ['register-pageRegister', 0.7767308354377747],
        ['register-formTextRegister', 0.07912573963403702],
        ['register-formAttrsRegister', 6.818765163421631],
        ['register-headingsRegister', 18.745534896850586],
        ['register-layoutRegister', -8.567939758300781],
        ['register-pwNewRegister', 15.084993362426758],
        ['register-pwConfirmRegister', 9.04642391204834],
        ['register-submitRegister', 25.87638282775879],
        ['register-TOSRef', 19.826414108276367],
        ['register-pagePwReset', -7.544378757476807],
        ['register-formTextPwReset', -10.955769538879395],
        ['register-formAttrsPwReset', -6.293275833129883],
        ['register-headingsPwReset', -21.548582077026367],
        ['register-layoutPwReset', -45.35206604003906],
        ['register-pageRecovery', -6.863832950592041],
        ['register-formTextRecovery', -0.05751340463757515],
        ['register-formAttrsRecovery', -8.550982475280762],
        ['register-headingsRecovery', -9.926004409790039],
        ['register-layoutRecovery', -0.9827588796615601],
        ['register-identifierRecovery', -33.86429977416992],
        ['register-submitRecovery', -21.094709396362305],
        ['register-formTextMFA', -0.0188545361161232],
        ['register-formAttrsMFA', -5.523774147033691],
        ['register-headingsMFA', -6.242012023925781],
        ['register-layoutMFA', 3.2063522338867188],
        ['register-buttonVerify', -4.256724834442139],
        ['register-inputsMFA', -8.071592330932617],
        ['register-inputsOTP', -14.6041841506958],
        ['register-linkOTPOutlier', 0.7961866855621338],
        ['register-newsletterForm', -30.753023147583008],
        ['register-multiStepForm', 10.513463973999023],
        ['register-multiAuthForm', -1.8220229148864746],
        ['register-visibleRatio,fieldsCount', 1.495043396949768],
        ['register-visibleRatio,identifierCount', 4.415518283843994],
        ['register-visibleRatio,passwordCount', 2.7497572898864746],
        ['register-visibleRatio,hiddenIdentifierCount', -10.403424263000488],
        ['register-visibleRatio,hiddenPasswordCount', -16.534852981567383],
        ['register-identifierRatio,fieldsCount', 6.298388957977295],
        ['register-identifierRatio,identifierCount', 1.8496596813201904],
        ['register-identifierRatio,passwordCount', -19.525760650634766],
        ['register-identifierRatio,hiddenIdentifierCount', -16.600120544433594],
        ['register-identifierRatio,hiddenPasswordCount', -9.60261058807373],
        ['register-passwordRatio,fieldsCount', -1.7114464044570923],
        ['register-passwordRatio,identifierCount', -20.870038986206055],
        ['register-passwordRatio,passwordCount', 1.2420058250427246],
        ['register-passwordRatio,hiddenIdentifierCount', 31.419544219970703],
        ['register-passwordRatio,hiddenPasswordCount', -25.206506729125977],
        ['register-requiredRatio,fieldsCount', 0.42233994603157043],
        ['register-requiredRatio,identifierCount', -1.1005207300186157],
        ['register-requiredRatio,passwordCount', -2.0625948905944824],
        ['register-requiredRatio,hiddenIdentifierCount', -1.3510656356811523],
        ['register-requiredRatio,hiddenPasswordCount', -6.171641826629639],
    ],
    bias: -0.6655139923095703,
    cutoff: 0.49,
};

const register = {
    name: 'register',
    coeffs: FORM_COMBINED_FEATURES.map((key) => {
        var _a, _b;
        return [
            `register-${key}`,
            (_b =
                (_a = results$8.coeffs.find(([feature]) => feature === `register-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$8.bias,
    cutoff: results$8.cutoff,
    getRules: () => [
        rule(type('form'), type('register'), {}),
        ...FORM_COMBINED_FEATURES.map((key) =>
            rule(type('register'), featureScore('form', key), {
                name: `register-${key}`,
            })
        ),
        ...outRuleForm('register'),
    ],
};

const results$7 = {
    coeffs: [
        ['recovery-fieldsCount', 3.0509135723114014],
        ['recovery-inputCount', 0.9485257267951965],
        ['recovery-fieldsetCount', -19.055471420288086],
        ['recovery-textCount', -3.2015998363494873],
        ['recovery-textareaCount', -20.901611328125],
        ['recovery-selectCount', -14.555231094360352],
        ['recovery-checkboxCount', -5.976980686187744],
        ['recovery-radioCount', -6.072755336761475],
        ['recovery-identifierCount', -0.23213031888008118],
        ['recovery-hiddenIdentifierCount', -11.30109691619873],
        ['recovery-usernameCount', 10.550152778625488],
        ['recovery-emailCount', 2.1418087482452393],
        ['recovery-hiddenCount', 2.3576560020446777],
        ['recovery-hiddenPasswordCount', -11.95536994934082],
        ['recovery-submitCount', 12.6376371383667],
        ['recovery-hasTels', -13.558613777160645],
        ['recovery-hasOAuth', -13.58598804473877],
        ['recovery-hasCaptchas', -0.38150671124458313],
        ['recovery-hasFiles', -32.31195831298828],
        ['recovery-hasDate', -6.091900825500488],
        ['recovery-hasNumber', -5.922676086425781],
        ['recovery-oneVisibleField', -6.83229398727417],
        ['recovery-twoVisibleFields', -2.083754539489746],
        ['recovery-threeOrMoreVisibleFields', 4.145813465118408],
        ['recovery-noPasswords', 1.9894477128982544],
        ['recovery-onePassword', -10.954987525939941],
        ['recovery-twoPasswords', -5.993173599243164],
        ['recovery-threeOrMorePasswords', -6.015835285186768],
        ['recovery-noIdentifiers', -13.20419692993164],
        ['recovery-oneIdentifier', 0.09526753425598145],
        ['recovery-twoIdentifiers', 0.27764907479286194],
        ['recovery-threeOrMoreIdentifiers', -5.917731761932373],
        ['recovery-autofocusedIsIdentifier', -0.2582840919494629],
        ['recovery-autofocusedIsPassword', -5.91848087310791],
        ['recovery-visibleRatio', -0.529370903968811],
        ['recovery-inputRatio', -4.122375011444092],
        ['recovery-hiddenRatio', -0.28708261251449585],
        ['recovery-identifierRatio', 0.08778901398181915],
        ['recovery-emailRatio', 1.1405469179153442],
        ['recovery-usernameRatio', 8.708471298217773],
        ['recovery-passwordRatio', -10.283685684204102],
        ['recovery-requiredRatio', 0.23661544919013977],
        ['recovery-pageLogin', -2.596740484237671],
        ['recovery-formTextLogin', -5.908586502075195],
        ['recovery-formAttrsLogin', 0.23752734065055847],
        ['recovery-headingsLogin', 4.262416839599609],
        ['recovery-layoutLogin', -8.079094886779785],
        ['recovery-rememberMeCheckbox', -5.939517021179199],
        ['recovery-troubleLink', 8.427080154418945],
        ['recovery-submitLogin', -5.128698825836182],
        ['recovery-pageRegister', -11.268839836120605],
        ['recovery-formTextRegister', -0.03623312711715698],
        ['recovery-formAttrsRegister', -9.211633682250977],
        ['recovery-headingsRegister', -6.3078484535217285],
        ['recovery-layoutRegister', -7.999567985534668],
        ['recovery-pwNewRegister', -5.925680637359619],
        ['recovery-pwConfirmRegister', -6.052441120147705],
        ['recovery-submitRegister', -7.30578088760376],
        ['recovery-TOSRef', -14.10534381866455],
        ['recovery-pagePwReset', -1.2718092203140259],
        ['recovery-formTextPwReset', -6.061563491821289],
        ['recovery-formAttrsPwReset', 12.729020118713379],
        ['recovery-headingsPwReset', 14.752801895141602],
        ['recovery-layoutPwReset', 6.758541107177734],
        ['recovery-pageRecovery', 17.06692886352539],
        ['recovery-formTextRecovery', 0.04009596258401871],
        ['recovery-formAttrsRecovery', 20.233196258544922],
        ['recovery-headingsRecovery', 5.804493427276611],
        ['recovery-layoutRecovery', 1.901750087738037],
        ['recovery-identifierRecovery', 17.364093780517578],
        ['recovery-submitRecovery', 15.108122825622559],
        ['recovery-formTextMFA', 0.08225894719362259],
        ['recovery-formAttrsMFA', 8.813828468322754],
        ['recovery-headingsMFA', -7.4917311668396],
        ['recovery-layoutMFA', -5.996129512786865],
        ['recovery-buttonVerify', 1.1881924867630005],
        ['recovery-inputsMFA', 9.273831367492676],
        ['recovery-inputsOTP', -1.2287566661834717],
        ['recovery-linkOTPOutlier', -2.5661582946777344],
        ['recovery-newsletterForm', -13.449556350708008],
        ['recovery-multiStepForm', 2.793886661529541],
        ['recovery-multiAuthForm', -6.11293363571167],
        ['recovery-visibleRatio,fieldsCount', 1.8781628608703613],
        ['recovery-visibleRatio,identifierCount', 0.12743981182575226],
        ['recovery-visibleRatio,passwordCount', -9.415108680725098],
        ['recovery-visibleRatio,hiddenIdentifierCount', -12.334178924560547],
        ['recovery-visibleRatio,hiddenPasswordCount', -11.526552200317383],
        ['recovery-identifierRatio,fieldsCount', 2.6660234928131104],
        ['recovery-identifierRatio,identifierCount', 1.6455276012420654],
        ['recovery-identifierRatio,passwordCount', -11.797008514404297],
        ['recovery-identifierRatio,hiddenIdentifierCount', -24.8070011138916],
        ['recovery-identifierRatio,hiddenPasswordCount', -15.780255317687988],
        ['recovery-passwordRatio,fieldsCount', -9.67392349243164],
        ['recovery-passwordRatio,identifierCount', -11.883747100830078],
        ['recovery-passwordRatio,passwordCount', -9.664162635803223],
        ['recovery-passwordRatio,hiddenIdentifierCount', -6.042234897613525],
        ['recovery-passwordRatio,hiddenPasswordCount', -6.06904935836792],
        ['recovery-requiredRatio,fieldsCount', 5.016168594360352],
        ['recovery-requiredRatio,identifierCount', -0.7560825347900391],
        ['recovery-requiredRatio,passwordCount', -6.535095691680908],
        ['recovery-requiredRatio,hiddenIdentifierCount', 10.110904693603516],
        ['recovery-requiredRatio,hiddenPasswordCount', -10.707633018493652],
    ],
    bias: -4.289114952087402,
    cutoff: 0.51,
};

const recovery = {
    name: 'recovery',
    coeffs: FORM_COMBINED_FEATURES.map((key) => {
        var _a, _b;
        return [
            `recovery-${key}`,
            (_b =
                (_a = results$7.coeffs.find(([feature]) => feature === `recovery-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$7.bias,
    cutoff: results$7.cutoff,
    getRules: () => [
        rule(type('form'), type('recovery'), {}),
        ...FORM_COMBINED_FEATURES.map((key) =>
            rule(type('recovery'), featureScore('form', key), {
                name: `recovery-${key}`,
            })
        ),
        ...outRuleForm('recovery'),
    ],
};

const results$6 = {
    coeffs: [
        ['mfa-fieldsCount', -2.6731696128845215],
        ['mfa-inputCount', -2.2228450775146484],
        ['mfa-fieldsetCount', 9.996028900146484],
        ['mfa-textCount', -3.655107259750366],
        ['mfa-textareaCount', -10.198448181152344],
        ['mfa-selectCount', -6.08074426651001],
        ['mfa-checkboxCount', 8.975074768066406],
        ['mfa-radioCount', -6.011116981506348],
        ['mfa-identifierCount', -2.613431215286255],
        ['mfa-hiddenIdentifierCount', -3.587902784347534],
        ['mfa-usernameCount', -2.9215521812438965],
        ['mfa-emailCount', -6.270970821380615],
        ['mfa-hiddenCount', -2.3780431747436523],
        ['mfa-hiddenPasswordCount', -2.84922456741333],
        ['mfa-submitCount', -3.449080467224121],
        ['mfa-hasTels', 13.568304061889648],
        ['mfa-hasOAuth', -6.019924163818359],
        ['mfa-hasCaptchas', -3.7737157344818115],
        ['mfa-hasFiles', -5.990356922149658],
        ['mfa-hasDate', -5.952977180480957],
        ['mfa-hasNumber', 10.605168342590332],
        ['mfa-oneVisibleField', -1.2528215646743774],
        ['mfa-twoVisibleFields', -5.600258827209473],
        ['mfa-threeOrMoreVisibleFields', -1.0854235887527466],
        ['mfa-noPasswords', 0.16286639869213104],
        ['mfa-onePassword', -5.355136394500732],
        ['mfa-twoPasswords', -6.039747714996338],
        ['mfa-threeOrMorePasswords', -5.968755722045898],
        ['mfa-noIdentifiers', -1.417952537536621],
        ['mfa-oneIdentifier', -3.975621223449707],
        ['mfa-twoIdentifiers', -0.5751435160636902],
        ['mfa-threeOrMoreIdentifiers', 8.116541862487793],
        ['mfa-autofocusedIsIdentifier', -5.7114410400390625],
        ['mfa-autofocusedIsPassword', 7.967630386352539],
        ['mfa-visibleRatio', -1.9891396760940552],
        ['mfa-inputRatio', -2.454275369644165],
        ['mfa-hiddenRatio', -2.2831645011901855],
        ['mfa-identifierRatio', -2.295639991760254],
        ['mfa-emailRatio', -5.9511494636535645],
        ['mfa-usernameRatio', -3.410689115524292],
        ['mfa-passwordRatio', -5.839332580566406],
        ['mfa-requiredRatio', 0.6985671520233154],
        ['mfa-pageLogin', 0.6162661910057068],
        ['mfa-formTextLogin', -6.057806968688965],
        ['mfa-formAttrsLogin', -1.924587607383728],
        ['mfa-headingsLogin', -5.274256706237793],
        ['mfa-layoutLogin', -0.4688253104686737],
        ['mfa-rememberMeCheckbox', 10.623744010925293],
        ['mfa-troubleLink', -3.506403684616089],
        ['mfa-submitLogin', 1.0306404829025269],
        ['mfa-pageRegister', -4.3822174072265625],
        ['mfa-formTextRegister', 0.048085324466228485],
        ['mfa-formAttrsRegister', -4.0025506019592285],
        ['mfa-headingsRegister', -7.492600917816162],
        ['mfa-layoutRegister', -2.109463691711426],
        ['mfa-pwNewRegister', -6.004688262939453],
        ['mfa-pwConfirmRegister', -5.929195880889893],
        ['mfa-submitRegister', -5.933011531829834],
        ['mfa-TOSRef', -2.2832584381103516],
        ['mfa-pagePwReset', -7.561761379241943],
        ['mfa-formTextPwReset', -5.996606349945068],
        ['mfa-formAttrsPwReset', -6.039031982421875],
        ['mfa-headingsPwReset', -6.056281566619873],
        ['mfa-layoutPwReset', -6.071103096008301],
        ['mfa-pageRecovery', 2.956407308578491],
        ['mfa-formTextRecovery', -0.04614092782139778],
        ['mfa-formAttrsRecovery', -6.540029525756836],
        ['mfa-headingsRecovery', -6.110831260681152],
        ['mfa-layoutRecovery', 1.7731280326843262],
        ['mfa-identifierRecovery', -5.918033599853516],
        ['mfa-submitRecovery', -0.1865808218717575],
        ['mfa-formTextMFA', 0.07793878763914108],
        ['mfa-formAttrsMFA', 16.42401695251465],
        ['mfa-headingsMFA', 18.67612075805664],
        ['mfa-layoutMFA', 14.353864669799805],
        ['mfa-buttonVerify', 18.148052215576172],
        ['mfa-inputsMFA', 18.946250915527344],
        ['mfa-inputsOTP', 18.564664840698242],
        ['mfa-linkOTPOutlier', -2.0186338424682617],
        ['mfa-newsletterForm', -6.032262802124023],
        ['mfa-multiStepForm', 3.9406278133392334],
        ['mfa-multiAuthForm', -6.030083656311035],
        ['mfa-visibleRatio,fieldsCount', -0.24225614964962006],
        ['mfa-visibleRatio,identifierCount', -1.9667729139328003],
        ['mfa-visibleRatio,passwordCount', -4.883650779724121],
        ['mfa-visibleRatio,hiddenIdentifierCount', -8.37145709991455],
        ['mfa-visibleRatio,hiddenPasswordCount', -2.070051670074463],
        ['mfa-identifierRatio,fieldsCount', 0.4767811894416809],
        ['mfa-identifierRatio,identifierCount', -1.327736258506775],
        ['mfa-identifierRatio,passwordCount', -5.596673965454102],
        ['mfa-identifierRatio,hiddenIdentifierCount', -1.0731645822525024],
        ['mfa-identifierRatio,hiddenPasswordCount', -0.12805478274822235],
        ['mfa-passwordRatio,fieldsCount', -5.375885963439941],
        ['mfa-passwordRatio,identifierCount', -5.433033466339111],
        ['mfa-passwordRatio,passwordCount', -5.865413665771484],
        ['mfa-passwordRatio,hiddenIdentifierCount', -8.409388542175293],
        ['mfa-passwordRatio,hiddenPasswordCount', -6.019865036010742],
        ['mfa-requiredRatio,fieldsCount', -3.626509189605713],
        ['mfa-requiredRatio,identifierCount', -2.664316177368164],
        ['mfa-requiredRatio,passwordCount', -3.9976022243499756],
        ['mfa-requiredRatio,hiddenIdentifierCount', -6.035562038421631],
        ['mfa-requiredRatio,hiddenPasswordCount', -5.994202613830566],
    ],
    bias: -2.8515613079071045,
    cutoff: 0.5,
};

const mfa = {
    name: 'mfa',
    coeffs: FORM_COMBINED_FEATURES.map((key) => {
        var _a, _b;
        return [
            `mfa-${key}`,
            (_b =
                (_a = results$6.coeffs.find(([feature]) => feature === `mfa-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$6.bias,
    cutoff: results$6.cutoff,
    getRules: () => [
        rule(type('form'), type('mfa'), {}),
        ...FORM_COMBINED_FEATURES.map((key) =>
            rule(type('mfa'), featureScore('form', key), {
                name: `mfa-${key}`,
            })
        ),
        ...outRuleForm('mfa'),
    ],
};

const getPasswordFieldFeatures = (fnode) => {
    var _a, _b;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, prevField, nextField } = fieldFeatures;
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
    const prevPwHaystack =
        prevField && prevField.getAttribute('type') === 'password' ? getAllFieldHaystacks(prevField) : [];
    const nextPwHaystack =
        nextField && nextField.getAttribute('type') === 'password' ? getAllFieldHaystacks(nextField) : [];
    const prevPwCreate = any(matchPasswordCreate)(prevPwHaystack);
    const prevPwCurrent = any(matchPasswordCurrent)(prevPwHaystack);
    const prevPwConfirm = any(matchPasswordConfirm)(prevPwHaystack);
    const nextPwCreate = any(matchPasswordCreate)(nextPwHaystack);
    const nextPwCurrent = any(matchPasswordCurrent)(nextPwHaystack);
    const nextPwConfirm = any(matchPasswordConfirm)(nextPwHaystack);
    return {
        loginScore: boolInt(fieldFeatures.isFormLogin),
        registerScore: boolInt(fieldFeatures.isFormRegister),
        pwChangeScore: boolInt(fieldFeatures.isFormPWChange),
        exotic: boolInt(fieldFeatures.exotic),
        dangling: boolInt(fieldFeatures.dangling),
        autocompleteNew: boolInt(fieldFeatures.autocomplete === 'new-password'),
        autocompleteCurrent: boolInt(fieldFeatures.autocomplete === 'current-password'),
        autocompleteOff: boolInt(fieldFeatures.autocomplete === 'off'),
        isOnlyPassword:
            (_b = (_a = fieldFeatures.formFeatures) === null || _a === void 0 ? void 0 : _a.onePassword) !== null &&
            _b !== void 0
                ? _b
                : 0,
        prevPwField: boolInt(prevField !== null),
        nextPwField: boolInt(nextField !== null),
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
        prevPwCreate: boolInt(prevPwCreate),
        prevPwCurrent: boolInt(prevPwCurrent),
        prevPwConfirm: boolInt(prevPwConfirm),
        nextPwCreate: boolInt(nextPwCreate),
        nextPwCurrent: boolInt(nextPwCurrent),
        nextPwConfirm: boolInt(nextPwConfirm),
    };
};

const PW_FIELD_FEATURES = [
    'loginScore',
    'registerScore',
    'pwChangeScore',
    'exotic',
    'dangling',
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
    'prevPwCreate',
    'prevPwCurrent',
    'prevPwConfirm',
    'passwordOutlier',
    'nextPwCreate',
    'nextPwCurrent',
    'nextPwConfirm',
];

const results$5 = {
    coeffs: [
        ['pw-loginScore', 12.741226196289062],
        ['pw-registerScore', -13.86349105834961],
        ['pw-pwChangeScore', 1.81883704662323],
        ['pw-exotic', -10.838461875915527],
        ['pw-dangling', 0.18090224266052246],
        ['pw-autocompleteNew', -2.9590678215026855],
        ['pw-autocompleteCurrent', 1.5144751071929932],
        ['pw-autocompleteOff', -6.349379062652588],
        ['pw-isOnlyPassword', 5.372868061065674],
        ['pw-prevPwField', 4.8098626136779785],
        ['pw-nextPwField', -6.758726596832275],
        ['pw-attrCreate', -5.780570030212402],
        ['pw-attrCurrent', 3.270864248275757],
        ['pw-attrConfirm', -7.092981815338135],
        ['pw-attrReset', 0.05076280236244202],
        ['pw-textCreate', -3.242558479309082],
        ['pw-textCurrent', 2.5344574451446533],
        ['pw-textConfirm', -7.2513298988342285],
        ['pw-textReset', -0.08840376883745193],
        ['pw-labelCreate', -7.849752902984619],
        ['pw-labelCurrent', 14.285818099975586],
        ['pw-labelConfirm', -7.330263614654541],
        ['pw-labelReset', 0.014482587575912476],
        ['pw-prevPwCreate', -9.822668075561523],
        ['pw-prevPwCurrent', -10.239123344421387],
        ['pw-prevPwConfirm', -0.047009289264678955],
        ['pw-passwordOutlier', -7.596221446990967],
        ['pw-nextPwCreate', 12.55499267578125],
        ['pw-nextPwCurrent', -8.32299518585205],
        ['pw-nextPwConfirm', -7.392651081085205],
    ],
    bias: -4.597991943359375,
    cutoff: 0.5,
};

const password = {
    name: 'password',
    coeffs: PW_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `pw-${key}`,
            (_b =
                (_a = results$5.coeffs.find(([feature]) => feature === `pw-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$5.bias,
    cutoff: results$5.cutoff,
    getRules: () => [
        rule(type('password-field'), type('password'), {}),
        ...PW_FIELD_FEATURES.map((key) =>
            rule(type('password'), featureScore('password-field', key), {
                name: `pw-${key}`,
            })
        ),
        ...outRuleField('password'),
    ],
};

const results$4 = {
    coeffs: [
        ['pw[new]-loginScore', -11.162877082824707],
        ['pw[new]-registerScore', 13.829694747924805],
        ['pw[new]-pwChangeScore', 1.4379976987838745],
        ['pw[new]-exotic', 15.940305709838867],
        ['pw[new]-dangling', -0.14859716594219208],
        ['pw[new]-autocompleteNew', 1.0858794450759888],
        ['pw[new]-autocompleteCurrent', -1.1341941356658936],
        ['pw[new]-autocompleteOff', -1.168283224105835],
        ['pw[new]-isOnlyPassword', -1.7832937240600586],
        ['pw[new]-prevPwField', 0.5666388273239136],
        ['pw[new]-nextPwField', 9.589034080505371],
        ['pw[new]-attrCreate', 4.041395664215088],
        ['pw[new]-attrCurrent', 1.8431682586669922],
        ['pw[new]-attrConfirm', 7.692188262939453],
        ['pw[new]-attrReset', 0.09458547830581665],
        ['pw[new]-textCreate', 1.7514764070510864],
        ['pw[new]-textCurrent', -1.8470430374145508],
        ['pw[new]-textConfirm', -15.453252792358398],
        ['pw[new]-textReset', 0.016416683793067932],
        ['pw[new]-labelCreate', 8.397684097290039],
        ['pw[new]-labelCurrent', -13.213261604309082],
        ['pw[new]-labelConfirm', 7.832075119018555],
        ['pw[new]-labelReset', 0.10784879326820374],
        ['pw[new]-prevPwCreate', 11.309661865234375],
        ['pw[new]-prevPwCurrent', 8.943239212036133],
        ['pw[new]-prevPwConfirm', -0.07857400923967361],
        ['pw[new]-passwordOutlier', -28.52092170715332],
        ['pw[new]-nextPwCreate', -11.67248821258545],
        ['pw[new]-nextPwCurrent', 8.431107521057129],
        ['pw[new]-nextPwConfirm', 9.392668724060059],
    ],
    bias: -3.6639139652252197,
    cutoff: 0.5,
};

const newPassword = {
    name: 'new-password',
    coeffs: PW_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `pw[new]-${key}`,
            (_b =
                (_a = results$4.coeffs.find(([feature]) => feature === `pw[new]-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$4.bias,
    cutoff: results$4.cutoff,
    getRules: () => [
        rule(type('password-field'), type('new-password'), {}),
        ...PW_FIELD_FEATURES.map((key) =>
            rule(type('new-password'), featureScore('password-field', key), {
                name: `pw[new]-${key}`,
            })
        ),
        ...outRuleField('new-password'),
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
    };
};

const USERNAME_FIELD_FEATURES = [
    'autocompleteUsername',
    'autocompleteNickname',
    'autocompleteEmail',
    'autocompleteOff',
    'attrUsername',
    'textUsername',
    'labelUsername',
    'outlierUsername',
    'loginUsername',
];

const results$3 = {
    coeffs: [
        ['username-autocompleteUsername', 8.468774795532227],
        ['username-autocompleteNickname', -0.0757804811000824],
        ['username-autocompleteEmail', -6.6644792556762695],
        ['username-autocompleteOff', -0.41136834025382996],
        ['username-attrUsername', 18.36060905456543],
        ['username-textUsername', 15.9617919921875],
        ['username-labelUsername', 17.661033630371094],
        ['username-outlierUsername', -0.14113228023052216],
        ['username-loginUsername', 18.409337997436523],
    ],
    bias: -9.779800415039062,
    cutoff: 0.5,
};

const username = {
    name: 'username',
    coeffs: USERNAME_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `username-${key}`,
            (_b =
                (_a = results$3.coeffs.find(([feature]) => feature === `username-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$3.bias,
    cutoff: results$3.cutoff,
    getRules: () => [
        rule(type('field').when(maybeUsername), type('username-field').note(getUsernameFieldFeatures), {}),
        rule(type('username-field'), type('username'), {}),
        ...USERNAME_FIELD_FEATURES.map((key) =>
            rule(type('username'), featureScore('username-field', key), {
                name: `username-${key}`,
            })
        ),
        ...outRuleField('username'),
    ],
};

const getHiddenUserFieldFeatures = (fnode) => {
    const field = fnode.element;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, autocomplete } = fieldFeatures;
    const attrUsername = any(matchUsernameAttr)(fieldAttrs);
    const attrEmail = any(matchEmailAttr)(fieldAttrs);
    const usernameName = field.matches('[name="username"]');
    const autocompleteUsername = autocomplete === 'username';
    const valueEmail = matchEmailValue(fieldFeatures.value);
    const valueTel = matchTelValue(fieldFeatures.value);
    const valueUsername = matchUsernameValue(fieldFeatures.value);
    return {
        exotic: fieldFeatures.exotic,
        dangling: fieldFeatures.dangling,
        attrUsername: boolInt(attrUsername),
        attrEmail: boolInt(attrEmail),
        usernameName: boolInt(usernameName),
        autocompleteUsername: boolInt(autocompleteUsername),
        hiddenEmailValue: boolInt(valueEmail),
        hiddenTelValue: boolInt(valueTel),
        hiddenUsernameValue: boolInt(valueUsername),
    };
};

const HIDDEN_USER_FIELD_FEATURES = [
    'exotic',
    'dangling',
    'attrUsername',
    'attrEmail',
    'usernameName',
    'autocompleteUsername',
    'hiddenEmailValue',
    'hiddenTelValue',
    'hiddenUsernameValue',
];

const results$2 = {
    coeffs: [
        ['username[hidden]-exotic', -7.487351894378662],
        ['username[hidden]-dangling', -0.006903290748596191],
        ['username[hidden]-attrUsername', 14.12521743774414],
        ['username[hidden]-attrEmail', 13.004671096801758],
        ['username[hidden]-usernameName', 16.296220779418945],
        ['username[hidden]-autocompleteUsername', 1.263319969177246],
        ['username[hidden]-hiddenEmailValue', 14.688769340515137],
        ['username[hidden]-hiddenTelValue', 6.3957695960998535],
        ['username[hidden]-hiddenUsernameValue', -0.8634605407714844],
    ],
    bias: -20.697078704833984,
    cutoff: 0.5,
};

const usernameHidden = {
    name: 'username-hidden',
    coeffs: HIDDEN_USER_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `username[hidden]-${key}`,
            (_b =
                (_a = results$2.coeffs.find(([feature]) => feature === `username[hidden]-${key}`)) === null ||
                _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$2.bias,
    cutoff: results$2.cutoff,
    getRules: () => [
        rule(
            type('field').when(maybeHiddenUsername),
            type('username-hidden-field').note(getHiddenUserFieldFeatures),
            {}
        ),
        rule(type('username-hidden-field'), type('username-hidden'), {}),
        ...HIDDEN_USER_FIELD_FEATURES.map((key) =>
            rule(type('username-hidden'), featureScore('username-hidden-field', key), {
                name: `username[hidden]-${key}`,
            })
        ),
        ...outRuleField('username-hidden'),
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
    const placeholderEmail = any(or([matchEmailValue, matchEmail]))(field.placeholder.split(' '));
    const attrSearch = any(matchSearchAction)(fieldAttrs);
    const textSearch = matchSearchAction(fieldText);
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
        attrSearch: boolInt(attrSearch),
        textSearch: boolInt(textSearch),
    };
};

const EMAIL_FIELD_FEATURES = [
    'autocompleteUsername',
    'autocompleteNickname',
    'autocompleteEmail',
    'typeEmail',
    'exactAttrEmail',
    'attrEmail',
    'textEmail',
    'labelEmail',
    'placeholderEmail',
    'attrSearch',
    'textSearch',
];

const results$1 = {
    coeffs: [
        ['email-autocompleteUsername', 1.122658371925354],
        ['email-autocompleteNickname', -0.16873179376125336],
        ['email-autocompleteEmail', 6.311023235321045],
        ['email-typeEmail', 14.559440612792969],
        ['email-exactAttrEmail', 12.556611061096191],
        ['email-attrEmail', 2.4825501441955566],
        ['email-textEmail', 14.048609733581543],
        ['email-labelEmail', 16.830373764038086],
        ['email-placeholderEmail', 14.356231689453125],
        ['email-attrSearch', -11.741899490356445],
        ['email-textSearch', -14.54428768157959],
    ],
    bias: -9.311630249023438,
    cutoff: 0.99,
};

const email = {
    name: 'email',
    coeffs: EMAIL_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `email-${key}`,
            (_b =
                (_a = results$1.coeffs.find(([feature]) => feature === `email-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$1.bias,
    cutoff: results$1.cutoff,
    getRules: () => [
        rule(type('field').when(maybeEmail), type('email-field').note(getEmailFieldFeatures), {}),
        rule(type('email-field'), type('email'), {}),
        ...EMAIL_FIELD_FEATURES.map((key) =>
            rule(type('email'), featureScore('email-field', key), {
                name: `email-${key}`,
            })
        ),
        ...outRuleField('email'),
    ],
};

const { linearScale } = utils;

const getOTPFieldFeatures = (fnode) => {
    var _a, _b, _c, _d;
    const field = fnode.element;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, prevField, nextField, type, minLength, maxLength } = fieldFeatures;
    const form = (_a = fieldFeatures.formFnode) === null || _a === void 0 ? void 0 : _a.element;
    const formMfa = fieldFeatures.isFormMFA;
    const linkOTPOutlier = Boolean(
        (_b = fieldFeatures === null || fieldFeatures === void 0 ? void 0 : fieldFeatures.formFeatures) === null ||
            _b === void 0
            ? void 0
            : _b.linkOTPOutlier
    );
    const formCheckboxCount =
        (_d =
            (_c = fieldFeatures === null || fieldFeatures === void 0 ? void 0 : fieldFeatures.formFeatures) === null ||
            _c === void 0
                ? void 0
                : _c.checkboxCount) !== null && _d !== void 0
            ? _d
            : 0;
    const formInnerText = form && formMfa ? form.innerText : '';
    const patternOTP = OTP_PATTERNS.includes(field.pattern);
    const exactAttr = ['code', 'token', 'otp', 'otc', 'totp'];
    const nameMatch = exactAttr.some((match) => field.name === match);
    const idMatch = exactAttr.some((match) => field.id === match);
    const { area, top, bottom, width } = getNodeRect(field);
    const maybeGroup = width < 100;
    const prevRect = prevField ? getNodeRect(prevField) : null;
    const nextRect = nextField ? getNodeRect(nextField) : null;
    const prevCheck =
        maybeGroup &&
        prevField &&
        (prevField === null || prevField === void 0 ? void 0 : prevField.getAttribute('type')) === type;
    const nextCheck =
        maybeGroup &&
        nextField &&
        (nextField === null || nextField === void 0 ? void 0 : nextField.getAttribute('type')) === type;
    const prevAligned = prevCheck
        ? top === (prevRect === null || prevRect === void 0 ? void 0 : prevRect.top) &&
          bottom === (prevRect === null || prevRect === void 0 ? void 0 : prevRect.bottom)
        : false;
    const prevArea = prevCheck ? area === (prevRect === null || prevRect === void 0 ? void 0 : prevRect.area) : false;
    const nextAligned = nextCheck
        ? top === (nextRect === null || nextRect === void 0 ? void 0 : nextRect.top) &&
          bottom === (nextRect === null || nextRect === void 0 ? void 0 : nextRect.top)
        : false;
    const nextArea = nextCheck ? area === (nextRect === null || nextRect === void 0 ? void 0 : nextRect.area) : false;
    const attrOTP = any(matchOtpAttr)(fieldAttrs);
    const attrMFA = any(matchMfaAttr)(fieldAttrs);
    const attrOutlier = any(matchOtpOutlier)(fieldAttrs);
    const textOTP = matchOtpAttr(fieldText);
    const textMFA = matchMfa(fieldText);
    const labelOTP = matchOtpAttr(labelText);
    const labelMFA = matchMfa(labelText);
    const labelOutlier = matchOtpOutlier(labelText);
    const parents = [getNthParent(field)(1), getNthParent(field)(2)];
    const wrapperAttrs = parents.flatMap(getBaseAttributes);
    const wrapperOTP = any(matchOtpAttr)(wrapperAttrs);
    const wrapperOutlier = any(matchOtpOutlier)(wrapperAttrs);
    const emailOutlierCount = (formInnerText.match(/@/g) || []).length;
    return {
        mfaScore: boolInt(formMfa),
        exotic: boolInt(fieldFeatures.exotic),
        dangling: boolInt(fieldFeatures.dangling),
        linkOTPOutlier: boolInt(formMfa && linkOTPOutlier),
        hasCheckboxes: boolInt(formMfa && formCheckboxCount > 0),
        hidden: boolInt(!fieldFeatures.visible),
        required: boolInt(fieldFeatures.required),
        nameMatch: boolInt(nameMatch),
        idMatch: boolInt(idMatch),
        numericMode: boolInt(field.inputMode === 'numeric'),
        autofocused: boolInt(field.autofocus),
        tabIndex1: boolInt(field.tabIndex === 1),
        patternOTP: boolInt(patternOTP),
        maxLength1: boolInt(maxLength === 1),
        maxLength5: boolInt(maxLength === 5),
        minLength6: boolInt(minLength === 6),
        maxLength6: boolInt(maxLength === 6),
        maxLength20: boolInt(maxLength === 20),
        autocompleteOTC: boolInt(fieldFeatures.autocomplete === 'one-time-code'),
        autocompleteOff: boolInt(fieldFeatures.autocomplete === 'off'),
        prevAligned: boolInt(prevAligned),
        prevArea: boolInt(prevArea),
        nextAligned: boolInt(nextAligned),
        nextArea: boolInt(nextArea),
        attrMFA: boolInt(attrMFA),
        attrOTP: boolInt(attrOTP),
        attrOutlier: boolInt(attrOutlier),
        textMFA: boolInt(textMFA),
        textOTP: boolInt(textOTP),
        labelMFA: boolInt(labelMFA),
        labelOTP: boolInt(labelOTP),
        labelOutlier: boolInt(labelOutlier),
        wrapperOTP: boolInt(wrapperOTP),
        wrapperOutlier: boolInt(wrapperOutlier),
        emailOutlierCount: linearScale(emailOutlierCount, 0, 2),
    };
};

const OTP_FIELD_FEATURES = [
    'mfaScore',
    'exotic',
    'dangling',
    'linkOTPOutlier',
    'hasCheckboxes',
    'hidden',
    'required',
    'nameMatch',
    'idMatch',
    'numericMode',
    'autofocused',
    'tabIndex1',
    'patternOTP',
    'maxLength1',
    'maxLength5',
    'minLength6',
    'maxLength6',
    'maxLength20',
    'autocompleteOTC',
    'autocompleteOff',
    'prevAligned',
    'prevArea',
    'nextAligned',
    'nextArea',
    'attrMFA',
    'attrOTP',
    'attrOutlier',
    'textMFA',
    'textOTP',
    'labelMFA',
    'labelOTP',
    'labelOutlier',
    'wrapperOTP',
    'wrapperOutlier',
    'emailOutlierCount',
];

const results = {
    coeffs: [
        ['otp-mfaScore', 17.45772361755371],
        ['otp-exotic', -8.188331604003906],
        ['otp-dangling', 0.05132289230823517],
        ['otp-linkOTPOutlier', -17.21240997314453],
        ['otp-hasCheckboxes', 7.274846076965332],
        ['otp-hidden', 0.1544620394706726],
        ['otp-required', 3.8088889122009277],
        ['otp-nameMatch', -4.380471229553223],
        ['otp-idMatch', 9.031607627868652],
        ['otp-numericMode', 13.775334358215332],
        ['otp-autofocused', 5.1578545570373535],
        ['otp-tabIndex1', 0.38117101788520813],
        ['otp-patternOTP', -13.401349067687988],
        ['otp-maxLength1', 5.926958084106445],
        ['otp-maxLength5', -8.396753311157227],
        ['otp-minLength6', 13.921578407287598],
        ['otp-maxLength6', 22.06261444091797],
        ['otp-maxLength20', 5.86139440536499],
        ['otp-autocompleteOTC', -0.11714930832386017],
        ['otp-autocompleteOff', -3.9937336444854736],
        ['otp-prevAligned', 3.116943120956421],
        ['otp-prevArea', 3.30014705657959],
        ['otp-nextAligned', 0.01313084363937378],
        ['otp-nextArea', 6.2670578956604],
        ['otp-attrMFA', 10.01120376586914],
        ['otp-attrOTP', 11.517399787902832],
        ['otp-attrOutlier', -6.922715663909912],
        ['otp-textMFA', 12.75284194946289],
        ['otp-textOTP', -7.3702592849731445],
        ['otp-labelMFA', 2.657449960708618],
        ['otp-labelOTP', -0.03861270844936371],
        ['otp-labelOutlier', -6.940068244934082],
        ['otp-wrapperOTP', 17.79810333251953],
        ['otp-wrapperOutlier', -6.323063373565674],
        ['otp-emailOutlierCount', -18.707378387451172],
    ],
    bias: -17.03288459777832,
    cutoff: 0.5,
};

const otp = {
    name: 'otp',
    coeffs: OTP_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `otp-${key}`,
            (_b =
                (_a = results.coeffs.find(([feature]) => feature === `otp-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results.bias,
    cutoff: results.cutoff,
    getRules: () => [
        rule(type('field').when(maybeOTP), type('otp-field').note(getOTPFieldFeatures), {}),
        rule(type('otp-field'), type('otp'), {}),
        ...OTP_FIELD_FEATURES.map((key) =>
            rule(type('otp'), featureScore('otp-field', key), {
                name: `otp-${key}`,
            })
        ),
        ...outRuleField('otp'),
    ],
};

const { clusters } = clusters$1;

const CLUSTER_MAX_X_DIST = 50;

const CLUSTER_MAX_Y_DIST = 275;

const CLUSTER_ALIGNMENT_TOLERANCE = 0.05;

const CLUSTER_TABLE_MAX_COLS = 3;

const CLUSTER_TABLE_MAX_AREA = 15e4;

const CLUSTER_MAX_ELEMENTS = 50;

const context = {
    cache: new WeakMap(),
};

const getElementData = (el) => {
    var _a;
    const data =
        (_a = context.cache.get(el)) !== null && _a !== void 0
            ? _a
            : {
                  isField: el.matches(fieldSelector) && el.matches(':not([type="submit"])'),
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

const clusterExclusions = (doc) => {
    const forms = selectForms(doc);
    const predetected = Array.from(
        doc.querySelectorAll(`[${DETECTED_FORM_TYPE_ATTR}], [${DETECTED_CLUSTER_ATTR}], [${IGNORE_ELEMENT_ATTR}]`)
    );
    const tables = Array.from(doc.querySelectorAll('table')).filter(
        withIgnoreFlag((table) => {
            if (forms.some((form) => form.contains(table) || table.contains(form))) return false;
            if (table.querySelector('thead') !== null) return true;
            if (table.querySelector('table')) return false;
            const cellCount = Math.max(...Array.from(table.rows).map((row) => row.cells.length));
            if (cellCount > CLUSTER_TABLE_MAX_COLS) return true;
            return getNodeRect(table).area > CLUSTER_TABLE_MAX_AREA;
        })
    );
    return predetected.concat(forms, tables);
};

const handleSingletonCluster = (cluster) => {
    const node = cluster[0];
    return walkUpWhile(
        node,
        5
    )((_, candidate) => candidate === node || candidate.querySelectorAll(buttonSelector).length === 0);
};

const getFormLikeClusters = (doc) => {
    const excluded = clusterExclusions(doc);
    const clusterable = (els) => els.filter((el) => !excluded.some((ex) => ex.contains(el)) && isVisibleField(el));
    const fields = clusterable(
        Array.from(doc.querySelectorAll(fieldSelector)).filter((el) => el.getAttribute('type') !== 'hidden')
    );
    const inputs = fields.filter((el) => el.matches(inputSelector));
    if (inputs.length === 0 || inputs.length > CLUSTER_MAX_ELEMENTS) return [];
    const domGroups = Array.from(doc.querySelectorAll(domGroupSelector)).filter((el) => el !== document.body);
    const positionedEls = findStackedParents(inputs, 20);
    const groups = pruneNested(
        domGroups.filter((el) => !positionedEls.some((stack) => el.contains(stack))).concat(positionedEls)
    );
    const buttons = clusterable(
        Array.from(document.querySelectorAll(buttonSubmitSelector)).filter(isSubmitBtnCandidate)
    );
    const candidates = uniqueNodes(fields, buttons);
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
        .filter((ancestor) => document.body !== ancestor && ancestor.querySelectorAll(inputSelector).length > 0);
    const result = pruneNested(ancestors);
    result.forEach(setClusterFlag);
    context.cache = new WeakMap();
    return result;
};

const formLikeDom = () => domQuery(getFormLikeClusters);

const getFieldFeature = (fnode) => {
    var _a, _b, _c;
    const field = fnode.element;
    const fieldHaystacks = getFieldHaystacks(field);
    const formFnode = getParentFnodeVisibleForm(fnode);
    if (formFnode !== null && !formFnode.hasNoteFor('form')) formFnode.setNoteFor('form', getFormFeatures(formFnode));
    const form =
        (_a = formFnode === null || formFnode === void 0 ? void 0 : formFnode.element) !== null && _a !== void 0
            ? _a
            : field.closest('form');
    const formFeatures = formFnode === null || formFnode === void 0 ? void 0 : formFnode.noteFor('form');
    const isFormLogin = getFormTypeScore(formFnode, 'login') > 0.5;
    const isFormRegister = getFormTypeScore(formFnode, 'register') > 0.5;
    const isFormPWChange = getFormTypeScore(formFnode, 'password-change') > 0.5;
    const isFormRecovery = getFormTypeScore(formFnode, 'recovery') > 0.5;
    const isFormMFA = getFormTypeScore(formFnode, 'mfa') > 0.5;
    const detectionResults = [isFormLogin, isFormRegister, isFormPWChange, isFormRecovery, isFormMFA];
    const dangling = form === undefined || form === null;
    const exotic = !dangling && detectionResults.every((detected) => !detected);
    const value = field.value;
    const type = field.getAttribute('type');
    const readonly = field.readOnly;
    const required = field.required;
    const minLength = safeInt(field.minLength, 0);
    const maxLength = safeInt(field.maxLength, 250);
    const pattern = field.pattern;
    const autocomplete = field.autocomplete;
    const disabled = field.disabled;
    const typeValid = type !== 'hidden';
    const tabIndex = field.tabIndex;
    const visible = typeValid
        ? isVisibleField(field) &&
          isVisible(field, {
              opacity: dangling,
          })
        : false;
    const prevField = typeValid
        ? (_b =
              formFeatures === null || formFeatures === void 0
                  ? void 0
                  : formFeatures.formInputIterator.prev(field)) !== null && _b !== void 0
            ? _b
            : null
        : null;
    const nextField = typeValid
        ? (_c =
              formFeatures === null || formFeatures === void 0
                  ? void 0
                  : formFeatures.formInputIterator.next(field)) !== null && _c !== void 0
            ? _c
            : null
        : null;
    return Object.assign(
        {
            formFnode,
            formFeatures,
            isFormLogin,
            isFormRegister,
            isFormPWChange,
            isFormRecovery,
            isFormMFA,
            exotic,
            dangling,
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
        },
        fieldHaystacks
    );
};

const definitions = [
    login,
    register,
    passwordChange,
    recovery,
    mfa,
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
        mfa,
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
                rule(dom('form').when(withFnodeEl(formFilter)), type('form-element'), {}),
                rule(formLikeDom(), type('form-element'), {}),
                rule(dom(preDetectedClusterSelector), type('form-element'), {}),
                rule(type('form-element').when(withFnodeEl(isVisibleForm)), type('form').note(getFormFeatures), {}),
                rule(type('form-element'), out('form').through(processFormEffect), {}),
                rule(dom('input').when(fieldFilter), type('field').note(getFieldFeature), {}),
                rule(type('field').when(maybePassword), type('password-field').note(getPasswordFieldFeatures), {}),
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
    selectForms.clearCache();
    selectInputs.clearCache();
};

export {
    DETECTED_CLUSTER_ATTR,
    DETECTED_FIELD_TYPE_ATTR,
    DETECTED_FORM_TYPE_ATTR,
    EL_ATTRIBUTES,
    FIELD_ATTRIBUTES,
    FORM_ATTRIBUTES,
    IGNORE_ELEMENT_ATTR,
    PROCESSED_FIELD_ATTR,
    PROCESSED_FORM_ATTR,
    TEXT_ATTRIBUTES,
    anchorLinkSelector,
    buttonSelector,
    buttonSubmitSelector,
    cacheContext,
    captchaSelector,
    clearDetectionCache,
    clearVisibilityCache,
    createInputIterator,
    danglingFieldFilter,
    detectedFormSelector,
    detectedSelector,
    domGroupSelector,
    fieldFilter,
    fieldSelector,
    formFilter,
    getAttributes,
    getBaseAttributes,
    getDetectedFormParent,
    getFieldAttributes,
    getFormAttributes,
    getFormParent,
    getIgnoredParent,
    getTextAttributes,
    getVisibilityCache,
    headingSelector,
    hiddenUsernameSelector,
    ignoredSelector,
    inputFilter,
    inputSelector,
    isActiveField,
    isEmailCandidate,
    isFieldProcessed,
    isFormProcessed,
    isOAuthCandidate,
    isSubmitBtnCandidate,
    isUsernameCandidate,
    isVisible,
    isVisibleEl,
    isVisibleField,
    isVisibleForm,
    layoutSelector,
    maybeEmail,
    maybeHiddenUsername,
    maybeOTP,
    maybePassword,
    maybeUsername,
    otpSelector,
    passwordSelector,
    preDetectedClusterSelector,
    processFieldEffect,
    processFormEffect,
    rulesetMaker,
    selectAllForms,
    selectDanglingInputs,
    selectForms,
    selectInputs,
    selectUnprocessedForms,
    selectUnprocessedInputs,
    setClusterFlag,
    setFieldProcessable,
    setFieldProcessed,
    setFieldType,
    setFormProcessable,
    setFormProcessed,
    setFormType,
    setIgnoreFlag,
    socialSelector,
    splitFieldsByVisibility,
    trainees,
    typeFieldEffect,
    typeFormEffect,
    unprocessedFieldFilter,
    unprocessedFormFilter,
    withIgnoreFlag,
};
