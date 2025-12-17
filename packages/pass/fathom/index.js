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
    /(?:a(?:uthentication|pprovals)|login)code|phoneverification|challenge|t(?:wo(?:fa(?:ctor)?|step)|facode)|2fa|\b([mt]fa)\b/i;

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

const CC_CVC_ATTR_RE = /c(?:ard(?:verification|code)|sc|v[cv])|payments?code|\b(ccc(?:ode|vv|sc))\b/i;

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
    'autocomplete',
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

const FIELD_ATTRIBUTES = [EL_ATTRIBUTES, 'name', 'inputmode', 'autocomplete'].flat();

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
        fieldAttrs.push(sanitizeString(field.value ?? ''));
        if (field.type === 'image') fieldAttrs.push(sanitizeString(field.alt ?? ''));
    }
    return [fieldText, labelText, ...fieldAttrs];
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
    const inputsMFA = any(matchMFA)(mfaInputsHaystack);
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
        ['login-fieldsCount', 1.0315366983413696],
        ['login-inputCount', 2.2443418502807617],
        ['login-fieldsetCount', -5.940262317657471],
        ['login-textCount', -4.098672866821289],
        ['login-textareaCount', -2.63507080078125],
        ['login-selectCount', -3.997073173522949],
        ['login-disabledCount', -0.0002213581174146384],
        ['login-radioCount', -6.028476238250732],
        ['login-readOnlyCount', -8.54644775390625],
        ['login-formComplexity', -4.59691858291626],
        ['login-identifierCount', -2.100998878479004],
        ['login-hiddenIdentifierCount', 3.823209524154663],
        ['login-usernameCount', -0.48530396819114685],
        ['login-emailCount', -3.8355228900909424],
        ['login-hiddenCount', 0.12849611043930054],
        ['login-hiddenPasswordCount', 4.1919121742248535],
        ['login-submitCount', -6.373607635498047],
        ['login-identitiesCount', -0.5627497434616089],
        ['login-ccsCount', -10.801711082458496],
        ['login-hasTels', -3.883608102798462],
        ['login-hasOAuth', -1.5530641078948975],
        ['login-hasCaptchas', 1.5182690620422363],
        ['login-hasFiles', -0.0004941105144098401],
        ['login-hasDate', -3.931785821914673],
        ['login-hasNumber', -4.0091872215271],
        ['login-oneVisibleField', 1.6533088684082031],
        ['login-twoVisibleFields', 1.4596266746520996],
        ['login-threeOrMoreVisibleFields', 0.4703284502029419],
        ['login-noPasswords', -6.2654852867126465],
        ['login-onePassword', 6.758219242095947],
        ['login-twoPasswords', -0.28171464800834656],
        ['login-threeOrMorePasswords', -2.4443037509918213],
        ['login-noIdentifiers', -1.311405897140503],
        ['login-oneIdentifier', 1.7622621059417725],
        ['login-twoIdentifiers', 4.579364776611328],
        ['login-threeOrMoreIdentifiers', -5.46060848236084],
        ['login-autofocusedIsIdentifier', 2.3773984909057617],
        ['login-autofocusedIsPassword', 3.6926441192626953],
        ['login-visibleRatio', -0.47814974188804626],
        ['login-inputRatio', -3.0155539512634277],
        ['login-hiddenRatio', 3.71026611328125],
        ['login-identifierRatio', -2.3122055530548096],
        ['login-emailRatio', 11.130196571350098],
        ['login-usernameRatio', -0.3816312849521637],
        ['login-passwordRatio', 3.8417046070098877],
        ['login-disabledRatio', -0.00021605311485473067],
        ['login-requiredRatio', 0.12148787826299667],
        ['login-checkboxRatio', -4.84311580657959],
        ['login-hiddenIdentifierRatio', 1.5798896551132202],
        ['login-hiddenPasswordRatio', 6.494671821594238],
        ['login-pageLogin', 2.5244526863098145],
        ['login-formTextLogin', 0.0007204171852208674],
        ['login-formAttrsLogin', 6.840320587158203],
        ['login-headingsLogin', 7.698671340942383],
        ['login-layoutLogin', 0.274845689535141],
        ['login-rememberMeCheckbox', 3.4950129985809326],
        ['login-troubleLink', 5.704506874084473],
        ['login-submitLogin', 6.624107360839844],
        ['login-pageRegister', -8.440619468688965],
        ['login-formTextRegister', 7763478684622946e-52],
        ['login-formAttrsRegister', -7.746922492980957],
        ['login-headingsRegister', -3.06477689743042],
        ['login-layoutRegister', 1.1188808679580688],
        ['login-pwNewRegister', -11.747119903564453],
        ['login-pwConfirmRegister', -6.074612140655518],
        ['login-submitRegister', -10.909152030944824],
        ['login-TOSRef', -2.758251905441284],
        ['login-pagePwReset', -0.40267711877822876],
        ['login-formTextPwReset', -1.093780755996704],
        ['login-formAttrsPwReset', -6.342338562011719],
        ['login-headingsPwReset', -4.71176290512085],
        ['login-layoutPwReset', -5.663021087646484],
        ['login-pageRecovery', -2.2605462074279785],
        ['login-formTextRecovery', 36641313311520836e-42],
        ['login-formAttrsRecovery', -6.550895690917969],
        ['login-headingsRecovery', -3.5099730491638184],
        ['login-layoutRecovery', 1.994764804840088],
        ['login-identifierRecovery', 1.8718007802963257],
        ['login-submitRecovery', -6.585773468017578],
        ['login-formTextMFA', -6.334813594818115],
        ['login-formAttrsMFA', -11.198336601257324],
        ['login-inputsMFA', -9.914790153503418],
        ['login-newsletterForm', -2.776252269744873],
        ['login-searchForm', -5.665444374084473],
        ['login-multiStepForm', 4.406084060668945],
        ['login-multiAuthForm', -2.2126193046569824],
        ['login-multiStepForm,multiAuthForm', 5.278975486755371],
        ['login-visibleRatio,fieldsCount', -2.3266165256500244],
        ['login-visibleRatio,identifierCount', -4.552816867828369],
        ['login-visibleRatio,passwordCount', -1.3929193019866943],
        ['login-visibleRatio,hiddenIdentifierCount', -5.0933918952941895],
        ['login-visibleRatio,hiddenPasswordCount', -2.4020514488220215],
        ['login-visibleRatio,multiAuthForm', 5.835314750671387],
        ['login-visibleRatio,multiStepForm', 6.795135498046875],
        ['login-identifierRatio,fieldsCount', -3.501113176345825],
        ['login-identifierRatio,identifierCount', -3.972019910812378],
        ['login-identifierRatio,passwordCount', 1.1749835014343262],
        ['login-identifierRatio,hiddenIdentifierCount', -0.19104424118995667],
        ['login-identifierRatio,hiddenPasswordCount', 6.616318702697754],
        ['login-identifierRatio,multiAuthForm', 7.749387741088867],
        ['login-identifierRatio,multiStepForm', -4.487607955932617],
        ['login-passwordRatio,fieldsCount', 2.940016031265259],
        ['login-passwordRatio,identifierCount', 1.6371586322784424],
        ['login-passwordRatio,passwordCount', 0.8598284721374512],
        ['login-passwordRatio,hiddenIdentifierCount', -5.518997669219971],
        ['login-passwordRatio,hiddenPasswordCount', 1.012338638305664],
        ['login-passwordRatio,multiAuthForm', -6.338136196136475],
        ['login-passwordRatio,multiStepForm', -16.87862777709961],
        ['login-requiredRatio,fieldsCount', 0.8101270794868469],
        ['login-requiredRatio,identifierCount', 1.963679313659668],
        ['login-requiredRatio,passwordCount', 1.930567979812622],
        ['login-requiredRatio,hiddenIdentifierCount', 9.864312171936035],
        ['login-requiredRatio,hiddenPasswordCount', 1.5271258354187012],
        ['login-requiredRatio,multiAuthForm', -0.3343806862831116],
        ['login-requiredRatio,multiStepForm', 0.3415607511997223],
    ],
    bias: -0.3025505840778351,
    cutoff: 0.5,
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
        ['pw-change-fieldsCount', -0.33037492632865906],
        ['pw-change-inputCount', -0.5486482977867126],
        ['pw-change-fieldsetCount', -0.07847180962562561],
        ['pw-change-textCount', -1.4708729982376099],
        ['pw-change-textareaCount', -0.5266065001487732],
        ['pw-change-selectCount', -0.23977628350257874],
        ['pw-change-disabledCount', -0.014357042498886585],
        ['pw-change-radioCount', -1.4246163368225098],
        ['pw-change-readOnlyCount', -1.9985615015029907],
        ['pw-change-formComplexity', -0.38841748237609863],
        ['pw-change-identifierCount', -1.244715690612793],
        ['pw-change-hiddenIdentifierCount', -1.3990709781646729],
        ['pw-change-usernameCount', -1.476394534111023],
        ['pw-change-emailCount', -1.4038249254226685],
        ['pw-change-hiddenCount', 0.025203552097082138],
        ['pw-change-hiddenPasswordCount', -0.7098058462142944],
        ['pw-change-submitCount', -0.12901830673217773],
        ['pw-change-identitiesCount', -0.5330260992050171],
        ['pw-change-ccsCount', -0.5295749306678772],
        ['pw-change-hasTels', -1.2798407077789307],
        ['pw-change-hasOAuth', -1.1343650817871094],
        ['pw-change-hasCaptchas', -1.1780970096588135],
        ['pw-change-hasFiles', -0.0012355971848592162],
        ['pw-change-hasDate', -3950577593059279e-21],
        ['pw-change-hasNumber', -0.47873106598854065],
        ['pw-change-oneVisibleField', -1.4914824962615967],
        ['pw-change-twoVisibleFields', -0.8012714982032776],
        ['pw-change-threeOrMoreVisibleFields', 0.045293159782886505],
        ['pw-change-noPasswords', -2.0669517517089844],
        ['pw-change-onePassword', -1.1028985977172852],
        ['pw-change-twoPasswords', 0.5472759008407593],
        ['pw-change-threeOrMorePasswords', 3.7200276851654053],
        ['pw-change-noIdentifiers', 0.28739848732948303],
        ['pw-change-oneIdentifier', -1.4641344547271729],
        ['pw-change-twoIdentifiers', -1.2317683696746826],
        ['pw-change-threeOrMoreIdentifiers', -0.5233994722366333],
        ['pw-change-autofocusedIsIdentifier', -1.0520247220993042],
        ['pw-change-autofocusedIsPassword', -1.1945900917053223],
        ['pw-change-visibleRatio', -1.8682917356491089],
        ['pw-change-inputRatio', -1.3612773418426514],
        ['pw-change-hiddenRatio', 0.9595761895179749],
        ['pw-change-identifierRatio', -1.1512194871902466],
        ['pw-change-emailRatio', -1.250472903251648],
        ['pw-change-usernameRatio', -1.2680803537368774],
        ['pw-change-passwordRatio', 1.9914418458938599],
        ['pw-change-disabledRatio', -0.011988316662609577],
        ['pw-change-requiredRatio', 0.12254424393177032],
        ['pw-change-checkboxRatio', 0.11637341231107712],
        ['pw-change-hiddenIdentifierRatio', -1.7895539999008179],
        ['pw-change-hiddenPasswordRatio', -0.632520854473114],
        ['pw-change-pageLogin', -1.7154728174209595],
        ['pw-change-formTextLogin', -0.0004721779259853065],
        ['pw-change-formAttrsLogin', -1.0644937753677368],
        ['pw-change-headingsLogin', -1.1410647630691528],
        ['pw-change-layoutLogin', -1.2970855236053467],
        ['pw-change-rememberMeCheckbox', -0.520665168762207],
        ['pw-change-troubleLink', -0.7264947295188904],
        ['pw-change-submitLogin', -1.620949149131775],
        ['pw-change-pageRegister', -0.4012230336666107],
        ['pw-change-formTextRegister', 451512581713343e-46],
        ['pw-change-formAttrsRegister', -3.5858118534088135],
        ['pw-change-headingsRegister', -4.7079362869262695],
        ['pw-change-layoutRegister', -0.4643448293209076],
        ['pw-change-pwNewRegister', 6.630265712738037],
        ['pw-change-pwConfirmRegister', 0.3908381164073944],
        ['pw-change-submitRegister', -2.527045488357544],
        ['pw-change-TOSRef', -0.07679196447134018],
        ['pw-change-pagePwReset', 0.6311456561088562],
        ['pw-change-formTextPwReset', 0.10620181262493134],
        ['pw-change-formAttrsPwReset', 3.038400173187256],
        ['pw-change-headingsPwReset', 1.383502721786499],
        ['pw-change-layoutPwReset', 3.948735237121582],
        ['pw-change-pageRecovery', -1.062125325202942],
        ['pw-change-formTextRecovery', 3931175160687417e-20],
        ['pw-change-formAttrsRecovery', -0.5368513464927673],
        ['pw-change-headingsRecovery', -0.10896953195333481],
        ['pw-change-layoutRecovery', -0.3273376226425171],
        ['pw-change-identifierRecovery', -0.29504841566085815],
        ['pw-change-submitRecovery', 1.9447838068008423],
        ['pw-change-formTextMFA', -0.466462105512619],
        ['pw-change-formAttrsMFA', -0.4566080868244171],
        ['pw-change-inputsMFA', -0.6632344126701355],
        ['pw-change-newsletterForm', -0.02539360150694847],
        ['pw-change-searchForm', -0.9619825482368469],
        ['pw-change-multiStepForm', -0.9683495759963989],
        ['pw-change-multiAuthForm', -0.5428943037986755],
        ['pw-change-multiStepForm,multiAuthForm', -0.14358244836330414],
        ['pw-change-visibleRatio,fieldsCount', -0.6726284027099609],
        ['pw-change-visibleRatio,identifierCount', -1.1287548542022705],
        ['pw-change-visibleRatio,passwordCount', -0.28432896733283997],
        ['pw-change-visibleRatio,hiddenIdentifierCount', -0.23617228865623474],
        ['pw-change-visibleRatio,hiddenPasswordCount', -0.37537258863449097],
        ['pw-change-visibleRatio,multiAuthForm', -0.35715389251708984],
        ['pw-change-visibleRatio,multiStepForm', -2.341797113418579],
        ['pw-change-identifierRatio,fieldsCount', -1.160475254058838],
        ['pw-change-identifierRatio,identifierCount', -1.0375535488128662],
        ['pw-change-identifierRatio,passwordCount', -1.7418946027755737],
        ['pw-change-identifierRatio,hiddenIdentifierCount', -0.28703248500823975],
        ['pw-change-identifierRatio,hiddenPasswordCount', -0.6238526105880737],
        ['pw-change-identifierRatio,multiAuthForm', -0.28280338644981384],
        ['pw-change-identifierRatio,multiStepForm', -0.7799710035324097],
        ['pw-change-passwordRatio,fieldsCount', 1.759880781173706],
        ['pw-change-passwordRatio,identifierCount', -1.4789645671844482],
        ['pw-change-passwordRatio,passwordCount', 2.6439449787139893],
        ['pw-change-passwordRatio,hiddenIdentifierCount', -1.5379067659378052],
        ['pw-change-passwordRatio,hiddenPasswordCount', -0.21341149508953094],
        ['pw-change-passwordRatio,multiAuthForm', -0.25598227977752686],
        ['pw-change-passwordRatio,multiStepForm', -0.21790264546871185],
        ['pw-change-requiredRatio,fieldsCount', -0.6583942174911499],
        ['pw-change-requiredRatio,identifierCount', -1.4012362957000732],
        ['pw-change-requiredRatio,passwordCount', 0.9958769083023071],
        ['pw-change-requiredRatio,hiddenIdentifierCount', -1.0661832094192505],
        ['pw-change-requiredRatio,hiddenPasswordCount', -1.0926737785339355],
        ['pw-change-requiredRatio,multiAuthForm', -0.2383335828781128],
        ['pw-change-requiredRatio,multiStepForm', -0.27325764298439026],
    ],
    bias: -1.2090814113616943,
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
        ['recovery-fieldsCount', 2.6871609687805176],
        ['recovery-inputCount', 0.058528099209070206],
        ['recovery-fieldsetCount', 4.332832336425781],
        ['recovery-textCount', -0.5437424778938293],
        ['recovery-textareaCount', -6.642540454864502],
        ['recovery-selectCount', -3.80256724357605],
        ['recovery-disabledCount', -0.08816024661064148],
        ['recovery-radioCount', -1.8776065111160278],
        ['recovery-readOnlyCount', 4.314215660095215],
        ['recovery-formComplexity', -7.413941383361816],
        ['recovery-identifierCount', -1.1198573112487793],
        ['recovery-hiddenIdentifierCount', -2.578505039215088],
        ['recovery-usernameCount', 1.3107861280441284],
        ['recovery-emailCount', -0.7280851602554321],
        ['recovery-hiddenCount', 4.6955437660217285],
        ['recovery-hiddenPasswordCount', -3.0473992824554443],
        ['recovery-submitCount', 1.3033555746078491],
        ['recovery-identitiesCount', -2.607685089111328],
        ['recovery-ccsCount', -0.5828261971473694],
        ['recovery-hasTels', 1.3694559335708618],
        ['recovery-hasOAuth', -2.1460630893707275],
        ['recovery-hasCaptchas', 8.463486671447754],
        ['recovery-hasFiles', -15.46406364440918],
        ['recovery-hasDate', -1.4396582059816865e-7],
        ['recovery-hasNumber', -0.3967469036579132],
        ['recovery-oneVisibleField', 0.10265830904245377],
        ['recovery-twoVisibleFields', -3.93902850151062],
        ['recovery-threeOrMoreVisibleFields', -2.850778341293335],
        ['recovery-noPasswords', 0.15306922793388367],
        ['recovery-onePassword', -4.923520565032959],
        ['recovery-twoPasswords', -3.8058786392211914],
        ['recovery-threeOrMorePasswords', -0.16511857509613037],
        ['recovery-noIdentifiers', -6.491488933563232],
        ['recovery-oneIdentifier', -0.9292712807655334],
        ['recovery-twoIdentifiers', 2.3156754970550537],
        ['recovery-threeOrMoreIdentifiers', -2.3436763286590576],
        ['recovery-autofocusedIsIdentifier', 0.3158090114593506],
        ['recovery-autofocusedIsPassword', -0.00641081016510725],
        ['recovery-visibleRatio', -0.829377293586731],
        ['recovery-inputRatio', -2.316244602203369],
        ['recovery-hiddenRatio', -0.6812698245048523],
        ['recovery-identifierRatio', -3.597551107406616],
        ['recovery-emailRatio', 7.334617614746094],
        ['recovery-usernameRatio', 1.632381796836853],
        ['recovery-passwordRatio', -3.6472525596618652],
        ['recovery-disabledRatio', -0.08819019794464111],
        ['recovery-requiredRatio', -0.28984972834587097],
        ['recovery-checkboxRatio', -12.145675659179688],
        ['recovery-hiddenIdentifierRatio', 0.6816248297691345],
        ['recovery-hiddenPasswordRatio', -5.522721767425537],
        ['recovery-pageLogin', 1.2369403839111328],
        ['recovery-formTextLogin', -0.00014996808022260666],
        ['recovery-formAttrsLogin', 2.153353214263916],
        ['recovery-headingsLogin', -1.787807583808899],
        ['recovery-layoutLogin', -0.954030454158783],
        ['recovery-rememberMeCheckbox', -1.098324179649353],
        ['recovery-troubleLink', 6.061105251312256],
        ['recovery-submitLogin', -4.0599846839904785],
        ['recovery-pageRegister', -3.643476724624634],
        ['recovery-formTextRegister', -0.015695158392190933],
        ['recovery-formAttrsRegister', -2.6758782863616943],
        ['recovery-headingsRegister', -1.525233507156372],
        ['recovery-layoutRegister', -13.545413970947266],
        ['recovery-pwNewRegister', -1.6471706628799438],
        ['recovery-pwConfirmRegister', -1.5469934940338135],
        ['recovery-submitRegister', -1.1470181941986084],
        ['recovery-TOSRef', -7.302981376647949],
        ['recovery-pagePwReset', -2.637289047241211],
        ['recovery-formTextPwReset', -30507217161357403e-21],
        ['recovery-formAttrsPwReset', 2.1259098052978516],
        ['recovery-headingsPwReset', 3.744436025619507],
        ['recovery-layoutPwReset', 0.02025519870221615],
        ['recovery-pageRecovery', 5.184679985046387],
        ['recovery-formTextRecovery', -8666187568451278e-21],
        ['recovery-formAttrsRecovery', 4.902189254760742],
        ['recovery-headingsRecovery', 5.687321662902832],
        ['recovery-layoutRecovery', 2.771834373474121],
        ['recovery-identifierRecovery', 6.337018966674805],
        ['recovery-submitRecovery', 7.89781379699707],
        ['recovery-formTextMFA', 0.6948054432868958],
        ['recovery-formAttrsMFA', 4.595974445343018],
        ['recovery-inputsMFA', -2.1592025756835938],
        ['recovery-newsletterForm', -5.28450345993042],
        ['recovery-searchForm', 5.485366344451904],
        ['recovery-multiStepForm', -2.0477287769317627],
        ['recovery-multiAuthForm', -2.282705545425415],
        ['recovery-multiStepForm,multiAuthForm', -0.33755555748939514],
        ['recovery-visibleRatio,fieldsCount', -0.29829147458076477],
        ['recovery-visibleRatio,identifierCount', -0.5960498452186584],
        ['recovery-visibleRatio,passwordCount', -3.1417558193206787],
        ['recovery-visibleRatio,hiddenIdentifierCount', 1.2873919010162354],
        ['recovery-visibleRatio,hiddenPasswordCount', -0.43333882093429565],
        ['recovery-visibleRatio,multiAuthForm', -2.275184392929077],
        ['recovery-visibleRatio,multiStepForm', -2.9183568954467773],
        ['recovery-identifierRatio,fieldsCount', 4.792893886566162],
        ['recovery-identifierRatio,identifierCount', -3.4901468753814697],
        ['recovery-identifierRatio,passwordCount', -4.741177082061768],
        ['recovery-identifierRatio,hiddenIdentifierCount', 4.473797798156738],
        ['recovery-identifierRatio,hiddenPasswordCount', -2.349140167236328],
        ['recovery-identifierRatio,multiAuthForm', -2.534350633621216],
        ['recovery-identifierRatio,multiStepForm', 5.482059478759766],
        ['recovery-passwordRatio,fieldsCount', -3.15346622467041],
        ['recovery-passwordRatio,identifierCount', -3.859551191329956],
        ['recovery-passwordRatio,passwordCount', -3.275968074798584],
        ['recovery-passwordRatio,hiddenIdentifierCount', -0.628035843372345],
        ['recovery-passwordRatio,hiddenPasswordCount', -8039097156142816e-20],
        ['recovery-passwordRatio,multiAuthForm', -0.08425656706094742],
        ['recovery-passwordRatio,multiStepForm', -0.5228400230407715],
        ['recovery-requiredRatio,fieldsCount', -2.9624440670013428],
        ['recovery-requiredRatio,identifierCount', 0.5714552998542786],
        ['recovery-requiredRatio,passwordCount', -1.6591891050338745],
        ['recovery-requiredRatio,hiddenIdentifierCount', -7.888439178466797],
        ['recovery-requiredRatio,hiddenPasswordCount', -0.00011356856703059748],
        ['recovery-requiredRatio,multiAuthForm', -0.051451556384563446],
        ['recovery-requiredRatio,multiStepForm', -1.7734227180480957],
    ],
    bias: -2.564566135406494,
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
        ['register-fieldsCount', -0.8028363585472107],
        ['register-inputCount', 1.9996083974838257],
        ['register-fieldsetCount', 12.264636993408203],
        ['register-textCount', -0.1529468446969986],
        ['register-textareaCount', 4.914086818695068],
        ['register-selectCount', -0.1326271891593933],
        ['register-disabledCount', -6.3415350914001465],
        ['register-radioCount', -6.230278015136719],
        ['register-readOnlyCount', -5.413780212402344],
        ['register-formComplexity', 2.6051979064941406],
        ['register-identifierCount', 2.7708070278167725],
        ['register-hiddenIdentifierCount', -2.0631520748138428],
        ['register-usernameCount', -0.7332978248596191],
        ['register-emailCount', 5.059986591339111],
        ['register-hiddenCount', -8.071067810058594],
        ['register-hiddenPasswordCount', 1.5723440647125244],
        ['register-submitCount', -2.4608027935028076],
        ['register-identitiesCount', -4.008217811584473],
        ['register-ccsCount', -16.196298599243164],
        ['register-hasTels', 5.148719310760498],
        ['register-hasOAuth', -0.5854411125183105],
        ['register-hasCaptchas', 2.8265697956085205],
        ['register-hasFiles', -5.680558681488037],
        ['register-hasDate', -0.31538864970207214],
        ['register-hasNumber', 7.65720272064209],
        ['register-oneVisibleField', 1.2635524272918701],
        ['register-twoVisibleFields', -0.9768087267875671],
        ['register-threeOrMoreVisibleFields', -0.03488321229815483],
        ['register-noPasswords', -5.6306843757629395],
        ['register-onePassword', 2.80063533782959],
        ['register-twoPasswords', 4.875080585479736],
        ['register-threeOrMorePasswords', -1.7438840866088867],
        ['register-noIdentifiers', -4.365789890289307],
        ['register-oneIdentifier', -5.690779209136963],
        ['register-twoIdentifiers', 4.6770477294921875],
        ['register-threeOrMoreIdentifiers', 5.814798831939697],
        ['register-autofocusedIsIdentifier', -1.2635581493377686],
        ['register-autofocusedIsPassword', 8.059159278869629],
        ['register-visibleRatio', 0.7176777124404907],
        ['register-inputRatio', -2.4125444889068604],
        ['register-hiddenRatio', 2.958173990249634],
        ['register-identifierRatio', 1.7141306400299072],
        ['register-emailRatio', 6.261354923248291],
        ['register-usernameRatio', -1.5010600090026855],
        ['register-passwordRatio', -6.617229461669922],
        ['register-disabledRatio', -4.948085784912109],
        ['register-requiredRatio', -2.6013388633728027],
        ['register-checkboxRatio', 2.2695956230163574],
        ['register-hiddenIdentifierRatio', -6.835651874542236],
        ['register-hiddenPasswordRatio', 4.733055114746094],
        ['register-pageLogin', -5.899282455444336],
        ['register-formTextLogin', -5.726064600253267e-8],
        ['register-formAttrsLogin', -0.9040095806121826],
        ['register-headingsLogin', -6.572494983673096],
        ['register-layoutLogin', 4.697286128997803],
        ['register-rememberMeCheckbox', -8.284391403198242],
        ['register-troubleLink', -6.629974842071533],
        ['register-submitLogin', -5.707202911376953],
        ['register-pageRegister', 8.585638046264648],
        ['register-formTextRegister', 4815528063411917e-37],
        ['register-formAttrsRegister', 5.230904579162598],
        ['register-headingsRegister', 4.892641544342041],
        ['register-layoutRegister', 0.07774289697408676],
        ['register-pwNewRegister', 2.8922462463378906],
        ['register-pwConfirmRegister', 8.58607006072998],
        ['register-submitRegister', 11.198784828186035],
        ['register-TOSRef', 3.7013700008392334],
        ['register-pagePwReset', -2.1468074321746826],
        ['register-formTextPwReset', -0.008075466379523277],
        ['register-formAttrsPwReset', -0.6280221939086914],
        ['register-headingsPwReset', 0.3691354990005493],
        ['register-layoutPwReset', -4.926352500915527],
        ['register-pageRecovery', -2.0712709426879883],
        ['register-formTextRecovery', -0.003375900909304619],
        ['register-formAttrsRecovery', -1.9588218927383423],
        ['register-headingsRecovery', -5.112795829772949],
        ['register-layoutRecovery', 0.06963755935430527],
        ['register-identifierRecovery', 0.6888202428817749],
        ['register-submitRecovery', -8.820610046386719],
        ['register-formTextMFA', -5.935659885406494],
        ['register-formAttrsMFA', -5.522268295288086],
        ['register-inputsMFA', -8.955065727233887],
        ['register-newsletterForm', -16.15483283996582],
        ['register-searchForm', -5.63950777053833],
        ['register-multiStepForm', 3.7500617504119873],
        ['register-multiAuthForm', 9.550764083862305],
        ['register-multiStepForm,multiAuthForm', 0.9055606126785278],
        ['register-visibleRatio,fieldsCount', -3.1886515617370605],
        ['register-visibleRatio,identifierCount', -3.078798532485962],
        ['register-visibleRatio,passwordCount', -5.999637126922607],
        ['register-visibleRatio,hiddenIdentifierCount', -1.3800320625305176],
        ['register-visibleRatio,hiddenPasswordCount', -2.9820518493652344],
        ['register-visibleRatio,multiAuthForm', -7.943327903747559],
        ['register-visibleRatio,multiStepForm', 8.370640754699707],
        ['register-identifierRatio,fieldsCount', -0.29190707206726074],
        ['register-identifierRatio,identifierCount', 0.24923214316368103],
        ['register-identifierRatio,passwordCount', 4.960206985473633],
        ['register-identifierRatio,hiddenIdentifierCount', 4.983201503753662],
        ['register-identifierRatio,hiddenPasswordCount', -2.2658116817474365],
        ['register-identifierRatio,multiAuthForm', 4.64071798324585],
        ['register-identifierRatio,multiStepForm', -5.51389217376709],
        ['register-passwordRatio,fieldsCount', 3.452357053756714],
        ['register-passwordRatio,identifierCount', 0.7428534626960754],
        ['register-passwordRatio,passwordCount', -5.19366455078125],
        ['register-passwordRatio,hiddenIdentifierCount', 9.41550350189209],
        ['register-passwordRatio,hiddenPasswordCount', -1.9501254558563232],
        ['register-passwordRatio,multiAuthForm', -6.830522060394287],
        ['register-passwordRatio,multiStepForm', 1.644506573677063],
        ['register-requiredRatio,fieldsCount', -2.693739891052246],
        ['register-requiredRatio,identifierCount', -1.6135414838790894],
        ['register-requiredRatio,passwordCount', 3.058781862258911],
        ['register-requiredRatio,hiddenIdentifierCount', 3.5176148414611816],
        ['register-requiredRatio,hiddenPasswordCount', -3.4419102668762207],
        ['register-requiredRatio,multiAuthForm', -4.896100044250488],
        ['register-requiredRatio,multiStepForm', 3.7829041481018066],
    ],
    bias: -2.536426305770874,
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
    const typeEmail = fieldFeatures.type === 'email';
    const exactAttrEmail = field.matches(kEmailSelector);
    const attrEmail = any(matchEmailAttr)(fieldAttrs);
    const textEmail = matchEmail(fieldText);
    const labelEmail = matchEmail(labelText);
    const placeholderEmail = any(or(matchEmailValue, matchEmail))(field.placeholder.split(' '));
    return {
        autocompleteEmail: boolInt(fieldFeatures.autocomplete?.includes('email') ?? false),
        autocompleteOTP: boolInt(fieldFeatures.autocomplete === 'one-time-code'),
        typeEmail: boolInt(typeEmail),
        exactAttrEmail: boolInt(exactAttrEmail),
        attrEmail: boolInt(attrEmail),
        textEmail: boolInt(textEmail),
        labelEmail: boolInt(labelEmail),
        placeholderEmail: boolInt(placeholderEmail),
        searchField: boolInt(fieldFeatures.searchField),
    };
};

