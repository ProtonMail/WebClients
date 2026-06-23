import { type FC, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { getJoiningLinkHref } from '@proton/account/orgJoiningLink/helpers';
import { useOrganization } from '@proton/account/organization/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Copy from '@proton/components/components/button/Copy';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { openLinkInBrowser } from '@proton/components/containers/desktop/openExternalLink';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcArrowsFromCenter } from '@proton/icons/icons/IcArrowsFromCenter';
import { IcArrowsToCenter } from '@proton/icons/icons/IcArrowsToCenter';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import clsx from '@proton/utils/clsx';

import { useProviderUsers } from '../../useProviderUsers';
import ProviderUsersTable, { ProviderUserColumn, ProviderUserFilter } from '../MigrationAssistant/ProviderUsersTable';
import type { StepComponentProps } from './MigrationSetup';

const StepInviteUsers: FC<StepComponentProps> = ({ model, onNext }) => {
    const [organization] = useOrganization();
    const { createNotification } = useNotifications();
    const messageRef = useRef<HTMLParagraphElement>(null);
    const handleCopy = () => createNotification({ text: c('Success').t`Copied to clipboard` });
    const [providerUsers] = useProviderUsers(model.domainName);
    const [messageExpanded, setMessageExpanded] = useState(false);

    const activationLink = model.joiningLink
        ? getJoiningLinkHref({
              ...model.joiningLink,
              organizationName: organization?.Name,
              domainName: model.domainName,
          })
        : '';

    const inviteLink = useMemo(() => {
        // INDA-711 - on next release handle this as all other external links.
        if (isElectronApp) {
            return (
                // eslint-disable-next-line
                <button
                    className="link"
                    key="invite-link"
                    role="link"
                    onClick={() => openLinkInBrowser(activationLink)}
                >
                    {c('BOSS').t`invite link`}
                </button>
            );
        }
        return <a key="invite-link" href={activationLink} target="_blank">{c('BOSS').t`invite link`}</a>;
    }, [activationLink, isElectronApp]);

    const users = (providerUsers ?? []).filter((u) => u.ImporterOrganizationUser);

    const messageTemplate = (() => {
        const translated = c('BOSS').jt`We're moving to ${BRAND_NAME}, the secure email service.
And your ${BRAND_NAME} account is ready to claim.
Click the ${inviteLink}.
Enter your email address, we'll send a code to your Gmail.
Use it to set your password — and your ${BRAND_NAME} account is yours.
For a little while, both will work side by side. ${BRAND_NAME} and Gmail.
Then, when everyone has made the move, we will retire Gmail. We'll remind you before it does.`;

        const withLineBreaks = translated.flatMap((part, i) => {
            if (typeof part !== 'string') {
                return [part];
            }
            return part.split('\n').flatMap((line, j) => (j === 0 ? [line] : [<br key={`br-${i}-${j}`} />, line]));
        });

        return (
            <p ref={messageRef} className="m-0 color-weak">
                {withLineBreaks}
            </p>
        );
    })();

    return (
        <div className="w-full max-w-custom" style={{ '--max-w-custom': '60rem' }}>
            <div className="flex justify-space-between flex-nowrap items-center gap-4 mb-4">
                <h3 className="text-4xl text-bold">{c('BOSS').t`Onboard your team`}</h3>
                <div className="flex gap-2 shrink-0 text-semibold">
                    <Button
                        disabled={!onNext}
                        onClick={() => onNext?.()}
                        color="norm"
                        size="medium"
                        className="rounded-lg"
                    >
                        {c('Action').t`Next`}
                    </Button>
                </div>
            </div>
            <p className="mt-0 text-semibold">
                {c('BOSS').t`All migrated user accounts are ready to be invited to your ${BRAND_NAME} organization.`}
            </p>
            <p className="color-weak mt-0 max-w-custom" style={{ '--max-w-custom': '42rem' }}>
                {c('BOSS')
                    .t`Everyone gets the same invitation link. They'll visit the page, enter their email, and a verification code arrives in their Gmail inbox. From there, they set their ${BRAND_NAME} password.`}
            </p>

            <div className="mb-4">
                <label htmlFor="invitation-link" className="block text-semibold mb-2">{c('BOSS')
                    .t`Invitation link`}</label>
                <div className="relative">
                    <InputFieldTwo
                        id="invitation-link"
                        value={activationLink}
                        className="bg-weak flex-1 border-weak color-weak"
                        readOnly
                        assistContainerClassName="assist-container--no-min-height m-0"
                        suffix={
                            <Copy shape="ghost" color="norm" value={activationLink} onCopy={handleCopy} size="small" />
                        }
                    />
                </div>
            </div>

            <div className="mb-4">
                <label htmlFor="message-template" className="block text-semibold mb-2">{c('BOSS')
                    .t`Invitation message`}</label>
                <div
                    className={clsx(
                        'relative bg-weak rounded p-2 px-3 border border-weak overflow-hidden',
                        messageExpanded ? 'max-h-auto' : 'max-h-custom'
                    )}
                    style={{ '--max-h-custom': '2.25rem' }}
                >
                    {messageRef.current && (
                        <div
                            className="float-right ml-1 mt-custom pt-0.5 mr-custom"
                            style={{
                                '--mt-custom': 'calc( -1 * var(--space-2) + (var(--space-0-5) / 2)  )',
                                '--mr-custom': 'calc( -1 * var(--space-1) )',
                            }}
                        >
                            <Tooltip
                                title={
                                    messageExpanded
                                        ? c('BOSS').t`Collapse invitation message`
                                        : c('BOSS').t`Expand invitation message`
                                }
                            >
                                <Button
                                    shape="ghost"
                                    color="norm"
                                    icon
                                    size="small"
                                    onClick={() => setMessageExpanded(!messageExpanded)}
                                >
                                    {messageExpanded ? (
                                        <IcArrowsToCenter alt={c('BOSS').t`Collapse invitation message`} />
                                    ) : (
                                        <IcArrowsFromCenter alt={c('BOSS').t`Expand invitation message`} />
                                    )}
                                </Button>
                            </Tooltip>
                            <Copy
                                shape="ghost"
                                color="norm"
                                value={messageRef.current}
                                onCopy={handleCopy}
                                size="small"
                            />
                        </div>
                    )}
                    {messageTemplate}
                </div>
            </div>

            <h4 className="text-2xl text-semibold mt-12 mb-4">{c('BOSS').t`Migrated accounts`}</h4>
            <Card
                padded={false}
                rounded
                background={false}
                className="shadow-norm bg-elevated border-weak rounded-xl overflow-hidden"
            >
                <ProviderUsersTable
                    users={users}
                    currentUser={model.tokens?.at(0)?.Account}
                    hiddenColumns={ProviderUserColumn.Migration}
                    hiddenFilters={
                        ProviderUserFilter.COMPLETED |
                        ProviderUserFilter.ERROR |
                        ProviderUserFilter.IN_PROGRESS |
                        ProviderUserFilter.NOT_STARTED
                    }
                />
            </Card>
        </div>
    );
};

export default StepInviteUsers;
