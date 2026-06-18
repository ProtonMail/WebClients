/**
 * Subject-line OTP-email classifier. Answers "is this an OTP / one-time-code
 * email?" from the subject (plus an optional sender signal). It classifies — it
 * does NOT extract the code value; that is `OneTimeCodeDetector`'s job.
 *
 * Coverage: en/fr/es/pt/de. Stateless, no I/O.
 *
 * Ported from the validated reference matcher (see otp/PORTING notes). The
 * regexes encode several non-obvious, precision/recall-load-bearing invariants —
 * do not "simplify" them without re-measuring against the labelled set:
 *  - no `<CODE>` branch (that token is a dataset masking artifact, not real mail);
 *  - the CODE_TOKEN alnum branch REQUIRES a digit (keeps promo words like
 *    TRANSFER/HOLIDAYS out);
 *  - vetoes (EXCLUDE/PROMO) run before everything;
 *  - ASCII-mode word boundaries — do NOT add the `u` flag;
 *  - both straight and curly apostrophes are kept in the `d['’]…` forms;
 *  - named capture group is literally `b` (read by brandInSender).
 */

// --- normalisation ---
const normaliseSubject = (title: string): string => String(title).normalize('NFKC').trim();

// --- 1. keyword matcher ---
// English keyword stems that, immediately followed by "code"/"passcode", signal an OTP subject.
const EN_KEYWORDS =
    'verification|log[\\s-]?in|sign[\\s-]?in|confirmation|activation|' +
    'single[\\s-]?use|recovery|launch|security|authentication|access';

const COMBINED = new RegExp(
    [
        // EN  ("code" or "passcode"; one-time allows a hyphen; bare passcode is OTP-specific)
        `(?:${EN_KEYWORDS})\\s+(?:pass)?code`,
        'one[\\s-]?time[\\s-]?(?:pass(?:word|code)|code)|\\botp\\b',
        '\\bpasscode\\b',
        '\\b\\d\\s*-?\\s*digit\\s+code',
        // `\botp\b` above already matches "otp code", so otp is dropped from this group.
        '\\b(?:auth|mfa|2fa)\\s+code',
        // EN delivery phrases folded in from the former EXACT_OTP / YOUR_CODE_IS branches.
        "here['’]s\\s+your\\s+code",
        '\\byour\\s+code\\s+is\\b',
        // FR
        'code\\s+(?:de\\s+)?(?:v[ée]rification|connexion|s[ée]curit[ée]|confirmation)',
        "code\\s+(?:[àa]\\s+usage\\s+unique|d['’]acc[èe]s)",
        'v[ée]rification\\s+de\\s+votre\\s+compte',
        'code\\s+de\\s+(?:r[ée]initialisation|r[ée]cup[ée]ration|activation|validation)',
        "code\\s+d['’](?:activation|inscription|authentification)",
        'code\\s+de\\s+(?:double\\s+)?authentification',
        'mot\\s+de\\s+passe\\s+[àa]\\s+usage\\s+unique',
        'code\\s+[àa]\\s+\\d+\\s+chiffres',
        // ES
        'c[óo]digo\\s+de\\s+(?:verificaci[óo]n|seguridad|acceso|confirmaci[óo]n|inicio\\s+de\\s+sesi[óo]n|un\\s+solo\\s+uso|activaci[óo]n|autenticaci[óo]n)',
        'contrase[ñn]a\\s+de\\s+un\\s+solo\\s+uso',
        'c[óo]digo\\s+para\\b',
        'usa\\s+(?:el|este)\\s+c[óo]digo',
        // PT
        'c[óo]digo\\s+de\\s+(?:verifica[çc][ãa]o|seguran[çc]a|acesso|confirma[çc][ãa]o|in[íi]cio\\s+de\\s+sess[ãa]o|uso\\s+[úu]nico|login|valida[çc][ãa]o|autentica[çc][ãa]o|autoriza[çc][ãa]o|ativa[çc][ãa]o)',
        '(?:palavra[\\s-]?passe\\s+[úu]nica|senha\\s+de\\s+uso\\s+[úu]nico)',
        'c[óo]digo\\s+do\\b',
        'c[óo]digo\\s+[úu]nico\\b',
        // DE — hyphen fix: [\s-]? before "code"; + account verification
        '(?:anmelde|best[äa]tigungs|verifizierungs|verifikations|sicherheits|zugangs|aktivierungs|einmal)[\\s-]?code',
        'einmal[\\s-]?(?:kennwort|passwort)',
        'verifizierung\\s+(?:ihrer|der)',
        'kontobest[äa]tigung',
        'code\\s+zum\\s+(?:zur[üu]cksetzen|anmelden)',
        'code\\s+zur\\s+best[äa]tigung',
        '(?:zwei|2)[\\s-]?stufen[\\s-]?verifizierung',
    ].join('|'),
    'i'
);

