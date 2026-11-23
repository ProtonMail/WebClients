import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useDocumentTitle from '@proton/components/hooks/useDocumentTitle';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoCatAlert from '@proton/styles/assets/img/lumo/lumo-cat-alert.svg';

import { LumoIcon } from './LumoIcon/LumoIcon';

/**
 * Full-page screen shown when IndexedDB is unavailable and Lumo cannot start.
 *
 * This typically happens on iOS Safari when website data is blocked
 * ("Block All Cookies"), in private browsing, or with Lockdown Mode enabled.
 * It is rendered outside the Redux store; the theme is already applied from local
 * storage by `applyInitialLumoTheme` (index.tsx).
 */
const IndexedDBUnavailablePage = () => {
    useDocumentTitle(LUMO_SHORT_APP_NAME);

    return (
        <>
            <div className="loader-page lumo-loader-bg h-full lumo-color-glyph">
                <div
                    className="absolute inset-center text-center flex flex-column items-center flex-nowrap gap-4 max-w-custom px-4"
                    style={{ '--max-w-custom': '30rem' }}
                >
                    <span className="inline-flex p-4 radius-full" aria-hidden="true">
                        <img className="h-custom w-custom" src={lumoCatAlert} alt="" />
                    </span>

                    <h1 className="mt-2 lumo-title-large">{c('collider_2025:Title')
                        .t`${LUMO_SHORT_APP_NAME} can't start`}</h1>

                    <p className="m-0 lumo-color-glyph-mid">{c('collider_2025:Info')
                        .t`${LUMO_SHORT_APP_NAME} needs local database storage (IndexedDB) to keep your conversations on this device, but it isn't available here.`}</p>

                    <div className="w-full p-4 radius-12 text-left lumo-bg-control-fill">
                        <p className="mt-0 mb-2 lumo-label-small">{c('collider_2025:Info')
                            .t`This usually happens when:`}</p>
                        <ul className="flex flex-column gap-1 m-0 pl-5 lumo-body-small lumo-color-glyph-mid">
                            <li>{c('collider_2025:Info')
                                .t`Cookies or website data are blocked in your browser settings`}</li>
                            <li>{c('collider_2025:Info').t`You're using private browsing`}</li>
                            <li>{c('collider_2025:Info').t`Lockdown Mode is enabled on your device`}</li>
                        </ul>
                    </div>

                    <p className="m-0 lumo-body-small lumo-color-glyph-mid">{c('collider_2025:Info')
                        .t`On iPhone or iPad, open Settings → Apps → Safari and make sure "Block All Cookies" is turned off, then reload.`}</p>

                    <div className="mt-2">
                        <Button color="norm" onClick={() => window.location.reload()}>
                            <LumoIcon name="RotateCw" className="mr-2" />
                            <span>{c('Action').t`Reload`}</span>
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default IndexedDBUnavailablePage;
