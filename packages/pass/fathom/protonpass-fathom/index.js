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

const OTP_PATTERNS = [
    [1, 'd*'],
    [6, 'd{6}'],
    [1, '[0-9]*'],
    [6, '[0-9]{6}'],
    [5, '([0-9a-fA-F]{5}-?[0-9a-fA-F]{5})'],
];

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
    'div[style*="font-size: 2"]',
    'div[style*="font-size: 3"]',
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

const setFieldProcessable = (field) => field.removeAttribute(PROCESSED_FIELD_ATTR);

const setFormProcessable = (form) => {
    form.removeAttribute(PROCESSED_FORM_ATTR);
    form.querySelectorAll('input').forEach(setFieldProcessable);
};

const resetFieldFlags = (field) => {
    setFieldProcessable(field);
    field.removeAttribute(DETECTED_FIELD_TYPE_ATTR);
    field.removeAttribute(IGNORE_ELEMENT_ATTR);
};

const resetFormFlags = (form) => {
    setFormProcessable(form);
    form.removeAttribute(DETECTED_FORM_TYPE_ATTR);
    form.removeAttribute(IGNORE_ELEMENT_ATTR);
    form.querySelectorAll('input').forEach(resetFieldFlags);
};

const isFormProcessed = (form) => form.getAttribute(PROCESSED_FORM_ATTR) !== null;

const isFieldProcessed = (field) => field.getAttribute(PROCESSED_FIELD_ATTR) !== null;

const processFormEffect = throughEffect((fnode) => setFormProcessed(fnode.element));

