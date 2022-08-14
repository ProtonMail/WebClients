import { useEffect } from 'react';

import { c } from 'ttag';

import {
    Button,
    CalendarLogo,
    DriveLogo,
    FeatureCode,
    Href,
    IconSize,
    MailLogo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalProps,
    VpnLogo,
    useFeature,
} from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import OnboardingContent from '../onboarding/OnboardingContent';
import calendarSVG from './assets/Calendar.svg';
import driveSVG from './assets/Drive.svg';
import mailSVG from './assets/Mail.svg';

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
            <ModalContent className="m2">
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
                                    .jt`Introducing Proton’s refreshed look.${br}Many services, one mission. Welcome to an internet where privacy is the default.`
                            }{' '}
                            <Href url={getStaticURL('/news/updated-proton')}>{c('Info').t`Learn more`}</Href>
                        </>
                    }
                />
                <Button fullWidth size="large" color="norm" onClick={rest.onClose}>{c('Action').t`Got it`}</Button>
                <div className="flex-item-noshrink text-center mt1-75">
                    <AppLogos size={40} />
                </div>
            </ModalContent>
        </Modal>
    );
};

export default V5WelcomeModal;
