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

const isHidden = (el) => el.__PP_HIDDEN__ === true;

const flagAsHidden = (el) => (el.__PP_HIDDEN__ = true);

const removeHiddenFlag = (el) => delete el.__PP_HIDDEN__;

const attrIgnored = (el) => el.getAttribute('data-protonpass-ignore') !== null;

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

const HIDDEN_ATTR_RE = /s(?:creenreade)?ronly|(?:move)?offscreen|(?:displaynon|a11yhid)e|\b((?:is)?hidden)\b/i;

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

const matchMfaAction = test(MFA_ACTION_RE);

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
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(new RegExp(`[^a-zA-Z0-9${allowedChars}]`, 'g'), '');

const sanitizeString = (str) => normalizeString(str, '\\[\\]');

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
        const classList = Array.from(el.classList).map(sanitizeString);
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

var FormType;

(function (FormType) {
    FormType['LOGIN'] = 'login';
    FormType['MFA'] = 'mfa';
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
    const mfa = getTypeScore(formFnode, FormType.MFA) > 0.5;
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

const fList = (fnode) => fnode.element.getAttribute('aria-autocomplete') === 'list';

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
    const btnCandidates = submits.length > 0 ? submits : submitBtns;
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
        ['login-fieldsCount', 15.533066749572754],
        ['login-inputCount', 7.0117340087890625],
        ['login-fieldsetCount', -19.15961265563965],
        ['login-textCount', -6.375486850738525],
        ['login-textareaCount', -6.070274829864502],
        ['login-selectCount', -6.059010028839111],
        ['login-optionsCount', -6.157516956329346],
        ['login-radioCount', -6.073096752166748],
        ['login-identifierCount', -4.353714942932129],
        ['login-hiddenIdentifierCount', -5.500473976135254],
        ['login-usernameCount', 3.0877890586853027],
        ['login-emailCount', -0.591221272945404],
        ['login-hiddenCount', 20.864036560058594],
        ['login-hiddenPasswordCount', 10.848235130310059],
        ['login-submitCount', -11.922256469726562],
        ['login-hasTels', 0.7463042140007019],
        ['login-hasOAuth', 4.8075175285339355],
        ['login-hasCaptchas', -1.6900944709777832],
        ['login-hasFiles', -6.09666109085083],
        ['login-hasDate', -7.22972297668457],
        ['login-hasNumber', -5.996871471405029],
        ['login-oneVisibleField', 6.906347274780273],
        ['login-twoVisibleFields', 5.325456619262695],
        ['login-threeOrMoreVisibleFields', -10.844974517822266],
        ['login-noPasswords', -17.484397888183594],
        ['login-onePassword', 17.463075637817383],
        ['login-twoPasswords', -8.781846046447754],
        ['login-threeOrMorePasswords', -5.955063343048096],
        ['login-noIdentifiers', -9.874448776245117],
        ['login-oneIdentifier', -0.6660460233688354],
        ['login-twoIdentifiers', -6.357570648193359],
        ['login-threeOrMoreIdentifiers', -6.200989723205566],
        ['login-autofocusedIsIdentifier', 17.5673770904541],
        ['login-autofocusedIsPassword', 31.281597137451172],
        ['login-visibleRatio', 5.023518085479736],
        ['login-inputRatio', -1.633710265159607],
        ['login-hiddenRatio', -29.695537567138672],
        ['login-identifierRatio', 13.890417098999023],
        ['login-emailRatio', -1.9031964540481567],
        ['login-usernameRatio', -5.075610160827637],
        ['login-passwordRatio', -6.249815940856934],
        ['login-requiredRatio', 6.99027681350708],
        ['login-checkboxRatio', 34.58559799194336],
        ['login-pageLogin', 14.618524551391602],
        ['login-formTextLogin', 6.9518351554870605],
        ['login-formAttrsLogin', 4.247609615325928],
        ['login-headingsLogin', 16.574604034423828],
        ['login-layoutLogin', 0.9213023781776428],
        ['login-rememberMeCheckbox', 8.371251106262207],
        ['login-troubleLink', 17.324663162231445],
        ['login-submitLogin', 15.789779663085938],
        ['login-pageRegister', -18.352502822875977],
        ['login-formTextRegister', 0.02341083437204361],
        ['login-formAttrsRegister', -20.72014808654785],
        ['login-headingsRegister', -15.73426342010498],
        ['login-layoutRegister', 8.145956039428711],
        ['login-pwNewRegister', -32.16966247558594],
        ['login-pwConfirmRegister', -12.234440803527832],
        ['login-submitRegister', -13.476841926574707],
        ['login-TOSRef', -2.733813762664795],
        ['login-pagePwReset', -7.532760143280029],
        ['login-formTextPwReset', -5.994162082672119],
        ['login-formAttrsPwReset', -7.945815086364746],
        ['login-headingsPwReset', -29.10732650756836],
        ['login-layoutPwReset', 4.531654357910156],
        ['login-pageRecovery', 0.9246063828468323],
        ['login-formTextRecovery', 0.007913947105407715],
        ['login-formAttrsRecovery', -43.38822937011719],
        ['login-headingsRecovery', -7.306544780731201],
        ['login-layoutRecovery', 3.172903060913086],
        ['login-identifierRecovery', 3.5989999771118164],
        ['login-submitRecovery', -16.17881965637207],
        ['login-formTextMFA', 0.06497884541749954],
        ['login-formAttrsMFA', -20.316606521606445],
        ['login-headingsMFA', -27.420713424682617],
        ['login-layoutMFA', -4.96061897277832],
        ['login-buttonVerify', -7.408151149749756],
        ['login-inputsMFA', -21.460020065307617],
        ['login-inputsOTP', -29.245084762573242],
        ['login-linkOTPOutlier', -9.70751953125],
        ['login-newsletterForm', -9.574259757995605],
        ['login-searchForm', -6.154438018798828],
        ['login-multiStepForm', 10.170517921447754],
        ['login-multiAuthForm', 4.625428676605225],
        ['login-visibleRatio,fieldsCount', -19.444774627685547],
        ['login-visibleRatio,identifierCount', -13.227922439575195],
        ['login-visibleRatio,passwordCount', 6.434311866760254],
        ['login-visibleRatio,hiddenIdentifierCount', -19.84176254272461],
        ['login-visibleRatio,hiddenPasswordCount', 53.86063003540039],
        ['login-identifierRatio,fieldsCount', -34.79080581665039],
        ['login-identifierRatio,identifierCount', 12.947755813598633],
        ['login-identifierRatio,passwordCount', -18.085716247558594],
        ['login-identifierRatio,hiddenIdentifierCount', 11.71382999420166],
        ['login-identifierRatio,hiddenPasswordCount', 3.21468448638916],
        ['login-passwordRatio,fieldsCount', 25.98701286315918],
        ['login-passwordRatio,identifierCount', -17.739383697509766],
        ['login-passwordRatio,passwordCount', -7.9168381690979],
        ['login-passwordRatio,hiddenIdentifierCount', 25.20244598388672],
        ['login-passwordRatio,hiddenPasswordCount', 12.580229759216309],
        ['login-requiredRatio,fieldsCount', 10.874580383300781],
        ['login-requiredRatio,identifierCount', -6.574690818786621],
        ['login-requiredRatio,passwordCount', 12.686752319335938],
        ['login-requiredRatio,hiddenIdentifierCount', -18.76955795288086],
        ['login-requiredRatio,hiddenPasswordCount', 17.923545837402344],
    ],
    bias: -7.863719463348389,
    cutoff: 0.54,
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
        ['mfa-fieldsCount', -2.2419660091400146],
        ['mfa-inputCount', -2.710594654083252],
        ['mfa-fieldsetCount', -18.47945213317871],
        ['mfa-textCount', 8.591668128967285],
        ['mfa-textareaCount', -19.37232780456543],
        ['mfa-selectCount', -6.462200164794922],
        ['mfa-optionsCount', -6.484800338745117],
        ['mfa-radioCount', -5.982038497924805],
        ['mfa-identifierCount', -0.8375437259674072],
        ['mfa-hiddenIdentifierCount', -16.016786575317383],
        ['mfa-usernameCount', -2.979592800140381],
        ['mfa-emailCount', -7.373532295227051],
        ['mfa-hiddenCount', -1.1861605644226074],
        ['mfa-hiddenPasswordCount', -0.7127807140350342],
        ['mfa-submitCount', 4.201887607574463],
        ['mfa-hasTels', 1.9216793775558472],
        ['mfa-hasOAuth', -6.066320896148682],
        ['mfa-hasCaptchas', -3.8236351013183594],
        ['mfa-hasFiles', -6.048410892486572],
        ['mfa-hasDate', -6.0313239097595215],
        ['mfa-hasNumber', 15.158866882324219],
        ['mfa-oneVisibleField', 6.8941545486450195],
        ['mfa-twoVisibleFields', -4.802910327911377],
        ['mfa-threeOrMoreVisibleFields', -2.8841795921325684],
        ['mfa-noPasswords', -5.284688949584961],
        ['mfa-onePassword', -2.894829750061035],
        ['mfa-twoPasswords', -5.912070274353027],
        ['mfa-threeOrMorePasswords', -5.9470319747924805],
        ['mfa-noIdentifiers', -7.684614658355713],
        ['mfa-oneIdentifier', -3.3394503593444824],
        ['mfa-twoIdentifiers', 6.16289758682251],
        ['mfa-threeOrMoreIdentifiers', 6.872775077819824],
        ['mfa-autofocusedIsIdentifier', -3.2642295360565186],
        ['mfa-autofocusedIsPassword', 10.980904579162598],
        ['mfa-visibleRatio', -0.7060779929161072],
        ['mfa-inputRatio', -5.791551113128662],
        ['mfa-hiddenRatio', 0.7909075617790222],
        ['mfa-identifierRatio', -1.576141119003296],
        ['mfa-emailRatio', -7.392882347106934],
        ['mfa-usernameRatio', -5.337181091308594],
        ['mfa-passwordRatio', -4.156192302703857],
        ['mfa-requiredRatio', 3.559037923812866],
        ['mfa-checkboxRatio', 26.024274826049805],
        ['mfa-pageLogin', 2.6602909564971924],
        ['mfa-formTextLogin', -5.928945541381836],
        ['mfa-formAttrsLogin', -1.1851667165756226],
        ['mfa-headingsLogin', -2.871504545211792],
        ['mfa-layoutLogin', 4.664605140686035],
        ['mfa-rememberMeCheckbox', 10.307807922363281],
        ['mfa-troubleLink', 2.171921730041504],
        ['mfa-submitLogin', 2.789977550506592],
        ['mfa-pageRegister', -0.007297956384718418],
        ['mfa-formTextRegister', -0.06125269830226898],
        ['mfa-formAttrsRegister', -4.008758068084717],
        ['mfa-headingsRegister', -9.734000205993652],
        ['mfa-layoutRegister', -0.04526277631521225],
        ['mfa-pwNewRegister', -5.95842170715332],
        ['mfa-pwConfirmRegister', -5.914911270141602],
        ['mfa-submitRegister', -6.051270008087158],
        ['mfa-TOSRef', -0.6627581119537354],
        ['mfa-pagePwReset', -5.932652473449707],
        ['mfa-formTextPwReset', -6.045075416564941],
        ['mfa-formAttrsPwReset', -6.023281574249268],
        ['mfa-headingsPwReset', -6.095569133758545],
        ['mfa-layoutPwReset', -5.931661128997803],
        ['mfa-pageRecovery', 2.9496819972991943],
        ['mfa-formTextRecovery', 0.07077362388372421],
        ['mfa-formAttrsRecovery', -6.013267993927002],
        ['mfa-headingsRecovery', -6.027597427368164],
        ['mfa-layoutRecovery', -3.305208206176758],
        ['mfa-identifierRecovery', -6.0620808601379395],
        ['mfa-submitRecovery', 3.1614363193511963],
        ['mfa-formTextMFA', 0.03594944626092911],
        ['mfa-formAttrsMFA', 15.09916877746582],
        ['mfa-headingsMFA', 13.913336753845215],
        ['mfa-layoutMFA', 15.65275764465332],
        ['mfa-buttonVerify', 18.50153160095215],
        ['mfa-inputsMFA', 15.73507022857666],
        ['mfa-inputsOTP', 16.347667694091797],
        ['mfa-linkOTPOutlier', -3.755319118499756],
        ['mfa-newsletterForm', -5.96494197845459],
        ['mfa-searchForm', -6.166814804077148],
        ['mfa-multiStepForm', 3.281527519226074],
        ['mfa-multiAuthForm', -6.093998432159424],
        ['mfa-visibleRatio,fieldsCount', 2.433647871017456],
        ['mfa-visibleRatio,identifierCount', 0.694275438785553],
        ['mfa-visibleRatio,passwordCount', -1.6093724966049194],
        ['mfa-visibleRatio,hiddenIdentifierCount', -2.8556344509124756],
        ['mfa-visibleRatio,hiddenPasswordCount', 4.507513046264648],
        ['mfa-identifierRatio,fieldsCount', 4.260969161987305],
        ['mfa-identifierRatio,identifierCount', 0.1442812979221344],
        ['mfa-identifierRatio,passwordCount', -1.4140949249267578],
        ['mfa-identifierRatio,hiddenIdentifierCount', 6.670848369598389],
        ['mfa-identifierRatio,hiddenPasswordCount', 9.436718940734863],
        ['mfa-passwordRatio,fieldsCount', -3.1729736328125],
        ['mfa-passwordRatio,identifierCount', -1.3280582427978516],
        ['mfa-passwordRatio,passwordCount', -4.374018669128418],
        ['mfa-passwordRatio,hiddenIdentifierCount', -6.570529937744141],
        ['mfa-passwordRatio,hiddenPasswordCount', -5.967837810516357],
        ['mfa-requiredRatio,fieldsCount', -8.572775840759277],
        ['mfa-requiredRatio,identifierCount', 2.8113596439361572],
        ['mfa-requiredRatio,passwordCount', -0.06728088855743408],
        ['mfa-requiredRatio,hiddenIdentifierCount', -5.915247440338135],
        ['mfa-requiredRatio,hiddenPasswordCount', -6.069669723510742],
    ],
    bias: -4.646615982055664,
    cutoff: 0.51,
};

