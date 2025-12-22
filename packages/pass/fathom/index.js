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
    'input[type="button"]',
    'input[type="image"][alt]',
    'button[id*="password" i]',
    'button[type="submit"]',
    'button[type="button"]',
    'button[name="submit"]',
    'a[role="submit"]',
    'div[role="button"]',
    'div[role="submit"]',
].join(',');

const kLayoutSelector = `div, section, aside, main, nav`;

const kAnchorLinkSelector = `a, [role="link"], span[role="button"]`;

const formCandidateSelector = `form, [${FORM_CLUSTER_ATTR}]`;

const inputCandidateSelector =
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="checkbox"])';

const buttonSelector = `button:not([type]), a[role="button"], ${kButtonSubmitSelector}`;

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

const matchSibling$1 = (el, match) => {
    const prevEl = el.previousElementSibling;
    if (prevEl === null) return null;
    if (match(prevEl)) return prevEl;
    return matchSibling$1(prevEl, match);
};

const matchNonEmptySibling = (el) =>
    matchSibling$1(el, (el) => el instanceof HTMLElement && el.innerText.trim().length > 0);

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
    return els
        .map((input) => findStackedParent(input, cache, maxIterations))
        .filter((el) => Boolean(el && el !== document.body));
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

const OTP_PATTERNS = ['[0-9]{6}', '[0-9]{1}', '[0-9]*', 'd{6}', 'd{6}*', 'd{1}', '/d{6}', '/d{6}*', '/d{1}'];

const VALID_INPUT_TYPES = ['text', 'email', 'number', 'tel', 'password', 'hidden', 'search'];

const LOGIN_RE =
    /a(?:uthenti(?:fizierungs|cate)|nmeld(?:ung|en))|(?:(?:n(?:ouvelleses|uevase|ewses)s|iniciarses|connex)io|anmeldedate|inlogge|sign[io])n|in(?:iciarsessao|troduce)|(?:authentifie|introduci|conecta|entr[ae])r|s(?:econnect|identifi)er|novasessao|prihlasit|connect|acceder|login/i;

const REGISTER_RE =
    /kontoerstellen|cr(?:ea(?:teaccount|rcuenta)|iarconta)|(?:nouveaucompt|creeruncompt|s?inscrir|unirs)e|re(?:gist(?:r(?:ieren|arse|ar)|er)|joindre)|nuevacuenta|getstarted|neueskonto|newaccount|novaconta|(?:com(?:mence|eca)|(?:empez|junt)a)r|signup|join/i;

const RECOVERY_RE =
    /(?:wiederherstell|zurucksetz)en|re(?:(?:initialis|stablec)er|s(?:tor(?:ing|e)|et)|(?:defini|staur[ae])r|c(?:uper[ae]|ove)r)|problem|(?:troubl|aid)e|a[jy]uda|h(?:ilfe|elp)/i;

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

const SEARCH_ACTION_RE = /recherche|buscar|s(?:earch|uche)|query|find/i;

const CURRENT_VALUE_RE =
    /(?:be(?:stehend|for)|vorherig|aktuell)e|exist(?:ente|ing)|pre(?:cedent|vious)|a(?:n(?:t(?:erior|igo)|cien)|ctu[ae]l|tual)|existant|dernier|current|(?:ultim|viej)o|(?:letz|al)te|last|old/i;

const HIDDEN_ATTR_RE = /s(?:creenreade)?ronly|(?:move)?offscreen|(?:displaynon|a11yhid)e|\b((?:is)?hidden)\b/i;

const OAUTH_ATTR_RE = /facebook|twitch|google|apple/i;

const TOS_RE =
    /(?:datenschutzrichtlini|politicadeprivacidad|confidentialit|a(?:cknowledg|gre))e|nutzungsbedingungen|(?:consentimi?ent|ac(?:ue|o)rd)o|(?:einwillig|zustimm)ung|consentement|condi(?:cione|tion)s|term(?:osdeuso|inos|sof)|(?:privacida|understan)d|guideline|consent|p(?:riva|oli)cy|accord/i;

const TWO_FA_RE =
    /(?:doublefacteu|(?:doblefac|zweifak|twofac)to)r|verifica(?:c(?:ion|ao)|tion)|multifa(?:ct(?:eu|o)|k?to)r|(?:securitycod|doubleetap|authcod)e|zweischritte|dois(?:fatore|passo)s|doblepaso|2(?:s(?:chritte|tep)|(?:etap[ae]|paso)s|fa)|twostep/i;

const TWO_FA_ATTR_RE =
    /(?:authentication|approvals|email|login)code|phoneverification|challenge|t(?:wo(?:fa(?:ctor)?|step)|facode)|2fa|\b([mt]fa)\b/i;

const AUTHENTICATOR_ATTR_RE =
    /a(?:pplicationdauthentification|ut(?:henti(?:(?:fiz|s)ierungsapp|cat(?:ionapp|or)|fi(?:cateu|kato)r)|enticador))|genera(?:torapp|dora)/i;

const OTP_ATTR_RE = /totp(?:pin)?|o(?:netime|t[cp])|1time/i;

const OTP_OUTLIER_RE =
    /n(?:(?:ue|o)vocodigo|ouveaucode|e(?:usenden|(?:uer|w)code))|re(?:enviar|send)|envoyer|senden|enviar|send/i;

const OTP_OUTLIER_ATTR_RE = /phone|email|tel|sms/i;

const NEWSLETTER_RE = /newsletter|b(?:ul|o)letin|mailing/i;

const NEWSLETTER_ATTR_RE = /subscription|mailinglist|newsletter|emailform/i;

const IDENTITY_FULLNAME_ATTR_RE = /addresscontact|contactperson|addressname|yourname|fullname|\b(name)\b/i;

const IDENTITY_FIRSTNAME_ATTR_RE = /givenname|firstn(?:ame)?|\b(fname)\b/i;

const IDENTITY_MIDDLENAME_ATTR_RE = /additionalname|middlen(?:ame)?|\b(mname)\b/i;

const IDENTITY_LASTNAME_ATTR_RE = /familyn(?:ame)?|lastn(?:ame)?|surname|\b([ls]name)\b/i;

const IDENTITY_TELEPHONE_ATTR_RE = /(?:national|contact)number|(?:tele)?phone|mobile|\b(tel(?:national|local)?)\b/i;

const IDENTITY_TELEPHONE_OUTLIER_ATTR_RE = /extension|security|co(?:untry|de)|prefix/i;

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

const CC_CVC_ATTR_RE = /c(?:ard(?:verification|code)|cv|sc|v[cv])|payments?code|\b(ccc(?:ode|vv|sc))\b/i;

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

const matchTwoFa = orRe([TWO_FA_RE, TWO_FA_ATTR_RE]);

const matchOtpAttr = test(OTP_ATTR_RE);

const matchOtpOutlier = test(OTP_OUTLIER_ATTR_RE);

const matchOtpOutlierAction = test(OTP_OUTLIER_RE);

const matchAuthenticator = test(AUTHENTICATOR_ATTR_RE);

const matchMFAAttr = test(TWO_FA_ATTR_RE);

const matchMFA = orRe([TWO_FA_RE, TWO_FA_ATTR_RE, OTP_ATTR_RE]);

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

const normalizeString = (str, allowedChars = '') =>
    str
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(new RegExp(`[^a-zA-Z0-9${allowedChars}]`, 'g'), '');

const sanitizeString = (str) => normalizeString(str, '\\[\\]');

const sanitizeStringWithSpaces = (str) => normalizeString(str, '\\s\\[\\]');

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

const TEXT_ATTRIBUTES = [
    'title',
    'aria-label',
    'aria-labelledby',
    'aria-describedby',
    'placeholder',
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
    if (field instanceof HTMLInputElement && ['checkbox', 'submit', 'button', 'image'].includes(field.type)) {
        if (field.value) fieldAttrs.push(sanitizeString(field.value));
        if (field.type === 'image' && field.alt) fieldAttrs.push(sanitizeString(field.alt));
    }
    const haystacks = [fieldText, labelText, ...fieldAttrs];
    const autocomplete = field.getAttribute('autocomplete');
    if (autocomplete) haystacks.push(sanitizeString(autocomplete));
    return haystacks;
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
    const type = field.getAttribute('type');
    if (field.tagName === 'INPUT' && type && !CC_INPUT_TYPES.includes(type)) return;
    const haystack = getCCHaystack(field);
    const autocompletes = getAutocompletes(field);
    if (haystack) {
        const ccType = CC_MATCHERS.find(([, test]) => test(field, autocompletes, haystack))?.[0];
        if (ccType) setCachedSubType(field, ccType);
        return ccType;
    }
};

const matchCCFieldCandidate = (input, { visible }) => {
    if (getCachedCCSubtype(input)) return true;
    if (!visible) return false;
    const ccType = getCCFieldType(input);
    if (ccType) setCachedSubType(input, ccType);
    return ccType !== undefined;
};

