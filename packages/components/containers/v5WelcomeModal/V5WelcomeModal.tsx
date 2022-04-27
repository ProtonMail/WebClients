import { c } from 'ttag';
import { useEffect } from 'react';
import { APPS } from '@proton/shared/lib/constants';
import {
    Button,
    CalendarLogo,
    DriveLogo,
    FeatureCode,
    Href,
    IconSize,
    MailLogo,
    ModalProps,
    ModalTwo as Modal,
    useFeature,
    VpnLogo,
} from '@proton/components';
import { getStaticURL } from '@proton/shared/lib/helpers/url';
import mailSVG from './assets/Mail.svg';
import calendarSVG from './assets/Calendar.svg';
import driveSVG from './assets/Drive.svg';
import OnboardingContent from '../onboarding/OnboardingContent';

interface Props extends ModalProps {
    app: typeof APPS.PROTONMAIL | typeof APPS.PROTONCALENDAR | typeof APPS.PROTONDRIVE;
}

const AppLogos = ({ className, size }: { className?: string; size: IconSize }) => {
    return (
        <div className={className}>
            <MailLogo variant="glyph-only" size={size} className="mx0-5" />
            <CalendarLogo variant="glyph-only" size={size} className="mx0-5" />
            <DriveLogo variant="glyph-only" size={size} className="mx0-5" />
            <VpnLogo variant="glyph-only" size={size} className="mx0-5" />
        </div>
    );
};

const V5WelcomeModal = ({ app, ...rest }: Props) => {
    const { feature, update } = useFeature(FeatureCode.SeenV5WelcomeModal);

    useEffect(() => {
        if (feature?.Value === false) {
            void update(true);
        }
    }, []);

    const br = <br key="1" />;

    return (
        <Modal size="small" {...rest}>
            <div className="p2">
                <OnboardingContent
                    img={
                        <img
                            src={(() => {
                                if (app === APPS.PROTONCALENDAR) {
                                    return calendarSVG;
                                }

                                if (app === APPS.PROTONDRIVE) {
                                    return driveSVG;
                                }

                                return mailSVG;
                            })()}
                            alt={c('new_plans: title').t`Updated Proton, unified protection`}
                        />
                    }
                    title={c('new_plans: title').t`Updated Proton, unified protection`}
                    description={
                        <>
                            {
                                // translator: ${br} is just a break line, please keep the variable at the same place.
                                c('new_plans: info')
                                    .jt`Introducing Proton’s refreshed look.${br} Many services, one mission. Welcome to an Internet where privacy is the default.`
                            }{' '}
                            <Href url={getStaticURL('/news/updated-proton')}>{c('Info').t`Learn more`}</Href>
                        </>
                    }
                />
                <Button fullWidth size="large" color="norm" onClick={rest.onClose}>{c('Action').t`Got it`}</Button>
                <div className="flex-item-noshrink text-center mt1-75">
                    <AppLogos size={40} />
                </div>
            </div>
        </Modal>
    );
};

export default V5WelcomeModal;
