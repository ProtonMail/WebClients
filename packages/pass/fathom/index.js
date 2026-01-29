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

const kDomDialogSelector = `[role="dialog"], [role="tabpanel"], [role="group"], [role="form"], [id*="modal"], [class*="modal"]`;

const kDomClusterSelector = `${kDomDialogSelector}, header, main, nav, footer, aside`;

const kDomGroupSelector = `${kDomClusterSelector}, section`;

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

const kLayoutSelector = `div, section, aside, main, nav, label`;

const kAnchorLinkSelector = `a, [role="link"], span[role="button"]`;

const formCandidateSelector = `form, [${FORM_CLUSTER_ATTR}]`;

const inputCandidateSelector =
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="checkbox"])';

const kInputIteratorSelector =
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]), textarea, select';

const kButtonSelector = `button:not([type]), a[role="button"], ${kButtonSubmitSelector}`;

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

const matchPreviousSibling = (el, match) => {
    const prevEl = el.previousElementSibling;
    if (prevEl === null) return null;
    if (match(prevEl)) return prevEl;
    return matchPreviousSibling(prevEl, match);
};

const matchPreviousNonEmptySibling = (el) =>
    matchPreviousSibling(el, (el) => el instanceof HTMLElement && el.innerText.trim().length > 0);

const getLabelFor = (el) => {
    const forId = el.getAttribute('id') ?? el.getAttribute('name');
    const label = document.querySelector(`label[for="${forId}"]`);
    if (label) return label;
    const parentLabel = el.closest('label');
    if (parentLabel) return parentLabel;
    const closestLabel = parentQuery(el, (parent) => parent.querySelector('label:not([for])'), 1);
    if (closestLabel) return closestLabel;
    const labelLike = parentQuery(el, (parent) => parent.querySelector(kFieldLabelSelector), 1);
    if (labelLike) return labelLike;
    const textNodeAbove = matchPreviousNonEmptySibling(el);
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

const MIN_AREA_SUBMIT_BTN = 3e3;

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

const PASSWORD_OUTLIER_RE = /s(?:ocialsecurity|ecanswer)|nationalid|answer|userid/i;

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

const OTP_OUTLIER_ATTR_RE = /email|sms/i;

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

const CC_PREFIX_ATTR_RE = /(?:payments?|new)card|c(?:ar(?:tecredit|d)|red(?:it(?:debit|card)|card))|stripe|vads/i;

const CC_NUMBER_ATTR_RE = /num(?:ero(?:de)?)?carte|c(?:ardn(?:um|[or])|bnum|cno)|\b(c(?:ard |c)number)\b/i;

const CC_OUTLIER_ATTR_RE = /c(?:ertificate|oupon)|logincard|voucher|promo/i;

const CC_CVC_ATTR_RE = /c(?:ard(?:verification|code)|cv|sc|v[cv])|payments?code|\b(c(?:cc(?:ode|vv|sc)|vn))\b/i;

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

const matchOtpFieldOutlier = orRe([OTP_OUTLIER_ATTR_RE, USERNAME_RE]);

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

const isEditorFrame = () => {
    if (document.designMode === 'on') return true;
    if (document.body?.isContentEditable) return true;
    return document.querySelector(kEditorSelector) !== null;
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
    const textAbove = (() => {
        if (headings.length > 0) return headings.map((el) => el.innerText).join();
        const prevSibling = matchPreviousNonEmptySibling(el);
        const parentFirstChild = el.parentElement?.firstElementChild;
        const prevSiblingText = prevSibling?.innerText ?? '';
        const parentFirstChildText = parentFirstChild?.innerText ?? '';
        return prevSibling === parentFirstChild ? prevSiblingText : prevSiblingText + parentFirstChildText;
    })();
    return sanitizeString(textAbove);
};

const CC_ATTRIBUTES = [
    'autocomplete',
    'name',
    'id',
    'class',
    'form',
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

const CC_EXP_FULL_RE = /(mmyy|mmaa|yymm|aamm)/;

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
    if (CC_EXP_FULL_RE.test(haystack)) return false;
    if (matchCCExpMonth(haystack)) return true;
    if (field instanceof HTMLSelectElement && matchCCExp(haystack)) {
        return field.options.length >= 12 && field.options.length <= 14;
    }
    return false;
};

const isCCExpYear = (field, autocompletes, haystack) => {
    if (autocompletes.includes('cc-exp')) return false;
    if (CC_EXP_FULL_RE.test(haystack)) return false;
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
                password: true,
            },
            isCCNumber
        ),
    ],
];

const getCCHaystack = (field) => {
    const attrs = CC_ATTRIBUTES.map((attr) => field?.getAttribute(attr) ?? '');
    const labelEl = getLabelFor(field);
    const label = sanitizeString(
        (() => {
            if (!labelEl) return '';
            if (labelEl.innerText) return labelEl.innerText;
            if (labelEl.childElementCount === 0) return '';
            return Array.from(labelEl.children)
                .map((el) => el?.innerText ?? '')
                .join(' ');
        })()
    );
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
    const formEls = Array.from(form.querySelectorAll(kInputIteratorSelector)).filter(isVisibleField);
    const getAdjacent = (el, offset, tagNameFilter) => {
        const idx = formEls.indexOf(el);
        const res = idx === -1 ? null : (formEls?.[idx + offset] ?? null);
        return res && tagNameFilter && res?.tagName !== tagNameFilter ? getAdjacent(res, offset, tagNameFilter) : res;
    };
    const iterator = {
        prev: (el, tagNameFilter) => getAdjacent(el, -1, tagNameFilter),
        next: (el, tagNameFilter) => getAdjacent(el, 1, tagNameFilter),
    };
    return iterator;
};

const selectFormCandidates = (root = document) => {
    const candidates = Array.from(root.querySelectorAll(formCandidateSelector));
    return candidates.filter((form) => !isIgnored(form) && !attrIgnored(form));
};