const isCCInputField = (fnode) => {
    const { isCC, visible } = fnode.noteFor('field');
    if (!visible) return false;
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

const maybeOTP = and(fInput(['text', 'number', 'tel']), fActive, not(fList));

const maybeUsername = and(
    not(fList),
    or(and(not(fMode('email')), fInput(['text', 'tel'])), fMatch(kUsernameSelector)),
    fActive
);

const maybeHiddenUsername = and(not(fList), fInput(['email', 'text', 'hidden']), not(fActive));

const isUsernameCandidate = (el) =>
    el.type === 'text' || (el.type === 'tel' && any(matchUsername)(getAllFieldHaystacks(el)));

const isEmailCandidate = (el) =>
    el.type === 'email' || (el.type === 'text' && any(matchEmail)(getAllFieldHaystacks(el)));

const isOAuthCandidate = (el) => any(matchOAuth)(getAllFieldHaystacks(el));

const isMFACandidate = (el) => ['text', 'number', 'tel'].includes(el.type);

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

const guard = (options, predicate) => (field, autocompletes, haystack) => {
    if (!options.number && field.getAttribute('type') === 'number') return false;
    if (options.autocompletes.some((match) => autocompletes.includes(match))) return true;
    return predicate(haystack);
};

const IDENTITY_MATCHERS = [
    [
        IdentityFieldType.FIRSTNAME,
        guard(
            {
                autocompletes: ['given-name'],
            },
            matchFirstName
        ),
    ],
    [
        IdentityFieldType.MIDDLENAME,
        guard(
            {
                autocompletes: ['additional-name'],
            },
            matchMiddleName
        ),
    ],
    [
        IdentityFieldType.LASTNAME,
        guard(
            {
                autocompletes: ['family-name'],
            },
            matchLastName
        ),
    ],
    [
        IdentityFieldType.FULLNAME,
        guard(
            {
                autocompletes: ['name'],
            },
            matchFullName
        ),
    ],
    [
        IdentityFieldType.TELEPHONE,
        guard(
            {
                autocompletes: ['tel', 'tel-national', 'tel-local'],
                number: true,
            },
            matchTelephone
        ),
    ],
    [
        IdentityFieldType.ORGANIZATION,
        guard(
            {
                autocompletes: ['organization'],
            },
            matchOrganization
        ),
    ],
    [
        IdentityFieldType.CITY,
        guard(
            {
                autocompletes: ['address-level2'],
            },
            matchCity
        ),
    ],
    [
        IdentityFieldType.ZIPCODE,
        guard(
            {
                autocompletes: ['postal-code'],
                number: true,
            },
            matchZipCode
        ),
    ],
    [
        IdentityFieldType.STATE,
        guard(
            {
                autocompletes: ['address-level1'],
            },
            matchState
        ),
    ],
    [
        IdentityFieldType.COUNTRY,
        guard(
            {
                autocompletes: ['country-name'],
            },
            matchCountry
        ),
    ],
    [
        IdentityFieldType.ADDRESS,
        guard(
            {
                autocompletes: ['street-address', 'address-line1'],
            },
            matchAddress
        ),
    ],
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
    if (getCachedSubType(input) !== undefined) return;
    const type = input.getAttribute('type');
    if (type && !IDENTITY_INPUT_TYPES.includes(type)) return;
    if (input.getAttribute('autocomplete')?.includes('email')) return;
    const haystack = getIdentityHaystack(input);
    const autocompletes = getAutocompletes(input);
    if (haystack) {
        const identityType = IDENTITY_MATCHERS.find(([, test]) => test(input, autocompletes, haystack))?.[0];
        if (identityType) setCachedSubType(input, identityType);
        return identityType;
    }
};

const isAutocompleteListInput = (el) => el.getAttribute('aria-autocomplete') === 'list' || el.role === 'combobox';

const matchIdentityField = (input, { visible }) => {
    if (!visible) return false;
    if (getCachedIdentitySubType(input)) return true;
    const identityType = getIdentityFieldType(input);
    if (!identityType) return false;
    setCachedSubType(input, identityType);
    return true;
};

const isIdentity = (fnode) => {
    const input = fnode.element;
    const { isIdentity, isCC, searchField, isFormLogin, isFormRecovery, visible } = fnode.noteFor('field');
    if (!visible) return false;
    if (isCC || !isIdentity) return false;
    const identityType = getIdentityFieldType(input);
    if (!identityType) return false;
    const outlierForm = isFormLogin || isFormRecovery;
    if (outlierForm) return false;
    if (isAutocompleteListInput(input))
        return [IdentityFieldType.ADDRESS, IdentityFieldType.ZIPCODE].includes(identityType);
    if (searchField)
        return [IdentityFieldType.ADDRESS, IdentityFieldType.ZIPCODE, IdentityFieldType.CITY].includes(identityType);
    return true;
};

const { linearScale: linearScale$1 } = utils;

const getFormFeatures = (fnode) => {
    const form = fnode.element;
    const parent = getFormParent(form);
    const doc = form.ownerDocument;
    const totalFormNodes = form.querySelectorAll('*').length;
    const fields = Array.from(form.querySelectorAll(kFieldSelector));
    const visibleFields = fields.filter(isVisibleField);
    const inputs = fields.filter((el) => el.type !== 'submit' && el.type !== 'button');
    const hidden = fields.filter((el) => el.type === 'hidden');
    const visibleInputs = visibleFields.filter((el) => el.type !== 'submit' && el.type !== 'button');
    const fieldsets = form.querySelectorAll('fieldset');
    const textareas = fields.filter((el) => el.tagName === 'TEXTAREA');
    const selects = fields.filter((el, i, arr) => el.tagName === 'SELECT' && arr?.[i + 1]?.type !== 'tel');
    const texts = inputs.filter((el) => el.type === 'text');
    const tels = inputs.filter((el) => el.type === 'tel');
    const readOnly = inputs.filter((el) => el.readOnly);
    const radios = inputs.filter((el) => el.type === 'radio');
    const checkboxes = inputs.filter((el) => el.type === 'checkbox');
    const numbers = inputs.filter((el) => el.type === 'number');
    const dates = inputs.filter((el) => el.type === 'date');
    const files = inputs.filter((el) => el.type === 'file');
    const ccInputs = inputs.filter(getCCFieldType);
    const ccSelects = selects.filter(getCCFieldType);
    const ccs = ccInputs.concat(ccSelects);
    const identities = inputs.filter((el) => getIdentityFieldType(el) !== undefined);
    const required = visibleInputs.filter((el) => el.required || el.ariaRequired);
    const disabled = visibleInputs.filter((el) => el.disabled || el.ariaDisabled);
    const autofocused = visibleInputs.find((el) => el.matches('input[autofocus]:first-of-type'));
    const usernames = inputs.filter(isUsernameCandidate);
    const emails = inputs.filter(isEmailCandidate);
    const identifiers = uniqueNodes(usernames, emails);
    const [visibleIdentifiers, hiddenIdentifiers] = splitFieldsByVisibility(identifiers);
    const passwords = inputs.filter((el) => el.matches(kPasswordSelector));
    const [visiblePasswords, hiddenPasswords] = splitFieldsByVisibility(passwords);
    const mfaInputs = inputs.filter(isMFACandidate);
    const captchas = parent.querySelectorAll(kCaptchaSelector);
    const socialEls = Array.from(parent.querySelectorAll(kSocialSelector));
    const submits = visibleFields.filter((el) => el.type === 'submit');
    const btns = Array.from(form.querySelectorAll(buttonSelector)).filter(isVisibleEl);
    const btnsTypeSubmit = btns.filter((el) => el.matches('[type="submit"]'));
    const candidateBtns = btns.filter(isBtnCandidate);
    const submitBtns = btnsTypeSubmit.length > 0 ? btnsTypeSubmit : candidateBtns;
    const anchors = Array.from(form.querySelectorAll(kAnchorLinkSelector)).filter(isVisibleEl);
    const oauths = socialEls.concat(candidateBtns).filter(isOAuthCandidate);
    const layouts = Array.from(form.querySelectorAll(kLayoutSelector));
    const autofocusedIsIdentifier = Boolean(autofocused && visibleIdentifiers.includes(autofocused));
    const autofocusedIsPassword = Boolean(autofocused && visiblePasswords.includes(autofocused));
    const pageDescriptionText = getPageDescriptionText(doc);
    const nearestHeadingsText = getNearestHeadingsText(form);
    const formTextAttrText = getFormText(form);
    const formAttributes = getFormAttributes(form);
    const pwHaystack = passwords.flatMap(getAllFieldHaystacks);
    const identifierHaystack = visibleIdentifiers.flatMap(getAllFieldHaystacks);
    const btnHaystack = candidateBtns.flatMap(getAllFieldHaystacks);
    const submitBtnHaystack = submitBtns.flatMap(getAllFieldHaystacks);
    const checkboxesHaystack = checkboxes.flatMap(getAllFieldHaystacks);
    const anchorsHaystack = anchors.flatMap(getAllNodeHaystacks);
    const mfaInputsHaystack = mfaInputs.flatMap(getAllFieldHaystacks);
    const layoutHaystack = layouts.map(getNodeAttributes);
    const formTextHaystack = [formTextAttrText, nearestHeadingsText];
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
    const buttonMultiStep = any(matchStepAction)(submitBtnHaystack);
    const headingsMultiStep = matchMultiStep(nearestHeadingsText);
    const pageMultiAuth = pageLogin && pageRegister;
    const submitMultiAuth = submitRegister && (submitLogin || buttonMultiStep);
    const headingsMultiAuth = headingsLogin && headingsRegister;
    const multiAuth = pageMultiAuth || headingsMultiAuth || submitMultiAuth;
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
    const inputsMFA =
        mfaInputs.some(({ autocomplete }) => autocomplete.includes('one-time-code')) ||
        any(matchMFA)(mfaInputsHaystack);
    const formAttrsMFA = any(matchMFA)(formAttributes);
    const formTextMFA = any(matchMFA)(formTextHaystack);
    const maybeMFA = inputsMFA || formAttrsMFA || formTextMFA;
    const haystackMFA = [...formTextHaystack, maybeMFA ? sanitizeString(form.innerText) : ''];
    const formTextAuthenticator = any(matchAuthenticator)(haystackMFA);
    const formOTPOutlier = any(matchOtpOutlier)(formAttributes);
    const linkOTPOutlier = any(matchOtpOutlierAction)(anchorsHaystack.concat(btnHaystack));
    const newsletterForm = any(matchNewsletter)(formTextHaystack);
    const searchForm = any(matchSearchAction)(formTextHaystack);
    return {
        formComplexity: linearScale$1(totalFormNodes, 0, 200),
        fieldsCount: linearScale$1(visibleFields.length, 1, 5),
        visibleInputsCount: linearScale$1(visibleInputs.length, 1, 5),
        inputCount: linearScale$1(visibleInputs.length, 1, 5),
        fieldsetCount: linearScale$1(fieldsets.length, 1, 5),
        textCount: linearScale$1(texts.length, 0, 3),
        readOnlyCount: linearScale$1(readOnly.length, 0, 3),
        textareaCount: linearScale$1(textareas.length, 0, 2),
        selectCount: linearScale$1(selects.length, 0, 5),
        disabledCount: linearScale$1(disabled.length, 0, 5),
        checkboxCount: linearScale$1(checkboxes.length, 0, 2),
        radioCount: linearScale$1(radios.length, 0, 5),
        identifierCount: linearScale$1(visibleIdentifiers.length, 0, 3),
        hiddenIdentifierCount: linearScale$1(hiddenIdentifiers.length, 0, 2),
        hiddenCount: linearScale$1(hidden.length, 0, 5),
        passwordCount: linearScale$1(visiblePasswords.length, 0, 2),
        hiddenPasswordCount: linearScale$1(hiddenPasswords.length, 0, 2),
        usernameCount: linearScale$1(usernames.length, 0, 2),
        emailCount: linearScale$1(emails.length, 0, 2),
        submitCount: linearScale$1(submits.length, 0, 2),
        identitiesCount: linearScale$1(identities.length, 0, 5),
        ccsCount: linearScale$1(ccs.length, 0, 5),
        hasTels: boolInt(tels.length > 0),
        hasOAuth: boolInt(oauths.length > 0),
        hasCaptchas: boolInt(captchas.length > 0),
        hasFiles: boolInt(files.length > 0),
        hasDate: boolInt(dates.length > 0),
        hasNumber: boolInt(numbers.length > 0),
        oneVisibleField: boolInt(visibleInputs.length === 1),
        twoVisibleFields: boolInt(visibleInputs.length === 2),
        threeOrMoreVisibleFields: boolInt(visibleInputs.length >= 3),
        noPasswords: boolInt(visiblePasswords.length === 0),
        onePassword: boolInt(visiblePasswords.length === 1),
        twoPasswords: boolInt(visiblePasswords.length === 2),
        threeOrMorePasswords: boolInt(visiblePasswords.length >= 3),
        noIdentifiers: boolInt(visibleIdentifiers.length === 0),
        oneIdentifier: boolInt(visibleIdentifiers.length === 1),
        twoIdentifiers: boolInt(visibleIdentifiers.length === 2),
        threeOrMoreIdentifiers: boolInt(visibleIdentifiers.length >= 3),
        autofocusedIsIdentifier: boolInt(autofocusedIsIdentifier),
        autofocusedIsPassword: boolInt(autofocusedIsPassword),
        inputRatio: safeInt(inputs.length / fields.length),
        hiddenRatio: safeInt(hidden.length / fields.length),
        visibleRatio: safeInt(visibleInputs.length / fields.length),
        checkboxRatio: safeInt(checkboxes.length / fields.length),
        emailRatio: safeInt(emails.length / fields.length),
        usernameRatio: safeInt(usernames.length / fields.length),
        hiddenIdentifierRatio: safeInt(hiddenIdentifiers.length / identifiers.length),
        hiddenPasswordRatio: safeInt(hiddenPasswords.length / passwords.length),
        identifierRatio: safeInt(visibleIdentifiers.length / visibleFields.length),
        passwordRatio: safeInt(visiblePasswords.length / visibleFields.length),
        requiredRatio: safeInt(required.length / visibleFields.length),
        disabledRatio: safeInt(disabled.length / visibleFields.length),
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
        formAttrsMFA: boolInt(formAttrsMFA),
        formTextMFA: boolInt(formTextMFA),
        formTextAuthenticator: boolInt(formTextAuthenticator),
        formOTPOutlier: boolInt(formOTPOutlier),
        linkOTPOutlier: boolInt(linkOTPOutlier),
        inputsMFA: boolInt(inputsMFA),
        newsletterForm: boolInt(newsletterForm),
        searchForm: boolInt(searchForm),
        multiStepForm: boolInt(buttonMultiStep || headingsMultiStep),
        multiAuthForm: boolInt(multiAuth),
        formInputIterator: createInputIterator(form),
        formInputMFACandidates: visibleInputs.filter(isMFACandidate).length,
    };
};

const FORM_FEATURES = [
    'fieldsCount',
    'inputCount',
    'fieldsetCount',
    'textCount',
    'textareaCount',
    'selectCount',
    'disabledCount',
    'radioCount',
    'readOnlyCount',
    'formComplexity',
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
    'disabledRatio',
    'requiredRatio',
    'checkboxRatio',
    'hiddenIdentifierRatio',
    'hiddenPasswordRatio',
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
    'newsletterForm',
    'searchForm',
    'multiStepForm',
    'multiAuthForm',
];

const FORM_COMBINED_FEATURES = [
    ...FORM_FEATURES,
    ...combineFeatures(['multiStepForm'], ['multiAuthForm']),
    ...combineFeatures(
        ['visibleRatio', 'identifierRatio', 'passwordRatio', 'requiredRatio'],
        [
            'fieldsCount',
            'identifierCount',
            'passwordCount',
            'hiddenIdentifierCount',
            'hiddenPasswordCount',
            'multiAuthForm',
            'multiStepForm',
        ]
    ),
];

const results$9 = {
    coeffs: [
        ['login-fieldsCount', 1.018117904663086],
        ['login-inputCount', 1.7718555927276611],
        ['login-fieldsetCount', -6.487659454345703],
        ['login-textCount', -3.5920305252075195],
        ['login-textareaCount', -2.8182342052459717],
        ['login-selectCount', -3.607691526412964],
        ['login-disabledCount', -0.0008242593612521887],
        ['login-radioCount', -6.684926986694336],
        ['login-readOnlyCount', -8.825933456420898],
        ['login-formComplexity', -3.8538451194763184],
        ['login-identifierCount', -2.1888020038604736],
        ['login-hiddenIdentifierCount', 3.7680184841156006],
        ['login-usernameCount', -0.14058835804462433],
        ['login-emailCount', -3.6718244552612305],
        ['login-hiddenCount', 0.040218617767095566],
        ['login-hiddenPasswordCount', 4.378489971160889],
        ['login-submitCount', -5.844139575958252],
        ['login-identitiesCount', -0.20205265283584595],
        ['login-ccsCount', -11.548981666564941],
        ['login-hasTels', -3.8603334426879883],
        ['login-hasOAuth', -0.9585119485855103],
        ['login-hasCaptchas', 1.7869961261749268],
        ['login-hasFiles', -0.002990779234096408],
        ['login-hasDate', -3.7137162685394287],
        ['login-hasNumber', -3.6213345527648926],
        ['login-oneVisibleField', 1.5439428091049194],
        ['login-twoVisibleFields', 0.8317422866821289],
        ['login-threeOrMoreVisibleFields', 0.7022089958190918],
        ['login-noPasswords', -5.676028251647949],
        ['login-onePassword', 6.8386030197143555],
        ['login-twoPasswords', -0.11925540864467621],
        ['login-threeOrMorePasswords', -2.7585551738739014],
        ['login-noIdentifiers', -1.4107745885849],
        ['login-oneIdentifier', 1.5820586681365967],
        ['login-twoIdentifiers', 3.4404823780059814],
        ['login-threeOrMoreIdentifiers', -5.685195446014404],
        ['login-autofocusedIsIdentifier', 2.5347883701324463],
        ['login-autofocusedIsPassword', 3.4201254844665527],
        ['login-visibleRatio', -0.447469562292099],
        ['login-inputRatio', -2.9749209880828857],
        ['login-hiddenRatio', 3.3771233558654785],
        ['login-identifierRatio', -2.358664035797119],
        ['login-emailRatio', 10.873825073242188],
        ['login-usernameRatio', -0.5827963948249817],
        ['login-passwordRatio', 3.76566219329834],
        ['login-disabledRatio', -0.0007832525297999382],
        ['login-requiredRatio', 0.1666329801082611],
        ['login-checkboxRatio', -4.812844753265381],
        ['login-hiddenIdentifierRatio', 1.5728591680526733],
        ['login-hiddenPasswordRatio', 6.258411407470703],
        ['login-pageLogin', 2.3840909004211426],
        ['login-formTextLogin', 0.00196160189807415],
        ['login-formAttrsLogin', 6.482576370239258],
        ['login-headingsLogin', 7.931510925292969],
        ['login-layoutLogin', 0.19357158243656158],
        ['login-rememberMeCheckbox', 3.064460039138794],
        ['login-troubleLink', 6.2202348709106445],
        ['login-submitLogin', 6.586820602416992],
        ['login-pageRegister', -8.095833778381348],
        ['login-formTextRegister', 10741501682787202e-21],
        ['login-formAttrsRegister', -7.808027267456055],
        ['login-headingsRegister', -3.084425449371338],
        ['login-layoutRegister', 1.1704902648925781],
        ['login-pwNewRegister', -12.01138687133789],
        ['login-pwConfirmRegister', -6.320530414581299],
        ['login-submitRegister', -10.106426239013672],
        ['login-TOSRef', -3.0918915271759033],
        ['login-pagePwReset', -0.5213345289230347],
        ['login-formTextPwReset', -1.171150803565979],
        ['login-formAttrsPwReset', -6.0577263832092285],
        ['login-headingsPwReset', -4.81113862991333],
        ['login-layoutPwReset', -5.390263080596924],
        ['login-pageRecovery', -2.256166934967041],
        ['login-formTextRecovery', -44464977690950036e-21],
        ['login-formAttrsRecovery', -6.7262725830078125],
        ['login-headingsRecovery', -3.338550567626953],
        ['login-layoutRecovery', 1.981346607208252],
        ['login-identifierRecovery', 2.1970551013946533],
        ['login-submitRecovery', -6.2272138595581055],
        ['login-formTextMFA', -6.2167463302612305],
        ['login-formAttrsMFA', -10.792183876037598],
        ['login-inputsMFA', -9.68181037902832],
        ['login-newsletterForm', -2.5677106380462646],
        ['login-searchForm', -5.462152004241943],
        ['login-multiStepForm', 4.169710636138916],
        ['login-multiAuthForm', -2.1826272010803223],
        ['login-multiStepForm,multiAuthForm', 5.470261096954346],
        ['login-visibleRatio,fieldsCount', -2.709787130355835],
        ['login-visibleRatio,identifierCount', -4.7464776039123535],
        ['login-visibleRatio,passwordCount', -0.5070370435714722],
        ['login-visibleRatio,hiddenIdentifierCount', -5.051673412322998],
        ['login-visibleRatio,hiddenPasswordCount', -2.73610520362854],
        ['login-visibleRatio,multiAuthForm', 5.418653964996338],
        ['login-visibleRatio,multiStepForm', 6.594353199005127],
        ['login-identifierRatio,fieldsCount', -3.2764317989349365],
        ['login-identifierRatio,identifierCount', -4.19841194152832],
        ['login-identifierRatio,passwordCount', 2.092566967010498],
        ['login-identifierRatio,hiddenIdentifierCount', -0.7675188183784485],
        ['login-identifierRatio,hiddenPasswordCount', 6.392715930938721],
        ['login-identifierRatio,multiAuthForm', 7.455354690551758],
        ['login-identifierRatio,multiStepForm', -4.009252548217773],
        ['login-passwordRatio,fieldsCount', 3.5075340270996094],
        ['login-passwordRatio,identifierCount', 2.551999807357788],
        ['login-passwordRatio,passwordCount', 0.8075377941131592],
        ['login-passwordRatio,hiddenIdentifierCount', -5.5676493644714355],
        ['login-passwordRatio,hiddenPasswordCount', 0.9441205263137817],
        ['login-passwordRatio,multiAuthForm', -6.696941375732422],
        ['login-passwordRatio,multiStepForm', -16.629919052124023],
        ['login-requiredRatio,fieldsCount', 0.24308118224143982],
        ['login-requiredRatio,identifierCount', 1.5473575592041016],
        ['login-requiredRatio,passwordCount', 2.4822769165039062],
        ['login-requiredRatio,hiddenIdentifierCount', 9.90633487701416],
        ['login-requiredRatio,hiddenPasswordCount', 1.8696608543395996],
        ['login-requiredRatio,multiAuthForm', -0.750661313533783],
        ['login-requiredRatio,multiStepForm', 0.30350571870803833],
    ],
    bias: -0.5382336378097534,
    cutoff: 0.48,
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
        ['pw-change-fieldsCount', -0.26027342677116394],
        ['pw-change-inputCount', -0.4492555558681488],
        ['pw-change-fieldsetCount', -0.06383157521486282],
        ['pw-change-textCount', -1.4313958883285522],
        ['pw-change-textareaCount', -0.5285633206367493],
        ['pw-change-selectCount', -0.2874351739883423],
        ['pw-change-disabledCount', -0.018360106274485588],
        ['pw-change-radioCount', -1.343268871307373],
        ['pw-change-readOnlyCount', -2.038224935531616],
        ['pw-change-formComplexity', -0.3138674795627594],
        ['pw-change-identifierCount', -1.2888816595077515],
        ['pw-change-hiddenIdentifierCount', -1.3672007322311401],
        ['pw-change-usernameCount', -1.4967730045318604],
        ['pw-change-emailCount', -1.3578351736068726],
        ['pw-change-hiddenCount', 0.012647774070501328],
        ['pw-change-hiddenPasswordCount', -0.6803222894668579],
        ['pw-change-submitCount', -0.10663312673568726],
        ['pw-change-identitiesCount', -0.6234142184257507],
        ['pw-change-ccsCount', -0.5516045093536377],
        ['pw-change-hasTels', -1.344333529472351],
        ['pw-change-hasOAuth', -1.0788803100585938],
        ['pw-change-hasCaptchas', -1.124695062637329],
        ['pw-change-hasFiles', -0.0018575943540781736],
        ['pw-change-hasDate', -1766326022334397e-20],
        ['pw-change-hasNumber', -0.5058954954147339],
        ['pw-change-oneVisibleField', -1.477413296699524],
        ['pw-change-twoVisibleFields', -0.7930230498313904],
        ['pw-change-threeOrMoreVisibleFields', -0.04250534623861313],
        ['pw-change-noPasswords', -2.1910898685455322],
        ['pw-change-onePassword', -1.1586971282958984],
        ['pw-change-twoPasswords', 0.47174838185310364],
        ['pw-change-threeOrMorePasswords', 3.707749605178833],
        ['pw-change-noIdentifiers', 0.3264518976211548],
        ['pw-change-oneIdentifier', -1.5952644348144531],
        ['pw-change-twoIdentifiers', -1.1923794746398926],
        ['pw-change-threeOrMoreIdentifiers', -0.5102677941322327],
        ['pw-change-autofocusedIsIdentifier', -1.0848277807235718],
        ['pw-change-autofocusedIsPassword', -1.1996885538101196],
        ['pw-change-visibleRatio', -1.7696903944015503],
        ['pw-change-inputRatio', -1.2957053184509277],
        ['pw-change-hiddenRatio', 1.1404364109039307],
        ['pw-change-identifierRatio', -1.1944633722305298],
        ['pw-change-emailRatio', -1.1930755376815796],
        ['pw-change-usernameRatio', -1.132077932357788],
        ['pw-change-passwordRatio', 1.9514074325561523],
        ['pw-change-disabledRatio', -0.015319935977458954],
        ['pw-change-requiredRatio', 0.10241687297821045],
        ['pw-change-checkboxRatio', 0.1646302193403244],
        ['pw-change-hiddenIdentifierRatio', -1.7862927913665771],
        ['pw-change-hiddenPasswordRatio', -0.6207957863807678],
        ['pw-change-pageLogin', -1.7516788244247437],
        ['pw-change-formTextLogin', -0.00045848844456486404],
        ['pw-change-formAttrsLogin', -1.0516058206558228],
        ['pw-change-headingsLogin', -1.1907693147659302],
        ['pw-change-layoutLogin', -1.3445430994033813],
        ['pw-change-rememberMeCheckbox', -0.45166540145874023],
        ['pw-change-troubleLink', -0.7100878357887268],
        ['pw-change-submitLogin', -1.6416423320770264],
        ['pw-change-pageRegister', -0.33563944697380066],
        ['pw-change-formTextRegister', 9271060951524736e-51],
        ['pw-change-formAttrsRegister', -3.538865089416504],
        ['pw-change-headingsRegister', -4.643648624420166],
        ['pw-change-layoutRegister', -0.4230736494064331],
        ['pw-change-pwNewRegister', 6.613471984863281],
        ['pw-change-pwConfirmRegister', 0.2992869019508362],
        ['pw-change-submitRegister', -2.377074718475342],
        ['pw-change-TOSRef', -0.10705839097499847],
        ['pw-change-pagePwReset', 0.6355201601982117],
        ['pw-change-formTextPwReset', 0.10346164554357529],
        ['pw-change-formAttrsPwReset', 3.079180955886841],
        ['pw-change-headingsPwReset', 1.4228099584579468],
        ['pw-change-layoutPwReset', 3.9965505599975586],
        ['pw-change-pageRecovery', -1.1023145914077759],
        ['pw-change-formTextRecovery', 7757168350508437e-20],
        ['pw-change-formAttrsRecovery', -0.548882782459259],
        ['pw-change-headingsRecovery', -0.08311524987220764],
        ['pw-change-layoutRecovery', -0.3033178150653839],
        ['pw-change-identifierRecovery', -0.270799845457077],
        ['pw-change-submitRecovery', 1.997855305671692],
        ['pw-change-formTextMFA', -0.43621617555618286],
        ['pw-change-formAttrsMFA', -0.4170246124267578],
        ['pw-change-inputsMFA', -0.5913174748420715],
        ['pw-change-newsletterForm', -0.024804268032312393],
        ['pw-change-searchForm', -0.9229120016098022],
        ['pw-change-multiStepForm', -0.99010169506073],
        ['pw-change-multiAuthForm', -0.5847487449645996],
        ['pw-change-multiStepForm,multiAuthForm', -0.17719526588916779],
        ['pw-change-visibleRatio,fieldsCount', -0.6591340899467468],
        ['pw-change-visibleRatio,identifierCount', -1.186571478843689],
        ['pw-change-visibleRatio,passwordCount', -0.1843302994966507],
        ['pw-change-visibleRatio,hiddenIdentifierCount', -0.2661915421485901],
        ['pw-change-visibleRatio,hiddenPasswordCount', -0.3676096498966217],
        ['pw-change-visibleRatio,multiAuthForm', -0.319909006357193],
        ['pw-change-visibleRatio,multiStepForm', -2.373054265975952],
        ['pw-change-identifierRatio,fieldsCount', -1.0348827838897705],
        ['pw-change-identifierRatio,identifierCount', -1.0166667699813843],
        ['pw-change-identifierRatio,passwordCount', -1.7469804286956787],
        ['pw-change-identifierRatio,hiddenIdentifierCount', -0.2600400447845459],
        ['pw-change-identifierRatio,hiddenPasswordCount', -0.5987887978553772],
        ['pw-change-identifierRatio,multiAuthForm', -0.26234835386276245],
        ['pw-change-identifierRatio,multiStepForm', -0.7785730957984924],
        ['pw-change-passwordRatio,fieldsCount', 1.7410577535629272],
        ['pw-change-passwordRatio,identifierCount', -1.4412450790405273],
        ['pw-change-passwordRatio,passwordCount', 2.5525221824645996],
        ['pw-change-passwordRatio,hiddenIdentifierCount', -1.5636085271835327],
        ['pw-change-passwordRatio,hiddenPasswordCount', -0.20776860415935516],
        ['pw-change-passwordRatio,multiAuthForm', -0.27892374992370605],
        ['pw-change-passwordRatio,multiStepForm', -0.24894165992736816],
        ['pw-change-requiredRatio,fieldsCount', -0.6502535343170166],
        ['pw-change-requiredRatio,identifierCount', -1.3029768466949463],
        ['pw-change-requiredRatio,passwordCount', 1.0247066020965576],
        ['pw-change-requiredRatio,hiddenIdentifierCount', -1.086370825767517],
        ['pw-change-requiredRatio,hiddenPasswordCount', -1.0665967464447021],
        ['pw-change-requiredRatio,multiAuthForm', -0.253971129655838],
        ['pw-change-requiredRatio,multiStepForm', -0.22397710382938385],
    ],
    bias: -1.3285932540893555,
    cutoff: 0.5,
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
        ['recovery-fieldsCount', 2.8375425338745117],
        ['recovery-inputCount', 0.1327071487903595],
        ['recovery-fieldsetCount', 3.9914095401763916],
        ['recovery-textCount', -0.4347997307777405],
        ['recovery-textareaCount', -6.49044132232666],
        ['recovery-selectCount', -3.6482303142547607],
        ['recovery-disabledCount', -0.07144230604171753],
        ['recovery-radioCount', -1.8179969787597656],
        ['recovery-readOnlyCount', 4.511733531951904],
        ['recovery-formComplexity', -7.414092063903809],
        ['recovery-identifierCount', -1.195213794708252],
        ['recovery-hiddenIdentifierCount', -2.6664905548095703],
        ['recovery-usernameCount', 1.4655022621154785],
        ['recovery-emailCount', -0.733805775642395],
        ['recovery-hiddenCount', 4.805906772613525],
        ['recovery-hiddenPasswordCount', -3.080047130584717],
        ['recovery-submitCount', 1.3421392440795898],
        ['recovery-identitiesCount', -2.0721685886383057],
        ['recovery-ccsCount', -0.373230516910553],
        ['recovery-hasTels', 1.265797734260559],
        ['recovery-hasOAuth', -2.2082533836364746],
        ['recovery-hasCaptchas', 8.534005165100098],
        ['recovery-hasFiles', -15.649928092956543],
        ['recovery-hasDate', -65925519265874755e-22],
        ['recovery-hasNumber', -0.4316057860851288],
        ['recovery-oneVisibleField', 0.1420067399740219],
        ['recovery-twoVisibleFields', -4.073230266571045],
        ['recovery-threeOrMoreVisibleFields', -2.966002941131592],
        ['recovery-noPasswords', 0.017947480082511902],
        ['recovery-onePassword', -5.003787040710449],
        ['recovery-twoPasswords', -3.9866151809692383],
        ['recovery-threeOrMorePasswords', -0.11119990795850754],
        ['recovery-noIdentifiers', -6.513677597045898],
        ['recovery-oneIdentifier', -1.009055495262146],
        ['recovery-twoIdentifiers', 2.2223992347717285],
        ['recovery-threeOrMoreIdentifiers', -2.517796516418457],
        ['recovery-autofocusedIsIdentifier', 0.37653154134750366],
        ['recovery-autofocusedIsPassword', -0.002295720623806119],
        ['recovery-visibleRatio', -0.8009147047996521],
        ['recovery-inputRatio', -2.2086808681488037],
        ['recovery-hiddenRatio', -0.7438650727272034],
        ['recovery-identifierRatio', -3.546476125717163],
        ['recovery-emailRatio', 7.253906726837158],
        ['recovery-usernameRatio', 1.620846152305603],
        ['recovery-passwordRatio', -3.7857062816619873],
        ['recovery-disabledRatio', -0.07141514122486115],
        ['recovery-requiredRatio', -0.17786180973052979],
        ['recovery-checkboxRatio', -12.399775505065918],
        ['recovery-hiddenIdentifierRatio', 0.6142230033874512],
        ['recovery-hiddenPasswordRatio', -5.450758934020996],
        ['recovery-pageLogin', 1.2853741645812988],
        ['recovery-formTextLogin', -0.00011183011520188302],
        ['recovery-formAttrsLogin', 2.076139211654663],
        ['recovery-headingsLogin', -1.7891746759414673],
        ['recovery-layoutLogin', -0.7969958782196045],
        ['recovery-rememberMeCheckbox', -1.086012840270996],
        ['recovery-troubleLink', 5.917763710021973],
        ['recovery-submitLogin', -4.036303520202637],
        ['recovery-pageRegister', -3.7371087074279785],
        ['recovery-formTextRegister', 9455485999359953e-51],
        ['recovery-formAttrsRegister', -2.6773102283477783],
        ['recovery-headingsRegister', -1.7391204833984375],
        ['recovery-layoutRegister', -13.524322509765625],
        ['recovery-pwNewRegister', -1.5437729358673096],
        ['recovery-pwConfirmRegister', -1.5416641235351562],
        ['recovery-submitRegister', -1.1475197076797485],
        ['recovery-TOSRef', -7.119327545166016],
        ['recovery-pagePwReset', -2.61859393119812],
        ['recovery-formTextPwReset', -30457720640697517e-21],
        ['recovery-formAttrsPwReset', 2.019908905029297],
        ['recovery-headingsPwReset', 3.8846561908721924],
        ['recovery-layoutPwReset', 0.01872592233121395],
        ['recovery-pageRecovery', 5.211184501647949],
        ['recovery-formTextRecovery', 7317833634848788e-48],
        ['recovery-formAttrsRecovery', 4.897640228271484],
        ['recovery-headingsRecovery', 5.6893510818481445],
        ['recovery-layoutRecovery', 2.553457736968994],
        ['recovery-identifierRecovery', 6.503427982330322],
        ['recovery-submitRecovery', 8.020503997802734],
        ['recovery-formTextMFA', 0.9458398818969727],
        ['recovery-formAttrsMFA', 4.875588893890381],
        ['recovery-inputsMFA', -2.809818983078003],
        ['recovery-newsletterForm', -5.062570571899414],
        ['recovery-searchForm', 5.4537458419799805],
        ['recovery-multiStepForm', -2.091846227645874],
        ['recovery-multiAuthForm', -2.2197396755218506],
        ['recovery-multiStepForm,multiAuthForm', -0.4046580195426941],
        ['recovery-visibleRatio,fieldsCount', -0.24970267713069916],
        ['recovery-visibleRatio,identifierCount', -0.7617948651313782],
        ['recovery-visibleRatio,passwordCount', -3.2201647758483887],
        ['recovery-visibleRatio,hiddenIdentifierCount', 1.1625330448150635],
        ['recovery-visibleRatio,hiddenPasswordCount', -0.443440318107605],
        ['recovery-visibleRatio,multiAuthForm', -2.2020816802978516],
        ['recovery-visibleRatio,multiStepForm', -2.5853991508483887],
        ['recovery-identifierRatio,fieldsCount', 4.830996513366699],
        ['recovery-identifierRatio,identifierCount', -3.549208402633667],
        ['recovery-identifierRatio,passwordCount', -4.828864574432373],
        ['recovery-identifierRatio,hiddenIdentifierCount', 4.381162643432617],
        ['recovery-identifierRatio,hiddenPasswordCount', -2.4356255531311035],
        ['recovery-identifierRatio,multiAuthForm', -2.510219097137451],
        ['recovery-identifierRatio,multiStepForm', 5.336896896362305],
        ['recovery-passwordRatio,fieldsCount', -3.1217713356018066],
        ['recovery-passwordRatio,identifierCount', -3.8226630687713623],
        ['recovery-passwordRatio,passwordCount', -3.3562068939208984],
        ['recovery-passwordRatio,hiddenIdentifierCount', -0.6137896776199341],
        ['recovery-passwordRatio,hiddenPasswordCount', -8772830187808722e-20],
        ['recovery-passwordRatio,multiAuthForm', -0.0949353277683258],
        ['recovery-passwordRatio,multiStepForm', -0.48628753423690796],
        ['recovery-requiredRatio,fieldsCount', -3.1199774742126465],
        ['recovery-requiredRatio,identifierCount', 0.1216466873884201],
        ['recovery-requiredRatio,passwordCount', -1.6183136701583862],
        ['recovery-requiredRatio,hiddenIdentifierCount', -7.877969264984131],
        ['recovery-requiredRatio,hiddenPasswordCount', -0.00017149611085187644],
        ['recovery-requiredRatio,multiAuthForm', -0.06555581092834473],
        ['recovery-requiredRatio,multiStepForm', -1.8079707622528076],
    ],
    bias: -2.569481611251831,
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
        ['register-fieldsCount', -1.0650367736816406],
        ['register-inputCount', 1.7057973146438599],
        ['register-fieldsetCount', 10.55478572845459],
        ['register-textCount', 0.5298559069633484],
        ['register-textareaCount', 4.722599983215332],
        ['register-selectCount', -0.5343102216720581],
        ['register-disabledCount', -7.0904998779296875],
        ['register-radioCount', -6.554409503936768],
        ['register-readOnlyCount', -5.965941429138184],
        ['register-formComplexity', 2.681462287902832],
        ['register-identifierCount', 2.3164491653442383],
        ['register-hiddenIdentifierCount', -2.6162750720977783],
        ['register-usernameCount', 0.8164033889770508],
        ['register-emailCount', 4.612791538238525],
        ['register-hiddenCount', -8.588794708251953],
        ['register-hiddenPasswordCount', 2.364164352416992],
        ['register-submitCount', -1.9502243995666504],
        ['register-identitiesCount', -3.0076541900634766],
        ['register-ccsCount', -17.235885620117188],
        ['register-hasTels', 5.083794593811035],
        ['register-hasOAuth', -0.7846394181251526],
        ['register-hasCaptchas', 3.417311906814575],
        ['register-hasFiles', -5.751555442810059],
        ['register-hasDate', -0.3839975595474243],
        ['register-hasNumber', 7.364004611968994],
        ['register-oneVisibleField', 1.0578135251998901],
        ['register-twoVisibleFields', -1.5007697343826294],
        ['register-threeOrMoreVisibleFields', -0.007174446247518063],
        ['register-noPasswords', -5.4552459716796875],
        ['register-onePassword', 2.3803114891052246],
        ['register-twoPasswords', 4.902575492858887],
        ['register-threeOrMorePasswords', -1.309951901435852],
        ['register-noIdentifiers', -4.031947135925293],
        ['register-oneIdentifier', -5.116861343383789],
        ['register-twoIdentifiers', 4.154171466827393],
        ['register-threeOrMoreIdentifiers', 5.718852519989014],
        ['register-autofocusedIsIdentifier', -0.7697725296020508],
        ['register-autofocusedIsPassword', 8.444619178771973],
        ['register-visibleRatio', 0.5069371461868286],
        ['register-inputRatio', -2.364858388900757],
        ['register-hiddenRatio', 2.9058709144592285],
        ['register-identifierRatio', 1.9187195301055908],
        ['register-emailRatio', 5.7801361083984375],
        ['register-usernameRatio', -2.1388771533966064],
        ['register-passwordRatio', -6.77587890625],
        ['register-disabledRatio', -5.308221817016602],
        ['register-requiredRatio', -2.573425769805908],
        ['register-checkboxRatio', 1.7648563385009766],
        ['register-hiddenIdentifierRatio', -7.94013786315918],
        ['register-hiddenPasswordRatio', 4.627239227294922],
        ['register-pageLogin', -5.597177505493164],
        ['register-formTextLogin', -380469919036841e-20],
        ['register-formAttrsLogin', -2.818323850631714],
        ['register-headingsLogin', -6.141330718994141],
        ['register-layoutLogin', 5.128269672393799],
        ['register-rememberMeCheckbox', -7.404647350311279],
        ['register-troubleLink', -6.220352649688721],
        ['register-submitLogin', -4.7127685546875],
        ['register-pageRegister', 8.14059066772461],
        ['register-formTextRegister', -0.0070677753537893295],
        ['register-formAttrsRegister', 5.685670375823975],
        ['register-headingsRegister', 4.587322235107422],
        ['register-layoutRegister', -0.502397894859314],
        ['register-pwNewRegister', 3.6587440967559814],
        ['register-pwConfirmRegister', 5.933305740356445],
        ['register-submitRegister', 11.558342933654785],
        ['register-TOSRef', 3.642091751098633],
        ['register-pagePwReset', -2.243114948272705],
        ['register-formTextPwReset', -0.012718121521174908],
        ['register-formAttrsPwReset', -0.753327488899231],
        ['register-headingsPwReset', 0.8907217979431152],
        ['register-layoutPwReset', -3.981414794921875],
        ['register-pageRecovery', -2.116898536682129],
        ['register-formTextRecovery', -0.00017760500486474484],
        ['register-formAttrsRecovery', -2.129504442214966],
        ['register-headingsRecovery', -4.41943359375],
        ['register-layoutRecovery', 0.7583357691764832],
        ['register-identifierRecovery', 1.107278823852539],
        ['register-submitRecovery', -9.659065246582031],
        ['register-formTextMFA', -5.137617111206055],
        ['register-formAttrsMFA', -3.1819400787353516],
        ['register-inputsMFA', -7.864587783813477],
        ['register-newsletterForm', -15.947498321533203],
        ['register-searchForm', -5.882834434509277],
        ['register-multiStepForm', 3.630645513534546],
        ['register-multiAuthForm', 9.146126747131348],
        ['register-multiStepForm,multiAuthForm', 0.9807196259498596],
        ['register-visibleRatio,fieldsCount', -2.6864171028137207],
        ['register-visibleRatio,identifierCount', -3.811335802078247],
        ['register-visibleRatio,passwordCount', -2.9786288738250732],
        ['register-visibleRatio,hiddenIdentifierCount', -1.658880591392517],
        ['register-visibleRatio,hiddenPasswordCount', -3.4114766120910645],
        ['register-visibleRatio,multiAuthForm', -7.746770858764648],
        ['register-visibleRatio,multiStepForm', 7.459476470947266],
        ['register-identifierRatio,fieldsCount', -1.3486801385879517],
        ['register-identifierRatio,identifierCount', 0.008785733953118324],
        ['register-identifierRatio,passwordCount', 5.710526466369629],
        ['register-identifierRatio,hiddenIdentifierCount', 4.980058193206787],
        ['register-identifierRatio,hiddenPasswordCount', -3.533578634262085],
        ['register-identifierRatio,multiAuthForm', 3.801100969314575],
        ['register-identifierRatio,multiStepForm', -4.883025169372559],
        ['register-passwordRatio,fieldsCount', 3.602515697479248],
        ['register-passwordRatio,identifierCount', 1.8351035118103027],
        ['register-passwordRatio,passwordCount', -5.180178165435791],
        ['register-passwordRatio,hiddenIdentifierCount', 9.58162784576416],
        ['register-passwordRatio,hiddenPasswordCount', -2.21854305267334],
        ['register-passwordRatio,multiAuthForm', -8.55333423614502],
        ['register-passwordRatio,multiStepForm', 0.560626208782196],
        ['register-requiredRatio,fieldsCount', -2.3865625858306885],
        ['register-requiredRatio,identifierCount', -2.769646406173706],
        ['register-requiredRatio,passwordCount', 3.0756046772003174],
        ['register-requiredRatio,hiddenIdentifierCount', 4.833860874176025],
        ['register-requiredRatio,hiddenPasswordCount', -1.074190378189087],
        ['register-requiredRatio,multiAuthForm', -6.237618923187256],
        ['register-requiredRatio,multiStepForm', 4.408092975616455],
    ],
    bias: -2.151292085647583,
    cutoff: 0.5,
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
    const autocomplete = fieldFeatures.autocomplete;
    const typeEmail = fieldFeatures.type === 'email';
    const exactAttrEmail = field.matches(kEmailSelector);
    const mfaAttrs = autocomplete === 'one-time-code' || any(matchMFAAttr)(fieldAttrs);
    const attrEmail = any(matchEmailAttr)(fieldAttrs);
    const textEmail = matchEmail(fieldText);
    const labelEmail = matchEmail(labelText);
    const placeholder = field.placeholder;
    const placeholderEmailValue = any(matchEmailValue)(placeholder.split(' '));
    const placeholderEmail = placeholderEmailValue || matchEmail(sanitizeString(field.placeholder));
    return {
        autocompleteEmail: boolInt(autocomplete?.includes('email') ?? false),
        autocompleteOff: boolInt(autocomplete === 'false' || autocomplete === 'off'),
        typeEmail: boolInt(typeEmail),
        exactAttrEmail: boolInt(exactAttrEmail),
        attrEmail: boolInt(attrEmail),
        textEmail: boolInt(textEmail),
        labelEmail: boolInt(labelEmail),
        placeholderEmail: boolInt(placeholderEmail),
        searchField: boolInt(fieldFeatures.searchField),
        mfaOutlier: boolInt(mfaAttrs),
    };
};

