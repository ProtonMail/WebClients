import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { FileUploadInfo, RequestUploadResult } from '../../interfaces/file';
import { generateUID, useApi, useGetAddresses, useGetAddressKeys } from 'react-components';
import ChunkFileReader from './ChunkFileReader';
import { queryRequestUpload } from '../../api/files';
import { generateContentHash, sign } from 'proton-shared/lib/keys/driveKeys';
import { getPrimaryAddress } from 'proton-shared/lib/helpers/address';
import { splitKeys } from 'proton-shared/lib/keys/keys';
import { upload } from './upload';

export enum UploadState {
    Pending = 'pending',
    Progress = 'progress',
    Done = 'done',
    Canceled = 'canceled'
}

type FileInitializer = () => Promise<FileUploadInfo>;
type BlockTransformer = (buffer: Uint8Array) => Promise<Uint8Array>;
type UploadFinalizer = (info: FileUploadInfo, blocklist: { Index: number; Token: string }[]) => Promise<void>;

interface UploadInfo {
    blob: Blob;
    fileName: string;
    shareId: string;
    linkId: string;
}

export interface Upload {
    id: string;
    info: UploadInfo;
    state: UploadState;
}

export interface UploadProgresses {
    [id: string]: number;
}

interface UploadConfig {
    [id: string]: {
        initialize: FileInitializer;
        transform: BlockTransformer;
        finalize: UploadFinalizer;
        reader: FileReader;
    };
}

interface DownloadProviderState {
    uploads: Upload[];
    startUpload: (
        info: UploadInfo,
        handlers: { initialize: FileInitializer; transform: BlockTransformer; finalize: UploadFinalizer }
    ) => void;
    getUploadsProgresses: () => UploadProgresses;
}

// Max decrypted block size
const CHUNK_SIZE = 4 * 1024 * 1024;
const MAX_CHUNKS_READ = 5;

const UploadContext = createContext<DownloadProviderState | null>(null);

interface UserProviderProps {
    children: React.ReactNode;
}

export const UploadProvider = ({ children }: UserProviderProps) => {
    const api = useApi();
    const getAddressKeys = useGetAddressKeys();
    const getAddresses = useGetAddresses();
    const [uploads, setUploads] = useState<Upload[]>([]);
    const progresses = useRef<UploadProgresses>({});
    const uploadConfig = useRef<UploadConfig>({});

    const updateUploadState = (id: string, state: UploadState) => {
        setUploads((uploads) => uploads.map((upload) => (upload.id === id ? { ...upload, state } : upload)));
    };

    const uploadFile = async ({ id, info: { blob } }: Upload) => {
        progresses.current[id] = 0;
        updateUploadState(id, UploadState.Progress);

        const info = await uploadConfig.current[id].initialize();
        const addresses = await getAddresses();
        const primaryAddress = getPrimaryAddress(addresses);

        if (!primaryAddress) {
            throw new Error('User has no primary address');
        }

        const { privateKeys } = splitKeys(await getAddressKeys(primaryAddress.ID));

        const uploadChunks = async (chunks: Uint8Array[], startIndex: number) => {
            const encryptedChunks = await Promise.all(chunks.map((chunk) => uploadConfig.current[id].transform(chunk)));
            const BlockList = await Promise.all(encryptedChunks.map((chunk) => generateContentHash(chunk)));
            const Signature = await sign(JSON.stringify(BlockList), privateKeys as any);

            const { UploadLinks }: RequestUploadResult = await api(
                queryRequestUpload({
                    AddressID: primaryAddress.ID,
                    BlockList,
                    Signature
                })
            );

            for (let i = 0; i < UploadLinks.length; i++) {
                await upload(UploadLinks[i].URL, encryptedChunks[i], (relativeIncrement) => {
                    progresses.current[id] += chunks[i].length * relativeIncrement;
                });
            }

            return UploadLinks.map(({ Token }, i) => ({
                Index: startIndex + i,
                Token
            }));
        };

        const reader = new ChunkFileReader(blob, CHUNK_SIZE);
        const blockTokens = [];
        let startIndex = 1;

        while (!reader.isEOF()) {
            const chunks = [];

            while (!reader.isEOF() && chunks.length !== MAX_CHUNKS_READ) {
                chunks.push(await reader.readNextChunk());
            }

            blockTokens.push(...(await uploadChunks(chunks, startIndex)));
            startIndex += MAX_CHUNKS_READ;
        }

        await uploadConfig.current[id].finalize(info, blockTokens);

        updateUploadState(id, UploadState.Done);
    };

    useEffect(() => {
        const nextPending = uploads.find(({ state }) => state === UploadState.Pending);

        if (nextPending) {
            uploadFile(nextPending);
        }
    }, [uploads]);

    const startUpload = (
        info: UploadInfo,
        {
            initialize,
            transform,
            finalize
        }: { initialize: FileInitializer; transform: BlockTransformer; finalize: UploadFinalizer }
    ) => {
        const id = generateUID('drive-upload');

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
                info,
                state: UploadState.Pending
            }
        ]);
    };

    const getUploadsProgresses = () => ({ ...progresses.current });

    return (
        <UploadContext.Provider
            value={{
                uploads,
                startUpload,
                getUploadsProgresses
            }}
        >
            {children}
        </UploadContext.Provider>
    );
};

export const useUploadProvider = () => {
    const state = useContext(UploadContext);
    if (!state) {
        throw new Error('Trying to use uninitialized UploadProvider');
    }
    return state;
};