const processFieldEffect = throughEffect((fnode) => {
    const { visible, type } = fnode.noteFor('field');
    if (visible || type === 'hidden') setFieldProcessed(fnode.element);
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

const belongsToType = (type) => (fnode) => fnode.scoreFor(type) > 0.5;

const hasDetectedType = (attr, type) => (fnode) => {
    const types = fnode.element.getAttribute(attr);
    return types ? types.split(',').includes(type) : false;
};

const getFormTypeScore = (formFnode, type) => {
    if (!formFnode) return 0;
    if (hasDetectedType(DETECTED_FORM_TYPE_ATTR, type)(formFnode)) return 1;
    return formFnode === null || formFnode === void 0 ? void 0 : formFnode.scoreFor(type);
};

const outRuleWithPredetectedAttr = (attr, throughFn) => (typeOut) =>
    [
        rule(dom(`[${attr}]`).when(hasDetectedType(attr, typeOut)), type(`${typeOut}-cache`), {}),
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

const formFilter = (form) => {
    if (form.getAttribute(DETECTED_FORM_TYPE_ATTR) !== null) return false;
    if (form.getAttribute(IGNORE_ELEMENT_ATTR) !== null) return false;
    const fieldCount = form.querySelectorAll(fieldSelector).length;
    const inputCount = form.querySelectorAll(inputSelector).length;
    const invalidCount = inputCount === 0 || inputCount > MAX_INPUTS_PER_FORM || fieldCount > MAX_FIELDS_PER_FORM;
    const pageForm =
        form.matches('body > form') &&
        (() => {
            const bodyElCount = document.body.querySelectorAll('*').length;
            const formElCount = form.querySelectorAll('*').length;
            return formElCount >= bodyElCount * 0.8;
        })();
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
        if (type === 'hidden' || disabled || readOnly || field.getAttribute('aria-hidden') === 'true') return false;
    }
    return quickVisibilityCheck(field, {
        minHeight: MIN_FIELD_HEIGHT,
        minWidth: MIN_FIELD_WIDTH,
    });
};

var FormType;

(function (FormType) {
    FormType['LOGIN'] = 'login';
    FormType['REGISTER'] = 'register';
    FormType['PASSWORD_CHANGE'] = 'password-change';
    FormType['RECOVERY'] = 'recovery';
    FormType['MFA'] = 'mfa';
    FormType['NOOP'] = 'noop';
})(FormType || (FormType = {}));

var FieldType;

(function (FieldType) {
    FieldType['EMAIL'] = 'email';
    FieldType['USERNAME'] = 'username';
    FieldType['USERNAME_HIDDEN'] = 'username-hidden';
    FieldType['PASSWORD_CURRENT'] = 'password';
    FieldType['PASSWORD_NEW'] = 'new-password';
    FieldType['OTP'] = 'otp';
})(FieldType || (FieldType = {}));

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

const getFormClassification = (formFnode) => {
    const login = getFormTypeScore(formFnode, FormType.LOGIN) > 0.5;
    const register = getFormTypeScore(formFnode, FormType.REGISTER) > 0.5;
    const pwChange = getFormTypeScore(formFnode, FormType.PASSWORD_CHANGE) > 0.5;
    const recovery = getFormTypeScore(formFnode, FormType.RECOVERY) > 0.5;
    const mfa = getFormTypeScore(formFnode, FormType.MFA) > 0.5;
    const detectionResults = [login, register, pwChange, recovery, mfa];
    const noop = detectionResults.every((detected) => !detected);
    return {
        login,
        register,
        pwChange,
        recovery,
        mfa,
        noop,
    };
};

const isNoopForm = (formFnode) => getFormClassification(formFnode).noop;

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
    return (
        isVisibleField(el) &&
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
    const selects = visibleFields.filter((el, idx, fields) => {
        var _a;
        return (
            el.matches('select') &&
            ((_a = fields === null || fields === void 0 ? void 0 : fields[idx + 1]) === null || _a === void 0
                ? void 0
                : _a.type) !== 'tel'
        );
    });
    const optionsCount = selects.reduce((total, el) => total + el.querySelectorAll('option').length, 0);
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
    const formTextMFA = matchMfa(formTextAttrText);
    const formAttrsMFA = any(matchMfaAttr)(formAttributes);
    const headingsMFA = matchMfa(nearestHeadingsText);
    const layoutMFA = any(matchMfa)(layoutHaystack);
    const buttonVerify = any(matchMfaAction)(submitBtnHaystack);
    const inputsMFA = any(matchMfaAttr)(mfaInputsHaystack);
    const inputsOTP = any(matchOtpAttr)(mfaInputsHaystack);
    const linkOTPOutlier = any(matchOtpOutlier)(anchorsHaystack.concat(submitBtnHaystack));
    const newsletterForm = any(matchNewsletter)(outlierHaystack);
    const searchForm = any(matchSearchAction)(outlierHaystack);
    const buttonMultiStep = any(matchStepAction)(submitBtnHaystack);
    const headingsMultiStep = matchMultiStep(nearestHeadingsText);
    return {
        fieldsCount: linearScale$1(visibleFields.length, 1, 5),
        inputCount: linearScale$1(visibleInputs.length, 1, 5),
        fieldsetCount: linearScale$1(fieldsets.length, 1, 5),
        textCount: linearScale$1(texts.length, 0, 3),
        textareaCount: linearScale$1(textareas.length, 0, 2),
        selectCount: linearScale$1(selects.length, 0, 2),
        optionsCount: linearScale$1(optionsCount, 0, 5),
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
    'searchForm',
    'multiStepForm',
    'multiAuthForm',
];

const results$a = {
    coeffs: [
        ['login-fieldsCount', 12.126547813415527],
        ['login-inputCount', 11.513879776000977],
        ['login-fieldsetCount', -22.0284423828125],
        ['login-textCount', 1.4647343158721924],
        ['login-textareaCount', -6.125629425048828],
        ['login-selectCount', -6.211742877960205],
        ['login-optionsCount', -6.125824928283691],
        ['login-checkboxCount', 31.494873046875],
        ['login-radioCount', -6.055922508239746],
        ['login-identifierCount', -3.6437995433807373],
        ['login-hiddenIdentifierCount', 4.270657539367676],
        ['login-usernameCount', 18.671463012695312],
        ['login-emailCount', -13.450141906738281],
        ['login-hiddenCount', 9.964166641235352],
        ['login-hiddenPasswordCount', 28.8826904296875],
        ['login-submitCount', -8.666901588439941],
        ['login-hasTels', -10.326618194580078],
        ['login-hasOAuth', -0.9149810671806335],
        ['login-hasCaptchas', -2.099842071533203],
        ['login-hasFiles', -6.084104537963867],
        ['login-hasDate', -10.339789390563965],
        ['login-hasNumber', -5.97030782699585],
        ['login-oneVisibleField', 7.419541835784912],
        ['login-twoVisibleFields', 3.9387216567993164],
        ['login-threeOrMoreVisibleFields', -9.822101593017578],
        ['login-noPasswords', -16.988929748535156],
        ['login-onePassword', 9.809603691101074],
        ['login-twoPasswords', -20.118589401245117],
        ['login-threeOrMorePasswords', -5.9884562492370605],
        ['login-noIdentifiers', -16.87456703186035],
        ['login-oneIdentifier', -2.1772048473358154],
        ['login-twoIdentifiers', -7.279117107391357],
        ['login-threeOrMoreIdentifiers', -7.222826957702637],
        ['login-autofocusedIsIdentifier', 11.011743545532227],
        ['login-autofocusedIsPassword', 36.54008102416992],
        ['login-visibleRatio', 4.902401447296143],
        ['login-inputRatio', 6.514293670654297],
        ['login-hiddenRatio', -15.970564842224121],
        ['login-identifierRatio', 11.196818351745605],
        ['login-emailRatio', 4.334538459777832],
        ['login-usernameRatio', -26.645492553710938],
        ['login-passwordRatio', -1.2669191360473633],
        ['login-requiredRatio', 4.142430305480957],
        ['login-pageLogin', 13.54846477508545],
        ['login-formTextLogin', 8.361000061035156],
        ['login-formAttrsLogin', 9.840189933776855],
        ['login-headingsLogin', 17.9040470123291],
        ['login-layoutLogin', 5.2098798751831055],
        ['login-rememberMeCheckbox', 7.537224292755127],
        ['login-troubleLink', 19.91520118713379],
        ['login-submitLogin', 11.058293342590332],
        ['login-pageRegister', -9.477916717529297],
        ['login-formTextRegister', 0.07287218421697617],
        ['login-formAttrsRegister', -9.91922378540039],
        ['login-headingsRegister', -14.5776948928833],
        ['login-layoutRegister', 4.856820106506348],
        ['login-pwNewRegister', -23.66205596923828],
        ['login-pwConfirmRegister', -13.81256103515625],
        ['login-submitRegister', -11.076529502868652],
        ['login-TOSRef', 1.9184505939483643],
        ['login-pagePwReset', -6.045259475708008],
        ['login-formTextPwReset', -5.913959980010986],
        ['login-formAttrsPwReset', -8.086376190185547],
        ['login-headingsPwReset', -10.545883178710938],
        ['login-layoutPwReset', 1.0689362287521362],
        ['login-pageRecovery', -4.5702033042907715],
        ['login-formTextRecovery', 0.0038040652871131897],
        ['login-formAttrsRecovery', -36.863914489746094],
        ['login-headingsRecovery', -4.541805744171143],
        ['login-layoutRecovery', 0.6321961879730225],
        ['login-identifierRecovery', -0.18909823894500732],
        ['login-submitRecovery', -4.773542881011963],
        ['login-formTextMFA', -0.05825137719511986],
        ['login-formAttrsMFA', -23.08989715576172],
        ['login-headingsMFA', -23.417600631713867],
        ['login-layoutMFA', -4.651171684265137],
        ['login-buttonVerify', -6.117395401000977],
        ['login-inputsMFA', -23.133533477783203],
        ['login-inputsOTP', -23.244659423828125],
        ['login-linkOTPOutlier', -6.875545978546143],
        ['login-newsletterForm', -12.55743408203125],
        ['login-searchForm', -8.260873794555664],
        ['login-multiStepForm', 3.7645623683929443],
        ['login-multiAuthForm', 9.728608131408691],
        ['login-visibleRatio,fieldsCount', -11.386466026306152],
        ['login-visibleRatio,identifierCount', -17.351022720336914],
        ['login-visibleRatio,passwordCount', 4.737768173217773],
        ['login-visibleRatio,hiddenIdentifierCount', -8.754611015319824],
        ['login-visibleRatio,hiddenPasswordCount', 15.081144332885742],
        ['login-identifierRatio,fieldsCount', -23.76184844970703],
        ['login-identifierRatio,identifierCount', 10.765090942382812],
        ['login-identifierRatio,passwordCount', -14.716394424438477],
        ['login-identifierRatio,hiddenIdentifierCount', -7.497622966766357],
        ['login-identifierRatio,hiddenPasswordCount', -1.1272861957550049],
        ['login-passwordRatio,fieldsCount', 1.9129419326782227],
        ['login-passwordRatio,identifierCount', -14.479911804199219],
        ['login-passwordRatio,passwordCount', -5.005911827087402],
        ['login-passwordRatio,hiddenIdentifierCount', 23.0176944732666],
        ['login-passwordRatio,hiddenPasswordCount', 2.412428379058838],
        ['login-requiredRatio,fieldsCount', 23.115530014038086],
        ['login-requiredRatio,identifierCount', -17.90664291381836],
        ['login-requiredRatio,passwordCount', 12.279537200927734],
        ['login-requiredRatio,hiddenIdentifierCount', -23.77978515625],
        ['login-requiredRatio,hiddenPasswordCount', 16.52780532836914],
    ],
    bias: -7.409318923950195,
    cutoff: 0.49,
};

const FORM_COMBINED_FEATURES = [
    ...FORM_FEATURES,
    ...combineFeatures(
        ['visibleRatio', 'identifierRatio', 'passwordRatio', 'requiredRatio'],
        ['fieldsCount', 'identifierCount', 'passwordCount', 'hiddenIdentifierCount', 'hiddenPasswordCount']
    ),
];

const login = {
    name: FormType.LOGIN,
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
        rule(type('form'), type(FormType.LOGIN), {}),
        ...FORM_COMBINED_FEATURES.map((feat) =>
            rule(type(FormType.LOGIN), featureScore('form', feat), {
                name: `login-${feat}`,
            })
        ),
        ...outRuleForm(FormType.LOGIN),
    ],
};

const results$9 = {
    coeffs: [
        ['pw-change-fieldsCount', -2.821082353591919],
        ['pw-change-inputCount', -2.4666507244110107],
        ['pw-change-fieldsetCount', -5.932929039001465],
        ['pw-change-textCount', -6.058302879333496],
        ['pw-change-textareaCount', -5.952178955078125],
        ['pw-change-selectCount', -6.09128475189209],
        ['pw-change-optionsCount', -6.009284496307373],
        ['pw-change-checkboxCount', -5.9998779296875],
        ['pw-change-radioCount', -5.955456256866455],
        ['pw-change-identifierCount', -5.350743293762207],
        ['pw-change-hiddenIdentifierCount', -3.535400867462158],
        ['pw-change-usernameCount', -6.123108386993408],
        ['pw-change-emailCount', -4.6324310302734375],
        ['pw-change-hiddenCount', -4.060635566711426],
        ['pw-change-hiddenPasswordCount', -5.919305324554443],
        ['pw-change-submitCount', -3.613839626312256],
        ['pw-change-hasTels', -5.913358688354492],
        ['pw-change-hasOAuth', -5.986205577850342],
        ['pw-change-hasCaptchas', -6.0066447257995605],
        ['pw-change-hasFiles', -6.089554309844971],
        ['pw-change-hasDate', -6.065313339233398],
        ['pw-change-hasNumber', -6.08743953704834],
        ['pw-change-oneVisibleField', -5.964847564697266],
        ['pw-change-twoVisibleFields', -3.270876169204712],
        ['pw-change-threeOrMoreVisibleFields', -0.5726361274719238],
        ['pw-change-noPasswords', -6.073439121246338],
        ['pw-change-onePassword', -5.968822479248047],
        ['pw-change-twoPasswords', 9.163000106811523],
        ['pw-change-threeOrMorePasswords', 21.7662410736084],
        ['pw-change-noIdentifiers', -1.0242376327514648],
        ['pw-change-oneIdentifier', -6.072472095489502],
        ['pw-change-twoIdentifiers', -5.953312873840332],
        ['pw-change-threeOrMoreIdentifiers', 4.541509628295898],
        ['pw-change-autofocusedIsIdentifier', -6.041104316711426],
        ['pw-change-autofocusedIsPassword', 19.087322235107422],
        ['pw-change-visibleRatio', -3.976881742477417],
        ['pw-change-inputRatio', -4.090826034545898],
        ['pw-change-hiddenRatio', -4.818429946899414],
        ['pw-change-identifierRatio', -5.642343044281006],
        ['pw-change-emailRatio', -5.307136058807373],
        ['pw-change-usernameRatio', -6.069182395935059],
        ['pw-change-passwordRatio', 2.1977503299713135],
        ['pw-change-requiredRatio', -4.4100751876831055],
        ['pw-change-pageLogin', -6.671773433685303],
        ['pw-change-formTextLogin', -5.988854885101318],
        ['pw-change-formAttrsLogin', -5.966826438903809],
        ['pw-change-headingsLogin', -6.01876974105835],
        ['pw-change-layoutLogin', -6.149377346038818],
        ['pw-change-rememberMeCheckbox', -5.999251842498779],
        ['pw-change-troubleLink', -3.5841877460479736],
        ['pw-change-submitLogin', -6.044783115386963],
        ['pw-change-pageRegister', -6.045588493347168],
        ['pw-change-formTextRegister', -0.07310987263917923],
        ['pw-change-formAttrsRegister', -5.910484313964844],
        ['pw-change-headingsRegister', -6.028865814208984],
        ['pw-change-layoutRegister', -6.102161884307861],
        ['pw-change-pwNewRegister', 11.251688957214355],
        ['pw-change-pwConfirmRegister', 8.020895004272461],
        ['pw-change-submitRegister', -7.404570579528809],
        ['pw-change-TOSRef', -6.977511405944824],
        ['pw-change-pagePwReset', 15.594032287597656],
        ['pw-change-formTextPwReset', 22.693819046020508],
        ['pw-change-formAttrsPwReset', 1.9821741580963135],
        ['pw-change-headingsPwReset', 17.73912239074707],
        ['pw-change-layoutPwReset', 17.310842514038086],
        ['pw-change-pageRecovery', -5.946480751037598],
        ['pw-change-formTextRecovery', -0.09053382277488708],
        ['pw-change-formAttrsRecovery', -5.963481426239014],
        ['pw-change-headingsRecovery', -6.085586071014404],
        ['pw-change-layoutRecovery', -3.7295126914978027],
        ['pw-change-identifierRecovery', -6.020700931549072],
        ['pw-change-submitRecovery', 0.06831485778093338],
        ['pw-change-formTextMFA', -0.030193500220775604],
        ['pw-change-formAttrsMFA', -6.062361717224121],
        ['pw-change-headingsMFA', -6.015666484832764],
        ['pw-change-layoutMFA', -5.984229564666748],
        ['pw-change-buttonVerify', -6.004364490509033],
        ['pw-change-inputsMFA', -6.022382736206055],
        ['pw-change-inputsOTP', -5.968094825744629],
        ['pw-change-linkOTPOutlier', -6.0326995849609375],
        ['pw-change-newsletterForm', -6.074337005615234],
        ['pw-change-searchForm', -5.942620754241943],
        ['pw-change-multiStepForm', -6.108795642852783],
        ['pw-change-multiAuthForm', -6.074281692504883],
        ['pw-change-visibleRatio,fieldsCount', -2.561014413833618],
        ['pw-change-visibleRatio,identifierCount', -5.65032958984375],
        ['pw-change-visibleRatio,passwordCount', 2.855492115020752],
        ['pw-change-visibleRatio,hiddenIdentifierCount', -2.66165828704834],
        ['pw-change-visibleRatio,hiddenPasswordCount', -6.073262691497803],
        ['pw-change-identifierRatio,fieldsCount', -4.483530521392822],
        ['pw-change-identifierRatio,identifierCount', -5.469466686248779],
        ['pw-change-identifierRatio,passwordCount', -4.438643455505371],
        ['pw-change-identifierRatio,hiddenIdentifierCount', -6.101949214935303],
        ['pw-change-identifierRatio,hiddenPasswordCount', -6.084680557250977],
        ['pw-change-passwordRatio,fieldsCount', 5.054623603820801],
        ['pw-change-passwordRatio,identifierCount', -4.329560279846191],
        ['pw-change-passwordRatio,passwordCount', 7.581125259399414],
        ['pw-change-passwordRatio,hiddenIdentifierCount', -0.2953653335571289],
        ['pw-change-passwordRatio,hiddenPasswordCount', -6.0865478515625],
        ['pw-change-requiredRatio,fieldsCount', -4.558785438537598],
        ['pw-change-requiredRatio,identifierCount', -6.01055383682251],
        ['pw-change-requiredRatio,passwordCount', -0.4561108350753784],
        ['pw-change-requiredRatio,hiddenIdentifierCount', 3.1033554077148438],
        ['pw-change-requiredRatio,hiddenPasswordCount', -5.949283123016357],
    ],
    bias: -4.134925842285156,
    cutoff: 1,
};

const passwordChange = {
    name: FormType.PASSWORD_CHANGE,
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
        rule(type('form'), type(FormType.PASSWORD_CHANGE), {}),
        ...FORM_COMBINED_FEATURES.map((key) =>
            rule(type(FormType.PASSWORD_CHANGE), featureScore('form', key), {
                name: `pw-change-${key}`,
            })
        ),
        ...outRuleForm(FormType.PASSWORD_CHANGE),
    ],
};

const results$8 = {
    coeffs: [
        ['register-fieldsCount', 3.562627077102661],
        ['register-inputCount', 2.9746971130371094],
        ['register-fieldsetCount', -2.8755273818969727],
        ['register-textCount', 2.245427131652832],
        ['register-textareaCount', 5.9212870597839355],
        ['register-selectCount', -16.084556579589844],
        ['register-optionsCount', 6.667277812957764],
        ['register-checkboxCount', -28.697362899780273],
        ['register-radioCount', 8.370963096618652],
        ['register-identifierCount', 6.011251926422119],
        ['register-hiddenIdentifierCount', 31.51727294921875],
        ['register-usernameCount', -2.889526128768921],
        ['register-emailCount', 1.3853524923324585],
        ['register-hiddenCount', -19.09939193725586],
        ['register-hiddenPasswordCount', 2.807588815689087],
        ['register-submitCount', 6.4820556640625],
        ['register-hasTels', 4.207786560058594],
        ['register-hasOAuth', -0.054223909974098206],
        ['register-hasCaptchas', 4.659682273864746],
        ['register-hasFiles', -6.089394569396973],
        ['register-hasDate', 10.002625465393066],
        ['register-hasNumber', 17.650880813598633],
        ['register-oneVisibleField', 0.23678956925868988],
        ['register-twoVisibleFields', 0.7649604082107544],
        ['register-threeOrMoreVisibleFields', -0.12985831499099731],
        ['register-noPasswords', -5.004095077514648],
        ['register-onePassword', 2.607997179031372],
        ['register-twoPasswords', 14.352537155151367],
        ['register-threeOrMorePasswords', -13.532278060913086],
        ['register-noIdentifiers', -9.468017578125],
        ['register-oneIdentifier', 1.6128495931625366],
        ['register-twoIdentifiers', 19.39736557006836],
        ['register-threeOrMoreIdentifiers', -2.337739944458008],
        ['register-autofocusedIsIdentifier', 4.635364055633545],
        ['register-autofocusedIsPassword', 5.304699897766113],
        ['register-visibleRatio', -4.587040424346924],
        ['register-inputRatio', -5.549858093261719],
        ['register-hiddenRatio', 0.2984549105167389],
        ['register-identifierRatio', 3.0035834312438965],
        ['register-emailRatio', -1.7489508390426636],
        ['register-usernameRatio', -7.126821041107178],
        ['register-passwordRatio', -0.3524952530860901],
        ['register-requiredRatio', -14.101469039916992],
        ['register-pageLogin', -7.905763626098633],
        ['register-formTextLogin', -6.148733615875244],
        ['register-formAttrsLogin', -6.255045413970947],
        ['register-headingsLogin', -20.485504150390625],
        ['register-layoutLogin', 2.0472300052642822],
        ['register-rememberMeCheckbox', -13.833234786987305],
        ['register-troubleLink', -16.558876037597656],
        ['register-submitLogin', -3.1578097343444824],
        ['register-pageRegister', 1.9477925300598145],
        ['register-formTextRegister', 0.0874398723244667],
        ['register-formAttrsRegister', 4.815572738647461],
        ['register-headingsRegister', 18.676218032836914],
        ['register-layoutRegister', -7.512822151184082],
        ['register-pwNewRegister', 15.3948392868042],
        ['register-pwConfirmRegister', 5.729371070861816],
        ['register-submitRegister', 23.312715530395508],
        ['register-TOSRef', 17.527151107788086],
        ['register-pagePwReset', -7.489500522613525],
        ['register-formTextPwReset', -11.25778579711914],
        ['register-formAttrsPwReset', -6.239210605621338],
        ['register-headingsPwReset', -28.826457977294922],
        ['register-layoutPwReset', -53.89678192138672],
        ['register-pageRecovery', -7.054288864135742],
        ['register-formTextRecovery', 0.07976201921701431],
        ['register-formAttrsRecovery', -12.31677532196045],
        ['register-headingsRecovery', -20.96072006225586],
        ['register-layoutRecovery', 0.3215709626674652],
        ['register-identifierRecovery', -39.04199981689453],
        ['register-submitRecovery', -33.50904083251953],
        ['register-formTextMFA', -0.09520763158798218],
        ['register-formAttrsMFA', -7.215282440185547],
        ['register-headingsMFA', -6.630019664764404],
        ['register-layoutMFA', 2.944709539413452],
        ['register-buttonVerify', -9.12524127960205],
        ['register-inputsMFA', -7.9172258377075195],
        ['register-inputsOTP', -11.335521697998047],
        ['register-linkOTPOutlier', 2.153749942779541],
        ['register-newsletterForm', -26.251794815063477],
        ['register-searchForm', -9.540386199951172],
        ['register-multiStepForm', 9.482791900634766],
        ['register-multiAuthForm', 0.9864219427108765],
        ['register-visibleRatio,fieldsCount', -5.823600769042969],
        ['register-visibleRatio,identifierCount', -0.019992545247077942],
        ['register-visibleRatio,passwordCount', 7.401853561401367],
        ['register-visibleRatio,hiddenIdentifierCount', -3.0985989570617676],
        ['register-visibleRatio,hiddenPasswordCount', -18.854755401611328],
        ['register-identifierRatio,fieldsCount', 10.926431655883789],
        ['register-identifierRatio,identifierCount', 4.797600269317627],
        ['register-identifierRatio,passwordCount', -25.058103561401367],
        ['register-identifierRatio,hiddenIdentifierCount', -27.603219985961914],
        ['register-identifierRatio,hiddenPasswordCount', -3.748481273651123],
        ['register-passwordRatio,fieldsCount', 9.001323699951172],
        ['register-passwordRatio,identifierCount', -26.6477108001709],
        ['register-passwordRatio,passwordCount', -2.5471787452697754],
        ['register-passwordRatio,hiddenIdentifierCount', 11.065810203552246],
        ['register-passwordRatio,hiddenPasswordCount', -25.60362434387207],
        ['register-requiredRatio,fieldsCount', 7.867189884185791],
        ['register-requiredRatio,identifierCount', -4.725770473480225],
        ['register-requiredRatio,passwordCount', -4.435703754425049],
        ['register-requiredRatio,hiddenIdentifierCount', 5.2515692710876465],
        ['register-requiredRatio,hiddenPasswordCount', -7.147007942199707],
    ],
    bias: -0.49443545937538147,
    cutoff: 0.48,
};

const register = {
    name: FormType.REGISTER,
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
        rule(type('form'), type(FormType.REGISTER), {}),
        ...FORM_COMBINED_FEATURES.map((key) =>
            rule(type(FormType.REGISTER), featureScore('form', key), {
                name: `register-${key}`,
            })
        ),
        ...outRuleForm(FormType.REGISTER),
    ],
};

