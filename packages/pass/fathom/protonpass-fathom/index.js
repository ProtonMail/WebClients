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

const getFormTypeScore = (formFnode, type) => {
    if (!formFnode) return 0;
    if (formFnode.element.getAttribute(DETECTED_FORM_TYPE_ATTR) === type) return 1;
    return formFnode === null || formFnode === void 0 ? void 0 : formFnode.scoreFor(type);
};

const belongsToType = (type) => (fnode) => fnode.scoreFor(type) > 0.5;

const hasDetectedType = (attr, type) => (fnode) => {
    const types = fnode.element.getAttribute(attr);
    return types ? types.split(',').includes(type) : false;
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
        ['login-fieldsCount', 10.27695369720459],
        ['login-inputCount', 9.661706924438477],
        ['login-fieldsetCount', -19.932655334472656],
        ['login-textCount', 2.8491644859313965],
        ['login-textareaCount', -6.357441425323486],
        ['login-selectCount', -6.1367645263671875],
        ['login-optionsCount', -6.05983829498291],
        ['login-checkboxCount', 21.154315948486328],
        ['login-radioCount', -5.971171855926514],
        ['login-identifierCount', -3.0254297256469727],
        ['login-hiddenIdentifierCount', 5.358208656311035],
        ['login-usernameCount', 16.078428268432617],
        ['login-emailCount', -15.951881408691406],
        ['login-hiddenCount', 10.080843925476074],
        ['login-hiddenPasswordCount', 26.071043014526367],
        ['login-submitCount', -10.653684616088867],
        ['login-hasTels', -12.779458045959473],
        ['login-hasOAuth', -1.7884162664413452],
        ['login-hasCaptchas', -3.0323262214660645],
        ['login-hasFiles', -6.074101448059082],
        ['login-hasDate', -10.741790771484375],
        ['login-hasNumber', -6.101858139038086],
        ['login-oneVisibleField', -0.7167248725891113],
        ['login-twoVisibleFields', -0.799645185470581],
        ['login-threeOrMoreVisibleFields', -13.850621223449707],
        ['login-noPasswords', -13.780590057373047],
        ['login-onePassword', 9.65305233001709],
        ['login-twoPasswords', -23.651287078857422],
        ['login-threeOrMorePasswords', -6.115752220153809],
        ['login-noIdentifiers', -12.609249114990234],
        ['login-oneIdentifier', -1.6273330450057983],
        ['login-twoIdentifiers', -5.832719326019287],
        ['login-threeOrMoreIdentifiers', -7.6949944496154785],
        ['login-autofocusedIsIdentifier', 12.36885929107666],
        ['login-autofocusedIsPassword', 37.610328674316406],
        ['login-visibleRatio', 2.2463622093200684],
        ['login-inputRatio', 10.407634735107422],
        ['login-hiddenRatio', -17.736160278320312],
        ['login-identifierRatio', 11.448105812072754],
        ['login-emailRatio', 4.513611316680908],
        ['login-usernameRatio', -27.450851440429688],
        ['login-passwordRatio', -2.1021907329559326],
        ['login-requiredRatio', 5.348166465759277],
        ['login-pageLogin', 15.219881057739258],
        ['login-formTextLogin', 8.519853591918945],
        ['login-formAttrsLogin', 12.114972114562988],
        ['login-headingsLogin', 20.936498641967773],
        ['login-layoutLogin', 5.882449626922607],
        ['login-rememberMeCheckbox', 7.6395487785339355],
        ['login-troubleLink', 16.821630477905273],
        ['login-submitLogin', 12.532029151916504],
        ['login-pageRegister', -10.72409725189209],
        ['login-formTextRegister', -0.015799470245838165],
        ['login-formAttrsRegister', -10.284379005432129],
        ['login-headingsRegister', -17.8315372467041],
        ['login-layoutRegister', 4.89511775970459],
        ['login-pwNewRegister', -23.976987838745117],
        ['login-pwConfirmRegister', -13.262980461120605],
        ['login-submitRegister', -12.959815979003906],
        ['login-TOSRef', 1.2667299509048462],
        ['login-pagePwReset', -6.159398078918457],
        ['login-formTextPwReset', -6.075018405914307],
        ['login-formAttrsPwReset', -8.347546577453613],
        ['login-headingsPwReset', -11.96090030670166],
        ['login-layoutPwReset', 1.6898921728134155],
        ['login-pageRecovery', -5.444727897644043],
        ['login-formTextRecovery', 0.058323219418525696],
        ['login-formAttrsRecovery', -42.35942077636719],
        ['login-headingsRecovery', -5.040038108825684],
        ['login-layoutRecovery', 0.373422771692276],
        ['login-identifierRecovery', -0.34159785509109497],
        ['login-submitRecovery', -5.807678699493408],
        ['login-formTextMFA', 0.07075153291225433],
        ['login-formAttrsMFA', -20.016521453857422],
        ['login-headingsMFA', -33.07623291015625],
        ['login-layoutMFA', -4.546694278717041],
        ['login-buttonVerify', -6.682317733764648],
        ['login-inputsMFA', -31.54873275756836],
        ['login-inputsOTP', -19.17946434020996],
        ['login-linkOTPOutlier', -7.253574848175049],
        ['login-newsletterForm', -13.699087142944336],
        ['login-multiStepForm', 3.7575223445892334],
        ['login-multiAuthForm', 12.491703987121582],
        ['login-visibleRatio,fieldsCount', -13.69456958770752],
        ['login-visibleRatio,identifierCount', -15.98935317993164],
        ['login-visibleRatio,passwordCount', 10.033353805541992],
        ['login-visibleRatio,hiddenIdentifierCount', -13.357564926147461],
        ['login-visibleRatio,hiddenPasswordCount', 17.44478416442871],
        ['login-identifierRatio,fieldsCount', -22.976701736450195],
        ['login-identifierRatio,identifierCount', 11.824065208435059],
        ['login-identifierRatio,passwordCount', -11.5476655960083],
        ['login-identifierRatio,hiddenIdentifierCount', -6.348403453826904],
        ['login-identifierRatio,hiddenPasswordCount', 3.2370336055755615],
        ['login-passwordRatio,fieldsCount', -1.5892915725708008],
        ['login-passwordRatio,identifierCount', -11.35520076751709],
        ['login-passwordRatio,passwordCount', -7.2907538414001465],
        ['login-passwordRatio,hiddenIdentifierCount', 27.8272647857666],
        ['login-passwordRatio,hiddenPasswordCount', 5.0798869132995605],
        ['login-requiredRatio,fieldsCount', 25.280393600463867],
        ['login-requiredRatio,identifierCount', -21.873781204223633],
        ['login-requiredRatio,passwordCount', 13.030138969421387],
        ['login-requiredRatio,hiddenIdentifierCount', -25.836198806762695],
        ['login-requiredRatio,hiddenPasswordCount', 16.278697967529297],
    ],
    bias: -5.234662055969238,
    cutoff: 0.48,
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
        ['pw-change-fieldsCount', -2.8276970386505127],
        ['pw-change-inputCount', -2.6558094024658203],
        ['pw-change-fieldsetCount', -6.046534538269043],
        ['pw-change-textCount', -6.030988693237305],
        ['pw-change-textareaCount', -6.077114582061768],
        ['pw-change-selectCount', -6.075382232666016],
        ['pw-change-optionsCount', -6.002823352813721],
        ['pw-change-checkboxCount', -5.971667289733887],
        ['pw-change-radioCount', -6.062620639801025],
        ['pw-change-identifierCount', -5.381728649139404],
        ['pw-change-hiddenIdentifierCount', -3.4443891048431396],
        ['pw-change-usernameCount', -6.2021026611328125],
        ['pw-change-emailCount', -4.691115856170654],
        ['pw-change-hiddenCount', -4.286525726318359],
        ['pw-change-hiddenPasswordCount', -5.9448652267456055],
        ['pw-change-submitCount', -3.6221303939819336],
        ['pw-change-hasTels', -6.100445747375488],
        ['pw-change-hasOAuth', -6.024813652038574],
        ['pw-change-hasCaptchas', -5.936214923858643],
        ['pw-change-hasFiles', -5.932640075683594],
        ['pw-change-hasDate', -6.036758899688721],
        ['pw-change-hasNumber', -6.103156566619873],
        ['pw-change-oneVisibleField', -6.1650471687316895],
        ['pw-change-twoVisibleFields', -3.2770185470581055],
        ['pw-change-threeOrMoreVisibleFields', -0.9425479769706726],
        ['pw-change-noPasswords', -6.063973903656006],
        ['pw-change-onePassword', -6.06882905960083],
        ['pw-change-twoPasswords', 8.938799858093262],
        ['pw-change-threeOrMorePasswords', 22.853836059570312],
        ['pw-change-noIdentifiers', 0.1687907874584198],
        ['pw-change-oneIdentifier', -5.936708450317383],
        ['pw-change-twoIdentifiers', -6.094906806945801],
        ['pw-change-threeOrMoreIdentifiers', 4.3965744972229],
        ['pw-change-autofocusedIsIdentifier', -6.082256317138672],
        ['pw-change-autofocusedIsPassword', 19.02245330810547],
        ['pw-change-visibleRatio', -3.846132278442383],
        ['pw-change-inputRatio', -3.999634265899658],
        ['pw-change-hiddenRatio', -4.887020587921143],
        ['pw-change-identifierRatio', -5.748621463775635],
        ['pw-change-emailRatio', -5.176870822906494],
        ['pw-change-usernameRatio', -6.112030029296875],
        ['pw-change-passwordRatio', 1.8159035444259644],
        ['pw-change-requiredRatio', -4.366940498352051],
        ['pw-change-pageLogin', -6.5172576904296875],
        ['pw-change-formTextLogin', -5.9659576416015625],
        ['pw-change-formAttrsLogin', -5.9654130935668945],
        ['pw-change-headingsLogin', -5.999917507171631],
        ['pw-change-layoutLogin', -6.128654956817627],
        ['pw-change-rememberMeCheckbox', -6.040896415710449],
        ['pw-change-troubleLink', -3.801124334335327],
        ['pw-change-submitLogin', -6.021466255187988],
        ['pw-change-pageRegister', -5.934150218963623],
        ['pw-change-formTextRegister', 0.05749580264091492],
        ['pw-change-formAttrsRegister', -5.9930901527404785],
        ['pw-change-headingsRegister', -6.089456558227539],
        ['pw-change-layoutRegister', -6.102523326873779],
        ['pw-change-pwNewRegister', 11.008708000183105],
        ['pw-change-pwConfirmRegister', 7.863826274871826],
        ['pw-change-submitRegister', -7.227514743804932],
        ['pw-change-TOSRef', -6.865926265716553],
        ['pw-change-pagePwReset', 16.334135055541992],
        ['pw-change-formTextPwReset', 23.86094093322754],
        ['pw-change-formAttrsPwReset', 1.5017354488372803],
        ['pw-change-headingsPwReset', 17.754165649414062],
        ['pw-change-layoutPwReset', 17.742206573486328],
        ['pw-change-pageRecovery', -5.940860748291016],
        ['pw-change-formTextRecovery', -0.012045927345752716],
        ['pw-change-formAttrsRecovery', -5.977570056915283],
        ['pw-change-headingsRecovery', -5.938198089599609],
        ['pw-change-layoutRecovery', -3.9399359226226807],
        ['pw-change-identifierRecovery', -5.952888011932373],
        ['pw-change-submitRecovery', -0.17883040010929108],
        ['pw-change-formTextMFA', 0.09039735794067383],
        ['pw-change-formAttrsMFA', -5.944664001464844],
        ['pw-change-headingsMFA', -5.927926540374756],
        ['pw-change-layoutMFA', -5.994290351867676],
        ['pw-change-buttonVerify', -5.930510520935059],
        ['pw-change-inputsMFA', -6.056266784667969],
        ['pw-change-inputsOTP', -5.997699737548828],
        ['pw-change-linkOTPOutlier', -6.145899772644043],
        ['pw-change-newsletterForm', -5.979008674621582],
        ['pw-change-multiStepForm', -5.917506694793701],
        ['pw-change-multiAuthForm', -5.910193920135498],
        ['pw-change-visibleRatio,fieldsCount', -2.897547721862793],
        ['pw-change-visibleRatio,identifierCount', -5.768033027648926],
        ['pw-change-visibleRatio,passwordCount', 2.264625310897827],
        ['pw-change-visibleRatio,hiddenIdentifierCount', -2.2082128524780273],
        ['pw-change-visibleRatio,hiddenPasswordCount', -5.9498291015625],
        ['pw-change-identifierRatio,fieldsCount', -4.48603630065918],
        ['pw-change-identifierRatio,identifierCount', -5.403904438018799],
        ['pw-change-identifierRatio,passwordCount', -4.571136474609375],
        ['pw-change-identifierRatio,hiddenIdentifierCount', -6.068880558013916],
        ['pw-change-identifierRatio,hiddenPasswordCount', -6.065662384033203],
        ['pw-change-passwordRatio,fieldsCount', 4.337514400482178],
        ['pw-change-passwordRatio,identifierCount', -4.490020275115967],
        ['pw-change-passwordRatio,passwordCount', 7.06001615524292],
        ['pw-change-passwordRatio,hiddenIdentifierCount', 0.32514867186546326],
        ['pw-change-passwordRatio,hiddenPasswordCount', -5.931413650512695],
        ['pw-change-requiredRatio,fieldsCount', -4.587761402130127],
        ['pw-change-requiredRatio,identifierCount', -5.924229145050049],
        ['pw-change-requiredRatio,passwordCount', -1.0827062129974365],
        ['pw-change-requiredRatio,hiddenIdentifierCount', 2.4388225078582764],
        ['pw-change-requiredRatio,hiddenPasswordCount', -5.981810092926025],
    ],
    bias: -4.022357940673828,
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
        ['register-fieldsCount', 3.776139497756958],
        ['register-inputCount', 1.4403009414672852],
        ['register-fieldsetCount', -3.2873852252960205],
        ['register-textCount', 2.3267621994018555],
        ['register-textareaCount', 5.874518871307373],
        ['register-selectCount', -16.546987533569336],
        ['register-optionsCount', 7.437317371368408],
        ['register-checkboxCount', -27.940248489379883],
        ['register-radioCount', 8.020057678222656],
        ['register-identifierCount', 5.65379524230957],
        ['register-hiddenIdentifierCount', 31.04569435119629],
        ['register-usernameCount', -3.0102858543395996],
        ['register-emailCount', 1.3785301446914673],
        ['register-hiddenCount', -18.654645919799805],
        ['register-hiddenPasswordCount', 3.0572445392608643],
        ['register-submitCount', 6.313376426696777],
        ['register-hasTels', 4.129981517791748],
        ['register-hasOAuth', -0.18858806788921356],
        ['register-hasCaptchas', 4.625827789306641],
        ['register-hasFiles', -5.972418785095215],
        ['register-hasDate', 10.147563934326172],
        ['register-hasNumber', 17.355514526367188],
        ['register-oneVisibleField', 0.28044477105140686],
        ['register-twoVisibleFields', 0.9277520775794983],
        ['register-threeOrMoreVisibleFields', 0.23221315443515778],
        ['register-noPasswords', -5.01338005065918],
        ['register-onePassword', 2.570641040802002],
        ['register-twoPasswords', 14.34371280670166],
        ['register-threeOrMorePasswords', -13.371896743774414],
        ['register-noIdentifiers', -9.9122314453125],
        ['register-oneIdentifier', 1.212768793106079],
        ['register-twoIdentifiers', 19.120569229125977],
        ['register-threeOrMoreIdentifiers', -1.7922630310058594],
        ['register-autofocusedIsIdentifier', 4.528258800506592],
        ['register-autofocusedIsPassword', 5.256800651550293],
        ['register-visibleRatio', -4.2336320877075195],
        ['register-inputRatio', -5.3330488204956055],
        ['register-hiddenRatio', 0.43449273705482483],
        ['register-identifierRatio', 3.0109074115753174],
        ['register-emailRatio', -1.8237996101379395],
        ['register-usernameRatio', -6.9854960441589355],
        ['register-passwordRatio', -0.5491354465484619],
        ['register-requiredRatio', -13.866384506225586],
        ['register-pageLogin', -7.811595439910889],
        ['register-formTextLogin', -6.073029518127441],
        ['register-formAttrsLogin', -6.065520286560059],
        ['register-headingsLogin', -20.197612762451172],
        ['register-layoutLogin', 1.8234713077545166],
        ['register-rememberMeCheckbox', -14.006672859191895],
        ['register-troubleLink', -16.490121841430664],
        ['register-submitLogin', -2.898085355758667],
        ['register-pageRegister', 1.9142757654190063],
        ['register-formTextRegister', 0.055408746004104614],
        ['register-formAttrsRegister', 4.860001087188721],
        ['register-headingsRegister', 18.30362319946289],
        ['register-layoutRegister', -7.464164733886719],
        ['register-pwNewRegister', 15.102683067321777],
        ['register-pwConfirmRegister', 5.825921535491943],
        ['register-submitRegister', 23.025306701660156],
        ['register-TOSRef', 17.246152877807617],
        ['register-pagePwReset', -7.443945407867432],
        ['register-formTextPwReset', -11.071311950683594],
        ['register-formAttrsPwReset', -6.276679992675781],
        ['register-headingsPwReset', -28.18163299560547],
        ['register-layoutPwReset', -53.149959564208984],
        ['register-pageRecovery', -6.859435081481934],
        ['register-formTextRecovery', 0.05390293896198273],
        ['register-formAttrsRecovery', -12.107839584350586],
        ['register-headingsRecovery', -20.45935821533203],
        ['register-layoutRecovery', 0.4637756943702698],
        ['register-identifierRecovery', -38.549617767333984],
        ['register-submitRecovery', -33.284358978271484],
        ['register-formTextMFA', -0.07719902694225311],
        ['register-formAttrsMFA', -6.881689071655273],
        ['register-headingsMFA', -6.392176628112793],
        ['register-layoutMFA', 2.6932413578033447],
        ['register-buttonVerify', -9.122049331665039],
        ['register-inputsMFA', -8.000354766845703],
        ['register-inputsOTP', -11.001651763916016],
        ['register-linkOTPOutlier', 2.146757125854492],
        ['register-newsletterForm', -25.717744827270508],
        ['register-multiStepForm', 9.321534156799316],
        ['register-multiAuthForm', 0.8191797137260437],
        ['register-visibleRatio,fieldsCount', -5.129326343536377],
        ['register-visibleRatio,identifierCount', -0.23067142069339752],
        ['register-visibleRatio,passwordCount', 6.817210674285889],
        ['register-visibleRatio,hiddenIdentifierCount', -2.78959321975708],
        ['register-visibleRatio,hiddenPasswordCount', -18.253812789916992],
        ['register-identifierRatio,fieldsCount', 10.102713584899902],
        ['register-identifierRatio,identifierCount', 4.551374912261963],
        ['register-identifierRatio,passwordCount', -23.934738159179688],
        ['register-identifierRatio,hiddenIdentifierCount', -26.975650787353516],
        ['register-identifierRatio,hiddenPasswordCount', -4.071695327758789],
        ['register-passwordRatio,fieldsCount', 8.664917945861816],
        ['register-passwordRatio,identifierCount', -25.637760162353516],
        ['register-passwordRatio,passwordCount', -2.5162739753723145],
        ['register-passwordRatio,hiddenIdentifierCount', 11.102763175964355],
        ['register-passwordRatio,hiddenPasswordCount', -25.33143424987793],
        ['register-requiredRatio,fieldsCount', 7.561949729919434],
        ['register-requiredRatio,identifierCount', -4.321326732635498],
        ['register-requiredRatio,passwordCount', -3.6488559246063232],
        ['register-requiredRatio,hiddenIdentifierCount', 4.689407825469971],
        ['register-requiredRatio,hiddenPasswordCount', -7.4437479972839355],
    ],
    bias: -0.14358949661254883,
    cutoff: 0.48,
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
        ['recovery-fieldsCount', 3.221442222595215],
        ['recovery-inputCount', 1.3347015380859375],
        ['recovery-fieldsetCount', -9.651904106140137],
        ['recovery-textCount', -2.090623378753662],
        ['recovery-textareaCount', -20.941465377807617],
        ['recovery-selectCount', -12.592394828796387],
        ['recovery-optionsCount', -16.364208221435547],
        ['recovery-checkboxCount', -5.922696590423584],
        ['recovery-radioCount', -6.0130791664123535],
        ['recovery-identifierCount', -0.13395348191261292],
        ['recovery-hiddenIdentifierCount', -11.00119686126709],
        ['recovery-usernameCount', 9.576080322265625],
        ['recovery-emailCount', 1.8956215381622314],
        ['recovery-hiddenCount', 2.1905574798583984],
        ['recovery-hiddenPasswordCount', -10.622576713562012],
        ['recovery-submitCount', 12.3773832321167],
        ['recovery-hasTels', -14.064412117004395],
        ['recovery-hasOAuth', -13.530508041381836],
        ['recovery-hasCaptchas', 0.2338743507862091],
        ['recovery-hasFiles', -33.14461135864258],
        ['recovery-hasDate', -6.096687316894531],
        ['recovery-hasNumber', -6.08753776550293],
        ['recovery-oneVisibleField', -6.610871315002441],
        ['recovery-twoVisibleFields', -2.3348066806793213],
        ['recovery-threeOrMoreVisibleFields', 3.8441550731658936],
        ['recovery-noPasswords', 1.654970645904541],
        ['recovery-onePassword', -10.878766059875488],
        ['recovery-twoPasswords', -5.922164440155029],
        ['recovery-threeOrMorePasswords', -6.0658040046691895],
        ['recovery-noIdentifiers', -13.294282913208008],
        ['recovery-oneIdentifier', -0.19186519086360931],
        ['recovery-twoIdentifiers', 1.7739331722259521],
        ['recovery-threeOrMoreIdentifiers', -6.288663387298584],
        ['recovery-autofocusedIsIdentifier', -2.5744473934173584],
        ['recovery-autofocusedIsPassword', -5.94462251663208],
        ['recovery-visibleRatio', -0.1054721251130104],
        ['recovery-inputRatio', -4.526771545410156],
        ['recovery-hiddenRatio', 1.0492570400238037],
        ['recovery-identifierRatio', 0.06620877981185913],
        ['recovery-emailRatio', 1.148755431175232],
        ['recovery-usernameRatio', 9.539753913879395],
        ['recovery-passwordRatio', -9.950428009033203],
        ['recovery-requiredRatio', 0.8839324116706848],
        ['recovery-pageLogin', -2.016023874282837],
        ['recovery-formTextLogin', -5.986192226409912],
        ['recovery-formAttrsLogin', -0.4424017071723938],
        ['recovery-headingsLogin', 3.6043100357055664],
        ['recovery-layoutLogin', -11.151945114135742],
        ['recovery-rememberMeCheckbox', -6.09949254989624],
        ['recovery-troubleLink', 7.162525177001953],
        ['recovery-submitLogin', -3.2342469692230225],
        ['recovery-pageRegister', -10.73707389831543],
        ['recovery-formTextRegister', 0.0404716432094574],
        ['recovery-formAttrsRegister', -10.012259483337402],
        ['recovery-headingsRegister', -4.762693881988525],
        ['recovery-layoutRegister', -7.959425926208496],
        ['recovery-pwNewRegister', -5.91269588470459],
        ['recovery-pwConfirmRegister', -6.030795574188232],
        ['recovery-submitRegister', -7.246322154998779],
        ['recovery-TOSRef', -13.28262710571289],
        ['recovery-pagePwReset', -1.4286298751831055],
        ['recovery-formTextPwReset', -6.0606279373168945],
        ['recovery-formAttrsPwReset', 13.10318374633789],
        ['recovery-headingsPwReset', 13.712432861328125],
        ['recovery-layoutPwReset', 6.801838397979736],
        ['recovery-pageRecovery', 17.389759063720703],
        ['recovery-formTextRecovery', 0.09212031960487366],
        ['recovery-formAttrsRecovery', 20.54880714416504],
        ['recovery-headingsRecovery', 4.51861047744751],
        ['recovery-layoutRecovery', 1.5047844648361206],
        ['recovery-identifierRecovery', 17.10218620300293],
        ['recovery-submitRecovery', 17.023021697998047],
        ['recovery-formTextMFA', 0.0947675108909607],
        ['recovery-formAttrsMFA', 8.618040084838867],
        ['recovery-headingsMFA', -6.902984619140625],
        ['recovery-layoutMFA', -6.097294330596924],
        ['recovery-buttonVerify', 2.0211029052734375],
        ['recovery-inputsMFA', 7.364017963409424],
        ['recovery-inputsOTP', -0.4458647072315216],
        ['recovery-linkOTPOutlier', 0.40176692605018616],
        ['recovery-newsletterForm', -12.426461219787598],
        ['recovery-multiStepForm', 2.27418851852417],
        ['recovery-multiAuthForm', -6.637617111206055],
        ['recovery-visibleRatio,fieldsCount', 2.48537015914917],
        ['recovery-visibleRatio,identifierCount', 0.6492051482200623],
        ['recovery-visibleRatio,passwordCount', -8.930517196655273],
        ['recovery-visibleRatio,hiddenIdentifierCount', -12.532814025878906],
        ['recovery-visibleRatio,hiddenPasswordCount', -10.648540496826172],
        ['recovery-identifierRatio,fieldsCount', 1.6770997047424316],
        ['recovery-identifierRatio,identifierCount', 1.2817763090133667],
        ['recovery-identifierRatio,passwordCount', -11.417373657226562],
        ['recovery-identifierRatio,hiddenIdentifierCount', -24.638717651367188],
        ['recovery-identifierRatio,hiddenPasswordCount', -12.914456367492676],
        ['recovery-passwordRatio,fieldsCount', -9.65207290649414],
        ['recovery-passwordRatio,identifierCount', -11.441156387329102],
        ['recovery-passwordRatio,passwordCount', -9.3062744140625],
        ['recovery-passwordRatio,hiddenIdentifierCount', -5.92832088470459],
        ['recovery-passwordRatio,hiddenPasswordCount', -5.939925670623779],
        ['recovery-requiredRatio,fieldsCount', 5.930509090423584],
        ['recovery-requiredRatio,identifierCount', 1.0431711673736572],
        ['recovery-requiredRatio,passwordCount', -7.591619491577148],
        ['recovery-requiredRatio,hiddenIdentifierCount', 9.243388175964355],
        ['recovery-requiredRatio,hiddenPasswordCount', -8.562679290771484],
    ],
    bias: -4.1664886474609375,
    cutoff: 0.5,
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
        ['mfa-fieldsCount', -2.550419330596924],
        ['mfa-inputCount', -2.3383240699768066],
        ['mfa-fieldsetCount', 10.579182624816895],
        ['mfa-textCount', -3.8165993690490723],
        ['mfa-textareaCount', -11.747836112976074],
        ['mfa-selectCount', -6.083932399749756],
        ['mfa-optionsCount', -5.951301097869873],
        ['mfa-checkboxCount', 10.057822227478027],
        ['mfa-radioCount', -6.065708160400391],
        ['mfa-identifierCount', -2.500877618789673],
        ['mfa-hiddenIdentifierCount', -3.4789693355560303],
        ['mfa-usernameCount', -2.92757511138916],
        ['mfa-emailCount', -6.1591796875],
        ['mfa-hiddenCount', -2.094677209854126],
        ['mfa-hiddenPasswordCount', -2.724834680557251],
        ['mfa-submitCount', -4.086559772491455],
        ['mfa-hasTels', 13.674393653869629],
        ['mfa-hasOAuth', -5.938895225524902],
        ['mfa-hasCaptchas', -3.7128524780273438],
        ['mfa-hasFiles', -5.954312801361084],
        ['mfa-hasDate', -5.943080425262451],
        ['mfa-hasNumber', 10.645567893981934],
        ['mfa-oneVisibleField', -1.257272481918335],
        ['mfa-twoVisibleFields', -5.618295669555664],
        ['mfa-threeOrMoreVisibleFields', -0.8775808215141296],
        ['mfa-noPasswords', -0.021123351529240608],
        ['mfa-onePassword', -5.413945198059082],
        ['mfa-twoPasswords', -5.940627098083496],
        ['mfa-threeOrMorePasswords', -6.039215087890625],
        ['mfa-noIdentifiers', -1.1530828475952148],
        ['mfa-oneIdentifier', -3.955390214920044],
        ['mfa-twoIdentifiers', -0.529911994934082],
        ['mfa-threeOrMoreIdentifiers', 8.275056838989258],
        ['mfa-autofocusedIsIdentifier', -5.479427814483643],
        ['mfa-autofocusedIsPassword', 9.202322006225586],
        ['mfa-visibleRatio', -2.1310455799102783],
        ['mfa-inputRatio', -2.6310245990753174],
        ['mfa-hiddenRatio', -1.9116144180297852],
        ['mfa-identifierRatio', -2.300340414047241],
        ['mfa-emailRatio', -5.917786121368408],
        ['mfa-usernameRatio', -3.489800214767456],
        ['mfa-passwordRatio', -5.752771854400635],
        ['mfa-requiredRatio', 0.8553301095962524],
        ['mfa-pageLogin', 0.9942847490310669],
        ['mfa-formTextLogin', -5.912881851196289],
        ['mfa-formAttrsLogin', -1.7349005937576294],
        ['mfa-headingsLogin', -5.424715995788574],
        ['mfa-layoutLogin', -0.13564644753932953],
        ['mfa-rememberMeCheckbox', 10.865974426269531],
        ['mfa-troubleLink', -3.4271433353424072],
        ['mfa-submitLogin', 1.2502107620239258],
        ['mfa-pageRegister', -4.224140167236328],
        ['mfa-formTextRegister', -0.003517560660839081],
        ['mfa-formAttrsRegister', -3.9206042289733887],
        ['mfa-headingsRegister', -7.545155048370361],
        ['mfa-layoutRegister', -1.8940532207489014],
        ['mfa-pwNewRegister', -6.103815078735352],
        ['mfa-pwConfirmRegister', -5.978834629058838],
        ['mfa-submitRegister', -6.0638322830200195],
        ['mfa-TOSRef', -2.0698585510253906],
        ['mfa-pagePwReset', -7.242473125457764],
        ['mfa-formTextPwReset', -6.085056304931641],
        ['mfa-formAttrsPwReset', -5.955337047576904],
        ['mfa-headingsPwReset', -5.993463516235352],
        ['mfa-layoutPwReset', -6.092405319213867],
        ['mfa-pageRecovery', 2.83211350440979],
        ['mfa-formTextRecovery', 0.002998150885105133],
        ['mfa-formAttrsRecovery', -6.483337879180908],
        ['mfa-headingsRecovery', -6.098517417907715],
        ['mfa-layoutRecovery', 2.042658805847168],
        ['mfa-identifierRecovery', -5.9800496101379395],
        ['mfa-submitRecovery', -0.8433451056480408],
        ['mfa-formTextMFA', 0.023768208920955658],
        ['mfa-formAttrsMFA', 16.014968872070312],
        ['mfa-headingsMFA', 18.140892028808594],
        ['mfa-layoutMFA', 14.150751113891602],
        ['mfa-buttonVerify', 18.589366912841797],
        ['mfa-inputsMFA', 18.5887508392334],
        ['mfa-inputsOTP', 17.82219123840332],
        ['mfa-linkOTPOutlier', -1.9492769241333008],
        ['mfa-newsletterForm', -5.993657112121582],
        ['mfa-multiStepForm', 4.175973892211914],
        ['mfa-multiAuthForm', -5.992018699645996],
        ['mfa-visibleRatio,fieldsCount', -0.23330152034759521],
        ['mfa-visibleRatio,identifierCount', -2.114945650100708],
        ['mfa-visibleRatio,passwordCount', -4.808614730834961],
        ['mfa-visibleRatio,hiddenIdentifierCount', -8.063898086547852],
        ['mfa-visibleRatio,hiddenPasswordCount', -2.27836012840271],
        ['mfa-identifierRatio,fieldsCount', 0.4628266394138336],
        ['mfa-identifierRatio,identifierCount', -1.360052227973938],
        ['mfa-identifierRatio,passwordCount', -5.39002799987793],
        ['mfa-identifierRatio,hiddenIdentifierCount', -0.9519112706184387],
        ['mfa-identifierRatio,hiddenPasswordCount', -0.25305280089378357],
        ['mfa-passwordRatio,fieldsCount', -5.39885950088501],
        ['mfa-passwordRatio,identifierCount', -5.496716022491455],
        ['mfa-passwordRatio,passwordCount', -5.776763439178467],
        ['mfa-passwordRatio,hiddenIdentifierCount', -8.526930809020996],
        ['mfa-passwordRatio,hiddenPasswordCount', -6.012714862823486],
        ['mfa-requiredRatio,fieldsCount', -3.680023431777954],
        ['mfa-requiredRatio,identifierCount', -2.6028661727905273],
        ['mfa-requiredRatio,passwordCount', -3.95965838432312],
        ['mfa-requiredRatio,hiddenIdentifierCount', -5.939693450927734],
        ['mfa-requiredRatio,hiddenPasswordCount', -6.058775901794434],
    ],
    bias: -2.9352123737335205,
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
        ['pw-loginScore', 12.110457420349121],
        ['pw-registerScore', -15.09245777130127],
        ['pw-pwChangeScore', 0.4198841154575348],
        ['pw-exotic', -11.625104904174805],
        ['pw-autocompleteNew', -2.840926170349121],
        ['pw-autocompleteCurrent', 0.6388871073722839],
        ['pw-autocompleteOff', -6.646190643310547],
        ['pw-isOnlyPassword', 4.999712944030762],
        ['pw-prevPwField', 5.001245021820068],
        ['pw-nextPwField', -6.900702953338623],
        ['pw-attrCreate', -5.130965232849121],
        ['pw-attrCurrent', 3.2019057273864746],
        ['pw-attrConfirm', -7.1081438064575195],
        ['pw-attrReset', -0.0820414125919342],
        ['pw-textCreate', -2.0926778316497803],
        ['pw-textCurrent', 1.0499730110168457],
        ['pw-textConfirm', -7.569972038269043],
        ['pw-textReset', 0.11920370161533356],
        ['pw-labelCreate', -8.184059143066406],
        ['pw-labelCurrent', 13.789965629577637],
        ['pw-labelConfirm', -7.370088577270508],
        ['pw-labelReset', 0.006366848945617676],
        ['pw-prevPwCreate', -9.864842414855957],
        ['pw-prevPwCurrent', -13.161354064941406],
        ['pw-prevPwConfirm', -0.027808532118797302],
        ['pw-passwordOutlier', -7.461403846740723],
        ['pw-nextPwCreate', 15.085190773010254],
        ['pw-nextPwCurrent', -8.639863014221191],
        ['pw-nextPwConfirm', -8.334257125854492],
    ],
    bias: -3.451097011566162,
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
        ['pw[new]-loginScore', -11.950339317321777],
        ['pw[new]-registerScore', 13.338146209716797],
        ['pw[new]-pwChangeScore', 1.136576771736145],
        ['pw[new]-exotic', 15.663180351257324],
        ['pw[new]-autocompleteNew', 1.3886051177978516],
        ['pw[new]-autocompleteCurrent', -0.4242343008518219],
        ['pw[new]-autocompleteOff', -1.2020775079727173],
        ['pw[new]-isOnlyPassword', -1.9832826852798462],
        ['pw[new]-prevPwField', 0.9447158575057983],
        ['pw[new]-nextPwField', 9.678947448730469],
        ['pw[new]-attrCreate', 3.584005355834961],
        ['pw[new]-attrCurrent', 2.606583595275879],
        ['pw[new]-attrConfirm', 7.647121429443359],
        ['pw[new]-attrReset', -0.17608627676963806],
        ['pw[new]-textCreate', 1.3295842409133911],
        ['pw[new]-textCurrent', -1.350480556488037],
        ['pw[new]-textConfirm', -15.904898643493652],
        ['pw[new]-textReset', -0.16350845992565155],
        ['pw[new]-labelCreate', 8.289900779724121],
        ['pw[new]-labelCurrent', -12.091044425964355],
        ['pw[new]-labelConfirm', 7.839779376983643],
        ['pw[new]-labelReset', -0.009189590811729431],
        ['pw[new]-prevPwCreate', 11.156460762023926],
        ['pw[new]-prevPwCurrent', 10.01125717163086],
        ['pw[new]-prevPwConfirm', 0.1486518234014511],
        ['pw[new]-passwordOutlier', -28.70713996887207],
        ['pw[new]-nextPwCreate', -13.031416893005371],
        ['pw[new]-nextPwCurrent', 8.369824409484863],
        ['pw[new]-nextPwConfirm', 10.322999954223633],
    ],
    bias: -3.1464664936065674,
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
        ['username-autocompleteUsername', 8.535419464111328],
        ['username-autocompleteNickname', -0.0336967408657074],
        ['username-autocompleteEmail', -6.675345420837402],
        ['username-autocompleteOff', -0.351055383682251],
        ['username-attrUsername', 17.95549964904785],
        ['username-textUsername', 15.503998756408691],
        ['username-labelUsername', 17.421558380126953],
        ['username-outlierUsername', 0.0013968717539682984],
        ['username-loginUsername', 18.240020751953125],
    ],
    bias: -9.748796463012695,
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
        exotic: fieldFeatures.exotic,
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
        ['username[hidden]-exotic', -7.466306686401367],
        ['username[hidden]-attrUsername', 14.646516799926758],
        ['username[hidden]-attrEmail', 13.732075691223145],
        ['username[hidden]-usernameAttr', 15.889358520507812],
        ['username[hidden]-autocompleteUsername', 1.1523393392562866],
        ['username[hidden]-visibleReadonly', 13.813315391540527],
        ['username[hidden]-hiddenEmailValue', 15.374834060668945],
        ['username[hidden]-hiddenTelValue', 6.74495267868042],
        ['username[hidden]-hiddenUsernameValue', -0.6274113059043884],
    ],
    bias: -21.665599822998047,
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
        ['email-autocompleteUsername', 1.119840383529663],
        ['email-autocompleteNickname', -0.14638076722621918],
        ['email-autocompleteEmail', 6.262667655944824],
        ['email-typeEmail', 14.790406227111816],
        ['email-exactAttrEmail', 12.929906845092773],
        ['email-attrEmail', 2.4213905334472656],
        ['email-textEmail', 14.287076950073242],
        ['email-labelEmail', 17.016387939453125],
        ['email-placeholderEmail', 14.575519561767578],
        ['email-attrSearch', -11.14219856262207],
        ['email-textSearch', -15.421449661254883],
    ],
    bias: -9.412895202636719,
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
        exotic: boolInt(fieldFeatures.exotic),
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
        ['otp-mfaScore', 31.203767776489258],
        ['otp-exotic', -7.27983283996582],
        ['otp-linkOTPOutlier', -21.349153518676758],
        ['otp-hasCheckboxes', 7.410930633544922],
        ['otp-hidden', -0.022134363651275635],
        ['otp-required', 2.476905584335327],
        ['otp-nameMatch', -13.491228103637695],
        ['otp-idMatch', 11.316479682922363],
        ['otp-numericMode', -3.9754221439361572],
        ['otp-autofocused', 6.821459770202637],
        ['otp-tabIndex1', -1.3649513721466064],
        ['otp-patternOTP', 6.618186950683594],
        ['otp-maxLength1', 5.745055198669434],
        ['otp-maxLength5', -8.289444923400879],
        ['otp-minLength6', 17.331201553344727],
        ['otp-maxLength6', 6.482302188873291],
        ['otp-maxLength20', 3.1730406284332275],
        ['otp-autocompleteOTC', 0.06500004231929779],
        ['otp-autocompleteOff', -3.1973888874053955],
        ['otp-prevAligned', 1.8850748538970947],
        ['otp-prevArea', 1.9245526790618896],
        ['otp-nextAligned', 0.1348484605550766],
        ['otp-nextArea', 3.4694912433624268],
        ['otp-attrMFA', 8.330194473266602],
        ['otp-attrOTP', 2.51188063621521],
        ['otp-attrOutlier', -8.63533878326416],
        ['otp-textMFA', 17.64991569519043],
        ['otp-textOTP', -9.549610137939453],
        ['otp-labelMFA', 0.8934366703033447],
        ['otp-labelOTP', 0.11919198930263519],
        ['otp-labelOutlier', -7.295423984527588],
        ['otp-wrapperOTP', 19.737529754638672],
        ['otp-wrapperOutlier', -6.539114952087402],
        ['otp-emailOutlierCount', -9.350906372070312],
    ],
    bias: -20.203807830810547,
    cutoff: 0.91,
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
    var _a, _b;
    const field = fnode.element;
    const fieldHaystacks = getFieldHaystacks(field);
    const formFnode = getParentFnodeVisibleForm(fnode);
    if (formFnode !== null && !formFnode.hasNoteFor('form')) formFnode.setNoteFor('form', getFormFeatures(formFnode));
    const formFeatures = formFnode === null || formFnode === void 0 ? void 0 : formFnode.noteFor('form');
    const isFormLogin = getFormTypeScore(formFnode, 'login') > 0.5;
    const isFormRegister = getFormTypeScore(formFnode, 'register') > 0.5;
    const isFormPWChange = getFormTypeScore(formFnode, 'password-change') > 0.5;
    const isFormRecovery = getFormTypeScore(formFnode, 'recovery') > 0.5;
    const isFormMFA = getFormTypeScore(formFnode, 'mfa') > 0.5;
    const detectionResults = [isFormLogin, isFormRegister, isFormPWChange, isFormRecovery, isFormMFA];
    const exotic = detectionResults.every((detected) => !detected);
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
            isFormLogin,
            isFormRegister,
            isFormPWChange,
            isFormRecovery,
            isFormMFA,
            exotic,
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
