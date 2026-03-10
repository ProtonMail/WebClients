import { c } from 'ttag';

import { AppsLogos } from '@proton/components';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';

const BornPrivateFooter = () => {
    return (
        <footer className={'flex flex-column-reverse md:flex-row w-full items-center py-6 gap-4 justify-center'}>
            <div className={'flex flex-column flex-nowrap gap-1 justify-center'}>
                <AppsLogos
                    logoSize={6}
                    appNames={false}
                    apps={[
                        APPS.PROTONMAIL,
                        APPS.PROTONCALENDAR,
                        APPS.PROTONVPN_SETTINGS,
                        APPS.PROTONPASS,
                        APPS.PROTONWALLET,
                        APPS.PROTONDRIVE,
                        APPS.PROTONDOCS,
                        APPS.PROTONSHEETS,
                    ]}
                />
                <div className="flex color-weak text-sm ml-0.5 justify-center">
                    {c('Footer').t`${BRAND_NAME}. Privacy by default.`}
                </div>
            </div>
        </footer>
    );
};

export default BornPrivateFooter;