const results$7 = {
    coeffs: [
        ['recovery-fieldsCount', 3.0663111209869385],
        ['recovery-inputCount', 1.5800341367721558],
        ['recovery-fieldsetCount', -11.33138370513916],
        ['recovery-textCount', -1.9441428184509277],
        ['recovery-textareaCount', -20.250864028930664],
        ['recovery-selectCount', -12.786724090576172],
        ['recovery-optionsCount', -16.374366760253906],
        ['recovery-checkboxCount', -6.017514705657959],
        ['recovery-radioCount', -5.93514347076416],
        ['recovery-identifierCount', 0.5982466340065002],
        ['recovery-hiddenIdentifierCount', -10.688822746276855],
        ['recovery-usernameCount', 10.145933151245117],
        ['recovery-emailCount', 2.8206121921539307],
        ['recovery-hiddenCount', 2.386152505874634],
        ['recovery-hiddenPasswordCount', -11.127959251403809],
        ['recovery-submitCount', 10.205362319946289],
        ['recovery-hasTels', -14.495867729187012],
        ['recovery-hasOAuth', -13.560283660888672],
        ['recovery-hasCaptchas', 0.825590193271637],
        ['recovery-hasFiles', -33.5905647277832],
        ['recovery-hasDate', -6.030230522155762],
        ['recovery-hasNumber', -6.088935375213623],
        ['recovery-oneVisibleField', -6.5612473487854],
        ['recovery-twoVisibleFields', -2.2590363025665283],
        ['recovery-threeOrMoreVisibleFields', 3.689920663833618],
        ['recovery-noPasswords', 0.8661168813705444],
        ['recovery-onePassword', -11.556309700012207],
        ['recovery-twoPasswords', -6.0044708251953125],
        ['recovery-threeOrMorePasswords', -5.9454665184021],
        ['recovery-noIdentifiers', -13.224882125854492],
        ['recovery-oneIdentifier', 0.8667474985122681],
        ['recovery-twoIdentifiers', 2.523800849914551],
        ['recovery-threeOrMoreIdentifiers', -6.968517303466797],
        ['recovery-autofocusedIsIdentifier', -2.0289268493652344],
        ['recovery-autofocusedIsPassword', -6.065815448760986],
        ['recovery-visibleRatio', -0.23484452068805695],
        ['recovery-inputRatio', -4.723935604095459],
        ['recovery-hiddenRatio', 0.39394456148147583],
        ['recovery-identifierRatio', -0.03334460407495499],
        ['recovery-emailRatio', 0.7156984806060791],
        ['recovery-usernameRatio', 8.822244644165039],
        ['recovery-passwordRatio', -10.373119354248047],
        ['recovery-requiredRatio', 0.578095555305481],
        ['recovery-pageLogin', -1.9575245380401611],
        ['recovery-formTextLogin', -6.060730457305908],
        ['recovery-formAttrsLogin', -0.22337974607944489],
        ['recovery-headingsLogin', 3.7072954177856445],
        ['recovery-layoutLogin', -11.858367919921875],
        ['recovery-rememberMeCheckbox', -6.038830280303955],
        ['recovery-troubleLink', 8.016693115234375],
        ['recovery-submitLogin', -3.5323777198791504],
        ['recovery-pageRegister', -10.649055480957031],
        ['recovery-formTextRegister', -0.06822650879621506],
        ['recovery-formAttrsRegister', -10.889883041381836],
        ['recovery-headingsRegister', -4.182615756988525],
        ['recovery-layoutRegister', -8.289756774902344],
        ['recovery-pwNewRegister', -5.981846332550049],
        ['recovery-pwConfirmRegister', -5.963935375213623],
        ['recovery-submitRegister', -7.447194576263428],
        ['recovery-TOSRef', -13.295340538024902],
        ['recovery-pagePwReset', 8.232972145080566],
        ['recovery-formTextPwReset', -6.101469993591309],
        ['recovery-formAttrsPwReset', 13.244839668273926],
        ['recovery-headingsPwReset', 13.702798843383789],
        ['recovery-layoutPwReset', 7.145814895629883],
        ['recovery-pageRecovery', 16.518871307373047],
        ['recovery-formTextRecovery', 0.040639229118824005],
        ['recovery-formAttrsRecovery', 20.713411331176758],
        ['recovery-headingsRecovery', 4.629314422607422],
        ['recovery-layoutRecovery', 1.65940260887146],
        ['recovery-identifierRecovery', 16.95840072631836],
        ['recovery-submitRecovery', 17.41854476928711],
        ['recovery-formTextMFA', -0.032173581421375275],
        ['recovery-formAttrsMFA', 9.434100151062012],
        ['recovery-headingsMFA', -7.594247341156006],
        ['recovery-layoutMFA', -5.922063827514648],
        ['recovery-buttonVerify', 1.9567841291427612],
        ['recovery-inputsMFA', 7.477095603942871],
        ['recovery-inputsOTP', -0.04956179857254028],
        ['recovery-linkOTPOutlier', -0.10020259022712708],
        ['recovery-newsletterForm', -12.535353660583496],
        ['recovery-searchForm', -11.282465934753418],
        ['recovery-multiStepForm', 2.4330849647521973],
        ['recovery-multiAuthForm', -6.784147262573242],
        ['recovery-visibleRatio,fieldsCount', 2.8627548217773438],
        ['recovery-visibleRatio,identifierCount', 0.3911575973033905],
        ['recovery-visibleRatio,passwordCount', -9.199808120727539],
        ['recovery-visibleRatio,hiddenIdentifierCount', -12.73129940032959],
        ['recovery-visibleRatio,hiddenPasswordCount', -11.251668930053711],
        ['recovery-identifierRatio,fieldsCount', 4.197324275970459],
        ['recovery-identifierRatio,identifierCount', 1.413233995437622],
        ['recovery-identifierRatio,passwordCount', -12.048392295837402],
        ['recovery-identifierRatio,hiddenIdentifierCount', -22.842350006103516],
        ['recovery-identifierRatio,hiddenPasswordCount', -13.517035484313965],
        ['recovery-passwordRatio,fieldsCount', -9.956162452697754],
        ['recovery-passwordRatio,identifierCount', -12.215431213378906],
        ['recovery-passwordRatio,passwordCount', -9.645047187805176],
        ['recovery-passwordRatio,hiddenIdentifierCount', -6.066565036773682],
        ['recovery-passwordRatio,hiddenPasswordCount', -5.993730068206787],
        ['recovery-requiredRatio,fieldsCount', 6.974405765533447],
        ['recovery-requiredRatio,identifierCount', 1.096270203590393],
        ['recovery-requiredRatio,passwordCount', -7.393696308135986],
        ['recovery-requiredRatio,hiddenIdentifierCount', 7.63331937789917],
        ['recovery-requiredRatio,hiddenPasswordCount', -11.026382446289062],
    ],
    bias: -4.2260637283325195,
    cutoff: 0.5,
};

