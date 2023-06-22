import { clusters as clusters$1, dom, domQuery, out, rule, ruleset, score, type, utils } from './fathom.js';
import * as fathomWeb from './fathom.js';

export { fathomWeb as fathom };

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

const FIELD_ATTRIBUTES = [EL_ATTRIBUTES, 'name', 'value'].flat();

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

const setInputType = (input, type) => input.setAttribute(DETECTED_FIELD_TYPE_ATTR, type);

const setFormType = (form, type) => form.setAttribute(DETECTED_FORM_TYPE_ATTR, type);

const setClusterType = (el) => el.setAttribute(DETECTED_CLUSTER_ATTR, '');

const setIgnoreType = (el) => el.setAttribute(IGNORE_ELEMENT_ATTR, '');

const boolInt = (val) => Number(val);

const safeInt = (val, fallback = 0) => (Number.isFinite(val) ? val : fallback);

const featureScore = (noteFor, key) =>
    score((fnode) => {
        const features = fnode.noteFor(noteFor);
        return features[key];
    });

const getParentFnodeForm = (fieldFnode) => {
    const field = fieldFnode.element;
    const ruleset = fieldFnode._ruleset;
    const parentForms = ruleset.get('form');
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

const usePredetectedAttr = (attr) => (typeAttrValue) =>
    rule(dom(`[${attr}="${typeAttrValue}"]`), out(typeAttrValue), {});

const usePreDetectedCluster = (typeOut) =>
    rule(dom(`[${DETECTED_CLUSTER_ATTR}]:not([${DETECTED_FORM_TYPE_ATTR}])`), type(typeOut), {});

const usePreDetectedForm = usePredetectedAttr(DETECTED_FORM_TYPE_ATTR);

const usePreDetectedField = usePredetectedAttr(DETECTED_FIELD_TYPE_ATTR);

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

const getLabelFor = (el) => {
    var _a;
    const forId = (_a = el.getAttribute('id')) !== null && _a !== void 0 ? _a : el.getAttribute('name');
    const label = document.querySelector(`label[for="${forId}"]`);
    if (label) return label;
    const closest = el.closest('label');
    if (closest) return closest;
    const parent = el.parentElement;
    const parentLabels = parent.querySelectorAll('label');
    if (parentLabels.length === 1) return parentLabels[0];
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

const MAX_FORM_FIELD_WALK_UP = 3;

const MAX_FORM_HEADING_WALK_UP = 3;

const MAX_HEADING_HORIZONTAL_DIST = 75;

const MAX_HEADING_VERTICAL_DIST = 150;

const MIN_AREA_SUBMIT_BTN = 3500;

const MIN_FIELD_HEIGHT = 15;

const MIN_FIELD_WIDTH = 50;

const OTP_PATTERNS = ['d*', 'd{6}', '[0-9]*', '[0-9]{6}', '([0-9]{6})|([0-9a-fA-F]{5}-?[0-9a-fA-F]{5})'];

const kUsernameSelector = ['input[type="search"][name="loginName"]', 'input[type="username"]'];

const kEmailSelector = ['input[name="email"]', 'input[id="email"]'];

const kPasswordSelector = ['input[type="text"][id="password"]'];

const formOfInterestSelector = `form:not([role="search"]):not(body > form:only-of-type)`;

const headingSelector = [
    ...[1, 2, 3, 4, 5].flatMap((level) => [`h${level}, [aria-level="${level}"]`]),
    '[role="heading"]',
    '[class*="title"]',
    '[name="title"]',
].join(',');

const fieldSelector = 'input, select, textarea';

const editableFieldSelector = [
    'input[type="email"]',
    'input[type="text"]:not([aria-autocomplete="list"])',
    'input[type="number"]',
    'input[type="tel"]',
    'input[type="password"]',
    'input[autocomplete="one-time-code"]',
    'input[type=""]',
    'input:not([type])',
    ...kUsernameSelector,
].join(',');

const fieldOfInterestSelector = `${editableFieldSelector}, input[type="hidden"]:not([value=""]`;

const buttonSubmitSelector = [
    'button:not([type])',
    'button[type="submit"]',
    'button[type="button"]',
    'button[name="submit"]',
    'button[jsaction]',
    'a[role="submit"]',
    'a[role="button"]',
    'div[role="button"]',
    'div[role="submit"]',
].join(',');

const anchorLinkSelector = `a, span[role="button"]`;

const captchaSelector = `[class*="captcha"], [id*="captcha"], [name*="captcha"]`;

const socialSelector = `[class*=social],[aria-label*=with]`;

const clusterSelector = `[role="dialog"], [role="group"], [role="form"], [id*="modal"], [class*="modal"], header, section, nav, footer, aside`;

const layoutSelector = `div, section, aside, main, nav`;

const usernameSelector = `input[type="text"], input[type=""], input:not([type]), ${kUsernameSelector.join(',')}`;

const passwordSelector = `input[type="password"], ${kPasswordSelector.join(',')}`;

const hiddenUsernameSelector = 'input[type="email"], input[type="text"], input[type="hidden"]';

const otpSelector = 'input[type="tel"], input[type="number"], input[type="text"], input:not([type])';

const LOGIN_RE =
    /(?:(?:n(?:ouvelleses|uevase|ewses)s|iniciarses|connex)io|anmeldedate|sign[io])n|in(?:iciarsessao|troduce)|a(?:uthenticate|nmeld(?:ung|en))|authentifier|s(?:econnect|identifi)er|novasessao|(?:introduci|conecta|entr[ae])r|connect|acceder|login/i;

const REGISTER_RE =
    /kontoerstellen|cr(?:ea(?:teaccount|rcuenta)|iarconta)|(?:nouveaucompt|creeruncompt|s?inscrir|unirs)e|re(?:gist(?:r(?:ieren|arse|ar)|er)|joindre)|nuevacuenta|neueskonto|getstarted|newaccount|novaconta|(?:com(?:mence|eca)|(?:empez|junt)a)r|signup|join/i;

const RECOVERY_RE =
    /(?:wiederherstell|zurucksetz)en|re(?:(?:initialis|stablec)er|(?:defini|staur[ae])r|c(?:uper[ae]|ove)r|set)|problem|(?:troubl|restor|aid)e|a[jy]uda|h(?:ilfe|elp)/i;

const MULTI_STEP_RE =
    /p(?:rogres(?:s(?:ion|o)|o)|aso)|fortschritt|progress|s(?:chritt|t(?:age|ep))|review|etap[ae]|phase/i;

const TROUBLE_RE =
    /schwierigkeit|(?:difficult|troubl|oubli|hilf)e|i(?:nciden(?:cia|t)|ssue)|vergessen|esquecido|olvidado|needhelp|questao|problem|forgot|ayuda/i;

const PASSWORD_RE =
    /p(?:hrasesecrete|ass(?:(?:phras|cod)e|wor[dt]))|(?:c(?:havesecret|lavesecret|ontrasen)|deseguranc)a|(?:(?:zugangs|secret)cod|clesecret)e|codesecret|motdepasse|geheimnis|secret|senha|key/i;

const PASSWORD_OUTLIER_RE = /socialsecurity|nationalid/i;

const USERNAME_RE =
    /identi(?:fiant|ty)|u(?:tilisateur|s(?:ername|uario))|(?:identifi|benutz)er|(?:screen|nick)name|nutzername|(?:anmeld|handl)e|pseudo/i;

const USERNAME_ATTR_RE = /identifyemail|(?:custom|us)erid|loginname|a(?:cc(?:ountid|t)|ppleid)|loginid/i;

const USERNAME_OUTLIER_RE =
    /nom(?:defamill|br)e|(?:primeiro|sobre)nome|(?:middle|nach|vor)name|firstname|apellido|lastname|prenom/i;

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

const EMAIL_VALUE_RE = /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

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

const matchRecovery = or([test(RECOVERY_RE), andRe([TROUBLE_RE, PASSWORD_RE])]);

const matchMultiStep = test(MULTI_STEP_RE);

const matchStepAction = orRe([STEP_ACTION_RE, MULTI_STEP_RE]);

const matchOAuth = test(OAUTH_ATTR_RE);

const matchSearchAction = test(SEARCH_ACTION_RE);

const matchPasswordReset = and([andRe([PASSWORD_RE, RESET_ACTION_RE]), notRe(CONFIRM_ACTION_RE)]);

const matchPasswordResetAttr = and([matchPasswordReset, notRe(CONFIRM_ACTION_ATTR_END_RE)]);

const matchPasswordCreate = and([andRe([PASSWORD_RE, CREATE_ACTION_RE]), notRe(CONFIRM_ACTION_RE)]);

const matchPasswordCreateAttr = and([matchPasswordCreate, notRe(CONFIRM_ACTION_ATTR_END_RE)]);

const matchPasswordConfirm = and([andRe([PASSWORD_RE, CONFIRM_ACTION_RE]), notRe(CREATE_ACTION_ATTR_END_RE)]);

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
            if ((rect.width === 0 || rect.height === 0) && elementStyle.overflow === 'hidden') return false;
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
        if (el.offsetHeight === 0 || el.offsetHeight === 0) return false;
        if (el.offsetHeight < options.minHeight || el.offsetWidth < options.minWidth) return false;
        return true;
    };
    return withCache(cache)([el], check());
};

