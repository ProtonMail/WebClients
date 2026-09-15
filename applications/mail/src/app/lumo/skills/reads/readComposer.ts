import { c, msgid } from 'ttag';

import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';

import { messageByID } from '../../../store/messages/messagesSelectors';
import { writtenDraftBody } from '../../helpers/draftBody';
import { DRAFT_KIND_FOR, DraftKind } from '../../helpers/draftKind';
import { truncateBody } from '../../helpers/messages';
import type { MailToolDeps, MailToolModule } from '../../toolModule';

interface OpenDraft {
    /** Names this composer for revise_draft, so a write can target one of several open drafts. */
    reference: string;
    /** As last saved: an edit the user has not finished is not in the store yet. */
    subject: string;
    kind: DraftKind;
    /** False while the draft is still being decrypted, when its text cannot be read yet — and is not empty. */
    isLoaded: boolean;
    /** What the user has written: the text before the signature and any quoted thread. */
    body: string;
    /** A reply/forward only: the email being answered, to pass to read_thread for the rest of the conversation. */
    answers?: string;
}

export interface ReadComposerResult {
    drafts: OpenDraft[];
}

const describeBody = ({ isLoaded, body }: OpenDraft): string => {
    if (!isLoaded) {
        return '(still opening — none of its text has loaded yet, so what the user has written in it is unknown rather than empty)';
    }
    return body ? truncateBody(body) : '(the user has written nothing yet)';
};

const describeDraft = (draft: OpenDraft): string => {
    const { reference, subject, kind, answers } = draft;
    const heading = `${reference} — ${
        kind === DraftKind.NEW ? 'a new email' : `a ${kind}`
    }, subject "${subject || '(no subject)'}"${answers ? `, answering ${answers}` : ''}`;
    return `${heading}:\n${describeBody(draft)}`;
};

export const readComposerDefinition: ToolDefinition<Record<string, never>, ReadComposerResult> = {
    name: 'read_composer',
    kind: 'read',
    toolDescription:
        'Read what the user is currently WRITING — the draft(s) open in the composer — so you can review, correct or continue their own words. This is the right tool whenever the user refers to "what I\'m writing" / "my draft" / "this reply" / "does this sound right?" / "check my email before I send it". It returns nothing if no composer is open, which also tells you the user is not drafting anything right now. Every open composer is returned, each with its own composer-… reference — pass that reference to revise_draft to change that draft, and pick by subject rather than assuming there is only one. The body is the text the user has typed, WITHOUT their signature or the quoted conversation underneath. For a reply or a forward it also reports the email being answered — pass that reference to read_thread if you need the conversation the draft belongs to. This tool only reads: it cannot change the draft, and it never sends.',
    paramsSchema: { type: 'object', additionalProperties: false, required: [], properties: {} },
    serializeForLumo: (result) => {
        if (!result.drafts.length) {
            return 'No composer is open: the user is not writing an email right now.';
        }
        const count = result.drafts.length;
        const header = count === 1 ? 'The user has one draft open:' : `The user has ${count} drafts open, newest last:`;
        return `${header}\n\n${result.drafts.map(describeDraft).join('\n\n---\n\n')}`;
    },
    summarizeChip: (_params, result) => {
        const count = result.drafts.length;
        if (!count) {
            return { label: c('Info').t`No draft open` };
        }
        if (count === 1) {
            const subject = result.drafts[0].subject;
            return { label: subject ? c('Info').t`Read draft "${subject}"` : c('Info').t`Read the open draft` };
        }
        return {
            label: c('Info').ngettext(msgid`Read ${count} open draft`, `Read ${count} open drafts`, count),
        };
    },
};

export const createReadComposerHandler =
    (mail: MailToolDeps): ToolHandler<Record<string, never>, ReadComposerResult> =>
    async (_params, { references }) => {
        const state = mail.store.getState();

        const drafts = Object.values(state.composers.composers).flatMap<OpenDraft>((composer) => {
            const message = messageByID(state, { ID: composer.messageID });
            if (!message) {
                return [];
            }

            const action = message.draftFlags?.action;
            const kind = action === undefined ? DraftKind.NEW : DRAFT_KIND_FOR[action];
            const subject = message.data?.Subject || '';
            // Absent on a saved draft reopened in a later session: the parent is only ever recorded in
            // draftFlags, so there is nothing to point read_thread at.
            const parentID = message.draftFlags?.ParentID;
            // A draft the user has just clicked in Drafts is in the store before it is decrypted, and its
            // document reads as empty until then — indistinguishable from a draft they have not typed in.
            const isLoaded = message.messageDocument?.initialized === true;

            return [
                {
                    reference: references.referenceFor('composer', composer.ID, { title: subject }),
                    subject,
                    kind,
                    isLoaded,
                    body: isLoaded
                        ? writtenDraftBody({
                              message,
                              addresses: mail.getAddresses(),
                              mailSettings: mail.getMailSettings(),
                              userSettings: mail.getUserSettings(),
                          })
                        : '',
                    ...(kind !== DraftKind.NEW && parentID
                        ? { answers: references.referenceFor('email', parentID) }
                        : {}),
                },
            ];
        });

        return { drafts };
    };

export const readComposerModule: MailToolModule = {
    definition: readComposerDefinition,
    createHandler: createReadComposerHandler,
};
