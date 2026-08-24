import {
    BooleanIndex,
    Engine,
    IntegerIndex,
    ProcessorConfig,
    TagIndex,
    TextIndex,
} from '@proton/proton-foundation-search';

import { DEFAULT_TOKEN_BUCKET_SIZE } from './config';

/**
 * Build a Foundation Search engine configured like the native Mail stack
 * (`FoundationSearchEngine::new_with_engine_config` in mail-search).
 */
export function createMailSearchEngine(): Engine {
    const textIndex = new TextIndex().withMaximumTokenBucketSize(DEFAULT_TOKEN_BUCKET_SIZE).withTrigramCache(false);

    return Engine.builder()
        .withBuiltinProcessor(new ProcessorConfig())
        .withTextIndex(textIndex)
        .withBooleanIndex(new BooleanIndex())
        .withIntegerIndex(new IntegerIndex())
        .withTagIndex(new TagIndex())
        .build();
}
