import * as fathomWeb from './fathom.js';
import { clusters as clusters$1, dom, out, rule, ruleset, score, type, utils } from './fathom.js';

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

const VALID_INPUT_TYPES = ['text', 'email', 'number', 'tel', 'password', 'hidden', 'search'];

const sanitizeString = (str) =>
    str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\d\[\]]/g, '');

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

const FORM_CLUSTER_ATTR = 'data-protonpass-form';

const kFieldSelector = 'input, select, textarea';

const kEmailSelector = 'input[name="email"], input[id="email"]';

const kPasswordSelector = 'input[type="password"], input[type="text"][id="password"]';

const kCaptchaSelector = `[class*="captcha"], [id*="captcha"], [name*="captcha"]`;

const kSocialSelector = `[class*=social], [aria-label*=with]`;

const kEditorSelector = 'div[class*="editor" i], div[id*="editor" i], div[class*="composer" i], div[id*="composer" i]';

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
    const inputs = Array.from(form.querySelectorAll(inputCandidateSelector)).filter((field) => !field.disabled);
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

const closest = (start, match) => {
    const parent = start.parentElement;
    if (!parent) return null;
    return match(parent) ? parent : closest(parent, match);
};

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

const isCluster = (el) => el.getAttribute(FORM_CLUSTER_ATTR) !== null;

const flagCluster = (el) => el.setAttribute(FORM_CLUSTER_ATTR, '');

const isIgnored = (el) => el.__PP_SKIP__ === true;

const getIgnoredParent = (el) => (el ? closest(el, isIgnored) : null);

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

const removePredictionFlag = (el) => delete el.__PP_TYPE__;

const getParentFormPrediction = (el) => (el ? closest(el, isPrediction) : null);

const setPrediction = (_el, type) => {
    const el = _el;
    const currentType = el.__PP_TYPE__;
    el.__PP_TYPE__ = currentType ? Array.from(new Set(currentType.split(',').concat(type))).join(',') : type;
};

const isPredictedType = (type) => (fnode) => {
    const types = fnode.element.__PP_TYPE__;
    return types ? types.split(',').includes(type) : false;
};

const isClassifiable = (form) => !(isPrediction(form) || isIgnored(form));

const removeClassifierFlags = (el, options) => {
    removeProcessedFlag(el);
    removePredictionFlag(el);
    if (!options.preserveIgnored) removeIgnoredFlag(el);
    el.querySelectorAll(kFieldSelector).forEach((el) => removeClassifierFlags(el, options));
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

const formTypes = Object.values(FormType);

const fieldTypes = Object.values(FieldType);

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
        setPrediction(fnode.element, type);
    });

const processFormEffect = throughEffect((fnode) => flagAsProcessed(fnode.element));

const processFieldEffect = throughEffect((fnode) => {
    const { visible, type } = fnode.noteFor('field');
    if (visible || type === 'hidden') flagAsProcessed(fnode.element);
});

const featureScore = (noteFor, key) =>
    score((fnode) => {
        const features = fnode.noteFor(noteFor);
        if (Array.isArray(key)) return key.map((k) => features[k]).reduce((a, b) => a * b);
        return features[key];
    });

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

const belongsToType = (type) => (fnode) => fnode.scoreFor(type) > TOLERANCE_LEVEL;

const getFormTypeScore = (formFnode, type) => {
    if (!formFnode) return 0;
    if (isPredictedType(type)(formFnode)) return 1;
    return formFnode === null || formFnode === void 0 ? void 0 : formFnode.scoreFor(type);
};

const outRuleWithCache = (typeIn, typeOut) => [
    rule(type(typeIn).when(isPredictedType(typeOut)), type(`${typeOut}-cache`), {}),
    rule(type(`${typeOut}-cache`), type('cache'), {}),
    rule(type(typeOut).when(belongsToType(typeOut)), type(`${typeOut}-result`), {}),
    rule(type(`${typeOut}-cache`), type(`${typeOut}-result`), {}),
    rule(type(`${typeOut}-result`), out(typeOut).through(typeEffect(typeOut)), {}),
];

const combineFeatures = (arr1, arr2) => arr1.flatMap((item1) => arr2.map((item2) => [item1, item2]));

const withFnodeEl = (fn) => (fnode) => fn(fnode.element);

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

const getFormParent = (form) =>
    walkUpWhile(form, MAX_FORM_FIELD_WALK_UP)((el) => el.querySelectorAll(formCandidateSelector).length <= 1);

