import { type Document, Value } from '@proton/proton-foundation-search';

import type { ESBaseMessage } from 'proton-mail/models/encryptedSearch.ts';

export class MailDelegate {
    stageMetadata(metadata: ESBaseMessage, doc: Document) {
        doc.addAttribute('subject', Value.text(metadata.Subject));
        doc.addAttribute('time', Value.int(BigInt(metadata.Time)));
        doc.addAttribute('from', Value.text(metadata.Sender.Address));
    }

    stageBody(body: string, doc: Document) {
        doc.addAttribute('body', Value.text(body));
    }
}