const mfa = {
    name: FormType.MFA,
    coeffs: FORM_COMBINED_FEATURES.map((key) => {
        var _a, _b;
        return [
            `mfa-${key}`,
            (_b =
                (_a = results$9.coeffs.find(([feature]) => feature === `mfa-${key}`)) === null || _a === void 0
                    ? void 0
                    : _a[1]) !== null && _b !== void 0
                ? _b
                : 0,
        ];
    }),
    bias: results$9.bias,
    cutoff: results$9.cutoff,
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

const results$8 = {
    coeffs: [
        ['pw-change-fieldsCount', -3.2290279865264893],
        ['pw-change-inputCount', -3.100456714630127],
        ['pw-change-fieldsetCount', -5.956822395324707],
        ['pw-change-textCount', -5.913456439971924],
        ['pw-change-textareaCount', -6.008982181549072],
        ['pw-change-selectCount', -5.949356555938721],
        ['pw-change-optionsCount', -5.930590629577637],
        ['pw-change-radioCount', -6.070214748382568],
        ['pw-change-identifierCount', -5.475142002105713],
        ['pw-change-hiddenIdentifierCount', -3.938098192214966],
        ['pw-change-usernameCount', -6.083153247833252],
        ['pw-change-emailCount', -4.6675705909729],
        ['pw-change-hiddenCount', -4.283837795257568],
        ['pw-change-hiddenPasswordCount', -6.001791954040527],
        ['pw-change-submitCount', -3.7052950859069824],
        ['pw-change-hasTels', -5.994776725769043],
        ['pw-change-hasOAuth', -5.94725227355957],
        ['pw-change-hasCaptchas', -6.035555362701416],
        ['pw-change-hasFiles', -6.084530353546143],
        ['pw-change-hasDate', -6.089611053466797],
        ['pw-change-hasNumber', -5.964924335479736],
        ['pw-change-oneVisibleField', -5.9338459968566895],
        ['pw-change-twoVisibleFields', -2.9046075344085693],
        ['pw-change-threeOrMoreVisibleFields', -1.8322445154190063],
        ['pw-change-noPasswords', -6.058050632476807],
        ['pw-change-onePassword', -5.979057788848877],
        ['pw-change-twoPasswords', 9.148784637451172],
        ['pw-change-threeOrMorePasswords', 22.61445426940918],
        ['pw-change-noIdentifiers', -3.093729019165039],
        ['pw-change-oneIdentifier', -5.998588562011719],
        ['pw-change-twoIdentifiers', -5.973278522491455],
        ['pw-change-threeOrMoreIdentifiers', 3.447591543197632],
        ['pw-change-autofocusedIsIdentifier', -5.9642252922058105],
        ['pw-change-autofocusedIsPassword', 20.369670867919922],
        ['pw-change-visibleRatio', -4.076508522033691],
        ['pw-change-inputRatio', -4.409294605255127],
        ['pw-change-hiddenRatio', -4.779738426208496],
        ['pw-change-identifierRatio', -5.711945056915283],
        ['pw-change-emailRatio', -5.218329906463623],
        ['pw-change-usernameRatio', -6.080836296081543],
        ['pw-change-passwordRatio', 3.2575318813323975],
        ['pw-change-requiredRatio', -4.510173320770264],
        ['pw-change-checkboxRatio', -5.995474815368652],
        ['pw-change-pageLogin', -6.455835342407227],
        ['pw-change-formTextLogin', -6.090415954589844],
        ['pw-change-formAttrsLogin', -6.071751594543457],
        ['pw-change-headingsLogin', -6.103880405426025],
        ['pw-change-layoutLogin', -5.948545455932617],
        ['pw-change-rememberMeCheckbox', -5.949529647827148],
        ['pw-change-troubleLink', -3.2876322269439697],
        ['pw-change-submitLogin', -5.958254814147949],
        ['pw-change-pageRegister', -5.983945846557617],
        ['pw-change-formTextRegister', -0.021120019257068634],
        ['pw-change-formAttrsRegister', -5.952646732330322],
        ['pw-change-headingsRegister', -6.076287269592285],
        ['pw-change-layoutRegister', -6.086706161499023],
        ['pw-change-pwNewRegister', 11.585742950439453],
        ['pw-change-pwConfirmRegister', 6.917054653167725],
        ['pw-change-submitRegister', -7.140591144561768],
        ['pw-change-TOSRef', -6.814116954803467],
        ['pw-change-pagePwReset', 16.267688751220703],
        ['pw-change-formTextPwReset', 23.293598175048828],
        ['pw-change-formAttrsPwReset', 2.683418035507202],
        ['pw-change-headingsPwReset', 17.522262573242188],
        ['pw-change-layoutPwReset', 18.680387496948242],
        ['pw-change-pageRecovery', -5.9562177658081055],
        ['pw-change-formTextRecovery', -0.02885235846042633],
        ['pw-change-formAttrsRecovery', -6.071045875549316],
        ['pw-change-headingsRecovery', -5.934299945831299],
        ['pw-change-layoutRecovery', -3.8305020332336426],
        ['pw-change-identifierRecovery', -6.010611534118652],
        ['pw-change-submitRecovery', 0.5351177453994751],
        ['pw-change-formTextMFA', -0.05405566468834877],
        ['pw-change-formAttrsMFA', -5.961301803588867],
        ['pw-change-headingsMFA', -5.973845481872559],
        ['pw-change-layoutMFA', -6.0836286544799805],
        ['pw-change-buttonVerify', -6.084550380706787],
        ['pw-change-inputsMFA', -5.971856594085693],
        ['pw-change-inputsOTP', -6.083951950073242],
        ['pw-change-linkOTPOutlier', -5.9652628898620605],
        ['pw-change-newsletterForm', -6.000176906585693],
        ['pw-change-searchForm', -6.059692859649658],
        ['pw-change-multiStepForm', -6.060854911804199],
        ['pw-change-multiAuthForm', -6.005516052246094],
        ['pw-change-visibleRatio,fieldsCount', -3.205624580383301],
        ['pw-change-visibleRatio,identifierCount', -5.561724662780762],
        ['pw-change-visibleRatio,passwordCount', 3.5467171669006348],
        ['pw-change-visibleRatio,hiddenIdentifierCount', -1.8557215929031372],
        ['pw-change-visibleRatio,hiddenPasswordCount', -6.051314830780029],
        ['pw-change-identifierRatio,fieldsCount', -4.343614101409912],
        ['pw-change-identifierRatio,identifierCount', -5.465174674987793],
        ['pw-change-identifierRatio,passwordCount', -4.180048942565918],
        ['pw-change-identifierRatio,hiddenIdentifierCount', -6.101139068603516],
        ['pw-change-identifierRatio,hiddenPasswordCount', -5.997249126434326],
        ['pw-change-passwordRatio,fieldsCount', 5.935881614685059],
        ['pw-change-passwordRatio,identifierCount', -4.125007152557373],
        ['pw-change-passwordRatio,passwordCount', 8.839983940124512],
        ['pw-change-passwordRatio,hiddenIdentifierCount', 0.9953616261482239],
        ['pw-change-passwordRatio,hiddenPasswordCount', -5.933096885681152],
        ['pw-change-requiredRatio,fieldsCount', -4.906337738037109],
        ['pw-change-requiredRatio,identifierCount', -6.020929336547852],
        ['pw-change-requiredRatio,passwordCount', -0.07541138678789139],
        ['pw-change-requiredRatio,hiddenIdentifierCount', 4.185435771942139],
        ['pw-change-requiredRatio,hiddenPasswordCount', -6.032873153686523],
    ],
    bias: -4.397923946380615,
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
        ['recovery-fieldsCount', 5.691658973693848],
        ['recovery-inputCount', 3.8727896213531494],
        ['recovery-fieldsetCount', 6.97744083404541],
        ['recovery-textCount', -1.7376492023468018],
        ['recovery-textareaCount', -13.380834579467773],
        ['recovery-selectCount', -7.814173698425293],
        ['recovery-optionsCount', -7.504043102264404],
        ['recovery-radioCount', -5.9246506690979],
        ['recovery-identifierCount', 2.0454652309417725],
        ['recovery-hiddenIdentifierCount', -10.02741813659668],
        ['recovery-usernameCount', 8.784740447998047],
        ['recovery-emailCount', 0.2477351874113083],
        ['recovery-hiddenCount', 1.5685067176818848],
        ['recovery-hiddenPasswordCount', -12.510038375854492],
        ['recovery-submitCount', 17.663694381713867],
        ['recovery-hasTels', -7.692051887512207],
        ['recovery-hasOAuth', -12.257339477539062],
        ['recovery-hasCaptchas', 6.442842960357666],
        ['recovery-hasFiles', -27.97824478149414],
        ['recovery-hasDate', -5.911277770996094],
        ['recovery-hasNumber', -6.02328634262085],
        ['recovery-oneVisibleField', -3.594514846801758],
        ['recovery-twoVisibleFields', -4.588850975036621],
        ['recovery-threeOrMoreVisibleFields', 0.7012080550193787],
        ['recovery-noPasswords', -1.8856678009033203],
        ['recovery-onePassword', -13.147001266479492],
        ['recovery-twoPasswords', -7.702927589416504],
        ['recovery-threeOrMorePasswords', -5.944723129272461],
        ['recovery-noIdentifiers', -15.97026538848877],
        ['recovery-oneIdentifier', 4.518120765686035],
        ['recovery-twoIdentifiers', -5.876511096954346],
        ['recovery-threeOrMoreIdentifiers', -10.59078311920166],
        ['recovery-autofocusedIsIdentifier', 1.3618000745773315],
        ['recovery-autofocusedIsPassword', -6.081905841827393],
        ['recovery-visibleRatio', 1.457047939300537],
        ['recovery-inputRatio', -7.296701431274414],
        ['recovery-hiddenRatio', 0.24959740042686462],
        ['recovery-identifierRatio', 1.4606069326400757],
        ['recovery-emailRatio', 0.5844667553901672],
        ['recovery-usernameRatio', 4.374735355377197],
        ['recovery-passwordRatio', -11.851707458496094],
        ['recovery-requiredRatio', -6.367061614990234],
        ['recovery-checkboxRatio', -5.933959007263184],
        ['recovery-pageLogin', -2.750676155090332],
        ['recovery-formTextLogin', -5.9992828369140625],
        ['recovery-formAttrsLogin', -1.8026103973388672],
        ['recovery-headingsLogin', 5.849264621734619],
        ['recovery-layoutLogin', -10.158416748046875],
        ['recovery-rememberMeCheckbox', -5.92531156539917],
        ['recovery-troubleLink', 8.325353622436523],
        ['recovery-submitLogin', -3.3673300743103027],
        ['recovery-pageRegister', -14.993555068969727],
        ['recovery-formTextRegister', 0.06094677001237869],
        ['recovery-formAttrsRegister', -8.982287406921387],
        ['recovery-headingsRegister', -7.5987162590026855],
        ['recovery-layoutRegister', -13.695116996765137],
        ['recovery-pwNewRegister', -5.971552848815918],
        ['recovery-pwConfirmRegister', -6.086686611175537],
        ['recovery-submitRegister', -7.35581111907959],
        ['recovery-TOSRef', -13.825784683227539],
        ['recovery-pagePwReset', 8.690646171569824],
        ['recovery-formTextPwReset', -6.160444736480713],
        ['recovery-formAttrsPwReset', 2.765989303588867],
        ['recovery-headingsPwReset', 13.901848793029785],
        ['recovery-layoutPwReset', 7.934939384460449],
        ['recovery-pageRecovery', 18.61292839050293],
        ['recovery-formTextRecovery', -0.09124141186475754],
        ['recovery-formAttrsRecovery', 18.067119598388672],
        ['recovery-headingsRecovery', 9.532248497009277],
        ['recovery-layoutRecovery', 2.8663887977600098],
        ['recovery-identifierRecovery', 15.754294395446777],
        ['recovery-submitRecovery', 18.607574462890625],
        ['recovery-formTextMFA', 0.004985637962818146],
        ['recovery-formAttrsMFA', 1.3719096183776855],
        ['recovery-headingsMFA', -7.732670307159424],
        ['recovery-layoutMFA', -6.169278144836426],
        ['recovery-buttonVerify', 9.418800354003906],
        ['recovery-inputsMFA', 8.442117691040039],
        ['recovery-inputsOTP', -4.747860431671143],
        ['recovery-linkOTPOutlier', -2.2916228771209717],
        ['recovery-newsletterForm', -13.556933403015137],
        ['recovery-searchForm', -10.539673805236816],
        ['recovery-multiStepForm', 4.08909273147583],
        ['recovery-multiAuthForm', -7.146108627319336],
        ['recovery-visibleRatio,fieldsCount', 0.3894067406654358],
        ['recovery-visibleRatio,identifierCount', -0.9878978729248047],
        ['recovery-visibleRatio,passwordCount', -10.76027774810791],
        ['recovery-visibleRatio,hiddenIdentifierCount', -6.3832597732543945],
        ['recovery-visibleRatio,hiddenPasswordCount', -18.22380828857422],
        ['recovery-identifierRatio,fieldsCount', 4.007361888885498],
        ['recovery-identifierRatio,identifierCount', 3.4291491508483887],
        ['recovery-identifierRatio,passwordCount', -14.621247291564941],
        ['recovery-identifierRatio,hiddenIdentifierCount', -11.63796329498291],
        ['recovery-identifierRatio,hiddenPasswordCount', -19.201276779174805],
        ['recovery-passwordRatio,fieldsCount', -11.41397762298584],
        ['recovery-passwordRatio,identifierCount', -14.665567398071289],
        ['recovery-passwordRatio,passwordCount', -10.975305557250977],
        ['recovery-passwordRatio,hiddenIdentifierCount', -6.3702826499938965],
        ['recovery-passwordRatio,hiddenPasswordCount', -6.015196800231934],
        ['recovery-requiredRatio,fieldsCount', -18.717327117919922],
        ['recovery-requiredRatio,identifierCount', -2.215949535369873],
        ['recovery-requiredRatio,passwordCount', -6.117486000061035],
        ['recovery-requiredRatio,hiddenIdentifierCount', 21.756793975830078],
        ['recovery-requiredRatio,hiddenPasswordCount', -11.373931884765625],
    ],
    bias: -6.053030014038086,
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
        ['register-fieldsCount', 13.961907386779785],
        ['register-inputCount', 14.798670768737793],
        ['register-fieldsetCount', 15.074356079101562],
        ['register-textCount', 3.458444595336914],
        ['register-textareaCount', 4.315401077270508],
        ['register-selectCount', -9.423113822937012],
        ['register-optionsCount', 1.458374261856079],
        ['register-radioCount', -0.7317736744880676],
        ['register-identifierCount', 1.2067017555236816],
        ['register-hiddenIdentifierCount', 19.41143035888672],
        ['register-usernameCount', -13.026047706604004],
        ['register-emailCount', -5.62438440322876],
        ['register-hiddenCount', -11.110462188720703],
        ['register-hiddenPasswordCount', -17.172348022460938],
        ['register-submitCount', 7.017927169799805],
        ['register-hasTels', -7.265535354614258],
        ['register-hasOAuth', 3.0652594566345215],
        ['register-hasCaptchas', 5.969107627868652],
        ['register-hasFiles', -6.530544281005859],
        ['register-hasDate', 10.117829322814941],
        ['register-hasNumber', 27.86643409729004],
        ['register-oneVisibleField', 0.1512916535139084],
        ['register-twoVisibleFields', 8.071199417114258],
        ['register-threeOrMoreVisibleFields', 6.284096717834473],
        ['register-noPasswords', -12.311112403869629],
        ['register-onePassword', -4.384363651275635],
        ['register-twoPasswords', 13.580345153808594],
        ['register-threeOrMorePasswords', -13.210433959960938],
        ['register-noIdentifiers', -17.70882225036621],
        ['register-oneIdentifier', -1.0111727714538574],
        ['register-twoIdentifiers', 5.793731212615967],
        ['register-threeOrMoreIdentifiers', 6.922633171081543],
        ['register-autofocusedIsIdentifier', 0.7739107608795166],
        ['register-autofocusedIsPassword', 9.755281448364258],
        ['register-visibleRatio', 8.308700561523438],
        ['register-inputRatio', -8.128963470458984],
        ['register-hiddenRatio', 5.77459192276001],
        ['register-identifierRatio', 9.289145469665527],
        ['register-emailRatio', -4.239207744598389],
        ['register-usernameRatio', 0.9114764928817749],
        ['register-passwordRatio', 0.017112750560045242],
        ['register-requiredRatio', -0.28670451045036316],
        ['register-checkboxRatio', -46.226993560791016],
        ['register-pageLogin', -8.012704849243164],
        ['register-formTextLogin', -5.946081161499023],
        ['register-formAttrsLogin', 2.55617618560791],
        ['register-headingsLogin', -7.892760753631592],
        ['register-layoutLogin', 3.3156933784484863],
        ['register-rememberMeCheckbox', -27.429458618164062],
        ['register-troubleLink', -17.037118911743164],
        ['register-submitLogin', -4.648677349090576],
        ['register-pageRegister', 9.953064918518066],
        ['register-formTextRegister', 0.09114304929971695],
        ['register-formAttrsRegister', 2.740037441253662],
        ['register-headingsRegister', 14.256619453430176],
        ['register-layoutRegister', 2.196939706802368],
        ['register-pwNewRegister', 11.579275131225586],
        ['register-pwConfirmRegister', 12.54723072052002],
        ['register-submitRegister', 23.439956665039062],
        ['register-TOSRef', 6.967465400695801],
        ['register-pagePwReset', -7.268350124359131],
        ['register-formTextPwReset', -11.510497093200684],
        ['register-formAttrsPwReset', -6.106536865234375],
        ['register-headingsPwReset', -33.23918914794922],
        ['register-layoutPwReset', -55.61100769042969],
        ['register-pageRecovery', -2.4738385677337646],
        ['register-formTextRecovery', 0.07879408448934555],
        ['register-formAttrsRecovery', -28.524381637573242],
        ['register-headingsRecovery', -4.6638288497924805],
        ['register-layoutRecovery', -4.828676223754883],
        ['register-identifierRecovery', -16.755216598510742],
        ['register-submitRecovery', -38.677547454833984],
        ['register-formTextMFA', -0.03051813691854477],
        ['register-formAttrsMFA', -9.618215560913086],
        ['register-headingsMFA', -14.194433212280273],
        ['register-layoutMFA', -8.029223442077637],
        ['register-buttonVerify', -8.107118606567383],
        ['register-inputsMFA', 22.342670440673828],
        ['register-inputsOTP', -22.7878360748291],
        ['register-linkOTPOutlier', -3.674595832824707],
        ['register-newsletterForm', -18.903139114379883],
        ['register-searchForm', -5.977461814880371],
        ['register-multiStepForm', 12.205759048461914],
        ['register-multiAuthForm', -9.529417037963867],
        ['register-visibleRatio,fieldsCount', -25.268930435180664],
        ['register-visibleRatio,identifierCount', 3.565091609954834],
        ['register-visibleRatio,passwordCount', 13.182647705078125],
        ['register-visibleRatio,hiddenIdentifierCount', 10.540760040283203],
        ['register-visibleRatio,hiddenPasswordCount', -22.40015983581543],
        ['register-identifierRatio,fieldsCount', 3.0499682426452637],
        ['register-identifierRatio,identifierCount', 13.237924575805664],
        ['register-identifierRatio,passwordCount', -42.066734313964844],
        ['register-identifierRatio,hiddenIdentifierCount', -27.38094139099121],
        ['register-identifierRatio,hiddenPasswordCount', 53.03074645996094],
        ['register-passwordRatio,fieldsCount', -3.9150500297546387],
        ['register-passwordRatio,identifierCount', -44.96310806274414],
        ['register-passwordRatio,passwordCount', -5.020882606506348],
        ['register-passwordRatio,hiddenIdentifierCount', 17.58538818359375],
        ['register-passwordRatio,hiddenPasswordCount', -7.014605522155762],
        ['register-requiredRatio,fieldsCount', -22.95560073852539],
        ['register-requiredRatio,identifierCount', 8.303262710571289],
        ['register-requiredRatio,passwordCount', -0.4432651102542877],
        ['register-requiredRatio,hiddenIdentifierCount', 16.790653228759766],
        ['register-requiredRatio,hiddenPasswordCount', -15.800985336303711],
    ],
    bias: -8.148175239562988,
    cutoff: 0.47,
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
        ['email-autocompleteUsername', 1.3010711669921875],
        ['email-autocompleteNickname', 0.2397630512714386],
        ['email-autocompleteEmail', 5.9363203048706055],
        ['email-typeEmail', 14.623346328735352],
        ['email-exactAttrEmail', 12.423860549926758],
        ['email-attrEmail', 2.7740585803985596],
        ['email-textEmail', 14.956676483154297],
        ['email-labelEmail', 16.914844512939453],
        ['email-placeholderEmail', 14.079178810119629],
        ['email-searchField', -24.695171356201172],
    ],
    bias: -9.542814254760742,
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
})(IdentityFieldType || (IdentityFieldType = {}));

