import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { LUMO_SHORT_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import lumoAppIcon from './lumo-app-icon.png';

import './DesktopConnectorsNotice.scss';

const DESKTOP_DOWNLOAD_URL = 'https://proton.me/lumo/download';
const CONNECTORS_LEARN_MORE_URL = getKnowledgeBaseUrl('/lumo-desktop-connectors');

/** Shown on the web, where connectors can't run: they need the desktop app's access to this computer. */
export const DesktopConnectorsNotice = () => {
    const points = [
        c('collider_2025:Info').t`Files and apps are read on your computer, not the cloud`,
        c('collider_2025:Info').t`Sign-ins and keys stay in your computer's keychain`,
        c('collider_2025:Info').t`You choose exactly what each connector can access`,
    ];

    return (
        <div
            className="desktop-connectors-notice flex flex-column flex-nowrap items-center gap-4 text-center"
            role="note"
        >
            <img
                className="desktop-connectors-notice__app-icon"
                src={lumoAppIcon}
                alt=""
                width={88}
                height={88}
            />
            <h2 className="mt-4 text-semibold desktop-connectors-notice__title">
                {c('collider_2025:Title').t`Connectors run in the ${LUMO_SHORT_APP_NAME} desktop app`}
            </h2>
            <p className="m-0 color-weak desktop-connectors-notice__description">
                {c('collider_2025:Info')
                    .t`Connectors let ${LUMO_SHORT_APP_NAME} answer using your files, ${MAIL_APP_NAME}, Slack and more.`}
            </p>
            <ul className="desktop-connectors-notice__points m-0 py-2 px-0 list-none flex flex-column flex-nowrap gap-2 text-left">
                {points.map((point) => (
                    <li key={point} className="flex flex-nowrap items-center gap-2">
                        <LumoIcon
                            aria-hidden
                            name="ShieldCheck"
                            size={16}
                            strokeWidth={1.4}
                            className="shrink-0 color-primary"
                        />
                        <span>{point}</span>
                    </li>
                ))}
            </ul>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
                <ButtonLike
                    as="a"
                    color="norm"
                    href={DESKTOP_DOWNLOAD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                >
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
            </div>
            <p className="m-0 text-sm color-weak">
                {c('collider_2025:Info')
                    .t`Already have it? Open the ${LUMO_SHORT_APP_NAME} desktop app and go to Customize › Connectors.`}
            </p>
        </div>
    );
};
