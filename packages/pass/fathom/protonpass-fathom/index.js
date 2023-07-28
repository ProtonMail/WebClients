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
        ['login-fieldsCount', 13.520715713500977],
        ['login-inputCount', 12.725688934326172],
        ['login-fieldsetCount', -24.54279136657715],
        ['login-textCount', 2.09832501411438],
        ['login-textareaCount', -6.21756649017334],
        ['login-selectCount', -6.445385932922363],
        ['login-optionsCount', -6.5486602783203125],
        ['login-checkboxCount', 36.53668975830078],
        ['login-radioCount', -6.051115989685059],
        ['login-identifierCount', -3.514190196990967],
        ['login-hiddenIdentifierCount', 3.2453908920288086],
        ['login-usernameCount', 20.155893325805664],
        ['login-emailCount', -14.239907264709473],
        ['login-hiddenCount', 10.857547760009766],
        ['login-hiddenPasswordCount', 27.226978302001953],
        ['login-submitCount', -9.303533554077148],
        ['login-hasTels', -11.232872009277344],
        ['login-hasOAuth', -0.4822317361831665],
        ['login-hasCaptchas', -2.1053965091705322],
        ['login-hasFiles', -6.078967094421387],
        ['login-hasDate', -10.765762329101562],
        ['login-hasNumber', -5.940359592437744],
        ['login-oneVisibleField', 7.7487030029296875],
        ['login-twoVisibleFields', 3.7330875396728516],
        ['login-threeOrMoreVisibleFields', -11.078261375427246],
        ['login-noPasswords', -17.872163772583008],
        ['login-onePassword', 10.165416717529297],
        ['login-twoPasswords', -20.96967887878418],
        ['login-threeOrMorePasswords', -6.258634090423584],
        ['login-noIdentifiers', -17.50889015197754],
        ['login-oneIdentifier', -1.7954760789871216],
        ['login-twoIdentifiers', -6.747107028961182],
        ['login-threeOrMoreIdentifiers', -7.950955390930176],
        ['login-autofocusedIsIdentifier', 11.516515731811523],
        ['login-autofocusedIsPassword', 37.256011962890625],
        ['login-visibleRatio', 5.025142669677734],
        ['login-inputRatio', 7.057068347930908],
        ['login-hiddenRatio', -17.553821563720703],
        ['login-identifierRatio', 11.599613189697266],
        ['login-emailRatio', 4.432715892791748],
        ['login-usernameRatio', -28.089937210083008],
        ['login-passwordRatio', -1.4743984937667847],
        ['login-requiredRatio', 4.202847957611084],
        ['login-pageLogin', 13.917525291442871],
        ['login-formTextLogin', 8.37748908996582],
        ['login-formAttrsLogin', 9.86680793762207],
        ['login-headingsLogin', 18.553503036499023],
        ['login-layoutLogin', 5.4297590255737305],
        ['login-rememberMeCheckbox', 7.804076671600342],
        ['login-troubleLink', 20.434768676757812],
        ['login-submitLogin', 12.52289867401123],
        ['login-pageRegister', -9.868453025817871],
        ['login-formTextRegister', 0.006147749722003937],
        ['login-formAttrsRegister', -10.30859661102295],
        ['login-headingsRegister', -14.703168869018555],
        ['login-layoutRegister', 5.3226189613342285],
        ['login-pwNewRegister', -23.588655471801758],
        ['login-pwConfirmRegister', -14.890155792236328],
        ['login-submitRegister', -11.342576026916504],
        ['login-TOSRef', 1.966097116470337],
        ['login-pagePwReset', -6.160655975341797],
        ['login-formTextPwReset', -6.085625648498535],
        ['login-formAttrsPwReset', -8.432915687561035],
        ['login-headingsPwReset', -11.160608291625977],
        ['login-layoutPwReset', 1.5576483011245728],
        ['login-pageRecovery', -4.832557201385498],
        ['login-formTextRecovery', 0.020121850073337555],
        ['login-formAttrsRecovery', -39.35895919799805],
        ['login-headingsRecovery', -4.870311737060547],
        ['login-layoutRecovery', 0.6237899661064148],
        ['login-identifierRecovery', 0.015860458835959435],
        ['login-submitRecovery', -4.721786975860596],
        ['login-formTextMFA', -0.09381871670484543],
        ['login-formAttrsMFA', -24.686214447021484],
        ['login-headingsMFA', -22.95966339111328],
        ['login-layoutMFA', -4.470759391784668],
        ['login-buttonVerify', -6.738802909851074],
        ['login-inputsMFA', -24.144336700439453],
        ['login-inputsOTP', -24.501859664916992],
        ['login-linkOTPOutlier', -7.004944324493408],
        ['login-newsletterForm', -12.855938911437988],
        ['login-searchForm', -10.001572608947754],
        ['login-multiStepForm', 4.042037010192871],
        ['login-multiAuthForm', 8.5010986328125],
        ['login-visibleRatio,fieldsCount', -13.670567512512207],
        ['login-visibleRatio,identifierCount', -19.461668014526367],
        ['login-visibleRatio,passwordCount', 4.871696472167969],
        ['login-visibleRatio,hiddenIdentifierCount', -7.495360374450684],
        ['login-visibleRatio,hiddenPasswordCount', 16.615135192871094],
        ['login-identifierRatio,fieldsCount', -23.229290008544922],
        ['login-identifierRatio,identifierCount', 11.391852378845215],
        ['login-identifierRatio,passwordCount', -15.544483184814453],
        ['login-identifierRatio,hiddenIdentifierCount', -6.927156448364258],
        ['login-identifierRatio,hiddenPasswordCount', 0.3537141680717468],
        ['login-passwordRatio,fieldsCount', 3.1417629718780518],
        ['login-passwordRatio,identifierCount', -15.380514144897461],
        ['login-passwordRatio,passwordCount', -5.5665130615234375],
        ['login-passwordRatio,hiddenIdentifierCount', 22.84058952331543],
        ['login-passwordRatio,hiddenPasswordCount', 1.7562990188598633],
        ['login-requiredRatio,fieldsCount', 23.31458854675293],
        ['login-requiredRatio,identifierCount', -18.278100967407227],
        ['login-requiredRatio,passwordCount', 12.836394309997559],
        ['login-requiredRatio,hiddenIdentifierCount', -22.787090301513672],
        ['login-requiredRatio,hiddenPasswordCount', 16.702131271362305],
    ],
    bias: -7.669419288635254,
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
        ['pw-change-fieldsCount', -2.7185235023498535],
        ['pw-change-inputCount', -2.3396975994110107],
        ['pw-change-fieldsetCount', -5.999159336090088],
        ['pw-change-textCount', -6.034550189971924],
        ['pw-change-textareaCount', -5.965498447418213],
        ['pw-change-selectCount', -5.910266876220703],
        ['pw-change-optionsCount', -5.952794075012207],
        ['pw-change-checkboxCount', -5.99525785446167],
        ['pw-change-radioCount', -6.009548664093018],
        ['pw-change-identifierCount', -5.467770576477051],
        ['pw-change-hiddenIdentifierCount', -3.7171335220336914],
        ['pw-change-usernameCount', -6.044194221496582],
        ['pw-change-emailCount', -4.734224319458008],
        ['pw-change-hiddenCount', -4.075719356536865],
        ['pw-change-hiddenPasswordCount', -6.0577168464660645],
        ['pw-change-submitCount', -3.6188852787017822],
        ['pw-change-hasTels', -6.062276840209961],
        ['pw-change-hasOAuth', -6.020192623138428],
        ['pw-change-hasCaptchas', -6.094435691833496],
        ['pw-change-hasFiles', -6.019965648651123],
        ['pw-change-hasDate', -6.0917510986328125],
        ['pw-change-hasNumber', -5.9969801902771],
        ['pw-change-oneVisibleField', -6.002415657043457],
        ['pw-change-twoVisibleFields', -3.203550100326538],
        ['pw-change-threeOrMoreVisibleFields', -0.3700806796550751],
        ['pw-change-noPasswords', -6.080013751983643],
        ['pw-change-onePassword', -6.11261510848999],
        ['pw-change-twoPasswords', 8.676774978637695],
        ['pw-change-threeOrMorePasswords', 21.112510681152344],
        ['pw-change-noIdentifiers', -1.1796106100082397],
        ['pw-change-oneIdentifier', -6.061983585357666],
        ['pw-change-twoIdentifiers', -6.058173179626465],
        ['pw-change-threeOrMoreIdentifiers', 5.091548442840576],
        ['pw-change-autofocusedIsIdentifier', -6.00584077835083],
        ['pw-change-autofocusedIsPassword', 18.818191528320312],
        ['pw-change-visibleRatio', -3.9976882934570312],
        ['pw-change-inputRatio', -4.135244369506836],
        ['pw-change-hiddenRatio', -4.6928911209106445],
        ['pw-change-identifierRatio', -5.645566940307617],
        ['pw-change-emailRatio', -5.27990198135376],
        ['pw-change-usernameRatio', -5.980301380157471],
        ['pw-change-passwordRatio', 2.5697388648986816],
        ['pw-change-requiredRatio', -4.298543930053711],
        ['pw-change-pageLogin', -6.6545891761779785],
        ['pw-change-formTextLogin', -6.069674015045166],
        ['pw-change-formAttrsLogin', -6.008601665496826],
        ['pw-change-headingsLogin', -6.104516983032227],
        ['pw-change-layoutLogin', -6.113276481628418],
        ['pw-change-rememberMeCheckbox', -5.98100471496582],
        ['pw-change-troubleLink', -3.5083694458007812],
        ['pw-change-submitLogin', -5.973944187164307],
        ['pw-change-pageRegister', -6.042017459869385],
        ['pw-change-formTextRegister', -0.003753170371055603],
        ['pw-change-formAttrsRegister', -5.9885687828063965],
        ['pw-change-headingsRegister', -5.947304725646973],
        ['pw-change-layoutRegister', -6.022477626800537],
        ['pw-change-pwNewRegister', 11.521875381469727],
        ['pw-change-pwConfirmRegister', 8.078765869140625],
        ['pw-change-submitRegister', -7.831781387329102],
        ['pw-change-TOSRef', -7.210099697113037],
        ['pw-change-pagePwReset', 15.57581615447998],
        ['pw-change-formTextPwReset', 21.870664596557617],
        ['pw-change-formAttrsPwReset', 2.309565544128418],
        ['pw-change-headingsPwReset', 17.286724090576172],
        ['pw-change-layoutPwReset', 17.09604263305664],
        ['pw-change-pageRecovery', -5.921884059906006],
        ['pw-change-formTextRecovery', 0.0042142122983932495],
        ['pw-change-formAttrsRecovery', -6.043474197387695],
        ['pw-change-headingsRecovery', -6.025916576385498],
        ['pw-change-layoutRecovery', -3.7101008892059326],
        ['pw-change-identifierRecovery', -6.074601650238037],
        ['pw-change-submitRecovery', 0.21354593336582184],
        ['pw-change-formTextMFA', -0.08205196261405945],
        ['pw-change-formAttrsMFA', -6.066544532775879],
        ['pw-change-headingsMFA', -6.087264537811279],
        ['pw-change-layoutMFA', -6.056689262390137],
        ['pw-change-buttonVerify', -5.951312065124512],
        ['pw-change-inputsMFA', -5.948700904846191],
        ['pw-change-inputsOTP', -6.0769572257995605],
        ['pw-change-linkOTPOutlier', -6.0518364906311035],
        ['pw-change-newsletterForm', -6.098276615142822],
        ['pw-change-searchForm', -6.091826438903809],
        ['pw-change-multiStepForm', -6.061645030975342],
        ['pw-change-multiAuthForm', -5.940724849700928],
        ['pw-change-visibleRatio,fieldsCount', -2.4180796146392822],
        ['pw-change-visibleRatio,identifierCount', -5.571571350097656],
        ['pw-change-visibleRatio,passwordCount', 3.2050883769989014],
        ['pw-change-visibleRatio,hiddenIdentifierCount', -2.8612427711486816],
        ['pw-change-visibleRatio,hiddenPasswordCount', -5.957703590393066],
        ['pw-change-identifierRatio,fieldsCount', -4.398279666900635],
        ['pw-change-identifierRatio,identifierCount', -5.3426947593688965],
        ['pw-change-identifierRatio,passwordCount', -4.260673522949219],
        ['pw-change-identifierRatio,hiddenIdentifierCount', -5.975846767425537],
        ['pw-change-identifierRatio,hiddenPasswordCount', -6.025809288024902],
        ['pw-change-passwordRatio,fieldsCount', 5.445197105407715],
        ['pw-change-passwordRatio,identifierCount', -4.19246244430542],
        ['pw-change-passwordRatio,passwordCount', 7.724081516265869],
        ['pw-change-passwordRatio,hiddenIdentifierCount', -0.5562503933906555],
        ['pw-change-passwordRatio,hiddenPasswordCount', -5.928243637084961],
        ['pw-change-requiredRatio,fieldsCount', -4.557121753692627],
        ['pw-change-requiredRatio,identifierCount', -6.004215240478516],
        ['pw-change-requiredRatio,passwordCount', -0.4066564440727234],
        ['pw-change-requiredRatio,hiddenIdentifierCount', 2.6814191341400146],
        ['pw-change-requiredRatio,hiddenPasswordCount', -6.092998504638672],
    ],
    bias: -4.181266784667969,
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
        ['register-fieldsCount', 2.362370252609253],
        ['register-inputCount', 2.837401866912842],
        ['register-fieldsetCount', 8.765313148498535],
        ['register-textCount', 1.9133893251419067],
        ['register-textareaCount', 4.142133712768555],
        ['register-selectCount', -14.224530220031738],
        ['register-optionsCount', 6.330267906188965],
        ['register-checkboxCount', -25.936145782470703],
        ['register-radioCount', 8.224635124206543],
        ['register-identifierCount', 7.2187299728393555],
        ['register-hiddenIdentifierCount', 37.0082893371582],
        ['register-usernameCount', -8.83796501159668],
        ['register-emailCount', 4.869508743286133],
        ['register-hiddenCount', -21.550113677978516],
        ['register-hiddenPasswordCount', 5.203642845153809],
        ['register-submitCount', 3.790332555770874],
        ['register-hasTels', 1.5802510976791382],
        ['register-hasOAuth', 0.8392359018325806],
        ['register-hasCaptchas', 7.090299129486084],
        ['register-hasFiles', -6.01978063583374],
        ['register-hasDate', 9.183618545532227],
        ['register-hasNumber', 17.424856185913086],
        ['register-oneVisibleField', 1.0652649402618408],
        ['register-twoVisibleFields', -0.014923891983926296],
        ['register-threeOrMoreVisibleFields', -0.3994748592376709],
        ['register-noPasswords', -5.247304916381836],
        ['register-onePassword', 2.5430071353912354],
        ['register-twoPasswords', 17.91921043395996],
        ['register-threeOrMorePasswords', -12.995139122009277],
        ['register-noIdentifiers', -9.501411437988281],
        ['register-oneIdentifier', 1.9811484813690186],
        ['register-twoIdentifiers', 17.65282440185547],
        ['register-threeOrMoreIdentifiers', 9.001635551452637],
        ['register-autofocusedIsIdentifier', 1.7433881759643555],
        ['register-autofocusedIsPassword', 10.129890441894531],
        ['register-visibleRatio', -3.7862579822540283],
        ['register-inputRatio', -6.217695713043213],
        ['register-hiddenRatio', 3.421144723892212],
        ['register-identifierRatio', 1.7580124139785767],
        ['register-emailRatio', -4.794466018676758],
        ['register-usernameRatio', -5.049823760986328],
        ['register-passwordRatio', -1.7093111276626587],
        ['register-requiredRatio', -15.015048027038574],
        ['register-pageLogin', -8.104620933532715],
        ['register-formTextLogin', -6.126318454742432],
        ['register-formAttrsLogin', -2.523662805557251],
        ['register-headingsLogin', -20.404699325561523],
        ['register-layoutLogin', 4.029855251312256],
        ['register-rememberMeCheckbox', -13.76594066619873],
        ['register-troubleLink', -14.39452075958252],
        ['register-submitLogin', -7.199018955230713],
        ['register-pageRegister', 3.3388426303863525],
        ['register-formTextRegister', 0.08324933797121048],
        ['register-formAttrsRegister', 5.551745891571045],
        ['register-headingsRegister', 18.434162139892578],
        ['register-layoutRegister', -7.501842498779297],
        ['register-pwNewRegister', 13.238775253295898],
        ['register-pwConfirmRegister', 0.9260985255241394],
        ['register-submitRegister', 24.358577728271484],
        ['register-TOSRef', 17.698013305664062],
        ['register-pagePwReset', -7.533756256103516],
        ['register-formTextPwReset', -11.096601486206055],
        ['register-formAttrsPwReset', -6.135773658752441],
        ['register-headingsPwReset', -19.26188850402832],
        ['register-layoutPwReset', -50.745513916015625],
        ['register-pageRecovery', -9.36242389678955],
        ['register-formTextRecovery', -0.08290725201368332],
        ['register-formAttrsRecovery', -11.68251895904541],
        ['register-headingsRecovery', -22.864294052124023],
        ['register-layoutRecovery', 0.5531991720199585],
        ['register-identifierRecovery', -38.80854415893555],
        ['register-submitRecovery', -34.05256271362305],
        ['register-formTextMFA', -0.053467243909835815],
        ['register-formAttrsMFA', -10.316544532775879],
        ['register-headingsMFA', -6.048505783081055],
        ['register-layoutMFA', 1.4168857336044312],
        ['register-buttonVerify', -5.761650562286377],
        ['register-inputsMFA', -5.611318588256836],
        ['register-inputsOTP', -16.50144386291504],
        ['register-linkOTPOutlier', 1.8946620225906372],
        ['register-newsletterForm', -24.141237258911133],
        ['register-searchForm', -9.003437995910645],
        ['register-multiStepForm', 10.418683052062988],
        ['register-multiAuthForm', 0.8877530694007874],
        ['register-visibleRatio,fieldsCount', -4.94736909866333],
        ['register-visibleRatio,identifierCount', 1.2236768007278442],
        ['register-visibleRatio,passwordCount', 10.930631637573242],
        ['register-visibleRatio,hiddenIdentifierCount', -2.8793866634368896],
        ['register-visibleRatio,hiddenPasswordCount', -15.696733474731445],
        ['register-identifierRatio,fieldsCount', 8.976302146911621],
        ['register-identifierRatio,identifierCount', 3.3057174682617188],
        ['register-identifierRatio,passwordCount', -27.75908088684082],
        ['register-identifierRatio,hiddenIdentifierCount', -30.63140869140625],
        ['register-identifierRatio,hiddenPasswordCount', -8.314364433288574],
        ['register-passwordRatio,fieldsCount', 4.567010402679443],
        ['register-passwordRatio,identifierCount', -30.78325843811035],
        ['register-passwordRatio,passwordCount', -8.563604354858398],
        ['register-passwordRatio,hiddenIdentifierCount', 9.453499794006348],
        ['register-passwordRatio,hiddenPasswordCount', -21.219482421875],
        ['register-requiredRatio,fieldsCount', 6.070632457733154],
        ['register-requiredRatio,identifierCount', -4.97599458694458],
        ['register-requiredRatio,passwordCount', -3.0610127449035645],
        ['register-requiredRatio,hiddenIdentifierCount', 5.481305122375488],
        ['register-requiredRatio,hiddenPasswordCount', -7.142623424530029],
    ],
    bias: -0.184351846575737,
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
        ['recovery-fieldsCount', 2.9468753337860107],
        ['recovery-inputCount', 1.3503469228744507],
        ['recovery-fieldsetCount', -10.810975074768066],
        ['recovery-textCount', -1.8279292583465576],
        ['recovery-textareaCount', -21.492197036743164],
        ['recovery-selectCount', -13.592978477478027],
        ['recovery-optionsCount', -17.58130645751953],
        ['recovery-checkboxCount', -6.0524983406066895],
        ['recovery-radioCount', -5.997797012329102],
        ['recovery-identifierCount', 0.6705901026725769],
        ['recovery-hiddenIdentifierCount', -10.739842414855957],
        ['recovery-usernameCount', 9.889817237854004],
        ['recovery-emailCount', 3.0324909687042236],
        ['recovery-hiddenCount', 2.290848970413208],
        ['recovery-hiddenPasswordCount', -11.020482063293457],
        ['recovery-submitCount', 10.217000961303711],
        ['recovery-hasTels', -14.358436584472656],
        ['recovery-hasOAuth', -13.818014144897461],
        ['recovery-hasCaptchas', 0.8105263113975525],
        ['recovery-hasFiles', -33.370689392089844],
        ['recovery-hasDate', -5.96655797958374],
        ['recovery-hasNumber', -6.0155439376831055],
        ['recovery-oneVisibleField', -6.761075973510742],
        ['recovery-twoVisibleFields', -2.4473540782928467],
        ['recovery-threeOrMoreVisibleFields', 4.076838970184326],
        ['recovery-noPasswords', 1.1535019874572754],
        ['recovery-onePassword', -11.37360954284668],
        ['recovery-twoPasswords', -6.176883697509766],
        ['recovery-threeOrMorePasswords', -5.964442729949951],
        ['recovery-noIdentifiers', -13.237776756286621],
        ['recovery-oneIdentifier', 0.8827781677246094],
        ['recovery-twoIdentifiers', 2.3528895378112793],
        ['recovery-threeOrMoreIdentifiers', -7.170403480529785],
        ['recovery-autofocusedIsIdentifier', -2.1456665992736816],
        ['recovery-autofocusedIsPassword', -6.100790500640869],
        ['recovery-visibleRatio', -0.2284478396177292],
        ['recovery-inputRatio', -4.862339496612549],
        ['recovery-hiddenRatio', 0.6300581693649292],
        ['recovery-identifierRatio', -0.0008907365845516324],
        ['recovery-emailRatio', 0.7129876017570496],
        ['recovery-usernameRatio', 9.101212501525879],
        ['recovery-passwordRatio', -10.24507999420166],
        ['recovery-requiredRatio', 0.5008516311645508],
        ['recovery-pageLogin', -1.9654295444488525],
        ['recovery-formTextLogin', -6.046305179595947],
        ['recovery-formAttrsLogin', -0.20629888772964478],
        ['recovery-headingsLogin', 3.684687614440918],
        ['recovery-layoutLogin', -11.729497909545898],
        ['recovery-rememberMeCheckbox', -6.098155498504639],
        ['recovery-troubleLink', 8.048826217651367],
        ['recovery-submitLogin', -3.496102809906006],
        ['recovery-pageRegister', -10.78529167175293],
        ['recovery-formTextRegister', 0.07379800826311111],
        ['recovery-formAttrsRegister', -10.632439613342285],
        ['recovery-headingsRegister', -4.230288505554199],
        ['recovery-layoutRegister', -8.162598609924316],
        ['recovery-pwNewRegister', -5.915377616882324],
        ['recovery-pwConfirmRegister', -6.005645275115967],
        ['recovery-submitRegister', -7.558742523193359],
        ['recovery-TOSRef', -13.41579818725586],
        ['recovery-pagePwReset', 7.072674751281738],
        ['recovery-formTextPwReset', -6.124579429626465],
        ['recovery-formAttrsPwReset', 12.587642669677734],
        ['recovery-headingsPwReset', 13.445631980895996],
        ['recovery-layoutPwReset', 7.3640289306640625],
        ['recovery-pageRecovery', 16.70408821105957],
        ['recovery-formTextRecovery', 0.09002750366926193],
        ['recovery-formAttrsRecovery', 20.956863403320312],
        ['recovery-headingsRecovery', 4.639616966247559],
        ['recovery-layoutRecovery', 1.6746588945388794],
        ['recovery-identifierRecovery', 17.248889923095703],
        ['recovery-submitRecovery', 17.55217933654785],
        ['recovery-formTextMFA', 0.09250178188085556],
        ['recovery-formAttrsMFA', 9.312702178955078],
        ['recovery-headingsMFA', -7.346992015838623],
        ['recovery-layoutMFA', -6.046095848083496],
        ['recovery-buttonVerify', 2.245163679122925],
        ['recovery-inputsMFA', 7.326199531555176],
        ['recovery-inputsOTP', -0.3742956221103668],
        ['recovery-linkOTPOutlier', 0.03263930603861809],
        ['recovery-newsletterForm', -12.622711181640625],
        ['recovery-searchForm', -12.154385566711426],
        ['recovery-multiStepForm', 2.5059449672698975],
        ['recovery-multiAuthForm', -7.017187595367432],
        ['recovery-visibleRatio,fieldsCount', 2.8967862129211426],
        ['recovery-visibleRatio,identifierCount', 0.30757084488868713],
        ['recovery-visibleRatio,passwordCount', -9.224845886230469],
        ['recovery-visibleRatio,hiddenIdentifierCount', -12.625198364257812],
        ['recovery-visibleRatio,hiddenPasswordCount', -11.22750473022461],
        ['recovery-identifierRatio,fieldsCount', 4.218894004821777],
        ['recovery-identifierRatio,identifierCount', 1.2468029260635376],
        ['recovery-identifierRatio,passwordCount', -11.789216041564941],
        ['recovery-identifierRatio,hiddenIdentifierCount', -23.854400634765625],
        ['recovery-identifierRatio,hiddenPasswordCount', -13.74135684967041],
        ['recovery-passwordRatio,fieldsCount', -10.033166885375977],
        ['recovery-passwordRatio,identifierCount', -11.931415557861328],
        ['recovery-passwordRatio,passwordCount', -9.740442276000977],
        ['recovery-passwordRatio,hiddenIdentifierCount', -6.072946071624756],
        ['recovery-passwordRatio,hiddenPasswordCount', -5.952763080596924],
        ['recovery-requiredRatio,fieldsCount', 7.939888954162598],
        ['recovery-requiredRatio,identifierCount', 1.4586714506149292],
        ['recovery-requiredRatio,passwordCount', -7.755424499511719],
        ['recovery-requiredRatio,hiddenIdentifierCount', 8.597173690795898],
        ['recovery-requiredRatio,hiddenPasswordCount', -10.700529098510742],
    ],
    bias: -4.4366536140441895,
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
        ['mfa-fieldsCount', -2.5352344512939453],
        ['mfa-inputCount', -2.2596518993377686],
        ['mfa-fieldsetCount', 9.168499946594238],
        ['mfa-textCount', -3.830913543701172],
        ['mfa-textareaCount', -12.279956817626953],
        ['mfa-selectCount', -6.029440879821777],
        ['mfa-optionsCount', -6.103457450866699],
        ['mfa-checkboxCount', 10.036210060119629],
        ['mfa-radioCount', -5.925504207611084],
        ['mfa-identifierCount', -2.5354225635528564],
        ['mfa-hiddenIdentifierCount', -3.5855026245117188],
        ['mfa-usernameCount', -3.0602524280548096],
        ['mfa-emailCount', -6.215173244476318],
        ['mfa-hiddenCount', -1.8928254842758179],
        ['mfa-hiddenPasswordCount', -2.7605128288269043],
        ['mfa-submitCount', -3.383518934249878],
        ['mfa-hasTels', 14.10832405090332],
        ['mfa-hasOAuth', -6.050330638885498],
        ['mfa-hasCaptchas', -3.4902596473693848],
        ['mfa-hasFiles', -6.039501190185547],
        ['mfa-hasDate', -6.024112224578857],
        ['mfa-hasNumber', 11.431431770324707],
        ['mfa-oneVisibleField', -1.2681443691253662],
        ['mfa-twoVisibleFields', -5.593074798583984],
        ['mfa-threeOrMoreVisibleFields', -1.0365729331970215],
        ['mfa-noPasswords', -0.1619742065668106],
        ['mfa-onePassword', -5.395876407623291],
        ['mfa-twoPasswords', -5.911652088165283],
        ['mfa-threeOrMorePasswords', -5.909731864929199],
        ['mfa-noIdentifiers', -1.5478696823120117],
        ['mfa-oneIdentifier', -3.91365385055542],
        ['mfa-twoIdentifiers', -0.30769965052604675],
        ['mfa-threeOrMoreIdentifiers', 8.300286293029785],
        ['mfa-autofocusedIsIdentifier', -5.487388610839844],
        ['mfa-autofocusedIsPassword', 8.171111106872559],
        ['mfa-visibleRatio', -2.219055414199829],
        ['mfa-inputRatio', -2.4705567359924316],
        ['mfa-hiddenRatio', -1.1380927562713623],
        ['mfa-identifierRatio', -2.431986093521118],
        ['mfa-emailRatio', -5.942597389221191],
        ['mfa-usernameRatio', -3.5471761226654053],
        ['mfa-passwordRatio', -5.7649359703063965],
        ['mfa-requiredRatio', -0.0819646492600441],
        ['mfa-pageLogin', 0.48778676986694336],
        ['mfa-formTextLogin', -5.97883415222168],
        ['mfa-formAttrsLogin', -1.8712424039840698],
        ['mfa-headingsLogin', -5.147589683532715],
        ['mfa-layoutLogin', 0.1822393387556076],
        ['mfa-rememberMeCheckbox', 11.12238883972168],
        ['mfa-troubleLink', -3.595855236053467],
        ['mfa-submitLogin', 1.2079999446868896],
        ['mfa-pageRegister', -4.169407844543457],
        ['mfa-formTextRegister', 0.021801725029945374],
        ['mfa-formAttrsRegister', -4.12054967880249],
        ['mfa-headingsRegister', -7.482975006103516],
        ['mfa-layoutRegister', -2.0715880393981934],
        ['mfa-pwNewRegister', -5.980484485626221],
        ['mfa-pwConfirmRegister', -5.922152519226074],
        ['mfa-submitRegister', -5.999881744384766],
        ['mfa-TOSRef', -2.3809683322906494],
        ['mfa-pagePwReset', -6.084693431854248],
        ['mfa-formTextPwReset', -5.964926242828369],
        ['mfa-formAttrsPwReset', -5.9853835105896],
        ['mfa-headingsPwReset', -5.944786548614502],
        ['mfa-layoutPwReset', -6.026767730712891],
        ['mfa-pageRecovery', 0.10128218680620193],
        ['mfa-formTextRecovery', 0.03583992272615433],
        ['mfa-formAttrsRecovery', -6.131645202636719],
        ['mfa-headingsRecovery', -5.973701477050781],
        ['mfa-layoutRecovery', 2.112729549407959],
        ['mfa-identifierRecovery', -6.040597438812256],
        ['mfa-submitRecovery', -0.5088043212890625],
        ['mfa-formTextMFA', -0.04993769899010658],
        ['mfa-formAttrsMFA', 16.836654663085938],
        ['mfa-headingsMFA', 19.18885612487793],
        ['mfa-layoutMFA', 14.88567066192627],
        ['mfa-buttonVerify', 18.75471305847168],
        ['mfa-inputsMFA', 18.60780143737793],
        ['mfa-inputsOTP', 18.72716522216797],
        ['mfa-linkOTPOutlier', -1.914113998413086],
        ['mfa-newsletterForm', -6.049367427825928],
        ['mfa-searchForm', -6.157653331756592],
        ['mfa-multiStepForm', 4.077035903930664],
        ['mfa-multiAuthForm', -6.020055770874023],
        ['mfa-visibleRatio,fieldsCount', -0.19913317263126373],
        ['mfa-visibleRatio,identifierCount', -2.236660957336426],
        ['mfa-visibleRatio,passwordCount', -4.933017253875732],
        ['mfa-visibleRatio,hiddenIdentifierCount', -7.850498199462891],
        ['mfa-visibleRatio,hiddenPasswordCount', -2.2999541759490967],
        ['mfa-identifierRatio,fieldsCount', 0.4287944436073303],
        ['mfa-identifierRatio,identifierCount', -1.4442564249038696],
        ['mfa-identifierRatio,passwordCount', -5.574307918548584],
        ['mfa-identifierRatio,hiddenIdentifierCount', -0.8090336918830872],
        ['mfa-identifierRatio,hiddenPasswordCount', -0.2954331636428833],
        ['mfa-passwordRatio,fieldsCount', -5.37825870513916],
        ['mfa-passwordRatio,identifierCount', -5.596229553222656],
        ['mfa-passwordRatio,passwordCount', -5.733912944793701],
        ['mfa-passwordRatio,hiddenIdentifierCount', -8.260907173156738],
        ['mfa-passwordRatio,hiddenPasswordCount', -5.920205116271973],
        ['mfa-requiredRatio,fieldsCount', -3.8394527435302734],
        ['mfa-requiredRatio,identifierCount', -2.853469133377075],
        ['mfa-requiredRatio,passwordCount', -4.214841365814209],
        ['mfa-requiredRatio,hiddenIdentifierCount', -5.997474670410156],
        ['mfa-requiredRatio,hiddenPasswordCount', -6.066811561584473],
    ],
    bias: -2.750563859939575,
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
        ['pw-loginScore', 12.887166023254395],
        ['pw-registerScore', -13.405702590942383],
        ['pw-pwChangeScore', 2.6071674823760986],
        ['pw-exotic', -12.550917625427246],
        ['pw-autocompleteNew', -3.408633232116699],
        ['pw-autocompleteCurrent', 0.8965198993682861],
        ['pw-autocompleteOff', -4.487673759460449],
        ['pw-isOnlyPassword', 5.900580406188965],
        ['pw-prevPwField', 5.347959041595459],
        ['pw-nextPwField', -6.7714948654174805],
        ['pw-attrCreate', -5.640598297119141],
        ['pw-attrCurrent', 3.0741946697235107],
        ['pw-attrConfirm', -6.180918216705322],
        ['pw-attrReset', -0.07674689590930939],
        ['pw-textCreate', -2.5166683197021484],
        ['pw-textCurrent', 1.610274076461792],
        ['pw-textConfirm', -6.297961235046387],
        ['pw-textReset', 0.18272946774959564],
        ['pw-labelCreate', -6.821840763092041],
        ['pw-labelCurrent', 12.961837768554688],
        ['pw-labelConfirm', -6.5445051193237305],
        ['pw-labelReset', 0.0004947483539581299],
        ['pw-prevPwCreate', -9.032193183898926],
        ['pw-prevPwCurrent', -12.046880722045898],
        ['pw-prevPwConfirm', -0.08800123631954193],
        ['pw-passwordOutlier', -6.50806999206543],
        ['pw-nextPwCreate', 15.495784759521484],
        ['pw-nextPwCurrent', -7.467685699462891],
        ['pw-nextPwConfirm', -6.764221668243408],
    ],
    bias: -6.981969356536865,
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
        ['pw[new]-loginScore', -11.681303024291992],
        ['pw[new]-registerScore', 13.370966911315918],
        ['pw[new]-pwChangeScore', 1.0602260828018188],
        ['pw[new]-exotic', 15.827722549438477],
        ['pw[new]-autocompleteNew', 1.470073938369751],
        ['pw[new]-autocompleteCurrent', -0.4377177059650421],
        ['pw[new]-autocompleteOff', -1.1774088144302368],
        ['pw[new]-isOnlyPassword', -1.915258765220642],
        ['pw[new]-prevPwField', 0.9167068004608154],
        ['pw[new]-nextPwField', 9.527260780334473],
        ['pw[new]-attrCreate', 3.7244374752044678],
        ['pw[new]-attrCurrent', 2.8675432205200195],
        ['pw[new]-attrConfirm', 7.626920223236084],
        ['pw[new]-attrReset', -0.023226246237754822],
        ['pw[new]-textCreate', 1.429916262626648],
        ['pw[new]-textCurrent', -1.461758017539978],
        ['pw[new]-textConfirm', -15.714858055114746],
        ['pw[new]-textReset', 0.1688387244939804],
        ['pw[new]-labelCreate', 7.77410888671875],
        ['pw[new]-labelCurrent', -13.488378524780273],
        ['pw[new]-labelConfirm', 7.817841529846191],
        ['pw[new]-labelReset', -0.014650598168373108],
        ['pw[new]-prevPwCreate', 10.933138847351074],
        ['pw[new]-prevPwCurrent', 9.294036865234375],
        ['pw[new]-prevPwConfirm', 0.04368200898170471],
        ['pw[new]-passwordOutlier', -28.666568756103516],
        ['pw[new]-nextPwCreate', -12.405623435974121],
        ['pw[new]-nextPwCurrent', 8.7117919921875],
        ['pw[new]-nextPwConfirm', 9.800070762634277],
    ],
    bias: -3.2627315521240234,
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
        ['username-autocompleteUsername', 8.453776359558105],
        ['username-autocompleteNickname', 0.15657112002372742],
        ['username-autocompleteEmail', -6.43278169631958],
        ['username-autocompleteOff', -0.3063298761844635],
        ['username-attrUsername', 18.27342414855957],
        ['username-textUsername', 15.821564674377441],
        ['username-labelUsername', 17.645084381103516],
        ['username-outlierUsername', -0.060660842806100845],
        ['username-loginUsername', 18.617919921875],
        ['username-searchField', -7.105180740356445],
    ],
    bias: -9.840888977050781,
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
        ['username[hidden]-exotic', -7.471665382385254],
        ['username[hidden]-attrUsername', 14.034014701843262],
        ['username[hidden]-attrEmail', 12.979315757751465],
        ['username[hidden]-usernameAttr', 16.11762046813965],
        ['username[hidden]-autocompleteUsername', 1.2201379537582397],
        ['username[hidden]-visibleReadonly', 13.086629867553711],
        ['username[hidden]-hiddenEmailValue', 14.759063720703125],
        ['username[hidden]-hiddenTelValue', 6.474707126617432],
        ['username[hidden]-hiddenUsernameValue', -0.821063220500946],
    ],
    bias: -20.621335983276367,
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
        ['email-autocompleteUsername', 1.0545445680618286],
        ['email-autocompleteNickname', 0.07911506295204163],
        ['email-autocompleteEmail', 6.347902774810791],
        ['email-typeEmail', 14.962794303894043],
        ['email-exactAttrEmail', 13.265423774719238],
        ['email-attrEmail', 2.3036444187164307],
        ['email-textEmail', 14.076379776000977],
        ['email-labelEmail', 17.22669792175293],
        ['email-placeholderEmail', 14.27724838256836],
        ['email-searchField', -24.477981567382812],
    ],
    bias: -9.442915916442871,
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
        ['otp-mfaScore', 30.561687469482422],
        ['otp-exotic', -7.120991230010986],
        ['otp-linkOTPOutlier', -21.506916046142578],
        ['otp-hasCheckboxes', 7.534667491912842],
        ['otp-hidden', 0.1000768393278122],
        ['otp-required', 2.338167667388916],
        ['otp-nameMatch', -13.208819389343262],
        ['otp-idMatch', 10.627521514892578],
        ['otp-numericMode', -3.8777897357940674],
        ['otp-autofocused', 6.799271106719971],
        ['otp-tabIndex1', -1.445034384727478],
        ['otp-patternOTP', 6.559115409851074],
        ['otp-maxLength1', 5.732285022735596],
        ['otp-maxLength5', -8.417411804199219],
        ['otp-minLength6', 16.015207290649414],
        ['otp-maxLength6', 7.036752700805664],
        ['otp-maxLength20', 3.289212703704834],
        ['otp-autocompleteOTC', -0.04099671542644501],
        ['otp-autocompleteOff', -3.2142837047576904],
        ['otp-prevAligned', 1.851654291152954],
        ['otp-prevArea', 1.9150481224060059],
        ['otp-nextAligned', -0.10469051450490952],
        ['otp-nextArea', 3.397153615951538],
        ['otp-attrMFA', 8.215556144714355],
        ['otp-attrOTP', 2.3986175060272217],
        ['otp-attrOutlier', -8.661820411682129],
        ['otp-textMFA', 17.283239364624023],
        ['otp-textOTP', -9.357173919677734],
        ['otp-labelMFA', 0.8944563865661621],
        ['otp-labelOTP', 0.17145930230617523],
        ['otp-labelOutlier', -7.198430061340332],
        ['otp-wrapperOTP', 19.489887237548828],
        ['otp-wrapperOutlier', -6.286083698272705],
        ['otp-emailOutlierCount', -9.156597137451172],
    ],
    bias: -19.804664611816406,
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
