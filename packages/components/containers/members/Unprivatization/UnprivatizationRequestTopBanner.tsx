import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { memberThunk } from '@proton/account/member';
import { getPendingUnprivatizationRequest } from '@proton/account/member/actions';
import { InlineLinkButton } from '@proton/atoms';
import { useDispatch } from '@proton/redux-shared-store';
import type { Member } from '@proton/shared/lib/interfaces';
import type { ParsedUnprivatizationData } from '@proton/shared/lib/keys';

import useModalState from '../../../components/modalTwo/useModalState';
import TopBanner from '../../topBanners/TopBanner';
import MemberUnprivatizationModal from './MemberUnprivatizationModal';

const UnprivatizationRequestTopBanner = () => {
    const dispatch = useDispatch();
    const [data, setData] = useState<{
        member: Member;
        orgName: string;
        parsedUnprivatizationData: ParsedUnprivatizationData;
    } | null>(null);

    const [modalProps, setModal, renderModal] = useModalState();

    useEffect(() => {
        const initialSearchParams = new URLSearchParams(window.location.search);
        const run = async () => {
            const member = await dispatch(memberThunk());
            const result = await dispatch(getPendingUnprivatizationRequest({ member }));
            if (result) {
                const { organization, parsedUnprivatizationData } = result;
                setData({ member, orgName: organization.Name || '', parsedUnprivatizationData });

                if (initialSearchParams.get('action') === 'enable-admin-access') {
                    setModal(true);
                }
            }
        };
        run();
    }, []);

    if (!data) {
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
                        data-testid="unprivatization:request-button"
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