const isVisibleField = (field) => {
    if (field instanceof HTMLInputElement) {
        const { type, disabled, readOnly } = field;
        if (type === 'hidden' || disabled || readOnly) return false;
    }
    return [field, field.parentElement].every((el) =>
        quickVisibilityCheck(el, {
            minHeight: MIN_FIELD_HEIGHT,
            minWidth: MIN_FIELD_WIDTH,
        })
    );
};

const isVisibleEl = (el) =>
    quickVisibilityCheck(el, {
        minHeight: 0,
        minWidth: 0,
    });

const isFormOfInterest = (fnodeOrEl) => {
    const form = 'element' in fnodeOrEl ? fnodeOrEl.element : fnodeOrEl;
    if (form.getAttribute(DETECTED_FORM_TYPE_ATTR) !== null) return false;
    if (
        form.tagName !== 'FORM' &&
        !isVisible(form, {
            opacity: true,
        })
    )
        return false;
    const inputs = Array.from(form.querySelectorAll(editableFieldSelector)).filter((field) => !field.disabled);
    return (
        inputs.length > 0 &&
        inputs.some((input) =>
            isVisible(input, {
                opacity: false,
            })
        )
    );
};

const getFormParent = (form) =>
    walkUpWhile(form, MAX_FORM_FIELD_WALK_UP)((el) => el.querySelectorAll('form').length <= 1);

const createInputIterator = (form) => {
    const formEls = Array.from(form.querySelectorAll('input:not([type="hidden"]), select, textarea')).filter(
        isVisibleField
    );
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
    var _a;
    const fieldAttrs = getFieldAttributes(field);
    const fieldText = getNodeText(field);
    const labelText = getFieldLabelText(field);
    const fieldset = (_a = field.closest('fieldset')) !== null && _a !== void 0 ? _a : null;
    const fieldsetText = fieldset ? getTextAttributes(fieldset).join('') : '';
    return {
        fieldAttrs,
        fieldText,
        labelText,
        fieldsetText,
    };
};

const getAllFieldHaystacks = (field) => {
    const { fieldAttrs, fieldText, labelText, fieldsetText } = getFieldHaystacks(field);
    return [fieldText, labelText, fieldsetText, ...fieldAttrs];
};

const getNearestHeadingsText = (el) => {
    const originRect = el.getBoundingClientRect();
    const parent = walkUpWhile(
        el,
        MAX_FORM_HEADING_WALK_UP
    )((parentEl, candidate) => {
        if (parentEl === document.body) return false;
        if (candidate.matches(clusterSelector)) return false;
        return true;
    });
    const headings = Array.from(parent.querySelectorAll(headingSelector)).filter((heading) => {
        if (el.contains(heading)) return true;
        const headingRect = heading.getBoundingClientRect();
        const { dx, dy } = getRectMinDistance(originRect, headingRect);
        return dx < MAX_HEADING_HORIZONTAL_DIST && dy < MAX_HEADING_VERTICAL_DIST;
    });
    return sanitizeString(headings.map((el) => el.innerText).join(''));
};

const isFieldOfInterest = (fnodeOrEl) => {
    const field = 'element' in fnodeOrEl ? fnodeOrEl.element : fnodeOrEl;
    if (field.getAttribute(DETECTED_FIELD_TYPE_ATTR) !== null) return false;
    if (field.getAttribute(IGNORE_ELEMENT_ATTR) !== null) return false;
    if (field.matches(`[${IGNORE_ELEMENT_ATTR}] *`)) return false;
    return true;
};

const isUserEditableFNode = (fnode) => {
    const { visible, readonly, disabled } = fnode.noteFor('field');
    return visible && !readonly && !disabled;
};