const IDENTITY_RE_MAP = [
    [IdentityFieldType.FULLNAME, matchFullName],
    [IdentityFieldType.FIRSTNAME, matchFirstName],
    [IdentityFieldType.MIDDLENAME, matchMiddleName],
    [IdentityFieldType.LASTNAME, matchLastName],
    [IdentityFieldType.TELEPHONE, matchTelephone],
    [IdentityFieldType.ORGANIZATION, matchOrganization],
    [IdentityFieldType.CITY, matchCity],
    [IdentityFieldType.ZIPCODE, matchZipCode],
    [IdentityFieldType.STATE, matchState],
    [IdentityFieldType.COUNTRY, matchCountry],
    [IdentityFieldType.ADDRESS, matchAddress],
];

const IDENTITY_ATTRIBUTES = ['autocomplete', 'name', 'id', 'data-bhw'];

const IDENTITY_INPUT_TYPES = ['tel', 'phone', 'text'];

const getIdentityHaystack = (input) => {
    const attrs = IDENTITY_ATTRIBUTES.map((attr) => {
        var _a;
        return (_a = input === null || input === void 0 ? void 0 : input.getAttribute(attr)) !== null && _a !== void 0
            ? _a
            : '';
    });
    return normalizeString(attrs.join(' ').trim(), '\\s\\[\\]');
};

