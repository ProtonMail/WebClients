import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter as Router } from 'react-router-dom';

import { ErrorBoundary } from '@proton/components';

import { ExtensionWindow } from '../shared/components/extension';
import { ExtensionContext } from '../shared/extension';
import createClientStore from '../shared/store/client-store';
import { App } from './App';
import { ExtensionError } from './components/ExtensionError';
import { PopupContextProvider } from './context/popup/PopupContext';
import { usePopupContext } from './hooks/usePopupContext';
import { usePopupZoomSurgery } from './hooks/usePopupZoomSurgery';
import { Lobby } from './views/Lobby/Lobby';

import './Popup.scss';

const AppOrLobby = () => {
    const { state } = usePopupContext();
    return state.loggedIn ? <App /> : <Lobby />;
};

const Popup = () => {
    usePopupZoomSurgery();

    return (
        <ExtensionWindow endpoint="popup">
            {(ready) =>
                ready && (
                    <ReduxProvider store={createClientStore('popup', ExtensionContext.get().tabId)}>
                        <Router>
                            <ErrorBoundary component={<ExtensionError />}>
                                <PopupContextProvider>
                                    <AppOrLobby />
                                </PopupContextProvider>
                            </ErrorBoundary>
                        </Router>
                    </ReduxProvider>
                )
            }
        </ExtensionWindow>
    );
};

export default Popup;
