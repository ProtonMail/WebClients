import { useEffect, useState } from 'react';

import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import {
    Loader,
    SettingsParagraph,
    SettingsSection,
    SettingsSectionWide,
    Table,
    TableBody,
    TableHeader,
    TableRow,
    UpgradeBanner,
    useActiveBreakpoint,
    useAddresses,
    useApi,
    useModalState,
    useNotifications,
    useOrganization,
    useUser,
} from '@proton/components';
import Prompt from '@proton/components/components/prompt/Prompt';
import { useLoading } from '@proton/hooks';
import { deleteToken, getTokens, isTokenEligible } from '@proton/shared/lib/api/smtptokens';
import {
    ADDRESS_TYPE,
    APP_UPSELL_REF_PATH,
    BRAND_NAME,
    MAIL_APP_NAME,
    MAIL_UPSELL_PATHS,
    PLANS,
    PLAN_NAMES,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { hasSMTPSubmission } from '@proton/shared/lib/helpers/organization';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl, getSupportContactURL } from '@proton/shared/lib/helpers/url';
import { dateLocale } from '@proton/shared/lib/i18n';
import { Audience } from '@proton/shared/lib/interfaces';
import { isOrganizationB2B } from '@proton/shared/lib/organization/helper';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import { getDeleteText } from '../general/helper';
import SMTPTokenModal from './SMTPTokenModal';

interface SmtpTokens {
    SmtpTokenID: string;
    AddressID: string;
    Name: string;
    CreateTime: number;
    LastUsedTime: number | null;
}

