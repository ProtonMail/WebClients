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
}

export interface CreateDocumentResult {
    Document: {
        LinkID: string;
        RevisionID: string;
        VolumeID: string;
    };
}
