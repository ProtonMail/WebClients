import type { NodeMeta } from "../NodeMeta";
import type { DocumentKeys } from './DocumentKeys';

/**
 * Metadata for a document node.
 */
export type DocumentNodeMeta = NodeMeta & { keys: DocumentKeys };