const recovery = {
    name: FormType.RECOVERY,
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
        rule(type('form'), type(FormType.RECOVERY), {}),
        ...FORM_COMBINED_FEATURES.map((key) =>
            rule(type(FormType.RECOVERY), featureScore('form', key), {
                name: `recovery-${key}`,
            })
        ),
        ...outRuleForm(FormType.RECOVERY),
    ],
};

const results$6 = {
    coeffs: [
        ['mfa-fieldsCount', -2.6608049869537354],
        ['mfa-inputCount', -2.2222819328308105],
        ['mfa-fieldsetCount', 10.228865623474121],
        ['mfa-textCount', -3.8307855129241943],
        ['mfa-textareaCount', -12.12895679473877],
        ['mfa-selectCount', -5.996481895446777],
        ['mfa-optionsCount', -6.011926174163818],
        ['mfa-checkboxCount', 10.44384765625],
        ['mfa-radioCount', -5.958160877227783],
        ['mfa-identifierCount', -2.5482380390167236],
        ['mfa-hiddenIdentifierCount', -3.349268674850464],
        ['mfa-usernameCount', -3.012571096420288],
        ['mfa-emailCount', -6.086045265197754],
        ['mfa-hiddenCount', -1.7772166728973389],
        ['mfa-hiddenPasswordCount', -2.653916120529175],
        ['mfa-submitCount', -3.4199981689453125],
        ['mfa-hasTels', 14.0067138671875],
        ['mfa-hasOAuth', -6.113955974578857],
        ['mfa-hasCaptchas', -3.4787168502807617],
        ['mfa-hasFiles', -6.040178298950195],
        ['mfa-hasDate', -6.017855167388916],
        ['mfa-hasNumber', 11.388384819030762],
        ['mfa-oneVisibleField', -1.2438230514526367],
        ['mfa-twoVisibleFields', -5.497401714324951],
        ['mfa-threeOrMoreVisibleFields', -0.9657846093177795],
        ['mfa-noPasswords', -0.2941009998321533],
        ['mfa-onePassword', -5.462116718292236],
        ['mfa-twoPasswords', -6.039351940155029],
        ['mfa-threeOrMorePasswords', -5.962850570678711],
        ['mfa-noIdentifiers', -1.4431756734848022],
        ['mfa-oneIdentifier', -3.9462203979492188],
        ['mfa-twoIdentifiers', -0.6378401517868042],
        ['mfa-threeOrMoreIdentifiers', 8.38503646850586],
        ['mfa-autofocusedIsIdentifier', -5.315145969390869],
        ['mfa-autofocusedIsPassword', 9.648776054382324],
        ['mfa-visibleRatio', -2.142576217651367],
        ['mfa-inputRatio', -2.5412702560424805],
        ['mfa-hiddenRatio', -1.019173502922058],
        ['mfa-identifierRatio', -2.460855484008789],
        ['mfa-emailRatio', -5.916286945343018],
        ['mfa-usernameRatio', -3.583381414413452],
        ['mfa-passwordRatio', -5.770420074462891],
        ['mfa-requiredRatio', -0.0648624524474144],
        ['mfa-pageLogin', 0.5441489815711975],
        ['mfa-formTextLogin', -5.977066993713379],
        ['mfa-formAttrsLogin', -1.7974815368652344],
        ['mfa-headingsLogin', -5.1805853843688965],
        ['mfa-layoutLogin', 0.3471687436103821],
        ['mfa-rememberMeCheckbox', 11.531816482543945],
        ['mfa-troubleLink', -3.6572649478912354],
        ['mfa-submitLogin', 1.5678304433822632],
        ['mfa-pageRegister', -4.159330368041992],
        ['mfa-formTextRegister', 0.0381246879696846],
        ['mfa-formAttrsRegister', -4.0707011222839355],
        ['mfa-headingsRegister', -7.568932056427002],
        ['mfa-layoutRegister', -2.132314682006836],
        ['mfa-pwNewRegister', -6.0551347732543945],
        ['mfa-pwConfirmRegister', -5.953130722045898],
        ['mfa-submitRegister', -5.991687774658203],
        ['mfa-TOSRef', -2.245255470275879],
        ['mfa-pagePwReset', -6.017617225646973],
        ['mfa-formTextPwReset', -5.9265360832214355],
        ['mfa-formAttrsPwReset', -5.974658966064453],
        ['mfa-headingsPwReset', -5.926351547241211],
        ['mfa-layoutPwReset', -6.089995384216309],
        ['mfa-pageRecovery', 0.14023712277412415],
        ['mfa-formTextRecovery', 0.036410488188266754],
        ['mfa-formAttrsRecovery', -6.1391143798828125],
        ['mfa-headingsRecovery', -6.048333168029785],
        ['mfa-layoutRecovery', 1.994592547416687],
        ['mfa-identifierRecovery', -6.048887252807617],
        ['mfa-submitRecovery', -0.8152323961257935],
        ['mfa-formTextMFA', 0.0051116943359375],
        ['mfa-formAttrsMFA', 16.67364501953125],
        ['mfa-headingsMFA', 19.068510055541992],
        ['mfa-layoutMFA', 14.717923164367676],
        ['mfa-buttonVerify', 18.798368453979492],
        ['mfa-inputsMFA', 18.417163848876953],
        ['mfa-inputsOTP', 18.44865608215332],
        ['mfa-linkOTPOutlier', -1.9177868366241455],
        ['mfa-newsletterForm', -5.940587997436523],
        ['mfa-searchForm', -6.203600883483887],
        ['mfa-multiStepForm', 4.17596960067749],
        ['mfa-multiAuthForm', -6.092217922210693],
        ['mfa-visibleRatio,fieldsCount', -0.23740920424461365],
        ['mfa-visibleRatio,identifierCount', -2.1811068058013916],
        ['mfa-visibleRatio,passwordCount', -4.92279052734375],
        ['mfa-visibleRatio,hiddenIdentifierCount', -7.958465576171875],
        ['mfa-visibleRatio,hiddenPasswordCount', -2.1393802165985107],
        ['mfa-identifierRatio,fieldsCount', 0.394227534532547],
        ['mfa-identifierRatio,identifierCount', -1.5245158672332764],
        ['mfa-identifierRatio,passwordCount', -5.488220691680908],
        ['mfa-identifierRatio,hiddenIdentifierCount', -0.9453757405281067],
        ['mfa-identifierRatio,hiddenPasswordCount', -0.2941581606864929],
        ['mfa-passwordRatio,fieldsCount', -5.5030741691589355],
        ['mfa-passwordRatio,identifierCount', -5.507443428039551],
        ['mfa-passwordRatio,passwordCount', -5.770933151245117],
        ['mfa-passwordRatio,hiddenIdentifierCount', -8.61901569366455],
        ['mfa-passwordRatio,hiddenPasswordCount', -5.911449432373047],
        ['mfa-requiredRatio,fieldsCount', -3.8255507946014404],
        ['mfa-requiredRatio,identifierCount', -3.048502206802368],
        ['mfa-requiredRatio,passwordCount', -4.1019487380981445],
        ['mfa-requiredRatio,hiddenIdentifierCount', -6.022665500640869],
        ['mfa-requiredRatio,hiddenPasswordCount', -6.038109302520752],
    ],
    bias: -2.766719341278076,
    cutoff: 0.5,
};

