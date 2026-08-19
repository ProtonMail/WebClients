import { type Document, Value } from '@proton/proton-foundation-search';

import type { ESBaseMessage } from '../../models/encryptedSearch.ts';

export class MailDelegate {
    stageMetadata(metadata: ESBaseMessage, doc: Document) {
        doc.addAttribute('subject', Value.text(metadata.Subject));
        doc.addAttribute('time', Value.int(BigInt(metadata.Time)));
        doc.addAttribute('hasAttachments', Value.bool(metadata.NumAttachments > 0));
        doc.addAttribute('sender', Value.tag(metadata.Sender.Address));
        for (const to of metadata.ToList) {
            doc.addAttribute('recipient', Value.tag(to.Address));
        }
        for (const cc of metadata.CCList) {
            doc.addAttribute('recipient', Value.tag(cc.Address));
        }
        for (const label of metadata.LabelIDs) {
            doc.addAttribute('labelId', Value.tag(label));
        }
        doc.addAttribute('addressId', Value.tag(metadata.AddressID));

        doc.addRangeKey(BigInt(metadata.Time));
    }

    stageBody(body: string, doc: Document) {
        doc.addAttribute('body', Value.text(body));
    }
}