const EMAIL_FEATURES = [
    'autocompleteEmail',
    'autocompleteOff',
    'typeEmail',
    'exactAttrEmail',
    'attrEmail',
    'textEmail',
    'labelEmail',
    'placeholderEmail',
    'searchField',
    'mfaOutlier',
];

const results$5 = {
    coeffs: [
        ['email-isCC', -2.2503116130828857],
        ['email-isIdentity', -4.40352201461792],
        ['email-autocompleteEmail', 3.438072681427002],
        ['email-autocompleteOff', -1.1053673028945923],
        ['email-typeEmail', 9.658430099487305],
        ['email-exactAttrEmail', 8.017308235168457],
        ['email-attrEmail', 2.106839895248413],
        ['email-textEmail', 4.871976375579834],
        ['email-labelEmail', 11.948665618896484],
        ['email-placeholderEmail', 7.2583231925964355],
        ['email-searchField', -8.232460975646973],
        ['email-mfaOutlier', -9.522475242614746],
    ],
    bias: -6.517799377441406,
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

const { linearScale } = utils;

const matchSibling = (sibling, match) => {
    if (!sibling) return false;
    if (sibling?.getAttribute('type') !== match.type) return false;
    const maxLength = sibling.getAttribute('maxlength');
    if (maxLength && parseInt(maxLength, 10) > 1) return false;
    const minLength = sibling.getAttribute('minlength');
    if (minLength && parseInt(minLength) > 1) return false;
    const { top, bottom, width, area } = getNodeRect(sibling);
    if (width >= 100) return false;
    const topMatch = Math.abs(match.rect.top - top) <= 2;
    const bottomMatch = Math.abs(match.rect.bottom - bottom) <= 2;
    const aligned = topMatch && bottomMatch;
    if (!aligned) return false;
    const areaMatch = Math.abs(match.rect.area - area) < 16;
    if (!areaMatch) return false;
    return true;
};

const getOTPFieldFeatures = (fnode) => {
    const field = fnode.element;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, prevField, nextField, type, maxLength } = fieldFeatures;
    const form = fieldFeatures?.formFnode?.element;
    const formFeatures = fieldFeatures.formFeatures;
    const formComplexity = formFeatures?.formComplexity ?? 0;
    const formMFA = Boolean(formFeatures?.formMFA);
    const formAuthenticator = Boolean(formFeatures?.formTextAuthenticator);
    const formOTPOutlier = Boolean(formFeatures?.formOTPOutlier);
    const linkOutlier = Boolean(formFeatures?.linkOTPOutlier);
    const formInputMFACandidates = formFeatures?.formInputMFACandidates ?? 0;
    const isNumeric = field.inputMode === 'numeric';
    const patternOTP = !isNumeric && OTP_PATTERNS.some((pattern) => field.pattern?.trim() === pattern);
    const exactNames = ['code', 'token', 'otp', 'otc', 'totp'];
    const nameMatch = exactNames.some((match) => field.name === match);
    const idMatch = exactNames.some((match) => field.id === match);
    const singleInput = formInputMFACandidates === 1;
    const rect = getNodeRect(field);
    const similarBefore = matchSibling(prevField, {
        type,
        rect,
    });
    const similarAfter = matchSibling(nextField, {
        type,
        rect,
    });
    const siblingOfInterest = similarAfter || similarBefore;
    const attrOTP = any(matchOtpAttr)(fieldAttrs);
    const attrMFA = any(matchTwoFa)(fieldAttrs);
    const attrOutlier = any(matchOtpOutlier)(fieldAttrs);
    const textOTP = matchOtpAttr(fieldText);
    const textMFA = matchTwoFa(fieldText);
    const textAuthenticator = matchAuthenticator(fieldText);
    const labelOTP = matchOtpAttr(labelText);
    const labelMFA = matchTwoFa(labelText);
    const labelAuthenticator = matchAuthenticator(labelText);
    const labelOutlier = matchOtpOutlier(labelText);
    const parents = [getNthParent(field)(1), getNthParent(field)(2)];
    const parentAttrs = parents.flatMap(getBaseAttributes);
    const parentOTP = any(matchOtpAttr)(parentAttrs);
    const parentOutlier = any(matchOtpOutlier)(parentAttrs);
    const maxLen = maxLength ? parseInt(maxLength, 10) : null;
    const maxLengthInvalid = Boolean(maxLen && (maxLen > 20 || (maxLen > 1 && maxLen < 5)));
    const maxLength1 = maxLen === 1;
    const maxLength6 = maxLen === 6;
    const mfa = formMFA || labelMFA || textMFA || attrMFA;
    const otp = parentOTP || attrOTP || textOTP || labelOTP;
    const authenticator = formAuthenticator || textAuthenticator || labelAuthenticator;
    const unexpectedInputCount = !formInputMFACandidates || formInputMFACandidates > 6;
    const autocomplete = fieldFeatures.autocomplete;
    const outlierCandidate = (mfa || otp) && !authenticator;
    const emailOutlierCount = outlierCandidate ? ((form?.innerText ?? '').match(/[a-z0-9*._-]@/gi)?.length ?? 0) : 0;
    const autocompleteOff = autocomplete !== undefined && (autocomplete === 'off' || autocomplete === 'false');
    const outlierAutocomplete =
        outlierCandidate && autocomplete !== undefined && !autocompleteOff && !autocomplete?.includes('one-time-code');
    const formOutlier = formOTPOutlier || parentOutlier;
    const fieldOutlier = attrOutlier || labelOutlier;
    const outlier = formOutlier || fieldOutlier;
    return {
        mfa: boolInt(mfa),
        otp: boolInt(otp),
        authenticator: boolInt(authenticator),
        outlier: boolInt(outlier),
        formOutlier: boolInt(formOutlier),
        fieldOutlier: boolInt(fieldOutlier),
        linkOutlier: boolInt(linkOutlier),
        outlierAutocomplete: boolInt(outlierAutocomplete),
        formComplexity,
        emailOutlierCount: linearScale(emailOutlierCount, 0, 2),
        unexpectedInputCount: boolInt(unexpectedInputCount),
        singleInput: boolInt(singleInput),
        nameMatch: boolInt(nameMatch),
        idMatch: boolInt(idMatch),
        numericMode: boolInt(isNumeric),
        patternOTP: boolInt(patternOTP),
        maxLengthInvalid: boolInt(maxLengthInvalid),
        maxLength1: boolInt(maxLength1),
        maxLength6: boolInt(maxLength6),
        autocompleteOTC: boolInt(fieldFeatures.autocomplete?.includes('one-time-code') ?? false),
        siblingOfInterest: boolInt(siblingOfInterest),
        attrOTP: boolInt(attrOTP),
        textOTP: boolInt(textOTP),
        parentOTP: boolInt(parentOTP),
        labelOTP: boolInt(labelOTP),
        formMFA: boolInt(formMFA),
        attrMFA: boolInt(attrMFA),
        textMFA: boolInt(textMFA),
        labelMFA: boolInt(labelMFA),
        formAuthenticator: boolInt(formAuthenticator),
        textAuthenticator: boolInt(textAuthenticator),
        labelAuthenticator: boolInt(labelAuthenticator),
    };
};

