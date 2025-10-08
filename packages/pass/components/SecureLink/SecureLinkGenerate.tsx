import { type FC, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import { ExpirationTimeSelect, ExpireTime } from '@proton/pass/components/Form/Field/Custom/ExpirationTimeSelect';
import { MaxReadsToggleInput } from '@proton/pass/components/Form/Field/Custom/MaxReadsToggleInput';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { secureLinkCreate } from '@proton/pass/store/actions';
import type { SecureLink, SecureLinkOptions, UniqueItem } from '@proton/pass/types';

type Props = UniqueItem & { onLinkGenerated: (data: SecureLink) => void };
type SecureLinkState = Omit<SecureLinkOptions, 'linkKeyEncryptedWithItemKey'>;

const getDefaultSecureLinkState = (): SecureLinkState => ({
    expirationTime: ExpireTime.OneWeek,
    maxReadCount: null,
});

export const SecureLinkGenerate: FC<Props> = ({ shareId, itemId, onLinkGenerated }) => {
    const [{ expirationTime, maxReadCount }, setOptions] = useState(getDefaultSecureLinkState);

    const { dispatch, loading } = useRequest(secureLinkCreate, {
        initial: { shareId, itemId },
        onSuccess: onLinkGenerated,
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
