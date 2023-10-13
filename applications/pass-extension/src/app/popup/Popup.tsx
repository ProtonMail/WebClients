import { useRef } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter as Router } from 'react-router-dom';

import { PopupContextProvider } from 'proton-pass-extension/lib/components/Context/Popup/PopupContext';
import { ExtensionApp } from 'proton-pass-extension/lib/components/Extension/ExtensionApp';
import { ExtensionError } from 'proton-pass-extension/lib/components/Extension/ExtensionError';
import { ExtensionContext } from 'proton-pass-extension/lib/context/extension-context';
import { usePopupSizeSurgery } from 'proton-pass-extension/lib/hooks/usePopupSizeSurgery';
import { createClientStore } from 'proton-pass-extension/lib/store/client-store';

import { ErrorBoundary } from '@proton/components';

import { App } from './App';

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