const OTP_FEATURES = [
    'numericMode',
    'nameMatch',
    'idMatch',
    'autocompleteOTC',
    'patternOTP',
    'formMFA',
    'formAuthenticator',
    'attrOTP',
    'textOTP',
    'labelOTP',
    'parentOTP',
    'attrMFA',
    'textMFA',
    'labelMFA',
    'textAuthenticator',
    'labelAuthenticator',
    'maxLength1',
    'maxLength6',
    'maxLengthInvalid',
    'siblingOfInterest',
    'unexpectedInputCount',
    'fieldOutlier',
    'linkOutlier',
    'emailOutlierCount',
    'outlierAutocomplete',
    'formComplexity',
    ...combineFeatures(['otp', 'mfa'], ['outlier', 'siblingOfInterest', 'singleInput']),
    ...combineFeatures(['autocompleteOTC'], ['linkOutlier', 'authenticator']),
];

const results$4 = {
    coeffs: [
        ['otp-isCC', -2.30191969871521],
        ['otp-isIdentity', -2.1196911334991455],
        ['otp-numericMode', 2.2305705547332764],
        ['otp-nameMatch', 3.3076398372650146],
        ['otp-idMatch', 3.7377049922943115],
        ['otp-autocompleteOTC', 0.812996506690979],
        ['otp-patternOTP', 1.8108502626419067],
        ['otp-formMFA', 1.4722025394439697],
        ['otp-formAuthenticator', 7.218698501586914],
        ['otp-attrOTP', 2.5398614406585693],
        ['otp-textOTP', -6.352534770965576],
        ['otp-labelOTP', 1.8261444568634033],
        ['otp-parentOTP', 0.1957242637872696],
        ['otp-attrMFA', 5.490118503570557],
        ['otp-textMFA', 4.698081970214844],
        ['otp-labelMFA', 4.869855880737305],
        ['otp-textAuthenticator', 0.0024913907982409],
        ['otp-labelAuthenticator', 0.9076284766197205],
        ['otp-maxLength1', 0.7004688382148743],
        ['otp-maxLength6', 4.748322486877441],
        ['otp-maxLengthInvalid', -6.987112522125244],
        ['otp-siblingOfInterest', 5.100673675537109],
        ['otp-unexpectedInputCount', -1.712404489517212],
        ['otp-fieldOutlier', -4.117466926574707],
        ['otp-linkOutlier', -3.5161314010620117],
        ['otp-emailOutlierCount', -9.714319229125977],
        ['otp-outlierAutocomplete', -9.081758499145508],
        ['otp-formComplexity', -3.7187306880950928],
        ['otp-otp,outlier', 2.194395065307617],
        ['otp-otp,siblingOfInterest', -2.786055564880371],
        ['otp-otp,singleInput', 1.0402398109436035],
        ['otp-mfa,outlier', -4.109365463256836],
        ['otp-mfa,siblingOfInterest', -0.36943596601486206],
        ['otp-mfa,singleInput', 3.2491984367370605],
        ['otp-autocompleteOTC,linkOutlier', -2.303722381591797],
        ['otp-autocompleteOTC,authenticator', 0.46385741233825684],
    ],
    bias: -7.514105319976807,
    cutoff: 0.55,
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

const isAutocompleteCurrentPassword = (value) => value === 'current-password';

const isAutocompleteNewPassword = (value) => value === 'new-password';

const isAutocompleteOTP = (value) => value?.includes('one-time-code') ?? false;

const getPasswordFieldFeatures = (fnode) => {
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, prevField, nextField, isCC, isIdentity } = fieldFeatures;
    const passwordOutlier = any(matchPasswordOutlier)(fieldAttrs.concat(labelText, fieldText));
    const outlier = isCC || isIdentity || passwordOutlier;
    const attrCurrent = any(matchPasswordCurrentAttr)(fieldAttrs);
    const textCurrent = matchPasswordCurrent(fieldText);
    const labelCurrent = matchPasswordCurrent(labelText);
    const current = attrCurrent || textCurrent || labelCurrent;
    const attrCreate = any(matchPasswordCreateAttr)(fieldAttrs);
    const textCreate = matchPasswordCreate(fieldText);
    const labelCreate = matchPasswordCreate(labelText);
    const create = attrCreate || textCreate || labelCreate;
    const attrConfirm = any(matchPasswordConfirmAttr)(fieldAttrs);
    const textConfirm = matchPasswordConfirm(fieldText);
    const labelConfirm = matchPasswordConfirm(labelText);
    const confirm = attrConfirm || textConfirm || labelConfirm;
    const attrReset = any(matchPasswordResetAttr)(fieldAttrs);
    const textReset = matchPasswordReset(fieldText);
    const labelReset = matchPasswordReset(labelText);
    const reset = attrReset || textReset || labelReset;
    const maybeCurrent = current;
    const maybeNew = create || confirm || reset;
    const autocomplete = outlier ? '' : fieldFeatures.autocomplete;
    const autocompleteNew = isAutocompleteNewPassword(autocomplete);
    const autocompleteCurrent = isAutocompleteCurrentPassword(autocomplete);
    const prevPwField = prevField && prevField.getAttribute('type') === 'password' ? prevField : null;
    const nextPwField = nextField && nextField.getAttribute('type') === 'password' ? nextField : null;
    const prevPwHaystack = prevPwField ? getAllFieldHaystacks(prevPwField) : [];
    const nextPwHaystack = nextPwField ? getAllFieldHaystacks(nextPwField) : [];
    const prevAutocomplete = prevPwField?.getAttribute('autocomplete');
    const prevAutocompleteCurrent = isAutocompleteCurrentPassword(prevAutocomplete);
    const prevPwCurrent = prevAutocompleteCurrent || any(matchPasswordCurrent)(prevPwHaystack);
    const prevAutocompleteNew = isAutocompleteNewPassword(prevAutocomplete);
    const prevPwNew = prevAutocompleteNew || any(matchPasswordCreate)(prevPwHaystack);
    const nextAutocomplete = nextPwField?.getAttribute('autocomplete');
    const nextAutocompleteCurrent = isAutocompleteCurrentPassword(nextAutocomplete);
    const nextPwCurrent = nextAutocompleteCurrent || any(matchPasswordCurrent)(nextPwHaystack);
    const nextAutocompleteNew = isAutocompleteNewPassword(nextAutocomplete);
    const nextPwNew = nextAutocompleteNew || any(matchPasswordCreate)(nextPwHaystack);
    const nextPwConfirm = any(matchPasswordConfirm)(nextPwHaystack);
    return {
        loginScore: boolInt(fieldFeatures.isFormLogin),
        registerScore: boolInt(fieldFeatures.isFormRegister),
        exotic: boolInt(fieldFeatures.isFormNoop),
        maybeNew: boolInt(maybeNew),
        maybeCurrent: boolInt(maybeCurrent),
        autocompleteNew: boolInt(autocompleteNew),
        autocompleteCurrent: boolInt(autocompleteCurrent),
        autocompleteOTP: boolInt(isAutocompleteOTP(autocomplete)),
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
        labelCreate: boolInt(labelCreate),
        labelCurrent: boolInt(labelCurrent),
        labelConfirm: boolInt(labelConfirm),
        passwordOutlier: boolInt(passwordOutlier),
        prevPwNew: boolInt(prevPwNew),
        prevPwCurrent: boolInt(prevPwCurrent),
        nextPwNew: boolInt(nextPwNew),
        nextPwCurrent: boolInt(nextPwCurrent),
        nextPwConfirm: boolInt(nextPwConfirm),
    };
};