const EMAIL_FEATURES = [
    'autocompleteEmail',
    'autocompleteOTP',
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
        ['email-isCC', -2.249032974243164],
        ['email-isIdentity', -6.500515460968018],
        ['email-autocompleteEmail', 1.6068300008773804],
        ['email-autocompleteOTP', -7.562423229217529],
        ['email-typeEmail', 9.429868698120117],
        ['email-exactAttrEmail', 8.737061500549316],
        ['email-attrEmail', 1.3283476829528809],
        ['email-textEmail', 8.90112590789795],
        ['email-labelEmail', 11.803503036499023],
        ['email-placeholderEmail', 3.202404499053955],
        ['email-searchField', -9.225273132324219],
    ],
    bias: -6.499870300292969,
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
    const autocompleteOff = autocomplete !== null && (autocomplete === 'off' || autocomplete === 'false');
    const outlierAutocomplete =
        outlierCandidate && autocomplete !== null && !autocompleteOff && !autocomplete.includes('one-time-code');
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
        ['otp-isCC', -2.8959457874298096],
        ['otp-isIdentity', -2.4102210998535156],
        ['otp-numericMode', 2.1091654300689697],
        ['otp-nameMatch', 3.0463547706604004],
        ['otp-idMatch', 4.835592269897461],
        ['otp-autocompleteOTC', 2.07639479637146],
        ['otp-patternOTP', 1.2201285362243652],
        ['otp-formMFA', 0.5357550978660583],
        ['otp-formAuthenticator', 7.330410480499268],
        ['otp-attrOTP', 3.277578830718994],
        ['otp-textOTP', -5.556446075439453],
        ['otp-labelOTP', 4.26426362991333],
        ['otp-parentOTP', -0.4904671311378479],
        ['otp-attrMFA', 5.813345432281494],
        ['otp-textMFA', 5.864340305328369],
        ['otp-labelMFA', 4.920811653137207],
        ['otp-textAuthenticator', 0.003642166033387184],
        ['otp-labelAuthenticator', 0.9449942708015442],
        ['otp-maxLength1', 1.4058098793029785],
        ['otp-maxLength6', 5.576366901397705],
        ['otp-maxLengthInvalid', -6.437289237976074],
        ['otp-siblingOfInterest', 5.269290924072266],
        ['otp-unexpectedInputCount', -1.7747238874435425],
        ['otp-fieldOutlier', -3.1452763080596924],
        ['otp-linkOutlier', -4.203841209411621],
        ['otp-emailOutlierCount', -1.6481956243515015],
        ['otp-outlierAutocomplete', -8.87809944152832],
        ['otp-formComplexity', -3.937530040740967],
        ['otp-otp,outlier', -0.23701651394367218],
        ['otp-otp,siblingOfInterest', -2.3139431476593018],
        ['otp-otp,singleInput', 0.5627728700637817],
        ['otp-mfa,outlier', -3.1053028106689453],
        ['otp-mfa,siblingOfInterest', -0.029278401285409927],
        ['otp-mfa,singleInput', 4.002535820007324],
        ['otp-autocompleteOTC,linkOutlier', -3.078387498855591],
        ['otp-autocompleteOTC,authenticator', 0.24672436714172363],
    ],
    bias: -7.599494934082031,
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

