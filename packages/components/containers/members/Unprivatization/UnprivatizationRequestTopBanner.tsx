import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { getPendingUnprivatizationRequest } from '@proton/account/member/actions';
import { InlineLinkButton } from '@proton/atoms';
import useVerifyOutboundPublicKeys from '@proton/components/containers/keyTransparency/useVerifyOutboundPublicKeys';
import { useDispatch } from '@proton/redux-shared-store';
import { type Member } from '@proton/shared/lib/interfaces';
import { type ParsedUnprivatizationData } from '@proton/shared/lib/keys';
import useFlag from '@proton/unleash/useFlag';

import useModalState from '../../../components/modalTwo/useModalState';
import TopBanner from '../../topBanners/TopBanner';
import MemberUnprivatizationModal from './MemberUnprivatizationModal';

const UnprivatizationRequestTopBanner = () => {
    const dispatch = useDispatch();
    const unprivatizeMemberEnabled = useFlag('UnprivatizeMember');
    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();
    const [data, setData] = useState<{
        member: Member;
        orgName: string;
        parsedUnprivatizationData: ParsedUnprivatizationData;
    } | null>(null);

    const [modalProps, setModal, renderModal] = useModalState();

    useEffect(() => {
        const run = async () => {
            const result = await dispatch(getPendingUnprivatizationRequest({ verifyOutboundPublicKeys }));
            if (result) {
                const { member, organization, parsedUnprivatizationData } = result;
                setData({ member, orgName: organization.Name || '', parsedUnprivatizationData });
            }
        };
        if (unprivatizeMemberEnabled) {
            run();
        }
    }, []);

    if (!data || !unprivatizeMemberEnabled) {
        return null;
    }

    const { orgName, member, parsedUnprivatizationData } = data;

    return (
        <>
            {orgName !== undefined && (
                <TopBanner className="bg-info">
                    {c('unprivatization')
                        .t`An administrator of ${orgName} wants to enable admin access for your account.`}{' '}
                    <InlineLinkButton
                        key="button"
                        onClick={() => {
                            setModal(true);
                        }}
                    >
                        {c('unprivatization').t`View request`}
                    </InlineLinkButton>
                </TopBanner>
            )}
            {renderModal && (
                <MemberUnprivatizationModal
                    member={member}
                    orgName={orgName}
                    parsedUnprivatizationData={parsedUnprivatizationData}
                    onChange={() => {
                        setData(null);
                    }}
                    {...modalProps}
                />
            )}
        </>
    );
};

export default UnprivatizationRequestTopBanner;
