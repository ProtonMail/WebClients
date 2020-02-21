import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { generateUID, useApi } from 'react-components';
import { generateContentHash } from 'proton-shared/lib/keys/driveKeys';
import ChunkFileReader from './ChunkFileReader';
import { FileUploadInfo, RequestUploadResult } from '../../interfaces/file';
import { queryRequestUpload } from '../../api/files';
import { upload } from './upload';
import { TransferState, TransferProgresses } from '../../interfaces/transfer';
import useDriveCrypto from '../../hooks/useDriveCrypto';

export interface BlockMeta {
    Index: number;
    Hash: string;
    Token: string;
}

type FileInitializer = () => Promise<FileUploadInfo>;
type BlockTransformer = (buffer: Uint8Array) => Promise<Uint8Array>;
type UploadFinalizer = (info: FileUploadInfo, blocklist: BlockMeta[]) => Promise<void>;

// TODO: Refactor like downloads
interface UploadInfo {
    blob: Blob;
    filename: string;
    shareId: string;
    linkId: string;
}

export interface Upload {
    id: string;
    meta: UploadInfo;
    state: TransferState;
    startDate: Date;
}

interface UploadConfig {
    [id: string]: {
        initialize: FileInitializer;
        transform: BlockTransformer;
        finalize: UploadFinalizer;
        reader: FileReader;
    };
}

interface UploadProviderState {
    uploads: Upload[];
    startUpload: (
        info: UploadInfo,
        handlers: { initialize: FileInitializer; transform: BlockTransformer; finalize: UploadFinalizer }
    ) => void;
    getUploadsProgresses: () => TransferProgresses;
    clearUploads: () => void;
}

// Max decrypted block size
const CHUNK_SIZE = 4 * 1024 * 1024;
const MAX_CHUNKS_READ = 5;
const MAX_ACTIVE_UPLOADS = 3;

const UploadContext = createContext<UploadProviderState | null>(null);

interface UserProviderProps {
    children: React.ReactNode;
}

export const UploadProvider = ({ children }: UserProviderProps) => {
    const api = useApi();
    const { getPrimaryAddressKey, sign } = useDriveCrypto();
    const [uploads, setUploads] = useState<Upload[]>([]);
    const progresses = useRef<TransferProgresses>({});
    const uploadConfig = useRef<UploadConfig>({});

    const updateUploadState = (id: string, state: TransferState) => {
        setUploads((uploads) => uploads.map((upload) => (upload.id === id ? { ...upload, state } : upload)));
    };

    const uploadFile = async ({ id, meta: { blob } }: Upload) => {
        updateUploadState(id, TransferState.Progress);

        const info = await uploadConfig.current[id].initialize();
        const keyInfo = await getPrimaryAddressKey();

        const uploadChunks = async (
            chunks: Uint8Array[],
            startIndex: number,
            info: FileUploadInfo
        ): Promise<BlockMeta[]> => {
            const encryptedChunks = await Promise.all(chunks.map((chunk) => uploadConfig.current[id].transform(chunk)));
            const BlockList = await Promise.all(
                encryptedChunks.map(async (chunk, i) => ({
                    Hash: (await generateContentHash(chunk)).BlockHash,
                    Size: chunk.byteLength,
                    Index: startIndex + i
                }))
            );
            const { signature, address } = await sign(JSON.stringify(BlockList), keyInfo);

            const { UploadLinks } = await api<RequestUploadResult>(
                queryRequestUpload({
                    BlockList,
                    AddressID: address.ID,
                    Signature: signature,
                    ...info
                })
            );

            for (let i = 0; i < UploadLinks.length; i++) {
                await upload(UploadLinks[i].URL, encryptedChunks[i], (relativeIncrement) => {
                    progresses.current[id] += Math.ceil(chunks[i].length * relativeIncrement);
                });
            }

            return UploadLinks.map(({ Token }, i) => ({
                Index: BlockList[i].Index,
                Hash: BlockList[i].Hash,
                Token
            }));
        };

        try {
            const reader = new ChunkFileReader(blob, CHUNK_SIZE);
            const blockTokens: BlockMeta[] = [];
            let startIndex = 1;

            while (!reader.isEOF()) {
                const chunks: Uint8Array[] = [];

                while (!reader.isEOF() && chunks.length !== MAX_CHUNKS_READ) {
                    chunks.push(await reader.readNextChunk());
                }

                const blocks = await uploadChunks(chunks, startIndex, info);
                blockTokens.push(...blocks);
                startIndex += MAX_CHUNKS_READ;
            }
            await uploadConfig.current[id].finalize(info, blockTokens);
            updateUploadState(id, TransferState.Done);
        } catch {
            updateUploadState(id, TransferState.Error);
        }
    };

    useEffect(() => {
        const activeUploads = uploads.filter(({ state }) => state === TransferState.Progress);
        const nextPending = uploads.find(({ state }) => state === TransferState.Pending);

        if (activeUploads.length < MAX_ACTIVE_UPLOADS && nextPending) {
            uploadFile(nextPending);
        }
    }, [uploads]);

    const startUpload = (
        meta: UploadInfo,
        {
            initialize,
            transform,
            finalize
        }: { initialize: FileInitializer; transform: BlockTransformer; finalize: UploadFinalizer }
    ) => {
        const id = generateUID('drive-upload');

        progresses.current[id] = 0;
        uploadConfig.current[id] = {
            initialize,
            transform,
            finalize,
            reader: new FileReader()
        };

        setUploads((uploads) => [
            ...uploads,
            {
                id,
                meta,
                state: TransferState.Pending,
                startDate: new Date()
            }
        ]);
    };

    const getUploadsProgresses = () => ({ ...progresses.current });
    const clearUploads = () => {
        // TODO: cancel pending downloads when implementing reject
        setUploads([]);
    };

    return (
        <UploadContext.Provider
            value={{
                uploads,
                startUpload,
                getUploadsProgresses,
                clearUploads
            }}
        >
            {children}
        </UploadContext.Provider>
    );
};

export const useUploadProvider = (): UploadProviderState => {
    const state = useContext(UploadContext);
    if (!state) {
        throw new Error('Trying to use uninitialized UploadProvider');
    }
    return state;
};