const isUserEditableField = (el) => {
    if (el.getAttribute(IGNORE_ELEMENT_ATTR) !== null) return false;
    if (el.matches(`[${IGNORE_ELEMENT_ATTR}] *`)) return false;
    const { readOnly, disabled, offsetHeight } = el;
    return (
        !readOnly &&
        !disabled &&
        offsetHeight > MIN_FIELD_HEIGHT &&
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

const maybeEmail = (fnode) => ['email', 'text', '', null].includes(fnode.element.type) && isUserEditableFNode(fnode);

const maybePassword = (fnode) => fnode.element.getAttribute('type') === 'password' && isUserEditableFNode(fnode);

const maybeOTP = (fnode) => fnode.element.matches(otpSelector);

const maybeUsername = (fnode) => fnode.element.matches(usernameSelector) && isUserEditableFNode(fnode);

const maybeHiddenUsername = (fnode) => fnode.element.matches(hiddenUsernameSelector) && !isUserEditableFNode(fnode);

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
    const selects = visibleFields.filter((el) => el.matches('select'));
    const submits = visibleFields.filter((el) => el.matches('[type="submit"]'));
    const hiddenInputs = inputs.filter((el) => el.matches('[type="hidden"]'));
    const texts = visibleInputs.filter((el) => el.matches('[type="text"]'));
    const tels = inputs.filter((el) => el.matches('[type="tel"]'));
    const usernames = inputs.filter(isUsernameCandidate);
    const emails = inputs.filter(isEmailCandidate);
    const identifiers = uniqueNodes(usernames, emails, tels);
    const [visibleIdentifiers, hiddenIdentifiers] = splitFieldsByVisibility(identifiers);
    const passwords = inputs.filter((el) => el.matches(passwordSelector));
    const [visiblePasswords, hiddenPasswords] = splitFieldsByVisibility(passwords);
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
    const btns = Array.from(parent.querySelectorAll(buttonSubmitSelector));
    const submitBtns = btns.filter(isSubmitBtnCandidate);
    const btnCandidates = submits.concat(submitBtns);
    const anchors = Array.from(form.querySelectorAll(anchorLinkSelector)).filter(isVisibleEl);
    const socialEls = Array.from(parent.querySelectorAll(socialSelector));
    const oauths = socialEls.concat(submitBtns).filter(isOAuthCandidate);
    const layouts = Array.from(form.querySelectorAll(layoutSelector));
    const autofocusedIsIdentifier = Boolean(autofocused && identifiers.includes(autofocused));
    const autofocusedIsPassword = Boolean(autofocused && passwords.includes(autofocused));
    const pageDescriptionText = getPageDescriptionText(doc);
    const nearestHeadingsText = getNearestHeadingsText(form);
    const formTextAttrText = getFormText(form);
    const formAttributes = getFormAttributes(form);
    const identifierAttributes = identifiers.flatMap(getAllFieldHaystacks);
    const submitBtnHaystack = btnCandidates.flatMap(getAllFieldHaystacks);
    const checkboxesHaystack = checkboxes.flatMap(getAllFieldHaystacks);
    const anchorsHaystack = anchors.flatMap(getAllFieldHaystacks);
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
    const TOSCheckbox = any(matchTOS)(checkboxesHaystack);
    const submitRegister = any(matchRegister)(submitBtnHaystack);
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
    const identifierRecovery = any(matchRecovery)(identifierAttributes);
    const formTextMFA = matchMfa(formTextAttrText);
    const formAttrsMFA = any(matchMfaAttr)(formAttributes);
    const headingsMFA = matchMfa(nearestHeadingsText);
    const layoutMFA = any(matchMfa)(layoutHaystack);
    const buttonVerify = any(matchMfaAction)(submitBtnHaystack);
    const inputsMFA = any(matchMfaAttr)(mfaInputsHaystack);
    const inputsOTP = any(matchOtpAttr)(mfaInputsHaystack);
    const linkOTPOutlier = any(matchOtpOutlier)(anchorsHaystack.concat(submitBtnHaystack));
    const headingsNewsletter = matchNewsletter(nearestHeadingsText);
    const buttonMultiStep = any(matchStepAction)(submitBtnHaystack);
    const headingsMultiStep = matchMultiStep(nearestHeadingsText);
    return {
        fieldsCount: linearScale$1(visibleFields.length, 1, 5),
        inputCount: linearScale$1(visibleInputs.length, 1, 5),
        fieldsetCount: linearScale$1(fieldsets.length, 1, 5),
        textCount: linearScale$1(texts.length, 0, 3),
        textareaCount: linearScale$1(textareas.length, 0, 2),
        selectCount: linearScale$1(selects.length, 0, 3),
        checkboxCount: linearScale$1(checkboxes.length, 0, 2),
        radioCount: linearScale$1(radios.length, 0, 5),
        identifierCount: linearScale$1(visibleIdentifiers.length, 0, 2),
        passwordCount: linearScale$1(visiblePasswords.length, 0, 2),
        usernameCount: linearScale$1(usernames.length, 0, 2),
        emailCount: linearScale$1(emails.length, 0, 2),
        submitCount: linearScale$1(submits.length, 0, 2),
        hasTels: boolInt(tels.length > 0),
        hasOAuth: boolInt(oauths.length > 0),
        hasCaptchas: boolInt(captchas.length > 0),
        hasFiles: boolInt(files.length > 0),
        hasDate: boolInt(dates.length > 0),
        hasNumber: boolInt(numbers.length > 0),
        noPasswordFields: boolInt(visiblePasswords.length === 0),
        onePasswordField: boolInt(visiblePasswords.length === 1),
        twoPasswordFields: boolInt(visiblePasswords.length === 2),
        threePasswordFields: boolInt(visiblePasswords.length === 3),
        oneIdentifierField: boolInt(visibleIdentifiers.length === 1),
        twoIdentifierFields: boolInt(visibleIdentifiers.length === 2),
        threeIdentifierFields: boolInt(visibleIdentifiers.length === 3),
        hasHiddenPassword: boolInt(hiddenPasswords.length > 0),
        hasHiddenIdentifier: boolInt(hiddenIdentifiers.length > 0),
        autofocusedIsIdentifier: boolInt(autofocusedIsIdentifier),
        autofocusedIsPassword: boolInt(autofocusedIsPassword),
        visibleRatio: safeInt(visibleInputs.length / fields.length),
        inputRatio: safeInt(inputs.length / fields.length),
        hiddenRatio: safeInt(hiddenInputs.length / inputs.length),
        identifierRatio: safeInt(identifiers.length / inputs.length),
        emailRatio: safeInt(emails.length / inputs.length),
        usernameRatio: safeInt(usernames.length / inputs.length),
        passwordRatio: safeInt(passwords.length / inputs.length),
        requiredRatio: safeInt(required.length / visibleInputs.length),
        patternRatio: safeInt(patterns.length / visibleInputs.length),
        minMaxLengthRatio: safeInt(minMaxLengths.length / visibleInputs.length),
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
        checkboxTOS: boolInt(TOSCheckbox),
        submitRegister: boolInt(submitRegister),
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
        headingsNewsletter: boolInt(headingsNewsletter),
        oneVisibleField: boolInt(visibleInputs.length === 1),
        buttonMultiStep: boolInt(buttonMultiStep),
        buttonMultiAction: boolInt(submitRegister && submitLogin),
        headingsMultiStep: boolInt(headingsMultiStep),
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
    'checkboxCount',
    'radioCount',
    'identifierCount',
    'usernameCount',
    'emailCount',
    'submitCount',
    'hasTels',
    'hasOAuth',
    'hasCaptchas',
    'hasFiles',
    'hasDate',
    'hasNumber',
    'noPasswordFields',
    'onePasswordField',
    'twoPasswordFields',
    'threePasswordFields',
    'oneIdentifierField',
    'twoIdentifierFields',
    'threeIdentifierFields',
    'hasHiddenIdentifier',
    'hasHiddenPassword',
    'autofocusedIsPassword',
    'visibleRatio',
    'inputRatio',
    'hiddenRatio',
    'identifierRatio',
    'emailRatio',
    'usernameRatio',
    'passwordRatio',
    'requiredRatio',
    'patternRatio',
    'minMaxLengthRatio',
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
    'checkboxTOS',
    'submitRegister',
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
    'headingsNewsletter',
    'oneVisibleField',
    'buttonMultiStep',
    'buttonMultiAction',
    'headingsMultiStep',
];

const getFieldFeature = (fnode) => {
    var _a, _b, _c;
    const field = fnode.element;
    const fieldHaystacks = getFieldHaystacks(field);
    const formFnode = getParentFnodeForm(fnode);
    if (formFnode !== null && !formFnode.hasNoteFor('form')) formFnode.setNoteFor('form', getFormFeatures(formFnode));
    const form =
        (_a = formFnode === null || formFnode === void 0 ? void 0 : formFnode.element) !== null && _a !== void 0
            ? _a
            : field.closest('form');
    const formFeatures = formFnode === null || formFnode === void 0 ? void 0 : formFnode.noteFor('form');
    const isFormLogin = getFormTypeScore(formFnode, 'login') > 0.5;
    const isFormRegister = getFormTypeScore(formFnode, 'register') > 0.5;
    const isFormPWChange = getFormTypeScore(formFnode, 'password-change') > 0.5;
    const isFormRecovery = getFormTypeScore(formFnode, 'recovery') > 0.5;
    const isFormMFA = getFormTypeScore(formFnode, 'mfa') > 0.5;
    const detectionResults = [isFormLogin, isFormRegister, isFormPWChange, isFormRecovery, isFormMFA];
    const dangling = form === undefined || form === null;
    const exotic = !dangling && detectionResults.every((detected) => !detected);
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
              opacity: dangling,
          })
        : false;
    const prevField = typeValid
        ? (_b =
              formFeatures === null || formFeatures === void 0
                  ? void 0
                  : formFeatures.formInputIterator.prev(field)) !== null && _b !== void 0
            ? _b
            : null
        : null;
    const nextField = typeValid
        ? (_c =
              formFeatures === null || formFeatures === void 0
                  ? void 0
                  : formFeatures.formInputIterator.next(field)) !== null && _c !== void 0
            ? _c
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
            dangling,
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

const getPasswordFieldFeatures = (fnode) => {
    var _a, _b;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, prevField, nextField } = fieldFeatures;
    const attrCreate = any(matchPasswordCreateAttr)(fieldAttrs);
    const attrCurrent = any(matchPasswordCurrentAttr)(fieldAttrs);
    const attrConfirm = any(matchPasswordConfirm)(fieldAttrs);
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
        dangling: boolInt(fieldFeatures.dangling),
        autocompleteNew: boolInt(fieldFeatures.autocomplete === 'new-password'),
        autocompleteCurrent: boolInt(fieldFeatures.autocomplete === 'current-password'),
        autocompleteOff: boolInt(fieldFeatures.autocomplete === 'off'),
        isOnlyPassword:
            (_b = (_a = fieldFeatures.formFeatures) === null || _a === void 0 ? void 0 : _a.onePasswordField) !==
                null && _b !== void 0
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
    'dangling',
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

const getEmailFieldFeatures = (fnode) => {
    const field = fnode.element;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText } = fieldFeatures;
    const typeEmail = fieldFeatures.type === 'email';
    const exactAttrEmail = kEmailSelector.some((selector) => field.matches(selector));
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

const getUsernameFieldFeatures = (fnode) => {
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, fieldText, labelText, prevField, nextField } = fieldFeatures;
    const attrUsername = any(matchUsernameAttr)(fieldAttrs);
    const textUsername = matchUsername(fieldText);
    const labelUsername = matchUsername(labelText);
    const outlierUsername = any(matchUsernameOutlier)(fieldAttrs.concat(fieldText, labelText));
    const haystack = fieldAttrs.concat(fieldText).concat(labelText);
    const matchEmail = any(matchEmailAttr)(haystack);
    const loginForm = fieldFeatures.isFormLogin;
    const isFirstField = prevField === null && nextField !== null;
    const loginUsername = loginForm && isFirstField && !matchEmail;
    return {
        autocompleteUsername: boolInt(fieldFeatures.autocomplete === 'username'),
        autocompleteNickname: boolInt(fieldFeatures.autocomplete === 'nickname'),
        autocompleteEmail: boolInt(fieldFeatures.autocomplete === 'email'),
        autocompleteOff: boolInt(fieldFeatures.autocomplete === 'off'),
        attrUsername: boolInt(attrUsername),
        textUsername: boolInt(textUsername),
        labelUsername: boolInt(labelUsername),
        outlierUsername: boolInt(outlierUsername),
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

const getHiddenUserFieldFeatures = (fnode) => {
    const field = fnode.element;
    const fieldFeatures = fnode.noteFor('field');
    const { fieldAttrs, autocomplete } = fieldFeatures;
    const attrUsername = any(matchUsernameAttr)(fieldAttrs);
    const attrEmail = any(matchEmailAttr)(fieldAttrs);
    const usernameName = field.matches('[name="username"]');
    const autocompleteUsername = autocomplete === 'username';
    const valueEmail = matchEmailValue(fieldFeatures.value);
    const valueTel = matchTelValue(fieldFeatures.value);
    const valueUsername = matchUsernameValue(fieldFeatures.value);
    return {
        exotic: fieldFeatures.exotic,
        dangling: fieldFeatures.dangling,
        attrUsername: boolInt(attrUsername),
        attrEmail: boolInt(attrEmail),
        usernameName: boolInt(usernameName),
        autocompleteUsername: boolInt(autocompleteUsername),
        hiddenEmailValue: boolInt(valueEmail),
        hiddenTelValue: boolInt(valueTel),
        hiddenUsernameValue: boolInt(valueUsername),
    };
};

const HIDDEN_USER_FIELD_FEATURES = [
    'exotic',
    'dangling',
    'attrUsername',
    'attrEmail',
    'usernameName',
    'autocompleteUsername',
    'hiddenEmailValue',
    'hiddenTelValue',
    'hiddenUsernameValue',
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
    const patternOTP = OTP_PATTERNS.includes(field.pattern);
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
        dangling: boolInt(fieldFeatures.dangling),
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
    'dangling',
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

const results$a = {
    coeffs: [
        ['login-fieldsCount', 3.7626073360443115],
        ['login-inputCount', 6.977949142456055],
        ['login-fieldsetCount', -28.436634063720703],
        ['login-textCount', -25.808048248291016],
        ['login-textareaCount', -6.063703536987305],
        ['login-selectCount', -9.115331649780273],
        ['login-checkboxCount', 9.1531400680542],
        ['login-radioCount', 0.05753134936094284],
        ['login-identifierCount', -8.305644035339355],
        ['login-usernameCount', 7.783791542053223],
        ['login-emailCount', -16.59438133239746],
        ['login-submitCount', -9.992226600646973],
        ['login-hasTels', 0.2500348389148712],
        ['login-hasOAuth', 1.1280237436294556],
        ['login-hasCaptchas', 2.9188075065612793],
        ['login-hasFiles', 0.035769082605838776],
        ['login-hasDate', -21.88290023803711],
        ['login-hasNumber', -6.005046367645264],
        ['login-noPasswordFields', -10.054314613342285],
        ['login-onePasswordField', 5.508376121520996],
        ['login-twoPasswordFields', -17.568946838378906],
        ['login-threePasswordFields', -18.7275447845459],
        ['login-oneIdentifierField', -2.8433613777160645],
        ['login-twoIdentifierFields', -25.477561950683594],
        ['login-threeIdentifierFields', -6.836319446563721],
        ['login-hasHiddenIdentifier', -6.606863975524902],
        ['login-hasHiddenPassword', 34.090171813964844],
        ['login-autofocusedIsPassword', 17.499067306518555],
        ['login-visibleRatio', 0.24371173977851868],
        ['login-inputRatio', 2.294019937515259],
        ['login-hiddenRatio', 11.386458396911621],
        ['login-identifierRatio', 16.162906646728516],
        ['login-emailRatio', 11.4622220993042],
        ['login-usernameRatio', -11.232397079467773],
        ['login-passwordRatio', 10.637309074401855],
        ['login-requiredRatio', 3.007507801055908],
        ['login-patternRatio', -13.418770790100098],
        ['login-minMaxLengthRatio', 2.9639291763305664],
        ['login-pageLogin', 15.85108757019043],
        ['login-formTextLogin', 8.402568817138672],
        ['login-formAttrsLogin', 7.293031215667725],
        ['login-headingsLogin', 25.37425422668457],
        ['login-layoutLogin', 1.2804075479507446],
        ['login-rememberMeCheckbox', 9.142033576965332],
        ['login-troubleLink', 22.586538314819336],
        ['login-submitLogin', 6.25102424621582],
        ['login-pageRegister', -9.779397010803223],
        ['login-formTextRegister', -0.0987691879272461],
        ['login-formAttrsRegister', -15.820134162902832],
        ['login-headingsRegister', -18.535919189453125],
        ['login-layoutRegister', 2.9001619815826416],
        ['login-checkboxTOS', 0.045768313109874725],
        ['login-submitRegister', -10.122489929199219],
        ['login-pagePwReset', -11.554455757141113],
        ['login-formTextPwReset', -6.073555946350098],
        ['login-formAttrsPwReset', -12.402551651000977],
        ['login-headingsPwReset', -10.726568222045898],
        ['login-layoutPwReset', -9.315844535827637],
        ['login-pageRecovery', -7.423282146453857],
        ['login-formTextRecovery', -0.010276734828948975],
        ['login-formAttrsRecovery', -15.816880226135254],
        ['login-headingsRecovery', -0.9647613167762756],
        ['login-layoutRecovery', -1.2308409214019775],
        ['login-identifierRecovery', 0.822621762752533],
        ['login-submitRecovery', 1.836903691291809],
        ['login-formTextMFA', -0.111214280128479],
        ['login-formAttrsMFA', -2.5091300010681152],
        ['login-headingsMFA', -15.748885154724121],
        ['login-layoutMFA', -4.441498756408691],
        ['login-buttonVerify', -8.333691596984863],
        ['login-inputsMFA', -20.911640167236328],
        ['login-inputsOTP', -13.457316398620605],
        ['login-linkOTPOutlier', -7.154890537261963],
        ['login-headingsNewsletter', -10.800921440124512],
        ['login-oneVisibleField', -7.641812801361084],
        ['login-buttonMultiStep', 2.3465020656585693],
        ['login-buttonMultiAction', 16.285505294799805],
        ['login-headingsMultiStep', -13.9302978515625],
    ],
    bias: -5.429805755615234,
    cutoff: 0.51,
};

const login = {
    name: 'login',
    coeffs: FORM_FEATURES.map((key) => {
        var _a, _b;
        return [
            `login-${key}`,
            (_b =
                (_a = results$a.coeffs.find(([feature]) => feature === `login-${key}`)) === null || _a === void 0
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
        ...FORM_FEATURES.map((key) =>
            rule(type('login'), featureScore('form', key), {
                name: `login-${key}`,
            })
        ),
        rule(type('login'), out('login'), {}),
        usePreDetectedForm('login'),
    ],
};

const results$9 = {
    coeffs: [
        ['pw-change-fieldsCount', -1.8165154457092285],
        ['pw-change-inputCount', -1.4198395013809204],
        ['pw-change-fieldsetCount', -5.917735576629639],
        ['pw-change-textCount', -6.106264114379883],
        ['pw-change-textareaCount', -5.893742084503174],
        ['pw-change-selectCount', -6.091434955596924],
        ['pw-change-checkboxCount', -6.092548847198486],
        ['pw-change-radioCount', 0.0127338245511055],
        ['pw-change-identifierCount', -5.496967792510986],
        ['pw-change-usernameCount', -6.0496110916137695],
        ['pw-change-emailCount', -4.16204309463501],
        ['pw-change-submitCount', -2.759899139404297],
        ['pw-change-hasTels', -6.110050201416016],
        ['pw-change-hasOAuth', -6.000830173492432],
        ['pw-change-hasCaptchas', -6.060878276824951],
        ['pw-change-hasFiles', -0.09966593980789185],
        ['pw-change-hasDate', -5.956414699554443],
        ['pw-change-hasNumber', -9.55764102935791],
        ['pw-change-noPasswordFields', -5.906520843505859],
        ['pw-change-onePasswordField', -6.027576446533203],
        ['pw-change-twoPasswordFields', 13.710952758789062],
        ['pw-change-threePasswordFields', 21.991178512573242],
        ['pw-change-oneIdentifierField', -5.98586893081665],
        ['pw-change-twoIdentifierFields', -5.913093566894531],
        ['pw-change-threeIdentifierFields', 12.298354148864746],
        ['pw-change-hasHiddenIdentifier', -0.8614786267280579],
        ['pw-change-hasHiddenPassword', -5.922685623168945],
        ['pw-change-autofocusedIsPassword', 20.345542907714844],
        ['pw-change-visibleRatio', -3.585836410522461],
        ['pw-change-inputRatio', -3.551971435546875],
        ['pw-change-hiddenRatio', -4.217589855194092],
        ['pw-change-identifierRatio', -5.349542617797852],
        ['pw-change-emailRatio', -5.132142066955566],
        ['pw-change-usernameRatio', -6.1042985916137695],
        ['pw-change-passwordRatio', 4.517492294311523],
        ['pw-change-requiredRatio', -4.309672832489014],
        ['pw-change-patternRatio', 2.1689603328704834],
        ['pw-change-minMaxLengthRatio', -2.8041601181030273],
        ['pw-change-pageLogin', -6.0852813720703125],
        ['pw-change-formTextLogin', -5.916869640350342],
        ['pw-change-formAttrsLogin', -5.913314342498779],
        ['pw-change-headingsLogin', -6.0626540184021],
        ['pw-change-layoutLogin', -5.992425918579102],
        ['pw-change-rememberMeCheckbox', -5.970892429351807],
        ['pw-change-troubleLink', -3.656282424926758],
        ['pw-change-submitLogin', -5.999627590179443],
        ['pw-change-pageRegister', -6.073349475860596],
        ['pw-change-formTextRegister', -0.06772468239068985],
        ['pw-change-formAttrsRegister', -6.001786708831787],
        ['pw-change-headingsRegister', -6.389496803283691],
        ['pw-change-layoutRegister', -5.949397563934326],
        ['pw-change-checkboxTOS', -0.0711725503206253],
        ['pw-change-submitRegister', -6.394720554351807],
        ['pw-change-pagePwReset', 16.736572265625],
        ['pw-change-formTextPwReset', 19.02013397216797],
        ['pw-change-formAttrsPwReset', 2.0135624408721924],
        ['pw-change-headingsPwReset', 17.220232009887695],
        ['pw-change-layoutPwReset', 14.537257194519043],
        ['pw-change-pageRecovery', -5.901693820953369],
        ['pw-change-formTextRecovery', -0.09067066013813019],
        ['pw-change-formAttrsRecovery', -5.962212085723877],
        ['pw-change-headingsRecovery', -5.947977066040039],
        ['pw-change-layoutRecovery', -4.399231433868408],
        ['pw-change-identifierRecovery', -6.005735397338867],
        ['pw-change-submitRecovery', -1.0468429327011108],
        ['pw-change-formTextMFA', -0.11246849596500397],
        ['pw-change-formAttrsMFA', -6.06132698059082],
        ['pw-change-headingsMFA', -6.086677074432373],
        ['pw-change-layoutMFA', -5.9400248527526855],
        ['pw-change-buttonVerify', -5.953756809234619],
        ['pw-change-inputsMFA', -6.053882122039795],
        ['pw-change-inputsOTP', -6.071441173553467],
        ['pw-change-linkOTPOutlier', -6.359778881072998],
        ['pw-change-headingsNewsletter', -6.007060527801514],
        ['pw-change-oneVisibleField', -5.954623222351074],
        ['pw-change-buttonMultiStep', -6.010159969329834],
        ['pw-change-buttonMultiAction', -5.924241065979004],
        ['pw-change-headingsMultiStep', -6.018826961517334],
    ],
    bias: -3.628674030303955,
    cutoff: 1,
};

const passwordChange = {
    name: 'password-change',
    coeffs: FORM_FEATURES.map((key) => {
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
        ...FORM_FEATURES.map((key) =>
            rule(type('password-change'), featureScore('form', key), {
                name: `pw-change-${key}`,
            })
        ),
        rule(type('password-change'), out('password-change'), {}),
        usePreDetectedForm('password-change'),
    ],
};

const results$8 = {
    coeffs: [
        ['register-fieldsCount', 7.830681800842285],
        ['register-inputCount', 8.968225479125977],
        ['register-fieldsetCount', 2.289330244064331],
        ['register-textCount', -2.077362298965454],
        ['register-textareaCount', -4.644139766693115],
        ['register-selectCount', -2.7017815113067627],
        ['register-checkboxCount', -6.395814895629883],
        ['register-radioCount', 0.09850054234266281],
        ['register-identifierCount', 7.595934867858887],
        ['register-usernameCount', -3.5213358402252197],
        ['register-emailCount', 2.903947353363037],
        ['register-submitCount', -0.7757875919342041],
        ['register-hasTels', 18.43202018737793],
        ['register-hasOAuth', 1.7733516693115234],
        ['register-hasCaptchas', 6.121199607849121],
        ['register-hasFiles', -0.006067030131816864],
        ['register-hasDate', 10.098329544067383],
        ['register-hasNumber', 44.87228775024414],
        ['register-noPasswordFields', -3.988689422607422],
        ['register-onePasswordField', 3.4148521423339844],
        ['register-twoPasswordFields', 12.954623222351074],
        ['register-threePasswordFields', -6.837133407592773],
        ['register-oneIdentifierField', 2.876826286315918],
        ['register-twoIdentifierFields', 16.876298904418945],
        ['register-threeIdentifierFields', 9.832324028015137],
        ['register-hasHiddenIdentifier', 2.6997861862182617],
        ['register-hasHiddenPassword', -8.950589179992676],
        ['register-autofocusedIsPassword', -8.128095626831055],
        ['register-visibleRatio', -10.665733337402344],
        ['register-inputRatio', -9.474141120910645],
        ['register-hiddenRatio', -15.127795219421387],
        ['register-identifierRatio', 13.107436180114746],
        ['register-emailRatio', 2.7967097759246826],
        ['register-usernameRatio', -24.07566261291504],
        ['register-passwordRatio', -5.716640472412109],
        ['register-requiredRatio', -0.3843240439891815],
        ['register-patternRatio', -3.8215179443359375],
        ['register-minMaxLengthRatio', -8.653407096862793],
        ['register-pageLogin', -6.364791393280029],
        ['register-formTextLogin', -6.132074356079102],
        ['register-formAttrsLogin', -2.7015910148620605],
        ['register-headingsLogin', -11.827603340148926],
        ['register-layoutLogin', 2.9262702465057373],
        ['register-rememberMeCheckbox', -6.405736923217773],
        ['register-troubleLink', -27.667083740234375],
        ['register-submitLogin', -5.824146270751953],
        ['register-pageRegister', -4.713817596435547],
        ['register-formTextRegister', -0.08295778185129166],
        ['register-formAttrsRegister', 23.425302505493164],
        ['register-headingsRegister', 4.622710227966309],
        ['register-layoutRegister', -1.0797765254974365],
        ['register-checkboxTOS', -0.025196045637130737],
        ['register-submitRegister', 17.13568687438965],
        ['register-pagePwReset', -6.278850555419922],
        ['register-formTextPwReset', -6.102662086486816],
        ['register-formAttrsPwReset', -5.934853553771973],
        ['register-headingsPwReset', -12.36927604675293],
        ['register-layoutPwReset', -11.000208854675293],
        ['register-pageRecovery', -24.21532440185547],
        ['register-formTextRecovery', -0.038293272256851196],
        ['register-formAttrsRecovery', -6.2661824226379395],
        ['register-headingsRecovery', -29.526643753051758],
        ['register-layoutRecovery', -6.302907943725586],
        ['register-identifierRecovery', -30.013195037841797],
        ['register-submitRecovery', -21.89647102355957],
        ['register-formTextMFA', -0.04960943013429642],
        ['register-formAttrsMFA', 9.309612274169922],
        ['register-headingsMFA', -28.4708194732666],
        ['register-layoutMFA', -0.3066938817501068],
        ['register-buttonVerify', 17.430692672729492],
        ['register-inputsMFA', -18.645435333251953],
        ['register-inputsOTP', -26.114179611206055],
        ['register-linkOTPOutlier', 1.6865427494049072],
        ['register-headingsNewsletter', -32.46424102783203],
        ['register-oneVisibleField', -9.463561058044434],
        ['register-buttonMultiStep', 10.731226921081543],
        ['register-buttonMultiAction', 4.708226203918457],
        ['register-headingsMultiStep', 37.2221565246582],
    ],
    bias: 0.5589523911476135,
    cutoff: 0.48,
};

const register = {
    name: 'register',
    coeffs: FORM_FEATURES.map((key) => {
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
        ...FORM_FEATURES.map((key) =>
            rule(type('register'), featureScore('form', key), {
                name: `register-${key}`,
            })
        ),
        rule(type('register'), out('register'), {}),
        usePreDetectedForm('register'),
    ],
};

const results$7 = {
    coeffs: [
        ['recovery-fieldsCount', -3.5375406742095947],
        ['recovery-inputCount', -3.8025102615356445],
        ['recovery-fieldsetCount', 4.75792121887207],
        ['recovery-textCount', 16.246549606323242],
        ['recovery-textareaCount', -25.13706398010254],
        ['recovery-selectCount', -9.887081146240234],
        ['recovery-checkboxCount', -6.0637946128845215],
        ['recovery-radioCount', 0.09989113360643387],
        ['recovery-identifierCount', 4.914915561676025],
        ['recovery-usernameCount', 23.312578201293945],
        ['recovery-emailCount', -7.69582462310791],
        ['recovery-submitCount', -1.434313416481018],
        ['recovery-hasTels', -6.349506855010986],
        ['recovery-hasOAuth', -3.5902459621429443],
        ['recovery-hasCaptchas', -0.6484614014625549],
        ['recovery-hasFiles', 0.008563145995140076],
        ['recovery-hasDate', -6.110077857971191],
        ['recovery-hasNumber', -6.016909599304199],
        ['recovery-noPasswordFields', -2.3900399208068848],
        ['recovery-onePasswordField', -24.224132537841797],
        ['recovery-twoPasswordFields', -6.21409797668457],
        ['recovery-threePasswordFields', -13.879772186279297],
        ['recovery-oneIdentifierField', 4.590885639190674],
        ['recovery-twoIdentifierFields', 10.169477462768555],
        ['recovery-threeIdentifierFields', -6.190042018890381],
        ['recovery-hasHiddenIdentifier', -10.61341381072998],
        ['recovery-hasHiddenPassword', -13.84819221496582],
        ['recovery-autofocusedIsPassword', -5.9025139808654785],
        ['recovery-visibleRatio', -0.4163579046726227],
        ['recovery-inputRatio', -9.439152717590332],
        ['recovery-hiddenRatio', 5.218226909637451],
        ['recovery-identifierRatio', 7.943380355834961],
        ['recovery-emailRatio', 1.5284855365753174],
        ['recovery-usernameRatio', -0.24160680174827576],
        ['recovery-passwordRatio', -18.474123001098633],
        ['recovery-requiredRatio', 3.6493115425109863],
        ['recovery-patternRatio', -16.238264083862305],
        ['recovery-minMaxLengthRatio', 5.020329475402832],
        ['recovery-pageLogin', -2.6968982219696045],
        ['recovery-formTextLogin', -6.005831718444824],
        ['recovery-formAttrsLogin', 0.05873919650912285],
        ['recovery-headingsLogin', -5.468044281005859],
        ['recovery-layoutLogin', -18.289209365844727],
        ['recovery-rememberMeCheckbox', -6.020930290222168],
        ['recovery-troubleLink', -2.1370882987976074],
        ['recovery-submitLogin', -5.767223358154297],
        ['recovery-pageRegister', -7.119760990142822],
        ['recovery-formTextRegister', 0.03091924637556076],
        ['recovery-formAttrsRegister', -8.82468032836914],
        ['recovery-headingsRegister', -4.685802936553955],
        ['recovery-layoutRegister', -8.391084671020508],
        ['recovery-checkboxTOS', 0.10902295261621475],
        ['recovery-submitRegister', -7.707064628601074],
        ['recovery-pagePwReset', 8.413972854614258],
        ['recovery-formTextPwReset', -6.5589423179626465],
        ['recovery-formAttrsPwReset', 10.444375038146973],
        ['recovery-headingsPwReset', 11.339105606079102],
        ['recovery-layoutPwReset', 4.908822536468506],
        ['recovery-pageRecovery', 19.790620803833008],
        ['recovery-formTextRecovery', -0.009632810950279236],
        ['recovery-formAttrsRecovery', 26.433837890625],
        ['recovery-headingsRecovery', -1.4518598318099976],
        ['recovery-layoutRecovery', -2.5218491554260254],
        ['recovery-identifierRecovery', 16.719650268554688],
        ['recovery-submitRecovery', 13.57876205444336],
        ['recovery-formTextMFA', 0.025818251073360443],
        ['recovery-formAttrsMFA', 14.39934253692627],
        ['recovery-headingsMFA', 1.1010302305221558],
        ['recovery-layoutMFA', -6.113069534301758],
        ['recovery-buttonVerify', -6.714963912963867],
        ['recovery-inputsMFA', 1.5239739418029785],
        ['recovery-inputsOTP', -10.719359397888184],
        ['recovery-linkOTPOutlier', 9.402617454528809],
        ['recovery-headingsNewsletter', -12.91284465789795],
        ['recovery-oneVisibleField', 0.5249378681182861],
        ['recovery-buttonMultiStep', -2.6024668216705322],
        ['recovery-buttonMultiAction', -6.132583141326904],
        ['recovery-headingsMultiStep', -5.950733661651611],
    ],
    bias: -11.660077095031738,
    cutoff: 0.5,
};

const recovery = {
    name: 'recovery',
    coeffs: FORM_FEATURES.map((key) => {
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
        ...FORM_FEATURES.map((key) =>
            rule(type('recovery'), featureScore('form', key), {
                name: `recovery-${key}`,
            })
        ),
        rule(type('recovery'), out('recovery'), {}),
        usePreDetectedForm('recovery'),
    ],
};

const results$6 = {
    coeffs: [
        ['mfa-fieldsCount', -4.606734752655029],
        ['mfa-inputCount', -4.954229831695557],
        ['mfa-fieldsetCount', 6.079783916473389],
        ['mfa-textCount', -2.358067512512207],
        ['mfa-textareaCount', -6.768757343292236],
        ['mfa-selectCount', -5.969513893127441],
        ['mfa-checkboxCount', -6.074037075042725],
        ['mfa-radioCount', -0.08048494160175323],
        ['mfa-identifierCount', -4.3120012283325195],
        ['mfa-usernameCount', -4.991916656494141],
        ['mfa-emailCount', -6.664278984069824],
        ['mfa-submitCount', -2.656090497970581],
        ['mfa-hasTels', 12.40429973602295],
        ['mfa-hasOAuth', -6.591089248657227],
        ['mfa-hasCaptchas', -1.3108625411987305],
        ['mfa-hasFiles', -0.060213226824998856],
        ['mfa-hasDate', -5.992575645446777],
        ['mfa-hasNumber', 8.220172882080078],
        ['mfa-noPasswordFields', 0.10280916094779968],
        ['mfa-onePasswordField', -6.049112796783447],
        ['mfa-twoPasswordFields', -8.201457977294922],
        ['mfa-threePasswordFields', -5.9232587814331055],
        ['mfa-oneIdentifierField', -4.437597274780273],
        ['mfa-twoIdentifierFields', -5.964792251586914],
        ['mfa-threeIdentifierFields', -6.110788345336914],
        ['mfa-hasHiddenIdentifier', -4.493795394897461],
        ['mfa-hasHiddenPassword', -2.211125373840332],
        ['mfa-autofocusedIsPassword', 6.714522361755371],
        ['mfa-visibleRatio', -4.823802947998047],
        ['mfa-inputRatio', -2.511945962905884],
        ['mfa-hiddenRatio', 2.2980546951293945],
        ['mfa-identifierRatio', -4.127521514892578],
        ['mfa-emailRatio', -6.434284210205078],
        ['mfa-usernameRatio', -5.688357353210449],
        ['mfa-passwordRatio', -4.610529899597168],
        ['mfa-requiredRatio', 8.06564998626709],
        ['mfa-patternRatio', 8.983817100524902],
        ['mfa-minMaxLengthRatio', 0.6805662512779236],
        ['mfa-pageLogin', 4.899959087371826],
        ['mfa-formTextLogin', -6.04913330078125],
        ['mfa-formAttrsLogin', -3.229828119277954],
        ['mfa-headingsLogin', -3.8571884632110596],
        ['mfa-layoutLogin', -1.4798308610916138],
        ['mfa-rememberMeCheckbox', -5.985334396362305],
        ['mfa-troubleLink', -6.312424182891846],
        ['mfa-submitLogin', 0.49217841029167175],
        ['mfa-pageRegister', -4.550151348114014],
        ['mfa-formTextRegister', -0.04218434542417526],
        ['mfa-formAttrsRegister', -4.0848708152771],
        ['mfa-headingsRegister', -7.506351947784424],
        ['mfa-layoutRegister', -4.410171031951904],
        ['mfa-checkboxTOS', -0.013944298028945923],
        ['mfa-submitRegister', -5.941500663757324],
        ['mfa-pagePwReset', -6.080989360809326],
        ['mfa-formTextPwReset', -6.016585350036621],
        ['mfa-formAttrsPwReset', -6.037834167480469],
        ['mfa-headingsPwReset', -5.997016429901123],
        ['mfa-layoutPwReset', -6.0884199142456055],
        ['mfa-pageRecovery', 0.4637037217617035],
        ['mfa-formTextRecovery', -0.0982503890991211],
        ['mfa-formAttrsRecovery', -6.478918552398682],
        ['mfa-headingsRecovery', -6.930901050567627],
        ['mfa-layoutRecovery', 2.165898323059082],
        ['mfa-identifierRecovery', -5.971766948699951],
        ['mfa-submitRecovery', -2.100978374481201],
        ['mfa-formTextMFA', 0.08786458522081375],
        ['mfa-formAttrsMFA', 14.346611022949219],
        ['mfa-headingsMFA', 16.029468536376953],
        ['mfa-layoutMFA', 12.00521469116211],
        ['mfa-buttonVerify', 15.885189056396484],
        ['mfa-inputsMFA', 15.539886474609375],
        ['mfa-inputsOTP', 18.388042449951172],
        ['mfa-linkOTPOutlier', -2.7338993549346924],
        ['mfa-headingsNewsletter', -6.061182022094727],
        ['mfa-oneVisibleField', -1.2582683563232422],
        ['mfa-buttonMultiStep', 2.701902151107788],
        ['mfa-buttonMultiAction', -5.952898025512695],
        ['mfa-headingsMultiStep', 8.503594398498535],
    ],
    bias: -2.9638428688049316,
    cutoff: 0.5,
};

const mfa = {
    name: 'mfa',
    coeffs: FORM_FEATURES.map((key) => {
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
        ...FORM_FEATURES.map((key) =>
            rule(type('mfa'), featureScore('form', key), {
                name: `mfa-${key}`,
            })
        ),
        rule(type('mfa'), out('mfa'), {}),
        usePreDetectedForm('mfa'),
    ],
};

const results$5 = {
    coeffs: [
        ['pw-loginScore', 10.775704383850098],
        ['pw-registerScore', -12.2188081741333],
        ['pw-pwChangeScore', -4.645296096801758],
        ['pw-exotic', -13.077762603759766],
        ['pw-dangling', -0.07494854182004929],
        ['pw-autocompleteNew', -2.763916015625],
        ['pw-autocompleteCurrent', 6.34079122543335],
        ['pw-autocompleteOff', -1.231351375579834],
        ['pw-isOnlyPassword', 3.613002300262451],
        ['pw-prevPwField', -0.6552870869636536],
        ['pw-nextPwField', -2.151426315307617],
        ['pw-attrCreate', -0.40439310669898987],
        ['pw-attrCurrent', 2.7635598182678223],
        ['pw-attrConfirm', -6.997659683227539],
        ['pw-attrReset', 0.014016076922416687],
        ['pw-textCreate', -2.0509419441223145],
        ['pw-textCurrent', 6.496218681335449],
        ['pw-textConfirm', -7.037073612213135],
        ['pw-textReset', 0.003563031554222107],
        ['pw-labelCreate', -7.307537078857422],
        ['pw-labelCurrent', 12.124683380126953],
        ['pw-labelConfirm', -7.040849208831787],
        ['pw-labelReset', -0.11190150678157806],
        ['pw-prevPwCreate', -7.002630233764648],
        ['pw-prevPwCurrent', -8.67866325378418],
        ['pw-prevPwConfirm', -0.1722210794687271],
        ['pw-passwordOutlier', -7.6392130851745605],
        ['pw-nextPwCreate', 5.988805770874023],
        ['pw-nextPwCurrent', -0.13853268325328827],
        ['pw-nextPwConfirm', -7.120540618896484],
    ],
    bias: -0.0009138921741396189,
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
        rule(type('password'), out('password'), {}),
        usePreDetectedField('password'),
    ],
};

const results$4 = {
    coeffs: [
        ['pw[new]-loginScore', -13.44411849975586],
        ['pw[new]-registerScore', 13.404029846191406],
        ['pw[new]-pwChangeScore', 2.872011184692383],
        ['pw[new]-exotic', 14.10060977935791],
        ['pw[new]-dangling', 0.1639271080493927],
        ['pw[new]-autocompleteNew', 1.4743067026138306],
        ['pw[new]-autocompleteCurrent', -6.374614715576172],
        ['pw[new]-autocompleteOff', -0.028380222618579865],
        ['pw[new]-isOnlyPassword', -2.504464864730835],
        ['pw[new]-prevPwField', -0.9264600872993469],
        ['pw[new]-nextPwField', 9.914654731750488],
        ['pw[new]-attrCreate', 2.068446636199951],
        ['pw[new]-attrCurrent', -2.263972043991089],
        ['pw[new]-attrConfirm', 7.301075458526611],
        ['pw[new]-attrReset', -0.026485905051231384],
        ['pw[new]-textCreate', 0.4563188850879669],
        ['pw[new]-textCurrent', -6.660948276519775],
        ['pw[new]-textConfirm', -15.446428298950195],
        ['pw[new]-textReset', 0.13727492094039917],
        ['pw[new]-labelCreate', 7.583228588104248],
        ['pw[new]-labelCurrent', -12.511932373046875],
        ['pw[new]-labelConfirm', 7.269619464874268],
        ['pw[new]-labelReset', 0.15415465831756592],
        ['pw[new]-prevPwCreate', 11.29687213897705],
        ['pw[new]-prevPwCurrent', 7.796679973602295],
        ['pw[new]-prevPwConfirm', -0.09916792064905167],
        ['pw[new]-passwordOutlier', -27.227142333984375],
        ['pw[new]-nextPwCreate', -7.562383651733398],
        ['pw[new]-nextPwCurrent', 0.00012005865573883057],
        ['pw[new]-nextPwConfirm', 7.178583145141602],
    ],
    bias: -1.9272797107696533,
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
        rule(type('new-password'), out('new-password'), {}),
        usePreDetectedField('new-password'),
    ],
};

const results$3 = {
    coeffs: [
        ['username-autocompleteUsername', 9.69019889831543],
        ['username-autocompleteNickname', -0.2004464566707611],
        ['username-autocompleteEmail', -7.634543418884277],
        ['username-autocompleteOff', -0.39810022711753845],
        ['username-attrUsername', 18.669429779052734],
        ['username-textUsername', 9.250268936157227],
        ['username-labelUsername', 17.93179702758789],
        ['username-outlierUsername', -7.328217029571533],
        ['username-loginUsername', 18.698163986206055],
    ],
    bias: -9.822489738464355,
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
        rule(type('username-field'), type('username'), {}),
        ...USERNAME_FIELD_FEATURES.map((key) =>
            rule(type('username'), featureScore('username-field', key), {
                name: `username-${key}`,
            })
        ),
        rule(type('username'), out('username'), {}),
        usePreDetectedField('username'),
    ],
};

const results$2 = {
    coeffs: [
        ['username[hidden]-exotic', -14.368006706237793],
        ['username[hidden]-dangling', -9.143143653869629],
        ['username[hidden]-attrUsername', 10.157068252563477],
        ['username[hidden]-attrEmail', 8.236105918884277],
        ['username[hidden]-usernameName', 7.221702575683594],
        ['username[hidden]-autocompleteUsername', 2.214597463607788],
        ['username[hidden]-hiddenEmailValue', 11.055793762207031],
        ['username[hidden]-hiddenTelValue', 3.1138651371002197],
        ['username[hidden]-hiddenUsernameValue', 1.2627148628234863],
    ],
    bias: -14.900147438049316,
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
        rule(type('username-hidden-field'), type('username-hidden'), {}),
        ...HIDDEN_USER_FIELD_FEATURES.map((key) =>
            rule(type('username-hidden'), featureScore('username-hidden-field', key), {
                name: `username[hidden]-${key}`,
            })
        ),
        rule(type('username-hidden'), out('username-hidden'), {}),
        usePreDetectedField('username-hidden'),
    ],
};

const results$1 = {
    coeffs: [
        ['email-autocompleteUsername', 1.3230321407318115],
        ['email-autocompleteNickname', 0.21977055072784424],
        ['email-autocompleteEmail', 5.903988838195801],
        ['email-typeEmail', 14.744939804077148],
        ['email-exactAttrEmail', 13.138760566711426],
        ['email-attrEmail', 2.2094039916992188],
        ['email-textEmail', 14.328051567077637],
        ['email-labelEmail', 16.929513931274414],
        ['email-placeholderEmail', 15.14160442352295],
        ['email-attrSearch', -13.065813064575195],
        ['email-textSearch', -13.605645179748535],
    ],
    bias: -9.315366744995117,
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
        rule(type('email-field'), type('email'), {}),
        ...EMAIL_FIELD_FEATURES.map((key) =>
            rule(type('email'), featureScore('email-field', key), {
                name: `email-${key}`,
            })
        ),
        rule(type('email'), out('email'), {}),
        usePreDetectedField('email'),
    ],
};

const results = {
    coeffs: [
        ['otp-mfaScore', 17.400177001953125],
        ['otp-exotic', -6.512112140655518],
        ['otp-dangling', -8.295921325683594],
        ['otp-linkOTPOutlier', -13.071626663208008],
        ['otp-hasCheckboxes', 0.00811643898487091],
        ['otp-hidden', -9.741541862487793],
        ['otp-required', 0.5302380323410034],
        ['otp-nameMatch', -8.425960540771484],
        ['otp-idMatch', 6.092440605163574],
        ['otp-numericMode', 10.698885917663574],
        ['otp-autofocused', 6.863340377807617],
        ['otp-tabIndex1', -0.5767713189125061],
        ['otp-patternOTP', 2.60825514793396],
        ['otp-maxLength1', 6.709722518920898],
        ['otp-maxLength5', -7.527043342590332],
        ['otp-minLength6', 12.405789375305176],
        ['otp-maxLength6', 6.918210506439209],
        ['otp-maxLength20', -5.674575328826904],
        ['otp-autocompleteOTC', 0.07599283754825592],
        ['otp-autocompleteOff', -5.373960494995117],
        ['otp-prevAligned', -0.2174910604953766],
        ['otp-prevArea', 3.065140724182129],
        ['otp-nextAligned', -0.07215788215398788],
        ['otp-nextArea', 3.4876863956451416],
        ['otp-attrMFA', 6.078340530395508],
        ['otp-attrOTP', 10.091049194335938],
        ['otp-attrOutlier', -7.9604644775390625],
        ['otp-textMFA', 6.817076206207275],
        ['otp-textOTP', 9.356574058532715],
        ['otp-labelMFA', 13.439647674560547],
        ['otp-labelOTP', -6.3991379737854],
        ['otp-labelOutlier', -6.501152515411377],
        ['otp-wrapperOTP', 4.762834548950195],
        ['otp-wrapperOutlier', -6.32804536819458],
        ['otp-emailOutlierCount', -20.287260055541992],
    ],
    bias: -12.648941993713379,
    cutoff: 0.5,
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
        rule(type('otp-field'), type('otp'), {}),
        ...OTP_FIELD_FEATURES.map((key) =>
            rule(type('otp'), featureScore('otp-field', key), {
                name: `otp-${key}`,
            })
        ),
        rule(type('otp'), out('otp'), {}),
        usePreDetectedField('otp'),
    ],
};

const { clusters } = clusters$1;

const CLUSTER_MAX_X_DIST = 50;

const CLUSTER_MAX_Y_DIST = 275;

const CLUSTER_ALIGNMENT_TOLERANCE = 0.05;

const CLUSTER_SANITY_CHECK_MAX_ITERATIONS = 3;

const CLUSTER_MAX_ANCHORED_PARENT_ITERATIONS = 20;

const CLUSTER_TABLE_MAX_COLS = 3;

const CLUSTER_TABLE_MAX_AREA = 1e5;

const getCommonAncestor = (elementA, elementB) => {
    if (elementA === elementB) return elementA;
    return elementA.contains(elementB)
        ? elementA
        : elementA.parentElement
        ? getCommonAncestor(elementA.parentElement, elementB)
        : elementA;
};

const findPositionedParent = (el, cache, maxIterations = CLUSTER_MAX_ANCHORED_PARENT_ITERATIONS) => {
    if (cache.some((group) => group.contains(el))) return null;
    const parent = el.parentElement;
    if (maxIterations === 0 || !parent) return null;
    const computedStyle = getComputedStyle(parent);
    const position = computedStyle.getPropertyValue('position');
    if (position === 'fixed' || position === 'absolute') {
        cache.push(parent);
        return parent;
    }
    return findPositionedParent(parent, cache, maxIterations - 1);
};

const compare = (a, b) => {
    const isFieldA = a.matches(fieldSelector) && a.matches(':not([type="submit"])');
    const isFieldB = b.matches(fieldSelector) && b.matches(':not([type="submit"])');
    const rectA = a.getBoundingClientRect();
    const rectB = b.getBoundingClientRect();
    const leftRatio = Math.abs(rectA.left / rectB.left);
    const topRatio = Math.abs(rectA.top / rectB.top);
    const xAlign = leftRatio > 1 - CLUSTER_ALIGNMENT_TOLERANCE && leftRatio < 1 + CLUSTER_ALIGNMENT_TOLERANCE;
    const yAlign = topRatio > 1 - CLUSTER_ALIGNMENT_TOLERANCE && topRatio < 1 + CLUSTER_ALIGNMENT_TOLERANCE;
    const { dx, dy } = getRectMinDistance(rectA, rectB);
    const maxDx = CLUSTER_MAX_X_DIST;
    const maxDy = CLUSTER_MAX_Y_DIST / (isFieldA && isFieldB ? 2 : 1);
    if (xAlign && yAlign) return true;
    if (xAlign && dy < maxDy) return true;
    if (yAlign && dx < maxDx) return true;
    if (dx < maxDx && dy < maxDy) return true;
    return false;
};

const getExcludedElements = (doc) => {
    const exclude = Array.from(doc.querySelectorAll('table')).filter((table) => {
        if (table.querySelector('thead') !== null) return true;
        if (table.querySelector('table')) return false;
        const cellCount = Math.max(...Array.from(table.rows).map((row) => row.cells.length));
        if (cellCount > CLUSTER_TABLE_MAX_COLS) return true;
        const { area } = getNodeRect(table);
        if (area > CLUSTER_TABLE_MAX_AREA) return true;
        return false;
    });
    exclude.forEach(setIgnoreType);
    return exclude;
};

const getFormLikeClusters = (doc) => {
    const preDetected = Array.from(doc.querySelectorAll(`[${DETECTED_FORM_TYPE_ATTR}], [${DETECTED_CLUSTER_ATTR}]`));
    const forms = preDetected.concat(
        getExcludedElements(doc),
        Array.from(doc.querySelectorAll(formOfInterestSelector))
    );
    const filterFormEls = (els) => els.filter((el) => !forms.some((form) => form.contains(el)) && isVisibleField(el));
    const fields = filterFormEls(Array.from(doc.querySelectorAll(fieldSelector)));
    const inputs = fields.filter((el) => el.matches(editableFieldSelector));
    if (inputs.length === 0) return [];
    const domGroups = Array.from(doc.querySelectorAll(clusterSelector)).filter(
        (el) => el !== document.body && el.querySelectorAll(editableFieldSelector).length > 0
    );
    const cache = [];
    const positionedEls = inputs.map((input) => findPositionedParent(input, cache)).filter((el) => Boolean(el));
    const groups = domGroups.filter((el) => !positionedEls.some((stack) => el.contains(stack))).concat(positionedEls);
    const buttons = filterFormEls(
        Array.from(document.querySelectorAll(buttonSubmitSelector)).filter(isSubmitBtnCandidate)
    );
    const candidates = Array.from(new Set([...fields, ...buttons]));
    const theClusters = clusters(candidates, 1, (a, b) => {
        const groupA = groups.find((group) => group.contains(a));
        const groupB = groups.find((group) => group.contains(b));
        if (groupA !== groupB) {
            const oneInGroup = groupA === undefined || groupB === undefined;
            const groupWrap = oneInGroup || !(groupA.contains(groupB) || groupB.contains(groupA));
            if (groupWrap) return Number.MAX_SAFE_INTEGER;
        }
        if (groupA && groupB && groupA === groupB) return 0;
        return compare(a, b) ? 0 : Number.MAX_SAFE_INTEGER;
    });
    const ancestors = theClusters
        .map((cluster) => {
            if (cluster.length === 1) {
                const start = cluster[0];
                return walkUpWhile(
                    start,
                    CLUSTER_SANITY_CHECK_MAX_ITERATIONS
                )((_, candidate) => candidate === start || candidate.childElementCount === 1);
            }
            return cluster.reduce(getCommonAncestor);
        })
        .filter((ancestor) => {
            const formWrap = forms.some((form) => ancestor.contains(form) || form.contains(ancestor));
            const containsFields = ancestor.querySelectorAll(editableFieldSelector).length > 0;
            return !formWrap && containsFields && document.body !== ancestor && ancestor.tagName !== 'FORM';
        });
    const results = Array.from(
        new Set(
            ancestors.filter((ancestor, _, allAncestors) => {
                const ancestorWrap = allAncestors.some((el) => ancestor !== el && el.contains(ancestor));
                return !ancestorWrap;
            })
        )
    );
    results.forEach(setClusterType);
    return results;
};

const formLikeDom = () => domQuery(getFormLikeClusters);

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
                rule(dom(`${formOfInterestSelector}:not([${DETECTED_FORM_TYPE_ATTR}])`), type('form-el'), {}),
                rule(formLikeDom(), type('form-el'), {}),
                usePreDetectedCluster('form-el'),
                rule(type('form-el'), out('form-el'), {}),
                rule(type('form-el').when(isFormOfInterest), type('form').note(getFormFeatures), {}),
                rule(type('form'), out('form'), {}),
                rule(dom(fieldOfInterestSelector).when(isFieldOfInterest), type('field').note(getFieldFeature), {}),
                rule(type('field'), out('field'), {}),
                rule(type('field').when(maybeEmail), type('email-field').note(getEmailFieldFeatures), {}),
                rule(type('field').when(maybeUsername), type('username-field').note(getUsernameFieldFeatures), {}),
                rule(
                    type('field').when(maybeHiddenUsername),
                    type('username-hidden-field').note(getHiddenUserFieldFeatures),
                    {}
                ),
                rule(type('field').when(maybePassword), type('password-field').note(getPasswordFieldFeatures), {}),
                rule(type('field').when(maybeOTP), type('otp-field').note(getOTPFieldFeatures), {}),
            ],
            coeffs: [],
            biases: [],
        }
    );
    const rules = ruleset(aggregation.rules, aggregation.coeffs, aggregation.biases);
    return rules;
};