const createInputIterator = (form) => {
    const formEls = Array.from(form.querySelectorAll(inputCandidateSelector)).filter(isVisibleField);
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

const selectFormCandidates = (root = document) => {
    const candidates = Array.from(root.querySelectorAll(formCandidateSelector));
    return candidates.filter((form) => !isIgnored(form));
};

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
        if (candidate.matches(kDomGroupSelector)) return false;
        return true;
    });
    const headings = Array.from(parent.querySelectorAll(kHeadingSelector)).filter((heading) => {
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

const maybePassword = fActive((fnode) => fMatch(fnode, kPasswordSelector));

const maybeOTP = fActive((fnode) => fMatch(fnode, otpSelector));

const maybeUsername = fActive(
    (fnode) => (!fMode(fnode, 'email') && fType(fnode, ['text', 'tel'])) || fMatch(fnode, kUsernameSelector)
);

const maybeHiddenUsername = (fnode) => fType(fnode, ['email', 'text', 'hidden']) && !isActiveFieldFNode(fnode);

const isUsernameCandidate = (el) => !el.matches('input[type="email"]') && any(matchUsername)(getAllFieldHaystacks(el));

const isEmailCandidate = (el) => el.matches('input[type="email"]') || any(matchEmail)(getAllFieldHaystacks(el));

const isOAuthCandidate = (el) => any(matchOAuth)(getAllFieldHaystacks(el));

const isSubmitBtnCandidate = (btn) => {
    if (btn.getAttribute('type') === 'submit') return true;
    if (btn.innerText.trim().length <= 1) return false;
    const height = btn.offsetHeight;
    const width = btn.offsetWidth;
    return height * width > MIN_AREA_SUBMIT_BTN;
};

const isProcessableField = (input) =>
    !isProcessed(input) &&
    isVisibleField(input) &&
    isVisible(input, {
        opacity: false,
    });

const isClassifiableField = (fnode) => isClassifiable(fnode.element) && getParentFormFnode(fnode) !== null;

const selectInputCandidates = (target = document) =>
    Array.from(target.querySelectorAll(inputCandidateSelector)).filter(isClassifiable);

const { linearScale: linearScale$1 } = utils;

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
    const pws = inputs.filter((el) => el.matches(kPasswordSelector));
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
    const submitBtns = btns.filter(isSubmitBtnCandidate);
    const btnCandidates = submits.concat(submitBtns);
    const anchors = Array.from(form.querySelectorAll(kAnchorLinkSelector)).filter(isVisibleEl);
    const oauths = socialEls.concat(submitBtns).filter(isOAuthCandidate);
    const layouts = Array.from(form.querySelectorAll(kLayoutSelector));
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
        ['login-fieldsCount', 9.260546684265137],
        ['login-inputCount', 3.3868980407714844],
        ['login-fieldsetCount', -10.234439849853516],
        ['login-textCount', 1.1708984375],
        ['login-textareaCount', -6.201153755187988],
        ['login-selectCount', -6.244014263153076],
        ['login-optionsCount', -6.176764011383057],
        ['login-radioCount', -5.9987874031066895],
        ['login-identifierCount', -2.961151123046875],
        ['login-hiddenIdentifierCount', 10.851139068603516],
        ['login-usernameCount', 9.447742462158203],
        ['login-emailCount', -8.629166603088379],
        ['login-hiddenCount', 16.093061447143555],
        ['login-hiddenPasswordCount', 18.617231369018555],
        ['login-submitCount', -3.068704843521118],
        ['login-hasTels', -5.7915825843811035],
        ['login-hasOAuth', 5.8498687744140625],
        ['login-hasCaptchas', -2.090794801712036],
        ['login-hasFiles', -6.0167555809021],
        ['login-hasDate', -10.732929229736328],
        ['login-hasNumber', -5.980225563049316],
        ['login-oneVisibleField', 9.622528076171875],
        ['login-twoVisibleFields', 5.231987476348877],
        ['login-threeOrMoreVisibleFields', -10.353397369384766],
        ['login-noPasswords', -18.85025978088379],
        ['login-onePassword', 12.314238548278809],
        ['login-twoPasswords', -14.515039443969727],
        ['login-threeOrMorePasswords', -6.0650835037231445],
        ['login-noIdentifiers', -12.99234390258789],
        ['login-oneIdentifier', -2.68302583694458],
        ['login-twoIdentifiers', -1.3880155086517334],
        ['login-threeOrMoreIdentifiers', -7.5584797859191895],
        ['login-autofocusedIsIdentifier', 11.91942024230957],
        ['login-autofocusedIsPassword', 37.33961486816406],
        ['login-visibleRatio', 2.911050796508789],
        ['login-inputRatio', 3.799626588821411],
        ['login-hiddenRatio', -24.132291793823242],
        ['login-identifierRatio', 15.340856552124023],
        ['login-emailRatio', -2.0597195625305176],
        ['login-usernameRatio', -21.554241180419922],
        ['login-passwordRatio', -6.707980632781982],
        ['login-requiredRatio', 2.429833173751831],
        ['login-checkboxRatio', 34.79150390625],
        ['login-pageLogin', 14.611160278320312],
        ['login-formTextLogin', 8.536316871643066],
        ['login-formAttrsLogin', 4.859513759613037],
        ['login-headingsLogin', 16.488920211791992],
        ['login-layoutLogin', 4.245265483856201],
        ['login-rememberMeCheckbox', 8.000603675842285],
        ['login-troubleLink', 20.40095329284668],
        ['login-submitLogin', 11.593767166137695],
        ['login-pageRegister', -12.783998489379883],
        ['login-formTextRegister', 0.052930302917957306],
        ['login-formAttrsRegister', -15.765278816223145],
        ['login-headingsRegister', -13.759665489196777],
        ['login-layoutRegister', -2.7408759593963623],
        ['login-pwNewRegister', -24.914588928222656],
        ['login-pwConfirmRegister', -19.122373580932617],
        ['login-submitRegister', -17.61235809326172],
        ['login-TOSRef', 2.7695138454437256],
        ['login-pagePwReset', -6.1394853591918945],
        ['login-formTextPwReset', -6.047491550445557],
        ['login-formAttrsPwReset', -7.93905782699585],
        ['login-headingsPwReset', -11.728208541870117],
        ['login-layoutPwReset', 1.9481669664382935],
        ['login-pageRecovery', -2.3499460220336914],
        ['login-formTextRecovery', -0.05300094932317734],
        ['login-formAttrsRecovery', -40.93749237060547],
        ['login-headingsRecovery', -4.877048015594482],
        ['login-layoutRecovery', -0.7296434044837952],
        ['login-identifierRecovery', 0.871780276298523],
        ['login-submitRecovery', -8.45190715789795],
        ['login-formTextMFA', -0.018208570778369904],
        ['login-formAttrsMFA', -28.500751495361328],
        ['login-headingsMFA', -18.91704559326172],
        ['login-layoutMFA', -4.592078685760498],
        ['login-buttonVerify', -6.714724540710449],
        ['login-inputsMFA', -20.373138427734375],
        ['login-inputsOTP', -30.870197296142578],
        ['login-linkOTPOutlier', -4.563948631286621],
        ['login-newsletterForm', -8.15023422241211],
        ['login-searchForm', -7.200606346130371],
        ['login-multiStepForm', 3.7781412601470947],
        ['login-multiAuthForm', 13.921825408935547],
        ['login-visibleRatio,fieldsCount', -5.210275173187256],
        ['login-visibleRatio,identifierCount', -15.320694923400879],
        ['login-visibleRatio,passwordCount', 10.74003791809082],
        ['login-visibleRatio,hiddenIdentifierCount', -15.647726058959961],
        ['login-visibleRatio,hiddenPasswordCount', 36.91423034667969],
        ['login-identifierRatio,fieldsCount', -27.68492889404297],
        ['login-identifierRatio,identifierCount', 15.424700736999512],
        ['login-identifierRatio,passwordCount', -13.829729080200195],
        ['login-identifierRatio,hiddenIdentifierCount', 4.846118927001953],
        ['login-identifierRatio,hiddenPasswordCount', -10.7938871383667],
        ['login-passwordRatio,fieldsCount', 9.243396759033203],
        ['login-passwordRatio,identifierCount', -13.610177040100098],
        ['login-passwordRatio,passwordCount', -9.334450721740723],
        ['login-passwordRatio,hiddenIdentifierCount', 32.88718795776367],
        ['login-passwordRatio,hiddenPasswordCount', 1.4116586446762085],
        ['login-requiredRatio,fieldsCount', 12.827005386352539],
        ['login-requiredRatio,identifierCount', -20.5583438873291],
        ['login-requiredRatio,passwordCount', 16.311241149902344],
        ['login-requiredRatio,hiddenIdentifierCount', -29.923545837402344],
        ['login-requiredRatio,hiddenPasswordCount', 18.124889373779297],
    ],
    bias: -6.3730974197387695,
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
        ...outRuleWithCache('form-candidate', FormType.LOGIN),
    ],
};

