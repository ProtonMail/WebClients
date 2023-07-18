import { c } from 'ttag';

import DrawerContactView from '@proton/components/components/drawer/views/DrawerContactView';
import { ErrorBoundary, StandardErrorPage } from '@proton/components/containers';
import { CustomAction } from '@proton/components/containers/contacts/widget/types';
import { APPS } from '@proton/shared/lib/constants';
import { Recipient } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { useDrawer } from '../../hooks';
import DrawerContactModals from './DrawerContactModals';

import './DrawerApp.scss';

interface Props {
    /**
     * Mail specific
     */
    onCompose?: (recipients: Recipient[], attachments: File[]) => void;
    onMailTo?: (src: string) => void;
    /**
     * Calendar specific
     */
    contactCustomActions?: CustomAction[];
}

const DrawerApp = ({ onCompose, onMailTo, contactCustomActions }: Props) => {
    const { appInView, iframeSrcMap } = useDrawer();

    return (
        <>
            <DrawerContactModals />
            <aside
                className={clsx([
                    'drawer-app border-left bg-norm overflow-hidden no-print',
                    !appInView && 'hidden',
                    appInView !== APPS.PROTONCONTACTS && 'drawer-app--hide-on-mobile',
                ])}
            >
                <ErrorBoundary component={<StandardErrorPage />}>
                    <div className="drawer-app-inner h100 w100">
                        {Object.entries(iframeSrcMap)
                            .filter(([, src]) => src)
                            .map(([app, src]) => (
                                <iframe
                                    key={app}
                                    id={`drawer-app-iframe-${app}`}
                                    className={clsx(['drawer-app-view h100 w100', appInView !== app && 'hidden'])}
                                    src={src}
                                    title={c('Info').t`Calendar side panel`}
                                    allow="clipboard-read; clipboard-write"
                                />
                            ))}
                        {appInView === APPS.PROTONCONTACTS && (
                            <DrawerContactView
                                onCompose={onCompose}
                                onMailTo={onMailTo}
                                customActions={contactCustomActions}
                            />
                        )}
                    </div>
                </ErrorBoundary>
            </aside>
        </>
    );
};

export default DrawerApp;
