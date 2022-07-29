import { useCallback, useState } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { ExperimentsProvider, FeaturesProvider, ModalsChildren } from '@proton/components';
import ForceRefreshContext from '@proton/components/containers/forceRefresh/context';
import { APPS } from '@proton/shared/lib/constants';

import { store } from '../../logic/eo/eoStore';
import EOPageContainer from './EOPageContainer';
import FakeEventManagerProvider from './FakeEventManagerProvider';
import EOLayout from './layout/EOLayout';

const EOContainer = () => {
    const [, setState] = useState(1);
    const refresh = useCallback(() => setState((i) => i + 1), []);

    return (
        <FakeEventManagerProvider>
            <FeaturesProvider>
                <ExperimentsProvider>
                    <ForceRefreshContext.Provider value={refresh}>
                        <EOLayout toApp={APPS.PROTONMAIL}>
                            <ReduxProvider store={store}>
                                <EOPageContainer />
                            </ReduxProvider>
                        </EOLayout>
                        <ModalsChildren />
                    </ForceRefreshContext.Provider>
                </ExperimentsProvider>
            </FeaturesProvider>
        </FakeEventManagerProvider>
    );
};

export default EOContainer;