const isAutocompleteOTP = (value) => value === 'one-time-code';

const getPasswordFieldFeatures = (fnode) => {
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
    const prevAutocomplete = prevPwField?.getAttribute('autocomplete');
    const prevAutocompleteCurrent = isAutocompleteCurrentPassword(prevAutocomplete);
    const prevPwCurrent = prevAutocompleteCurrent || any(matchPasswordCurrent)(prevPwHaystack);
    const prevAutocompleteNew = isAutocompleteNewPassword(prevAutocomplete);
    const prevPwNew = prevAutocompleteNew || any(matchPasswordCreate)(prevPwHaystack);
    const prevPwConfirm = any(matchPasswordConfirm)(prevPwHaystack);
    const nextAutocomplete = nextPwField?.getAttribute('autocomplete');
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

const PW_FEATURES = [
    'loginScore',
    'registerScore',
    'pwChangeScore',
    'exotic',
    'autocompleteNew',
    'autocompleteCurrent',
    'autocompleteOTP',
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
    ...combineFeatures(['prevPwCurrent'], ['nextPwNew']),
];

const results$3 = {
    coeffs: [
        ['password-isCC', -1.7184154987335205],
        ['password-isIdentity', -9182088139973544e-51],
        ['password-loginScore', 7.993000507354736],
        ['password-registerScore', -7.787721157073975],
        ['password-pwChangeScore', -0.1724521964788437],
        ['password-exotic', -4.7949090003967285],
        ['password-autocompleteNew', 0.2785069942474365],
        ['password-autocompleteCurrent', -0.5281509757041931],
        ['password-autocompleteOTP', -1.2432043552398682],
        ['password-autocompleteOff', -0.9458367824554443],
        ['password-isOnlyPassword', 0.18040767312049866],
        ['password-prevPwField', -5.013550758361816],
        ['password-nextPwField', 1.2343976497650146],
        ['password-attrCreate', -0.07453294843435287],
        ['password-attrCurrent', 1.4183635711669922],
        ['password-attrConfirm', -1.6953442096710205],
        ['password-attrReset', 0.1398698389530182],
        ['password-textCreate', -4.421770095825195],
        ['password-textCurrent', 0.051011666655540466],
        ['password-textConfirm', -0.7798187136650085],
        ['password-textReset', -9943222884525417e-51],
        ['password-labelCreate', -3.9696741104125977],
        ['password-labelCurrent', 2.7011401653289795],
        ['password-labelConfirm', -1.1861646175384521],
        ['password-labelReset', 3086285385859434e-51],
        ['password-prevPwNew', -1.9273020029067993],
        ['password-prevPwCurrent', -2.0475757122039795],
        ['password-prevPwConfirm', -897963248390437e-50],
        ['password-nextPwNew', 2.85880446434021],
        ['password-nextPwCurrent', -0.0035439913626760244],
        ['password-nextPwConfirm', -6.017484188079834],
        ['password-passwordOutlier', -12.697896957397461],
        ['password-prevPwCurrent,nextPwNew', -2.141596555709839],
    ],
    bias: 0.5602550506591797,
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
        ['new-password-isCC', -7.939815044403076],
        ['new-password-isIdentity', -21913291042498386e-52],
        ['new-password-loginScore', -8.079215049743652],
        ['new-password-registerScore', 7.889993190765381],
        ['new-password-pwChangeScore', 1.6953296661376953],
        ['new-password-exotic', 2.070371627807617],
        ['new-password-autocompleteNew', -1.767549753189087],
        ['new-password-autocompleteCurrent', 0.8728336691856384],
        ['new-password-autocompleteOTP', -4.730673789978027],
        ['new-password-autocompleteOff', 2.0061187744140625],
        ['new-password-isOnlyPassword', 0.1394931524991989],
        ['new-password-prevPwField', 5.335681915283203],
        ['new-password-nextPwField', -2.112938642501831],
        ['new-password-attrCreate', -0.022440707311034203],
        ['new-password-attrCurrent', -1.9906706809997559],
        ['new-password-attrConfirm', 1.403092861175537],
        ['new-password-attrReset', -0.16376832127571106],
        ['new-password-textCreate', 4.662781715393066],
        ['new-password-textCurrent', 0.41776084899902344],
        ['new-password-textConfirm', 0.80949866771698],
        ['new-password-textReset', 29526028434381913e-35],
        ['new-password-labelCreate', 2.9265670776367188],
        ['new-password-labelCurrent', -2.9854187965393066],
        ['new-password-labelConfirm', 1.1145765781402588],
        ['new-password-labelReset', -27031211496901863e-52],
        ['new-password-prevPwNew', 1.6971564292907715],
        ['new-password-prevPwCurrent', 1.9706764221191406],
        ['new-password-prevPwConfirm', -1260814262020832e-50],
        ['new-password-nextPwNew', -2.5344431400299072],
        ['new-password-nextPwCurrent', 0.006521718576550484],
        ['new-password-nextPwConfirm', 6.396943092346191],
        ['new-password-passwordOutlier', -13.064840316772461],
        ['new-password-prevPwCurrent,nextPwNew', 2.0083863735198975],
    ],
    bias: -1.4312779903411865,
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
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, prevField, isFormLogin } = fieldFeatures;
    const { autocomplete } = fieldFeatures;
    const autocompleteOff = (autocomplete !== null && autocomplete === 'off') || autocomplete === 'false';
    const autocompleteUsername = Boolean(autocomplete?.includes('username') || autocomplete?.includes('nickname'));
    const autocompleteEmail = Boolean(autocomplete?.includes('email'));
    const attrUsername = any(matchUsernameAttr)(fieldAttrs);
    const textUsername = matchUsername(fieldText);
    const labelUsername = matchUsername(labelText);
    const username = attrUsername || textUsername || labelUsername;
    const outlierAttrs = any(matchUsernameOutlier)(fieldAttrs);
    const outlierText = matchUsernameOutlier(fieldText);
    const outlierLabel = matchUsernameOutlier(labelText);
    const outlierEmail = !username && any(matchEmailAttr)(fieldAttrs.concat(fieldText, labelText));
    const outlier = outlierAttrs || outlierText || outlierLabel || outlierEmail;
    const isFirstField = prevField === null;
    const loginUsername = isFormLogin && isFirstField && !outlier;
    return {
        autocompleteUsername: boolInt(autocompleteUsername),
        autocompleteEmail: boolInt(autocompleteEmail),
        autocompleteOff: boolInt(autocompleteOff),
        attrUsername: boolInt(attrUsername),
        textUsername: boolInt(textUsername),
        labelUsername: boolInt(labelUsername),
        outlierText: boolInt(outlierText),
        outlierAttrs: boolInt(outlierAttrs),
        outlierLabel: boolInt(outlierLabel),
        outlierEmail: boolInt(outlierEmail),
        loginUsername: boolInt(loginUsername),
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
    'loginUsername',
    'searchField',
];