const getFormComplexity = (form, options) => {
    const types = new Set();
    let score = 0;
    score += options.visibleFields * 2;
    score += options.buttons * 1;
    score += options.anchors * 0.5;
    score += options.nonVisibleFields * 0.25;
    score += options.hiddenFields * 0.1;
    for (const field of options.fields) {
        const type = field.tagName === 'INPUT' ? field.type : field.tagName;
        if (!types.has(type)) {
            score += 0.2;
            types.add(type);
        }
    }
    score += form.querySelectorAll("fieldset, [role='group'], [role='radiogroup']").length * 0.2;
    for (const el of form.querySelectorAll('div, section')) {
        if (el.children.length > 1) score += 0.2;
    }
    return score;
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
    const btns = Array.from(form.querySelectorAll(kButtonSelector)).filter(isVisibleEl);
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
    const multiStep = buttonMultiStep || headingsMultiStep;
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
    const headingsOTPOutlier = matchOtpOutlier(nearestHeadingsText);
    const formOTPOutlier = any(matchOtpOutlier)(formAttributes);
    const linkOTPOutlier = any(matchOtpOutlierAction)(anchorsHaystack.concat(btnHaystack));
    const newsletterForm = any(matchNewsletter)(formTextHaystack);
    const searchForm = any(matchSearchAction)(formTextHaystack);
    const formComplexity = getFormComplexity(form, {
        fields,
        visibleFields: visibleFields.length,
        hiddenFields: hidden.length,
        nonVisibleFields: fields.length - visibleFields.length - hidden.length,
        anchors: anchors.length,
        buttons: candidateBtns.length,
    });
    return {
        formComplexity: linearScale$1(formComplexity, 0, 50),
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
        headingsOTPOutlier: boolInt(headingsOTPOutlier),
        inputsMFA: boolInt(inputsMFA),
        newsletterForm: boolInt(newsletterForm),
        searchForm: boolInt(searchForm),
        multiStepForm: boolInt(multiStep),
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
        ['login-fieldsCount', 2.0724992752075195],
        ['login-inputCount', 0.9852641820907593],
        ['login-fieldsetCount', -1.1779693365097046],
        ['login-textCount', -2.336937427520752],
        ['login-textareaCount', -1.345166563987732],
        ['login-selectCount', -4.2165303230285645],
        ['login-disabledCount', -0.18492664396762848],
        ['login-radioCount', -6.249516487121582],
        ['login-readOnlyCount', -6.994029998779297],
        ['login-formComplexity', -2.632889747619629],
        ['login-identifierCount', -2.1217200756073],
        ['login-hiddenIdentifierCount', 3.185352087020874],
        ['login-usernameCount', -0.15859219431877136],
        ['login-emailCount', -4.353358745574951],
        ['login-hiddenCount', 3.071723222732544],
        ['login-hiddenPasswordCount', 6.169623851776123],
        ['login-submitCount', -5.422268867492676],
        ['login-identitiesCount', 0.9962340593338013],
        ['login-ccsCount', -3.0328993797302246],
        ['login-hasTels', -3.5903916358947754],
        ['login-hasOAuth', -0.34478700160980225],
        ['login-hasCaptchas', 1.87575364112854],
        ['login-hasFiles', -0.004974236711859703],
        ['login-hasDate', -1.7363207340240479],
        ['login-hasNumber', -5.96631383895874],
        ['login-oneVisibleField', 2.424100399017334],
        ['login-twoVisibleFields', 0.21031440794467926],
        ['login-threeOrMoreVisibleFields', -1.360605001449585],
        ['login-noPasswords', -6.541637897491455],
        ['login-onePassword', 6.6599555015563965],
        ['login-twoPasswords', 0.4873499870300293],
        ['login-threeOrMorePasswords', -1.0175126791000366],
        ['login-noIdentifiers', -1.946824550628662],
        ['login-oneIdentifier', 1.1850430965423584],
        ['login-twoIdentifiers', 2.4431469440460205],
        ['login-threeOrMoreIdentifiers', -4.8136420249938965],
        ['login-autofocusedIsIdentifier', 3.389669418334961],
        ['login-autofocusedIsPassword', 6.495340347290039],
        ['login-visibleRatio', 1.3084756135940552],
        ['login-inputRatio', -3.304527521133423],
        ['login-hiddenRatio', -0.47788023948669434],
        ['login-identifierRatio', -2.0708224773406982],
        ['login-emailRatio', 11.9343900680542],
        ['login-usernameRatio', -3.134141445159912],
        ['login-passwordRatio', 3.0341763496398926],
        ['login-disabledRatio', -0.18372738361358643],
        ['login-requiredRatio', 0.5793794989585876],
        ['login-checkboxRatio', -10.586652755737305],
        ['login-hiddenIdentifierRatio', 1.5237616300582886],
        ['login-hiddenPasswordRatio', 6.412667274475098],
        ['login-pageLogin', 3.8267040252685547],
        ['login-formTextLogin', 0.0009585007792338729],
        ['login-formAttrsLogin', 4.78177547454834],
        ['login-headingsLogin', 7.789892196655273],
        ['login-layoutLogin', -0.27962955832481384],
        ['login-rememberMeCheckbox', 4.859387397766113],
        ['login-troubleLink', 3.8345634937286377],
        ['login-submitLogin', 9.849520683288574],
        ['login-pageRegister', -8.343914985656738],
        ['login-formTextRegister', -6.572613716125488],
        ['login-formAttrsRegister', -7.072200775146484],
        ['login-headingsRegister', -3.4610555171966553],
        ['login-layoutRegister', 1.7700806856155396],
        ['login-pwNewRegister', -13.034941673278809],
        ['login-pwConfirmRegister', -4.625460147857666],
        ['login-submitRegister', -12.917529106140137],
        ['login-TOSRef', -2.7807652950286865],
        ['login-pagePwReset', -1.027647852897644],
        ['login-formTextPwReset', -0.00029395567253232],
        ['login-formAttrsPwReset', -11.071924209594727],
        ['login-headingsPwReset', -1.4014170169830322],
        ['login-layoutPwReset', 1.979628324508667],
        ['login-pageRecovery', -1.021344542503357],
        ['login-formTextRecovery', -1033202137187692e-50],
        ['login-formAttrsRecovery', -10.126358032226562],
        ['login-headingsRecovery', -3.2598562240600586],
        ['login-layoutRecovery', 1.6129142045974731],
        ['login-identifierRecovery', 0.1658254861831665],
        ['login-submitRecovery', -5.323183059692383],
        ['login-formTextMFA', -2.579241991043091],
        ['login-formAttrsMFA', -9.901978492736816],
        ['login-inputsMFA', -10.718489646911621],
        ['login-newsletterForm', -3.0586984157562256],
        ['login-searchForm', -4.1132965087890625],
        ['login-multiStepForm', 2.554983377456665],
        ['login-multiAuthForm', 0.4203472137451172],
        ['login-multiStepForm,multiAuthForm', 6.5882039070129395],
        ['login-visibleRatio,fieldsCount', -2.028789758682251],
        ['login-visibleRatio,identifierCount', -4.2160139083862305],
        ['login-visibleRatio,passwordCount', 1.2220494747161865],
        ['login-visibleRatio,hiddenIdentifierCount', -4.174871921539307],
        ['login-visibleRatio,hiddenPasswordCount', -3.0576939582824707],
        ['login-visibleRatio,multiAuthForm', 0.4852445125579834],
        ['login-visibleRatio,multiStepForm', 7.150484085083008],
        ['login-identifierRatio,fieldsCount', -3.088218927383423],
        ['login-identifierRatio,identifierCount', -4.3607659339904785],
        ['login-identifierRatio,passwordCount', 3.8215749263763428],
        ['login-identifierRatio,hiddenIdentifierCount', 1.0684876441955566],
        ['login-identifierRatio,hiddenPasswordCount', 9.072622299194336],
        ['login-identifierRatio,multiAuthForm', 5.968240737915039],
        ['login-identifierRatio,multiStepForm', -5.979754447937012],
        ['login-passwordRatio,fieldsCount', 5.572204113006592],
        ['login-passwordRatio,identifierCount', 3.8035452365875244],
        ['login-passwordRatio,passwordCount', -2.8207006454467773],
        ['login-passwordRatio,hiddenIdentifierCount', 2.1360015869140625],
        ['login-passwordRatio,hiddenPasswordCount', 0.6994272470474243],
        ['login-passwordRatio,multiAuthForm', -4.901845932006836],
        ['login-passwordRatio,multiStepForm', -14.494694709777832],
        ['login-requiredRatio,fieldsCount', 1.168289303779602],
        ['login-requiredRatio,identifierCount', -1.8514260053634644],
        ['login-requiredRatio,passwordCount', -3.6438918113708496],
        ['login-requiredRatio,hiddenIdentifierCount', 7.612978458404541],
        ['login-requiredRatio,hiddenPasswordCount', 1.1926801204681396],
        ['login-requiredRatio,multiAuthForm', 3.628382444381714],
        ['login-requiredRatio,multiStepForm', 4.243411064147949],
    ],
    bias: -1.0068837404251099,
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
        ['pw-change-fieldsCount', -0.3124527931213379],
        ['pw-change-inputCount', -0.42478686571121216],
        ['pw-change-fieldsetCount', -0.08773519098758698],
        ['pw-change-textCount', -1.4449864625930786],
        ['pw-change-textareaCount', -0.49524855613708496],
        ['pw-change-selectCount', -0.29648658633232117],
        ['pw-change-disabledCount', -0.021873783320188522],
        ['pw-change-radioCount', -2.209073305130005],
        ['pw-change-readOnlyCount', -2.056184768676758],
        ['pw-change-formComplexity', -0.3344323933124542],
        ['pw-change-identifierCount', -1.3220558166503906],
        ['pw-change-hiddenIdentifierCount', -1.3031892776489258],
        ['pw-change-usernameCount', -1.5153549909591675],
        ['pw-change-emailCount', -1.3925061225891113],
        ['pw-change-hiddenCount', 0.1422010213136673],
        ['pw-change-hiddenPasswordCount', -0.4630727469921112],
        ['pw-change-submitCount', 0.16830405592918396],
        ['pw-change-identitiesCount', -0.6417959928512573],
        ['pw-change-ccsCount', -0.4969494044780731],
        ['pw-change-hasTels', -1.1256853342056274],
        ['pw-change-hasOAuth', -1.0965497493743896],
        ['pw-change-hasCaptchas', -1.1860125064849854],
        ['pw-change-hasFiles', -0.007154686842113733],
        ['pw-change-hasDate', -14264986020862125e-21],
        ['pw-change-hasNumber', -0.5434018969535828],
        ['pw-change-oneVisibleField', -1.383600115776062],
        ['pw-change-twoVisibleFields', -0.6778467297554016],
        ['pw-change-threeOrMoreVisibleFields', -0.06493742018938065],
        ['pw-change-noPasswords', -2.1581051349639893],
        ['pw-change-onePassword', -1.0267324447631836],
        ['pw-change-twoPasswords', 0.6394753456115723],
        ['pw-change-threeOrMorePasswords', 3.857250690460205],
        ['pw-change-noIdentifiers', -0.05588485300540924],
        ['pw-change-oneIdentifier', -1.5682069063186646],
        ['pw-change-twoIdentifiers', -1.3410396575927734],
        ['pw-change-threeOrMoreIdentifiers', -0.5764643549919128],
        ['pw-change-autofocusedIsIdentifier', -1.1482045650482178],
        ['pw-change-autofocusedIsPassword', -1.3536267280578613],
        ['pw-change-visibleRatio', -1.7166575193405151],
        ['pw-change-inputRatio', -1.2661168575286865],
        ['pw-change-hiddenRatio', 1.1374437808990479],
        ['pw-change-identifierRatio', -1.2908424139022827],
        ['pw-change-emailRatio', -1.2402619123458862],
        ['pw-change-usernameRatio', -1.225213646888733],
        ['pw-change-passwordRatio', 1.8793997764587402],
        ['pw-change-disabledRatio', -0.018341070041060448],
        ['pw-change-requiredRatio', 0.22066372632980347],
        ['pw-change-checkboxRatio', 0.0869966596364975],
        ['pw-change-hiddenIdentifierRatio', -1.6125338077545166],
        ['pw-change-hiddenPasswordRatio', -0.5019018054008484],
        ['pw-change-pageLogin', -1.9405913352966309],
        ['pw-change-formTextLogin', -0.00015975761925801635],
        ['pw-change-formAttrsLogin', -0.9209910035133362],
        ['pw-change-headingsLogin', -1.3508150577545166],
        ['pw-change-layoutLogin', -1.2454622983932495],
        ['pw-change-rememberMeCheckbox', -0.48498138785362244],
        ['pw-change-troubleLink', -0.8835694193840027],
        ['pw-change-submitLogin', -1.4513849020004272],
        ['pw-change-pageRegister', -0.34337058663368225],
        ['pw-change-formTextRegister', -1.3296227052705945e-7],
        ['pw-change-formAttrsRegister', -3.5862817764282227],
        ['pw-change-headingsRegister', -4.453853130340576],
        ['pw-change-layoutRegister', -0.44006428122520447],
        ['pw-change-pwNewRegister', 6.631987571716309],
        ['pw-change-pwConfirmRegister', 0.2629145681858063],
        ['pw-change-submitRegister', -2.50616192817688],
        ['pw-change-TOSRef', -0.13306908309459686],
        ['pw-change-pagePwReset', 0.8943226933479309],
        ['pw-change-formTextPwReset', 0.12193922698497772],
        ['pw-change-formAttrsPwReset', 3.0584845542907715],
        ['pw-change-headingsPwReset', 0.6559048891067505],
        ['pw-change-layoutPwReset', 3.8835697174072266],
        ['pw-change-pageRecovery', -1.0318623781204224],
        ['pw-change-formTextRecovery', -10620318105585335e-51],
        ['pw-change-formAttrsRecovery', -0.507628321647644],
        ['pw-change-headingsRecovery', -0.3358222544193268],
        ['pw-change-layoutRecovery', -0.17637251317501068],
        ['pw-change-identifierRecovery', -0.3045651316642761],
        ['pw-change-submitRecovery', 1.8863883018493652],
        ['pw-change-formTextMFA', -0.9335706233978271],
        ['pw-change-formAttrsMFA', -0.4494941234588623],
        ['pw-change-inputsMFA', -0.6711286902427673],
        ['pw-change-newsletterForm', -0.019143424928188324],
        ['pw-change-searchForm', -1.2415826320648193],
        ['pw-change-multiStepForm', -1.0409560203552246],
        ['pw-change-multiAuthForm', -0.5651557445526123],
        ['pw-change-multiStepForm,multiAuthForm', -0.23806244134902954],
        ['pw-change-visibleRatio,fieldsCount', -0.6329886317253113],
        ['pw-change-visibleRatio,identifierCount', -1.141250729560852],
        ['pw-change-visibleRatio,passwordCount', -0.2569584548473358],
        ['pw-change-visibleRatio,hiddenIdentifierCount', -0.28805801272392273],
        ['pw-change-visibleRatio,hiddenPasswordCount', -0.2405938059091568],
        ['pw-change-visibleRatio,multiAuthForm', -0.42184409499168396],
        ['pw-change-visibleRatio,multiStepForm', -2.417726993560791],
        ['pw-change-identifierRatio,fieldsCount', -1.0414071083068848],
        ['pw-change-identifierRatio,identifierCount', -1.0847856998443604],
        ['pw-change-identifierRatio,passwordCount', -1.8358491659164429],
        ['pw-change-identifierRatio,hiddenIdentifierCount', -0.333987295627594],
        ['pw-change-identifierRatio,hiddenPasswordCount', -0.483875036239624],
        ['pw-change-identifierRatio,multiAuthForm', -0.35559818148612976],
        ['pw-change-identifierRatio,multiStepForm', -0.8042961955070496],
        ['pw-change-passwordRatio,fieldsCount', 1.7951627969741821],
        ['pw-change-passwordRatio,identifierCount', -1.5206326246261597],
        ['pw-change-passwordRatio,passwordCount', 2.680701732635498],
        ['pw-change-passwordRatio,hiddenIdentifierCount', -1.5010206699371338],
        ['pw-change-passwordRatio,hiddenPasswordCount', -0.07956588268280029],
        ['pw-change-passwordRatio,multiAuthForm', -0.22080112993717194],
        ['pw-change-passwordRatio,multiStepForm', -0.3683548867702484],
        ['pw-change-requiredRatio,fieldsCount', -0.7244285941123962],
        ['pw-change-requiredRatio,identifierCount', -1.4329835176467896],
        ['pw-change-requiredRatio,passwordCount', 0.910696804523468],
        ['pw-change-requiredRatio,hiddenIdentifierCount', -1.0904970169067383],
        ['pw-change-requiredRatio,hiddenPasswordCount', -0.8216414451599121],
        ['pw-change-requiredRatio,multiAuthForm', -0.2252677083015442],
        ['pw-change-requiredRatio,multiStepForm', -0.16383366286754608],
    ],
    bias: -1.236087441444397,
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
        ['recovery-fieldsCount', 3.4701356887817383],
        ['recovery-inputCount', 0.5000748038291931],
        ['recovery-fieldsetCount', 5.1341633796691895],
        ['recovery-textCount', 0.34025031328201294],
        ['recovery-textareaCount', -8.67773151397705],
        ['recovery-selectCount', -3.9727067947387695],
        ['recovery-disabledCount', -0.11002977937459946],
        ['recovery-radioCount', -2.639631748199463],
        ['recovery-readOnlyCount', 7.7245073318481445],
        ['recovery-formComplexity', -7.2307915687561035],
        ['recovery-identifierCount', -1.1033483743667603],
        ['recovery-hiddenIdentifierCount', -3.82887864112854],
        ['recovery-usernameCount', 2.043879747390747],
        ['recovery-emailCount', 0.18247854709625244],
        ['recovery-hiddenCount', 4.063638210296631],
        ['recovery-hiddenPasswordCount', -4.146700859069824],
        ['recovery-submitCount', 0.2963066101074219],
        ['recovery-identitiesCount', -3.8321423530578613],
        ['recovery-ccsCount', -0.5193601250648499],
        ['recovery-hasTels', -0.6439138054847717],
        ['recovery-hasOAuth', -3.5844459533691406],
        ['recovery-hasCaptchas', 8.0313081741333],
        ['recovery-hasFiles', -14.992290496826172],
        ['recovery-hasDate', -4432456535141682e-21],
        ['recovery-hasNumber', -0.5468257069587708],
        ['recovery-oneVisibleField', 1.0310453176498413],
        ['recovery-twoVisibleFields', -5.571305274963379],
        ['recovery-threeOrMoreVisibleFields', -3.0454211235046387],
        ['recovery-noPasswords', 0.3016546070575714],
        ['recovery-onePassword', -5.5829057693481445],
        ['recovery-twoPasswords', -2.923154830932617],
        ['recovery-threeOrMorePasswords', -0.17920371890068054],
        ['recovery-noIdentifiers', -5.585626125335693],
        ['recovery-oneIdentifier', -1.5657724142074585],
        ['recovery-twoIdentifiers', 3.457118034362793],
        ['recovery-threeOrMoreIdentifiers', -2.0953385829925537],
        ['recovery-autofocusedIsIdentifier', 1.078244924545288],
        ['recovery-autofocusedIsPassword', -0.02365255542099476],
        ['recovery-visibleRatio', -1.5474544763565063],
        ['recovery-inputRatio', -2.9765820503234863],
        ['recovery-hiddenRatio', 1.3639293909072876],
        ['recovery-identifierRatio', -3.7135040760040283],
        ['recovery-emailRatio', 7.168995380401611],
        ['recovery-usernameRatio', 1.001105546951294],
        ['recovery-passwordRatio', -4.475710391998291],
        ['recovery-disabledRatio', -0.14358991384506226],
        ['recovery-requiredRatio', -0.46395444869995117],
        ['recovery-checkboxRatio', -14.895898818969727],
        ['recovery-hiddenIdentifierRatio', 0.1909053474664688],
        ['recovery-hiddenPasswordRatio', -7.181048393249512],
        ['recovery-pageLogin', 0.47614195942878723],
        ['recovery-formTextLogin', -41961211536545306e-21],
        ['recovery-formAttrsLogin', 1.4481360912322998],
        ['recovery-headingsLogin', -0.7938364148139954],
        ['recovery-layoutLogin', 0.0681312084197998],
        ['recovery-rememberMeCheckbox', -1.626459002494812],
        ['recovery-troubleLink', 3.3516154289245605],
        ['recovery-submitLogin', 0.45002084970474243],
        ['recovery-pageRegister', -1.5460036993026733],
        ['recovery-formTextRegister', -0.003045749617740512],
        ['recovery-formAttrsRegister', -3.4983348846435547],
        ['recovery-headingsRegister', -0.5829151272773743],
        ['recovery-layoutRegister', -12.054293632507324],
        ['recovery-pwNewRegister', -1.1756473779678345],
        ['recovery-pwConfirmRegister', -1.0218318700790405],
        ['recovery-submitRegister', -0.9856029152870178],
        ['recovery-TOSRef', -6.50254487991333],
        ['recovery-pagePwReset', -2.3633453845977783],
        ['recovery-formTextPwReset', -4209546659694752e-21],
        ['recovery-formAttrsPwReset', 1.9408674240112305],
        ['recovery-headingsPwReset', 4.62256383895874],
        ['recovery-layoutPwReset', 0.035143040120601654],
        ['recovery-pageRecovery', 5.9564619064331055],
        ['recovery-formTextRecovery', -342330694873058e-50],
        ['recovery-formAttrsRecovery', 3.671081781387329],
        ['recovery-headingsRecovery', 5.361715316772461],
        ['recovery-layoutRecovery', 2.2404119968414307],
        ['recovery-identifierRecovery', 7.57396125793457],
        ['recovery-submitRecovery', 7.691378116607666],
        ['recovery-formTextMFA', 0.3870577812194824],
        ['recovery-formAttrsMFA', 2.013308048248291],
        ['recovery-inputsMFA', -3.4467923641204834],
        ['recovery-newsletterForm', -4.818905830383301],
        ['recovery-searchForm', 2.974923610687256],
        ['recovery-multiStepForm', -2.66239070892334],
        ['recovery-multiAuthForm', -2.0097339153289795],
        ['recovery-multiStepForm,multiAuthForm', -1.2289559841156006],
        ['recovery-visibleRatio,fieldsCount', 0.9498628377914429],
        ['recovery-visibleRatio,identifierCount', -1.10765540599823],
        ['recovery-visibleRatio,passwordCount', -3.0817158222198486],
        ['recovery-visibleRatio,hiddenIdentifierCount', -1.112876057624817],
        ['recovery-visibleRatio,hiddenPasswordCount', -0.8386266827583313],
        ['recovery-visibleRatio,multiAuthForm', -1.8145699501037598],
        ['recovery-visibleRatio,multiStepForm', 0.3509717881679535],
        ['recovery-identifierRatio,fieldsCount', 5.669144630432129],
        ['recovery-identifierRatio,identifierCount', -3.893160581588745],
        ['recovery-identifierRatio,passwordCount', -5.075725078582764],
        ['recovery-identifierRatio,hiddenIdentifierCount', 2.5778231620788574],
        ['recovery-identifierRatio,hiddenPasswordCount', -4.381852626800537],
        ['recovery-identifierRatio,multiAuthForm', -2.269550323486328],
        ['recovery-identifierRatio,multiStepForm', 4.7331061363220215],
        ['recovery-passwordRatio,fieldsCount', -3.107738494873047],
        ['recovery-passwordRatio,identifierCount', -4.237580299377441],
        ['recovery-passwordRatio,passwordCount', -3.709925413131714],
        ['recovery-passwordRatio,hiddenIdentifierCount', -1.1334744691848755],
        ['recovery-passwordRatio,hiddenPasswordCount', -27414287615101784e-21],
        ['recovery-passwordRatio,multiAuthForm', -0.26481735706329346],
        ['recovery-passwordRatio,multiStepForm', 0.13985475897789001],
        ['recovery-requiredRatio,fieldsCount', -4.39854621887207],
        ['recovery-requiredRatio,identifierCount', -1.338199257850647],
        ['recovery-requiredRatio,passwordCount', -1.1263242959976196],
        ['recovery-requiredRatio,hiddenIdentifierCount', -7.788489818572998],
        ['recovery-requiredRatio,hiddenPasswordCount', -0.0005594331305474043],
        ['recovery-requiredRatio,multiAuthForm', -0.21975822746753693],
        ['recovery-requiredRatio,multiStepForm', -1.7697635889053345],
    ],
    bias: -2.3783442974090576,
    cutoff: 0.45,
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
        ['register-fieldsCount', -0.7715223431587219],
        ['register-inputCount', 1.8207522630691528],
        ['register-fieldsetCount', 10.955631256103516],
        ['register-textCount', 2.1035258769989014],
        ['register-textareaCount', 3.086559295654297],
        ['register-selectCount', 0.6930644512176514],
        ['register-disabledCount', -6.419006824493408],
        ['register-radioCount', -6.421346187591553],
        ['register-readOnlyCount', -5.664778709411621],
        ['register-formComplexity', -0.39992430806159973],
        ['register-identifierCount', 1.7410306930541992],
        ['register-hiddenIdentifierCount', 3.7076306343078613],
        ['register-usernameCount', 1.8058438301086426],
        ['register-emailCount', 5.335700035095215],
        ['register-hiddenCount', -9.317770004272461],
        ['register-hiddenPasswordCount', 3.988396644592285],
        ['register-submitCount', -2.718926429748535],
        ['register-identitiesCount', -1.9683053493499756],
        ['register-ccsCount', -17.03114891052246],
        ['register-hasTels', 5.3319926261901855],
        ['register-hasOAuth', -3.032442092895508],
        ['register-hasCaptchas', 2.9334211349487305],
        ['register-hasFiles', -5.4316325187683105],
        ['register-hasDate', -0.320650577545166],
        ['register-hasNumber', 8.085457801818848],
        ['register-oneVisibleField', 0.1659514456987381],
        ['register-twoVisibleFields', -1.4551373720169067],
        ['register-threeOrMoreVisibleFields', -1.1442583799362183],
        ['register-noPasswords', -5.661530017852783],
        ['register-onePassword', 2.371299982070923],
        ['register-twoPasswords', 5.624139785766602],
        ['register-threeOrMorePasswords', -0.9818815588951111],
        ['register-noIdentifiers', -3.779933214187622],
        ['register-oneIdentifier', -4.8304524421691895],
        ['register-twoIdentifiers', 3.5450010299682617],
        ['register-threeOrMoreIdentifiers', 4.481414318084717],
        ['register-autofocusedIsIdentifier', 1.3410214185714722],
        ['register-autofocusedIsPassword', 13.638496398925781],
        ['register-visibleRatio', 0.7752816081047058],
        ['register-inputRatio', -3.2322633266448975],
        ['register-hiddenRatio', 6.337962627410889],
        ['register-identifierRatio', 1.5590029954910278],
        ['register-emailRatio', 7.062351226806641],
        ['register-usernameRatio', -2.9871866703033447],
        ['register-passwordRatio', -7.59958553314209],
        ['register-disabledRatio', -2.934109687805176],
        ['register-requiredRatio', -2.517669439315796],
        ['register-checkboxRatio', 3.457488775253296],
        ['register-hiddenIdentifierRatio', -14.188441276550293],
        ['register-hiddenPasswordRatio', 5.382781028747559],
        ['register-pageLogin', -5.226663589477539],
        ['register-formTextLogin', -1.8237861354464258e-7],
        ['register-formAttrsLogin', -5.16132116317749],
        ['register-headingsLogin', -4.926670074462891],
        ['register-layoutLogin', 2.855076789855957],
        ['register-rememberMeCheckbox', -9.043022155761719],
        ['register-troubleLink', -9.320005416870117],
        ['register-submitLogin', -3.3887908458709717],
        ['register-pageRegister', 7.236118316650391],
        ['register-formTextRegister', 0.0008053844794631004],
        ['register-formAttrsRegister', 4.244743347167969],
        ['register-headingsRegister', 4.385275840759277],
        ['register-layoutRegister', 1.1564441919326782],
        ['register-pwNewRegister', 4.3144073486328125],
        ['register-pwConfirmRegister', 11.2562894821167],
        ['register-submitRegister', 9.583317756652832],
        ['register-TOSRef', 3.3543901443481445],
        ['register-pagePwReset', -3.037680149078369],
        ['register-formTextPwReset', -8860824891598895e-20],
        ['register-formAttrsPwReset', -3.4295077323913574],
        ['register-headingsPwReset', -3.9291999340057373],
        ['register-layoutPwReset', -9.16280746459961],
        ['register-pageRecovery', -1.391419529914856],
        ['register-formTextRecovery', -2223779140944024e-51],
        ['register-formAttrsRecovery', -2.7384912967681885],
        ['register-headingsRecovery', -3.632072925567627],
        ['register-layoutRecovery', 1.5803401470184326],
        ['register-identifierRecovery', 1.4052228927612305],
        ['register-submitRecovery', -9.401165962219238],
        ['register-formTextMFA', -3.2062761783599854],
        ['register-formAttrsMFA', -2.714632511138916],
        ['register-inputsMFA', -8.042412757873535],
        ['register-newsletterForm', -14.632294654846191],
        ['register-searchForm', -4.439837455749512],
        ['register-multiStepForm', 5.754843235015869],
        ['register-multiAuthForm', 11.412175178527832],
        ['register-multiStepForm,multiAuthForm', 1.806281328201294],
        ['register-visibleRatio,fieldsCount', -2.1616830825805664],
        ['register-visibleRatio,identifierCount', -2.615250587463379],
        ['register-visibleRatio,passwordCount', -3.9927444458007812],
        ['register-visibleRatio,hiddenIdentifierCount', -0.9703884124755859],
        ['register-visibleRatio,hiddenPasswordCount', -5.256988048553467],
        ['register-visibleRatio,multiAuthForm', -7.544736862182617],
        ['register-visibleRatio,multiStepForm', 5.781548976898193],
        ['register-identifierRatio,fieldsCount', -0.3426927328109741],
        ['register-identifierRatio,identifierCount', -0.9977250695228577],
        ['register-identifierRatio,passwordCount', 7.134419918060303],
        ['register-identifierRatio,hiddenIdentifierCount', 5.294583320617676],
        ['register-identifierRatio,hiddenPasswordCount', -3.99853253364563],
        ['register-identifierRatio,multiAuthForm', 1.5212640762329102],
        ['register-identifierRatio,multiStepForm', -5.18511962890625],
        ['register-passwordRatio,fieldsCount', 5.625852108001709],
        ['register-passwordRatio,identifierCount', 3.4375877380371094],
        ['register-passwordRatio,passwordCount', -4.2791428565979],
        ['register-passwordRatio,hiddenIdentifierCount', 4.266729831695557],
        ['register-passwordRatio,hiddenPasswordCount', -0.8004656434059143],
        ['register-passwordRatio,multiAuthForm', 1.4518039226531982],
        ['register-passwordRatio,multiStepForm', 1.2880791425704956],
        ['register-requiredRatio,fieldsCount', -3.580711841583252],
        ['register-requiredRatio,identifierCount', -0.3475106656551361],
        ['register-requiredRatio,passwordCount', 1.1550055742263794],
        ['register-requiredRatio,hiddenIdentifierCount', 0.3001369535923004],
        ['register-requiredRatio,hiddenPasswordCount', -0.6879881620407104],
        ['register-requiredRatio,multiAuthForm', -4.5414581298828125],
        ['register-requiredRatio,multiStepForm', 3.5315074920654297],
    ],
    bias: -2.219365358352661,
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
        ['email-isCC', -2.2002267837524414],
        ['email-isIdentity', -4.431686878204346],
        ['email-autocompleteEmail', 3.3659348487854004],
        ['email-autocompleteOff', -0.9760997295379639],
        ['email-typeEmail', 9.599180221557617],
        ['email-exactAttrEmail', 8.049196243286133],
        ['email-attrEmail', 2.1345481872558594],
        ['email-textEmail', 4.984194755554199],
        ['email-labelEmail', 11.875850677490234],
        ['email-placeholderEmail', 6.982718467712402],
        ['email-searchField', -8.134305953979492],
        ['email-mfaOutlier', -10.277375221252441],
    ],
    bias: -6.5456414222717285,
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
    const { fieldAttrs, fieldText, labelText, prevField, nextField, type, maxLength, searchField } = fieldFeatures;
    const form = fieldFeatures?.formFnode?.element;
    const formFeatures = fieldFeatures.formFeatures;
    const searchForm = formFeatures?.searchForm === 1;
    const formComplexity = formFeatures?.formComplexity ?? 0;
    const formMFA = Boolean(formFeatures?.formMFA);
    const formAuthenticator = Boolean(formFeatures?.formTextAuthenticator);
    const formOTPOutlier = Boolean(formFeatures?.formOTPOutlier);
    const outlierLink = Boolean(formFeatures?.linkOTPOutlier);
    const formInputMFACandidates = formFeatures?.formInputMFACandidates ?? 0;
    const outlierHeadings = Boolean(formFeatures?.headingsOTPOutlier);
    const isNumeric = field.inputMode === 'numeric';
    const patternOTP = !isNumeric && OTP_PATTERNS.some((pattern) => field.pattern?.trim() === pattern);
    const exactNames = ['code', 'token', 'otp', 'otc', 'totp'];
    const nameMatch = exactNames.some((match) => field.name === match);
    const idMatch = exactNames.some((match) => field.id === match);
    const autocomplete = fieldFeatures.autocomplete;
    const autocompleteOff = autocomplete !== undefined && (autocomplete === 'off' || autocomplete === 'false');
    const maxLen = maxLength ? parseInt(maxLength, 10) : null;
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
    const siblingOfInterest = similarBefore || similarAfter;
    const attrOTP = any(matchOtpAttr)(fieldAttrs);
    const attrMFA = any(matchTwoFa)(fieldAttrs);
    const attrOutlier = any(matchOtpFieldOutlier)(fieldAttrs);
    const textOTP = matchOtpAttr(fieldText);
    const textMFA = matchTwoFa(fieldText);
    const textAuthenticator = matchAuthenticator(fieldText);
    const labelOTP = matchOtpAttr(labelText);
    const labelMFA = matchTwoFa(labelText);
    const labelAuthenticator = matchAuthenticator(labelText);
    const labelOutlier = matchOtpFieldOutlier(labelText);
    const mfa = formMFA || labelMFA || textMFA || attrMFA;
    const otp = attrOTP || textOTP || labelOTP;
    const outlierCandidate = mfa || otp;
    const outlierMaxLength = Boolean(maxLen && (maxLen > 20 || (maxLen > 1 && maxLen < 5)));
    const outlierInputCount = !(
        formInputMFACandidates === 1 ||
        formInputMFACandidates === 6 ||
        formInputMFACandidates === 5
    );
    const outlierEmailMatch = outlierCandidate ? ((form?.innerText ?? '').match(/[a-z0-9*._-]@/gi)?.length ?? 0) : 0;
    const outlierAutocomplete =
        outlierCandidate && autocomplete !== undefined && !autocompleteOff && !autocomplete?.includes('one-time-code');
    const outlierForm = formOTPOutlier;
    const outlierField = attrOutlier || labelOutlier || /\:\/\//.test(field.placeholder);
    return {
        outlierForm: boolInt(outlierForm),
        outlierField: boolInt(outlierField),
        outlierSearch: boolInt(searchField || searchForm),
        outlierLink: boolInt(outlierLink),
        outlierHeadings: boolInt(outlierHeadings),
        outlierAutocomplete: boolInt(outlierAutocomplete),
        outlierEmailMatch: linearScale(outlierEmailMatch, 0, 2),
        outlierInputCount: boolInt(outlierInputCount),
        outlierMaxLength: boolInt(outlierMaxLength),
        formComplexity,
        nameMatch: boolInt(nameMatch),
        idMatch: boolInt(idMatch),
        numericMode: boolInt(isNumeric),
        patternOTP: boolInt(patternOTP),
        autocompleteOTC: boolInt(fieldFeatures.autocomplete?.includes('one-time-code') ?? false),
        singleInput: boolInt(singleInput),
        siblingOfInterest: boolInt(siblingOfInterest),
        attrOTP: boolInt(attrOTP),
        textOTP: boolInt(textOTP),
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
    'labelOTP',
    'attrMFA',
    'textMFA',
    'labelMFA',
    'textAuthenticator',
    'labelAuthenticator',
    'singleInput',
    'siblingOfInterest',
    'outlierAutocomplete',
    'outlierEmailMatch',
    'outlierEmailMatch',
    'outlierField',
    'outlierForm',
    'outlierHeadings',
    'outlierInputCount',
    'outlierLink',
    'outlierMaxLength',
    'outlierSearch',
    'formComplexity',
];