const results$9 = {
    coeffs: [
        ['pw-change-fieldsCount', -2.849605083465576],
        ['pw-change-inputCount', -2.549915075302124],
        ['pw-change-fieldsetCount', -6.059319972991943],
        ['pw-change-textCount', -6.019736289978027],
        ['pw-change-textareaCount', -6.081956386566162],
        ['pw-change-selectCount', -6.053798198699951],
        ['pw-change-optionsCount', -6.029593467712402],
        ['pw-change-radioCount', -6.043890476226807],
        ['pw-change-identifierCount', -5.4684624671936035],
        ['pw-change-hiddenIdentifierCount', -3.339617967605591],
        ['pw-change-usernameCount', -6.082462787628174],
        ['pw-change-emailCount', -4.619750022888184],
        ['pw-change-hiddenCount', -4.060936450958252],
        ['pw-change-hiddenPasswordCount', -6.034674167633057],
        ['pw-change-submitCount', -3.7810566425323486],
        ['pw-change-hasTels', -6.03959846496582],
        ['pw-change-hasOAuth', -6.034022331237793],
        ['pw-change-hasCaptchas', -6.09065580368042],
        ['pw-change-hasFiles', -6.076785087585449],
        ['pw-change-hasDate', -5.976832866668701],
        ['pw-change-hasNumber', -5.990964889526367],
        ['pw-change-oneVisibleField', -6.082982540130615],
        ['pw-change-twoVisibleFields', -3.199659824371338],
        ['pw-change-threeOrMoreVisibleFields', -0.9176915287971497],
        ['pw-change-noPasswords', -6.018117427825928],
        ['pw-change-onePassword', -6.01702880859375],
        ['pw-change-twoPasswords', 9.116572380065918],
        ['pw-change-threeOrMorePasswords', 22.571439743041992],
        ['pw-change-noIdentifiers', -1.1158397197723389],
        ['pw-change-oneIdentifier', -6.076854705810547],
        ['pw-change-twoIdentifiers', -6.0351338386535645],
        ['pw-change-threeOrMoreIdentifiers', 4.4391937255859375],
        ['pw-change-autofocusedIsIdentifier', -6.042590141296387],
        ['pw-change-autofocusedIsPassword', 19.56791877746582],
        ['pw-change-visibleRatio', -3.86659574508667],
        ['pw-change-inputRatio', -3.968968629837036],
        ['pw-change-hiddenRatio', -4.739645957946777],
        ['pw-change-identifierRatio', -5.768206596374512],
        ['pw-change-emailRatio', -5.145118236541748],
        ['pw-change-usernameRatio', -5.927550792694092],
        ['pw-change-passwordRatio', 2.23026967048645],
        ['pw-change-requiredRatio', -4.440613269805908],
        ['pw-change-checkboxRatio', -5.908611297607422],
        ['pw-change-pageLogin', -6.451207637786865],
        ['pw-change-formTextLogin', -5.944624900817871],
        ['pw-change-formAttrsLogin', -6.078995704650879],
        ['pw-change-headingsLogin', -6.092985153198242],
        ['pw-change-layoutLogin', -6.022044658660889],
        ['pw-change-rememberMeCheckbox', -5.911662578582764],
        ['pw-change-troubleLink', -3.6543996334075928],
        ['pw-change-submitLogin', -5.971057891845703],
        ['pw-change-pageRegister', -5.91569709777832],
        ['pw-change-formTextRegister', 0.041428856551647186],
        ['pw-change-formAttrsRegister', -5.969199180603027],
        ['pw-change-headingsRegister', -6.03828239440918],
        ['pw-change-layoutRegister', -5.976802349090576],
        ['pw-change-pwNewRegister', 11.097345352172852],
        ['pw-change-pwConfirmRegister', 8.048815727233887],
        ['pw-change-submitRegister', -7.195167541503906],
        ['pw-change-TOSRef', -6.861124038696289],
        ['pw-change-pagePwReset', 15.718603134155273],
        ['pw-change-formTextPwReset', 23.176179885864258],
        ['pw-change-formAttrsPwReset', 2.7543129920959473],
        ['pw-change-headingsPwReset', 17.890968322753906],
        ['pw-change-layoutPwReset', 17.851831436157227],
        ['pw-change-pageRecovery', -6.0303263664245605],
        ['pw-change-formTextRecovery', -0.03785283863544464],
        ['pw-change-formAttrsRecovery', -6.054781913757324],
        ['pw-change-headingsRecovery', -5.961613655090332],
        ['pw-change-layoutRecovery', -3.806657314300537],
        ['pw-change-identifierRecovery', -6.013106346130371],
        ['pw-change-submitRecovery', 0.5705376863479614],
        ['pw-change-formTextMFA', 0.04786650091409683],
        ['pw-change-formAttrsMFA', -6.017983436584473],
        ['pw-change-headingsMFA', -6.015376091003418],
        ['pw-change-layoutMFA', -6.080138206481934],
        ['pw-change-buttonVerify', -6.1084184646606445],
        ['pw-change-inputsMFA', -5.995019435882568],
        ['pw-change-inputsOTP', -5.977421283721924],
        ['pw-change-linkOTPOutlier', -5.954542636871338],
        ['pw-change-newsletterForm', -5.9653801918029785],
        ['pw-change-searchForm', -6.086610317230225],
        ['pw-change-multiStepForm', -5.942900657653809],
        ['pw-change-multiAuthForm', -6.06475830078125],
        ['pw-change-visibleRatio,fieldsCount', -2.5807697772979736],
        ['pw-change-visibleRatio,identifierCount', -5.702645301818848],
        ['pw-change-visibleRatio,passwordCount', 2.6345810890197754],
        ['pw-change-visibleRatio,hiddenIdentifierCount', -2.1961960792541504],
        ['pw-change-visibleRatio,hiddenPasswordCount', -6.049030303955078],
        ['pw-change-identifierRatio,fieldsCount', -4.411734104156494],
        ['pw-change-identifierRatio,identifierCount', -5.406412601470947],
        ['pw-change-identifierRatio,passwordCount', -4.3397345542907715],
        ['pw-change-identifierRatio,hiddenIdentifierCount', -6.10110330581665],
        ['pw-change-identifierRatio,hiddenPasswordCount', -5.99431848526001],
        ['pw-change-passwordRatio,fieldsCount', 4.848816871643066],
        ['pw-change-passwordRatio,identifierCount', -4.359196662902832],
        ['pw-change-passwordRatio,passwordCount', 7.522293567657471],
        ['pw-change-passwordRatio,hiddenIdentifierCount', 0.12668076157569885],
        ['pw-change-passwordRatio,hiddenPasswordCount', -6.0297160148620605],
        ['pw-change-requiredRatio,fieldsCount', -4.642848014831543],
        ['pw-change-requiredRatio,identifierCount', -5.928743839263916],
        ['pw-change-requiredRatio,passwordCount', -0.5462040901184082],
        ['pw-change-requiredRatio,hiddenIdentifierCount', 2.8457155227661133],
        ['pw-change-requiredRatio,hiddenPasswordCount', -6.076464653015137],
    ],
    bias: -4.067059516906738,
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
        ...outRuleWithCache('form-candidate', FormType.PASSWORD_CHANGE),
    ],
};

