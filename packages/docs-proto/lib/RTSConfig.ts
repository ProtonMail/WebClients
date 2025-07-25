export const RTSConfig = {
  /** In bytes */
  MAX_DU_SIZE: 2_000_000,

  /** Maximum number of chunks an update can be split into */
  MAX_UPDATE_CHUNKS: 3,
} as const
