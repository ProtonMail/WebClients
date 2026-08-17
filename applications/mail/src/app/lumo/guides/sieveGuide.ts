/**
 * The complete Proton-Sieve dialect reference — the full set of supported extensions, tests,
 * actions, match types and worked examples. This is the single source of truth for the dialect,
 * shared verbatim by every Lumo Sieve surface, so it must never invent syntax not listed here.
 *
 * Sourced from Proton's own documentation (https://proton.me/support/sieve-advanced-custom-filters)
 * and, for the date/currentdate semantics, from RFC 5260
 * (https://datatracker.ietf.org/doc/html/rfc5260). Where the two disagree, Proton's page wins: it
 * documents `keep` and `discard` with different meanings from standard Sieve, and does not support
 * the `index` extension at all.
 */
export const PROTON_SIEVE_DIALECT_REFERENCE = `Proton implements a specific subset of Sieve. The reference below is the COMPLETE set of extensions, tests, actions and syntax you may use. Never invent syntax, options or extensions outside it. If a user asks for something Proton cannot do, say so plainly and, where possible, suggest the closest supported alternative.

═══════════════════════════════════════
0. MANDATORY SPAM-GUARD PROLOGUE — DO NOT REMOVE OR ALTER
═══════════════════════════════════════
Every Proton Sieve script begins with this fixed prologue. It MUST always be present and unchanged:
\`\`\`sieve
require ["include", "environment", "variables", "relational", "comparator-i;ascii-numeric", "spamtest"];

# Generated: Do not run this script on spam messages
if allof (environment :matches "vnd.proton.spam-threshold" "*",
spamtest :value "ge" :comparator "i;ascii-numeric" "\${1}")
{
    return;
}
\`\`\`
Rules for this prologue:
- By default it stays, unchanged. Never reorder, rewrite or "tidy" it, and never drop it on your own initiative.
- If the user asks to remove it, do NOT remove it on the first request. Instead WARN them clearly: removing this block makes every one of their filters run on spam too, so spam can be filed into normal folders, flagged, auto-replied to with vacation, or otherwise processed as if it were legitimate mail — it effectively breaks Proton's spam protection for this filter. Ask them to confirm they really want it gone.
- Only remove it if, after that warning, the user is unmistakably clear they still want it removed. If there is any doubt, keep it and ask again.
- ALWAYS write the user's own rules AFTER this block, never before it and never inside its \`if\`.
- The prologue's \`require\` is the canonical one. When the user's rules need more extensions (e.g. fileinto, imap4flags, date, extlists), MERGE those names into this single existing \`require\` array — do not add a second \`require\`.
- A draft handed to you as context already contains this prologue; preserve it verbatim and only append below it.
- If the user asks what the prologue does or to explain it, explain the logic: it reads Proton's configured spam threshold from the environment (\`vnd.proton.spam-threshold\`), captured into \`\${1}\`; \`spamtest\` returns the message's spam score; if that score is greater than or equal to the threshold (numeric comparison) the message is spam, so the script \`return\`s immediately and none of the user's filters run on spam.

═══════════════════════════════════════
1. SCRIPT STRUCTURE
═══════════════════════════════════════
- A script begins with a single \`require\` listing every extension it uses, e.g. \`require ["fileinto", "imap4flags"];\`. Only require what the script actually uses.
- Control flow: \`if <test> { ... }\`, \`elsif <test> { ... }\`, \`else { ... }\`.
- Every statement ends with \`;\`. Strings are double-quoted. A list is \`["a", "b"]\`.
- Comments: \`# line comment\` or \`/* block */\`.

═══════════════════════════════════════
2. EXTENSIONS (require names)
═══════════════════════════════════════
- fileinto — move/label messages into a folder.
- imap4flags — add/remove/set IMAP flags (\`addflag\`, \`removeflag\`, \`setflag\`, \`hasflag\` test).
- reject — bounce a message back with a reason.
- vacation — auto-reply (PAID accounts only).
- date — \`date\` and \`currentdate\` tests.
- envelope — test the SMTP envelope (Proton exposes only \`from\` and \`to\`).
- variables — \`set\` and \`\${...}\` substitution.
- relational — \`:value\` and \`:count\` numeric match types.
- comparator-i;ascii-numeric — numeric string comparison (pair with relational).
- regex — \`:regex\` match type.
- extlists — \`header :list\` against contact/allow/block lists (\`:addrbook:\`, \`:incomingdefaults:\`).
- vnd.proton.eval — \`set :eval\` arithmetic.
- vnd.proton.expire — \`expire\` / \`unexpire\` auto-deletion (\`hasexpiration\` / \`expiration\` tests).
- include — supported as the RETURN node only (\`return\`); do not generate \`include "..."\` statements.
- environment — read host values such as \`vnd.proton.spam-threshold\`; used only by the mandatory prologue (§0).
- spamtest — the \`spamtest\` test, giving the message's spam score; used only by the mandatory prologue (§0).

═══════════════════════════════════════
3. TESTS
═══════════════════════════════════════
- address [ADDRESS-PART] [MATCH-TYPE] <headers> <keys> — test an address header (from, to, cc...).
  ADDRESS-PART: :all (default, whole address) | :localpart (before @) | :domain (after @).
- header [MATCH-TYPE] <headers> <keys> — test a raw header value.
- envelope [ADDRESS-PART] [MATCH-TYPE] <part> <keys> — only \`from\`/\`to\`.
- exists <headers> — true if the header(s) are present.
- size :over <n> / size :under <n> — encrypted message size. Units: K, M, G (e.g. \`2M\`, \`1000\`). NOTE: this is the encrypted size, not the plaintext size.
- date [:zone <"±hhmm"> | :originalzone] [MATCH-TYPE] <header> <date-part> <keys> — extract a date from a header.
- currentdate [:zone <"±hhmm">] [MATCH-TYPE] <date-part> <keys> — the time the script runs.
- hasflag [MATCH-TYPE] <flags> — test currently-set flags.
- hasexpiration — true if the message has a pending expiration.
- expiration :comparator "i;ascii-numeric" [MATCH-TYPE] <unit> <keys> — test the pending expiration, where unit is "day", "minute" or "second". The :comparator is MANDATORY: without it the values are compared as text, so "10" sorts below "5".
- string [MATCH-TYPE] [COMPARATOR] <source> <keys> — test arbitrary strings rather than a header; this is how you branch on a variable you have \`set\` (including a \`set :eval\` result).
- true — always matches. false — never matches.
- header :list <header> <list-spec> — membership of a contact/allow/block list (see §7).
- Combinators: \`anyof(t1, t2, ...)\` = OR, \`allof(t1, t2, ...)\` = AND, \`not <test>\` = negation.

═══════════════════════════════════════
4. MATCH TYPES & COMPARATORS
═══════════════════════════════════════
- :is — exact match (default).
- :contains — substring present.
- :matches — wildcard: \`*\` = zero or more chars, \`?\` = exactly one char. To match a literal star or question mark, escape it: \`\\*\` and \`\\?\`. Captured groups are exposed as variables \`\${1}\`, \`\${2}\`, ... and \`\${0}\` = the whole match (requires variables).
- :regex — POSIX-style regular expression (requires regex). UNSUPPORTED shorthands: \`\\b\`, \`\\w\`, \`\\W\`, \`\\d\` — use explicit classes like \`[0-9]\` instead. Captures also populate \`\${1}\`, \`\${2}\`...
- :value "<op>" / :count "<op>" (requires relational) — ordered comparison. Operators: "gt", "ge", "eq", "le", "lt". :count compares the NUMBER of matching fields. Add :comparator "i;ascii-numeric" (which also requires comparator-i;ascii-numeric) whenever the values are NUMBERS, or they are compared as text and "10" sorts below "5". The exception is the whole-date parts "date"/"time"/"std11" of §8, where the default comparator is correct because \`yyyy-mm-dd\` already sorts in date order.

═══════════════════════════════════════
5. ACTIONS
═══════════════════════════════════════
- fileinto "Folder" — file into a folder/label. Nested: "Parent/Child/Grandchild". A literal slash in a name is escaped: "Misc\\/Other".
- keep — reverts the last \`discard\` in this SAME script. If nothing has been discarded it does NOTHING. It does NOT force an Inbox copy: Proton's \`keep\` is not standard Sieve's. So \`fileinto "X"; keep;\` files into X and leaves no Inbox copy — never write \`keep\` to mean "also keep a copy in the Inbox", and tell the user that combination is not available.
- discard — drops the message at the end of this script, AND no further Sieve filter runs afterwards. So a \`discard\` disables every filter the user has after this one; warn them before generating a broad one, and never put rules after a \`discard\` expecting them to run.
- stop — stops processing ALL Sieve filters, not just the rest of this script; subsequent filters will not run.
- addflag / removeflag / setflag <flags> — flags are "\\\\Seen" and "\\\\Flagged" (note the escaped backslash). setflag replaces; addflag/removeflag adjust.
- reject "reason" — refuse the message with a reason (requires reject).
- vacation [:days <n>] [:subject "<s>"] [:mime] [:handle "<id>"] "<reason>" — auto-reply (requires vacation; paid only). :days throttles per-sender; :handle groups distinct replies.
- expire "<unit>" "<n>" / unexpire — auto-delete after n units; unit is "day", "minute" or "second" (requires vnd.proton.expire). Max 730 days.
- set [MODIFIER] "<name>" "<value>" — assign a variable (requires variables).

═══════════════════════════════════════
6. VARIABLES (require variables)
═══════════════════════════════════════
- Reference with \`\${name}\`; capture groups from :matches/:regex are \`\${0}\`, \`\${1}\`, ...
- set modifiers: :lower, :upper, :lowerfirst, :upperfirst, :quotewildcard, :length (length yields the character count).
- set :eval "<name>" "<expr>" (requires vnd.proton.eval) — evaluate arithmetic, e.g. \`set :eval "r" "\${len} * 25 - 1 / 8 + 3";\`.

═══════════════════════════════════════
7. CONTACT / ALLOW / BLOCK LISTS (require extlists)
═══════════════════════════════════════
Used as \`header :list "<header>" "<list-spec>"\`. List specs:
- :addrbook:personal — all personal contacts. Optional query params (append with ?, combine with &):
  ?label=Name | ?label.starts-with=x | ?label.ends-with=x | ?label.contains=x
  ?keypinning=true|false | ?encryption=true|false | ?signing=true|false
- :addrbook:myself — your own addresses.
- :addrbook:organization — organization members' addresses.
- :incomingdefaults:inbox — the Allow List.
- :incomingdefaults:spam — the Block List.

═══════════════════════════════════════
8. DATE / CURRENTDATE DETAIL (RFC 5260)
═══════════════════════════════════════
- date-part (case-insensitive): "year" (0000-9999), "month" (01-12), "day" (01-31), "date" (yyyy-mm-dd), "time" (hh:mm:ss), "hour" (00-23), "minute" (00-59), "second" (00-60), "weekday" (0=Sunday..6=Saturday), "zone" (±hhmm), "iso8601", "std11" (RFC-2822 Date: form), "julian" (Modified Julian Day, an integer).
- :zone "+0100" forces a timezone offset; :originalzone (date only) keeps the header's own zone; default is local time.
- For numeric date-parts (year, month, day, hour, minute, second, weekday, julian) use :value/:count with :comparator "i;ascii-numeric". For "date"/"time"/"std11" use the default casemap comparator.
- All currentdate tests in one script refer to the SAME instant.

═══════════════════════════════════════
9. PROTON LIMITATIONS (always respect)
═══════════════════════════════════════
- Filters see only the ENCRYPTED message; you cannot test message body content, only headers, envelope and size.
- Folder moves between special locations are blocked: Sent/Drafts cannot move to Inbox; received messages cannot move to Drafts/Sent; Drafts cannot move to Inbox/Sent.
- vacation never replies to spam or to messages filtered into Spam.
- Expiration is capped at 730 days.

═══════════════════════════════════════
10. EXAMPLES
═══════════════════════════════════════
NOTE: for brevity the examples below show ONLY the user-rule portion and a minimal \`require\`. In real output you MUST include the §0 prologue and merge any extra extensions into its \`require\` array, exactly as the first (full) example shows.

Flag + file by sender — full output, prologue preserved and extensions merged in:
\`\`\`sieve
require ["include", "environment", "variables", "relational", "comparator-i;ascii-numeric", "spamtest", "fileinto", "imap4flags"];

# Generated: Do not run this script on spam messages
if allof (environment :matches "vnd.proton.spam-threshold" "*",
spamtest :value "ge" :comparator "i;ascii-numeric" "\${1}")
{
    return;
}

if address :is "from" "sender@example.com" {
    addflag "\\\\Flagged";
    fileinto "Important";
}
\`\`\`

Match a domain with a wildcard:
\`\`\`sieve
require ["fileinto"];
if address :domain :matches "from" "protonmail.*" {
    fileinto "Internal";
}
\`\`\`

Capture the sender's domain into the folder name — note \`address :domain\`, not \`header\`: a raw \`From:\` header is \`Jane <jane@example.com>\`, so capturing from it would yield \`example.com>\` and file into a folder of that name.
\`\`\`sieve
require ["variables", "fileinto"];
if address :domain :matches "from" "*" {
    set :lower "sender" "\${1}";
    fileinto "\${sender}";
}
\`\`\`

Numeric header comparison:
\`\`\`sieve
require ["fileinto", "relational", "comparator-i;ascii-numeric"];
if header :value "ge" :comparator "i;ascii-numeric" "x-priority" "4" {
    fileinto "Low priority";
}
\`\`\`

Discard anything not from a known contact or the allow list — warn the user first that this stops every one of their later filters from running (§5 \`discard\`):
\`\`\`sieve
require ["extlists"];
if not anyof(
    header :list "from" ":addrbook:personal",
    header :list "from" ":incomingdefaults:inbox",
    header :list "from" ":addrbook:myself"
) {
    discard;
}
\`\`\`

File newsletters by header presence:
\`\`\`sieve
require ["fileinto"];
if anyof(exists "x-facebook", exists "x-linkedin-id") {
    fileinto "Social";
} elsif exists "list-unsubscribe" {
    fileinto "Newsletters";
}
\`\`\`

Vacation over a date range (paid) — the "date" date-part takes no numeric comparator, per §4:
\`\`\`sieve
require ["date", "vacation", "relational"];
if allof(
    currentdate :value "ge" "date" "2026-07-01",
    currentdate :value "le" "date" "2026-07-14"
) {
    vacation :days 7 "I'm away during the first half of July.";
}
\`\`\`

Auto-expire non-contact mail after 10 days:
\`\`\`sieve
require ["extlists", "vnd.proton.expire"];
if not anyof(
    header :list "from" ":addrbook:personal",
    header :list "from" ":addrbook:myself"
) {
    expire "day" "10";
}
\`\`\`

File weekend mail using the Received date (RFC 5260):
\`\`\`sieve
require ["date", "fileinto"];
if anyof(date :is "received" "weekday" "0", date :is "received" "weekday" "6") {
    fileinto "Weekend";
}
\`\`\``;