const results$8 = {
    coeffs: [
        ['register-fieldsCount', 2.1488468647003174],
        ['register-inputCount', 3.8953444957733154],
        ['register-fieldsetCount', 4.369948387145996],
        ['register-textCount', 4.406470775604248],
        ['register-textareaCount', -0.5395322442054749],
        ['register-selectCount', -13.801981925964355],
        ['register-optionsCount', 8.93043041229248],
        ['register-radioCount', 8.134862899780273],
        ['register-identifierCount', 6.878338813781738],
        ['register-hiddenIdentifierCount', 26.6212100982666],
        ['register-usernameCount', -8.497008323669434],
        ['register-emailCount', 0.5601682066917419],
        ['register-hiddenCount', -16.191883087158203],
        ['register-hiddenPasswordCount', 13.505952835083008],
        ['register-submitCount', 3.9190540313720703],
        ['register-hasTels', -0.054031264036893845],
        ['register-hasOAuth', 5.235856056213379],
        ['register-hasCaptchas', 4.430254936218262],
        ['register-hasFiles', -6.080432891845703],
        ['register-hasDate', 16.213748931884766],
        ['register-hasNumber', 17.174604415893555],
        ['register-oneVisibleField', 0.23812611401081085],
        ['register-twoVisibleFields', 2.9827115535736084],
        ['register-threeOrMoreVisibleFields', -0.7077833414077759],
        ['register-noPasswords', -4.2407379150390625],
        ['register-onePassword', 1.8425089120864868],
        ['register-twoPasswords', 16.720924377441406],
        ['register-threeOrMorePasswords', -13.426392555236816],
        ['register-noIdentifiers', -9.049647331237793],
        ['register-oneIdentifier', 1.1870161294937134],
        ['register-twoIdentifiers', 14.631994247436523],
        ['register-threeOrMoreIdentifiers', 24.357791900634766],
        ['register-autofocusedIsIdentifier', 5.220548152923584],
        ['register-autofocusedIsPassword', 9.6756591796875],
        ['register-visibleRatio', -3.1590821743011475],
        ['register-inputRatio', -6.091838359832764],
        ['register-hiddenRatio', 1.232614517211914],
        ['register-identifierRatio', 1.6158268451690674],
        ['register-emailRatio', -2.6694180965423584],
        ['register-usernameRatio', -4.520468711853027],
        ['register-passwordRatio', 1.4269945621490479],
        ['register-requiredRatio', -13.119827270507812],
        ['register-checkboxRatio', -36.96697235107422],
        ['register-pageLogin', -7.428308486938477],
        ['register-formTextLogin', -6.030258655548096],
        ['register-formAttrsLogin', -6.180969715118408],
        ['register-headingsLogin', -15.461830139160156],
        ['register-layoutLogin', 11.504278182983398],
        ['register-rememberMeCheckbox', -13.274555206298828],
        ['register-troubleLink', -11.467988014221191],
        ['register-submitLogin', -9.911770820617676],
        ['register-pageRegister', 3.26921010017395],
        ['register-formTextRegister', 0.02179713547229767],
        ['register-formAttrsRegister', 9.021811485290527],
        ['register-headingsRegister', 16.266944885253906],
        ['register-layoutRegister', -10.42892074584961],
        ['register-pwNewRegister', 11.917451858520508],
        ['register-pwConfirmRegister', 0.8136529922485352],
        ['register-submitRegister', 26.98970603942871],
        ['register-TOSRef', 14.791913986206055],
        ['register-pagePwReset', -7.5938544273376465],
        ['register-formTextPwReset', -11.517178535461426],
        ['register-formAttrsPwReset', -6.282402038574219],
        ['register-headingsPwReset', -25.74250030517578],
        ['register-layoutPwReset', -47.1105842590332],
        ['register-pageRecovery', -8.460634231567383],
        ['register-formTextRecovery', 0.005665786564350128],
        ['register-formAttrsRecovery', -8.095630645751953],
        ['register-headingsRecovery', -16.120214462280273],
        ['register-layoutRecovery', -2.9045565128326416],
        ['register-identifierRecovery', -16.254348754882812],
        ['register-submitRecovery', -32.221370697021484],
        ['register-formTextMFA', -0.021640509366989136],
        ['register-formAttrsMFA', -10.20312786102295],
        ['register-headingsMFA', -13.534029006958008],
        ['register-layoutMFA', 1.495119571685791],
        ['register-buttonVerify', -5.0718278884887695],
        ['register-inputsMFA', -3.943760871887207],
        ['register-inputsOTP', -23.11526870727539],
        ['register-linkOTPOutlier', 0.9582937955856323],
        ['register-newsletterForm', -26.404504776000977],
        ['register-searchForm', -7.863440036773682],
        ['register-multiStepForm', 8.490460395812988],
        ['register-multiAuthForm', -14.590228080749512],
        ['register-visibleRatio,fieldsCount', -5.730635166168213],
        ['register-visibleRatio,identifierCount', 4.5280656814575195],
        ['register-visibleRatio,passwordCount', 12.067358016967773],
        ['register-visibleRatio,hiddenIdentifierCount', -3.656541109085083],
        ['register-visibleRatio,hiddenPasswordCount', -31.854700088500977],
        ['register-identifierRatio,fieldsCount', 4.788910388946533],
        ['register-identifierRatio,identifierCount', 3.06147837638855],
        ['register-identifierRatio,passwordCount', -33.6225471496582],
        ['register-identifierRatio,hiddenIdentifierCount', -41.53782653808594],
        ['register-identifierRatio,hiddenPasswordCount', 15.620370864868164],
        ['register-passwordRatio,fieldsCount', -0.6039175987243652],
        ['register-passwordRatio,identifierCount', -37.281211853027344],
        ['register-passwordRatio,passwordCount', -6.787042617797852],
        ['register-passwordRatio,hiddenIdentifierCount', 3.7560617923736572],
        ['register-passwordRatio,hiddenPasswordCount', -13.99930191040039],
        ['register-requiredRatio,fieldsCount', -1.0972027778625488],
        ['register-requiredRatio,identifierCount', -3.273120641708374],
        ['register-requiredRatio,passwordCount', -9.638973236083984],
        ['register-requiredRatio,hiddenIdentifierCount', 21.952537536621094],
        ['register-requiredRatio,hiddenPasswordCount', -9.304187774658203],
    ],
    bias: 0.2229500263929367,
    cutoff: 0.47,
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
        ...outRuleWithCache('form-candidate', FormType.REGISTER),
    ],
};