const PW_FEATURES = [
    'loginScore',
    'registerScore',
    'exotic',
    'passwordOutlier',
    'autocompleteNew',
    'autocompleteCurrent',
    'autocompleteOTP',
    'autocompleteOff',
    'attrCurrent',
    'textCurrent',
    'labelCurrent',
    'attrCreate',
    'textCreate',
    'labelCreate',
    'attrConfirm',
    'textConfirm',
    'labelConfirm',
    'attrReset',
    'prevPwField',
    'prevPwNew',
    'prevPwCurrent',
    'nextPwField',
    'nextPwNew',
    'nextPwCurrent',
    'nextPwConfirm',
    ...combineFeatures(['prevPwCurrent'], ['nextPwNew']),
    ...combineFeatures(['registerScore'], ['maybeCurrent', 'autocompleteCurrent']),
    ...combineFeatures(['loginScore'], ['maybeNew', 'autocompleteNew']),
];

const results$3 = {
    coeffs: [
        ['password-isCC', -1.8684386014938354],
        ['password-isIdentity', 10626320416217036e-51],
        ['password-loginScore', 7.644696235656738],
        ['password-registerScore', -7.5736236572265625],
        ['password-exotic', -4.929818153381348],
        ['password-passwordOutlier', -11.786484718322754],
        ['password-autocompleteNew', -4.324697494506836],
        ['password-autocompleteCurrent', 1.6518876552581787],
        ['password-autocompleteOTP', -1.0869263410568237],
        ['password-autocompleteOff', -0.5586965084075928],
        ['password-attrCurrent', 1.7932977676391602],
        ['password-textCurrent', 0.6454081535339355],
        ['password-labelCurrent', 2.7669215202331543],
        ['password-attrCreate', -0.5847743153572083],
        ['password-textCreate', -5.141083240509033],
        ['password-labelCreate', -4.270532131195068],
        ['password-attrConfirm', -1.9651501178741455],
        ['password-textConfirm', -0.6627205610275269],
        ['password-labelConfirm', -1.3699796199798584],
        ['password-attrReset', 0.09866206347942352],
        ['password-prevPwField', -4.790991306304932],
        ['password-prevPwNew', -2.1211585998535156],
        ['password-prevPwCurrent', -1.6842247247695923],
        ['password-nextPwField', 1.1234595775604248],
        ['password-nextPwNew', 2.2686002254486084],
        ['password-nextPwCurrent', -0.006182204931974411],
        ['password-nextPwConfirm', -6.062623500823975],
        ['password-prevPwCurrent,nextPwNew', -1.832280158996582],
        ['password-registerScore,maybeCurrent', -0.01708921231329441],
        ['password-registerScore,autocompleteCurrent', -1.8847956657409668],
        ['password-loginScore,maybeNew', 2.7504806518554688],
        ['password-loginScore,autocompleteNew', 2.038215160369873],
    ],
    bias: 0.5883221626281738,
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
        ['new-password-isCC', -7.570712566375732],
        ['new-password-isIdentity', -2876152138818489e-51],
        ['new-password-loginScore', -8.056170463562012],
        ['new-password-registerScore', 7.187344074249268],
        ['new-password-exotic', 2.7442126274108887],
        ['new-password-passwordOutlier', -10.300420761108398],
        ['new-password-autocompleteNew', 4.480721473693848],
        ['new-password-autocompleteCurrent', -1.4949651956558228],
        ['new-password-autocompleteOTP', -5.757554054260254],
        ['new-password-autocompleteOff', 0.6828901171684265],
        ['new-password-attrCurrent', -1.7416141033172607],
        ['new-password-textCurrent', -0.6288444399833679],
        ['new-password-labelCurrent', -2.6677451133728027],
        ['new-password-attrCreate', 0.6618608832359314],
        ['new-password-textCreate', 5.413817882537842],
        ['new-password-labelCreate', 4.292505264282227],
        ['new-password-attrConfirm', 1.9693647623062134],
        ['new-password-textConfirm', 0.7029111385345459],
        ['new-password-labelConfirm', 1.4122846126556396],
        ['new-password-attrReset', -0.10354945063591003],
        ['new-password-prevPwField', 5.06577730178833],
        ['new-password-prevPwNew', 2.08777117729187],
        ['new-password-prevPwCurrent', 1.6698031425476074],
        ['new-password-nextPwField', -1.2703737020492554],
        ['new-password-nextPwNew', -2.1762874126434326],
        ['new-password-nextPwCurrent', 0.00873037613928318],
        ['new-password-nextPwConfirm', 6.245798110961914],
        ['new-password-prevPwCurrent,nextPwNew', 1.7518572807312012],
        ['new-password-registerScore,maybeCurrent', 0.025177206844091415],
        ['new-password-registerScore,autocompleteCurrent', 2.026613712310791],
        ['new-password-loginScore,maybeNew', -2.606954574584961],
        ['new-password-loginScore,autocompleteNew', -1.798887014389038],
    ],
    bias: -0.7381335496902466,
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
    const field = fnode.element;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, prevField, isFormLogin } = fieldFeatures;
    const { autocomplete } = fieldFeatures;
    const attrUsername = any(matchUsernameAttr)(fieldAttrs);
    const textUsername = matchUsername(fieldText);
    const labelUsername = matchUsername(labelText);
    const username = attrUsername || textUsername || labelUsername;
    const emailMatch = field.matches(kEmailSelector) || any(matchEmailAttr)(fieldAttrs.concat(fieldText, labelText));
    const outlierAttrs = any(matchUsernameOutlier)(fieldAttrs);
    const outlierText = matchUsernameOutlier(fieldText);
    const outlierLabel = matchUsernameOutlier(labelText);
    const outlierEmail = !username && emailMatch;
    const outlier = outlierAttrs || outlierText || outlierLabel || outlierEmail;
    const autocompleteOff = autocomplete !== undefined && (autocomplete === 'off' || autocomplete === 'false');
    const autocompleteEmail = Boolean(autocomplete?.includes('email'));
    const autocompleteUsername =
        !emailMatch && Boolean(autocomplete?.includes('username') || autocomplete?.includes('nickname'));
    const firstFormField = prevField === null;
    const maybeCandidate = !(outlier || username);
    const firstLoginFormField = isFormLogin && firstFormField && maybeCandidate;
    return {
        autocompleteUsername: boolInt(autocompleteUsername),
        autocompleteEmail: boolInt(autocompleteEmail),
        autocompleteOff: boolInt(autocompleteOff),
        firstLoginFormField: boolInt(firstLoginFormField),
        attrUsername: boolInt(attrUsername),
        textUsername: boolInt(textUsername),
        labelUsername: boolInt(labelUsername),
        outlierText: boolInt(outlierText),
        outlierAttrs: boolInt(outlierAttrs),
        outlierLabel: boolInt(outlierLabel),
        outlierEmail: boolInt(outlierEmail),
        searchField: boolInt(fieldFeatures.searchField),
    };
};

