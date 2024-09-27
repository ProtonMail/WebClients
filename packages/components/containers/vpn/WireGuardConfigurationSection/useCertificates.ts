import { useEffect, useState } from 'react';

import useApiResult from '../../../hooks/useApiResult';
import type { CertificateDTO } from './Certificate';
import { CertificateMode, queryCertificates } from './api';

type ReplaceReturnType<T extends (...a: any) => any, TNewReturn> = (...a: Parameters<T>) => TNewReturn;

interface ApiResult {
    Certificates: CertificateDTO[];
    Total?: number;
}

interface Result {
    result: CertificateDTO[];
    error: Error;
    loading: boolean;
    request: ReplaceReturnType<typeof queryCertificates, Promise<ApiResult>>;
    moreToLoad: boolean;
}

const chunkSize = 51;

const seedCertificates = (
    certificatesResult: CertificateDTO[],
    certificateCache: Record<string, CertificateDTO>
): CertificateDTO[] => {
    certificatesResult.forEach((certificateDto) => {
        if (
            certificateDto.Mode === 'persistent' &&
            certificateDto.ExpirationTime >=
                (certificateCache[certificateDto.ClientKeyFingerprint]?.ExpirationTime || 0)
        ) {
            certificateCache[certificateDto.ClientKeyFingerprint] = certificateDto;
        }
    });

    return Object.values(certificateCache);
};

const useCertificates = (limit: number = chunkSize): Result => {
    const [certificateCache] = useState<Record<string, CertificateDTO>>({});
    const [beginId, setBeginId] = useState<string | undefined>(undefined);
    const [offset, setOffset] = useState(0);
    const [currentState, setCurrentState] = useState('');
    const [done, setDone] = useState(false);
    const [responses, setResponses] = useState<ApiResult[]>([]);
    const { loading, result, error, request } = useApiResult<ApiResult, typeof queryCertificates>(
        () =>
            queryCertificates({
                Mode: CertificateMode.PERSISTENT,
                Offset: offset,
                Limit: chunkSize,
                BeginID: beginId,
            }),
        [beginId, offset]
    );

    if (error) {
        // Throw in render to allow the error boundary to catch it
        throw error;
    }

    if (result && responses.indexOf(result) === -1) {
        setResponses([...responses, result]);
    }

    useEffect(() => {
        let certificates = Object.values(certificateCache);

        const newState = limit + '|' + offset + '|' + beginId + '|' + responses.length;

        if (currentState !== newState && !loading) {
            if (!result || certificates.length >= limit) {
                setCurrentState(newState);
            } else if (result) {
                const newCertificates = result.Certificates || [];
                const finished = newCertificates.length === (result.Total || 0) || newCertificates.length < chunkSize;

                if (finished) {
                    setDone(true);
                    setCurrentState(newState);
                }

                if (newCertificates.length) {
                    seedCertificates(newCertificates, certificateCache);
                    certificates = Object.values(certificateCache);

                    if (!finished) {
                        // is new API
                        if ('Total' in result) {
                            setBeginId(newCertificates[newCertificates.length - 1].SerialNumber);
                        } else {
                            setOffset(offset + newCertificates.length);
                        }
                    }
                }

                if (certificates.length >= limit) {
                    setCurrentState(newState);
                }
            }
        }
    }, [loading, limit]);

    const certificates = Object.values(certificateCache);

    return {
        result: certificates.slice(0, limit),
        error,
        loading,
        request,
        moreToLoad: !loading && (!done || certificates.length > limit),
    };
};

export default useCertificates;
