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
        ['login-fieldsCount', 15.301219940185547],
        ['login-inputCount', 14.261231422424316],
        ['login-fieldsetCount', -25.41602897644043],
        ['login-textCount', 3.1046688556671143],
        ['login-textareaCount', -6.050387859344482],
        ['login-selectCount', -6.818429470062256],
        ['login-optionsCount', -7.128842353820801],
        ['login-checkboxCount', 37.56673049926758],
        ['login-radioCount', -5.954488277435303],
        ['login-identifierCount', -3.676457405090332],
        ['login-hiddenIdentifierCount', 4.230292320251465],
        ['login-usernameCount', 23.766727447509766],
        ['login-emailCount', -15.26616382598877],
        ['login-hiddenCount', 11.207625389099121],
        ['login-hiddenPasswordCount', 27.597047805786133],
        ['login-submitCount', -10.487710952758789],
        ['login-hasTels', -12.359692573547363],
        ['login-hasOAuth', -1.104422688484192],
        ['login-hasCaptchas', -2.277787208557129],
        ['login-hasFiles', -5.967645645141602],
        ['login-hasDate', -8.737281799316406],
        ['login-hasNumber', -6.003880977630615],
        ['login-oneVisibleField', 7.847188472747803],
        ['login-twoVisibleFields', 3.8965413570404053],
        ['login-threeOrMoreVisibleFields', -12.544120788574219],
        ['login-noPasswords', -17.45173454284668],
        ['login-onePassword', 11.688976287841797],
        ['login-twoPasswords', -21.11728858947754],
        ['login-threeOrMorePasswords', -6.050166130065918],
        ['login-noIdentifiers', -18.373048782348633],
        ['login-oneIdentifier', -0.5217727422714233],
        ['login-twoIdentifiers', -4.284721374511719],
        ['login-threeOrMoreIdentifiers', -6.517605304718018],
        ['login-autofocusedIsIdentifier', 12.2124605178833],
        ['login-autofocusedIsPassword', 39.0774040222168],
        ['login-visibleRatio', 5.160435676574707],
        ['login-inputRatio', 7.7561492919921875],
        ['login-hiddenRatio', -19.348207473754883],
        ['login-identifierRatio', 11.811365127563477],
        ['login-emailRatio', 4.809269905090332],
        ['login-usernameRatio', -31.36686134338379],
        ['login-passwordRatio', -0.9263325333595276],
        ['login-requiredRatio', 4.6935038566589355],
        ['login-pageLogin', 14.538487434387207],
        ['login-formTextLogin', 7.351283550262451],
        ['login-formAttrsLogin', 10.269190788269043],
        ['login-headingsLogin', 19.51105499267578],
        ['login-layoutLogin', 5.735300540924072],
        ['login-rememberMeCheckbox', 8.106386184692383],
        ['login-troubleLink', 21.395551681518555],
        ['login-submitLogin', 13.198534965515137],
        ['login-pageRegister', -10.078254699707031],
        ['login-formTextRegister', -0.040199585258960724],
        ['login-formAttrsRegister', -10.49311351776123],
        ['login-headingsRegister', -16.01691436767578],
        ['login-layoutRegister', 5.5470709800720215],
        ['login-pwNewRegister', -24.608882904052734],
        ['login-pwConfirmRegister', -15.611982345581055],
        ['login-submitRegister', -11.79920768737793],
        ['login-TOSRef', 2.4683587551116943],
        ['login-pagePwReset', -6.212322235107422],
        ['login-formTextPwReset', -6.053808689117432],
        ['login-formAttrsPwReset', -8.211761474609375],
        ['login-headingsPwReset', -11.253629684448242],
        ['login-layoutPwReset', 0.4598430097103119],
        ['login-pageRecovery', -5.4897871017456055],
        ['login-formTextRecovery', 0.07762860506772995],
        ['login-formAttrsRecovery', -40.195255279541016],
        ['login-headingsRecovery', -4.895695209503174],
        ['login-layoutRecovery', 1.057316541671753],
        ['login-identifierRecovery', 0.12504947185516357],
        ['login-submitRecovery', -4.9106764793396],
        ['login-formTextMFA', -0.05934861674904823],
        ['login-formAttrsMFA', -26.299407958984375],
        ['login-headingsMFA', -22.916475296020508],
        ['login-layoutMFA', -4.600418567657471],
        ['login-buttonVerify', -6.479672908782959],
        ['login-inputsMFA', -25.751291275024414],
        ['login-inputsOTP', -25.671937942504883],
        ['login-linkOTPOutlier', -7.173738479614258],
        ['login-newsletterForm', -13.255386352539062],
        ['login-searchForm', -9.221700668334961],
        ['login-multiStepForm', 4.251806735992432],
        ['login-multiAuthForm', 9.445104598999023],
        ['login-visibleRatio,fieldsCount', -15.529547691345215],
        ['login-visibleRatio,identifierCount', -22.172136306762695],
        ['login-visibleRatio,passwordCount', 5.5968098640441895],
        ['login-visibleRatio,hiddenIdentifierCount', -11.677139282226562],
        ['login-visibleRatio,hiddenPasswordCount', 19.041976928710938],
        ['login-identifierRatio,fieldsCount', -27.460391998291016],
        ['login-identifierRatio,identifierCount', 12.02029037475586],
        ['login-identifierRatio,passwordCount', -17.526430130004883],
        ['login-identifierRatio,hiddenIdentifierCount', -7.315640449523926],
        ['login-identifierRatio,hiddenPasswordCount', -0.040698520839214325],
        ['login-passwordRatio,fieldsCount', 1.7248457670211792],
        ['login-passwordRatio,identifierCount', -17.21712303161621],
        ['login-passwordRatio,passwordCount', -6.316142559051514],
        ['login-passwordRatio,hiddenIdentifierCount', 26.33108901977539],
        ['login-passwordRatio,hiddenPasswordCount', -1.0747411251068115],
        ['login-requiredRatio,fieldsCount', 26.6320743560791],
        ['login-requiredRatio,identifierCount', -19.553354263305664],
        ['login-requiredRatio,passwordCount', 12.187820434570312],
        ['login-requiredRatio,hiddenIdentifierCount', -24.331256866455078],
        ['login-requiredRatio,hiddenPasswordCount', 15.322750091552734],
    ],
    bias: -9.614014625549316,
    cutoff: 0.5,
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
        ['pw-change-fieldsCount', -2.8481903076171875],
        ['pw-change-inputCount', -2.3886334896087646],
        ['pw-change-fieldsetCount', -5.912428379058838],
        ['pw-change-textCount', -5.990647315979004],
        ['pw-change-textareaCount', -5.95221471786499],
        ['pw-change-selectCount', -6.0222296714782715],
        ['pw-change-optionsCount', -6.064083099365234],
        ['pw-change-checkboxCount', -5.998316287994385],
        ['pw-change-radioCount', -6.097909450531006],
        ['pw-change-identifierCount', -5.4331135749816895],
        ['pw-change-hiddenIdentifierCount', -3.6955792903900146],
        ['pw-change-usernameCount', -6.117460250854492],
        ['pw-change-emailCount', -4.808201789855957],
        ['pw-change-hiddenCount', -4.144172191619873],
        ['pw-change-hiddenPasswordCount', -5.939879417419434],
        ['pw-change-submitCount', -3.650822401046753],
        ['pw-change-hasTels', -6.040952682495117],
        ['pw-change-hasOAuth', -5.984445571899414],
        ['pw-change-hasCaptchas', -5.986526012420654],
        ['pw-change-hasFiles', -5.937445640563965],
        ['pw-change-hasDate', -5.929219722747803],
        ['pw-change-hasNumber', -6.111207008361816],
        ['pw-change-oneVisibleField', -5.988980770111084],
        ['pw-change-twoVisibleFields', -3.370114803314209],
        ['pw-change-threeOrMoreVisibleFields', -0.5322262644767761],
        ['pw-change-noPasswords', -6.043348789215088],
        ['pw-change-onePassword', -6.112224102020264],
        ['pw-change-twoPasswords', 8.669508934020996],
        ['pw-change-threeOrMorePasswords', 21.26068687438965],
        ['pw-change-noIdentifiers', -1.1738710403442383],
        ['pw-change-oneIdentifier', -5.923297882080078],
        ['pw-change-twoIdentifiers', -6.017084121704102],
        ['pw-change-threeOrMoreIdentifiers', 5.6236419677734375],
        ['pw-change-autofocusedIsIdentifier', -5.950615882873535],
        ['pw-change-autofocusedIsPassword', 19.42845344543457],
        ['pw-change-visibleRatio', -4.027029037475586],
        ['pw-change-inputRatio', -4.1531662940979],
        ['pw-change-hiddenRatio', -4.80095100402832],
        ['pw-change-identifierRatio', -5.653101921081543],
        ['pw-change-emailRatio', -5.424282550811768],
        ['pw-change-usernameRatio', -5.976687908172607],
        ['pw-change-passwordRatio', 2.3283112049102783],
        ['pw-change-requiredRatio', -4.36627197265625],
        ['pw-change-pageLogin', -6.732261657714844],
        ['pw-change-formTextLogin', -5.9396257400512695],
        ['pw-change-formAttrsLogin', -5.953321933746338],
        ['pw-change-headingsLogin', -5.9666571617126465],
        ['pw-change-layoutLogin', -6.06947660446167],
        ['pw-change-rememberMeCheckbox', -5.961350917816162],
        ['pw-change-troubleLink', -3.6367123126983643],
        ['pw-change-submitLogin', -5.923648834228516],
        ['pw-change-pageRegister', -6.015402793884277],
        ['pw-change-formTextRegister', 0.025614693760871887],
        ['pw-change-formAttrsRegister', -5.934909820556641],
        ['pw-change-headingsRegister', -6.092156410217285],
        ['pw-change-layoutRegister', -5.942289352416992],
        ['pw-change-pwNewRegister', 11.59775447845459],
        ['pw-change-pwConfirmRegister', 7.911227226257324],
        ['pw-change-submitRegister', -7.656772613525391],
        ['pw-change-TOSRef', -7.1127610206604],
        ['pw-change-pagePwReset', 15.484172821044922],
        ['pw-change-formTextPwReset', 22.03460693359375],
        ['pw-change-formAttrsPwReset', 2.5367958545684814],
        ['pw-change-headingsPwReset', 17.353065490722656],
        ['pw-change-layoutPwReset', 16.986431121826172],
        ['pw-change-pageRecovery', -5.949415683746338],
        ['pw-change-formTextRecovery', -0.0382135845720768],
        ['pw-change-formAttrsRecovery', -6.100940227508545],
        ['pw-change-headingsRecovery', -6.050272464752197],
        ['pw-change-layoutRecovery', -3.781451940536499],
        ['pw-change-identifierRecovery', -5.974039077758789],
        ['pw-change-submitRecovery', 0.18247336149215698],
        ['pw-change-formTextMFA', 0.02501104772090912],
        ['pw-change-formAttrsMFA', -6.05447244644165],
        ['pw-change-headingsMFA', -6.077754974365234],
        ['pw-change-layoutMFA', -6.097705364227295],
        ['pw-change-buttonVerify', -6.006418228149414],
        ['pw-change-inputsMFA', -6.026573657989502],
        ['pw-change-inputsOTP', -6.027590751647949],
        ['pw-change-linkOTPOutlier', -6.095644950866699],
        ['pw-change-newsletterForm', -5.968001365661621],
        ['pw-change-searchForm', -5.987920761108398],
        ['pw-change-multiStepForm', -6.029503345489502],
        ['pw-change-multiAuthForm', -6.0770182609558105],
        ['pw-change-visibleRatio,fieldsCount', -2.584895372390747],
        ['pw-change-visibleRatio,identifierCount', -5.717252731323242],
        ['pw-change-visibleRatio,passwordCount', 2.870640277862549],
        ['pw-change-visibleRatio,hiddenIdentifierCount', -2.634659767150879],
        ['pw-change-visibleRatio,hiddenPasswordCount', -6.006857395172119],
        ['pw-change-identifierRatio,fieldsCount', -4.4510908126831055],
        ['pw-change-identifierRatio,identifierCount', -5.513087749481201],
        ['pw-change-identifierRatio,passwordCount', -4.322287559509277],
        ['pw-change-identifierRatio,hiddenIdentifierCount', -6.021900177001953],
        ['pw-change-identifierRatio,hiddenPasswordCount', -5.915658473968506],
        ['pw-change-passwordRatio,fieldsCount', 5.113967418670654],
        ['pw-change-passwordRatio,identifierCount', -4.2111029624938965],
        ['pw-change-passwordRatio,passwordCount', 7.726372718811035],
        ['pw-change-passwordRatio,hiddenIdentifierCount', -0.15458758175373077],
        ['pw-change-passwordRatio,hiddenPasswordCount', -5.957005977630615],
        ['pw-change-requiredRatio,fieldsCount', -4.529336452484131],
        ['pw-change-requiredRatio,identifierCount', -6.010416507720947],
        ['pw-change-requiredRatio,passwordCount', -0.6101318001747131],
        ['pw-change-requiredRatio,hiddenIdentifierCount', 3.6422030925750732],
        ['pw-change-requiredRatio,hiddenPasswordCount', -6.063605308532715],
    ],
    bias: -4.193732261657715,
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
        ['register-fieldsCount', 2.7365384101867676],
        ['register-inputCount', 1.526401400566101],
        ['register-fieldsetCount', 7.595194339752197],
        ['register-textCount', 1.9591186046600342],
        ['register-textareaCount', 4.295413494110107],
        ['register-selectCount', -14.322192192077637],
        ['register-optionsCount', 6.372867584228516],
        ['register-checkboxCount', -25.58134651184082],
        ['register-radioCount', 8.12259578704834],
        ['register-identifierCount', 6.842962741851807],
        ['register-hiddenIdentifierCount', 35.57135772705078],
        ['register-usernameCount', -8.565374374389648],
        ['register-emailCount', 4.850265979766846],
        ['register-hiddenCount', -20.487878799438477],
        ['register-hiddenPasswordCount', 5.384941101074219],
        ['register-submitCount', 3.5318758487701416],
        ['register-hasTels', 1.5399526357650757],
        ['register-hasOAuth', 0.994251012802124],
        ['register-hasCaptchas', 6.88332462310791],
        ['register-hasFiles', -6.052669525146484],
        ['register-hasDate', 10.11670970916748],
        ['register-hasNumber', 16.904632568359375],
        ['register-oneVisibleField', 1.1260918378829956],
        ['register-twoVisibleFields', 0.1343432068824768],
        ['register-threeOrMoreVisibleFields', 0.0111689493060112],
        ['register-noPasswords', -5.157846927642822],
        ['register-onePassword', 2.4373795986175537],
        ['register-twoPasswords', 17.246688842773438],
        ['register-threeOrMorePasswords', -13.668084144592285],
        ['register-noIdentifiers', -9.50915241241455],
        ['register-oneIdentifier', 1.788213849067688],
        ['register-twoIdentifiers', 17.27617835998535],
        ['register-threeOrMoreIdentifiers', 10.102456092834473],
        ['register-autofocusedIsIdentifier', 1.633298635482788],
        ['register-autofocusedIsPassword', 9.798789978027344],
        ['register-visibleRatio', -3.491074800491333],
        ['register-inputRatio', -5.9665632247924805],
        ['register-hiddenRatio', 3.2592601776123047],
        ['register-identifierRatio', 1.7500896453857422],
        ['register-emailRatio', -4.816707134246826],
        ['register-usernameRatio', -5.000130653381348],
        ['register-passwordRatio', -1.870449423789978],
        ['register-requiredRatio', -14.629721641540527],
        ['register-pageLogin', -7.861294269561768],
        ['register-formTextLogin', -6.05075216293335],
        ['register-formAttrsLogin', -2.3934578895568848],
        ['register-headingsLogin', -19.908676147460938],
        ['register-layoutLogin', 3.691419839859009],
        ['register-rememberMeCheckbox', -14.110372543334961],
        ['register-troubleLink', -14.10214900970459],
        ['register-submitLogin', -6.90413761138916],
        ['register-pageRegister', 3.3116695880889893],
        ['register-formTextRegister', -0.05266030877828598],
        ['register-formAttrsRegister', 5.578619480133057],
        ['register-headingsRegister', 17.817285537719727],
        ['register-layoutRegister', -7.510166645050049],
        ['register-pwNewRegister', 12.909337043762207],
        ['register-pwConfirmRegister', 1.1008983850479126],
        ['register-submitRegister', 23.716062545776367],
        ['register-TOSRef', 17.248044967651367],
        ['register-pagePwReset', -7.939678192138672],
        ['register-formTextPwReset', -11.835357666015625],
        ['register-formAttrsPwReset', -6.255004405975342],
        ['register-headingsPwReset', -18.643762588500977],
        ['register-layoutPwReset', -49.66469192504883],
        ['register-pageRecovery', -9.195122718811035],
        ['register-formTextRecovery', 0.039262138307094574],
        ['register-formAttrsRecovery', -11.856793403625488],
        ['register-headingsRecovery', -22.191736221313477],
        ['register-layoutRecovery', 0.7747848033905029],
        ['register-identifierRecovery', -37.3946418762207],
        ['register-submitRecovery', -32.90058517456055],
        ['register-formTextMFA', 0.05387783795595169],
        ['register-formAttrsMFA', -9.73814868927002],
        ['register-headingsMFA', -5.8139214515686035],
        ['register-layoutMFA', 0.9685890674591064],
        ['register-buttonVerify', -5.672647476196289],
        ['register-inputsMFA', -5.730490684509277],
        ['register-inputsOTP', -16.044206619262695],
        ['register-linkOTPOutlier', 1.9066413640975952],
        ['register-newsletterForm', -23.270286560058594],
        ['register-searchForm', -9.418282508850098],
        ['register-multiStepForm', 9.998517990112305],
        ['register-multiAuthForm', 0.5664786100387573],
        ['register-visibleRatio,fieldsCount', -4.334528923034668],
        ['register-visibleRatio,identifierCount', 1.138769268989563],
        ['register-visibleRatio,passwordCount', 10.161757469177246],
        ['register-visibleRatio,hiddenIdentifierCount', -2.2444818019866943],
        ['register-visibleRatio,hiddenPasswordCount', -15.269997596740723],
        ['register-identifierRatio,fieldsCount', 7.056919097900391],
        ['register-identifierRatio,identifierCount', 3.2606136798858643],
        ['register-identifierRatio,passwordCount', -26.148401260375977],
        ['register-identifierRatio,hiddenIdentifierCount', -29.404996871948242],
        ['register-identifierRatio,hiddenPasswordCount', -8.372426986694336],
        ['register-passwordRatio,fieldsCount', 4.325541019439697],
        ['register-passwordRatio,identifierCount', -29.346399307250977],
        ['register-passwordRatio,passwordCount', -7.890344142913818],
        ['register-passwordRatio,hiddenIdentifierCount', 9.871172904968262],
        ['register-passwordRatio,hiddenPasswordCount', -20.90865135192871],
        ['register-requiredRatio,fieldsCount', 5.761897087097168],
        ['register-requiredRatio,identifierCount', -4.445411205291748],
        ['register-requiredRatio,passwordCount', -3.244279384613037],
        ['register-requiredRatio,hiddenIdentifierCount', 5.526087284088135],
        ['register-requiredRatio,hiddenPasswordCount', -9.32042407989502],
    ],
    bias: -0.1206408366560936,
    cutoff: 0.46,
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
        ['recovery-fieldsCount', 2.9400758743286133],
        ['recovery-inputCount', 1.4156217575073242],
        ['recovery-fieldsetCount', -11.345308303833008],
        ['recovery-textCount', -1.7885481119155884],
        ['recovery-textareaCount', -18.300233840942383],
        ['recovery-selectCount', -13.012760162353516],
        ['recovery-optionsCount', -16.654447555541992],
        ['recovery-checkboxCount', -6.046142578125],
        ['recovery-radioCount', -5.9216718673706055],
        ['recovery-identifierCount', 0.49050283432006836],
        ['recovery-hiddenIdentifierCount', -10.659427642822266],
        ['recovery-usernameCount', 9.935728073120117],
        ['recovery-emailCount', 2.751002550125122],
        ['recovery-hiddenCount', 2.346006155014038],
        ['recovery-hiddenPasswordCount', -11.15270709991455],
        ['recovery-submitCount', 10.279597282409668],
        ['recovery-hasTels', -14.608283996582031],
        ['recovery-hasOAuth', -13.703869819641113],
        ['recovery-hasCaptchas', 0.7788082957267761],
        ['recovery-hasFiles', -34.893306732177734],
        ['recovery-hasDate', -6.023577690124512],
        ['recovery-hasNumber', -6.076717376708984],
        ['recovery-oneVisibleField', -6.690365314483643],
        ['recovery-twoVisibleFields', -2.3553307056427],
        ['recovery-threeOrMoreVisibleFields', 3.791447162628174],
        ['recovery-noPasswords', 1.2346185445785522],
        ['recovery-onePassword', -11.431097984313965],
        ['recovery-twoPasswords', -6.062588214874268],
        ['recovery-threeOrMorePasswords', -5.943995952606201],
        ['recovery-noIdentifiers', -13.688651084899902],
        ['recovery-oneIdentifier', 0.7698816061019897],
        ['recovery-twoIdentifiers', 2.442234992980957],
        ['recovery-threeOrMoreIdentifiers', -6.990498065948486],
        ['recovery-autofocusedIsIdentifier', -2.1484360694885254],
        ['recovery-autofocusedIsPassword', -6.003495216369629],
        ['recovery-visibleRatio', -0.10806797444820404],
        ['recovery-inputRatio', -4.872962474822998],
        ['recovery-hiddenRatio', 0.6517966389656067],
        ['recovery-identifierRatio', -0.20546357333660126],
        ['recovery-emailRatio', 0.7434425950050354],
        ['recovery-usernameRatio', 9.052572250366211],
        ['recovery-passwordRatio', -10.246936798095703],
        ['recovery-requiredRatio', 0.6019076704978943],
        ['recovery-pageLogin', -1.948866367340088],
        ['recovery-formTextLogin', -5.998720645904541],
        ['recovery-formAttrsLogin', -0.2515008747577667],
        ['recovery-headingsLogin', 3.725409984588623],
        ['recovery-layoutLogin', -11.711709976196289],
        ['recovery-rememberMeCheckbox', -6.09298849105835],
        ['recovery-troubleLink', 8.051112174987793],
        ['recovery-submitLogin', -3.498271942138672],
        ['recovery-pageRegister', -10.68457317352295],
        ['recovery-formTextRegister', 0.008736751973628998],
        ['recovery-formAttrsRegister', -10.59521484375],
        ['recovery-headingsRegister', -4.158571243286133],
        ['recovery-layoutRegister', -8.111440658569336],
        ['recovery-pwNewRegister', -6.032068729400635],
        ['recovery-pwConfirmRegister', -6.094796180725098],
        ['recovery-submitRegister', -7.379069805145264],
        ['recovery-TOSRef', -13.373228073120117],
        ['recovery-pagePwReset', 7.180458068847656],
        ['recovery-formTextPwReset', -6.106141090393066],
        ['recovery-formAttrsPwReset', 12.659801483154297],
        ['recovery-headingsPwReset', 13.49061107635498],
        ['recovery-layoutPwReset', 6.877115726470947],
        ['recovery-pageRecovery', 16.70367431640625],
        ['recovery-formTextRecovery', -0.040419965982437134],
        ['recovery-formAttrsRecovery', 20.908884048461914],
        ['recovery-headingsRecovery', 4.627264499664307],
        ['recovery-layoutRecovery', 1.695294737815857],
        ['recovery-identifierRecovery', 17.204273223876953],
        ['recovery-submitRecovery', 17.62523078918457],
        ['recovery-formTextMFA', 0.061319418251514435],
        ['recovery-formAttrsMFA', 9.321166038513184],
        ['recovery-headingsMFA', -7.295744895935059],
        ['recovery-layoutMFA', -5.9808454513549805],
        ['recovery-buttonVerify', 2.191513776779175],
        ['recovery-inputsMFA', 7.641140937805176],
        ['recovery-inputsOTP', -0.15771014988422394],
        ['recovery-linkOTPOutlier', -0.0448339618742466],
        ['recovery-newsletterForm', -12.501127243041992],
        ['recovery-searchForm', -12.605632781982422],
        ['recovery-multiStepForm', 2.469677448272705],
        ['recovery-multiAuthForm', -7.0831780433654785],
        ['recovery-visibleRatio,fieldsCount', 2.840019702911377],
        ['recovery-visibleRatio,identifierCount', 0.2831270098686218],
        ['recovery-visibleRatio,passwordCount', -9.135893821716309],
        ['recovery-visibleRatio,hiddenIdentifierCount', -12.783178329467773],
        ['recovery-visibleRatio,hiddenPasswordCount', -11.395496368408203],
        ['recovery-identifierRatio,fieldsCount', 4.079711437225342],
        ['recovery-identifierRatio,identifierCount', 1.3354847431182861],
        ['recovery-identifierRatio,passwordCount', -11.817980766296387],
        ['recovery-identifierRatio,hiddenIdentifierCount', -23.93062973022461],
        ['recovery-identifierRatio,hiddenPasswordCount', -13.418746948242188],
        ['recovery-passwordRatio,fieldsCount', -9.931841850280762],
        ['recovery-passwordRatio,identifierCount', -11.876967430114746],
        ['recovery-passwordRatio,passwordCount', -9.66945743560791],
        ['recovery-passwordRatio,hiddenIdentifierCount', -6.075321197509766],
        ['recovery-passwordRatio,hiddenPasswordCount', -5.930257797241211],
        ['recovery-requiredRatio,fieldsCount', 7.384002685546875],
        ['recovery-requiredRatio,identifierCount', 1.282951831817627],
        ['recovery-requiredRatio,passwordCount', -7.517714500427246],
        ['recovery-requiredRatio,hiddenIdentifierCount', 8.469465255737305],
        ['recovery-requiredRatio,hiddenPasswordCount', -10.355533599853516],
    ],
    bias: -4.224118709564209,
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
        ['mfa-fieldsCount', -2.5596039295196533],
        ['mfa-inputCount', -1.7729307413101196],
        ['mfa-fieldsetCount', 8.667354583740234],
        ['mfa-textCount', 5.76961612701416],
        ['mfa-textareaCount', -20.12038803100586],
        ['mfa-selectCount', -5.983827114105225],
        ['mfa-optionsCount', -6.024016857147217],
        ['mfa-checkboxCount', 9.319907188415527],
        ['mfa-radioCount', -5.955873012542725],
        ['mfa-identifierCount', -3.073564052581787],
        ['mfa-hiddenIdentifierCount', -2.623547077178955],
        ['mfa-usernameCount', -3.487574815750122],
        ['mfa-emailCount', -6.170642852783203],
        ['mfa-hiddenCount', -0.26254186034202576],
        ['mfa-hiddenPasswordCount', -0.6044538617134094],
        ['mfa-submitCount', -3.443702220916748],
        ['mfa-hasTels', 13.53125286102295],
        ['mfa-hasOAuth', -6.519704341888428],
        ['mfa-hasCaptchas', -2.844921827316284],
        ['mfa-hasFiles', -6.053710460662842],
        ['mfa-hasDate', -6.024720191955566],
        ['mfa-hasNumber', 12.778427124023438],
        ['mfa-oneVisibleField', 4.992419242858887],
        ['mfa-twoVisibleFields', -5.3440842628479],
        ['mfa-threeOrMoreVisibleFields', -1.1785237789154053],
        ['mfa-noPasswords', -4.431365013122559],
        ['mfa-onePassword', -5.505108833312988],
        ['mfa-twoPasswords', -6.096486568450928],
        ['mfa-threeOrMorePasswords', -5.965544700622559],
        ['mfa-noIdentifiers', -7.453178405761719],
        ['mfa-oneIdentifier', -4.259815216064453],
        ['mfa-twoIdentifiers', -0.8673387765884399],
        ['mfa-threeOrMoreIdentifiers', 4.41920280456543],
        ['mfa-autofocusedIsIdentifier', -4.600342750549316],
        ['mfa-autofocusedIsPassword', 9.131182670593262],
        ['mfa-visibleRatio', 1.623889684677124],
        ['mfa-inputRatio', -4.899726867675781],
        ['mfa-hiddenRatio', 2.2869069576263428],
        ['mfa-identifierRatio', -2.864368438720703],
        ['mfa-emailRatio', -5.70602560043335],
        ['mfa-usernameRatio', -4.277356147766113],
        ['mfa-passwordRatio', -5.839899063110352],
        ['mfa-requiredRatio', 3.5811190605163574],
        ['mfa-pageLogin', 4.448996067047119],
        ['mfa-formTextLogin', -5.990734100341797],
        ['mfa-formAttrsLogin', -1.6031290292739868],
        ['mfa-headingsLogin', -5.236202239990234],
        ['mfa-layoutLogin', 1.0496279001235962],
        ['mfa-rememberMeCheckbox', 10.903768539428711],
        ['mfa-troubleLink', -3.6462314128875732],
        ['mfa-submitLogin', 2.839315176010132],
        ['mfa-pageRegister', -1.4743013381958008],
        ['mfa-formTextRegister', 0.04871033877134323],
        ['mfa-formAttrsRegister', -4.161473751068115],
        ['mfa-headingsRegister', -8.19443416595459],
        ['mfa-layoutRegister', -2.3123528957366943],
        ['mfa-pwNewRegister', -6.0207600593566895],
        ['mfa-pwConfirmRegister', -6.087559223175049],
        ['mfa-submitRegister', -6.100166320800781],
        ['mfa-TOSRef', -2.8497369289398193],
        ['mfa-pagePwReset', -5.912288188934326],
        ['mfa-formTextPwReset', -6.0012407302856445],
        ['mfa-formAttrsPwReset', -5.972422122955322],
        ['mfa-headingsPwReset', -6.056392669677734],
        ['mfa-layoutPwReset', -6.011496543884277],
        ['mfa-pageRecovery', 2.2252795696258545],
        ['mfa-formTextRecovery', 0.019121214747428894],
        ['mfa-formAttrsRecovery', -6.037517070770264],
        ['mfa-headingsRecovery', -6.09044075012207],
        ['mfa-layoutRecovery', 2.232365131378174],
        ['mfa-identifierRecovery', -5.961901664733887],
        ['mfa-submitRecovery', 4.537471294403076],
        ['mfa-formTextMFA', -0.0376896895468235],
        ['mfa-formAttrsMFA', 15.541340827941895],
        ['mfa-headingsMFA', 10.593486785888672],
        ['mfa-layoutMFA', 13.446844100952148],
        ['mfa-buttonVerify', 17.50172996520996],
        ['mfa-inputsMFA', 19.292192459106445],
        ['mfa-inputsOTP', 20.198415756225586],
        ['mfa-linkOTPOutlier', -2.095072031021118],
        ['mfa-newsletterForm', -6.087532043457031],
        ['mfa-searchForm', -6.054803371429443],
        ['mfa-multiStepForm', 6.050368309020996],
        ['mfa-multiAuthForm', -6.033696174621582],
        ['mfa-visibleRatio,fieldsCount', 0.6090023517608643],
        ['mfa-visibleRatio,identifierCount', -3.0494906902313232],
        ['mfa-visibleRatio,passwordCount', -4.823202610015869],
        ['mfa-visibleRatio,hiddenIdentifierCount', -6.935718536376953],
        ['mfa-visibleRatio,hiddenPasswordCount', 0.1293790191411972],
        ['mfa-identifierRatio,fieldsCount', -0.2538433074951172],
        ['mfa-identifierRatio,identifierCount', -2.0209360122680664],
        ['mfa-identifierRatio,passwordCount', -5.496519565582275],
        ['mfa-identifierRatio,hiddenIdentifierCount', 0.781065046787262],
        ['mfa-identifierRatio,hiddenPasswordCount', 3.0438997745513916],
        ['mfa-passwordRatio,fieldsCount', -5.434023857116699],
        ['mfa-passwordRatio,identifierCount', -5.578004360198975],
        ['mfa-passwordRatio,passwordCount', -5.729448318481445],
        ['mfa-passwordRatio,hiddenIdentifierCount', -8.532255172729492],
        ['mfa-passwordRatio,hiddenPasswordCount', -6.057740211486816],
        ['mfa-requiredRatio,fieldsCount', -3.5778751373291016],
        ['mfa-requiredRatio,identifierCount', -2.952903985977173],
        ['mfa-requiredRatio,passwordCount', -4.117243766784668],
        ['mfa-requiredRatio,hiddenIdentifierCount', -6.0506157875061035],
        ['mfa-requiredRatio,hiddenPasswordCount', -6.100858688354492],
    ],
    bias: -5.0885515213012695,
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
        ['pw-loginScore', 12.992179870605469],
        ['pw-registerScore', -13.702508926391602],
        ['pw-pwChangeScore', 1.8673198223114014],
        ['pw-exotic', -10.613602638244629],
        ['pw-autocompleteNew', -3.3215901851654053],
        ['pw-autocompleteCurrent', 0.2599114775657654],
        ['pw-autocompleteOff', -6.363431930541992],
        ['pw-isOnlyPassword', 5.498204708099365],
        ['pw-prevPwField', 4.474843502044678],
        ['pw-nextPwField', -6.830514907836914],
        ['pw-attrCreate', -4.864035129547119],
        ['pw-attrCurrent', 2.75652813911438],
        ['pw-attrConfirm', -7.239727020263672],
        ['pw-attrReset', -0.00671994686126709],
        ['pw-textCreate', -2.4736011028289795],
        ['pw-textCurrent', 1.3048971891403198],
        ['pw-textConfirm', -7.371985912322998],
        ['pw-textReset', -0.09196184575557709],
        ['pw-labelCreate', -8.009343147277832],
        ['pw-labelCurrent', 13.474520683288574],
        ['pw-labelConfirm', -7.349675178527832],
        ['pw-labelReset', -0.1214401051402092],
        ['pw-prevPwCreate', -9.399579048156738],
        ['pw-prevPwCurrent', -12.939789772033691],
        ['pw-prevPwConfirm', 0.0034162700176239014],
        ['pw-passwordOutlier', -7.778501033782959],
        ['pw-nextPwCreate', 14.85843276977539],
        ['pw-nextPwCurrent', -8.34938907623291],
        ['pw-nextPwConfirm', -7.804545879364014],
    ],
    bias: -4.657456874847412,
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
        ['pw[new]-loginScore', -12.058561325073242],
        ['pw[new]-registerScore', 13.032938003540039],
        ['pw[new]-pwChangeScore', 0.36275067925453186],
        ['pw[new]-exotic', 15.645320892333984],
        ['pw[new]-autocompleteNew', 1.3478732109069824],
        ['pw[new]-autocompleteCurrent', -0.5197566151618958],
        ['pw[new]-autocompleteOff', -1.25690495967865],
        ['pw[new]-isOnlyPassword', -2.158052682876587],
        ['pw[new]-prevPwField', 1.0784176588058472],
        ['pw[new]-nextPwField', 9.524215698242188],
        ['pw[new]-attrCreate', 3.5219922065734863],
        ['pw[new]-attrCurrent', 2.604919195175171],
        ['pw[new]-attrConfirm', 7.8190388679504395],
        ['pw[new]-attrReset', 0.0034725219011306763],
        ['pw[new]-textCreate', 1.6081228256225586],
        ['pw[new]-textCurrent', -1.4133905172348022],
        ['pw[new]-textConfirm', -16.01386833190918],
        ['pw[new]-textReset', -0.14053122699260712],
        ['pw[new]-labelCreate', 8.01559066772461],
        ['pw[new]-labelCurrent', -13.611574172973633],
        ['pw[new]-labelConfirm', 7.993121147155762],
        ['pw[new]-labelReset', -0.15678153932094574],
        ['pw[new]-prevPwCreate', 11.113568305969238],
        ['pw[new]-prevPwCurrent', 9.553613662719727],
        ['pw[new]-prevPwConfirm', -0.002662569284439087],
        ['pw[new]-passwordOutlier', -28.797277450561523],
        ['pw[new]-nextPwCreate', -12.149540901184082],
        ['pw[new]-nextPwCurrent', 8.677315711975098],
        ['pw[new]-nextPwConfirm', 9.681190490722656],
    ],
    bias: -2.794309139251709,
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
        ['username-autocompleteUsername', 8.474626541137695],
        ['username-autocompleteNickname', 0.14817649126052856],
        ['username-autocompleteEmail', -6.654385089874268],
        ['username-autocompleteOff', -0.2828303277492523],
        ['username-attrUsername', 17.842679977416992],
        ['username-textUsername', 15.515046119689941],
        ['username-labelUsername', 17.23072624206543],
        ['username-outlierUsername', -0.056655846536159515],
        ['username-loginUsername', 18.199918746948242],
        ['username-searchField', -6.852190971374512],
    ],
    bias: -9.663260459899902,
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
        ['username[hidden]-exotic', -7.201595306396484],
        ['username[hidden]-attrUsername', 14.08310604095459],
        ['username[hidden]-attrEmail', 13.06533145904541],
        ['username[hidden]-usernameAttr', 15.934941291809082],
        ['username[hidden]-autocompleteUsername', 1.2018840312957764],
        ['username[hidden]-visibleReadonly', 13.127303123474121],
        ['username[hidden]-hiddenEmailValue', 14.81102466583252],
        ['username[hidden]-hiddenTelValue', 6.42324686050415],
        ['username[hidden]-hiddenUsernameValue', -0.7779569029808044],
    ],
    bias: -20.726743698120117,
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
        ['email-autocompleteUsername', 1.1252037286758423],
        ['email-autocompleteNickname', 0.2138555943965912],
        ['email-autocompleteEmail', 6.368393898010254],
        ['email-typeEmail', 14.67851448059082],
        ['email-exactAttrEmail', 12.960061073303223],
        ['email-attrEmail', 2.34682559967041],
        ['email-textEmail', 13.789552688598633],
        ['email-labelEmail', 16.909412384033203],
        ['email-placeholderEmail', 13.988188743591309],
        ['email-searchField', -23.972293853759766],
    ],
    bias: -9.337285041809082,
    cutoff: 0.5,
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
        ['otp-mfaScore', 30.3487606048584],
        ['otp-exotic', -7.137122631072998],
        ['otp-linkOTPOutlier', -19.96540069580078],
        ['otp-hasCheckboxes', 7.13865852355957],
        ['otp-hidden', -0.144773930311203],
        ['otp-required', 2.4349186420440674],
        ['otp-nameMatch', -13.131083488464355],
        ['otp-idMatch', 11.660566329956055],
        ['otp-numericMode', -3.851679801940918],
        ['otp-autofocused', 6.676711559295654],
        ['otp-tabIndex1', -1.414788007736206],
        ['otp-patternOTP', 6.631680011749268],
        ['otp-maxLength1', 5.801357269287109],
        ['otp-maxLength5', -8.033831596374512],
        ['otp-minLength6', 16.035051345825195],
        ['otp-maxLength6', 5.964546203613281],
        ['otp-maxLength20', 3.2568984031677246],
        ['otp-autocompleteOTC', 0.012118622660636902],
        ['otp-autocompleteOff', -3.4546144008636475],
        ['otp-prevAligned', 1.6534451246261597],
        ['otp-prevArea', 2.1591508388519287],
        ['otp-nextAligned', -0.08918850123882294],
        ['otp-nextArea', 3.441152572631836],
        ['otp-attrMFA', 8.244762420654297],
        ['otp-attrOTP', 2.577644109725952],
        ['otp-attrOutlier', -8.758439064025879],
        ['otp-textMFA', 17.15410804748535],
        ['otp-textOTP', -9.568087577819824],
        ['otp-labelMFA', 1.1468793153762817],
        ['otp-labelOTP', 0.03938573598861694],
        ['otp-labelOutlier', -7.4117326736450195],
        ['otp-wrapperOTP', 19.71171760559082],
        ['otp-wrapperOutlier', -6.516125202178955],
        ['otp-emailOutlierCount', -9.128483772277832],
    ],
    bias: -19.63992691040039,
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