// --- 2. possessive "your code" forms — require a real code token ---
const POSSESSIVE = new RegExp(
    [
        '\\byour\\b[^.;|]{0,25}\\bcode\\b',
        '\\bcode\\s+is\\b',
        '\\bcode\\s*:', // EN
        'votre\\s+code\\b',
        'voici\\s+votre\\s+code', // FR
        'tu\\s+c[óo]digo\\b', // ES
        '(?:o\\s+)?(?:seu|teu)\\s+c[óo]digo\\b', // PT
        '(?:ihr|dein)\\s+code\\b', // DE
    ].join('|'),
    'i'
);

// Real code token: a 4–8 digit run, two split digit groups, OR a 5–8 char
// alphanumeric run CONTAINING a digit. The digit requirement on the alnum branch
// is load-bearing: it keeps pure-letter promo words (TRANSFER, HOLIDAYS) from
// qualifying. NB: deliberately distinct from the extraction title regexes
// (`title_*` in ./extraction/extractors.ts), which use a 6-digit floor — this
// gate must also accept shorter 4–5 digit codes.
const CODE_TOKEN = /\b\d{4,8}\b|\b\d{2,4}[ -]\d{3,4}\b|\b(?=[A-Z0-9]{5,8}\b)[A-Z0-9]*\d[A-Z0-9]*\b/;

// --- 3. vetoes ---
const EXCLUDE = /\bcodes\b|download|generat/i;
const PROMO =
    /\bpromo|\bdiscount|\bcoupon|\bvoucher|%|\boff\b|\bsale\b|\bdeal\b|r[ée]duction|remise|privil[èe]ge|exclusi[fv]|descuento|promoci[óo]n|cup[óo]n|\boferta|desconto|promo[çc][ãa]o|cup[ãa]o|rabatt|gutschein|\d\s*[€$£]/i;

// --- 4. brand-in-sender ---
// Each pattern captures a brand token (named group `b`) from a "your <brand> code"
// shape, one per language. brandInSender then confirms that token also appears in
// the sender address, so this only fires when subject and sender corroborate.
// Recall-only: it never classifies on the subject alone, so it cannot cost precision.
const BRAND_PATTERNS = [
    /your\s+(?<b>[A-Za-z0-9][\w.&-]{1,20})\s+code\b/i, // EN
    /votre\s+code\s+(?<b>[A-Za-z0-9][\w.&-]{1,20})\b/i, // FR
    /tu\s+c[óo]digo\s+de\s+(?<b>[A-Za-z0-9][\w.&-]{1,20})\b/i, // ES
    /seu\s+c[óo]digo\s+d[eo]\s+(?<b>[A-Za-z0-9][\w.&-]{1,20})\b/i, // PT
    /(?:dein|ihr)\s+(?<b>[A-Za-z0-9][\w.&-]{1,20})\s+code\b/i, // DE
];

const brandInSender = (s: string, sender?: string): boolean => {
    if (!sender) {
        return false;
    }
    for (const pat of BRAND_PATTERNS) {
        const m = pat.exec(s);
        const b = m?.groups?.b;
        if (b && sender.toLowerCase().includes(b.toLowerCase())) {
            return true;
        }
    }
    return false;
};

/**
 * Classify an email subject as an OTP / one-time-code email.
 *
 * Pass the sender address (the `From` header / envelope sender) as the second
 * argument when available — it strictly adds recall (brand-in-sender) and never
 * costs precision. Subject-only is fully supported.
 */
export const isOtpSubject = (subject: string, sender?: string): boolean => {
    const s = normaliseSubject(subject);
    if (EXCLUDE.test(s) || PROMO.test(s)) {
        return false; // 3. vetoes always win
    }
    if (COMBINED.test(s)) {
        return true; // 1. keyword / folded delivery phrases
    }
    // 2. possessive "your code" forms, gated on a real code token. The gate is
    // required for precision: "Your … code EXPIRES SOON" / "Use code: TRANSFER"
    // must NOT classify as OTP.
    if (POSSESSIVE.test(s) && CODE_TOKEN.test(s)) {
        return true;
    }
    return brandInSender(s, sender); // 4. brand matches sender
};