const mfa = {
    name: FormType.MFA,
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
        rule(type('form'), type(FormType.MFA), {}),
        ...FORM_COMBINED_FEATURES.map((key) =>
            rule(type(FormType.MFA), featureScore('form', key), {
                name: `mfa-${key}`,
            })
        ),
        ...outRuleForm(FormType.MFA),
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
        exotic: boolInt(fieldFeatures.isFormNoop),
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
        ['pw-loginScore', 12.626351356506348],
        ['pw-registerScore', -14.488433837890625],
        ['pw-pwChangeScore', 0.6204130053520203],
        ['pw-exotic', -10.933134078979492],
        ['pw-autocompleteNew', -2.8671417236328125],
        ['pw-autocompleteCurrent', 0.408968448638916],
        ['pw-autocompleteOff', -6.456448078155518],
        ['pw-isOnlyPassword', 5.238807678222656],
        ['pw-prevPwField', 4.8893022537231445],
        ['pw-nextPwField', -6.995141506195068],
        ['pw-attrCreate', -4.616118907928467],
        ['pw-attrCurrent', 2.8800172805786133],
        ['pw-attrConfirm', -7.291671276092529],
        ['pw-attrReset', -0.03924228250980377],
        ['pw-textCreate', -2.0508689880371094],
        ['pw-textCurrent', 1.0741703510284424],
        ['pw-textConfirm', -7.6088714599609375],
        ['pw-textReset', -0.12861210107803345],
        ['pw-labelCreate', -8.037101745605469],
        ['pw-labelCurrent', 12.2730712890625],
        ['pw-labelConfirm', -7.639401435852051],
        ['pw-labelReset', -0.1618403047323227],
        ['pw-prevPwCreate', -9.484370231628418],
        ['pw-prevPwCurrent', -14.167855262756348],
        ['pw-prevPwConfirm', -0.03903460502624512],
        ['pw-passwordOutlier', -7.529138088226318],
        ['pw-nextPwCreate', 16.058996200561523],
        ['pw-nextPwCurrent', -8.680889129638672],
        ['pw-nextPwConfirm', -8.86237907409668],
    ],
    bias: -4.131703853607178,
    cutoff: 0.5,
};

