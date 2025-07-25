import { RTSConfig } from '@proton/docs-proto'

export const MAX_DOC_SIZE = 25_000_000

export const MAX_UPDATE_SIZE = RTSConfig.MAX_DU_SIZE

export const MAX_UPDATE_CHUNKS = RTSConfig.MAX_UPDATE_CHUNKS

export const UPDATE_CHUNK_HEADER_SIGNAL = new TextEncoder().encode('update-chunk-header')

/**
 * When we chunk an update, we chunk the content itself and not the protobuf
 * message. The protobuf adds some overhead which we need to account for when
 * chunking so that the final protobuf message is not larger than the maximum
 * update size. There is no way to dynamically calculate how much overhead
 * the protobuf will add, so we use a constant value instead.
 */
export const UPDATE_CHUNK_SAFE_SIZE_MARGIN = 5_000
