import type { ESStatusBooleans } from '@proton/encrypted-search/models/interfaces';

const SEARCH_GUIDE_HEAD = `The search tool LOCATES emails. It returns a LIST of matching emails as metadata rows only — reference, sender, subject, date, folder — NEVER their body or contents. You do NOT need to call view_emails afterwards; the rows are already in the result.

How to use it — orient, narrow, read:
- Open wide. You rarely know the wording the user's emails use, so make the first search a probe: the widest query this engine allows (below), then let the results choose your next step.
- Check the count header. "12 of 340 emails shown" is one page, not the answer — narrow before concluding anything about what is or is not in the mailbox.
- Narrow on metadata, not on more words. \`from\`, \`begin\`/\`end\` and \`target\` always match; a guessed keyword may match nothing, since bodies are not always searched. When the user names a person or a timeframe, open there — \`keyword\` can be null. "everything from Sam in July" is \`from: "Sam"\` with \`begin\`/\`end\` set and \`keyword: null\` — putting the sender's name in \`keyword\` as well is the most common way to turn a search that would have worked into an empty one.
- To learn what an email SAYS — an amount, a date, what someone wrote — you MUST call read_email on the best-matching row. A subject line is not an answer: never report contents from a row alone. Better keywords will never surface a body; search only ever returns another list.
- If the read shows the wrong email, go back and search again with what you just learned: the body gives you the real wording, sender and date, which beats another guess. The read that disconfirms IS your next hypothesis — search again on it immediately; do not stop to ask whether you should.
- If the user asked about SEVERAL emails ("my invoices from July", "everything from Sam"), the rows ARE the answer and are already on their screen. Read one only when you need what it says.
- An empty result is not a dead end, and never a reason to stop after one search. Form a new hypothesis and go again: reword freely, but make it a real alternative rather than a cosmetic variant — "ticket" → "tickets" buys nothing, "ticket" → the vendor, the event's name, "order" or "e-ticket" might.
- Use what you know to form that hypothesis: who sends this kind of email, what words they put in a subject, when it would have arrived, where it would have landed. You are exploring a mailbox with your own knowledge of the world, not guessing at a keyword.
- Change axis as readily as wording: a sender, a date range, a folder, Spam or Trash.
- Trying DIFFERENT searches is normal when exploring; stop and ask for a sender, a date or the wording they remember once genuinely different attempts have failed.
- Only your LAST search or read is what the user is left looking at, so intermediate probes cost them nothing. Explore as widely as the question needs, then finish on the step that answers them.`;

const SUBSTRING_TERMS = `Casting a wide net here — ONE short stem:
- Encrypted Search is handling this query on this device, and it matches the keyword literally. The operators documented for Proton Mail search (|, !, wildcards) do nothing here — that is a property of this device's setup, not of the tool.
- There is no OR, and no operators of any kind. Every whitespace-separated word in \`keyword\` must match, as a plain substring anywhere in the subject, sender or (where available) body. So "flight booking" needs BOTH words — each extra word narrows, never widens.
- So the widest net this engine gives you is a SINGLE short stem, and because matching is by substring, a short stem catches more: "book" matches "booking" and "bookings", "invoic" matches "invoice" and "invoicing". Open with the shortest distinctive stem of the likeliest word, then narrow on metadata.
- Punctuation is matched literally: | ! - * ? ^ $ ( ) are not operators, just characters that must appear in the text. Never put them in \`keyword\`.
- Quotes are the one exception: "a phrase in double quotes" is matched as one block rather than split into words.`;

const OPERATOR_TERMS = `Casting a wide net here — operators work, so widen with them:
- Encrypted Search is not handling this query on this device, so it goes to the server, which parses advanced syntax. The operators act on METADATA ONLY — Subject, To/CC/BCC and From. Bodies are not searched on this path, so a word appearing only inside a body cannot match however you phrase it.
- So the widest net this engine gives you is an OR of the likely wordings — \`invoice | receipt | payment | statement\` — never a single exact guess. A guess that misses is worse than a broad OR you can then narrow.
- Matching is by whole TOKEN, not by substring: "book" does NOT match "booking" — write \`book*\`. This is the opposite of how a stem behaves elsewhere. Combine the two to widen: \`invoic* | receipt | paym*\`.
- AND is implicit between whitespace-separated words: \`hello world\` requires both. Each extra bare word narrows; the operators below are what widen.
- \`hello | world\` — OR: either term matches.
- \`hello !world\` — NOT: excludes the second term. \`-world\` does the same.
- \`(cat -dog) | (cat mouse)\` — brackets group, so OR and NOT can be combined.
- \`"hello world"\` — a phrase: adjacent, in that order. Inside quotes \`*\` stands in for one whole word, as in \`"hello * world"\`.
- \`h?llo w*d\` — wildcards: \`?\` is exactly one character, \`*\` is zero or more.
- \`^hello\` / \`world$\` — anchors: the field must start / end with the term.
- Further operators exist (proximity, quorum, word order); see https://proton.me/support/search if you need them.`;