const results$7 = {
    coeffs: [
        ['recovery-fieldsCount', 3.1686480045318604],
        ['recovery-inputCount', 2.2515103816986084],
        ['recovery-fieldsetCount', -10.534419059753418],
        ['recovery-textCount', -2.8417246341705322],
        ['recovery-textareaCount', -18.28977394104004],
        ['recovery-selectCount', -13.245671272277832],
        ['recovery-optionsCount', -16.87846565246582],
        ['recovery-radioCount', -6.032057762145996],
        ['recovery-identifierCount', 0.9598401784896851],
        ['recovery-hiddenIdentifierCount', -9.419584274291992],
        ['recovery-usernameCount', 9.815361022949219],
        ['recovery-emailCount', 3.164804458618164],
        ['recovery-hiddenCount', 2.6905319690704346],
        ['recovery-hiddenPasswordCount', -11.591835975646973],
        ['recovery-submitCount', 7.926068305969238],
        ['recovery-hasTels', -15.413702011108398],
        ['recovery-hasOAuth', -13.806416511535645],
        ['recovery-hasCaptchas', 0.5163151025772095],
        ['recovery-hasFiles', -34.650333404541016],
        ['recovery-hasDate', -5.912387371063232],
        ['recovery-hasNumber', -5.987368106842041],
        ['recovery-oneVisibleField', -6.419887542724609],
        ['recovery-twoVisibleFields', -1.5245790481567383],
        ['recovery-threeOrMoreVisibleFields', 4.325897693634033],
        ['recovery-noPasswords', 1.1998769044876099],
        ['recovery-onePassword', -10.76146411895752],
        ['recovery-twoPasswords', -6.276216506958008],
        ['recovery-threeOrMorePasswords', -6.09953498840332],
        ['recovery-noIdentifiers', -13.318510055541992],
        ['recovery-oneIdentifier', 1.204313039779663],
        ['recovery-twoIdentifiers', 2.660702705383301],
        ['recovery-threeOrMoreIdentifiers', -7.297881126403809],
        ['recovery-autofocusedIsIdentifier', -1.659160852432251],
        ['recovery-autofocusedIsPassword', -6.072286605834961],
        ['recovery-visibleRatio', 0.3868098855018616],
        ['recovery-inputRatio', -4.502478122711182],
        ['recovery-hiddenRatio', -0.1950581967830658],
        ['recovery-identifierRatio', -0.6852729320526123],
        ['recovery-emailRatio', 0.05073688179254532],
        ['recovery-usernameRatio', 8.933812141418457],
        ['recovery-passwordRatio', -9.400286674499512],
        ['recovery-requiredRatio', 0.041554152965545654],
        ['recovery-checkboxRatio', -5.961899280548096],
        ['recovery-pageLogin', -2.07015323638916],
        ['recovery-formTextLogin', -6.084650993347168],
        ['recovery-formAttrsLogin', 0.3745183050632477],
        ['recovery-headingsLogin', 3.899892568588257],
        ['recovery-layoutLogin', -11.755548477172852],
        ['recovery-rememberMeCheckbox', -5.9327073097229],
        ['recovery-troubleLink', 6.62761116027832],
        ['recovery-submitLogin', -4.9484028816223145],
        ['recovery-pageRegister', -11.171113967895508],
        ['recovery-formTextRegister', -0.004259899258613586],
        ['recovery-formAttrsRegister', -11.08430290222168],
        ['recovery-headingsRegister', -3.8516147136688232],
        ['recovery-layoutRegister', -8.445761680603027],
        ['recovery-pwNewRegister', -6.089382171630859],
        ['recovery-pwConfirmRegister', -6.038159370422363],
        ['recovery-submitRegister', -6.921971797943115],
        ['recovery-TOSRef', -13.569132804870605],
        ['recovery-pagePwReset', 7.406122207641602],
        ['recovery-formTextPwReset', -6.428162097930908],
        ['recovery-formAttrsPwReset', 12.511506080627441],
        ['recovery-headingsPwReset', 13.299031257629395],
        ['recovery-layoutPwReset', 7.199288368225098],
        ['recovery-pageRecovery', 16.694597244262695],
        ['recovery-formTextRecovery', 0.02617131918668747],
        ['recovery-formAttrsRecovery', 21.711151123046875],
        ['recovery-headingsRecovery', 4.40916109085083],
        ['recovery-layoutRecovery', 1.7731317281723022],
        ['recovery-identifierRecovery', 16.085918426513672],
        ['recovery-submitRecovery', 16.651777267456055],
        ['recovery-formTextMFA', 0.051208652555942535],
        ['recovery-formAttrsMFA', 10.673234939575195],
        ['recovery-headingsMFA', -8.235397338867188],
        ['recovery-layoutMFA', -6.03088903427124],
        ['recovery-buttonVerify', 0.6126459240913391],
        ['recovery-inputsMFA', 6.485626697540283],
        ['recovery-inputsOTP', -0.4770396649837494],
        ['recovery-linkOTPOutlier', 0.4108854830265045],
        ['recovery-newsletterForm', -13.8137845993042],
        ['recovery-searchForm', -12.360559463500977],
        ['recovery-multiStepForm', 2.2651278972625732],
        ['recovery-multiAuthForm', -6.300940036773682],
        ['recovery-visibleRatio,fieldsCount', 3.260298490524292],
        ['recovery-visibleRatio,identifierCount', 0.21990321576595306],
        ['recovery-visibleRatio,passwordCount', -8.673775672912598],
        ['recovery-visibleRatio,hiddenIdentifierCount', -12.881649017333984],
        ['recovery-visibleRatio,hiddenPasswordCount', -13.354900360107422],
        ['recovery-identifierRatio,fieldsCount', 6.22084379196167],
        ['recovery-identifierRatio,identifierCount', 0.7349469065666199],
        ['recovery-identifierRatio,passwordCount', -10.594644546508789],
        ['recovery-identifierRatio,hiddenIdentifierCount', -22.928953170776367],
        ['recovery-identifierRatio,hiddenPasswordCount', -13.94097900390625],
        ['recovery-passwordRatio,fieldsCount', -9.976916313171387],
        ['recovery-passwordRatio,identifierCount', -10.677999496459961],
        ['recovery-passwordRatio,passwordCount', -8.918004035949707],
        ['recovery-passwordRatio,hiddenIdentifierCount', -6.067085266113281],
        ['recovery-passwordRatio,hiddenPasswordCount', -6.0812668800354],
        ['recovery-requiredRatio,fieldsCount', 6.242189884185791],
        ['recovery-requiredRatio,identifierCount', 0.7846741080284119],
        ['recovery-requiredRatio,passwordCount', -8.90123176574707],
        ['recovery-requiredRatio,hiddenIdentifierCount', 8.217477798461914],
        ['recovery-requiredRatio,hiddenPasswordCount', -9.673283576965332],
    ],
    bias: -3.87492299079895,
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
        ...outRuleWithCache('form-candidate', FormType.RECOVERY),
    ],
};

