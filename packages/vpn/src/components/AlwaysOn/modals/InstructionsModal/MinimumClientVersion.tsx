import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuLink from '@proton/components/components/dropdown/DropdownMenuLink';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import { IcArrowDownToSquare } from '@proton/icons/icons/IcArrowDownToSquare';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';

import { useAlwaysOnPolicyTelemetry } from '../../../../hooks/useAlwaysOnPolicyTelemetry';

export interface DownloadLink {
    title: string;
    href: string;
}

interface Props {
    /** Client version that first enforces the device profile. */
    version: string;
    /** Builds offered under "Download latest". Empty falls back to `downloadPage`. */
    links: DownloadLink[];
    /** Where to send admins when no individual build can be offered. */
    downloadPage: string;
}

/**
 * Reminds admins that the device profile is only enforced from `version` of the client on.
 */
export const MinimumClientVersion = ({ version, links, downloadPage }: Props) => {
    const { sendDownloadLatestClickedReport, sendClientDownloadClickedReport } = useAlwaysOnPolicyTelemetry();
    const label = c('Action').t`Download latest`;

    const downloadLatest = links.length ? (
        <SimpleDropdown
            key="download-latest"
            as={InlineLinkButton}
            className="inline-flex"
            content={label}
            originalPlacement="bottom-start"
            onToggle={(isOpen: boolean) => {
                if (isOpen) {
                    sendDownloadLatestClickedReport('build', version);
                }
            }}
        >
            <DropdownMenu>
                {links.map(({ title, href }) => (
                    <DropdownMenuLink
                        key={href}
                        href={href}
                        className="group-hover-opacity-container text-nowrap"
                        onClick={() => sendClientDownloadClickedReport('build', version)}
                    >
                        <span className="flex flex-nowrap items-center justify-space-between gap-3 shrink-0">
                            <span className="self-end">{title}</span>
                            <span className="flex">
                                <IcArrowDownToSquare
                                    className="color-weak shrink-0 transition-opacity group-hover:opacity-100 "
                                    alt=""
                                    size={4}
                                />
                            </span>
                        </span>
                    </DropdownMenuLink>
                ))}
            </DropdownMenu>
        </SimpleDropdown>
    ) : (
        <Href
            key="download-latest"
            href={downloadPage}
            onClick={() => {
                sendDownloadLatestClickedReport('download-page', version);
                sendClientDownloadClickedReport('download-page', version);
            }}
        >
            {label}
        </Href>
    );

    // translator: example: "Please ensure you're running Proton VPN desktop version 5.3.0 or later. Download latest"
    return c('Info')
        .jt`Please ensure you're running ${VPN_APP_NAME} desktop version ${version} or later. ${downloadLatest}`;
};