const SMTPSubmissionSection = () => {
    const api = useApi();
    const [user] = useUser();
    const [addresses = []] = useAddresses();
    const addressMap = new Map(addresses.map((address) => [address.ID, address.Email]));
    const hasCustomAddress = addresses.some(({ Type }) => Type === ADDRESS_TYPE.TYPE_CUSTOM_DOMAIN);
    const [organization, loadingOrganization] = useOrganization();
    const isB2BOrganization = isOrganizationB2B(organization);
    const [tokenIDToRemove, setTokenIDToRemove] = useState('');
    const [loadingTokens, withLoadingTokens] = useLoading();
    const [loadingTokenEligible, withloadingTokenEligible] = useLoading();
    const [tokenEligible, setTokenEligible] = useState<boolean>(false);
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const [confirmModalProps, setConfirmModalOpen, renderConfirmModal] = useModalState();
    const [generateTokenModalProps, setGenerateTokenModalOpen, renderGenerateTokenModal] = useModalState();
    const [tokens, setTokens] = useState<SmtpTokens[]>([]);
    const { viewportWidth } = useActiveBreakpoint();
    const showDetails = viewportWidth['>=large'];
    const submissionTokenAvailable = hasSMTPSubmission(organization);
    const tokenNameToRemove = tokens.find(({ SmtpTokenID }) => SmtpTokenID === tokenIDToRemove)?.Name || '';
    const hasTokens = tokens.length > 0;
    const headers = [
        c('Header for table').t`Token name`,
        c('Header for table').t`Email address`,
        showDetails && c('Header for table').t`Created`,
        showDetails && c('Header for table').t`Last used`,
        c('Header for table').t`Actions`,
    ].filter(isTruthy);
    const headersLength = headers.length;

    const openGenerateTokenModal = () => {
        if (!hasCustomAddress) {
            createNotification({
                type: 'error',
                text: c('Error')
                    .t`You need to have a custom domain address in order to generate an SMTP submission token.`,
            });
            return;
        }
        setGenerateTokenModalOpen(true);
    };

    const confirmRemoveToken = (tokenID: string) => {
        setTokenIDToRemove(tokenID);
        setConfirmModalOpen(true);
    };

    const removeToken = async () => {
        await api(deleteToken(tokenIDToRemove));
        setTokens(tokens.filter(({ SmtpTokenID }) => SmtpTokenID !== tokenIDToRemove));
        setTokenIDToRemove('');
        setConfirmModalOpen(false);
        createNotification({ text: c('Success').t`SMTP token deleted` });
    };

    const getSmtpTokenEligible = async () => {
        let isEligible = submissionTokenAvailable ?? false; // if null then false
        // if not eligible and b2b then check
        if (!isEligible && isB2BOrganization) {
            isEligible = (await api({ ...isTokenEligible(), silence: true })).IsEligible;
        }
        setTokenEligible(isEligible);
    };

    const fetchTokens = async () => {
        const { SmtpTokens } = await api(getTokens());
        setTokens(SmtpTokens);
    };

    useEffect(() => {
        if (!tokenEligible) {
            void withloadingTokenEligible(getSmtpTokenEligible());
            return;
        }
        void withLoadingTokens(fetchTokens());
    }, [submissionTokenAvailable, tokenEligible]);

    if (loadingOrganization || loadingTokenEligible) {
        return (
            <SettingsSection>
                <Loader />
            </SettingsSection>
        );
    }

    const mailProPlanName = PLAN_NAMES[PLANS.MAIL_PRO];
    const familyPlanName = PLAN_NAMES[PLANS.FAMILY];
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.BANNER,
        feature: MAIL_UPSELL_PATHS.SMTP_SUBMISSION,
        isSettings: true,
    });

    if (!tokenEligible) {
        const params = {
            topic: 'email delivery and spam',
            username: user.Email,
        };
        const createTicket = (
            <Href key="ticket" href={getSupportContactURL(params)}>{c('Link').t`create a ticket`}</Href>
        );
        if (isB2BOrganization) {
            return (
                <SettingsSection>
                    <SettingsParagraph learnMoreUrl={getKnowledgeBaseUrl('/smtp-submission')}>
                        {
                            // translator: full sentence will be: SMTP submission allows 3rd-party services or devices to send email through <Proton Mail> for your custom domain addresses. To request access, please <create a ticket> describing your use cases, what custom domains you would like to use, and expected hourly and daily email volumes.
                            c('Info')
                                .jt`SMTP submission allows 3rd-party services or devices to send email through ${MAIL_APP_NAME} for your custom domain addresses. To request access, please ${createTicket} describing your use cases, what custom domains you would like to use, and expected hourly and daily email volumes.`
                        }
                    </SettingsParagraph>
                </SettingsSection>
            );
        }
        return (
            <SettingsSection>
                <SettingsParagraph learnMoreUrl={getKnowledgeBaseUrl('/smtp-submission')}>
                    {c('Info')
                        .jt`SMTP submission allows 3rd-party services or devices to send email through ${MAIL_APP_NAME} for your custom domain addresses. This feature is only available to ${BRAND_NAME} for business users with custom domains.`}
                </SettingsParagraph>
                <UpgradeBanner audience={Audience.B2B} upsellPath={upsellRef}>
                    {c('new_plans: upgrade')
                        .t`Included with ${BRAND_NAME} for Business, ${familyPlanName} and ${mailProPlanName}.`}
                </UpgradeBanner>
            </SettingsSection>
        );
    }

    return (
        <SettingsSectionWide>
            <SettingsParagraph learnMoreUrl={getKnowledgeBaseUrl('/smtp-submission')}>
                {
                    // translator: full sentence will be: SMTP submission allows 3rd-party services or devices to send email through <Proton Mail> for your custom domain addresses. To use this feature, start by generating a new token.
                    c('Info')
                        .t`SMTP submission allows 3rd-party services or devices to send email through ${MAIL_APP_NAME} for your custom domain addresses. To use this feature, start by generating a new token.`
                }
            </SettingsParagraph>
            <div className="mb-4">
                <Button
                    data-testid="smtp-submission:generate-token"
                    disabled={loadingTokens}
                    onClick={openGenerateTokenModal}
                >{c('Action').t`Generate token`}</Button>
            </div>
            <Table className={clsx(!loadingTokens && hasTokens && 'simple-table--has-actions')}>
                <TableHeader cells={headers} />
                <TableBody colSpan={headersLength} loading={loadingTokens}>
                    {tokens.map((token) => {
                        const email = addressMap.get(token.AddressID) || '';
                        return (
                            <TableRow
                                key={token.SmtpTokenID}
                                cells={[
                                    <span title={token.Name} className="text-ellipsis max-w-full inline-block">
                                        {token.Name}
                                    </span>,
                                    <span title={email} className="text-ellipsis max-w-full inline-block">
                                        {email}
                                    </span>,
                                    showDetails &&
                                        format(fromUnixTime(token.CreateTime), 'PPp', { locale: dateLocale }),
                                    showDetails &&
                                        (token.LastUsedTime
                                            ? format(fromUnixTime(token.LastUsedTime), 'PPp', { locale: dateLocale })
                                            : '-'),
                                    <Button
                                        size="small"
                                        disabled={loadingTokens}
                                        onClick={() => confirmRemoveToken(token.SmtpTokenID)}
                                    >{c('Action').t`Delete`}</Button>,
                                ].filter(isTruthy)}
                            />
                        );
                    })}
                    {!loadingTokens && !hasTokens && (
                        <tr>
                            <td colSpan={headersLength} className="text-center">
                                <i>{c('TableRow').t`No SMTP tokens found`}</i>
                            </td>
                        </tr>
                    )}
                </TableBody>
            </Table>
            {renderConfirmModal ? (
                <Prompt
                    title={getDeleteText(tokenNameToRemove)}
                    buttons={[
                        <Button
                            color="danger"
                            data-testid="smtp-submission:confirm-deletion"
                            loading={loading}
                            onClick={() => withLoading(removeToken())}
                        >{c('Action').t`Delete`}</Button>,
                        <Button autoFocus onClick={() => setConfirmModalOpen(false)}>{c('Action').t`Cancel`}</Button>,
                    ]}
                    {...confirmModalProps}
                >
                    <p>{c('Warning')
                        .t`The device or service using this token will no longer be able to send email through ${MAIL_APP_NAME}.`}</p>
                </Prompt>
            ) : null}
            {renderGenerateTokenModal ? (
                <SMTPTokenModal
                    addresses={addresses}
                    onCreate={() => withLoadingTokens(fetchTokens())}
                    {...generateTokenModalProps}
                />
            ) : null}
        </SettingsSectionWide>
    );
};

export default SMTPSubmissionSection;