const results$1 = {
    coeffs: [
        ['username-isCC', -2.6219260692596436],
        ['username-isIdentity', -1.3593460321426392],
        ['username-autocompleteUsername', 1.156126618385315],
        ['username-autocompleteEmail', 0.06264840811491013],
        ['username-autocompleteOff', -0.5994285345077515],
        ['username-attrUsername', 11.14635944366455],
        ['username-textUsername', 2.928809881210327],
        ['username-labelUsername', 11.356205940246582],
        ['username-outlierText', -1.401442527770996],
        ['username-outlierAttrs', -1.529660701751709],
        ['username-outlierLabel', -2.0032355785369873],
        ['username-outlierEmail', -3.091437578201294],
        ['username-loginUsername', 12.165559768676758],
        ['username-searchField', -7.186823844909668],
    ],
    bias: -6.566545009613037,
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
        ['username-hidden-isCC', 16324491256192947e-51],
        ['username-hidden-isIdentity', 8555328815315598e-51],
        ['username-hidden-exotic', -3.394195795059204],
        ['username-hidden-visibleReadonly', 4.130645275115967],
        ['username-hidden-attrUsername', 8.656002044677734],
        ['username-hidden-attrEmail', 6.881221294403076],
        ['username-hidden-attrMatch', 11.524859428405762],
        ['username-hidden-autocompleteUsername', -3.6706831455230713],
        ['username-hidden-autocompleteEmail', 1.5129531621932983],
        ['username-hidden-valueEmail', 10.234770774841309],
        ['username-hidden-valueTel', 1.3504582643508911],
        ['username-hidden-valueUsername', 2.1272776126861572],
    ],
    bias: -12.751503944396973,
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
    const maxLength = field.getAttribute('maxLength');
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