const SEARCH_GUIDE_TAIL = `Params (set null what you don't need):
- keyword: free text matched against emails, per the rules above. Null is valid, and often better: \`from\` or a date range alone matches reliably, where a guessed word may not.
- from: sender name or email address.
- to: recipient name or email address.
- target: a folder-… reference from list_folders, or a label-… reference from list_labels, to search inside that one folder or label. Null searches all mail — which, if the user has chosen to exclude Spam and Trash from All mail, does NOT cover those two. If they ask about a deleted or spam email and an unscoped search finds nothing, open_folder into trash or spam and look there.
- begin, end: ISO dates (YYYY-MM-DD) bounding the date range. BOTH ends are inclusive — begin "2026-07-01", end "2026-07-29" covers the whole of both days.
- filter: narrows the on-screen view to exactly one of "read" | "unread" | "has_attachment". They cannot combine (the mailbox shows one at a time), so for "unread ones with attachments" pick the more useful filter and read the rows for the rest.

search cannot sort: results come back newest first. A question about the biggest or oldest mail in a location is an open_folder question — it takes a \`sort\` and orders the whole location, whereas a search can only order the matches already loaded.

Body-content search: this only affects which emails MATCH, never what search returns to you (still metadata rows only — read_email for contents). Matching inside bodies needs Encrypted Search, a per-device, locally-built encrypted index. Every result ends with a line saying how much of the mailbox was actually covered, and it is the one thing that decides whether an empty result MEANS anything:
- Bodies searched across the whole mailbox — an empty result is trustworthy: the email really is not there.
- Bodies searched but the index is capped (a very large mailbox keeps only recent mail) — the oldest emails were never searched.
- Bodies NOT searched, only subjects/senders/recipients/dates (Encrypted Search is off, still indexing, unavailable in a private window, or it fell back to the server) — a keyword appearing only inside a body cannot match at all.
- The search did not finish — it timed out, so the list is incomplete however many rows it holds.

In every case but the first, an empty result tells you NOTHING about whether the email exists — so never say it does not, and never stop to ask. Narrow by sender or date (metadata always matches), or open_folder into Spam or Trash and look. Report what was not searched only once several genuinely different attempts have all come back empty.`;

/**
 * Loaded on demand via `load_guide`. Two variants because two engines parse the keyword differently:
 * Encrypted Search takes the query when `dbExists && esEnabled` (`elementsSelectors.ts`), otherwise the
 * raw string reaches the server, which parses operators. Resolved per read, since the user can enable
 * content search mid-conversation.
 */
export const buildMailSearchGuide = ({ dbExists, esEnabled }: ESStatusBooleans): string =>
    `${SEARCH_GUIDE_HEAD}\n\n${dbExists && esEnabled ? SUBSTRING_TERMS : OPERATOR_TERMS}\n\n${SEARCH_GUIDE_TAIL}`;

const STANDALONE_SEARCH_GUIDE_HEAD = `search finds emails and puts them on screen, returning them as metadata rows (reference, sender, subject, date, folder), never their bodies. The rows are in the result, so there is no need for view_emails afterwards.

Orient, narrow, read:
- Open wide. You rarely know the wording the user's emails use, so the first search is a probe: the widest query this device allows (see matching below), and the results choose the next step.
- Check the count. "12 of 340 emails listed" is one page, not the answer; narrow before concluding anything about what is or isn't in the mailbox.
- Narrow on metadata rather than more words. from, to, begin, end and target always match, while a guessed keyword may match nothing, since bodies aren't always searched. When the user names a person or a timeframe, start there with keyword null: "everything from Sam in July" is from set to Sam's address, begin and end covering July, and keyword null. Putting the person's name in keyword as well is the most common way to turn a search that would have worked into an empty one.
- To learn what an email says (an amount, a date, what someone wrote), read the best-matching row with read_email. A subject line is not an answer, and a better keyword never surfaces a body.
- When a read shows the wrong email, search again with what it taught you: the real wording, sender and date beat another guess.
- When the user asked about several emails ("my invoices from July"), the rows are the answer and already on screen. Read one only when you need what it says.
- An empty result is not a dead end. Form a new hypothesis and search again with a real alternative, not a cosmetic variant: "ticket" to "tickets" buys nothing, while the vendor, the event's name, "order" or "e-ticket" might.
- Use what you know about the world: who sends this kind of email, what they put in a subject, when it would have arrived, where it would have landed.
- Change axis as readily as wording: a sender, a date range, one of the user's folders or labels, Spam or Trash.
- Ask the user for a sender, a date or the wording they remember only once genuinely different attempts have failed.`;

