import { getApproximateTokenCount } from '../../llm/tokenizer';
import { selectAssets } from '../../redux/selectors';
import { pushAssetRequest } from '../../redux/sagas/assets';
import { newAttachmentId, upsertAttachment } from '../../redux/slices/core/attachments';
import type { LumoDispatch, LumoState } from '../../redux/store';
import type { Attachment, SpaceId } from '../../types';
import type { DriveDocument } from '../../types/documents';
import { SearchService } from '../search/searchService';

// Type alias for backwards compatibility
type Asset = Attachment;
const newAssetId = newAttachmentId;
const upsertAsset = upsertAttachment;
import { sendFileUploadFinishEvent } from '../../util/telemetry';
import { fileProcessingService } from '../fileProcessingService';
import { storePendingAsset } from './pendingAssets';

export const handleSpaceAssetFileAsync = (file: File, spaceId: SpaceId) => async (dispatch: LumoDispatch, getState: () => LumoState): Promise<{
    success: boolean;
    isUnsupported?: boolean;
    isDuplicate?: boolean;
    fileName: string;
    errorMessage?: string;
    assetId?: string;
}> => {
    const startTime = performance.now();

    // Check for duplicate files in this space
    const currentState = getState();
    const allAssets = selectAssets(currentState);
    
    const spaceAssets = Object.values(allAssets).filter(asset => asset.spaceId === spaceId);
    const isDuplicate = spaceAssets.some(asset => 
        asset.filename === file.name && 
        asset.rawBytes === file.size
    );

    if (isDuplicate) {
        console.log(`Duplicate file detected in space: ${file.name} (${file.size} bytes)`);
        return {
            success: false,
            isDuplicate: true,
            fileName: file.name,
        };
    }

    const fileData = new Uint8Array(await file.arrayBuffer());

    const asset: Asset = {
        id: newAssetId(),
        spaceId,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        rawBytes: file.size,
        processing: true,
        filename: file.name,
        // Note: data is included for processing, but will be removed before Redux storage
        data: fileData,
    };

    console.log('Creating space asset:', { id: asset.id, spaceId });

    let processedAsset: Asset = { ...asset };
    let hasError = false;
    let isUnsupported = false;

    try {
        const result = await fileProcessingService.processFile(file);

        if (result.success && result.result) {
            processedAsset = {
                ...processedAsset,
                markdown: result.result.convertedContent,
                truncated: result.result.truncated,
                originalRowCount: result.result.originalRowCount,
                processedRowCount: result.result.processedRowCount,
            };

            if (processedAsset.markdown) {
                try {
                    const filename = `Filename: ${processedAsset.filename}`;
                    const tokenCount = getApproximateTokenCount(`${filename}\n${processedAsset.markdown}`);
                    processedAsset.tokenCount = tokenCount;
                } catch (tokenError) {
                    console.warn('Failed to calculate token count:', tokenError);
                }
            }
        } else {
            hasError = true;
            isUnsupported = !result.success;
            processedAsset.error = true;
            processedAsset.errorMessage = result.error || 'File processing failed';
        }
    } catch (error) {
        console.error('Error processing file:', error);
        hasError = true;
        processedAsset.error = true;
        processedAsset.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    processedAsset.processing = false;

    // Store the full asset (with data) in a temporary Map, not in Redux
    // This avoids non-serializable Uint8Array in Redux actions/state
    storePendingAsset(processedAsset);

    // Remove binary data before storing in Redux (but keep markdown for LLM context)
    // Use destructuring instead of delete to ensure clean object
    const { data, ...assetForRedux } = processedAsset;

    // Add asset to Redux store (without binary data, but with markdown for LLM)
    dispatch(upsertAsset(assetForRedux));

    // Trigger persistence to backend (saga will fetch full asset from pendingAssetsMap)
    if (!hasError) {
        dispatch(pushAssetRequest({ id: processedAsset.id }));
    }

    // Index the file into the search service for RAG retrieval
    // This uses the same chunking as Drive files for large documents
    if (!hasError && processedAsset.markdown) {
        try {
            const userId = currentState.user?.value?.ID;
            if (userId) {
                const searchService = SearchService.get(userId);
                const document: DriveDocument = {
                    id: processedAsset.id, // Use attachment ID as document ID
                    name: processedAsset.filename,
                    content: processedAsset.markdown,
                    mimeType: processedAsset.mimeType || 'application/octet-stream',
                    size: processedAsset.rawBytes || 0,
                    modifiedTime: Date.now(),
                    folderId: spaceId, // Use spaceId as the folder
                    folderPath: 'Uploaded Files', // Virtual folder path
                    spaceId,
                };

                // indexDocuments will automatically chunk large files
                const indexResult = await searchService.indexDocuments([document]);
                if (indexResult.success) {
                    console.log(`[AssetFileAsync] Successfully indexed file: ${processedAsset.filename}`);
                } else {
                    console.warn(`[AssetFileAsync] Failed to index file: ${processedAsset.filename}`, indexResult.error);
                }
            }
        } catch (indexError) {
            console.warn('[AssetFileAsync] Failed to index file for search:', indexError);
            // Don't fail the upload if indexing fails
        }
    }

    const endTime = performance.now();
    const processingTimeMs = endTime - startTime;

    // Send telemetry event (optional parameters)
    try {
        sendFileUploadFinishEvent(
            file.size,
            file.type,
            !hasError,
            isUnsupported,
            hasError,
            processingTimeMs
        );
    } catch (telemetryError) {
        console.warn('Failed to send telemetry event:', telemetryError);
    }

    return {
        success: !hasError,
        isUnsupported,
        fileName: file.name,
        errorMessage: processedAsset.errorMessage,
        assetId: processedAsset.id,
    };
};

