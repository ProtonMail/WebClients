import type { ToolName } from '@proton/llm/lib/lumoAgent/contracts/types';

interface StandaloneDescription {
    description: string;
    parameters: Record<string, string>;
}

/**
 * The model-facing description of every client tool and each of its parameters, sent in the request's `tools`
 * field with the standalone prompt so the chat template renders them in the model's native tool block. Ported
 * verbatim from the `<functions>` block of the Lumo Mail system prompt served by lumo-infra (`c705554f`).
 */
export const STANDALONE_DESCRIPTIONS: Record<ToolName, StandaloneDescription> = {
    view_emails: {
        description:
            'List the emails on the user\'s screen right now, as rows of metadata: reference, sender, subject, date, read or unread, starred, folder, labels and an attachment flag. Never bodies. Use it when the user points at what they can see ("these emails", "the ones on screen"), or to triage the current view before acting on it. Returns the visible rows and the total for the view, which can be larger.\n\nTo learn what an email says, read it with read_email. To look somewhere else, use open_folder or search.',
        parameters: {},
    },
    open_folder: {
        description:
            'Open a location in the user\'s mailbox and return the emails now on screen there, as metadata rows with no bodies. This changes what the user is looking at.\n\nUse it when the user names a place they can see in the left panel: a standard location, or one of their own folders or labels. For a keyword, sender, recipient or date, use search instead. It is also the way to order a whole location by date or size, since search always returns newest first.\n\nThe standard locations are Inbox, All Mail, Spam, Drafts, Starred, Trash and Archive: use location for these, and target only for the user\'s own folders and labels. Pass exactly one of the two, with the other null.\n\nExample: unread mail in Archive, newest first, {"location": "archive", "target": null, "filter": "unread", "sort": "newest"}.',
        parameters: {
            location: 'A standard location. Null when using target.',
            target: 'A folder-… or label-… reference from list_folders or list_labels. Null when using location.',
            filter: 'Show only read, unread, or with attachments. One at a time; they cannot combine. Null for no filter.',
            sort: 'Order by date (newest, oldest) or by size (largest, smallest). Null keeps the default order.',
        },
    },
    search: {
        description:
            "Search the user's mailbox and bring the matches on screen, returning metadata rows with no bodies, newest first. This is how you find the user's own mail: by keyword, sender, recipient, date range, or inside one folder or label.\n\nUse it when no earlier result in this conversation already gave you the email and the user hasn't simply named a location, which is open_folder's job. For anything about the user's own world, search the mailbox before you consider web_search.\n\nfrom and to take exact email addresses, never names. Always get the address from one of three places: find_contacts, an email you have read with read_email or read_thread, or the user directly. A row shows a name, not an address, so never build one from a row or guess it from a name. When you have only a name, fall back to searching with the name as the keyword and nothing else in keyword: it matches senders and recipients as well as subjects, so the rows often answer the question, and reading one gives you the address for a narrower search. Ask the user for the address only when that turns up nothing.\n\nHow keywords match depends on this device, so load the search guide with load_guide before your first search in a conversation. It explains the matching rules and how to widen and narrow. Once a row looks right, read it with read_email before reporting what it says.",
        parameters: {
            keyword:
                "Words to match, following the search guide's rules for this device. Null is valid, and often better when a sender or date range already identifies the mail.",
            from: "The sender's exact email address, never a name, from find_contacts, an email you have read, or the user.",
            to: "The recipient's exact email address, never a name, from find_contacts, an email you have read, or the user.",
            target: 'A folder-… or label-… reference, to search inside one folder or label. Null searches all mail, which may leave out Spam and Trash.',
            begin: 'First day of the range, YYYY-MM-DD, inclusive.',
            end: 'Last day of the range, YYYY-MM-DD, inclusive.',
            filter: 'Show only read, unread, or with attachments. One at a time; they cannot combine. Null for no filter.',
        },
    },
    read_email: {
        description:
            'Read the full plain-text body of one or more emails, identified by email-… references from any earlier result in this conversation. This is how you learn what an email says: an amount, a date, what someone wrote. A subject line in a row is not an answer.\n\nReading opens the email in the user\'s reading pane, so what you read is what they end up looking at. To answer about one email, read the single best-matching row. Pass several references only when the user wants several emails summarized or compared together, and then set best_match to the one to leave open: the row that best answers them.\n\nA reference from any earlier result stays valid for the whole conversation, even once its row has left the screen, so pass it straight here rather than searching again. If the result says an email was permanently deleted, tell the user.\n\nFor the email the user already has open, use read_open_email, which needs no reference. For a whole conversation, use read_thread, since this tool reads single messages.\n\nExample: after search returns `email-a1b2c3 | … | Fw: Votre séjour`, call with {"references": ["email-a1b2c3"], "best_match": null}.',
        parameters: {
            references:
                'email-… references from any earlier result in this conversation. One, unless the user asked about several emails together.',
            best_match: 'With several references, the one to leave open on screen. Null with a single reference.',
        },
    },
    read_open_email: {
        description:
            'Read the full body of the email the user has open in the reading pane. No reference needed. This is the tool for "this email", "the one I have open" or "should I reply to this?" when the user hasn\'t listed or searched anything first. The per-turn context says whether an email is open.\n\nIf nothing is open, it returns nothing: find the email yourself with view_emails or search, and ask the user to open it only if that fails. If it reports the body couldn\'t be read yet, retry once before anything else.\n\nFor an email you found in a list, use read_email. For the whole conversation, use read_thread.',
        parameters: {},
    },
    read_thread: {
        description:
            'Read every message in a conversation, oldest first, with each message\'s sender, date and body. Use it whenever the user asks about a whole thread ("summarize this thread", "catch me up", "what\'s the latest here"): read_email and read_open_email read a single message, and a conversation usually has several.\n\nReading a thread opens it on screen and may mark its unread messages as read.\n\nWith target null and nothing open, it returns nothing: find the thread with search or view_emails and pass a target, asking the user to open it only if that fails. If it reports the messages couldn\'t be read yet, retry once before anything else.',
        parameters: {
            target: 'The email-… reference of any message in the thread. Null for the conversation open in the reading pane.',
        },
    },
    read_composer: {
        description:
            'Read the drafts open in the composer: what the user is writing right now. Use it for "my draft", "this reply", "does this sound right?" or "check my email before I send it". The per-turn context says whether a composer is open.\n\nEach open draft comes back with its composer-… reference, its subject and its body. The body is what the user typed, without their signature or the quoted conversation below it. For a reply or a forward it also names the email being answered, which read_thread can open for context.\n\nIt returns nothing when no composer is open, which means the user isn\'t writing anything. When several drafts are open, pick by subject rather than assuming there is only one. This tool only reads.\n\nCall it before every revise_draft, even for a draft you opened yourself, so the change goes to the right draft with a current reference.',
        parameters: {},
    },
    list_folders: {
        description:
            "List the user's own folders, each with its folder-… reference, name and parent (or top level). Use it to turn a folder the user names into a reference before moving mail into it, opening it or nesting a new folder under it, and to check that a folder exists before a filter files into it. Skip it when an earlier list_folders result in this conversation already has that folder. The standard locations (Inbox, Archive and the rest) aren't listed; open_folder and move_emails take those by name.\n\nFolders are exclusive: an email lives in one. For additive tags, use list_labels.",
        parameters: {},
    },
    list_labels: {
        description:
            "List the user's labels, each with its label-… reference, name and color. Use it to turn a label the user names into a reference before applying or opening it, and to check whether a label exists before creating one. Skip it when an earlier list_labels result in this conversation already has that label. Labels are additive tags, so an email can carry several; folders, which hold an email exclusively, come from list_folders.",
        parameters: {},
    },
    list_filters: {
        description:
            "List the user's mail filters, each with its filter-… reference, name, whether it's enabled, and its full Sieve script. Use it when the user asks what filters they have or what one does; before update_filter, which replaces the whole script, so you need the current one; and before create_filter, to check that no existing filter already covers the same mail.",
        parameters: {},
    },
    find_contacts: {
        description:
            'Look up saved contacts by any part of a name or email address, or pass null to list the whole address book. Each result carries its contact-… reference, saved name and address. Use it to turn a person the user names into an exact address: search takes addresses, never names, and a draft needs a recipient.\n\nIt searches only the address book. For emails from or to someone, search the mailbox with their address.',
        parameters: {
            query: 'Part of a name or email address. Null lists every contact.',
        },
    },
    read_settings: {
        description:
            'Read the user\'s display settings: layout (column or row), conversation grouping, density (comfortable or compact) and theme. For grouping, "grouped" shows a conversation as one row and "single" lists each message separately, so "single" means grouping is off. Use it to answer questions about these settings. You don\'t need it before change_settings, which reads the current value itself and accepts exactly the values this reports.',
        parameters: {},
    },
    read_auto_reply: {
        description:
            "Read whether the user's away message (out of office, vacation responder) is on or off, and, when one is stored, its message, subject and away window. Call it before turning the away message on, so you can mention the stored message and window. You don't need it to turn the away message off: set_auto_reply checks the stored state itself.",
        parameters: {},
    },
    read_signature: {
        description:
            "Read the signature on the user's primary address, as plain text. Use it to answer questions about the signature, and before editing one (adding or changing a line), so you can send the whole signature back with the change. You don't need it before replacing or removing the signature: change_signature and remove_signature read the stored value themselves.\n\nThe signature is stored as HTML and flattened here, so links, images and styling don't come through. Never present what you read as the exact signature, and never offer to reproduce formatting you can't see.",
        parameters: {},
    },
    move_emails: {
        description:
            'Move one or more emails into a custom folder, or to Trash, Archive or Spam. An email lives in exactly one folder or location at a time, so a move takes it out of where it is now.\n\nDelete means Trash. When the user asks to delete, bin or remove emails, move them to Trash: it can be undone from there, and the request needs no further clarification. You can NEVER permanently delete mail. If the user asks for that, tell them plainly you can\'t, and that they can delete permanently from Trash themselves.\n\nPass exactly one destination: folder for a custom folder, or location for Trash, Archive or Spam, with the other left null. If the folder doesn\'t exist yet, create it first with create_folder, whose result carries the reference this tool takes.\n\nTo tag emails without moving them, use apply_labels. For mail that hasn\'t arrived yet, use create_filter instead.\n\nThe user reviews the move on a confirm card before it runs.\n\nExample: to Trash, {"ids": ["email-a1b2c3"], "folder": null, "location": "trash"}.',
        parameters: {
            ids: 'email-… references from any earlier result in this conversation.',
            folder: 'A folder-… reference from list_folders or create_folder. Null when using location.',
            location: 'Trash also covers delete, bin and remove. Null when using folder.',
        },
    },
    set_starred: {
        description:
            'Star or unstar one or more emails: starred true stars them, false unstars them ("unstar", "unflag", "remove the star"). It sets that state rather than toggling, so a mixed selection is safe, and only the star changes.\n\nRows show which emails are starred: a row carrying starred is starred. Pass only emails not already in the state you\'re setting, and if every email the user means is already there, tell them there\'s nothing to do instead of calling this.\n\nThe user reviews the change on a confirm card before it runs.',
        parameters: {
            ids: 'email-… references from any earlier result in this conversation.',
            starred: 'True to star, false to unstar.',
        },
    },
    set_read: {
        description:
            "Mark one or more emails read or unread: read true marks them read, false unread. It sets that state rather than toggling, so a mixed selection is safe, and only the read state changes.\n\nEvery row shows read or unread. Pass only emails not already in the state you're setting, and if every email the user means is already there, tell them there's nothing to do instead of calling this. It acts only on the emails you pass; for a whole folder, label or Inbox tab, including mail not on screen, use set_location_read.\n\nThe user reviews the change on a confirm card before it runs.",
        parameters: {
            ids: 'email-… references from any earlier result in this conversation.',
            read: 'True to mark read, false to mark unread.',
        },
    },
    apply_labels: {
        description:
            "Add one or more labels to one or more emails. A label is a tag: the emails stay where they are. To move them, use move_emails. Rows list the labels an email already carries; pass only emails missing the label you're adding, and if all of them already carry it, tell the user there's nothing to do instead of calling this.\n\nIf the label doesn't exist yet, create it first with create_label, whose result carries the reference this tool takes. This tags existing mail only; for mail that hasn't arrived yet, use create_filter.\n\nThe user reviews the change on a confirm card before it runs.",
        parameters: {
            ids: 'email-… references from any earlier result in this conversation.',
            labels: 'label-… references from list_labels or create_label.',
        },
    },
    set_location_read: {
        description:
            'Mark every email in a whole location read or unread: an entire folder, label or Inbox tab, including mail not on screen. Use it when the user means the whole place ("mark my inbox as read", "everything in Newsletters unread"); for specific emails, use set_read.\n\nPass exactly one of location (a standard location) or target (the user\'s own folder or label). To cover one Inbox tab rather than the whole Inbox, set location to inbox and category to the tab; tabs exist only in the Inbox, and only when the mailbox shows them. Because this covers mail you haven\'t seen, you can\'t tell in advance whether anything needs changing, so propose it whenever the user names a whole location.\n\nWhile the server works through the location, listing it returns nothing until it finishes, so make this the last step of a chain rather than something you build on.\n\nThe user reviews the change on a confirm card before it runs.',
        parameters: {
            location: 'A standard location. Null when using target.',
            target: 'A folder-… or label-… reference from list_folders or list_labels. Null when using location.',
            category: 'One Inbox tab; needs location inbox. Null for the whole location.',
            read: 'True to mark all read, false to mark all unread.',
        },
    },
    create_folder: {
        description:
            "Create a new folder, at the top level or inside an existing one. Use it before moving mail into a folder that doesn't exist yet: the result carries the new folder's reference, which move_emails takes directly, with no further read.\n\nA folder holds mail exclusively; for a tag that leaves mail where it is, use create_label. To file mail automatically as it arrives, use create_filter, which can only file into a folder that already exists.\n\nThe user reviews the change on a confirm card before it runs.",
        parameters: {
            name: "The new folder's name, exactly as the user asked.",
            parentId: 'A folder-… reference from list_folders to nest under. Null for top level.',
        },
    },
    create_label: {
        description:
            "Create a new label; its color is assigned automatically. Use it when the user wants a tag that doesn't exist yet: the result carries the new label's reference, which apply_labels takes directly, with no further read.\n\nA label is an additive tag that leaves mail where it is; for a container mail moves into, use create_folder. To tag mail automatically as it arrives, use create_filter.\n\nThe user reviews the change on a confirm card before it runs.",
        parameters: {
            name: "The new label's name, exactly as the user asked.",
        },
    },
    snooze_emails: {
        description:
            'Snooze one or more emails: they leave the Inbox now and come back to the top of it at a set time. Turn the user\'s words ("tomorrow at 8am", "Saturday morning") into an exact date and time yourself, from the date, time and timezone in the per-turn context. If they give no time, don\'t ask: propose tomorrow at 9am, since the confirm card shows an editable date and time.\n\nIt works only on conversations in the Inbox, not single messages; anything else is refused, so leave it out.\n\nThe user reviews the change on a confirm card before it runs.',
        parameters: {
            ids: 'email-… references from any earlier result in this conversation.',
            wake_at: 'An ISO 8601 date and time in the future, as YYYY-MM-DDTHH:MM:SS.',
        },
    },
    rename_folder: {
        description:
            "Rename one of the user's folders. Only the name changes: the folder keeps its color, notifications and parent, and everything filed in it stays. list_folders shows each current name; if the folder is already called what the user asks for, tell them there's nothing to do instead of calling this.\n\nThe user reviews the change on a confirm card before it runs.",
        parameters: {
            folder: 'A folder-… reference from list_folders.',
            name: 'The new name, exactly as the user asked.',
        },
    },
    rename_label: {
        description:
            "Rename one of the user's labels. Only the name changes: the label keeps its color, and everything tagged with it stays tagged. list_labels shows each current name; if the label is already called what the user asks for, tell them there's nothing to do instead of calling this.\n\nThe user reviews the change on a confirm card before it runs.",
        parameters: {
            label: 'A label-… reference from list_labels.',
            name: 'The new name, exactly as the user asked.',
        },
    },
    add_contact: {
        description:
            "Save a new contact to the address book: name is how the contact is listed, and email is their address. Split the name into first_name and last_name whenever you can tell which part is which, so the contact gets the same fields the user would fill in by hand. Send null for both when the name is a single word, a company, or a name whose order you're unsure of. Send null for anything you weren't given, but never for everything.\n\nIt only creates. It can't edit, rename, merge or add an address to an existing contact, and the address book refuses an address it already holds. So check find_contacts first whenever the person might already be saved, and if they are, tell the user rather than calling this. The result carries the new contact's reference.\n\nThe user reviews the change on a confirm card before it runs.",
        parameters: {
            name: "The contact's name as it should be listed.",
            first_name: 'Given name, when you can tell which part it is.',
            last_name: 'Family name, when you can tell which part it is.',
            email: "The contact's email address.",
        },
    },
    update_contact: {
        description:
            "Edit an existing contact's name or email address. Send only the fields to change; null leaves a field as it is. It can't create a contact (that's add_contact), and the address book refuses an address another contact already holds.\n\nThe user reviews the change on a confirm card before it runs.",
        parameters: {
            contact: 'A contact-… reference from find_contacts.',
            name: 'New listed name, or null to keep it.',
            first_name: 'New given name, or null to keep it.',
            last_name: 'New family name, or null to keep it.',
            email: 'New email address, or null to keep it.',
        },
    },
    change_settings: {
        description:
            "Change one of the user's display settings: layout, conversation grouping, density or theme. You don't need to read it first: this reads the current value itself, and if the setting already holds the value, the result says so. Change one setting per call, and propose a separate change for each when the user wants several. It only changes how the mailbox looks for this user; no mail is affected.\n\nThe user reviews the change on a confirm card before it runs.",
        parameters: {
            setting: 'The one setting to change.',
            value: 'layout: column or row. conversation_grouping: grouped (a conversation shows as one row) or single (each message listed separately), so turning grouping off means single. density: comfortable or compact. theme: a theme name such as Proton, Classic, Snow, Legacy, Carbon or Monokai; the account decides which exist, and an unknown name is rejected with the ones it offers.',
        },
    },
    set_auto_reply: {
        description:
            "Turn the user's away message (out of office, vacation responder) on or off. It's a setting: the server sends the away message, so this isn't you sending or replying to email.\n\nenabled true configures the away message and turns it on. False turns it off and keeps the stored message and window for next time; pass null for everything else. Before turning it on, call read_auto_reply to surface the stored message and window. Always make the call rather than deciding in prose that it's already in the state asked for: it refuses a no-op and reports what was stored, and a different message or window is a real change.\n\nThe away text is the user's to write. Use their own wording and never invent it; if they haven't said what it should say, ask. Work out the window from their words (\"from Monday until next Friday\") using the per-turn context, or pass null for now until a week later. The window must end in the future. It can only set a fixed date range: if read_auto_reply reports a recurring or permanent responder, tell the user this replaces their schedule with the window you set, and let them decide.\n\nThe user reviews the change on a confirm card before it runs. The card shows the message and window, lets the user adjust them, and links to the advanced options, so don't mention or link to settings yourself. It requires a paid Mail plan.",
        parameters: {
            enabled: 'True to configure and turn on, false to turn off.',
            message:
                "The away text, as plain text, in the user's own words. Required when turning on; null when turning off.",
            subject: "The away message's subject, or null for the default.",
            start: 'Start of the away window, ISO 8601, as YYYY-MM-DDTHH:MM:SS. Null means now.',
            end: 'End of the away window, ISO 8601, in the future. Null means a week after the start.',
        },
    },
    change_signature: {
        description:
            "Replace the signature on the user's primary address. text is the whole signature, as plain text with newlines allowed, and it replaces the stored one; to remove a signature entirely, use remove_signature. You don't need to read it first to replace it: this reads the stored value itself and refuses a write that would leave it unchanged. Call read_signature first only when editing, so you can send the whole signature back with the change.\n\nUse exactly the wording the user gives. Never invent, suggest or offer example signature text, and never write HTML.\n\nA new signature applies to emails composed from now on. A draft already open keeps the signature it opened with, and rewriting the draft's text won't bring in the new one, so don't offer to retrofit it or claim the new signature will appear when they send.\n\nThe user reviews the change on a confirm card before it runs. The card links to the signature settings for formatting, links and images, so don't mention or link to them yourself.",
        parameters: {
            text: "The whole signature, as plain text, in the user's own words.",
        },
    },
    remove_signature: {
        description:
            "Remove the signature from the user's primary address entirely, so sent mail carries none. Use it when the user asks to turn off, remove, delete or clear their signature. It refuses when no signature is set.\n\nThe user reviews the change on a confirm card before it runs.",
        parameters: {},
    },
    create_filter: {
        description:
            'Create a filter: a rule the server applies to mail as it arrives. This is the tool for "make a rule", for "always" filing, labeling or flagging certain mail, and for anything about future mail; create_label, apply_labels and move_emails act only on mail that already exists. A filter can also delete certain mail automatically a set time after it arrives, such as newsletters after 30 days.\n\nLoad the Sieve guide with load_guide before writing a script: it holds the dialect Proton accepts and the spam-guard block every script keeps. Check list_filters first, and where an existing filter already covers the same mail, extend it with update_filter rather than adding a second one that competes with it. A filter can only file into a folder that already exists, so create a missing folder first, as its own confirmed change. The new filter is created enabled and acts only on mail that arrives after it; it doesn\'t touch mail already in the mailbox.\n\nThe user reviews the change on a confirm card before it runs.',
        parameters: {
            name: "The filter's name.",
            sieve: 'The complete Sieve script, following the Sieve guide.',
        },
    },
    update_filter: {
        description:
            "Replace an existing filter's name and Sieve script. The script replaces the stored one wholesale and is never merged, so anything the filter should keep doing must be written out again in full: read the current script with list_filters and edit it, rather than sending only the new rule. Send the stored name back unchanged unless the user asked to rename the filter.\n\nLoad the Sieve guide with load_guide before writing a script. A filter can only file into a folder that already exists, so create a missing folder first, as its own confirmed change.\n\nYou can't delete or disable a filter. When the user wants one gone or switched off, tell them plainly that you can't, and that they can do it themselves in their Mail settings.\n\nThe user reviews the change on a confirm card before it runs.",
        parameters: {
            filter: 'A filter-… reference from list_filters.',
            name: "The filter's name: the stored one unless the user asked to rename it.",
            sieve: 'The complete new Sieve script, including everything the filter should keep doing.',
        },
    },
    create_draft: {
        description:
            "Write a new email that doesn't exist yet, opening a composer with your text in it for the user to review, edit and send themselves. kind is new for a fresh email; reply or reply_all with answers (the email being replied to, which supplies the recipients and subject); or forward with answers and to, since a forward keeps the subject but not the recipients. Recipients are contact-… references from find_contacts, or plain email addresses.\n\nUse it only for a message that doesn't exist yet. To change a draft that's already open, including one you opened a moment ago, use revise_draft: this tool always opens another composer, so using it for a revision leaves the user two drafts for one email.\n\nThis NEVER sends. It only puts a draft in front of the user, and you never say or imply that anything was sent. The user reviews the draft on a confirm card before the composer opens. The result carries the new draft's composer-… reference.",
        parameters: {
            kind: 'new, reply, reply_all or forward.',
            answers:
                'For reply, reply_all and forward: the email-… reference of the email being answered. Leave out for new.',
            to: 'Recipients, as contact-… references or email addresses. Needed for new and forward; leave out for replies, which inherit them.',
            cc: 'Optional cc recipients, in the same form as to. Leave out for replies.',
            subject: 'For new only; replies and forwards inherit the subject.',
            body: 'The message you wrote, as plain text.',
        },
    },
    revise_draft: {
        description:
            'Change a draft that\'s already open in the composer, whether the user\'s own or one you just wrote. Call read_composer first, every time, to get the current reference and make sure you\'re changing the right draft. Pass body to replace the draft\'s text, to or cc to readdress it, or both; whatever you leave out stays exactly as it is, and the signature and any quoted conversation are kept either way.\n\nThis is what "make it shorter", "fix my English", "more formal" and "actually send it to Cristiano instead" all ask for. Never use create_draft to change an existing draft: that opens a second composer and leaves the user two drafts for one email. The subject is the one thing this can\'t change; if the user wants a different subject, write a new draft.\n\nYou can\'t delete or discard a draft. When the user wants one gone, tell them plainly that you can\'t, and that they can discard it themselves from the composer.\n\nThis NEVER sends. The user reviews the change on a confirm card before it runs.',
        parameters: {
            draft: 'The composer-… reference from read_composer.',
            body: "The new text, replacing the draft's text, as plain text.",
            to: 'New recipients, as contact-… references or email addresses.',
            cc: 'New cc recipients, in the same form as to.',
        },
    },
    open_support_ticket: {
        description:
            "Open the \"Report a problem\" form on the user's screen, filled in from what they described, for them to review and send. It's the last step, not the first answer to a complaint: when the user reports something broken or confusing, first try to solve it with proton_info and answer them. Use this only when that lookup has no answer, or when the user asks to contact support, speak to a human or file a bug report.\n\nWrite the description yourself: a clear, self-contained summary of the problem in the user's own terms. A form that opens empty is worse than none, so if what they've told you is too thin, first ask a short question or two about what went wrong. Choose the category yourself, the closest match or null. Never ask the user which category to use or list the categories: the form has a dropdown they can change.\n\nOpening the form is all this does. The user reviews and submits it; you never submit it and can't see what's sent. The report isn't end-to-end encrypted, so keep sensitive content out of the description.",
        parameters: {
            description: "A self-contained summary of the problem, in the user's terms, free of sensitive content.",
            category: 'The closest category, or null when none fits.',
        },
    },
    load_guide: {
        description:
            "Load the usage guide for search, create_filter or update_filter: the matching rules or the Sieve dialect those tools need. Load it before the first use of that tool in a conversation. Once loaded it stays loaded, so never load the same guide twice.\n\nLoading is setup, not a step of the task: load, then call the tool it prepares straight away. Never mention the guide to the user. A change's one-line lead-in goes with the change call itself, not with this one.",
        parameters: {
            guide: 'The tool whose guide to load.',
        },
    },
};