const USERNAME_FEATURES = [
    'autocompleteUsername',
    'autocompleteEmail',
    'autocompleteOff',
    'attrUsername',
    'textUsername',
    'labelUsername',
    'outlierText',
    'outlierAttrs',
    'outlierLabel',
    'outlierEmail',
    'firstLoginFormField',
    'searchField',
];

const results$1 = {
    coeffs: [
        ['username-isCC', -2.7199530601501465],
        ['username-isIdentity', -1.8823344707489014],
        ['username-autocompleteUsername', 1.3982317447662354],
        ['username-autocompleteEmail', -0.07555414736270905],
        ['username-autocompleteOff', -0.6415064334869385],
        ['username-attrUsername', 12.234081268310547],
        ['username-textUsername', 11.328972816467285],
        ['username-labelUsername', 12.192432403564453],
        ['username-outlierText', -1.3153718709945679],
        ['username-outlierAttrs', -1.713882565498352],
        ['username-outlierLabel', -1.0215004682540894],
        ['username-outlierEmail', -3.1119236946105957],
        ['username-firstLoginFormField', 13.09324836730957],
        ['username-searchField', -8.172221183776855],
    ],
    bias: -6.4193949699401855,
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
    const { fieldAttrs, autocomplete, value } = fieldFeatures;
    const typeHidden = field.type === 'hidden';
    const visibleReadonly =
        field.readOnly &&
        !typeHidden &&
        isVisible(field, {
            opacity: true,
        });
    const attrUsername = any(matchUsernameAttr)(fieldAttrs);
    const attrEmail = any(matchEmailAttr)(fieldAttrs);
    const attrMatch = field.matches('[name="username"],[id="username"]');
    const autocompleteUsername = Boolean(autocomplete?.includes('username'));
    const autocompleteEmail = Boolean(autocomplete?.includes('email'));
    const valueCandidate = value.length < 100;
    const valueEmail = valueCandidate && matchEmailValue(value);
    const valueTel = valueCandidate && matchTelValue(value);
    const valueUsername = valueCandidate && matchUsernameValue(value);
    return {
        exotic: boolInt(fieldFeatures.isFormNoop),
        visibleReadonly: boolInt(visibleReadonly),
        attrUsername: boolInt(attrUsername),
        attrEmail: boolInt(attrEmail),
        attrMatch: boolInt(attrMatch),
        autocompleteUsername: boolInt(autocompleteUsername),
        autocompleteEmail: boolInt(autocompleteEmail),
        valueEmail: boolInt(valueEmail),
        valueTel: boolInt(valueTel),
        valueUsername: boolInt(valueUsername),
    };
};

