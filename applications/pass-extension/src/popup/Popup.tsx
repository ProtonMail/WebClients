import { useRef } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter as Router } from 'react-router-dom';

import { ErrorBoundary } from '@proton/components';

import { ExtensionApp } from '../shared/components/extension';
import { ExtensionContext } from '../shared/extension';
import createClientStore from '../shared/store/client-store';
import { App } from './App';
import { ExtensionError } from './components/ExtensionError';
import { PopupContextProvider } from './context/popup/PopupContext';
import { usePopupSizeSurgery } from './hooks/usePopupSizeSurgery';

import './Popup.scss';

const Popup = () => {
    usePopupSizeSurgery();
    const store = useRef<ReturnType<typeof createClientStore>>();

    return (
        <ExtensionApp endpoint="popup">
            {(ready, locale) =>
                ready && (
                    <ReduxProvider
                        store={(() =>
                            store.current ??
                            (store.current = createClientStore('popup', ExtensionContext.get().tabId)))()}
                    >
                        <Router>
                            <ErrorBoundary component={<ExtensionError />}>
                                <PopupContextProvider>
                                    <App key={locale} />
                                </PopupContextProvider>
                            </ErrorBoundary>
                        </Router>
                    </ReduxProvider>
                )
            }
        </ExtensionApp>
    );
};

export default Popup;
