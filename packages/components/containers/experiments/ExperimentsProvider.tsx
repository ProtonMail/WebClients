import { ReactNode, useEffect, useRef, useState } from 'react';

import { getExperiments } from '@proton/shared/lib/api/experiments';
import { deleteCookie, getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';

import { useApi } from '../../hooks';
import ExperimentsContext, { Experiment, ExperimentCode } from './ExperimentsContext';

interface Props {
    children: ReactNode;
}

export const DEFAULT_EXPERIMENT_VALUE = 'A';

const formatExperiments = (experiments: { [key in ExperimentCode]?: string }) => {
    return Object.entries(experiments)
        .reduce<string[]>((acc, [key, code]) => {
            return [...acc, `${key}:${code}`];
        }, [])
        .join(',');
};

const extractExperiments = (cookieValue: string) => {
    return cookieValue.split(',').reduce<{ [key in ExperimentCode]?: string }>((acc, code) => {
        const [key, value] = code.split(':');
        acc[key as ExperimentCode] = value;
        return acc;
    }, {});
};

// Purge the cache of experiments that are not in the list of codes
const purgeExperiments = (cookieExperiments: { [key in ExperimentCode]?: string }, apiExperiments: Experiment[]) => {
    return Object.entries(cookieExperiments).reduce<{ [key in ExperimentCode]?: string }>((acc, [name, value]) => {
        const index = apiExperiments.findIndex((experiment) => experiment.Name === name);
        if (index !== -1) {
            acc[name as ExperimentCode] = value;
        }
        return acc;
    }, {});
};

const addExperiments = (apiExperiments: Experiment[]) => {
    return apiExperiments.reduce<{ [key in ExperimentCode]?: string }>((acc, experiment) => {
        if (Object.values(ExperimentCode).includes(experiment.Name)) {
            acc[experiment.Name] = experiment.Value;
        }
        return acc;
    }, {});
};

const storeExperimentsInCookie = (experiments: { [key in ExperimentCode]?: string }) => {
    const cookieDomain = `.${getSecondLevelDomain(window.location.hostname)}`; // proton.me
    const cookieValue = formatExperiments(experiments);

    if (!cookieValue) {
        if (getCookie('Features')) {
            deleteCookie('Features');
        }
        return;
    }

    setCookie({
        cookieName: 'Features',
        cookieValue,
        cookieDomain,
        path: '/',
        expirationDate: 'max',
        secure: true,
    });
};

const getExperimentsFromCookie = () => {
    const cookie = getCookie('Features');

    if (cookie) {
        return extractExperiments(cookie);
    }

    return {};
};

const DEFAULT_EXPERIMENT = {
    Value: DEFAULT_EXPERIMENT_VALUE, // Since experiment option name is forced, we know A always exists and default to it
};

const ExperimentsProvider = ({ children }: Props) => {
    const api = useApi();
    const silentApi = <T,>(config: any) => api<T>({ ...config, silence: true });
    const [experiments, setExperiments] = useState<{ [key in ExperimentCode]?: string }>(getExperimentsFromCookie());
    const [loading, setLoading] = useState(true);
    const codePromiseCacheRef = useRef<Promise<void> | undefined>();

    const initialize = () => {
        const codePromiseCache = codePromiseCacheRef.current;

        if (codePromiseCache) {
            return codePromiseCache;
        }

        setLoading(true);

        const promise = silentApi<{ Experiments: Experiment[] }>(getExperiments())
            .catch(() => ({
                // Define default experiments if the API call fails
                Experiments: Object.values(ExperimentCode).map((Name) => ({
                    Value: experiments[Name] || DEFAULT_EXPERIMENT.Value, // Avoid to erase existing experiments
                    Name,
                })),
            }))
            .then((results) => {
                setExperiments((cookieExperiments) => ({
                    ...purgeExperiments(cookieExperiments, results.Experiments), // filter existing experiments stored in the cookie
                    ...addExperiments(results.Experiments), // add experiments based on ExperimentCode
                }));
            })
            .finally(() => {
                setLoading(false);
            });

        codePromiseCacheRef.current = promise;

        return promise;
    };

    useEffect(() => {
        storeExperimentsInCookie(experiments);
    }, [experiments]);

    return (
        <ExperimentsContext.Provider value={{ experiments, loading, initialize }}>
            {children}
        </ExperimentsContext.Provider>
    );
};

export default ExperimentsProvider;
