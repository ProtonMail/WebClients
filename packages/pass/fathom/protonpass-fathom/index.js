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
    if (form.getAttribute('role') === 'search') {
        setIgnoreFlag(form);
        return false;
    }
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
    'multiStepForm',
    'multiAuthForm',
];

const results$a = {
    coeffs: [
        ['login-fieldsCount', 11.725445747375488],
        ['login-inputCount', 10.626245498657227],
        ['login-fieldsetCount', -20.81890296936035],
        ['login-textCount', 3.77339768409729],
        ['login-textareaCount', -6.075009822845459],
        ['login-selectCount', -6.223104953765869],
        ['login-optionsCount', -6.319584369659424],
        ['login-checkboxCount', 22.225143432617188],
        ['login-radioCount', -6.076148509979248],
        ['login-identifierCount', -3.2750813961029053],
        ['login-hiddenIdentifierCount', 5.5349016189575195],
        ['login-usernameCount', 18.499996185302734],
        ['login-emailCount', -17.156312942504883],
        ['login-hiddenCount', 10.544297218322754],
        ['login-hiddenPasswordCount', 26.336896896362305],
        ['login-submitCount', -11.637212753295898],
        ['login-hasTels', -13.901434898376465],
        ['login-hasOAuth', -2.5366621017456055],
        ['login-hasCaptchas', -3.150010824203491],
        ['login-hasFiles', -5.940340995788574],
        ['login-hasDate', -8.788620948791504],
        ['login-hasNumber', -5.941993236541748],
        ['login-oneVisibleField', -0.9883875846862793],
        ['login-twoVisibleFields', -1.1777317523956299],
        ['login-threeOrMoreVisibleFields', -15.343720436096191],
        ['login-noPasswords', -13.647881507873535],
        ['login-onePassword', 10.627350807189941],
        ['login-twoPasswords', -23.689191818237305],
        ['login-threeOrMorePasswords', -6.159444332122803],
        ['login-noIdentifiers', -13.019078254699707],
        ['login-oneIdentifier', -0.44115912914276123],
        ['login-twoIdentifiers', -3.191990613937378],
        ['login-threeOrMoreIdentifiers', -6.714956283569336],
        ['login-autofocusedIsIdentifier', 13.029179573059082],
        ['login-autofocusedIsPassword', 39.00701904296875],
        ['login-visibleRatio', 2.1593000888824463],
        ['login-inputRatio', 11.446563720703125],
        ['login-hiddenRatio', -19.615299224853516],
        ['login-identifierRatio', 11.496786117553711],
        ['login-emailRatio', 4.837247848510742],
        ['login-usernameRatio', -29.85820770263672],
        ['login-passwordRatio', -2.0521137714385986],
        ['login-requiredRatio', 5.983188152313232],
        ['login-pageLogin', 15.764145851135254],
        ['login-formTextLogin', 7.259737014770508],
        ['login-formAttrsLogin', 12.606192588806152],
        ['login-headingsLogin', 21.80347442626953],
        ['login-layoutLogin', 6.123431205749512],
        ['login-rememberMeCheckbox', 8.06137466430664],
        ['login-troubleLink', 17.389408111572266],
        ['login-submitLogin', 13.267350196838379],
        ['login-pageRegister', -10.945622444152832],
        ['login-formTextRegister', 0.007311031222343445],
        ['login-formAttrsRegister', -10.260626792907715],
        ['login-headingsRegister', -19.250534057617188],
        ['login-layoutRegister', 5.060390472412109],
        ['login-pwNewRegister', -24.608518600463867],
        ['login-pwConfirmRegister', -13.681562423706055],
        ['login-submitRegister', -13.414754867553711],
        ['login-TOSRef', 1.5832661390304565],
        ['login-pagePwReset', -6.046623706817627],
        ['login-formTextPwReset', -5.951635837554932],
        ['login-formAttrsPwReset', -7.912785053253174],
        ['login-headingsPwReset', -12.308841705322266],
        ['login-layoutPwReset', 0.6275712251663208],
        ['login-pageRecovery', -6.07105827331543],
        ['login-formTextRecovery', 0.09778143465518951],
        ['login-formAttrsRecovery', -43.17881393432617],
        ['login-headingsRecovery', -5.229526519775391],
        ['login-layoutRecovery', 0.6737422943115234],
        ['login-identifierRecovery', -0.2286282628774643],
        ['login-submitRecovery', -5.9729461669921875],
        ['login-formTextMFA', 0.0553470253944397],
        ['login-formAttrsMFA', -21.187437057495117],
        ['login-headingsMFA', -33.59749984741211],
        ['login-layoutMFA', -4.591343879699707],
        ['login-buttonVerify', -6.559649467468262],
        ['login-inputsMFA', -33.406856536865234],
        ['login-inputsOTP', -19.800048828125],
        ['login-linkOTPOutlier', -7.394368648529053],
        ['login-newsletterForm', -14.101893424987793],
        ['login-multiStepForm', 3.946436882019043],
        ['login-multiAuthForm', 13.45095157623291],
        ['login-visibleRatio,fieldsCount', -15.6968355178833],
        ['login-visibleRatio,identifierCount', -18.282176971435547],
        ['login-visibleRatio,passwordCount', 11.016883850097656],
        ['login-visibleRatio,hiddenIdentifierCount', -16.182069778442383],
        ['login-visibleRatio,hiddenPasswordCount', 19.068843841552734],
        ['login-identifierRatio,fieldsCount', -26.361268997192383],
        ['login-identifierRatio,identifierCount', 12.462213516235352],
        ['login-identifierRatio,passwordCount', -12.438212394714355],
        ['login-identifierRatio,hiddenIdentifierCount', -5.968883037567139],
        ['login-identifierRatio,hiddenPasswordCount', 2.9591498374938965],
        ['login-passwordRatio,fieldsCount', -1.6454728841781616],
        ['login-passwordRatio,identifierCount', -12.14718246459961],
        ['login-passwordRatio,passwordCount', -8.278331756591797],
        ['login-passwordRatio,hiddenIdentifierCount', 31.001728057861328],
        ['login-passwordRatio,hiddenPasswordCount', 4.0736212730407715],
        ['login-requiredRatio,fieldsCount', 28.438257217407227],
        ['login-requiredRatio,identifierCount', -23.42125701904297],
        ['login-requiredRatio,passwordCount', 11.667469024658203],
        ['login-requiredRatio,hiddenIdentifierCount', -26.45442008972168],
        ['login-requiredRatio,hiddenPasswordCount', 14.9402494430542],
    ],
    bias: -6.374873161315918,
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
        ['pw-change-fieldsCount', -2.6716346740722656],
        ['pw-change-inputCount', -2.397575616836548],
        ['pw-change-fieldsetCount', -5.9961957931518555],
        ['pw-change-textCount', -5.95554780960083],
        ['pw-change-textareaCount', -6.042261600494385],
        ['pw-change-selectCount', -6.024176597595215],
        ['pw-change-optionsCount', -6.051833629608154],
        ['pw-change-checkboxCount', -5.97920560836792],
        ['pw-change-radioCount', -6.024505615234375],
        ['pw-change-identifierCount', -5.47980260848999],
        ['pw-change-hiddenIdentifierCount', -3.5935235023498535],
        ['pw-change-usernameCount', -6.083439350128174],
        ['pw-change-emailCount', -4.80111837387085],
        ['pw-change-hiddenCount', -3.988703727722168],
        ['pw-change-hiddenPasswordCount', -6.019257545471191],
        ['pw-change-submitCount', -3.50559663772583],
        ['pw-change-hasTels', -6.098057746887207],
        ['pw-change-hasOAuth', -5.99216890335083],
        ['pw-change-hasCaptchas', -6.100138187408447],
        ['pw-change-hasFiles', -6.096917152404785],
        ['pw-change-hasDate', -5.980844974517822],
        ['pw-change-hasNumber', -6.07261323928833],
        ['pw-change-oneVisibleField', -6.066551208496094],
        ['pw-change-twoVisibleFields', -3.4268243312835693],
        ['pw-change-threeOrMoreVisibleFields', -0.4990698993206024],
        ['pw-change-noPasswords', -6.090176582336426],
        ['pw-change-onePassword', -6.059179782867432],
        ['pw-change-twoPasswords', 9.039470672607422],
        ['pw-change-threeOrMorePasswords', 20.770811080932617],
        ['pw-change-noIdentifiers', -0.09207089245319366],
        ['pw-change-oneIdentifier', -6.076951026916504],
        ['pw-change-twoIdentifiers', -6.053042411804199],
        ['pw-change-threeOrMoreIdentifiers', 5.9968695640563965],
        ['pw-change-autofocusedIsIdentifier', -6.088556289672852],
        ['pw-change-autofocusedIsPassword', 18.53382110595703],
        ['pw-change-visibleRatio', -3.9047210216522217],
        ['pw-change-inputRatio', -3.8967061042785645],
        ['pw-change-hiddenRatio', -4.740035057067871],
        ['pw-change-identifierRatio', -5.605809211730957],
        ['pw-change-emailRatio', -5.398078918457031],
        ['pw-change-usernameRatio', -5.981074810028076],
        ['pw-change-passwordRatio', 2.0487515926361084],
        ['pw-change-requiredRatio', -4.3621931076049805],
        ['pw-change-pageLogin', -6.762307643890381],
        ['pw-change-formTextLogin', -5.9216742515563965],
        ['pw-change-formAttrsLogin', -6.057751178741455],
        ['pw-change-headingsLogin', -6.0016188621521],
        ['pw-change-layoutLogin', -6.146265506744385],
        ['pw-change-rememberMeCheckbox', -6.072622776031494],
        ['pw-change-troubleLink', -3.658381462097168],
        ['pw-change-submitLogin', -5.929715633392334],
        ['pw-change-pageRegister', -6.023599147796631],
        ['pw-change-formTextRegister', 0.09169396758079529],
        ['pw-change-formAttrsRegister', -6.070674896240234],
        ['pw-change-headingsRegister', -5.999042510986328],
        ['pw-change-layoutRegister', -5.955739974975586],
        ['pw-change-pwNewRegister', 11.242355346679688],
        ['pw-change-pwConfirmRegister', 7.951043605804443],
        ['pw-change-submitRegister', -7.585386276245117],
        ['pw-change-TOSRef', -7.239301681518555],
        ['pw-change-pagePwReset', 16.496179580688477],
        ['pw-change-formTextPwReset', 21.85128402709961],
        ['pw-change-formAttrsPwReset', 2.94392991065979],
        ['pw-change-headingsPwReset', 17.44093132019043],
        ['pw-change-layoutPwReset', 17.1090030670166],
        ['pw-change-pageRecovery', -6.110716819763184],
        ['pw-change-formTextRecovery', -0.07845847308635712],
        ['pw-change-formAttrsRecovery', -6.010745525360107],
        ['pw-change-headingsRecovery', -6.031111717224121],
        ['pw-change-layoutRecovery', -3.7299232482910156],
        ['pw-change-identifierRecovery', -5.946127414703369],
        ['pw-change-submitRecovery', 0.38896769285202026],
        ['pw-change-formTextMFA', 0.030447527766227722],
        ['pw-change-formAttrsMFA', -6.051873683929443],
        ['pw-change-headingsMFA', -6.067746639251709],
        ['pw-change-layoutMFA', -6.054169178009033],
        ['pw-change-buttonVerify', -5.990885257720947],
        ['pw-change-inputsMFA', -6.0957136154174805],
        ['pw-change-inputsOTP', -5.9419145584106445],
        ['pw-change-linkOTPOutlier', -6.06301212310791],
        ['pw-change-newsletterForm', -5.996284484863281],
        ['pw-change-multiStepForm', -6.052727699279785],
        ['pw-change-multiAuthForm', -6.071904182434082],
        ['pw-change-visibleRatio,fieldsCount', -2.6067519187927246],
        ['pw-change-visibleRatio,identifierCount', -5.6286773681640625],
        ['pw-change-visibleRatio,passwordCount', 2.4945907592773438],
        ['pw-change-visibleRatio,hiddenIdentifierCount', -2.784126043319702],
        ['pw-change-visibleRatio,hiddenPasswordCount', -5.962773323059082],
        ['pw-change-identifierRatio,fieldsCount', -4.475679397583008],
        ['pw-change-identifierRatio,identifierCount', -5.406490802764893],
        ['pw-change-identifierRatio,passwordCount', -4.300992965698242],
        ['pw-change-identifierRatio,hiddenIdentifierCount', -6.076939582824707],
        ['pw-change-identifierRatio,hiddenPasswordCount', -5.945157527923584],
        ['pw-change-passwordRatio,fieldsCount', 4.808635234832764],
        ['pw-change-passwordRatio,identifierCount', -4.257535934448242],
        ['pw-change-passwordRatio,passwordCount', 7.2375359535217285],
        ['pw-change-passwordRatio,hiddenIdentifierCount', -0.6882748007774353],
        ['pw-change-passwordRatio,hiddenPasswordCount', -5.935505390167236],
        ['pw-change-requiredRatio,fieldsCount', -4.469051837921143],
        ['pw-change-requiredRatio,identifierCount', -6.021492958068848],
        ['pw-change-requiredRatio,passwordCount', -0.4999614655971527],
        ['pw-change-requiredRatio,hiddenIdentifierCount', 3.68343448638916],
        ['pw-change-requiredRatio,hiddenPasswordCount', -6.044042587280273],
    ],
    bias: -4.064694881439209,
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
        ['register-fieldsCount', 3.4945504665374756],
        ['register-inputCount', 2.979459285736084],
        ['register-fieldsetCount', -3.0524182319641113],
        ['register-textCount', 2.3531792163848877],
        ['register-textareaCount', 5.8876118659973145],
        ['register-selectCount', -15.573929786682129],
        ['register-optionsCount', 6.52154016494751],
        ['register-checkboxCount', -28.631258010864258],
        ['register-radioCount', 8.42431354522705],
        ['register-identifierCount', 6.02982759475708],
        ['register-hiddenIdentifierCount', 31.832454681396484],
        ['register-usernameCount', -2.9279141426086426],
        ['register-emailCount', 1.420092225074768],
        ['register-hiddenCount', -19.228578567504883],
        ['register-hiddenPasswordCount', 3.1080994606018066],
        ['register-submitCount', 6.556639194488525],
        ['register-hasTels', 4.090325832366943],
        ['register-hasOAuth', -0.3456766903400421],
        ['register-hasCaptchas', 4.678130149841309],
        ['register-hasFiles', -5.910589694976807],
        ['register-hasDate', 9.804954528808594],
        ['register-hasNumber', 17.86176872253418],
        ['register-oneVisibleField', 0.31031763553619385],
        ['register-twoVisibleFields', 0.8811953663825989],
        ['register-threeOrMoreVisibleFields', 0.0064131212420761585],
        ['register-noPasswords', -5.172858715057373],
        ['register-onePassword', 2.4189693927764893],
        ['register-twoPasswords', 14.50576114654541],
        ['register-threeOrMorePasswords', -13.040477752685547],
        ['register-noIdentifiers', -9.758536338806152],
        ['register-oneIdentifier', 1.4183640480041504],
        ['register-twoIdentifiers', 19.516063690185547],
        ['register-threeOrMoreIdentifiers', -2.3892810344696045],
        ['register-autofocusedIsIdentifier', 4.733534812927246],
        ['register-autofocusedIsPassword', 5.3966240882873535],
        ['register-visibleRatio', -4.48659610748291],
        ['register-inputRatio', -5.819036483764648],
        ['register-hiddenRatio', 0.46015506982803345],
        ['register-identifierRatio', 3.1835341453552246],
        ['register-emailRatio', -1.8577585220336914],
        ['register-usernameRatio', -7.254018783569336],
        ['register-passwordRatio', -0.4747120440006256],
        ['register-requiredRatio', -14.167722702026367],
        ['register-pageLogin', -7.982783794403076],
        ['register-formTextLogin', -6.126429080963135],
        ['register-formAttrsLogin', -6.338853359222412],
        ['register-headingsLogin', -20.586380004882812],
        ['register-layoutLogin', 2.093778371810913],
        ['register-rememberMeCheckbox', -13.718809127807617],
        ['register-troubleLink', -16.67795181274414],
        ['register-submitLogin', -3.1313328742980957],
        ['register-pageRegister', 1.9209928512573242],
        ['register-formTextRegister', -0.0045724958181381226],
        ['register-formAttrsRegister', 4.75892448425293],
        ['register-headingsRegister', 18.80119514465332],
        ['register-layoutRegister', -7.478273868560791],
        ['register-pwNewRegister', 15.481895446777344],
        ['register-pwConfirmRegister', 5.469972133636475],
        ['register-submitRegister', 23.44365692138672],
        ['register-TOSRef', 17.684831619262695],
        ['register-pagePwReset', -7.347794055938721],
        ['register-formTextPwReset', -10.864611625671387],
        ['register-formAttrsPwReset', -6.280684471130371],
        ['register-headingsPwReset', -29.388751983642578],
        ['register-layoutPwReset', -54.54165267944336],
        ['register-pageRecovery', -7.019683837890625],
        ['register-formTextRecovery', -0.05912523344159126],
        ['register-formAttrsRecovery', -12.447728157043457],
        ['register-headingsRecovery', -21.585256576538086],
        ['register-layoutRecovery', 0.3272983133792877],
        ['register-identifierRecovery', -39.55881881713867],
        ['register-submitRecovery', -34.62059020996094],
        ['register-formTextMFA', -0.0071078017354011536],
        ['register-formAttrsMFA', -7.217445373535156],
        ['register-headingsMFA', -6.653680324554443],
        ['register-layoutMFA', 2.964958906173706],
        ['register-buttonVerify', -9.217473983764648],
        ['register-inputsMFA', -8.1058931350708],
        ['register-inputsOTP', -11.28034782409668],
        ['register-linkOTPOutlier', 2.1676313877105713],
        ['register-newsletterForm', -26.481534957885742],
        ['register-multiStepForm', 9.586706161499023],
        ['register-multiAuthForm', 1.2826437950134277],
        ['register-visibleRatio,fieldsCount', -5.904531955718994],
        ['register-visibleRatio,identifierCount', -0.012711947783827782],
        ['register-visibleRatio,passwordCount', 7.680488586425781],
        ['register-visibleRatio,hiddenIdentifierCount', -3.1713955402374268],
        ['register-visibleRatio,hiddenPasswordCount', -18.91079330444336],
        ['register-identifierRatio,fieldsCount', 10.948991775512695],
        ['register-identifierRatio,identifierCount', 4.717922210693359],
        ['register-identifierRatio,passwordCount', -25.4810733795166],
        ['register-identifierRatio,hiddenIdentifierCount', -27.571557998657227],
        ['register-identifierRatio,hiddenPasswordCount', -3.9820079803466797],
        ['register-passwordRatio,fieldsCount', 9.443434715270996],
        ['register-passwordRatio,identifierCount', -26.99277687072754],
        ['register-passwordRatio,passwordCount', -2.24487042427063],
        ['register-passwordRatio,hiddenIdentifierCount', 11.157238960266113],
        ['register-passwordRatio,hiddenPasswordCount', -25.59488296508789],
        ['register-requiredRatio,fieldsCount', 7.7674241065979],
        ['register-requiredRatio,identifierCount', -4.757383346557617],
        ['register-requiredRatio,passwordCount', -4.024628162384033],
        ['register-requiredRatio,hiddenIdentifierCount', 5.051916122436523],
        ['register-requiredRatio,hiddenPasswordCount', -8.030379295349121],
    ],
    bias: -0.1719750314950943,
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
        ['recovery-fieldsCount', 3.2553699016571045],
        ['recovery-inputCount', 1.3008098602294922],
        ['recovery-fieldsetCount', -10.797595024108887],
        ['recovery-textCount', -2.2033708095550537],
        ['recovery-textareaCount', -21.010211944580078],
        ['recovery-selectCount', -13.000019073486328],
        ['recovery-optionsCount', -16.83919906616211],
        ['recovery-checkboxCount', -5.967132568359375],
        ['recovery-radioCount', -5.94044303894043],
        ['recovery-identifierCount', -0.13889379799365997],
        ['recovery-hiddenIdentifierCount', -11.84111213684082],
        ['recovery-usernameCount', 9.808138847351074],
        ['recovery-emailCount', 2.154104709625244],
        ['recovery-hiddenCount', 2.230222702026367],
        ['recovery-hiddenPasswordCount', -10.80984878540039],
        ['recovery-submitCount', 12.287556648254395],
        ['recovery-hasTels', -14.716729164123535],
        ['recovery-hasOAuth', -13.721078872680664],
        ['recovery-hasCaptchas', 0.2306137979030609],
        ['recovery-hasFiles', -33.5001220703125],
        ['recovery-hasDate', -5.927802085876465],
        ['recovery-hasNumber', -5.908432960510254],
        ['recovery-oneVisibleField', -6.556046485900879],
        ['recovery-twoVisibleFields', -2.434556245803833],
        ['recovery-threeOrMoreVisibleFields', 4.1461591720581055],
        ['recovery-noPasswords', 1.3183153867721558],
        ['recovery-onePassword', -11.152302742004395],
        ['recovery-twoPasswords', -5.998803615570068],
        ['recovery-threeOrMorePasswords', -6.046474456787109],
        ['recovery-noIdentifiers', -12.972670555114746],
        ['recovery-oneIdentifier', -0.036463845521211624],
        ['recovery-twoIdentifiers', 2.620373249053955],
        ['recovery-threeOrMoreIdentifiers', -6.362657070159912],
        ['recovery-autofocusedIsIdentifier', -2.6444218158721924],
        ['recovery-autofocusedIsPassword', -6.014139175415039],
        ['recovery-visibleRatio', -0.1568208783864975],
        ['recovery-inputRatio', -4.630037784576416],
        ['recovery-hiddenRatio', 1.174353837966919],
        ['recovery-identifierRatio', 0.08865606039762497],
        ['recovery-emailRatio', 1.111915946006775],
        ['recovery-usernameRatio', 9.735647201538086],
        ['recovery-passwordRatio', -10.095781326293945],
        ['recovery-requiredRatio', 0.8096671104431152],
        ['recovery-pageLogin', -2.070777177810669],
        ['recovery-formTextLogin', -5.9479660987854],
        ['recovery-formAttrsLogin', -0.4702494740486145],
        ['recovery-headingsLogin', 3.6440176963806152],
        ['recovery-layoutLogin', -11.51993179321289],
        ['recovery-rememberMeCheckbox', -5.957242965698242],
        ['recovery-troubleLink', 7.4980998039245605],
        ['recovery-submitLogin', -3.338888645172119],
        ['recovery-pageRegister', -10.880152702331543],
        ['recovery-formTextRegister', -0.07295489311218262],
        ['recovery-formAttrsRegister', -10.620723724365234],
        ['recovery-headingsRegister', -4.860330104827881],
        ['recovery-layoutRegister', -8.416434288024902],
        ['recovery-pwNewRegister', -6.079873085021973],
        ['recovery-pwConfirmRegister', -5.989262580871582],
        ['recovery-submitRegister', -7.438625335693359],
        ['recovery-TOSRef', -13.612589836120605],
        ['recovery-pagePwReset', -1.5808985233306885],
        ['recovery-formTextPwReset', -6.032834529876709],
        ['recovery-formAttrsPwReset', 12.581537246704102],
        ['recovery-headingsPwReset', 13.486205101013184],
        ['recovery-layoutPwReset', 6.718760013580322],
        ['recovery-pageRecovery', 17.655794143676758],
        ['recovery-formTextRecovery', 0.016639791429042816],
        ['recovery-formAttrsRecovery', 20.70596694946289],
        ['recovery-headingsRecovery', 4.599539756774902],
        ['recovery-layoutRecovery', 1.4678689241409302],
        ['recovery-identifierRecovery', 17.30868911743164],
        ['recovery-submitRecovery', 17.10416603088379],
        ['recovery-formTextMFA', -0.0634353756904602],
        ['recovery-formAttrsMFA', 9.206238746643066],
        ['recovery-headingsMFA', -6.731759071350098],
        ['recovery-layoutMFA', -5.9812774658203125],
        ['recovery-buttonVerify', 1.5946571826934814],
        ['recovery-inputsMFA', 7.329530239105225],
        ['recovery-inputsOTP', -0.5130854845046997],
        ['recovery-linkOTPOutlier', 0.5232038497924805],
        ['recovery-newsletterForm', -12.301982879638672],
        ['recovery-multiStepForm', 2.2250759601593018],
        ['recovery-multiAuthForm', -6.768128395080566],
        ['recovery-visibleRatio,fieldsCount', 2.4869492053985596],
        ['recovery-visibleRatio,identifierCount', 0.872784435749054],
        ['recovery-visibleRatio,passwordCount', -9.00064754486084],
        ['recovery-visibleRatio,hiddenIdentifierCount', -13.230440139770508],
        ['recovery-visibleRatio,hiddenPasswordCount', -11.053001403808594],
        ['recovery-identifierRatio,fieldsCount', 2.1993308067321777],
        ['recovery-identifierRatio,identifierCount', 1.4868738651275635],
        ['recovery-identifierRatio,passwordCount', -11.81612777709961],
        ['recovery-identifierRatio,hiddenIdentifierCount', -24.984148025512695],
        ['recovery-identifierRatio,hiddenPasswordCount', -13.185608863830566],
        ['recovery-passwordRatio,fieldsCount', -9.928667068481445],
        ['recovery-passwordRatio,identifierCount', -11.914421081542969],
        ['recovery-passwordRatio,passwordCount', -9.447561264038086],
        ['recovery-passwordRatio,hiddenIdentifierCount', -6.024905204772949],
        ['recovery-passwordRatio,hiddenPasswordCount', -6.06302547454834],
        ['recovery-requiredRatio,fieldsCount', 6.854339599609375],
        ['recovery-requiredRatio,identifierCount', 1.151843786239624],
        ['recovery-requiredRatio,passwordCount', -7.6980671882629395],
        ['recovery-requiredRatio,hiddenIdentifierCount', 9.17094612121582],
        ['recovery-requiredRatio,hiddenPasswordCount', -10.296317100524902],
    ],
    bias: -4.274966239929199,
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
        ['mfa-fieldsCount', -2.6207125186920166],
        ['mfa-inputCount', -2.2388434410095215],
        ['mfa-fieldsetCount', 10.456792831420898],
        ['mfa-textCount', -3.7954342365264893],
        ['mfa-textareaCount', -11.353403091430664],
        ['mfa-selectCount', -5.947690486907959],
        ['mfa-optionsCount', -6.041754722595215],
        ['mfa-checkboxCount', 9.558320045471191],
        ['mfa-radioCount', -6.049440383911133],
        ['mfa-identifierCount', -2.6007020473480225],
        ['mfa-hiddenIdentifierCount', -3.5679686069488525],
        ['mfa-usernameCount', -2.9875547885894775],
        ['mfa-emailCount', -6.242511749267578],
        ['mfa-hiddenCount', -2.1803064346313477],
        ['mfa-hiddenPasswordCount', -2.8459699153900146],
        ['mfa-submitCount', -3.7333624362945557],
        ['mfa-hasTels', 13.933267593383789],
        ['mfa-hasOAuth', -5.951715469360352],
        ['mfa-hasCaptchas', -3.7050909996032715],
        ['mfa-hasFiles', -5.985988616943359],
        ['mfa-hasDate', -6.022241592407227],
        ['mfa-hasNumber', 10.807915687561035],
        ['mfa-oneVisibleField', -1.2932435274124146],
        ['mfa-twoVisibleFields', -5.666956424713135],
        ['mfa-threeOrMoreVisibleFields', -0.9845492243766785],
        ['mfa-noPasswords', 0.10753463208675385],
        ['mfa-onePassword', -5.340447425842285],
        ['mfa-twoPasswords', -5.973757266998291],
        ['mfa-threeOrMorePasswords', -6.049101829528809],
        ['mfa-noIdentifiers', -1.1702882051467896],
        ['mfa-oneIdentifier', -3.9622912406921387],
        ['mfa-twoIdentifiers', -0.38344594836235046],
        ['mfa-threeOrMoreIdentifiers', 8.180106163024902],
        ['mfa-autofocusedIsIdentifier', -5.582520008087158],
        ['mfa-autofocusedIsPassword', 8.765304565429688],
        ['mfa-visibleRatio', -2.100888729095459],
        ['mfa-inputRatio', -2.628931999206543],
        ['mfa-hiddenRatio', -1.960499882698059],
        ['mfa-identifierRatio', -2.33551025390625],
        ['mfa-emailRatio', -5.863933086395264],
        ['mfa-usernameRatio', -3.4949259757995605],
        ['mfa-passwordRatio', -5.787347793579102],
        ['mfa-requiredRatio', 0.6969609260559082],
        ['mfa-pageLogin', 0.9498774409294128],
        ['mfa-formTextLogin', -5.982824802398682],
        ['mfa-formAttrsLogin', -1.8521018028259277],
        ['mfa-headingsLogin', -5.2776594161987305],
        ['mfa-layoutLogin', -0.260808527469635],
        ['mfa-rememberMeCheckbox', 10.295692443847656],
        ['mfa-troubleLink', -3.4790804386138916],
        ['mfa-submitLogin', 1.0609939098358154],
        ['mfa-pageRegister', -4.190007209777832],
        ['mfa-formTextRegister', -0.09458772838115692],
        ['mfa-formAttrsRegister', -3.925874948501587],
        ['mfa-headingsRegister', -7.608836650848389],
        ['mfa-layoutRegister', -2.0482230186462402],
        ['mfa-pwNewRegister', -5.991971969604492],
        ['mfa-pwConfirmRegister', -5.985835552215576],
        ['mfa-submitRegister', -5.91140079498291],
        ['mfa-TOSRef', -2.0123279094696045],
        ['mfa-pagePwReset', -7.139419078826904],
        ['mfa-formTextPwReset', -6.019408226013184],
        ['mfa-formAttrsPwReset', -6.084838390350342],
        ['mfa-headingsPwReset', -5.994566917419434],
        ['mfa-layoutPwReset', -5.951287269592285],
        ['mfa-pageRecovery', 2.915177822113037],
        ['mfa-formTextRecovery', -0.0893322303891182],
        ['mfa-formAttrsRecovery', -6.417341709136963],
        ['mfa-headingsRecovery', -5.99344539642334],
        ['mfa-layoutRecovery', 1.8196431398391724],
        ['mfa-identifierRecovery', -6.102517127990723],
        ['mfa-submitRecovery', -0.5712618827819824],
        ['mfa-formTextMFA', -0.027534693479537964],
        ['mfa-formAttrsMFA', 16.342025756835938],
        ['mfa-headingsMFA', 18.4125919342041],
        ['mfa-layoutMFA', 14.287229537963867],
        ['mfa-buttonVerify', 18.539640426635742],
        ['mfa-inputsMFA', 18.723209381103516],
        ['mfa-inputsOTP', 18.16505241394043],
        ['mfa-linkOTPOutlier', -2.132737398147583],
        ['mfa-newsletterForm', -5.95737361907959],
        ['mfa-multiStepForm', 3.9134862422943115],
        ['mfa-multiAuthForm', -5.9072489738464355],
        ['mfa-visibleRatio,fieldsCount', -0.267867773771286],
        ['mfa-visibleRatio,identifierCount', -2.098633289337158],
        ['mfa-visibleRatio,passwordCount', -4.819589138031006],
        ['mfa-visibleRatio,hiddenIdentifierCount', -8.101668357849121],
        ['mfa-visibleRatio,hiddenPasswordCount', -2.3649840354919434],
        ['mfa-identifierRatio,fieldsCount', 0.45534077286720276],
        ['mfa-identifierRatio,identifierCount', -1.3971556425094604],
        ['mfa-identifierRatio,passwordCount', -5.516412734985352],
        ['mfa-identifierRatio,hiddenIdentifierCount', -1.3048186302185059],
        ['mfa-identifierRatio,hiddenPasswordCount', -0.4707336723804474],
        ['mfa-passwordRatio,fieldsCount', -5.355390548706055],
        ['mfa-passwordRatio,identifierCount', -5.540007591247559],
        ['mfa-passwordRatio,passwordCount', -5.865854740142822],
        ['mfa-passwordRatio,hiddenIdentifierCount', -8.44914722442627],
        ['mfa-passwordRatio,hiddenPasswordCount', -6.0813727378845215],
        ['mfa-requiredRatio,fieldsCount', -3.650329113006592],
        ['mfa-requiredRatio,identifierCount', -2.707157611846924],
        ['mfa-requiredRatio,passwordCount', -4.006005764007568],
        ['mfa-requiredRatio,hiddenIdentifierCount', -5.955962181091309],
        ['mfa-requiredRatio,hiddenPasswordCount', -5.945948600769043],
    ],
    bias: -3.0186455249786377,
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
        ['pw-loginScore', 13.236885070800781],
        ['pw-registerScore', -13.857195854187012],
        ['pw-pwChangeScore', 2.2198729515075684],
        ['pw-exotic', -13.131092071533203],
        ['pw-autocompleteNew', -3.396143913269043],
        ['pw-autocompleteCurrent', 0.314621239900589],
        ['pw-autocompleteOff', -6.038039684295654],
        ['pw-isOnlyPassword', 5.799843788146973],
        ['pw-prevPwField', 4.720954418182373],
        ['pw-nextPwField', -6.883095741271973],
        ['pw-attrCreate', -5.583925247192383],
        ['pw-attrCurrent', 2.7498879432678223],
        ['pw-attrConfirm', -5.9263691902160645],
        ['pw-attrReset', -0.05493976175785065],
        ['pw-textCreate', -2.5135207176208496],
        ['pw-textCurrent', 1.6992590427398682],
        ['pw-textConfirm', -6.222351551055908],
        ['pw-textReset', -0.08843322843313217],
        ['pw-labelCreate', -7.060993671417236],
        ['pw-labelCurrent', 11.684165000915527],
        ['pw-labelConfirm', -6.173437118530273],
        ['pw-labelReset', -0.11192524433135986],
        ['pw-prevPwCreate', -9.289793014526367],
        ['pw-prevPwCurrent', -11.910720825195312],
        ['pw-prevPwConfirm', -0.1259409636259079],
        ['pw-passwordOutlier', -6.211104869842529],
        ['pw-nextPwCreate', 14.799498558044434],
        ['pw-nextPwCurrent', -6.388638973236084],
        ['pw-nextPwConfirm', -6.877970218658447],
    ],
    bias: -5.419941425323486,
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
        ['pw[new]-loginScore', -11.852014541625977],
        ['pw[new]-registerScore', 13.608892440795898],
        ['pw[new]-pwChangeScore', 1.1854650974273682],
        ['pw[new]-exotic', 15.829791069030762],
        ['pw[new]-autocompleteNew', 1.1660950183868408],
        ['pw[new]-autocompleteCurrent', -0.3577497899532318],
        ['pw[new]-autocompleteOff', -1.2543262243270874],
        ['pw[new]-isOnlyPassword', -1.930834174156189],
        ['pw[new]-prevPwField', 0.7932507991790771],
        ['pw[new]-nextPwField', 9.754301071166992],
        ['pw[new]-attrCreate', 3.5541915893554688],
        ['pw[new]-attrCurrent', 2.5035462379455566],
        ['pw[new]-attrConfirm', 7.726316452026367],
        ['pw[new]-attrReset', -0.16148915886878967],
        ['pw[new]-textCreate', 1.2823529243469238],
        ['pw[new]-textCurrent', -1.4522573947906494],
        ['pw[new]-textConfirm', -15.958395004272461],
        ['pw[new]-textReset', -0.024174600839614868],
        ['pw[new]-labelCreate', 8.297194480895996],
        ['pw[new]-labelCurrent', -11.131772994995117],
        ['pw[new]-labelConfirm', 8.020319938659668],
        ['pw[new]-labelReset', 0.05844596028327942],
        ['pw[new]-prevPwCreate', 11.507837295532227],
        ['pw[new]-prevPwCurrent', 10.203523635864258],
        ['pw[new]-prevPwConfirm', -0.04491019248962402],
        ['pw[new]-passwordOutlier', -28.579008102416992],
        ['pw[new]-nextPwCreate', -13.063688278198242],
        ['pw[new]-nextPwCurrent', 8.50689697265625],
        ['pw[new]-nextPwConfirm', 10.66259765625],
    ],
    bias: -3.252657651901245,
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
        ['username-autocompleteUsername', 8.41653823852539],
        ['username-autocompleteNickname', -0.2871973216533661],
        ['username-autocompleteEmail', -6.803471088409424],
        ['username-autocompleteOff', -0.3554999530315399],
        ['username-attrUsername', 18.268211364746094],
        ['username-textUsername', 15.885254859924316],
        ['username-labelUsername', 17.58189582824707],
        ['username-outlierUsername', -0.025074321776628494],
        ['username-loginUsername', 18.54961395263672],
    ],
    bias: -9.87160873413086,
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
        ['username[hidden]-exotic', -7.470910549163818],
        ['username[hidden]-attrUsername', 14.269033432006836],
        ['username[hidden]-attrEmail', 13.27592945098877],
        ['username[hidden]-usernameAttr', 16.307605743408203],
        ['username[hidden]-autocompleteUsername', 1.1873667240142822],
        ['username[hidden]-visibleReadonly', 13.298462867736816],
        ['username[hidden]-hiddenEmailValue', 14.984594345092773],
        ['username[hidden]-hiddenTelValue', 6.662757396697998],
        ['username[hidden]-hiddenUsernameValue', -0.8162922263145447],
    ],
    bias: -21.00225830078125,
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
        ['email-autocompleteUsername', 1.0693118572235107],
        ['email-autocompleteNickname', -0.021921098232269287],
        ['email-autocompleteEmail', 6.345229625701904],
        ['email-typeEmail', 15.434582710266113],
        ['email-exactAttrEmail', 13.538894653320312],
        ['email-attrEmail', 2.3784968852996826],
        ['email-textEmail', 14.900002479553223],
        ['email-labelEmail', 17.614238739013672],
        ['email-placeholderEmail', 15.152981758117676],
        ['email-attrSearch', -12.009746551513672],
        ['email-textSearch', -15.525876998901367],
    ],
    bias: -9.672197341918945,
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
        ['otp-mfaScore', 31.195446014404297],
        ['otp-exotic', -7.319861888885498],
        ['otp-linkOTPOutlier', -21.183917999267578],
        ['otp-hasCheckboxes', 7.358312606811523],
        ['otp-hidden', -0.16566631197929382],
        ['otp-required', 2.2821669578552246],
        ['otp-nameMatch', -13.48580265045166],
        ['otp-idMatch', 11.574029922485352],
        ['otp-numericMode', -3.9721665382385254],
        ['otp-autofocused', 6.889348983764648],
        ['otp-tabIndex1', -1.3264533281326294],
        ['otp-patternOTP', 6.6808953285217285],
        ['otp-maxLength1', 5.799335479736328],
        ['otp-maxLength5', -8.276202201843262],
        ['otp-minLength6', 17.267248153686523],
        ['otp-maxLength6', 6.453493595123291],
        ['otp-maxLength20', 3.242217540740967],
        ['otp-autocompleteOTC', 0.04127056896686554],
        ['otp-autocompleteOff', -3.273308515548706],
        ['otp-prevAligned', 1.8178852796554565],
        ['otp-prevArea', 1.947747826576233],
        ['otp-nextAligned', -0.15262265503406525],
        ['otp-nextArea', 3.389930009841919],
        ['otp-attrMFA', 8.35236644744873],
        ['otp-attrOTP', 2.4460017681121826],
        ['otp-attrOutlier', -8.773321151733398],
        ['otp-textMFA', 17.64327621459961],
        ['otp-textOTP', -9.582979202270508],
        ['otp-labelMFA', 0.9291111826896667],
        ['otp-labelOTP', -0.153327077627182],
        ['otp-labelOutlier', -7.342544078826904],
        ['otp-wrapperOTP', 19.91158103942871],
        ['otp-wrapperOutlier', -6.467994689941406],
        ['otp-emailOutlierCount', -9.350433349609375],
    ],
    bias: -20.199981689453125,
    cutoff: 0.91,
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
