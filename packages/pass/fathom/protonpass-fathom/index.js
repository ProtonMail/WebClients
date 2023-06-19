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

const setInputType = (input, type) => input.setAttribute(DETECTED_FIELD_TYPE_ATTR, type);

const setFormType = (form, type) => form.setAttribute(DETECTED_FORM_TYPE_ATTR, type);

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
    return field.getAttribute(DETECTED_FIELD_TYPE_ATTR) === null;
};

const isUserEditableFNode = (fnode) => {
    const { visible, readonly, disabled } = fnode.noteFor('field');
    return visible && !readonly && !disabled;
};

const isUserEditableField = (el) => {
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
        ['login-fieldsCount', 3.9999547004699707],
        ['login-inputCount', 7.044769287109375],
        ['login-fieldsetCount', -28.238222122192383],
        ['login-textCount', -26.18356704711914],
        ['login-textareaCount', -6.017117977142334],
        ['login-selectCount', -9.689303398132324],
        ['login-checkboxCount', -3.0344669818878174],
        ['login-radioCount', -0.008867494761943817],
        ['login-identifierCount', -8.174284934997559],
        ['login-usernameCount', 7.638546466827393],
        ['login-emailCount', -16.675004959106445],
        ['login-submitCount', -10.089330673217773],
        ['login-hasTels', 0.38210606575012207],
        ['login-hasOAuth', 1.2383545637130737],
        ['login-hasCaptchas', 2.909295082092285],
        ['login-hasFiles', 0.08158696442842484],
        ['login-hasDate', -22.01603889465332],
        ['login-hasNumber', -6.112074851989746],
        ['login-noPasswordFields', -10.206161499023438],
        ['login-onePasswordField', 5.399639129638672],
        ['login-twoPasswordFields', -17.715301513671875],
        ['login-threePasswordFields', -17.982036590576172],
        ['login-oneIdentifierField', -2.914720296859741],
        ['login-twoIdentifierFields', -25.95005989074707],
        ['login-threeIdentifierFields', -7.439944267272949],
        ['login-hasHiddenIdentifier', -6.576870918273926],
        ['login-hasHiddenPassword', 34.309417724609375],
        ['login-autofocusedIsPassword', 17.677349090576172],
        ['login-visibleRatio', 0.19709211587905884],
        ['login-inputRatio', 2.318472385406494],
        ['login-hiddenRatio', 11.369463920593262],
        ['login-identifierRatio', 16.30859375],
        ['login-emailRatio', 11.457870483398438],
        ['login-usernameRatio', -11.181123733520508],
        ['login-passwordRatio', 10.720812797546387],
        ['login-requiredRatio', 3.019744396209717],
        ['login-patternRatio', -13.767681121826172],
        ['login-minMaxLengthRatio', 2.9941062927246094],
        ['login-pageLogin', 15.981587409973145],
        ['login-formTextLogin', 8.391026496887207],
        ['login-formAttrsLogin', 7.379906177520752],
        ['login-headingsLogin', 25.55678367614746],
        ['login-layoutLogin', 1.300864338874817],
        ['login-rememberMeCheckbox', 10.037508010864258],
        ['login-troubleLink', 22.741819381713867],
        ['login-submitLogin', 6.240677833557129],
        ['login-pageRegister', -9.845708847045898],
        ['login-formTextRegister', 0.031268589198589325],
        ['login-formAttrsRegister', -16.066009521484375],
        ['login-headingsRegister', -18.72487449645996],
        ['login-layoutRegister', 2.9144327640533447],
        ['login-checkboxTOS', 0.03224494308233261],
        ['login-submitRegister', -10.212053298950195],
        ['login-pagePwReset', -12.106812477111816],
        ['login-formTextPwReset', -5.987238883972168],
        ['login-formAttrsPwReset', -13.062773704528809],
        ['login-headingsPwReset', -11.077371597290039],
        ['login-layoutPwReset', -9.688557624816895],
        ['login-pageRecovery', -7.420191287994385],
        ['login-formTextRecovery', 0.006600216031074524],
        ['login-formAttrsRecovery', -15.919977188110352],
        ['login-headingsRecovery', -0.9663192629814148],
        ['login-layoutRecovery', -1.2497642040252686],
        ['login-identifierRecovery', 0.7921903729438782],
        ['login-submitRecovery', 1.9236692190170288],
        ['login-formTextMFA', 0.08218159526586533],
        ['login-formAttrsMFA', -2.582364082336426],
        ['login-headingsMFA', -16.4306583404541],
        ['login-layoutMFA', -4.174263954162598],
        ['login-buttonVerify', -9.000646591186523],
        ['login-inputsMFA', -21.030406951904297],
        ['login-inputsOTP', -13.45360279083252],
        ['login-linkOTPOutlier', -7.243903160095215],
        ['login-headingsNewsletter', -10.934698104858398],
        ['login-oneVisibleField', -7.700883865356445],
        ['login-buttonMultiStep', 2.3647990226745605],
        ['login-buttonMultiAction', 16.444520950317383],
        ['login-headingsMultiStep', -13.910924911499023],
    ],
    bias: -5.324637413024902,
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
        ['pw-change-fieldsCount', -1.9289140701293945],
        ['pw-change-inputCount', -1.5112258195877075],
        ['pw-change-fieldsetCount', -5.975445747375488],
        ['pw-change-textCount', -5.9189372062683105],
        ['pw-change-textareaCount', -5.967130661010742],
        ['pw-change-selectCount', -6.029764175415039],
        ['pw-change-checkboxCount', -5.9556450843811035],
        ['pw-change-radioCount', 0.016448207199573517],
        ['pw-change-identifierCount', -5.619643211364746],
        ['pw-change-usernameCount', -5.981591701507568],
        ['pw-change-emailCount', -4.057125091552734],
        ['pw-change-submitCount', -2.6654274463653564],
        ['pw-change-hasTels', -6.055002212524414],
        ['pw-change-hasOAuth', -5.97802209854126],
        ['pw-change-hasCaptchas', -5.962236404418945],
        ['pw-change-hasFiles', -0.09732290357351303],
        ['pw-change-hasDate', -6.1134185791015625],
        ['pw-change-hasNumber', -9.388379096984863],
        ['pw-change-noPasswordFields', -6.1164164543151855],
        ['pw-change-onePasswordField', -6.115403175354004],
        ['pw-change-twoPasswordFields', 12.93012809753418],
        ['pw-change-threePasswordFields', 21.385692596435547],
        ['pw-change-oneIdentifierField', -6.049549102783203],
        ['pw-change-twoIdentifierFields', -5.94252872467041],
        ['pw-change-threeIdentifierFields', 11.820959091186523],
        ['pw-change-hasHiddenIdentifier', -0.7669579982757568],
        ['pw-change-hasHiddenPassword', -5.948598384857178],
        ['pw-change-autofocusedIsPassword', 20.306228637695312],
        ['pw-change-visibleRatio', -3.483771800994873],
        ['pw-change-inputRatio', -3.4648056030273438],
        ['pw-change-hiddenRatio', -4.267314434051514],
        ['pw-change-identifierRatio', -5.293045997619629],
        ['pw-change-emailRatio', -5.15964412689209],
        ['pw-change-usernameRatio', -5.991598606109619],
        ['pw-change-passwordRatio', 4.5889058113098145],
        ['pw-change-requiredRatio', -4.2558393478393555],
        ['pw-change-patternRatio', 2.415273666381836],
        ['pw-change-minMaxLengthRatio', -2.7829432487487793],
        ['pw-change-pageLogin', -6.1077494621276855],
        ['pw-change-formTextLogin', -6.094205856323242],
        ['pw-change-formAttrsLogin', -6.006085395812988],
        ['pw-change-headingsLogin', -5.933164119720459],
        ['pw-change-layoutLogin', -5.970702648162842],
        ['pw-change-rememberMeCheckbox', -6.034140110015869],
        ['pw-change-troubleLink', -3.5866317749023438],
        ['pw-change-submitLogin', -6.063286304473877],
        ['pw-change-pageRegister', -6.0080389976501465],
        ['pw-change-formTextRegister', 0.07044734805822372],
        ['pw-change-formAttrsRegister', -6.014848232269287],
        ['pw-change-headingsRegister', -6.492048263549805],
        ['pw-change-layoutRegister', -5.923305034637451],
        ['pw-change-checkboxTOS', 0.02125319093465805],
        ['pw-change-submitRegister', -6.2548747062683105],
        ['pw-change-pagePwReset', 17.366880416870117],
        ['pw-change-formTextPwReset', 18.628246307373047],
        ['pw-change-formAttrsPwReset', 2.813215970993042],
        ['pw-change-headingsPwReset', 17.223068237304688],
        ['pw-change-layoutPwReset', 14.762106895446777],
        ['pw-change-pageRecovery', -6.0750274658203125],
        ['pw-change-formTextRecovery', -0.015879787504673004],
        ['pw-change-formAttrsRecovery', -5.918270111083984],
        ['pw-change-headingsRecovery', -6.029335021972656],
        ['pw-change-layoutRecovery', -4.279824256896973],
        ['pw-change-identifierRecovery', -5.946380138397217],
        ['pw-change-submitRecovery', -0.4780399203300476],
        ['pw-change-formTextMFA', 0.0409267321228981],
        ['pw-change-formAttrsMFA', -5.942766189575195],
        ['pw-change-headingsMFA', -6.059384822845459],
        ['pw-change-layoutMFA', -5.971053123474121],
        ['pw-change-buttonVerify', -5.990790367126465],
        ['pw-change-inputsMFA', -6.106626033782959],
        ['pw-change-inputsOTP', -5.903764724731445],
        ['pw-change-linkOTPOutlier', -6.350155353546143],
        ['pw-change-headingsNewsletter', -5.8933258056640625],
        ['pw-change-oneVisibleField', -5.938478946685791],
        ['pw-change-buttonMultiStep', -5.960569381713867],
        ['pw-change-buttonMultiAction', -6.11636209487915],
        ['pw-change-headingsMultiStep', -6.042990207672119],
    ],
    bias: -3.532585620880127,
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
        ['register-fieldsCount', 7.915228843688965],
        ['register-inputCount', 9.20473575592041],
        ['register-fieldsetCount', 2.8699817657470703],
        ['register-textCount', -2.18623948097229],
        ['register-textareaCount', -4.67122745513916],
        ['register-selectCount', -2.669811487197876],
        ['register-checkboxCount', -6.543245315551758],
        ['register-radioCount', 0.051923967897892],
        ['register-identifierCount', 7.65179443359375],
        ['register-usernameCount', -3.478762149810791],
        ['register-emailCount', 2.817927122116089],
        ['register-submitCount', -0.9562453627586365],
        ['register-hasTels', 18.61067771911621],
        ['register-hasOAuth', 1.698642611503601],
        ['register-hasCaptchas', 6.194472789764404],
        ['register-hasFiles', 0.11038217693567276],
        ['register-hasDate', 9.945738792419434],
        ['register-hasNumber', 45.620174407958984],
        ['register-noPasswordFields', -3.7772254943847656],
        ['register-onePasswordField', 3.780996322631836],
        ['register-twoPasswordFields', 12.418416976928711],
        ['register-threePasswordFields', -6.997471809387207],
        ['register-oneIdentifierField', 2.9789531230926514],
        ['register-twoIdentifierFields', 17.029306411743164],
        ['register-threeIdentifierFields', 9.704482078552246],
        ['register-hasHiddenIdentifier', 2.785032033920288],
        ['register-hasHiddenPassword', -9.161622047424316],
        ['register-autofocusedIsPassword', -8.43294620513916],
        ['register-visibleRatio', -10.975846290588379],
        ['register-inputRatio', -9.799909591674805],
        ['register-hiddenRatio', -15.487661361694336],
        ['register-identifierRatio', 13.259195327758789],
        ['register-emailRatio', 2.8152036666870117],
        ['register-usernameRatio', -24.800601959228516],
        ['register-passwordRatio', -5.897083282470703],
        ['register-requiredRatio', -0.3699733018875122],
        ['register-patternRatio', -3.6948611736297607],
        ['register-minMaxLengthRatio', -8.68985652923584],
        ['register-pageLogin', -6.509321689605713],
        ['register-formTextLogin', -6.242934226989746],
        ['register-formAttrsLogin', -2.7091963291168213],
        ['register-headingsLogin', -11.965217590332031],
        ['register-layoutLogin', 3.1700644493103027],
        ['register-rememberMeCheckbox', -6.459417343139648],
        ['register-troubleLink', -28.30510711669922],
        ['register-submitLogin', -5.956231117248535],
        ['register-pageRegister', -4.835072040557861],
        ['register-formTextRegister', -0.05035767704248428],
        ['register-formAttrsRegister', 23.660070419311523],
        ['register-headingsRegister', 4.689288139343262],
        ['register-layoutRegister', -1.0443148612976074],
        ['register-checkboxTOS', -0.001943141222000122],
        ['register-submitRegister', 17.3704891204834],
        ['register-pagePwReset', -6.291702747344971],
        ['register-formTextPwReset', -6.025259494781494],
        ['register-formAttrsPwReset', -5.90030574798584],
        ['register-headingsPwReset', -12.10546875],
        ['register-layoutPwReset', -11.362836837768555],
        ['register-pageRecovery', -24.710296630859375],
        ['register-formTextRecovery', -0.0024022459983825684],
        ['register-formAttrsRecovery', -6.344860076904297],
        ['register-headingsRecovery', -30.135648727416992],
        ['register-layoutRecovery', -6.5687689781188965],
        ['register-identifierRecovery', -30.367780685424805],
        ['register-submitRecovery', -21.938095092773438],
        ['register-formTextMFA', -0.10690715909004211],
        ['register-formAttrsMFA', 9.551400184631348],
        ['register-headingsMFA', -29.545339584350586],
        ['register-layoutMFA', -0.33849620819091797],
        ['register-buttonVerify', 17.846736907958984],
        ['register-inputsMFA', -18.19354248046875],
        ['register-inputsOTP', -27.01239585876465],
        ['register-linkOTPOutlier', 1.770485758781433],
        ['register-headingsNewsletter', -32.73594665527344],
        ['register-oneVisibleField', -9.517705917358398],
        ['register-buttonMultiStep', 10.887181282043457],
        ['register-buttonMultiAction', 4.733676433563232],
        ['register-headingsMultiStep', 37.69981002807617],
    ],
    bias: 0.6240731477737427,
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
        ['recovery-fieldsCount', -3.6763880252838135],
        ['recovery-inputCount', -3.790900945663452],
        ['recovery-fieldsetCount', 5.010519027709961],
        ['recovery-textCount', 16.462078094482422],
        ['recovery-textareaCount', -25.47947883605957],
        ['recovery-selectCount', -10.425769805908203],
        ['recovery-checkboxCount', -7.0011887550354],
        ['recovery-radioCount', 0.03234165161848068],
        ['recovery-identifierCount', 4.8865275382995605],
        ['recovery-usernameCount', 23.480241775512695],
        ['recovery-emailCount', -7.831392288208008],
        ['recovery-submitCount', -1.5786166191101074],
        ['recovery-hasTels', -6.42938756942749],
        ['recovery-hasOAuth', -3.422316551208496],
        ['recovery-hasCaptchas', -0.6419459581375122],
        ['recovery-hasFiles', -0.003665842115879059],
        ['recovery-hasDate', -6.014379978179932],
        ['recovery-hasNumber', -6.127610683441162],
        ['recovery-noPasswordFields', -2.0826985836029053],
        ['recovery-onePasswordField', -23.86602783203125],
        ['recovery-twoPasswordFields', -6.220921993255615],
        ['recovery-threePasswordFields', -13.899462699890137],
        ['recovery-oneIdentifierField', 4.665963649749756],
        ['recovery-twoIdentifierFields', 10.665215492248535],
        ['recovery-threeIdentifierFields', -6.328004360198975],
        ['recovery-hasHiddenIdentifier', -10.74587631225586],
        ['recovery-hasHiddenPassword', -14.242454528808594],
        ['recovery-autofocusedIsPassword', -5.907811164855957],
        ['recovery-visibleRatio', -0.363317608833313],
        ['recovery-inputRatio', -9.740848541259766],
        ['recovery-hiddenRatio', 5.410333156585693],
        ['recovery-identifierRatio', 8.098170280456543],
        ['recovery-emailRatio', 1.5188415050506592],
        ['recovery-usernameRatio', -0.2389611452817917],
        ['recovery-passwordRatio', -18.124956130981445],
        ['recovery-requiredRatio', 3.7313687801361084],
        ['recovery-patternRatio', -16.709388732910156],
        ['recovery-minMaxLengthRatio', 5.007291316986084],
        ['recovery-pageLogin', -2.7717649936676025],
        ['recovery-formTextLogin', -6.02664852142334],
        ['recovery-formAttrsLogin', -0.043993886560201645],
        ['recovery-headingsLogin', -5.526517868041992],
        ['recovery-layoutLogin', -18.590625762939453],
        ['recovery-rememberMeCheckbox', -6.100385665893555],
        ['recovery-troubleLink', -2.009202718734741],
        ['recovery-submitLogin', -5.966364860534668],
        ['recovery-pageRegister', -7.2148003578186035],
        ['recovery-formTextRegister', -0.016111522912979126],
        ['recovery-formAttrsRegister', -8.807435035705566],
        ['recovery-headingsRegister', -4.745365142822266],
        ['recovery-layoutRegister', -8.590777397155762],
        ['recovery-checkboxTOS', 0.0848996713757515],
        ['recovery-submitRegister', -7.90927791595459],
        ['recovery-pagePwReset', 8.216135025024414],
        ['recovery-formTextPwReset', -6.979242324829102],
        ['recovery-formAttrsPwReset', 10.404891014099121],
        ['recovery-headingsPwReset', 12.252565383911133],
        ['recovery-layoutPwReset', 4.751585006713867],
        ['recovery-pageRecovery', 19.842803955078125],
        ['recovery-formTextRecovery', -0.10075054317712784],
        ['recovery-formAttrsRecovery', 26.71755599975586],
        ['recovery-headingsRecovery', -1.4662754535675049],
        ['recovery-layoutRecovery', -2.4301705360412598],
        ['recovery-identifierRecovery', 16.895954132080078],
        ['recovery-submitRecovery', 13.714089393615723],
        ['recovery-formTextMFA', -0.0667162835597992],
        ['recovery-formAttrsMFA', 14.914823532104492],
        ['recovery-headingsMFA', 1.1647058725357056],
        ['recovery-layoutMFA', -6.076399803161621],
        ['recovery-buttonVerify', -6.908900737762451],
        ['recovery-inputsMFA', 1.4762605428695679],
        ['recovery-inputsOTP', -11.175529479980469],
        ['recovery-linkOTPOutlier', 9.512681007385254],
        ['recovery-headingsNewsletter', -13.587630271911621],
        ['recovery-oneVisibleField', 0.5374948382377625],
        ['recovery-buttonMultiStep', -2.6184685230255127],
        ['recovery-buttonMultiAction', -6.0315775871276855],
        ['recovery-headingsMultiStep', -5.9954328536987305],
    ],
    bias: -11.982169151306152,
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
        ['mfa-fieldsCount', -4.576327800750732],
        ['mfa-inputCount', -4.928408622741699],
        ['mfa-fieldsetCount', 5.835984230041504],
        ['mfa-textCount', -2.4853596687316895],
        ['mfa-textareaCount', -6.2810139656066895],
        ['mfa-selectCount', -6.021391868591309],
        ['mfa-checkboxCount', -7.320930480957031],
        ['mfa-radioCount', -0.03540460765361786],
        ['mfa-identifierCount', -4.319897651672363],
        ['mfa-usernameCount', -4.9829182624816895],
        ['mfa-emailCount', -6.665172100067139],
        ['mfa-submitCount', -2.749657154083252],
        ['mfa-hasTels', 12.588950157165527],
        ['mfa-hasOAuth', -6.251445770263672],
        ['mfa-hasCaptchas', -1.4860643148422241],
        ['mfa-hasFiles', -0.06811711192131042],
        ['mfa-hasDate', -5.908789157867432],
        ['mfa-hasNumber', 8.279184341430664],
        ['mfa-noPasswordFields', 0.23483681678771973],
        ['mfa-onePasswordField', -5.890006065368652],
        ['mfa-twoPasswordFields', -8.305509567260742],
        ['mfa-threePasswordFields', -5.950006008148193],
        ['mfa-oneIdentifierField', -4.390366077423096],
        ['mfa-twoIdentifierFields', -5.896542549133301],
        ['mfa-threeIdentifierFields', -6.094266414642334],
        ['mfa-hasHiddenIdentifier', -4.647820949554443],
        ['mfa-hasHiddenPassword', -2.408534049987793],
        ['mfa-autofocusedIsPassword', 6.251583576202393],
        ['mfa-visibleRatio', -4.880526542663574],
        ['mfa-inputRatio', -2.653197765350342],
        ['mfa-hiddenRatio', 2.0455846786499023],
        ['mfa-identifierRatio', -4.384329795837402],
        ['mfa-emailRatio', -6.485166549682617],
        ['mfa-usernameRatio', -5.506118297576904],
        ['mfa-passwordRatio', -4.73811149597168],
        ['mfa-requiredRatio', 8.077375411987305],
        ['mfa-patternRatio', 9.723830223083496],
        ['mfa-minMaxLengthRatio', 0.5579230785369873],
        ['mfa-pageLogin', 4.788343906402588],
        ['mfa-formTextLogin', -6.118318557739258],
        ['mfa-formAttrsLogin', -3.261157512664795],
        ['mfa-headingsLogin', -3.8230788707733154],
        ['mfa-layoutLogin', -1.394718050956726],
        ['mfa-rememberMeCheckbox', -6.108580589294434],
        ['mfa-troubleLink', -6.07451057434082],
        ['mfa-submitLogin', 0.057299837470054626],
        ['mfa-pageRegister', -4.694045543670654],
        ['mfa-formTextRegister', -0.09034595638513565],
        ['mfa-formAttrsRegister', -4.255557537078857],
        ['mfa-headingsRegister', -7.576149940490723],
        ['mfa-layoutRegister', -4.40820837020874],
        ['mfa-checkboxTOS', -0.09142760187387466],
        ['mfa-submitRegister', -5.952333927154541],
        ['mfa-pagePwReset', -6.022702217102051],
        ['mfa-formTextPwReset', -6.071940898895264],
        ['mfa-formAttrsPwReset', -6.1136956214904785],
        ['mfa-headingsPwReset', -6.080158710479736],
        ['mfa-layoutPwReset', -6.051601886749268],
        ['mfa-pageRecovery', 0.8042700290679932],
        ['mfa-formTextRecovery', 0.011478155851364136],
        ['mfa-formAttrsRecovery', -6.873488426208496],
        ['mfa-headingsRecovery', -7.039450645446777],
        ['mfa-layoutRecovery', 1.7421939373016357],
        ['mfa-identifierRecovery', -5.992132186889648],
        ['mfa-submitRecovery', -1.931208848953247],
        ['mfa-formTextMFA', -0.05258011817932129],
        ['mfa-formAttrsMFA', 14.54378890991211],
        ['mfa-headingsMFA', 16.468658447265625],
        ['mfa-layoutMFA', 11.693756103515625],
        ['mfa-buttonVerify', 16.413131713867188],
        ['mfa-inputsMFA', 16.02052879333496],
        ['mfa-inputsOTP', 19.09172248840332],
        ['mfa-linkOTPOutlier', -2.8196351528167725],
        ['mfa-headingsNewsletter', -6.050066947937012],
        ['mfa-oneVisibleField', -1.1142364740371704],
        ['mfa-buttonMultiStep', 2.3803770542144775],
        ['mfa-buttonMultiAction', -5.965698719024658],
        ['mfa-headingsMultiStep', 8.247714042663574],
    ],
    bias: -2.8809332847595215,
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
        ['pw-loginScore', 10.921965599060059],
        ['pw-registerScore', -12.107793807983398],
        ['pw-pwChangeScore', -5.60598611831665],
        ['pw-exotic', -14.477164268493652],
        ['pw-dangling', 0.13641053438186646],
        ['pw-autocompleteNew', -2.5774829387664795],
        ['pw-autocompleteCurrent', 6.093249797821045],
        ['pw-autocompleteOff', -1.3007344007492065],
        ['pw-isOnlyPassword', 4.582601547241211],
        ['pw-prevPwField', -1.0765197277069092],
        ['pw-nextPwField', -1.6907835006713867],
        ['pw-attrCreate', -1.2709492444992065],
        ['pw-attrCurrent', 2.3541676998138428],
        ['pw-attrConfirm', -6.152408123016357],
        ['pw-attrReset', -0.182376429438591],
        ['pw-textCreate', -1.9227776527404785],
        ['pw-textCurrent', 6.370639324188232],
        ['pw-textConfirm', -6.221524238586426],
        ['pw-textReset', 0.024863004684448242],
        ['pw-labelCreate', -6.489076137542725],
        ['pw-labelCurrent', 8.950603485107422],
        ['pw-labelConfirm', -6.280572414398193],
        ['pw-labelReset', 0.05933178961277008],
        ['pw-prevPwCreate', -6.128571510314941],
        ['pw-prevPwCurrent', -7.882842540740967],
        ['pw-prevPwConfirm', 0.10489603877067566],
        ['pw-passwordOutlier', -6.382625579833984],
        ['pw-nextPwCreate', 8.77518367767334],
        ['pw-nextPwCurrent', 0.13811838626861572],
        ['pw-nextPwConfirm', -6.43726110458374],
    ],
    bias: -0.8883916139602661,
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
        ['pw[new]-loginScore', -12.582420349121094],
        ['pw[new]-registerScore', 13.595878601074219],
        ['pw[new]-pwChangeScore', 3.0887091159820557],
        ['pw[new]-exotic', 14.236388206481934],
        ['pw[new]-dangling', -0.005762621760368347],
        ['pw[new]-autocompleteNew', 1.7066107988357544],
        ['pw[new]-autocompleteCurrent', -6.0698561668396],
        ['pw[new]-autocompleteOff', -0.04396723210811615],
        ['pw[new]-isOnlyPassword', -2.9876978397369385],
        ['pw[new]-prevPwField', -0.908395528793335],
        ['pw[new]-nextPwField', 9.50277328491211],
        ['pw[new]-attrCreate', 1.5407615900039673],
        ['pw[new]-attrCurrent', -2.5392236709594727],
        ['pw[new]-attrConfirm', 7.7050089836120605],
        ['pw[new]-attrReset', -0.045059993863105774],
        ['pw[new]-textCreate', 0.4347620904445648],
        ['pw[new]-textCurrent', -6.04103422164917],
        ['pw[new]-textConfirm', -15.633255004882812],
        ['pw[new]-textReset', 0.10576707124710083],
        ['pw[new]-labelCreate', 8.548257827758789],
        ['pw[new]-labelCurrent', -13.235011100769043],
        ['pw[new]-labelConfirm', 7.941024303436279],
        ['pw[new]-labelReset', -0.10478280484676361],
        ['pw[new]-prevPwCreate', 10.784834861755371],
        ['pw[new]-prevPwCurrent', 7.98258113861084],
        ['pw[new]-prevPwConfirm', -0.09538668394088745],
        ['pw[new]-passwordOutlier', -26.893898010253906],
        ['pw[new]-nextPwCreate', -6.76524019241333],
        ['pw[new]-nextPwCurrent', -0.00945669412612915],
        ['pw[new]-nextPwConfirm', 8.749025344848633],
    ],
    bias: -1.7546014785766602,
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
        ['username-autocompleteUsername', 9.54362964630127],
        ['username-autocompleteNickname', -0.06965652108192444],
        ['username-autocompleteEmail', -7.710648059844971],
        ['username-autocompleteOff', -0.48004263639450073],
        ['username-attrUsername', 18.5942440032959],
        ['username-textUsername', 9.434368133544922],
        ['username-labelUsername', 18.07527732849121],
        ['username-outlierUsername', -7.4660210609436035],
        ['username-loginUsername', 18.65408706665039],
    ],
    bias: -9.744197845458984,
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
        ['username[hidden]-exotic', -14.203753471374512],
        ['username[hidden]-dangling', -9.02687931060791],
        ['username[hidden]-attrUsername', 9.97608757019043],
        ['username[hidden]-attrEmail', 8.097261428833008],
        ['username[hidden]-usernameName', 7.168479919433594],
        ['username[hidden]-autocompleteUsername', 2.160574197769165],
        ['username[hidden]-hiddenEmailValue', 10.877384185791016],
        ['username[hidden]-hiddenTelValue', 3.033069133758545],
        ['username[hidden]-hiddenUsernameValue', 1.194217324256897],
    ],
    bias: -14.648089408874512,
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
        ['email-autocompleteUsername', 1.3284434080123901],
        ['email-autocompleteNickname', 0.10936880111694336],
        ['email-autocompleteEmail', 5.86093282699585],
        ['email-typeEmail', 14.934659957885742],
        ['email-exactAttrEmail', 13.400425910949707],
        ['email-attrEmail', 2.176018714904785],
        ['email-textEmail', 14.594438552856445],
        ['email-labelEmail', 17.073060989379883],
        ['email-placeholderEmail', 15.457521438598633],
        ['email-attrSearch', -13.181452751159668],
        ['email-textSearch', -13.950875282287598],
    ],
    bias: -9.403656959533691,
    cutoff: 0.5,
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
        ['otp-mfaScore', 17.16939353942871],
        ['otp-exotic', -6.3944501876831055],
        ['otp-dangling', -8.806946754455566],
        ['otp-linkOTPOutlier', -13.208600044250488],
        ['otp-hasCheckboxes', -0.0362868458032608],
        ['otp-hidden', -9.542900085449219],
        ['otp-required', 0.493910014629364],
        ['otp-nameMatch', -8.273444175720215],
        ['otp-idMatch', 6.1004509925842285],
        ['otp-numericMode', 10.577947616577148],
        ['otp-autofocused', 6.7883806228637695],
        ['otp-tabIndex1', -0.5414505004882812],
        ['otp-patternOTP', 2.6518948078155518],
        ['otp-maxLength1', 6.806176662445068],
        ['otp-maxLength5', -8.312765121459961],
        ['otp-minLength6', 13.858613014221191],
        ['otp-maxLength6', 7.24784517288208],
        ['otp-maxLength20', -5.78126859664917],
        ['otp-autocompleteOTC', -0.038863539695739746],
        ['otp-autocompleteOff', -5.340882301330566],
        ['otp-prevAligned', 0.927474319934845],
        ['otp-prevArea', 3.3590333461761475],
        ['otp-nextAligned', -0.0004688054323196411],
        ['otp-nextArea', 3.639456272125244],
        ['otp-attrMFA', 6.038482666015625],
        ['otp-attrOTP', 10.090239524841309],
        ['otp-attrOutlier', -8.14090347290039],
        ['otp-textMFA', 6.925130844116211],
        ['otp-textOTP', 9.32318115234375],
        ['otp-labelMFA', 13.665705680847168],
        ['otp-labelOTP', -6.518216609954834],
        ['otp-labelOutlier', -6.442094802856445],
        ['otp-wrapperOTP', 4.4981160163879395],
        ['otp-wrapperOutlier', -6.28847074508667],
        ['otp-emailOutlierCount', -20.00609016418457],
    ],
    bias: -12.515424728393555,
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

const getFormLikeClusters = (doc) => {
    const preDetected = Array.from(doc.querySelectorAll(`[${DETECTED_FORM_TYPE_ATTR}]`));
    const forms = preDetected.concat(Array.from(doc.querySelectorAll(formOfInterestSelector)));
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
    return Array.from(
        new Set(
            ancestors.filter((ancestor, _, allAncestors) => {
                const ancestorWrap = allAncestors.some((el) => ancestor !== el && el.contains(ancestor));
                return (
                    !ancestorWrap &&
                    isVisible(ancestor, {
                        opacity: true,
                    })
                );
            })
        )
    );
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
                rule(dom(formOfInterestSelector).when(isFormOfInterest), type('form').note(getFormFeatures), {}),
                rule(formLikeDom(), type('form').note(getFormFeatures), {}),
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
    DETECTED_FIELD_TYPE_ATTR,
    DETECTED_FORM_TYPE_ATTR,
    EL_ATTRIBUTES,
    FIELD_ATTRIBUTES,
    FORM_ATTRIBUTES,
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
    setFormType,
    setInputType,
    socialSelector,
    splitFieldsByVisibility,
    trainees,
    usernameSelector,
};