const password = {
    name: FieldType.PASSWORD_CURRENT,
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
        rule(type('password-field'), type(FieldType.PASSWORD_CURRENT), {}),
        ...PW_FIELD_FEATURES.map((key) =>
            rule(type(FieldType.PASSWORD_CURRENT), featureScore('password-field', key), {
                name: `pw-${key}`,
            })
        ),
        ...outRuleField(FieldType.PASSWORD_CURRENT),
    ],
};

const results$4 = {
    coeffs: [
        ['pw[new]-loginScore', -12.161810874938965],
        ['pw[new]-registerScore', 13.082062721252441],
        ['pw[new]-pwChangeScore', 0.2734557092189789],
        ['pw[new]-exotic', 15.673851013183594],
        ['pw[new]-autocompleteNew', 1.1924396753311157],
        ['pw[new]-autocompleteCurrent', -0.43220391869544983],
        ['pw[new]-autocompleteOff', -1.2643014192581177],
        ['pw[new]-isOnlyPassword', -2.124310255050659],
        ['pw[new]-prevPwField', 1.075303554534912],
        ['pw[new]-nextPwField', 9.608133316040039],
        ['pw[new]-attrCreate', 3.6305932998657227],
        ['pw[new]-attrCurrent', 2.656393051147461],
        ['pw[new]-attrConfirm', 7.825433731079102],
        ['pw[new]-attrReset', -0.026777133345603943],
        ['pw[new]-textCreate', 1.6755353212356567],
        ['pw[new]-textCurrent', -1.5992847681045532],
        ['pw[new]-textConfirm', -16.0632266998291],
        ['pw[new]-textReset', -0.15464475750923157],
        ['pw[new]-labelCreate', 7.8354997634887695],
        ['pw[new]-labelCurrent', -12.842089653015137],
        ['pw[new]-labelConfirm', 8.068839073181152],
        ['pw[new]-labelReset', 0.1552828997373581],
        ['pw[new]-prevPwCreate', 11.383147239685059],
        ['pw[new]-prevPwCurrent', 9.178744316101074],
        ['pw[new]-prevPwConfirm', -0.014047980308532715],
        ['pw[new]-passwordOutlier', -28.806673049926758],
        ['pw[new]-nextPwCreate', -11.96410083770752],
        ['pw[new]-nextPwCurrent', 8.541152954101562],
        ['pw[new]-nextPwConfirm', 9.55687141418457],
    ],
    bias: -2.8334567546844482,
    cutoff: 0.5,
};

