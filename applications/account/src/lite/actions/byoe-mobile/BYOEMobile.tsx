import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import Toggle from '@proton/components/components/toggle/Toggle';
import useToggle from '@proton/hooks/useToggle';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';
import icon from '@proton/styles/assets/img/byoe/mobile-gmail-app-icon.svg';

import MobileSection from '../../components/MobileSection';
import MobileSectionLabel from '../../components/MobileSectionLabel';
import MobileSectionRow from '../../components/MobileSectionRow';

import '../MobileSettings.scss';

interface Props {
    layout: (children: React.ReactNode, props?: any) => React.ReactNode;
}

export const BYOEMobile = ({ layout }: Props) => {
    const { state, toggle } = useToggle(true);

    const { createNotification } = useNotifications();

    const handleClick = () => {
        createNotification({ text: 'Not implemented yet' });
    };

    return layout(
        <div className="mobile-settings">
            <MobileSection>
                <MobileSectionRow stackContent>
                    <img src={icon} alt="" height={68} width={74} className="mb-4" />
                    <h2 className="text-3xl text-bold m-0 mb-2">{c('Title').t`Connected addresses`}</h2>
                    <p className="color-weak m-0 mb-3">{c('Description')
                        .t`Make your Gmail private in under a minute, without editing or deleting anything there.`}</p>
                    <div className="color-weak">
                        <p className="text-semibold m-0 mb-2">{c('Label').t`You will be able to:`}</p>
                        <ul className="m-0 mb-2 pl-5">
                            <li className="text-medium">{c('Label')
                                .t`Receive Gmail straight in ${BRAND_NAME} inbox`}</li>
                            <li className="text-medium">{c('Label')
                                .t`Send from your Gmail address in ${BRAND_NAME}`}</li>
                        </ul>
                        <Href className="color-primary text-semibold text-no-decoration" href={getStaticURL('')}>
                            {c('Link').t`Learn more`}
                        </Href>
                    </div>
                </MobileSectionRow>
                <MobileSectionRow>
                    <MobileSectionLabel
                        htmlFor="import-toggle"
                        description={<span>{c('Label').t`Up to 80% of storage limit`}</span>}
                    >
                        {c('Label').t`Import messages`}
                    </MobileSectionLabel>
                    <Toggle id="import-toggle" checked={state} onChange={toggle} loading={false} />
                </MobileSectionRow>
                <MobileSectionRow>
                    <Button
                        fullWidth
                        size="large"
                        color="norm"
                        shape="solid"
                        className="rounded-full"
                        onClick={handleClick}
                    >{c('Action').t`Connect and import`}</Button>
                </MobileSectionRow>
            </MobileSection>
        </div>,
        { className: 'overflow-auto' }
    );
};
