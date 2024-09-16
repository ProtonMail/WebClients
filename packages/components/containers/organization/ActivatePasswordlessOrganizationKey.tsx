import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import type { AcceptOrganizationKeyInvitePayload } from '@proton/account';
import { acceptOrganizationKeyInvite, prepareAcceptOrganizationKeyInvite } from '@proton/account';
import { Button, Card, CircleLoader } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import type { ModalProps } from '../../components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../components';
import { useApi, useErrorHandler, useNotifications, useOrganization, useOrganizationKey } from '../../hooks';
import useVerifyOutboundPublicKeys from '../keyTransparency/useVerifyOutboundPublicKeys';

interface Props extends Omit<ModalProps, 'buttons' | 'title' | 'children'> {
    onResetKeys?: () => void;
}

const ActivatePasswordlessOrganizationKey = ({ onResetKeys, ...rest }: Props) => {
    const [organizationKey] = useOrganizationKey();
    const [organization] = useOrganization();
    const organizationName = organization?.Name || '';
    const adminEmail = organizationKey?.Key.SignatureAddress || '';
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const errorHandler = useErrorHandler();
    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();
    const [payload, setPayload] = useState<AcceptOrganizationKeyInvitePayload | null>(null);
    const silentApi = getSilentApi(useApi());

    const [loading, withLoading] = useLoading();
    const [loadingInit, withLoadingInit] = useLoading(true);

    useEffect(() => {
        withLoadingInit(
            dispatch(
                prepareAcceptOrganizationKeyInvite({
                    api: silentApi,
                    adminEmail,
                    verifyOutboundPublicKeys,
                })
            )
                .then(setPayload)
                .catch((e) => {
                    errorHandler(e);
                    rest.onClose?.();
                })
        );
    }, []);

    const handleSubmit = async () => {
        if (payload?.state === 'verified') {
            try {
                await dispatch(acceptOrganizationKeyInvite({ api: silentApi, payload }));
                createNotification({ text: c('passwordless').t`Organization key activated` });
                rest.onClose?.();
            } catch (e: any) {
                errorHandler(e);
            }
        } else {
        }
    };

    const handleClose = loading ? noop : rest.onClose;

    return (
        <ModalTwo open {...rest} onClose={handleClose}>
            <ModalTwoHeader title={c('Title').t`Activate organization key`} {...rest} />
            <ModalTwoContent>
                {(() => {
                    if (payload === null || loadingInit) {
                        return (
                            <div className="text-center">
                                <CircleLoader />
                            </div>
                        );
                    }
                    const intro = (
                        <div className="text-break mb-2">
                            {getBoldFormattedText(
                                c('passwordless')
                                    .t`You have been made administrator of the organization **${organizationName}** by`
                            )}
                        </div>
                    );
                    const getCard = (icon: ReactNode) => {
                        return (
                            <Card rounded className="text-break">
                                <div className="flex justify-space-between gap-1">
                                    <div className="flex-1">{adminEmail}</div>
                                    <div className="shrink-0">{icon}</div>
                                </div>
                            </Card>
                        );
                    };

                    if (payload.state === 'verified') {
                        return (
                            <>
                                {intro}
                                {getCard(<Icon name="checkmark-circle-filled" className="color-success" />)}
                                <div className="mt-2 color-weak">
                                    {c('passwordless')
                                        .t`We have verified the authenticity of this sender and invitation.`}
                                    <br />
                                    <br />
                                    {c('passwordless')
                                        .t`To enable administrator rights on your account, activate the organization key.`}
                                </div>
                            </>
                        );
                    }

                    return (
                        <>
                            {intro}
                            {getCard(<Icon name="info-circle-filled" className="color-danger" />)}
                            <div className="mt-2 color-danger">
                                {c('passwordless')
                                    .t`We couldn't verify the security of this sender's address key. Sometimes there is a delay in updating the sender's information. Try again later. If you do not trust the validity of this invitation or sender, contact ${BRAND_NAME} Customer Support.`}
                            </div>
                        </>
                    );
                })()}
            </ModalTwoContent>
            <ModalTwoFooter>
                {payload === null || payload.state === 'verified' ? (
                    <>
                        <Button disabled={loading} onClick={handleClose}>
                            {c('Action').t`Cancel`}
                        </Button>
                        <Button
                            color="norm"
                            loading={loading}
                            onClick={() => {
                                withLoading(handleSubmit());
                            }}
                        >
                            {c('Action').t`Activate`}
                        </Button>
                    </>
                ) : (
                    <>
                        <div />
                        <Button color="norm" disabled={loading} onClick={handleClose}>
                            {c('Action').t`Got it`}
                        </Button>
                    </>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ActivatePasswordlessOrganizationKey;