const newPassword = {
    name: FieldType.PASSWORD_NEW,
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
        rule(type('password-field'), type(FieldType.PASSWORD_NEW), {}),
        ...PW_FIELD_FEATURES.map((key) =>
            rule(type(FieldType.PASSWORD_NEW), featureScore('password-field', key), {
                name: `pw[new]-${key}`,
            })
        ),
        ...outRuleField(FieldType.PASSWORD_NEW),
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
    'searchField',
];

const results$3 = {
    coeffs: [
        ['username-autocompleteUsername', 8.789555549621582],
        ['username-autocompleteNickname', -0.0773061215877533],
        ['username-autocompleteEmail', -6.466068267822266],
        ['username-autocompleteOff', -0.38557565212249756],
        ['username-attrUsername', 18.435144424438477],
        ['username-textUsername', 16.020580291748047],
        ['username-labelUsername', 17.836647033691406],
        ['username-outlierUsername', -0.19528894126415253],
        ['username-loginUsername', 18.52605438232422],
        ['username-searchField', -6.955122947692871],
    ],
    bias: -9.78425407409668,
    cutoff: 0.5,
};

const username = {
    name: FieldType.USERNAME,
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
        rule(type('username-field'), type(FieldType.USERNAME), {}),
        ...USERNAME_FIELD_FEATURES.map((key) =>
            rule(type(FieldType.USERNAME), featureScore('username-field', key), {
                name: `username-${key}`,
            })
        ),
        ...outRuleField(FieldType.USERNAME),
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

const HIDDEN_USER_FIELD_FEATURES = [
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

const results$2 = {
    coeffs: [
        ['username[hidden]-exotic', -7.392197132110596],
        ['username[hidden]-attrUsername', 14.286011695861816],
        ['username[hidden]-attrEmail', 13.344857215881348],
        ['username[hidden]-usernameAttr', 15.754179954528809],
        ['username[hidden]-autocompleteUsername', 1.1577798128128052],
        ['username[hidden]-visibleReadonly', 13.36921501159668],
        ['username[hidden]-hiddenEmailValue', 15.016716957092285],
        ['username[hidden]-hiddenTelValue', 6.474822044372559],
        ['username[hidden]-hiddenUsernameValue', -0.6956964731216431],
    ],
    bias: -21.0861873626709,
    cutoff: 0.5,
};

const usernameHidden = {
    name: FieldType.USERNAME_HIDDEN,
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
        rule(type('username-hidden-field'), type(FieldType.USERNAME_HIDDEN), {}),
        ...HIDDEN_USER_FIELD_FEATURES.map((key) =>
            rule(type(FieldType.USERNAME_HIDDEN), featureScore('username-hidden-field', key), {
                name: `username[hidden]-${key}`,
            })
        ),
        ...outRuleField(FieldType.USERNAME_HIDDEN),
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
    'searchField',
];

const results$1 = {
    coeffs: [
        ['email-autocompleteUsername', 1.1470569372177124],
        ['email-autocompleteNickname', 0.19719144701957703],
        ['email-autocompleteEmail', 6.075962066650391],
        ['email-typeEmail', 14.655997276306152],
        ['email-exactAttrEmail', 12.865877151489258],
        ['email-attrEmail', 2.414191484451294],
        ['email-textEmail', 13.972600936889648],
        ['email-labelEmail', 16.87061882019043],
        ['email-placeholderEmail', 14.236457824707031],
        ['email-searchField', -24.571687698364258],
    ],
    bias: -9.370467185974121,
    cutoff: 0.99,
};

const email = {
    name: FieldType.EMAIL,
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
        rule(type('email-field'), type(FieldType.EMAIL), {}),
        ...EMAIL_FIELD_FEATURES.map((key) =>
            rule(type(FieldType.EMAIL), featureScore('email-field', key), {
                name: `email-${key}`,
            })
        ),
        ...outRuleField(FieldType.EMAIL),
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
    const patternOTP = OTP_PATTERNS.some(
        ([maxLength, pattern]) => field.pattern.includes(pattern) && maxLength === field.maxLength
    );
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
        exotic: boolInt(fieldFeatures.isFormNoop),
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
        ['otp-mfaScore', 30.138139724731445],
        ['otp-exotic', -7.118929386138916],
        ['otp-linkOTPOutlier', -20.126291275024414],
        ['otp-hasCheckboxes', 7.424553871154785],
        ['otp-hidden', -0.052839428186416626],
        ['otp-required', 2.1521077156066895],
        ['otp-nameMatch', -13.047769546508789],
        ['otp-idMatch', 11.819791793823242],
        ['otp-numericMode', -3.823442220687866],
        ['otp-autofocused', 6.769406795501709],
        ['otp-tabIndex1', -1.3875197172164917],
        ['otp-patternOTP', 6.69269323348999],
        ['otp-maxLength1', 5.757829189300537],
        ['otp-maxLength5', -7.848095417022705],
        ['otp-minLength6', 16.71443748474121],
        ['otp-maxLength6', 6.044124126434326],
        ['otp-maxLength20', 3.0983455181121826],
        ['otp-autocompleteOTC', 0.11412258446216583],
        ['otp-autocompleteOff', -3.4037117958068848],
        ['otp-prevAligned', 1.7352566719055176],
        ['otp-prevArea', 2.0902316570281982],
        ['otp-nextAligned', -0.0788567066192627],
        ['otp-nextArea', 3.4691944122314453],
        ['otp-attrMFA', 8.202847480773926],
        ['otp-attrOTP', 2.50985050201416],
        ['otp-attrOutlier', -8.636154174804688],
        ['otp-textMFA', 17.028635025024414],
        ['otp-textOTP', -9.527740478515625],
        ['otp-labelMFA', 1.1547458171844482],
        ['otp-labelOTP', -0.11251166462898254],
        ['otp-labelOutlier', -7.463973522186279],
        ['otp-wrapperOTP', 19.633684158325195],
        ['otp-wrapperOutlier', -6.380001544952393],
        ['otp-emailOutlierCount', -9.089165687561035],
    ],
    bias: -19.487550735473633,
    cutoff: 0.54,
};

const otp = {
    name: FieldType.OTP,
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
        rule(type('otp-field'), type(FieldType.OTP), {}),
        ...OTP_FIELD_FEATURES.map((key) =>
            rule(type(FieldType.OTP), featureScore('otp-field', key), {
                name: `otp-${key}`,
            })
        ),
        ...outRuleField(FieldType.OTP),
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
    var _a, _b;
    const field = fnode.element;
    const fieldHaystacks = getFieldHaystacks(field);
    const formFnode = getParentFnodeVisibleForm(fnode);
    if (formFnode !== null && !formFnode.hasNoteFor('form')) formFnode.setNoteFor('form', getFormFeatures(formFnode));
    const formFeatures = formFnode === null || formFnode === void 0 ? void 0 : formFnode.noteFor('form');
    const formClassification = getFormClassification(formFnode);
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
              opacity: false,
          })
        : false;
    const searchField = visible && any(matchSearchAction)(fieldHaystacks.fieldAttrs.concat(fieldHaystacks.fieldText));
    const prevField = typeValid
        ? (_a =
              formFeatures === null || formFeatures === void 0
                  ? void 0
                  : formFeatures.formInputIterator.prev(field)) !== null && _a !== void 0
            ? _a
            : null
        : null;
    const nextField = typeValid
        ? (_b =
              formFeatures === null || formFeatures === void 0
                  ? void 0
                  : formFeatures.formInputIterator.next(field)) !== null && _b !== void 0
            ? _b
            : null
        : null;
    return Object.assign(
        {
            formFnode,
            formFeatures,
            isFormLogin: formClassification.login,
            isFormRegister: formClassification.register,
            isFormPWChange: formClassification.pwChange,
            isFormRecovery: formClassification.recovery,
            isFormMFA: formClassification.mfa,
            isFormNoop: formClassification.noop,
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
                rule(type('form').when(isNoopForm), type(FormType.NOOP), {}),
                rule(type(FormType.NOOP), out(FormType.NOOP), {}),
                rule(dom('input').when(fieldFilter), type('field').note(getFieldFeature), {}),
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
    FieldType,
    FormType,
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
    getFormClassification,
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
    isNoopForm,
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
    resetFieldFlags,
    resetFormFlags,
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
