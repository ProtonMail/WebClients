import { useCallback, useState } from 'react';

import ForceRefreshContext from '@proton/components/containers/forceRefresh/context';
import { APPS } from '@proton/shared/lib/constants';

import EOPageContainer from './EOPageContainer';
import FakeEventManagerProvider from './FakeEventManagerProvider';
import EOLayout from './layout/EOLayout';

const EOContainer = () => {
    const [, setState] = useState(1);
    const refresh = useCallback(() => setState((i) => i + 1), []);

    return (
        <FakeEventManagerProvider>
            <ForceRefreshContext.Provider value={refresh}>
                <EOLayout toApp={APPS.PROTONMAIL}>
                    <EOPageContainer />
                </EOLayout>
            </ForceRefreshContext.Provider>
        </FakeEventManagerProvider>
    );
};

export default EOContainer;