const results$6 = {
    coeffs: [
        ['mfa-fieldsCount', -1.986028790473938],
        ['mfa-inputCount', -2.417893171310425],
        ['mfa-fieldsetCount', 8.618748664855957],
        ['mfa-textCount', 10.741029739379883],
        ['mfa-textareaCount', -21.107969284057617],
        ['mfa-selectCount', -6.036983013153076],
        ['mfa-optionsCount', -6.089150428771973],
        ['mfa-radioCount', -5.989146709442139],
        ['mfa-identifierCount', -2.976684808731079],
        ['mfa-hiddenIdentifierCount', -2.914689779281616],
        ['mfa-usernameCount', -3.2611923217773438],
        ['mfa-emailCount', -6.297138690948486],
        ['mfa-hiddenCount', -0.5899203419685364],
        ['mfa-hiddenPasswordCount', -1.1170684099197388],
        ['mfa-submitCount', 3.2955262660980225],
        ['mfa-hasTels', 13.675196647644043],
        ['mfa-hasOAuth', -6.1800312995910645],
        ['mfa-hasCaptchas', -2.140284776687622],
        ['mfa-hasFiles', -5.91282320022583],
        ['mfa-hasDate', -6.000078201293945],
        ['mfa-hasNumber', 14.798690795898438],
        ['mfa-oneVisibleField', 5.3741021156311035],
        ['mfa-twoVisibleFields', -5.333239555358887],
        ['mfa-threeOrMoreVisibleFields', -1.8359535932540894],
        ['mfa-noPasswords', -4.526628017425537],
        ['mfa-onePassword', -5.278433799743652],
        ['mfa-twoPasswords', -5.979758262634277],
        ['mfa-threeOrMorePasswords', -6.017874240875244],
        ['mfa-noIdentifiers', -7.453759670257568],
        ['mfa-oneIdentifier', -3.9392337799072266],
        ['mfa-twoIdentifiers', -0.1508341133594513],
        ['mfa-threeOrMoreIdentifiers', 0.9015580415725708],
        ['mfa-autofocusedIsIdentifier', -4.173874855041504],
        ['mfa-autofocusedIsPassword', 8.88188648223877],
        ['mfa-visibleRatio', 0.1725667119026184],
        ['mfa-inputRatio', -5.889572620391846],
        ['mfa-hiddenRatio', 4.6787800788879395],
        ['mfa-identifierRatio', -2.5309557914733887],
        ['mfa-emailRatio', -5.6209330558776855],
        ['mfa-usernameRatio', -4.058542728424072],
        ['mfa-passwordRatio', -5.722538471221924],
        ['mfa-requiredRatio', 3.3665359020233154],
        ['mfa-checkboxRatio', 10.59062385559082],
        ['mfa-pageLogin', 2.369318962097168],
        ['mfa-formTextLogin', -6.009958267211914],
        ['mfa-formAttrsLogin', -1.656536340713501],
        ['mfa-headingsLogin', -4.8079304695129395],
        ['mfa-layoutLogin', 0.8272684812545776],
        ['mfa-rememberMeCheckbox', 9.608478546142578],
        ['mfa-troubleLink', -4.030245304107666],
        ['mfa-submitLogin', 2.395260810852051],
        ['mfa-pageRegister', -0.050235673785209656],
        ['mfa-formTextRegister', 0.018041975796222687],
        ['mfa-formAttrsRegister', -4.002821445465088],
        ['mfa-headingsRegister', -7.619940757751465],
        ['mfa-layoutRegister', -1.8554503917694092],
        ['mfa-pwNewRegister', -6.025944232940674],
        ['mfa-pwConfirmRegister', -6.040721893310547],
        ['mfa-submitRegister', -6.058624267578125],
        ['mfa-TOSRef', -2.5561230182647705],
        ['mfa-pagePwReset', -6.049489498138428],
        ['mfa-formTextPwReset', -6.06840181350708],
        ['mfa-formAttrsPwReset', -5.907971382141113],
        ['mfa-headingsPwReset', -5.974218845367432],
        ['mfa-layoutPwReset', -5.9922099113464355],
        ['mfa-pageRecovery', 1.330160140991211],
        ['mfa-formTextRecovery', -0.0034301504492759705],
        ['mfa-formAttrsRecovery', -6.100997447967529],
        ['mfa-headingsRecovery', -6.0003981590271],
        ['mfa-layoutRecovery', 1.902138352394104],
        ['mfa-identifierRecovery', -6.056447505950928],
        ['mfa-submitRecovery', 5.776317119598389],
        ['mfa-formTextMFA', 0.053553156554698944],
        ['mfa-formAttrsMFA', 14.734620094299316],
        ['mfa-headingsMFA', 13.750317573547363],
        ['mfa-layoutMFA', 14.608585357666016],
        ['mfa-buttonVerify', 18.474651336669922],
        ['mfa-inputsMFA', 16.719091415405273],
        ['mfa-inputsOTP', 19.327695846557617],
        ['mfa-linkOTPOutlier', -1.056117296218872],
        ['mfa-newsletterForm', -6.025543212890625],
        ['mfa-searchForm', -6.527355670928955],
        ['mfa-multiStepForm', 3.8046202659606934],
        ['mfa-multiAuthForm', -6.06812858581543],
        ['mfa-visibleRatio,fieldsCount', 1.3153743743896484],
        ['mfa-visibleRatio,identifierCount', -2.8759515285491943],
        ['mfa-visibleRatio,passwordCount', -4.6935200691223145],
        ['mfa-visibleRatio,hiddenIdentifierCount', -6.843139171600342],
        ['mfa-visibleRatio,hiddenPasswordCount', -0.27420809864997864],
        ['mfa-identifierRatio,fieldsCount', -0.4094852805137634],
        ['mfa-identifierRatio,identifierCount', -1.8246272802352905],
        ['mfa-identifierRatio,passwordCount', -5.31271505355835],
        ['mfa-identifierRatio,hiddenIdentifierCount', 0.39803561568260193],
        ['mfa-identifierRatio,hiddenPasswordCount', 2.3596723079681396],
        ['mfa-passwordRatio,fieldsCount', -5.3759026527404785],
        ['mfa-passwordRatio,identifierCount', -5.346388339996338],
        ['mfa-passwordRatio,passwordCount', -5.632260799407959],
        ['mfa-passwordRatio,hiddenIdentifierCount', -8.22301197052002],
        ['mfa-passwordRatio,hiddenPasswordCount', -5.995488166809082],
        ['mfa-requiredRatio,fieldsCount', -3.7365427017211914],
        ['mfa-requiredRatio,identifierCount', -2.866434335708618],
        ['mfa-requiredRatio,passwordCount', -3.930940628051758],
        ['mfa-requiredRatio,hiddenIdentifierCount', -6.067808628082275],
        ['mfa-requiredRatio,hiddenPasswordCount', -6.0450439453125],
    ],
    bias: -5.322455883026123,
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
        ...outRuleWithCache('form-candidate', FormType.MFA),
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
        ['pw-loginScore', 12.8425931930542],
        ['pw-registerScore', -13.378499031066895],
        ['pw-pwChangeScore', 2.921213388442993],
        ['pw-exotic', -12.663826942443848],
        ['pw-autocompleteNew', -3.51690673828125],
        ['pw-autocompleteCurrent', 0.7590001821517944],
        ['pw-autocompleteOff', -4.523982524871826],
        ['pw-isOnlyPassword', 5.8820366859436035],
        ['pw-prevPwField', 5.306009292602539],
        ['pw-nextPwField', -6.745763301849365],
        ['pw-attrCreate', -5.484086990356445],
        ['pw-attrCurrent', 3.1155130863189697],
        ['pw-attrConfirm', -6.409403324127197],
        ['pw-attrReset', 0.07032205164432526],
        ['pw-textCreate', -2.6428706645965576],
        ['pw-textCurrent', 1.7301194667816162],
        ['pw-textConfirm', -6.27731990814209],
        ['pw-textReset', -0.1284354329109192],
        ['pw-labelCreate', -6.91628885269165],
        ['pw-labelCurrent', 13.543344497680664],
        ['pw-labelConfirm', -6.303647518157959],
        ['pw-labelReset', 0.09284727275371552],
        ['pw-prevPwCreate', -9.341208457946777],
        ['pw-prevPwCurrent', -12.110845565795898],
        ['pw-prevPwConfirm', 0.09804551303386688],
        ['pw-passwordOutlier', -6.297443866729736],
        ['pw-nextPwCreate', 15.074135780334473],
        ['pw-nextPwCurrent', -7.233329772949219],
        ['pw-nextPwConfirm', -6.696846961975098],
    ],
    bias: -6.901088237762451,
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
        ...outRuleWithCache('field-candidate', FieldType.PASSWORD_CURRENT),
    ],
};