const getIdentityFieldType = (input) => {
    var _a;
    const haystack = getIdentityHaystack(input);
    if (haystack)
        return (_a = IDENTITY_RE_MAP.find(([, test]) => test(haystack))) === null || _a === void 0 ? void 0 : _a[0];
};

const maybeIdentity = (fnode) => {
    const input = fnode.element;
    const { visible, isFormLogin, type, searchField } = fnode.noteFor('field');
    if ((type && !IDENTITY_INPUT_TYPES.includes(type)) || !visible || isFormLogin) return false;
    const identityType = getIdentityFieldType(input);
    if (!identityType) return false;
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

const results$4 = {
    coeffs: [
        ['otp-mfaScore', 27.801471710205078],
        ['otp-exotic', -7.225522041320801],
        ['otp-linkOTPOutlier', -17.82804298400879],
        ['otp-hasCheckboxes', 7.586564064025879],
        ['otp-hidden', 0.0926704853773117],
        ['otp-required', 0.9689319133758545],
        ['otp-nameMatch', -12.026124000549316],
        ['otp-idMatch', 12.027419090270996],
        ['otp-numericMode', -3.470228910446167],
        ['otp-autofocused', 7.771951675415039],
        ['otp-tabIndex1', -1.5056225061416626],
        ['otp-patternOTP', 6.579691410064697],
        ['otp-maxLength1', 5.62439489364624],
        ['otp-maxLength5', -9.165372848510742],
        ['otp-minLength6', 15.93896198272705],
        ['otp-maxLength6', 4.75616979598999],
        ['otp-maxLength20', 3.273038148880005],
        ['otp-autocompleteOTC', 0.010084405541419983],
        ['otp-autocompleteOff', -2.9675991535186768],
        ['otp-prevAligned', 2.0712616443634033],
        ['otp-prevArea', 1.7136894464492798],
        ['otp-nextAligned', 4.685334205627441],
        ['otp-nextArea', 4.0909223556518555],
        ['otp-attrMFA', 7.098365306854248],
        ['otp-attrOTP', 1.4986152648925781],
        ['otp-attrOutlier', -8.369575500488281],
        ['otp-textMFA', 15.66826343536377],
        ['otp-textOTP', -7.556553840637207],
        ['otp-labelMFA', -0.15074123442173004],
        ['otp-labelOTP', 0.08076591789722443],
        ['otp-labelOutlier', -7.108526229858398],
        ['otp-wrapperOTP', 17.562965393066406],
        ['otp-wrapperOutlier', -6.335973262786865],
        ['otp-emailOutlierCount', -8.449010848999023],
    ],
    bias: -17.979284286499023,
    cutoff: 0.89,
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

const results$3 = {
    coeffs: [
        ['pw-loginScore', 12.692801475524902],
        ['pw-registerScore', -13.743254661560059],
        ['pw-pwChangeScore', 2.516014575958252],
        ['pw-exotic', -10.625862121582031],
        ['pw-autocompleteNew', -3.356137752532959],
        ['pw-autocompleteCurrent', 0.41784560680389404],
        ['pw-autocompleteOff', -6.262856483459473],
        ['pw-isOnlyPassword', 5.325244903564453],
        ['pw-prevPwField', 4.517149925231934],
        ['pw-nextPwField', -6.7799601554870605],
        ['pw-attrCreate', -4.870419502258301],
        ['pw-attrCurrent', 3.1165902614593506],
        ['pw-attrConfirm', -7.358043193817139],
        ['pw-attrReset', -0.13531184196472168],
        ['pw-textCreate', -2.596417188644409],
        ['pw-textCurrent', 1.0926729440689087],
        ['pw-textConfirm', -7.670884132385254],
        ['pw-textReset', -0.08061716705560684],
        ['pw-labelCreate', -8.034831047058105],
        ['pw-labelCurrent', 13.475791931152344],
        ['pw-labelConfirm', -7.543102264404297],
        ['pw-labelReset', 0.0918993204832077],
        ['pw-prevPwCreate', -10.426894187927246],
        ['pw-prevPwCurrent', -13.147254943847656],
        ['pw-prevPwConfirm', -0.06187788397073746],
        ['pw-passwordOutlier', -7.713562965393066],
        ['pw-nextPwCreate', 14.062833786010742],
        ['pw-nextPwCurrent', -8.510058403015137],
        ['pw-nextPwConfirm', -7.776278495788574],
    ],
    bias: -4.447115421295166,
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
        ['pw[new]-loginScore', -11.44463062286377],
        ['pw[new]-registerScore', 13.341517448425293],
        ['pw[new]-pwChangeScore', 0.8249163031578064],
        ['pw[new]-exotic', 15.69024658203125],
        ['pw[new]-autocompleteNew', 1.3794221878051758],
        ['pw[new]-autocompleteCurrent', -0.5467641353607178],
        ['pw[new]-autocompleteOff', -1.18061101436615],
        ['pw[new]-isOnlyPassword', -1.9589954614639282],
        ['pw[new]-prevPwField', 0.9262195825576782],
        ['pw[new]-nextPwField', 9.346853256225586],
        ['pw[new]-attrCreate', 3.450976610183716],
        ['pw[new]-attrCurrent', 1.7111785411834717],
        ['pw[new]-attrConfirm', 11.95771598815918],
        ['pw[new]-attrReset', 0.09810145199298859],
        ['pw[new]-textCreate', 1.6225882768630981],
        ['pw[new]-textCurrent', -1.342786192893982],
        ['pw[new]-textConfirm', -15.664695739746094],
        ['pw[new]-textReset', 0.01156558096408844],
        ['pw[new]-labelCreate', 8.246070861816406],
        ['pw[new]-labelCurrent', -13.446549415588379],
        ['pw[new]-labelConfirm', 7.47966194152832],
        ['pw[new]-labelReset', 0.07621918618679047],
        ['pw[new]-prevPwCreate', 10.899398803710938],
        ['pw[new]-prevPwCurrent', 9.758150100708008],
        ['pw[new]-prevPwConfirm', 0.004900753498077393],
        ['pw[new]-passwordOutlier', -28.610471725463867],
        ['pw[new]-nextPwCreate', -12.107089042663574],
        ['pw[new]-nextPwCurrent', 8.703057289123535],
        ['pw[new]-nextPwConfirm', 9.675223350524902],
    ],
    bias: -3.186096429824829,
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
        ['username-autocompleteUsername', 9.14881706237793],
        ['username-autocompleteNickname', 0.12120005488395691],
        ['username-autocompleteEmail', -6.628194332122803],
        ['username-autocompleteOff', -0.6594879627227783],
        ['username-attrUsername', 18.630767822265625],
        ['username-textUsername', 16.62067413330078],
        ['username-labelUsername', 18.29641342163086],
        ['username-outlierUsername', -0.33795449137687683],
        ['username-loginUsername', 19.033706665039062],
        ['username-searchField', -14.165491104125977],
    ],
    bias: -9.952821731567383,
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
        ['username[hidden]-exotic', -13.26710319519043],
        ['username[hidden]-attrUsername', 15.689900398254395],
        ['username[hidden]-attrEmail', 10.133879661560059],
        ['username[hidden]-usernameAttr', 11.028885841369629],
        ['username[hidden]-autocompleteUsername', 3.3853890895843506],
        ['username[hidden]-visibleReadonly', 7.252275466918945],
        ['username[hidden]-hiddenEmailValue', 17.31014633178711],
        ['username[hidden]-hiddenTelValue', 9.448697090148926],
        ['username[hidden]-hiddenUsernameValue', 0.4952724277973175],
    ],
    bias: -21.339887619018555,
    cutoff: 0.49,
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