const USERNAME_HIDDEN_FEATURES = [
    'exotic',
    'visibleReadonly',
    'attrUsername',
    'attrEmail',
    'attrMatch',
    'autocompleteUsername',
    'autocompleteEmail',
    'valueEmail',
    'valueTel',
    'valueUsername',
];

const results = {
    coeffs: [
        ['username-hidden-isCC', 7205579480392777e-51],
        ['username-hidden-isIdentity', 50479202823866755e-52],
        ['username-hidden-exotic', -3.305169105529785],
        ['username-hidden-visibleReadonly', 4.2547783851623535],
        ['username-hidden-attrUsername', 8.98094367980957],
        ['username-hidden-attrEmail', 7.179922103881836],
        ['username-hidden-attrMatch', 10.045620918273926],
        ['username-hidden-autocompleteUsername', 1.0515731573104858],
        ['username-hidden-autocompleteEmail', 1.6214662790298462],
        ['username-hidden-valueEmail', 9.709325790405273],
        ['username-hidden-valueTel', 0.09608783572912216],
        ['username-hidden-valueUsername', -0.11185049265623093],
    ],
    bias: -12.388470649719238,
    cutoff: 0.5,
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
    const minLength = field.getAttribute('minlength');
    const maxLength = field.getAttribute('maxlength');
    const pattern = field.pattern;
    const autocomplete = field.getAttribute('autocomplete')?.trim().toLowerCase();
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
    const isCC = matchCCFieldCandidate(field, {
        visible,
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
    const rules = ruleset(aggregation.rules, aggregation.coeffs, aggregation.biases, prepass);
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
    isMFACandidate,
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
    matchCCFieldCandidate,
    matchIdentityField,
    matchPredictedType,
    maybeEmail,
    maybeHiddenUsername,
    maybeOTP,
    maybePassword,
    maybeUsername,
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