const results$4 = {
    coeffs: [
        ['pw[new]-loginScore', -11.79761791229248],
        ['pw[new]-registerScore', 13.207467079162598],
        ['pw[new]-pwChangeScore', 0.518919050693512],
        ['pw[new]-exotic', 15.661911010742188],
        ['pw[new]-autocompleteNew', 1.3702919483184814],
        ['pw[new]-autocompleteCurrent', -0.585719108581543],
        ['pw[new]-autocompleteOff', -1.0984125137329102],
        ['pw[new]-isOnlyPassword', -2.0054612159729004],
        ['pw[new]-prevPwField', 1.1099307537078857],
        ['pw[new]-nextPwField', 9.469817161560059],
        ['pw[new]-attrCreate', 3.6383402347564697],
        ['pw[new]-attrCurrent', 1.8213093280792236],
        ['pw[new]-attrConfirm', 7.772680759429932],
        ['pw[new]-attrReset', 0.057515159249305725],
        ['pw[new]-textCreate', 1.7611318826675415],
        ['pw[new]-textCurrent', -1.4192075729370117],
        ['pw[new]-textConfirm', -15.807029724121094],
        ['pw[new]-textReset', -0.022727981209754944],
        ['pw[new]-labelCreate', 7.953551292419434],
        ['pw[new]-labelCurrent', -13.997352600097656],
        ['pw[new]-labelConfirm', 7.937860488891602],
        ['pw[new]-labelReset', 0.02178335189819336],
        ['pw[new]-prevPwCreate', 11.071161270141602],
        ['pw[new]-prevPwCurrent', 9.047843933105469],
        ['pw[new]-prevPwConfirm', -0.0050661563873291016],
        ['pw[new]-passwordOutlier', -28.866724014282227],
        ['pw[new]-nextPwCreate', -11.700383186340332],
        ['pw[new]-nextPwCurrent', 8.510000228881836],
        ['pw[new]-nextPwConfirm', 9.286312103271484],
    ],
    bias: -3.1783359050750732,
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
        ['username-autocompleteUsername', 8.4799222946167],
        ['username-autocompleteNickname', 0.2949698269367218],
        ['username-autocompleteEmail', -6.826112747192383],
        ['username-autocompleteOff', -0.30067768692970276],
        ['username-attrUsername', 17.987205505371094],
        ['username-textUsername', 15.601824760437012],
        ['username-labelUsername', 17.35613441467285],
        ['username-outlierUsername', -0.11823385208845139],
        ['username-loginUsername', 18.332326889038086],
        ['username-searchField', -6.9408440589904785],
    ],
    bias: -9.685441970825195,
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
        ['username[hidden]-exotic', -7.268867015838623],
        ['username[hidden]-attrUsername', 14.68941879272461],
        ['username[hidden]-attrEmail', 13.718717575073242],
        ['username[hidden]-usernameAttr', 15.945220947265625],
        ['username[hidden]-autocompleteUsername', 1.195915699005127],
        ['username[hidden]-visibleReadonly', 13.705889701843262],
        ['username[hidden]-hiddenEmailValue', 15.474560737609863],
        ['username[hidden]-hiddenTelValue', 6.844428539276123],
        ['username[hidden]-hiddenUsernameValue', -0.6306125521659851],
    ],
    bias: -21.708499908447266,
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
        ...outRuleWithCache('field-candidate', FieldType.USERNAME_HIDDEN),
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
        ['email-autocompleteUsername', 1.1164394617080688],
        ['email-autocompleteNickname', -0.11852008104324341],
        ['email-autocompleteEmail', 6.255153656005859],
        ['email-typeEmail', 14.818696022033691],
        ['email-exactAttrEmail', 12.930174827575684],
        ['email-attrEmail', 2.435703992843628],
        ['email-textEmail', 13.969071388244629],
        ['email-labelEmail', 16.99106216430664],
        ['email-placeholderEmail', 14.20310115814209],
        ['email-searchField', -24.339866638183594],
    ],
    bias: -9.423550605773926,
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
        ...outRuleWithCache('field-candidate', FieldType.EMAIL),
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
        ['otp-mfaScore', 34.24491500854492],
        ['otp-exotic', -7.1488356590271],
        ['otp-linkOTPOutlier', -30.66411590576172],
        ['otp-hasCheckboxes', 7.240150451660156],
        ['otp-hidden', -0.007220640778541565],
        ['otp-required', -3.7672529220581055],
        ['otp-nameMatch', 2.5392072200775146],
        ['otp-idMatch', 8.873919486999512],
        ['otp-numericMode', -8.184645652770996],
        ['otp-autofocused', 1.1361602544784546],
        ['otp-tabIndex1', 3.0903444290161133],
        ['otp-patternOTP', 6.962174415588379],
        ['otp-maxLength1', 5.160733699798584],
        ['otp-maxLength5', -8.207122802734375],
        ['otp-minLength6', 16.07337760925293],
        ['otp-maxLength6', 8.32022762298584],
        ['otp-maxLength20', -1.140841007232666],
        ['otp-autocompleteOTC', 0.1409512609243393],
        ['otp-autocompleteOff', -3.0876314640045166],
        ['otp-prevAligned', -0.35210293531417847],
        ['otp-prevArea', -0.3188312351703644],
        ['otp-nextAligned', 0.16715140640735626],
        ['otp-nextArea', -0.051897935569286346],
        ['otp-attrMFA', 7.639617919921875],
        ['otp-attrOTP', 1.7246224880218506],
        ['otp-attrOutlier', -10.390393257141113],
        ['otp-textMFA', 6.657490253448486],
        ['otp-textOTP', -16.34011459350586],
        ['otp-labelMFA', -1.3743057250976562],
        ['otp-labelOTP', -0.07948236167430878],
        ['otp-labelOutlier', -6.6860761642456055],
        ['otp-wrapperOTP', 6.924853801727295],
        ['otp-wrapperOutlier', -6.270834922790527],
        ['otp-emailOutlierCount', -18.866779327392578],
    ],
    bias: -11.855243682861328,
    cutoff: 0.51,
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
        ...outRuleWithCache('field-candidate', FieldType.OTP),
    ],
};

