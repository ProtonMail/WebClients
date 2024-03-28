import { useRef } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { PopupProvider } from 'proton-pass-extension/lib/components/Context/PopupProvider';
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
        <ExtensionApp endpoint="popup" onDisconnect={() => window.location.reload()}>
            {(ready) =>
                ready && (
                    <ReduxProvider
                        store={(() =>
                            store.current ??
                            (store.current = createClientStore('popup', ExtensionContext.get().tabId)))()}
                    >
                        <ErrorBoundary component={<ExtensionError />}>
                            <PopupProvider>
                                <App />
                            </PopupProvider>
                        </ErrorBoundary>
                    </ReduxProvider>
                )
            }
        </ExtensionApp>
    );
};

export default Popup;
