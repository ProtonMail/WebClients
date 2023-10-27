import { c } from 'ttag';

import { CalendarLogo, DriveLogo, MailLogo, PassLogo, ProtonLogo, VpnLogo } from '@proton/components/components';
import {
    BRAND_NAME,
    CALENDAR_APP_NAME,
    DRIVE_APP_NAME,
    MAIL_APP_NAME,
    PASS_APP_NAME,
    VPN_APP_NAME,
} from '@proton/shared/lib/constants';

import promotionApplied from './promotionApplied.svg';

const PromotionAlreadyApplied = () => {
    return (
        <div className="h-full bg-norm w-full flex flex-justify-center overflow-auto">
            <div className="max-w-custom m-6" style={{ '--max-w-custom': '30rem' }}>
                <div className="flex flex-justify-center">
                    <ProtonLogo />
                </div>
                <div className="my-16 text-center flex flex-column gap-6 flex-align-center p-11 border rounded-lg">
                    <img src={promotionApplied} alt="" />
                    <h1 className="text-bold text-2xl">
                        {c('Info').t`Your account was successfully updated with this promotion`}
                    </h1>
                    <div>
                        {c('Info')
                            .t`Thanks for supporting our mission to build a better internet where privacy and freedom come first.`}
                    </div>
                </div>

                <footer className="text-sm color-weak flex flex-column gap-6">
                    <div>
                        <div className="flex gap-1 mb-1">
                            {[
                                {
                                    title: MAIL_APP_NAME,
                                    logo: <MailLogo variant="glyph-only" size={20} />,
                                },
                                {
                                    title: CALENDAR_APP_NAME,
                                    logo: <CalendarLogo variant="glyph-only" size={20} />,
                                },
                                {
                                    title: DRIVE_APP_NAME,
                                    logo: <DriveLogo variant="glyph-only" size={20} />,
                                },
                                {
                                    title: VPN_APP_NAME,
                                    logo: <VpnLogo variant="glyph-only" size={20} />,
                                },
                                {
                                    title: PASS_APP_NAME,
                                    logo: <PassLogo variant="glyph-only" size={20} />,
                                },
                            ].map(({ title, logo }) => {
                                return (
                                    <div key={title} className="" title={title}>
                                        {logo}
                                    </div>
                                );
                            })}
                        </div>
                        <div>
                            {
                                // translator: full sentence 'Proton. Privacy by default.'
                                c('Footer').t`${BRAND_NAME}. Privacy by default.`
                            }
                        </div>
                    </div>
                    <div>
                        {
                            // translator: variable here is 'Proton'
                            c('Footer')
                                .t`${BRAND_NAME} is privacy you can trust, ensured by strong encryption, open-source code, and Swiss privacy laws. We believe nobody should be able to exploit your data, period. Our technology and business are based upon this fundamentally stronger definition of privacy.`
                        }
                    </div>

                    <div>{
                        // translator: variable here is 'Proton'
                        c('Footer').t`Over 100 million people and businesses have signed up for ${BRAND_NAME}.`
                    }</div>
                </footer>
            </div>
        </div>
    );
};

export default PromotionAlreadyApplied;
