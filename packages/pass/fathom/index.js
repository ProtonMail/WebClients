import { clusters as clusters$1, dom, out, rule, ruleset, score, type, utils } from './fathom.js';
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

const VALID_INPUT_TYPES = ['text', 'email', 'number', 'tel', 'password', 'hidden', 'search'];

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

const closest = (start, match, maxIterations = 1) => {
    const parent = start === null || start === void 0 ? void 0 : start.parentElement;
    if (!parent) return null;
    const result = match(parent);
    return result || maxIterations <= 0 ? result : closest(parent, match, maxIterations - 1);
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
    const parentLabel = el.closest('label');
    if (parentLabel) return parentLabel;
    const closestLabel = closest(el, (parent) => parent.querySelector('label'), 1);
    if (closestLabel) return closestLabel;
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

const removePredictionFlag = (el) => delete el.__PP_TYPE__;

const getParentFormPrediction = (el) => (el ? closestParent(el, isPrediction) : null);

const TYPE_SEPARATOR = ',';

const SCORE_SEPARATOR = ':';

const setCachedPredictionScore = (_el, type, score) => {
    const el = _el;
    const currentType = el.__PP_TYPE__;
    const flag = `${type}${SCORE_SEPARATOR}${score.toFixed(2)}`;
    if (!currentType) {
        el.__PP_TYPE__ = flag;
        return;
    }
    const types = currentType.split(TYPE_SEPARATOR);
    const existingIndex = types.findIndex((pred) => pred.startsWith(type));
    if (existingIndex !== -1) types[existingIndex] = flag;
    else types.push(flag);
    el.__PP_TYPE__ = types.join(TYPE_SEPARATOR);
};

const getCachedPredictionScore = (type) => (fnode) => {
    const types = fnode.element.__PP_TYPE__;
    if (!types) return -1;
    const predForType = types.split(TYPE_SEPARATOR).find((pred) => pred.startsWith(type));
    if (!predForType) return -1;
    const [, scoreStr] = predForType.split(SCORE_SEPARATOR);
    const score = parseFloat(scoreStr);
    return Number.isFinite(score) ? score : -1;
};

const isPredictedType = (type) => (fnode) => getCachedPredictionScore(type)(fnode) !== -1;

const isClassifiable = (el) => !(isPrediction(el) || isIgnored(el) || attrIgnored(el));

const removeClassifierFlags = (el, options) => {
    removeProcessedFlag(el);
    removePredictionFlag(el);
    if (!options.preserveIgnored) removeIgnoredFlag(el);
    el.querySelectorAll(kFieldSelector).forEach((el) => removeClassifierFlags(el, options));
};

const LOGIN_RE =
    /(?:(?:n(?:ouvelleses|uevase|ewses)s|iniciarses|connex)io|anmeldedate|sign[io])n|in(?:iciarsessao|troduce)|a(?:uthenticate|nmeld(?:ung|en))|authentifier|s(?:econnect|identifi)er|novasessao|(?:introduci|conecta|entr[ae])r|prihlasit|connect|acceder|login/i;

const REGISTER_RE =
    /kontoerstellen|cr(?:ea(?:teaccount|rcuenta)|iarconta)|(?:nouveaucompt|creeruncompt|s?inscrir|unirs)e|re(?:gist(?:r(?:ieren|arse|ar)|er)|joindre)|nuevacuenta|getstarted|neueskonto|newaccount|novaconta|(?:com(?:mence|eca)|(?:empez|junt)a)r|signup|join/i;

const RECOVERY_RE =
    /(?:wiederherstell|zurucksetz)en|re(?:(?:initialis|stablec)er|(?:defini|staur[ae])r|c(?:uper[ae]|ove)r|set)|problem|(?:troubl|restor|aid)e|a[jy]uda|h(?:ilfe|elp)/i;

const MULTI_STEP_RE = /p(?:rogres(?:s(?:ion|o)|o)|aso)|fortschritt|progress|s(?:chritt|t(?:age|ep))|etap[ae]|phase/i;

const TROUBLE_RE =
    /schwierigkeit|(?:difficult|troubl|oubli|hilf)e|i(?:nciden(?:cia|t)|ssue)|vergessen|esquecido|olvidado|needhelp|questao|problem|forgot|ayuda/i;

const PASSWORD_RE =
    /p(?:hrasesecrete|ass(?:(?:phras|cod)e|wor[dt]))|(?:c(?:havesecret|lavesecret|ontrasen)|deseguranc)a|(?:(?:zugangs|secret)cod|clesecret)e|codesecret|motdepasse|geheimnis|secret|heslo|senha|key/i;

const PASSWORD_OUTLIER_RE = /socialsecurity|nationalid|userid/i;

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

const IDENTITY_TELEPHONE_ATTR_RE = /(?:national|contact)number|tel(?:nation|loc)al|(?:tele)?phone|mobile|\b(tel)\b/i;

const IDENTITY_TELEPHONE_PREFIX_ATTR_RE = /co(?:untry|de)|prefix/i;

const IDENTITY_ADDRESS_ATTR_RE =
    /(?:preferred|street)address|address(?:line(?:one|[1s])|1)|mailingaddr|bill(?:ing)?addr|\b(mailaddr|addr(?:ess)?|street|line1)\b/i;

const IDENTITY_ADDRESS_LINES_ATTR_END_RE = /\b.*(?:line(?:t(?:hree|wo)|[23]))$/i;

const IDENTITY_STATE_ATTR_RE = /address(?:(?:provinc|stat)e|level1)|stateprovince|\b(province|county|region|state)\b/i;

const IDENTITY_CITY_ATTR_RE = /address(?:level2|town|city)|personalcity|\b((?:local|c)ity|town)\b/i;

const IDENTITY_ZIPCODE_ATTR_RE =
    /(?:address(?:postal|zip)|post)code|address(?:postal|zip)|postalcode|zipcode|\b(zip)\b/i;

const IDENTITY_ORGANIZATION_ATTR_RE = /organization(?:name)?|companyname|\b(organization)\b/i;

const IDENTITY_COUNTRY_ATTR_RE = /addresscountry(?:name)?|countryname|\b(country)\b/i;

const IDENTITY_COUNTRY_CODE_ATTR_RE = /countrycode/i;

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
        options !== null && options !== void 0
            ? options
            : {
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

const matchTelephone = and(test(IDENTITY_TELEPHONE_ATTR_RE), notRe(IDENTITY_TELEPHONE_PREFIX_ATTR_RE));

const matchOrganization = test(IDENTITY_ORGANIZATION_ATTR_RE);

const matchCity = test(IDENTITY_CITY_ATTR_RE);

const matchZipCode = test(IDENTITY_ZIPCODE_ATTR_RE);

const matchState = test(IDENTITY_STATE_ATTR_RE);

const matchCountry = and(test(IDENTITY_COUNTRY_ATTR_RE), notRe(IDENTITY_COUNTRY_CODE_ATTR_RE));

const matchAddress = and(test(IDENTITY_ADDRESS_ATTR_RE), notRe(IDENTITY_ADDRESS_LINES_ATTR_END_RE));

const normalizeString = (str, allowedChars = '') =>
    str
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(new RegExp(`[^a-zA-Z0-9${allowedChars}]`, 'g'), '');

const sanitizeString = (str) => normalizeString(str, '\\[\\]');

const sanitizeStringWithSpaces = (str) => normalizeString(str, '\\s\\[\\]');

const cacheContext = {};

const getVisibilityCache = (key) => {
    var _a;
    return (cacheContext[key] = (_a = cacheContext[key]) !== null && _a !== void 0 ? _a : new WeakMap());
};

const clearVisibilityCache = () => Object.keys(cacheContext).forEach((key) => delete cacheContext[key]);

const SCROLLBAR_WIDTH = 16;

const getCachedVisbility = (el, options) => {
    var _a;
    const opacityCache = getVisibilityCache('visibility:op');
    const cache = getVisibilityCache('visibility');
    if (options.opacity) return (_a = opacityCache.get(el)) !== null && _a !== void 0 ? _a : cache.get(el);
    else return cache.get(el);
};

const setCachedVisibility = (cacheMap) => (els, visible) => els.forEach((el) => cacheMap.set(el, visible));

const containedInAncestor = (rect, ancestorRect) =>
    rect.top <= ancestorRect.bottom &&
    rect.bottom >= ancestorRect.top &&
    rect.left <= ancestorRect.right &&
    rect.right >= ancestorRect.left;

const isNegligibleRect = (rect) => rect.width <= 1 || rect.height <= 1;

const isVisible = (fnodeOrElement, options) => {
    const element = utils.toDomElement(fnodeOrElement);
    const seen = [];
    let transparent = false;
    const cache = getVisibilityCache(options.opacity ? 'visibility:op' : 'visibility');
    const cachedVisibility = getCachedVisbility(element, options);
    if (cachedVisibility !== undefined) return cachedVisibility;
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
        var _a;
        let prevRef = null;
        for (const ancestor of utils.ancestors(element)) {
            let rect = null;
            const getRect = () => (rect = rect !== null && rect !== void 0 ? rect : ancestor.getBoundingClientRect());
            if (ancestor === doc.body)
                return (prevRef === null || prevRef === void 0 ? void 0 : prevRef.absolute)
                    ? isOnScreen(prevRef.rect)
                    : true;
            const cachedVisibility = getCachedVisbility(ancestor, options);
            if (cachedVisibility !== undefined) return cachedVisibility;
            const { opacity, display, position, overflow, visibility } = win.getComputedStyle(ancestor);
            seen.push(ancestor);
            if (opacity === '0' && options.opacity) {
                transparent = true;
                return false;
            }
            if (visibility === 'hidden') return false;
            if (overflow === 'hidden') {
                if (
                    (prevRef === null || prevRef === void 0 ? void 0 : prevRef.rect) &&
                    !containedInAncestor(prevRef.rect, getRect())
                )
                    return false;
                if (isNegligibleRect(getRect())) return false;
            }
            if ((prevRef === null || prevRef === void 0 ? void 0 : prevRef.absolute) && position === 'static') {
                seen.pop();
                continue;
            }
            if (position === 'fixed')
                return isOnScreen(
                    (_a = prevRef === null || prevRef === void 0 ? void 0 : prevRef.rect) !== null && _a !== void 0
                        ? _a
                        : getRect()
                );
            if (display === 'contents') {
                prevRef = null;
                continue;
            }
            prevRef =
                prevRef !== null && prevRef !== void 0
                    ? prevRef
                    : {
                          rect: getRect(),
                      };
            prevRef.rect = getRect();
            prevRef.absolute = position === 'absolute';
            continue;
        }
        return true;
    };
    const visible = check();
    if (options.opacity) {
        if (visible || !transparent) setCachedVisibility(getVisibilityCache('visibility'))(seen, visible);
        else setCachedVisibility(getVisibilityCache('visibility'))(seen.slice(0, -1), visible);
    }
    setCachedVisibility(cache)(seen, visible);
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

const isVisibleForm = (form) => {
    const visible = (() => {
        if (
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
        .map(sanitizeStringWithSpaces);

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

var FormType;

(function (FormType) {
    FormType['LOGIN'] = 'login';
    FormType['NOOP'] = 'noop';
    FormType['PASSWORD_CHANGE'] = 'password-change';
    FormType['RECOVERY'] = 'recovery';
    FormType['REGISTER'] = 'register';
})(FormType || (FormType = {}));

var FieldType;

(function (FieldType) {
    FieldType['EMAIL'] = 'email';
    FieldType['IDENTITY'] = 'identity';
    FieldType['OTP'] = 'otp';
    FieldType['PASSWORD_CURRENT'] = 'password';
    FieldType['PASSWORD_NEW'] = 'new-password';
    FieldType['USERNAME'] = 'username';
    FieldType['USERNAME_HIDDEN'] = 'username-hidden';
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
        if (!fnode.hasNoteFor(`${type}-prediction`)) {
            setCachedPredictionScore(fnode.element, type, getTypeScore(fnode, type));
        }
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

const typeScoreToleranceTest = (type) => (fnode) => fnode.scoreFor(type) > TOLERANCE_LEVEL;

const getTypeScore = (node, type) => {
    var _a;
    if (!node) return 0;
    if (node.hasNoteFor(`${type}-prediction`))
        return (_a = node.noteFor(`${type}-prediction`)) !== null && _a !== void 0 ? _a : 0;
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

const fType = (types) => (fnode) => types.includes(fnode.element.type);

const fMatch = (selector) => (fnode) => fnode.element.matches(selector);

const fInputMode = (inputMode) => (fnode) => fnode.element.inputMode === inputMode;

const fActive = (fnode) => isActiveFieldFNode(fnode);

const fList = (fnode) =>
    fnode.element.getAttribute('aria-autocomplete') === 'list' || fnode.element.role === 'combobox';

const maybeEmail = and(not(fList), or(fType(['email', 'text']), fInputMode('email')), fActive);

const maybePassword = and(fMatch(kPasswordSelector), fActive);

const maybeOTP = and(not(fList), fMatch(otpSelector), fActive);

const maybeUsername = and(
    not(fList),
    or(and(not(fInputMode('email')), fType(['text', 'tel'])), fMatch(kUsernameSelector)),
    fActive
);

const maybeHiddenUsername = and(not(fList), fType(['email', 'text', 'hidden']), not(fActive));

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

const isClassifiableField = (fnode) => isClassifiable(fnode.element) && getParentFormFnode(fnode) !== null;

const selectInputCandidates = (target = document) =>
    Array.from(target.querySelectorAll(inputCandidateSelector)).filter(isClassifiable);

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
    return candidates.filter((form) => !isIgnored(form) && !attrIgnored(form));
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
        ['login-fieldsCount', 6.9117207527160645],
        ['login-inputCount', 3.822486400604248],
        ['login-fieldsetCount', -18.91722297668457],
        ['login-textCount', -10.360284805297852],
        ['login-textareaCount', -5.995274066925049],
        ['login-selectCount', -6.1306281089782715],
        ['login-optionsCount', -6.087420463562012],
        ['login-radioCount', -5.951887607574463],
        ['login-identifierCount', -2.899953842163086],
        ['login-hiddenIdentifierCount', 8.090394973754883],
        ['login-usernameCount', 2.0640110969543457],
        ['login-emailCount', -9.865800857543945],
        ['login-hiddenCount', 5.637701988220215],
        ['login-hiddenPasswordCount', 9.23979377746582],
        ['login-submitCount', -2.284073829650879],
        ['login-hasTels', -6.52845573425293],
        ['login-hasOAuth', 6.302763938903809],
        ['login-hasCaptchas', 2.9789769649505615],
        ['login-hasFiles', -6.02401876449585],
        ['login-hasDate', -19.489826202392578],
        ['login-hasNumber', -5.951311111450195],
        ['login-oneVisibleField', 5.676862716674805],
        ['login-twoVisibleFields', 7.535869598388672],
        ['login-threeOrMoreVisibleFields', -1.3183695077896118],
        ['login-noPasswords', -13.081375122070312],
        ['login-onePassword', 10.25524616241455],
        ['login-twoPasswords', -11.755972862243652],
        ['login-threeOrMorePasswords', -6.044548988342285],
        ['login-noIdentifiers', -8.970521926879883],
        ['login-oneIdentifier', -2.0764057636260986],
        ['login-twoIdentifiers', -2.4918956756591797],
        ['login-threeOrMoreIdentifiers', -8.593513488769531],
        ['login-autofocusedIsIdentifier', 8.622314453125],
        ['login-autofocusedIsPassword', 14.90038013458252],
        ['login-visibleRatio', 7.558108329772949],
        ['login-inputRatio', -4.814621925354004],
        ['login-hiddenRatio', -5.744090557098389],
        ['login-identifierRatio', 10.3085298538208],
        ['login-emailRatio', 1.5703213214874268],
        ['login-usernameRatio', -7.5780768394470215],
        ['login-passwordRatio', -1.3385310173034668],
        ['login-requiredRatio', 1.6504578590393066],
        ['login-checkboxRatio', 26.39185333251953],
        ['login-pageLogin', 13.974407196044922],
        ['login-formTextLogin', 8.543004989624023],
        ['login-formAttrsLogin', 2.1100170612335205],
        ['login-headingsLogin', 13.746389389038086],
        ['login-layoutLogin', 0.20221181213855743],
        ['login-rememberMeCheckbox', 8.348167419433594],
        ['login-troubleLink', 12.179048538208008],
        ['login-submitLogin', 13.702370643615723],
        ['login-pageRegister', -13.799778938293457],
        ['login-formTextRegister', -0.044963739812374115],
        ['login-formAttrsRegister', -19.146482467651367],
        ['login-headingsRegister', -10.542322158813477],
        ['login-layoutRegister', -2.3833038806915283],
        ['login-pwNewRegister', -17.38996696472168],
        ['login-pwConfirmRegister', -11.91733455657959],
        ['login-submitRegister', -12.17735481262207],
        ['login-TOSRef', -5.637410640716553],
        ['login-pagePwReset', -10.309855461120605],
        ['login-formTextPwReset', -6.101982116699219],
        ['login-formAttrsPwReset', -11.729959487915039],
        ['login-headingsPwReset', -12.499267578125],
        ['login-layoutPwReset', -2.965204954147339],
        ['login-pageRecovery', 0.14035266637802124],
        ['login-formTextRecovery', 0.03439144045114517],
        ['login-formAttrsRecovery', -22.603046417236328],
        ['login-headingsRecovery', -10.492897033691406],
        ['login-layoutRecovery', 5.598866939544678],
        ['login-identifierRecovery', 4.300655364990234],
        ['login-submitRecovery', -12.31758975982666],
        ['login-formTextMFA', -14.27755069732666],
        ['login-formAttrsMFA', -19.56307029724121],
        ['login-inputsMFA', -19.59412384033203],
        ['login-inputsOTP', -16.51680564880371],
        ['login-newsletterForm', -9.028794288635254],
        ['login-searchForm', -6.545746803283691],
        ['login-multiStepForm', -1.8370318412780762],
        ['login-multiAuthForm', 15.096943855285645],
        ['login-visibleRatio,fieldsCount', -6.863025188446045],
        ['login-visibleRatio,identifierCount', -11.385756492614746],
        ['login-visibleRatio,passwordCount', 13.88270378112793],
        ['login-visibleRatio,hiddenIdentifierCount', -4.858383655548096],
        ['login-visibleRatio,hiddenPasswordCount', -12.938082695007324],
        ['login-visibleRatio,multiStepForm', 5.489163875579834],
        ['login-identifierRatio,fieldsCount', -20.94881820678711],
        ['login-identifierRatio,identifierCount', 9.301095962524414],
        ['login-identifierRatio,passwordCount', -8.721858978271484],
        ['login-identifierRatio,hiddenIdentifierCount', -2.131696939468384],
        ['login-identifierRatio,hiddenPasswordCount', 16.711109161376953],
        ['login-identifierRatio,multiStepForm', 11.259562492370605],
        ['login-passwordRatio,fieldsCount', 11.20872974395752],
        ['login-passwordRatio,identifierCount', -8.333873748779297],
        ['login-passwordRatio,passwordCount', -3.4213614463806152],
        ['login-passwordRatio,hiddenIdentifierCount', 21.96377182006836],
        ['login-passwordRatio,hiddenPasswordCount', 34.9525146484375],
        ['login-passwordRatio,multiStepForm', -12.636921882629395],
        ['login-requiredRatio,fieldsCount', 13.960801124572754],
        ['login-requiredRatio,identifierCount', -5.709250450134277],
        ['login-requiredRatio,passwordCount', 8.685138702392578],
        ['login-requiredRatio,hiddenIdentifierCount', -20.684762954711914],
        ['login-requiredRatio,hiddenPasswordCount', 17.758085250854492],
        ['login-requiredRatio,multiStepForm', 14.86757755279541],
    ],
    bias: -6.360585689544678,
    cutoff: 0.49,
};

const login = {
    name: FormType.LOGIN,
    coeffs: FORM_COMBINED_FEATURES.map((feat) => {
        var _a, _b;
        return [
            `login-${feat}`,
            (_b =
                (_a = results$9.coeffs.find(([feature]) => feature === `login-${feat}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
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
        ['pw-change-fieldsCount', -3.3321454524993896],
        ['pw-change-inputCount', -3.0804550647735596],
        ['pw-change-fieldsetCount', -5.934694766998291],
        ['pw-change-textCount', -6.049551486968994],
        ['pw-change-textareaCount', -6.0787129402160645],
        ['pw-change-selectCount', -5.987492084503174],
        ['pw-change-optionsCount', -6.083714485168457],
        ['pw-change-radioCount', -6.052059173583984],
        ['pw-change-identifierCount', -5.403328895568848],
        ['pw-change-hiddenIdentifierCount', -4.4229230880737305],
        ['pw-change-usernameCount', -6.04349422454834],
        ['pw-change-emailCount', -4.912832736968994],
        ['pw-change-hiddenCount', -3.4236717224121094],
        ['pw-change-hiddenPasswordCount', -5.930105209350586],
        ['pw-change-submitCount', -3.8625235557556152],
        ['pw-change-hasTels', -6.051826000213623],
        ['pw-change-hasOAuth', -6.006768226623535],
        ['pw-change-hasCaptchas', -6.024316310882568],
        ['pw-change-hasFiles', -6.003083229064941],
        ['pw-change-hasDate', -6.042792320251465],
        ['pw-change-hasNumber', -8.931044578552246],
        ['pw-change-oneVisibleField', -5.420173645019531],
        ['pw-change-twoVisibleFields', -3.1558315753936768],
        ['pw-change-threeOrMoreVisibleFields', -1.8346830606460571],
        ['pw-change-noPasswords', -6.032570838928223],
        ['pw-change-onePassword', -5.337682247161865],
        ['pw-change-twoPasswords', 7.295647144317627],
        ['pw-change-threeOrMorePasswords', 21.68557357788086],
        ['pw-change-noIdentifiers', -2.4498164653778076],
        ['pw-change-oneIdentifier', -6.094106197357178],
        ['pw-change-twoIdentifiers', -5.916845321655273],
        ['pw-change-threeOrMoreIdentifiers', 1.6939911842346191],
        ['pw-change-autofocusedIsIdentifier', -6.033471584320068],
        ['pw-change-autofocusedIsPassword', 15.131577491760254],
        ['pw-change-visibleRatio', -4.09120512008667],
        ['pw-change-inputRatio', -4.173065185546875],
        ['pw-change-hiddenRatio', -3.4960551261901855],
        ['pw-change-identifierRatio', -5.710056781768799],
        ['pw-change-emailRatio', -5.21774435043335],
        ['pw-change-usernameRatio', -6.235389232635498],
        ['pw-change-passwordRatio', 4.32260274887085],
        ['pw-change-requiredRatio', -2.6061058044433594],
        ['pw-change-checkboxRatio', -5.914191722869873],
        ['pw-change-pageLogin', -6.2052154541015625],
        ['pw-change-formTextLogin', -6.029303073883057],
        ['pw-change-formAttrsLogin', -6.053979873657227],
        ['pw-change-headingsLogin', -5.993305683135986],
        ['pw-change-layoutLogin', -6.096299648284912],
        ['pw-change-rememberMeCheckbox', -6.082805156707764],
        ['pw-change-troubleLink', -3.7113256454467773],
        ['pw-change-submitLogin', -6.145804405212402],
        ['pw-change-pageRegister', -5.985432147979736],
        ['pw-change-formTextRegister', -0.03591149300336838],
        ['pw-change-formAttrsRegister', -6.035892963409424],
        ['pw-change-headingsRegister', -6.411230087280273],
        ['pw-change-layoutRegister', -6.010503768920898],
        ['pw-change-pwNewRegister', 13.145064353942871],
        ['pw-change-pwConfirmRegister', 7.383437633514404],
        ['pw-change-submitRegister', -7.358190059661865],
        ['pw-change-TOSRef', -6.726124286651611],
        ['pw-change-pagePwReset', 15.504810333251953],
        ['pw-change-formTextPwReset', 22.969263076782227],
        ['pw-change-formAttrsPwReset', 14.371417045593262],
        ['pw-change-headingsPwReset', 18.480045318603516],
        ['pw-change-layoutPwReset', 16.99905014038086],
        ['pw-change-pageRecovery', -6.04259729385376],
        ['pw-change-formTextRecovery', -0.04274427890777588],
        ['pw-change-formAttrsRecovery', -6.037948131561279],
        ['pw-change-headingsRecovery', -3.522164821624756],
        ['pw-change-layoutRecovery', -4.054919242858887],
        ['pw-change-identifierRecovery', -5.953251361846924],
        ['pw-change-submitRecovery', 4.2396721839904785],
        ['pw-change-formTextMFA', -5.927785396575928],
        ['pw-change-formAttrsMFA', -5.923059463500977],
        ['pw-change-inputsMFA', -5.985617160797119],
        ['pw-change-inputsOTP', -5.914240837097168],
        ['pw-change-newsletterForm', -5.989622116088867],
        ['pw-change-searchForm', -5.92101526260376],
        ['pw-change-multiStepForm', -5.9458184242248535],
        ['pw-change-multiAuthForm', -6.091955184936523],
        ['pw-change-visibleRatio,fieldsCount', -3.3477888107299805],
        ['pw-change-visibleRatio,identifierCount', -5.617403984069824],
        ['pw-change-visibleRatio,passwordCount', 3.3302927017211914],
        ['pw-change-visibleRatio,hiddenIdentifierCount', -2.4642622470855713],
        ['pw-change-visibleRatio,hiddenPasswordCount', -6.048635959625244],
        ['pw-change-visibleRatio,multiStepForm', -5.95064115524292],
        ['pw-change-identifierRatio,fieldsCount', -4.540703296661377],
        ['pw-change-identifierRatio,identifierCount', -5.502275466918945],
        ['pw-change-identifierRatio,passwordCount', -4.315083026885986],
        ['pw-change-identifierRatio,hiddenIdentifierCount', -6.072136878967285],
        ['pw-change-identifierRatio,hiddenPasswordCount', -5.912572383880615],
        ['pw-change-identifierRatio,multiStepForm', -5.936649322509766],
        ['pw-change-passwordRatio,fieldsCount', 5.619084358215332],
        ['pw-change-passwordRatio,identifierCount', -4.406495571136475],
        ['pw-change-passwordRatio,passwordCount', 9.266096115112305],
        ['pw-change-passwordRatio,hiddenIdentifierCount', -0.12468687444925308],
        ['pw-change-passwordRatio,hiddenPasswordCount', -6.000542163848877],
        ['pw-change-passwordRatio,multiStepForm', -5.978328227996826],
        ['pw-change-requiredRatio,fieldsCount', -3.897763729095459],
        ['pw-change-requiredRatio,identifierCount', -6.03505802154541],
        ['pw-change-requiredRatio,passwordCount', 3.800820827484131],
        ['pw-change-requiredRatio,hiddenIdentifierCount', 0.2164151817560196],
        ['pw-change-requiredRatio,hiddenPasswordCount', -5.912103176116943],
        ['pw-change-requiredRatio,multiStepForm', -5.9860992431640625],
    ],
    bias: -4.346797466278076,
    cutoff: 1,
};

const passwordChange = {
    name: FormType.PASSWORD_CHANGE,
    coeffs: FORM_COMBINED_FEATURES.map((key) => {
        var _a, _b;
        return [
            `pw-change-${key}`,
            (_b =
                (_a = results$8.coeffs.find(([feature]) => feature === `pw-change-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
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
        ['recovery-fieldsCount', 5.219259262084961],
        ['recovery-inputCount', 3.4802393913269043],
        ['recovery-fieldsetCount', 5.091477394104004],
        ['recovery-textCount', -1.9329952001571655],
        ['recovery-textareaCount', -11.980330467224121],
        ['recovery-selectCount', -7.090891361236572],
        ['recovery-optionsCount', -7.454675197601318],
        ['recovery-radioCount', -5.982324600219727],
        ['recovery-identifierCount', 0.24470239877700806],
        ['recovery-hiddenIdentifierCount', -13.423789024353027],
        ['recovery-usernameCount', 7.580615997314453],
        ['recovery-emailCount', -0.7749595642089844],
        ['recovery-hiddenCount', 7.397370338439941],
        ['recovery-hiddenPasswordCount', -10.402884483337402],
        ['recovery-submitCount', 17.34208869934082],
        ['recovery-hasTels', -1.2667042016983032],
        ['recovery-hasOAuth', -14.191985130310059],
        ['recovery-hasCaptchas', 4.94380521774292],
        ['recovery-hasFiles', -22.454086303710938],
        ['recovery-hasDate', -6.028102874755859],
        ['recovery-hasNumber', -5.915408134460449],
        ['recovery-oneVisibleField', -4.2500810623168945],
        ['recovery-twoVisibleFields', -4.5695953369140625],
        ['recovery-threeOrMoreVisibleFields', 1.8211472034454346],
        ['recovery-noPasswords', -1.9446848630905151],
        ['recovery-onePassword', -12.154842376708984],
        ['recovery-twoPasswords', -6.388713359832764],
        ['recovery-threeOrMorePasswords', -5.9903340339660645],
        ['recovery-noIdentifiers', -12.915245056152344],
        ['recovery-oneIdentifier', 1.9877134561538696],
        ['recovery-twoIdentifiers', -3.45326828956604],
        ['recovery-threeOrMoreIdentifiers', -8.09775161743164],
        ['recovery-autofocusedIsIdentifier', 1.188584804534912],
        ['recovery-autofocusedIsPassword', -6.050867080688477],
        ['recovery-visibleRatio', 1.8096098899841309],
        ['recovery-inputRatio', -6.735170364379883],
        ['recovery-hiddenRatio', -1.901351809501648],
        ['recovery-identifierRatio', 2.0203499794006348],
        ['recovery-emailRatio', 0.9475768804550171],
        ['recovery-usernameRatio', 7.2057600021362305],
        ['recovery-passwordRatio', -9.867918968200684],
        ['recovery-requiredRatio', -1.6640514135360718],
        ['recovery-checkboxRatio', -5.932979583740234],
        ['recovery-pageLogin', -2.4858222007751465],
        ['recovery-formTextLogin', -5.925143718719482],
        ['recovery-formAttrsLogin', -0.08413530886173248],
        ['recovery-headingsLogin', 6.476242542266846],
        ['recovery-layoutLogin', -12.630494117736816],
        ['recovery-rememberMeCheckbox', -5.997462272644043],
        ['recovery-troubleLink', 8.869538307189941],
        ['recovery-submitLogin', -5.894786834716797],
        ['recovery-pageRegister', -10.688661575317383],
        ['recovery-formTextRegister', -0.07053083181381226],
        ['recovery-formAttrsRegister', -8.1167573928833],
        ['recovery-headingsRegister', -8.343093872070312],
        ['recovery-layoutRegister', -10.727327346801758],
        ['recovery-pwNewRegister', -5.970903396606445],
        ['recovery-pwConfirmRegister', -6.094449996948242],
        ['recovery-submitRegister', -6.537256717681885],
        ['recovery-TOSRef', -16.483572006225586],
        ['recovery-pagePwReset', 9.253317832946777],
        ['recovery-formTextPwReset', -6.472717761993408],
        ['recovery-formAttrsPwReset', 3.489095687866211],
        ['recovery-headingsPwReset', 7.393299579620361],
        ['recovery-layoutPwReset', 7.859417915344238],
        ['recovery-pageRecovery', 15.275426864624023],
        ['recovery-formTextRecovery', 0.08355202525854111],
        ['recovery-formAttrsRecovery', 15.822127342224121],
        ['recovery-headingsRecovery', 10.05958366394043],
        ['recovery-layoutRecovery', 0.8675701022148132],
        ['recovery-identifierRecovery', 17.785898208618164],
        ['recovery-submitRecovery', 17.075572967529297],
        ['recovery-formTextMFA', -1.6202266216278076],
        ['recovery-formAttrsMFA', 12.503120422363281],
        ['recovery-inputsMFA', -15.698631286621094],
        ['recovery-inputsOTP', -9.031906127929688],
        ['recovery-newsletterForm', -11.783472061157227],
        ['recovery-searchForm', -11.046648979187012],
        ['recovery-multiStepForm', 3.962646722793579],
        ['recovery-multiAuthForm', -6.030735969543457],
        ['recovery-visibleRatio,fieldsCount', -3.6750259399414062],
        ['recovery-visibleRatio,identifierCount', -0.46854108572006226],
        ['recovery-visibleRatio,passwordCount', -8.827977180480957],
        ['recovery-visibleRatio,hiddenIdentifierCount', -7.780083656311035],
        ['recovery-visibleRatio,hiddenPasswordCount', -14.793699264526367],
        ['recovery-visibleRatio,multiStepForm', 1.725805401802063],
        ['recovery-identifierRatio,fieldsCount', 2.5540273189544678],
        ['recovery-identifierRatio,identifierCount', 3.680723190307617],
        ['recovery-identifierRatio,passwordCount', -11.473299980163574],
        ['recovery-identifierRatio,hiddenIdentifierCount', -18.763864517211914],
        ['recovery-identifierRatio,hiddenPasswordCount', -15.784345626831055],
        ['recovery-identifierRatio,multiStepForm', -0.08650737255811691],
        ['recovery-passwordRatio,fieldsCount', -11.390311241149902],
        ['recovery-passwordRatio,identifierCount', -11.758790016174316],
        ['recovery-passwordRatio,passwordCount', -9.361132621765137],
        ['recovery-passwordRatio,hiddenIdentifierCount', -6.076198101043701],
        ['recovery-passwordRatio,hiddenPasswordCount', -5.9201741218566895],
        ['recovery-passwordRatio,multiStepForm', -6.187673091888428],
        ['recovery-requiredRatio,fieldsCount', -20.665956497192383],
        ['recovery-requiredRatio,identifierCount', 2.035646438598633],
        ['recovery-requiredRatio,passwordCount', -6.348474979400635],
        ['recovery-requiredRatio,hiddenIdentifierCount', 23.868844985961914],
        ['recovery-requiredRatio,hiddenPasswordCount', -10.315682411193848],
        ['recovery-requiredRatio,multiStepForm', -9.611449241638184],
    ],
    bias: -5.56587028503418,
    cutoff: 0.49,
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
        ['register-fieldsCount', 11.917691230773926],
        ['register-inputCount', 11.373042106628418],
        ['register-fieldsetCount', 7.854256629943848],
        ['register-textCount', 5.037329196929932],
        ['register-textareaCount', 4.7815656661987305],
        ['register-selectCount', -5.59323787689209],
        ['register-optionsCount', 4.742903232574463],
        ['register-radioCount', -0.44946426153182983],
        ['register-identifierCount', -3.116572141647339],
        ['register-hiddenIdentifierCount', 19.41229248046875],
        ['register-usernameCount', -6.986035346984863],
        ['register-emailCount', -7.78529691696167],
        ['register-hiddenCount', -18.398569107055664],
        ['register-hiddenPasswordCount', -15.720060348510742],
        ['register-submitCount', 7.6783881187438965],
        ['register-hasTels', -7.298455715179443],
        ['register-hasOAuth', 4.153497219085693],
        ['register-hasCaptchas', 7.080265998840332],
        ['register-hasFiles', -6.376850605010986],
        ['register-hasDate', 10.142865180969238],
        ['register-hasNumber', 19.163631439208984],
        ['register-oneVisibleField', -1.262165904045105],
        ['register-twoVisibleFields', 8.802234649658203],
        ['register-threeOrMoreVisibleFields', 5.305413246154785],
        ['register-noPasswords', -12.95462703704834],
        ['register-onePassword', -4.9351487159729],
        ['register-twoPasswords', 26.029905319213867],
        ['register-threeOrMorePasswords', -12.368908882141113],
        ['register-noIdentifiers', -11.34496784210205],
        ['register-oneIdentifier', -3.4595398902893066],
        ['register-twoIdentifiers', 3.8030407428741455],
        ['register-threeOrMoreIdentifiers', -11.924832344055176],
        ['register-autofocusedIsIdentifier', -1.864850640296936],
        ['register-autofocusedIsPassword', 30.214879989624023],
        ['register-visibleRatio', 5.202010631561279],
        ['register-inputRatio', -7.839704513549805],
        ['register-hiddenRatio', 20.710941314697266],
        ['register-identifierRatio', 14.027844429016113],
        ['register-emailRatio', -5.600202560424805],
        ['register-usernameRatio', -1.7127400636672974],
        ['register-passwordRatio', -12.093314170837402],
        ['register-requiredRatio', -5.89549446105957],
        ['register-checkboxRatio', -28.658470153808594],
        ['register-pageLogin', -7.616566181182861],
        ['register-formTextLogin', -5.961889743804932],
        ['register-formAttrsLogin', -0.7363413572311401],
        ['register-headingsLogin', -7.311540126800537],
        ['register-layoutLogin', 8.75506591796875],
        ['register-rememberMeCheckbox', -11.602274894714355],
        ['register-troubleLink', -13.688916206359863],
        ['register-submitLogin', -5.153923034667969],
        ['register-pageRegister', 14.36414909362793],
        ['register-formTextRegister', 0.0492059662938118],
        ['register-formAttrsRegister', 3.9691600799560547],
        ['register-headingsRegister', 13.079018592834473],
        ['register-layoutRegister', -1.0081580877304077],
        ['register-pwNewRegister', 10.531805992126465],
        ['register-pwConfirmRegister', 10.429780006408691],
        ['register-submitRegister', 27.7530574798584],
        ['register-TOSRef', 5.424505233764648],
        ['register-pagePwReset', -6.759202480316162],
        ['register-formTextPwReset', -10.20751953125],
        ['register-formAttrsPwReset', -6.02766227722168],
        ['register-headingsPwReset', -20.03550148010254],
        ['register-layoutPwReset', -64.6925277709961],
        ['register-pageRecovery', -5.776443004608154],
        ['register-formTextRecovery', -0.056022703647613525],
        ['register-formAttrsRecovery', -40.626976013183594],
        ['register-headingsRecovery', -1.4371925592422485],
        ['register-layoutRecovery', -2.5626723766326904],
        ['register-identifierRecovery', 5.569582939147949],
        ['register-submitRecovery', -42.5285530090332],
        ['register-formTextMFA', -10.36745548248291],
        ['register-formAttrsMFA', -10.58807373046875],
        ['register-inputsMFA', -9.893669128417969],
        ['register-inputsOTP', -7.69745397567749],
        ['register-newsletterForm', -16.872678756713867],
        ['register-searchForm', -6.112391471862793],
        ['register-multiStepForm', -4.156559944152832],
        ['register-multiAuthForm', -13.153765678405762],
        ['register-visibleRatio,fieldsCount', -12.166980743408203],
        ['register-visibleRatio,identifierCount', -0.3816330134868622],
        ['register-visibleRatio,passwordCount', 0.8365750908851624],
        ['register-visibleRatio,hiddenIdentifierCount', 16.387969970703125],
        ['register-visibleRatio,hiddenPasswordCount', -3.6937456130981445],
        ['register-visibleRatio,multiStepForm', 15.94931411743164],
        ['register-identifierRatio,fieldsCount', 2.0408496856689453],
        ['register-identifierRatio,identifierCount', 19.188720703125],
        ['register-identifierRatio,passwordCount', -31.58989143371582],
        ['register-identifierRatio,hiddenIdentifierCount', -22.044620513916016],
        ['register-identifierRatio,hiddenPasswordCount', 38.33562469482422],
        ['register-identifierRatio,multiStepForm', 5.4950056076049805],
        ['register-passwordRatio,fieldsCount', 8.79137134552002],
        ['register-passwordRatio,identifierCount', -35.184547424316406],
        ['register-passwordRatio,passwordCount', -12.764176368713379],
        ['register-passwordRatio,hiddenIdentifierCount', 12.858628273010254],
        ['register-passwordRatio,hiddenPasswordCount', 7.0506062507629395],
        ['register-passwordRatio,multiStepForm', 12.14311695098877],
        ['register-requiredRatio,fieldsCount', -27.65677833557129],
        ['register-requiredRatio,identifierCount', 22.865949630737305],
        ['register-requiredRatio,passwordCount', -2.035212755203247],
        ['register-requiredRatio,hiddenIdentifierCount', 13.596835136413574],
        ['register-requiredRatio,hiddenPasswordCount', -7.711032867431641],
        ['register-requiredRatio,multiStepForm', -1.6663168668746948],
    ],
    bias: -7.748831272125244,
    cutoff: 0.54,
};

const register = {
    name: FormType.REGISTER,
    coeffs: FORM_COMBINED_FEATURES.map((key) => {
        var _a, _b;
        return [
            `register-${key}`,
            (_b =
                (_a = results$6.coeffs.find(([feature]) => feature === `register-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
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

const results$5 = {
    coeffs: [
        ['email-autocompleteUsername', 1.422879934310913],
        ['email-autocompleteNickname', 0.06123584508895874],
        ['email-autocompleteEmail', 6.039527416229248],
        ['email-typeEmail', 15.077214241027832],
        ['email-exactAttrEmail', 13.114316940307617],
        ['email-attrEmail', 2.7811479568481445],
        ['email-textEmail', 15.807499885559082],
        ['email-labelEmail', 17.429636001586914],
        ['email-placeholderEmail', 3.715912103652954],
        ['email-searchField', -15.843851089477539],
    ],
    bias: -9.902606010437012,
    cutoff: 0.5,
};

const email = {
    name: FieldType.EMAIL,
    coeffs: EMAIL_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `email-${key}`,
            (_b =
                (_a = results$5.coeffs.find(([feature]) => feature === `email-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$5.bias,
    cutoff: results$5.cutoff,
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

var IdentityFieldType;

(function (IdentityFieldType) {
    IdentityFieldType[(IdentityFieldType['FULLNAME'] = 1)] = 'FULLNAME';
    IdentityFieldType[(IdentityFieldType['FIRSTNAME'] = 2)] = 'FIRSTNAME';
    IdentityFieldType[(IdentityFieldType['MIDDLENAME'] = 3)] = 'MIDDLENAME';
    IdentityFieldType[(IdentityFieldType['LASTNAME'] = 4)] = 'LASTNAME';
    IdentityFieldType[(IdentityFieldType['TELEPHONE'] = 5)] = 'TELEPHONE';
    IdentityFieldType[(IdentityFieldType['ADDRESS'] = 6)] = 'ADDRESS';
    IdentityFieldType[(IdentityFieldType['STATE'] = 7)] = 'STATE';
    IdentityFieldType[(IdentityFieldType['CITY'] = 8)] = 'CITY';
    IdentityFieldType[(IdentityFieldType['ZIPCODE'] = 9)] = 'ZIPCODE';
    IdentityFieldType[(IdentityFieldType['ORGANIZATION'] = 10)] = 'ORGANIZATION';
    IdentityFieldType[(IdentityFieldType['COUNTRY'] = 11)] = 'COUNTRY';
    IdentityFieldType[(IdentityFieldType['EMAIL'] = 12)] = 'EMAIL';
})(IdentityFieldType || (IdentityFieldType = {}));

const IDENTITY_RE_MAP = [
    [IdentityFieldType.FIRSTNAME, matchFirstName],
    [IdentityFieldType.MIDDLENAME, matchMiddleName],
    [IdentityFieldType.LASTNAME, matchLastName],
    [IdentityFieldType.FULLNAME, matchFullName],
    [IdentityFieldType.TELEPHONE, matchTelephone],
    [IdentityFieldType.ORGANIZATION, matchOrganization],
    [IdentityFieldType.CITY, matchCity],
    [IdentityFieldType.ZIPCODE, matchZipCode],
    [IdentityFieldType.STATE, matchState],
    [IdentityFieldType.COUNTRY, matchCountry],
    [IdentityFieldType.ADDRESS, matchAddress],
];

const IDENTITY_ATTRIBUTES = ['autocomplete', 'name', 'id', 'data-bhw'];

const IDENTITY_INPUT_TYPES = ['tel', 'phone', 'text', 'number'];

const getIdentityHaystack = (input) => {
    const attrs = IDENTITY_ATTRIBUTES.map((attr) => {
        var _a;
        return (_a = input === null || input === void 0 ? void 0 : input.getAttribute(attr)) !== null && _a !== void 0
            ? _a
            : '';
    });
    return sanitizeStringWithSpaces(attrs.join(' '));
};

const getIdentityFieldType = (input) => {
    var _a;
    const haystack = getIdentityHaystack(input);
    if (haystack)
        return (_a = IDENTITY_RE_MAP.find(([, test]) => test(haystack))) === null || _a === void 0 ? void 0 : _a[0];
};

const isAutocompleteListInput = (el) => el.getAttribute('aria-autocomplete') === 'list' || el.role === 'combobox';

const maybeIdentity = (fnode) => {
    const input = fnode.element;
    const { visible, isFormLogin, type, searchField } = fnode.noteFor('field');
    if ((type && !IDENTITY_INPUT_TYPES.includes(type)) || !visible || isFormLogin) return false;
    const identityType = getIdentityFieldType(input);
    if (!identityType) return false;
    if (isAutocompleteListInput(input))
        return [IdentityFieldType.ADDRESS, IdentityFieldType.ZIPCODE].includes(identityType);
    if (type === 'number') return [IdentityFieldType.TELEPHONE, IdentityFieldType.ZIPCODE].includes(identityType);
    if (searchField)
        return [IdentityFieldType.ADDRESS, IdentityFieldType.ZIPCODE, identityType === IdentityFieldType.CITY].includes(
            identityType
        );
    return true;
};

const identity = [
    rule(type('field').when(maybeIdentity), type('identity-field'), {}),
    rule(type('identity-field'), type(FieldType.IDENTITY), {}),
    ...outRuleWithCache('field-candidate', FieldType.IDENTITY, () => () => true),
];

const getOTPFieldFeatures = (fnode) => {
    var _a, _b, _c, _d, _e;
    const field = fnode.element;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, prevField, nextField, type, minLength, maxLength } = fieldFeatures;
    const formFeatures = fieldFeatures.formFeatures;
    const formMFA = Boolean(formFeatures === null || formFeatures === void 0 ? void 0 : formFeatures.formMFA);
    const formOTPOutlier = Boolean(
        formFeatures === null || formFeatures === void 0 ? void 0 : formFeatures.formOTPOutlier
    );
    const linkOutlier = Boolean(
        formFeatures === null || formFeatures === void 0 ? void 0 : formFeatures.linkOTPOutlier
    );
    const visibleInputsCount =
        formFeatures === null || formFeatures === void 0 ? void 0 : formFeatures.visibleInputsCount;
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
          bottom === (nextRect === null || nextRect === void 0 ? void 0 : nextRect.bottom)
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
    const formText =
        (_c =
            (_b =
                (_a = fieldFeatures === null || fieldFeatures === void 0 ? void 0 : fieldFeatures.formFnode) === null ||
                _a === void 0
                    ? void 0
                    : _a.element) === null || _b === void 0
                ? void 0
                : _b.innerText) !== null && _c !== void 0
            ? _c
            : '';
    const parents = [getNthParent(field)(1), getNthParent(field)(2)];
    const wrapperAttrs = parents.flatMap(getBaseAttributes);
    const wrapperOTP = any(matchOtpAttr)(wrapperAttrs);
    const wrapperOutlier = any(matchOtpOutlier)(wrapperAttrs);
    const invalidInputCount = !(visibleInputsCount === 1 || visibleInputsCount === 6);
    const maxLengthExpected = maxLength === 1 || maxLength === 6;
    const maxLengthInvalid = maxLength > 10;
    const siblingOfInterest = prevAligned || nextAligned;
    const otpSmells = wrapperOTP || attrOTP || textOTP || labelOTP;
    const emailOutlierCount = otpSmells
        ? (_e = (_d = formText.match(/@/g)) === null || _d === void 0 ? void 0 : _d.length) !== null && _e !== void 0
            ? _e
            : 0
        : 0;
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

const BASE_OTP_FIELD_FEATURES = [
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
];

const OTP_FIELD_FEATURES = [
    ...BASE_OTP_FIELD_FEATURES,
    ...combineFeatures(
        ['autocompleteOTC', 'siblingOfInterest', 'formMFA'],
        ['inputCountOutlier', 'maxLengthInvalid', 'attrOTP']
    ),
];

const results$4 = {
    coeffs: [
        ['otp-formMFA', 7.771900177001953],
        ['otp-formOutlier', -0.04360857233405113],
        ['otp-fieldOutlier', -14.93850040435791],
        ['otp-linkOutlier', -15.19876766204834],
        ['otp-emailOutlierCount', -20.635622024536133],
        ['otp-inputCountOutlier', -4.404586315155029],
        ['otp-nameMatch', 11.083649635314941],
        ['otp-idMatch', 8.304197311401367],
        ['otp-numericMode', 6.63908052444458],
        ['otp-patternOTP', 11.01827621459961],
        ['otp-maxLengthExpected', 1.5373173952102661],
        ['otp-maxLengthInvalid', -6.062628269195557],
        ['otp-maxLength1', 4.458582401275635],
        ['otp-maxLength5', -7.512012481689453],
        ['otp-minLength6', 15.0722017288208],
        ['otp-maxLength6', -7.584023952484131],
        ['otp-autocompleteOTC', 5.740074634552002],
        ['otp-prevAligned', 4.224268913269043],
        ['otp-prevArea', 2.773845672607422],
        ['otp-nextAligned', 3.857393741607666],
        ['otp-nextArea', 2.5566060543060303],
        ['otp-attrMFA', 32.71980285644531],
        ['otp-attrOTP', 20.423227310180664],
        ['otp-textMFA', 6.684645652770996],
        ['otp-textOTP', 1.1047155857086182],
        ['otp-labelMFA', 18.526269912719727],
        ['otp-labelOTP', 8.603682518005371],
        ['otp-wrapperOTP', -10.004483222961426],
        ['otp-autocompleteOTC,inputCountOutlier', -4.689912796020508],
        ['otp-autocompleteOTC,maxLengthInvalid', -18.661497116088867],
        ['otp-autocompleteOTC,attrOTP', 5.988102436065674],
        ['otp-siblingOfInterest,inputCountOutlier', -7.615082263946533],
        ['otp-siblingOfInterest,maxLengthInvalid', -6.08467435836792],
        ['otp-siblingOfInterest,attrOTP', 5.977667331695557],
        ['otp-formMFA,inputCountOutlier', 9.612953186035156],
        ['otp-formMFA,maxLengthInvalid', -12.804899215698242],
        ['otp-formMFA,attrOTP', 6.108048439025879],
    ],
    bias: -11.110547065734863,
    cutoff: 0.5,
};

const otp = {
    name: FieldType.OTP,
    coeffs: OTP_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `otp-${key}`,
            (_b =
                (_a = results$4.coeffs.find(([feature]) => feature === `otp-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$4.bias,
    cutoff: results$4.cutoff,
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

const isAutocompleteCurrentPassword = (value) => value === 'current-password' || value === 'password';

const isAutocompleteNewPassword = (value) => value === 'new-password';

const getPasswordFieldFeatures = (fnode) => {
    var _a, _b;
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
    const prevAutocomplete =
        prevPwField === null || prevPwField === void 0 ? void 0 : prevPwField.getAttribute('autocomplete');
    const prevAutocompleteCurrent = isAutocompleteCurrentPassword(prevAutocomplete);
    const prevPwCurrent = prevAutocompleteCurrent || any(matchPasswordCurrent)(prevPwHaystack);
    const prevAutocompleteNew = isAutocompleteNewPassword(prevAutocomplete);
    const prevPwNew = prevAutocompleteNew || any(matchPasswordCreate)(prevPwHaystack);
    const prevPwConfirm = any(matchPasswordConfirm)(prevPwHaystack);
    const nextAutocomplete =
        nextPwField === null || nextPwField === void 0 ? void 0 : nextPwField.getAttribute('autocomplete');
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
        isOnlyPassword:
            (_b = (_a = fieldFeatures.formFeatures) === null || _a === void 0 ? void 0 : _a.onePassword) !== null &&
            _b !== void 0
                ? _b
                : 0,
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

const BASE_PW_FIELD_FEATURES = [
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
];

const PW_FIELD_FEATURES = [...BASE_PW_FIELD_FEATURES, ...combineFeatures(['prevPwCurrent'], ['nextPwNew'])];

const results$3 = {
    coeffs: [
        ['pw-loginScore', 11.489188194274902],
        ['pw-registerScore', -12.317614555358887],
        ['pw-pwChangeScore', -3.3522896766662598],
        ['pw-exotic', -11.274672508239746],
        ['pw-autocompleteNew', -3.2165679931640625],
        ['pw-autocompleteCurrent', 1.107975721359253],
        ['pw-autocompleteOff', -1.5637125968933105],
        ['pw-isOnlyPassword', 1.6692641973495483],
        ['pw-prevPwField', -3.853325843811035],
        ['pw-nextPwField', -2.6056430339813232],
        ['pw-attrCreate', -2.091197967529297],
        ['pw-attrCurrent', 2.623647451400757],
        ['pw-attrConfirm', -6.392003536224365],
        ['pw-attrReset', 0.0007354617118835449],
        ['pw-textCreate', -2.4505302906036377],
        ['pw-textCurrent', 1.7695688009262085],
        ['pw-textConfirm', -6.402401924133301],
        ['pw-textReset', -0.1697392612695694],
        ['pw-labelCreate', -7.204258441925049],
        ['pw-labelCurrent', 14.438202857971191],
        ['pw-labelConfirm', -6.259541988372803],
        ['pw-labelReset', 0.015617117285728455],
        ['pw-prevPwNew', -6.184617519378662],
        ['pw-prevPwCurrent', -6.242441177368164],
        ['pw-prevPwConfirm', -0.17926810681819916],
        ['pw-nextPwNew', 9.929208755493164],
        ['pw-nextPwCurrent', -7.612186431884766],
        ['pw-nextPwConfirm', -6.865516662597656],
        ['pw-passwordOutlier', -17.66224479675293],
        ['pw-prevPwCurrent,nextPwNew', -5.839819431304932],
    ],
    bias: 0.2366154044866562,
    cutoff: 0.5,
};

const password = {
    name: FieldType.PASSWORD_CURRENT,
    coeffs: PW_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `pw-${key}`,
            (_b =
                (_a = results$3.coeffs.find(([feature]) => feature === `pw-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$3.bias,
    cutoff: results$3.cutoff,
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

const results$2 = {
    coeffs: [
        ['pw[new]-loginScore', -10.936930656433105],
        ['pw[new]-registerScore', 11.831424713134766],
        ['pw[new]-pwChangeScore', 5.067559242248535],
        ['pw[new]-exotic', 11.193541526794434],
        ['pw[new]-autocompleteNew', 2.4367527961730957],
        ['pw[new]-autocompleteCurrent', -1.0056599378585815],
        ['pw[new]-autocompleteOff', 1.5895371437072754],
        ['pw[new]-isOnlyPassword', -1.4990589618682861],
        ['pw[new]-prevPwField', 3.6485674381256104],
        ['pw[new]-nextPwField', 1.4125449657440186],
        ['pw[new]-attrCreate', 2.043544292449951],
        ['pw[new]-attrCurrent', -1.0884264707565308],
        ['pw[new]-attrConfirm', 6.419448375701904],
        ['pw[new]-attrReset', 0.08130821585655212],
        ['pw[new]-textCreate', 2.1415109634399414],
        ['pw[new]-textCurrent', -1.3681634664535522],
        ['pw[new]-textConfirm', 6.278629779815674],
        ['pw[new]-textReset', 0.07996046543121338],
        ['pw[new]-labelCreate', 7.23655891418457],
        ['pw[new]-labelCurrent', -13.138494491577148],
        ['pw[new]-labelConfirm', 6.407430171966553],
        ['pw[new]-labelReset', -0.02614663541316986],
        ['pw[new]-prevPwNew', 6.290370941162109],
        ['pw[new]-prevPwCurrent', 6.439488887786865],
        ['pw[new]-prevPwConfirm', 0.02449376881122589],
        ['pw[new]-nextPwNew', -10.66829776763916],
        ['pw[new]-nextPwCurrent', 7.651172161102295],
        ['pw[new]-nextPwConfirm', 7.5237345695495605],
        ['pw[new]-passwordOutlier', -23.131240844726562],
        ['pw[new]-prevPwCurrent,nextPwNew', 5.949848651885986],
    ],
    bias: -0.42535680532455444,
    cutoff: 0.5,
};

const newPassword = {
    name: FieldType.PASSWORD_NEW,
    coeffs: PW_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `pw[new]-${key}`,
            (_b =
                (_a = results$2.coeffs.find(([feature]) => feature === `pw[new]-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$2.bias,
    cutoff: results$2.cutoff,
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

const results$1 = {
    coeffs: [
        ['username-autocompleteUsername', 8.727046012878418],
        ['username-autocompleteNickname', -0.2054200917482376],
        ['username-autocompleteEmail', -6.400381565093994],
        ['username-autocompleteOff', -0.4214320778846741],
        ['username-attrUsername', 17.859210968017578],
        ['username-textUsername', 15.59371280670166],
        ['username-labelUsername', 17.55240821838379],
        ['username-outlierUsername', 0.07585844397544861],
        ['username-loginUsername', 18.52303123474121],
        ['username-searchField', -13.451205253601074],
    ],
    bias: -9.966038703918457,
    cutoff: 0.5,
};

const username = {
    name: FieldType.USERNAME,
    coeffs: USERNAME_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `username-${key}`,
            (_b =
                (_a = results$1.coeffs.find(([feature]) => feature === `username-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$1.bias,
    cutoff: results$1.cutoff,
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

const results = {
    coeffs: [
        ['username[hidden]-exotic', -10.682938575744629],
        ['username[hidden]-attrUsername', 21.034669876098633],
        ['username[hidden]-attrEmail', 13.188990592956543],
        ['username[hidden]-usernameAttr', 15.255407333374023],
        ['username[hidden]-autocompleteUsername', 4.695377826690674],
        ['username[hidden]-visibleReadonly', 11.520600318908691],
        ['username[hidden]-hiddenEmailValue', 24.007482528686523],
        ['username[hidden]-hiddenTelValue', 6.628058433532715],
        ['username[hidden]-hiddenUsernameValue', 7.225632190704346],
    ],
    bias: -30.55059242248535,
    cutoff: 0.5,
};

const usernameHidden = {
    name: FieldType.USERNAME_HIDDEN,
    coeffs: HIDDEN_USER_FIELD_FEATURES.map((key) => {
        var _a, _b;
        return [
            `username[hidden]-${key}`,
            (_b =
                (_a = results.coeffs.find(([feature]) => feature === `username[hidden]-${key}`)) === null ||
                _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results.bias,
    cutoff: results.cutoff,
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
    const buttons = clusterable(Array.from(document.querySelectorAll(kButtonSubmitSelector)).filter(isBtnCandidate));
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
        if (isVisibleForm(form)) {
            removeHiddenFlag(form);
            return true;
        }
        return runDetection;
    }, false);
    if (runForForms) return true;
    const runForFields = selectInputCandidates().some(isProcessableField);
    return runForFields;
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
                rule(dom('input'), type('field-candidate'), {}),
                rule(type('form-candidate').when(withFnodeEl(isClassifiable)), type('form-element'), {}),
                rule(type('form-element').when(withFnodeEl(isVisibleForm)), type('form').note(getFormFeatures), {}),
                rule(type('form-element'), out('form').through(processFormEffect), {}),
                ...noop,
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
                ...identity,
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
    IdentityFieldType,
    TEXT_ATTRIBUTES,
    attrIgnored,
    buttonSelector,
    cacheContext,
    clearDetectionCache,
    clearVisibilityCache,
    createInputIterator,
    fieldTypes,
    flagAsHidden,
    flagAsIgnored,
    flagAsProcessed,
    flagCluster,
    flagSubtreeAsIgnored,
    formCandidateSelector,
    formTypes,
    getAttributes,
    getBaseAttributes,
    getCachedPredictionScore,
    getFieldAttributes,
    getFormAttributes,
    getFormParent,
    getIdentityFieldType,
    getIdentityHaystack,
    getIgnoredParent,
    getParentFormPrediction,
    getTextAttributes,
    getTypeScore,
    getVisibilityCache,
    inputCandidateSelector,
    isBtnCandidate,
    isClassifiable,
    isClassifiableField,
    isCluster,
    isEmailCandidate,
    isHidden,
    isIgnored,
    isOAuthCandidate,
    isPredictedType,
    isPrediction,
    isProcessableField,
    isProcessed,
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
    maybeIdentity,
    maybeOTP,
    maybePassword,
    maybeUsername,
    otpSelector,
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
    shouldRunClassifier,
    splitFieldsByVisibility,
    trainees,
};
