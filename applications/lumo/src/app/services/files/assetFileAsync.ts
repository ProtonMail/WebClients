import { getApproximateTokenCount } from '../../llm/tokenizer';
import { newAssetId, pushAssetRequest, upsertAsset } from '../../redux/slices/core/assets';
import { selectAssets } from '../../redux/selectors';
import type { LumoDispatch, LumoState } from '../../redux/store';
import type { Asset, SpaceId } from '../../types';
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

    const endTime = performance.now();
    const processingTimeMs = endTime - startTime;

    // Send telemetry event (optional parameters)
    try {
        sendFileUploadFinishEvent({
            success: !hasError,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            processingTimeMs,
            isUnsupported,
        });
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

