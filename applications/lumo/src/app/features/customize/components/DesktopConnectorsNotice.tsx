import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { LUMO_SHORT_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getBlogURL } from '@proton/shared/lib/helpers/url';

import { type IconName, LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { CustomizeNotice } from './CustomizeNotice';

const DESKTOP_DOWNLOAD_URL = 'https://proton.me/lumo/download';
const CONNECTORS_LEARN_MORE_URL = getBlogURL('/lumo-desktop-features');

export const getConnectorsSellingPoints = (): { icon: IconName; text: string }[] => [
    {
        icon: 'Search',
        text: c('collider_2025:Info').t`Find documents, bookings and messages without switching apps`,
    },
    {
        icon: 'ShieldCheck',
        text: c('collider_2025:Info').t`You decide what ${LUMO_SHORT_APP_NAME} does on its own and what needs your OK`,
    },
    {
        icon: 'Lock',
        text: c('collider_2025:Info').t`Your data is never used to train AI`,
    },
];

/** Shown on the web, where connectors can't run: they need the desktop app's access to this computer. */
export const DesktopConnectorsNotice = () => (
    <CustomizeNotice
        icon="desktop"
        title={c('collider_2025:Title').t`Bring your apps and files into ${LUMO_SHORT_APP_NAME}`}
        description={c('collider_2025:Info')
            .t`With the ${LUMO_SHORT_APP_NAME} desktop app, connect ${MAIL_APP_NAME}, your files, Jira, Linear and more, so ${LUMO_SHORT_APP_NAME} can work with the things you already use.`}
        points={getConnectorsSellingPoints()}
        actions={
            <>
                <ButtonLike as="a" color="norm" href={DESKTOP_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
                    <LumoIcon aria-hidden name="Download" size={16} strokeWidth={1.4} className="mr-2" />
                    {c('collider_2025:Action').t`Download the desktop app`}
                </ButtonLike>
                <ButtonLike
                    as="a"
                    color="weak"
                    shape="outline"
                    href={CONNECTORS_LEARN_MORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {c('collider_2025:Action').t`Learn more`}
                </ButtonLike>
            </>
        }
        footnote={c('collider_2025:Info')
            .t`Already have it? Open the ${LUMO_SHORT_APP_NAME} desktop app and go to Customize › Connectors.`}
    />
);