const STANDALONE_SUBSTRING_TERMS = `Matching on this device: one short stem.
Encrypted Search handles searches on this device and matches keywords as plain substrings. The search operators Proton documents (|, !, wildcards) do nothing here; that is a property of this device's setup, not of the tool.
- There is no OR and no operator of any kind. Every space-separated word in keyword must appear as a plain substring, and all of them in the same place: either the subject, sender and recipients (names and addresses), or the subject and (where available) the body. So "flight booking" needs both words, and each extra word narrows, never widens. A word that appears only in the sender, paired with one that appears only in the body, matches nothing.
- Case and accents are ignored: "caucao" matches "Caução", and "invoice" matches "INVOICE".
- The widest net is therefore a single short stem, and because matching is by substring, a short stem catches more: "book" matches "booking" and "bookings", and "invoic" matches "invoice" and "invoicing". Open with the shortest distinctive stem of the likeliest word, then narrow on metadata.
- Punctuation is matched literally: | ! - * ? ^ $ ( ) are just characters that must appear in the text, so keep them out of keyword.
- Double quotes are the one exception: "a phrase in quotes" matches as one block rather than as separate words.`;

const STANDALONE_OPERATOR_TERMS = `Matching on this device: widen with operators.
Encrypted Search isn't handling searches on this device, so they go to the server, which understands advanced syntax. The operators act on metadata only: subject, from, to, cc and bcc. Bodies aren't searched on this path, so a word that appears only in a body can't match however it's phrased.
- The widest net is an OR of the likely wordings, such as \`invoice | receipt | payment | statement\`, never a single exact guess. A guess that misses is worse than a broad OR you can then narrow.
- Matching is by whole word, not substring: "book" doesn't match "booking", so write \`book*\`. That is the opposite of how a stem behaves with Encrypted Search. Combine the two to widen: \`invoic* | receipt | paym*\`.
- Whitespace between words means AND: \`hello world\` needs both. Each extra bare word narrows; the operators below widen.
- \`hello | world\`: OR, either term matches.
- \`hello !world\`: NOT, which excludes the second term; \`-world\` does the same.
- \`(cat -dog) | (cat mouse)\`: brackets group terms, so OR and NOT combine.
- \`"hello world"\`: a phrase, adjacent and in that order. Inside quotes, \`*\` stands for one whole word, as in \`"hello * world"\`.
- \`h?llo w*d\`: wildcards, where \`?\` is exactly one character and \`*\` is zero or more.
- \`^hello\` and \`world$\`: anchors, so the field must start or end with the term.
- Further operators exist (proximity, quorum, word order); see https://proton.me/support/search.`;

const STANDALONE_SEARCH_GUIDE_TAIL = `Beyond the parameter descriptions:
- keyword can be null, and often should be: from or a date range alone matches reliably, where a guessed word may not.
- from and to take exact email addresses. Always get a person's address from find_contacts, from an email you've read with read_email or read_thread, or from the user directly. Rows show names, not addresses, so never build an address from a row or guess one from a name. When you have only a name, fall back to the name as the keyword, with nothing else in keyword: it matches senders and recipients as well as subjects, and reading a matching email gives you the address for a narrower search. A name search also catches mail sent to that person or mentioning them in the subject, so check the sender in the rows. Ask the user for the address only when that turns up nothing.
- target null searches all mail, which leaves out Spam and Trash when the user has chosen to exclude them from All mail. When an unscoped search finds nothing for a deleted or spam email, open Trash or Spam with open_folder and look there.
- begin and end are both inclusive, so the same date in both covers that whole day.
- filter narrows to exactly one of read, unread or has_attachment. For "unread ones with attachments", pick the more useful filter and read the rows for the rest.

search can't sort: results come back newest first. The biggest or oldest mail in a location is an open_folder question, since open_folder sorts the whole location.

How much was searched. Matching inside bodies needs Encrypted Search, an encrypted index built on each device. Every result ends with a line saying how much of the mailbox was actually covered, and that line decides whether an empty result means anything:
- Bodies searched across the whole mailbox: an empty result is trustworthy, and the email really isn't there.
- Bodies searched, but the index is capped (a very large mailbox keeps only recent mail): the oldest emails were never searched.
- Bodies not searched, only subjects, senders, recipients and dates (Encrypted Search is off, still indexing, unavailable in a private window, or it fell back to the server): a word that appears only in a body can't match at all.
- The search didn't finish (it timed out), so the list is incomplete however many rows it holds.
In every case but the first, an empty result says nothing about whether the email exists, so never say it doesn't, and don't stop to ask. Narrow by sender or date, which always match, or look in Spam, Trash and the user's own folders and labels. Mention what wasn't searched only once several genuinely different attempts have all come back empty.`;

/**
 * The search guide for the standalone prompt, whose tool parameters carry their own descriptions, so it
 * adds only what they leave out. Branches on the engine exactly as {@link buildMailSearchGuide} does.
 */
export const buildStandaloneMailSearchGuide = ({ dbExists, esEnabled }: ESStatusBooleans): string =>
    `${STANDALONE_SEARCH_GUIDE_HEAD}\n\n${dbExists && esEnabled ? STANDALONE_SUBSTRING_TERMS : STANDALONE_OPERATOR_TERMS}\n\n${STANDALONE_SEARCH_GUIDE_TAIL}`;