const results$4 = {
    coeffs: [
        ['otp-isCC', -2.929464340209961],
        ['otp-isIdentity', -4.154420852661133],
        ['otp-numericMode', -0.02600262686610222],
        ['otp-nameMatch', -0.3730376958847046],
        ['otp-idMatch', 6.889358997344971],
        ['otp-autocompleteOTC', 3.829261064529419],
        ['otp-patternOTP', 4.223550319671631],
        ['otp-formMFA', 1.5497925281524658],
        ['otp-formAuthenticator', 9.33846664428711],
        ['otp-attrOTP', 1.0678033828735352],
        ['otp-labelOTP', 0.7168673872947693],
        ['otp-attrMFA', 4.815592288970947],
        ['otp-textMFA', 1.4641892910003662],
        ['otp-labelMFA', 8.614002227783203],
        ['otp-textAuthenticator', 0.2684760093688965],
        ['otp-labelAuthenticator', 3.1353793144226074],
        ['otp-singleInput', 0.4276081621646881],
        ['otp-siblingOfInterest', 1.475947618484497],
        ['otp-outlierAutocomplete', -2.760652780532837],
        ['otp-outlierEmailMatch', -4.065969944000244],
        ['otp-outlierField', -6.717183589935303],
        ['otp-outlierForm', 3.0605452060699463],
        ['otp-outlierHeadings', -7.805499076843262],
        ['otp-outlierInputCount', -5.956521034240723],
        ['otp-outlierLink', -3.424076795578003],
        ['otp-outlierMaxLength', -10.43444538116455],
        ['otp-outlierSearch', -8.506669044494629],
        ['otp-formComplexity', -4.375076770782471],
    ],
    bias: -5.147384166717529,
    cutoff: 0.5,
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
        ['password-isCC', -2.5495009422302246],
        ['password-isIdentity', -10181612765790474e-51],
        ['password-loginScore', 6.993308067321777],
        ['password-registerScore', -9.175145149230957],
        ['password-exotic', -6.185561180114746],
        ['password-passwordOutlier', -6.965709209442139],
        ['password-autocompleteNew', -6.353390693664551],
        ['password-autocompleteCurrent', 1.4170660972595215],
        ['password-autocompleteOTP', -1.9464401006698608],
        ['password-autocompleteOff', -1.9457998275756836],
        ['password-attrCurrent', 2.355036497116089],
        ['password-textCurrent', 0.5146738886833191],
        ['password-labelCurrent', 2.8623030185699463],
        ['password-attrCreate', -1.1767674684524536],
        ['password-textCreate', -4.579235076904297],
        ['password-labelCreate', -5.083735942840576],
        ['password-attrConfirm', -2.8481342792510986],
        ['password-textConfirm', -0.8153501152992249],
        ['password-labelConfirm', -1.5052801370620728],
        ['password-attrReset', 0.10526452213525772],
        ['password-prevPwField', -5.77263069152832],
        ['password-prevPwNew', -2.933677911758423],
        ['password-prevPwCurrent', -1.4287481307983398],
        ['password-nextPwField', -2.4062392711639404],
        ['password-nextPwNew', 3.570892572402954],
        ['password-nextPwCurrent', -0.0007760280859656632],
        ['password-nextPwConfirm', -5.148987770080566],
        ['password-prevPwCurrent,nextPwNew', -1.3357259035110474],
        ['password-registerScore,maybeCurrent', -0.0903702899813652],
        ['password-registerScore,autocompleteCurrent', -2.2388575077056885],
        ['password-loginScore,maybeNew', 1.47178053855896],
        ['password-loginScore,autocompleteNew', 2.025840997695923],
    ],
    bias: 3.2924163341522217,
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
        ['new-password-isCC', -7.740285396575928],
        ['new-password-isIdentity', -8185413485286916e-49],
        ['new-password-loginScore', -7.903318881988525],
        ['new-password-registerScore', 6.802002429962158],
        ['new-password-exotic', 3.008633852005005],
        ['new-password-passwordOutlier', -14.248550415039062],
        ['new-password-autocompleteNew', 4.15820837020874],
        ['new-password-autocompleteCurrent', -1.7635936737060547],
        ['new-password-autocompleteOTP', -6.369772911071777],
        ['new-password-autocompleteOff', -0.10867024958133698],
        ['new-password-attrCurrent', -1.635484218597412],
        ['new-password-textCurrent', -0.6979192495346069],
        ['new-password-labelCurrent', -2.8386106491088867],
        ['new-password-attrCreate', 0.6915404200553894],
        ['new-password-textCreate', 5.144122123718262],
        ['new-password-labelCreate', 4.53665828704834],
        ['new-password-attrConfirm', 2.102309226989746],
        ['new-password-textConfirm', 0.7633639574050903],
        ['new-password-labelConfirm', 1.526360034942627],
        ['new-password-attrReset', -0.08488034456968307],
        ['new-password-prevPwField', 4.362738132476807],
        ['new-password-prevPwNew', 2.251995325088501],
        ['new-password-prevPwCurrent', 1.7774150371551514],
        ['new-password-nextPwField', -1.458757758140564],
        ['new-password-nextPwNew', -2.0089409351348877],
        ['new-password-nextPwCurrent', 0.023229876533150673],
        ['new-password-nextPwConfirm', 6.01061487197876],
        ['new-password-prevPwCurrent,nextPwNew', 1.8332372903823853],
        ['new-password-registerScore,maybeCurrent', 0.042782533913850784],
        ['new-password-registerScore,autocompleteCurrent', 2.1488101482391357],
        ['new-password-loginScore,maybeNew', -2.857759714126587],
        ['new-password-loginScore,autocompleteNew', -1.9657737016677856],
    ],
    bias: -0.2838660180568695,
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
    const { fieldAttrs, fieldText, labelText, prevInput, isFormLogin } = fieldFeatures;
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
    const firstFormField = prevInput === null;
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
        ['username-isCC', -2.682265281677246],
        ['username-isIdentity', -1.7206202745437622],
        ['username-autocompleteUsername', 1.4985052347183228],
        ['username-autocompleteEmail', -0.11175209283828735],
        ['username-autocompleteOff', -0.6316365003585815],
        ['username-attrUsername', 12.237555503845215],
        ['username-textUsername', 11.308667182922363],
        ['username-labelUsername', 12.168246269226074],
        ['username-outlierText', -1.4085276126861572],
        ['username-outlierAttrs', -1.6555830240249634],
        ['username-outlierLabel', -0.9621310234069824],
        ['username-outlierEmail', -3.092839241027832],
        ['username-firstLoginFormField', 13.208979606628418],
        ['username-searchField', -8.131026268005371],
    ],
    bias: -6.47932767868042,
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
    const attrMatch = field.matches('[name="username"],[id="username"],[name="account"]');
    const autocompleteUsername = Boolean(autocomplete?.includes('username'));
    const autocompleteEmail = Boolean(autocomplete?.includes('email'));
    const autocompleteAccount = Boolean(autocomplete?.includes('account'));
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
        autocompleteAccount: boolInt(autocompleteAccount),
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
        ['username-hidden-isCC', -12113167950001904e-51],
        ['username-hidden-isIdentity', 11343998317001021e-51],
        ['username-hidden-exotic', -3.251591920852661],
        ['username-hidden-visibleReadonly', 4.167017936706543],
        ['username-hidden-attrUsername', 8.807610511779785],
        ['username-hidden-attrEmail', 7.067584991455078],
        ['username-hidden-attrMatch', 10.075766563415527],
        ['username-hidden-autocompleteUsername', 1.1107741594314575],
        ['username-hidden-autocompleteEmail', 1.69227933883667],
        ['username-hidden-valueEmail', 9.678967475891113],
        ['username-hidden-valueTel', 0.0941505879163742],
        ['username-hidden-valueUsername', -0.07830581068992615],
    ],
    bias: -12.296631813049316,
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
    const prevInput = typeValid ? (formFeatures?.formInputIterator.prev(field, 'INPUT') ?? null) : null;
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
        prevInput,
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
        return candidate.querySelectorAll(kButtonSelector).length === 0;
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
    const domGroups = Array.from(doc.querySelectorAll(kDomClusterSelector)).filter((el) => el !== document.body);
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
    getFormComplexity,
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
    isEditorFrame,
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
    kButtonSelector,
    kButtonSubmitSelector,
    kCaptchaSelector,
    kDomClusterSelector,
    kDomDialogSelector,
    kDomGroupSelector,
    kEditorElements,
    kEditorPatterns,
    kEditorSelector,
    kEmailSelector,
    kFieldLabelSelector,
    kFieldSelector,
    kHeadingSelector,
    kHiddenUsernameSelector,
    kInputIteratorSelector,
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
