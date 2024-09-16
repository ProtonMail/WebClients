import { type FC, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwoContent, ModalTwoFooter } from '@proton/components';
import { ExpirationTimeSelect, ExpireTime } from '@proton/pass/components/Form/Field/Custom/ExpirationTimeSelect';
import { MaxReadsToggleInput } from '@proton/pass/components/Form/Field/Custom/MaxReadsToggleInput';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { secureLinkCreate } from '@proton/pass/store/actions';
import { secureLinkCreateRequest } from '@proton/pass/store/actions/requests';
import type { SecureLink, SecureLinkOptions, UniqueItem } from '@proton/pass/types';

type Props = UniqueItem & { onLinkGenerated: (data: SecureLink) => void };

export const SecureLinkGenerate: FC<Props> = ({ shareId, itemId, onLinkGenerated }) => {
    const [{ expirationTime, maxReadCount }, setOptions] = useState<SecureLinkOptions>({
        expirationTime: ExpireTime.OneWeek,
        maxReadCount: null,
    });

    const { dispatch, loading } = useRequest(secureLinkCreate, {
        initialRequestId: secureLinkCreateRequest(shareId, itemId),
        onSuccess: ({ data }) => onLinkGenerated(data),
    });

    const generateSecureLink = () => dispatch({ itemId, shareId, expirationTime, maxReadCount });

    return (
        <>
            <ModalTwoContent>
                <ExpirationTimeSelect
                    onChange={(expirationTime) => setOptions((options) => ({ ...options, expirationTime }))}
                    disabled={loading}
                    value={expirationTime}
                />
                <hr className="mt-4" />
                <MaxReadsToggleInput
                    disabled={loading}
                    value={maxReadCount}
                    onChange={(maxReadCount) => setOptions((options) => ({ ...options, maxReadCount }))}
                    onPressEnter={generateSecureLink}
                />
            </ModalTwoContent>

            <ModalTwoFooter className="flex flex-column items-stretch text-center">
                <Button
                    className="max-w-full"
                    color="norm"
                    disabled={loading}
                    loading={loading}
                    pill
                    shape="solid"
                    size="large"
                    onClick={generateSecureLink}
                >
                    <span className="text-ellipsis">
                        {loading ? c('Action').t`Generating secure link...` : c('Action').t`Generate secure link`}
                    </span>
                </Button>
            </ModalTwoFooter>
        </>
    );
};
