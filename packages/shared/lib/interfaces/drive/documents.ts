export interface CreateDocumentPayload {
    Name: string;
    Hash: string;
    ParentLinkID: string;
    NodePassphrase: string;
    NodePassphraseSignature: string;
    SignatureAddress: string;
    NodeKey: string;
    ContentKeyPacket: string;
    ContentKeyPacketSignature: string;
    ManifestSignature: string;
    XAttr: string;
    /** 1 = doc, 2 = sheet */
    DocumentType: number;
}

export interface CreateDocumentResult {
    Document: {
        LinkID: string;
        RevisionID: string;
        VolumeID: string;
    };
}
