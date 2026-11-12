export type FeatureFlags = {
  /** `DocsHomepageBulkTrash`: rows can be selected and trashed together, and open on double click. */
  bulkTrash: boolean
  /** `DocsHomepageBulkMove`, true only with `bulkTrash`: a selection can be moved, and row actions show on hover. */
  bulkMove: boolean
}