const getFieldFeature = (fnode) => {
    var _a, _b;
    const field = fnode.element;
    const fieldHaystacks = getFieldHaystacks(field);
    const formFnode = getParentFormFnode(fnode);
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

const { clusters } = clusters$1;

const CLUSTER_MAX_X_DIST = 50;

const CLUSTER_MAX_Y_DIST = 275;

const CLUSTER_ALIGNMENT_TOLERANCE = 0.05;

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
    )((_, candidate) => candidate === node || candidate.querySelectorAll(buttonSelector).length === 0);
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
    const buttons = clusterable(
        Array.from(document.querySelectorAll(kButtonSubmitSelector)).filter(isSubmitBtnCandidate)
    );
    const candidates = uniqueNodes(fieldsOfInterest, buttons);
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
        .filter(
            (ancestor) => document.body !== ancestor && ancestor.querySelectorAll(inputCandidateSelector).length > 0
        );
    const result = pruneNested(ancestors);
    result.forEach(flagCluster);
    context.cache = new WeakMap();
    return result;
};

const TABLE_MAX_COLS = 3;

const TABLE_MAX_AREA = 15e4;

const nodeOfInterest = (el) => isClassifiable(el) && el.querySelector('input') !== null;

const excludeForms = (doc = document) => {
    const bodyElCount = document.body.querySelectorAll('*').length;
    return doc.querySelectorAll('form').forEach((form) => {
        if (nodeOfInterest(form)) {
            const fieldCount = form.querySelectorAll(kFieldSelector).length;
            const inputCount = form.querySelectorAll(inputCandidateSelector).length;
            const invalidFieldCount =
                inputCount === 0 || inputCount > MAX_INPUTS_PER_FORM || fieldCount > MAX_FIELDS_PER_FORM;
            const pageForm = form.matches('body > form');
            const formElCount = form.querySelectorAll('*').length;
            const invalidPageForm = pageForm && formElCount >= bodyElCount * 0.8;
            const invalidCount = invalidFieldCount || invalidPageForm;
            if (invalidCount && !pageForm) return flagSubtreeAsIgnored(form);
            if (invalidCount && pageForm) return flagAsIgnored(form);
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
        const listElement = input.getAttribute('aria-autocomplete') === 'list';
        if (invalidType || listElement) return flagAsIgnored(input);
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

const prepass = (doc = document) => {
    excludeForms(doc);
    excludeClusterableNodes(doc);
    excludeFields(doc);
    resolveFormClusters(doc);
};

const shouldRunClassifier = () => {
    const runForForms = selectFormCandidates().reduce((runDetection, form) => {
        if (isProcessed(form)) {
            const unprocessedFields = selectInputCandidates(form).some(isProcessableField);
            if (unprocessedFields)
                removeClassifierFlags(form, {
                    preserveIgnored: false,
                });
            return runDetection || unprocessedFields;
        }
        if (isVisibleForm(form)) return true;
        return runDetection;
    }, false);
    if (runForForms) return true;
    const runForFields = selectInputCandidates().some(isProcessableField);
    return runForFields;
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
                rule(dom(formCandidateSelector), type('form-candidate'), {}),
                rule(dom('input'), type('field-candidate'), {}),
                rule(type('form-candidate').when(withFnodeEl(isClassifiable)), type('form-element'), {}),
                rule(type('form-element').when(withFnodeEl(isVisibleForm)), type('form').note(getFormFeatures), {}),
                rule(type('form-element'), out('form').through(processFormEffect), {}),
                rule(type('form').when(isNoopForm), type(FormType.NOOP), {}),
                rule(type(FormType.NOOP), out(FormType.NOOP), {}),
                rule(type('field-candidate').when(isClassifiableField), type('field').note(getFieldFeature), {}),
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

const clearDetectionCache = () => clearVisibilityCache();

export {
    EL_ATTRIBUTES,
    FIELD_ATTRIBUTES,
    FORM_ATTRIBUTES,
    FORM_CLUSTER_ATTR,
    FieldType,
    FormType,
    TEXT_ATTRIBUTES,
    buttonSelector,
    cacheContext,
    clearDetectionCache,
    clearVisibilityCache,
    createInputIterator,
    fieldTypes,
    flagAsIgnored,
    flagAsProcessed,
    flagCluster,
    flagSubtreeAsIgnored,
    formCandidateSelector,
    formTypes,
    getAttributes,
    getBaseAttributes,
    getFieldAttributes,
    getFormAttributes,
    getFormParent,
    getIgnoredParent,
    getParentFormPrediction,
    getTextAttributes,
    getVisibilityCache,
    inputCandidateSelector,
    isClassifiable,
    isClassifiableField,
    isCluster,
    isEmailCandidate,
    isIgnored,
    isOAuthCandidate,
    isPredictedType,
    isPrediction,
    isProcessableField,
    isProcessed,
    isSubmitBtnCandidate,
    isUsernameCandidate,
    isVisible,
    isVisibleEl,
    isVisibleField,
    isVisibleForm,
    kAnchorLinkSelector,
    kButtonSubmitSelector,
    kCaptchaSelector,
    kDomGroupSelector,
    kEditorSelector,
    kEmailSelector,
    kFieldSelector,
    kHeadingSelector,
    kHiddenUsernameSelector,
    kLayoutSelector,
    kPasswordSelector,
    kSocialSelector,
    kUsernameSelector,
    maybeEmail,
    maybeHiddenUsername,
    maybeOTP,
    maybePassword,
    maybeUsername,
    otpSelector,
    prepass,
    removeClassifierFlags,
    removeIgnoredFlag,
    removePredictionFlag,
    removeProcessedFlag,
    rulesetMaker,
    selectFormCandidates,
    selectInputCandidates,
    setPrediction,
    shouldRunClassifier,
    splitFieldsByVisibility,
    trainees,
};
