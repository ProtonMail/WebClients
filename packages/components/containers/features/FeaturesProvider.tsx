import { useRef, useState } from 'react';
import * as React from 'react';
import { getFeatures, updateFeatureValue } from '@proton/shared/lib/api/features';
import { unique } from '@proton/shared/lib/helpers/array';
import { useApi } from '../../hooks';
import FeaturesContext, { Feature, FeatureCode } from './FeaturesContext';

interface Props {
    children: React.ReactNode;
}

const FeaturesProvider = ({ children }: Props) => {
    const api = useApi();
    const silentApi = <T,>(config: any) => api<T>({ ...config, silence: true });
    const [features, setFeatures] = useState<{ [key in FeatureCode]?: Feature }>({});
    const [loading, setLoading] = useState<{ [key in FeatureCode]?: boolean }>({});
    const codePromiseCacheRef = useRef<{ [key in FeatureCode]?: Promise<Feature> | undefined }>({});
    const codeQueueRef = useRef<FeatureCode[]>([]);

    const get = (codes: FeatureCode[]) => {
        const codeQueue = codeQueueRef.current;
        codeQueueRef.current = [];
        const codePromiseCache = codePromiseCacheRef.current;

        const allUniqueCodesToFetch = unique(codes.concat(codeQueue)).filter((code) => {
            return !codePromiseCache[code];
        });
        if (!allUniqueCodesToFetch.length) {
            return Promise.all(
                codes.map((code) => {
                    return codePromiseCache[code]!;
                })
            );
        }

        setLoading((oldLoading) => {
            return allUniqueCodesToFetch.reduce<{ [key in FeatureCode]?: boolean }>((acc, code) => {
                acc[code] = true;
                return acc;
            }, { ...oldLoading });
        });

        const promise = silentApi<{ Features: Feature[] }>(getFeatures(allUniqueCodesToFetch))
            .then(({ Features }) => {
                const newFeatures = Features.reduce<{ [key in FeatureCode]?: Feature }>((acc, Feature) => {
                    acc[Feature.Code as FeatureCode] = Feature;
                    return acc;
                }, {});
                setFeatures((currentFeatures) => ({ ...newFeatures, ...currentFeatures }));

                return Features;
            })
            .finally(() => {
                setLoading((oldLoading) => {
                    return allUniqueCodesToFetch.reduce<{ [key in FeatureCode]?: boolean }>((acc, code) => {
                        acc[code] = false;
                        return acc;
                    }, { ...oldLoading });
                });
            });

        allUniqueCodesToFetch.forEach((code) => {
            codePromiseCache[code] = promise
                .then((Features) => {
                    const Feature = Features.find(({ Code }) => Code === code);
                    return Feature!;
                })
                .catch((e) => {
                    codePromiseCache[code] = undefined;
                    throw e;
                });
        });

        return Promise.all(
            codes.map((code) => {
                return codePromiseCache[code]!;
            })
        );
    };

    const updateFeature = (code: FeatureCode, feature: Feature | undefined) => {
        setFeatures((currentFeatures) => ({ ...currentFeatures, [code]: feature }));
    };

    const put = async (code: FeatureCode, value: any) => {
        const oldFeature = features[code];
        const oldCopiedFeature = oldFeature ? { ...oldFeature } : undefined;
        try {
            // Optimistically apply change
            if (oldCopiedFeature) {
                updateFeature(code, { ...oldCopiedFeature, Value: value });
            }
            const { Feature } = await silentApi<{ Feature: Feature }>(updateFeatureValue(code, value));
            updateFeature(code, Feature);
            return Feature;
        } catch (e) {
            // Rollback optimistic change if it fails
            if (oldCopiedFeature) {
                updateFeature(code, oldCopiedFeature);
            }
            throw e;
        }
    };

    const enqueue = (codes: FeatureCode[]) => {
        codeQueueRef.current = unique(codeQueueRef.current.concat(codes));
    };

    return (
        <FeaturesContext.Provider value={{ features, loading, get, put, enqueue }}>{children}</FeaturesContext.Provider>
    );
};

export default FeaturesProvider;