export {
    DETECTED_CLUSTER_ATTR,
    DETECTED_FIELD_TYPE_ATTR,
    DETECTED_FORM_TYPE_ATTR,
    EL_ATTRIBUTES,
    FIELD_ATTRIBUTES,
    FORM_ATTRIBUTES,
    IGNORE_ELEMENT_ATTR,
    TEXT_ATTRIBUTES,
    anchorLinkSelector,
    buttonSubmitSelector,
    cacheContext,
    captchaSelector,
    clearVisibilityCache,
    clusterSelector,
    createInputIterator,
    editableFieldSelector,
    fieldOfInterestSelector,
    fieldSelector,
    formOfInterestSelector,
    getAttributes,
    getBaseAttributes,
    getFieldAttributes,
    getFormAttributes,
    getFormParent,
    getTextAttributes,
    getVisibilityCache,
    headingSelector,
    hiddenUsernameSelector,
    isEmailCandidate,
    isFieldOfInterest,
    isFormOfInterest,
    isOAuthCandidate,
    isSubmitBtnCandidate,
    isUserEditableField,
    isUsernameCandidate,
    isVisible,
    isVisibleEl,
    isVisibleField,
    layoutSelector,
    maybeEmail,
    maybeHiddenUsername,
    maybeOTP,
    maybePassword,
    maybeUsername,
    otpSelector,
    passwordSelector,
    rulesetMaker,
    setClusterType,
    setFormType,
    setIgnoreType,
    setInputType,
    socialSelector,
    splitFieldsByVisibility,
    trainees,
    usernameSelector,
};
