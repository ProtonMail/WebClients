import { useMemo } from 'react';

import { InlineLinkButton } from '@proton/atoms';
import { useModalStateObject } from '@proton/components';
import { usePassAliasesContext } from '@proton/components/components/drawer/views/SecurityCenter/PassAliases/PassAliasesProvider';
import CreatePassAliasesForm from '@proton/components/components/drawer/views/SecurityCenter/PassAliases/modals/CreatePassAliasesForm/CreatePassAliasesForm';
import PassAliasesUpsellModal from '@proton/components/components/drawer/views/SecurityCenter/PassAliases/modals/PassAliasesUpsellModal';
import { useAuthentication } from '@proton/components/hooks';
import { encodeFilters } from '@proton/pass/components/Navigation/routing';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';

import { TipActionType } from 'proton-mail/models/tip';

import useProtonTipsTelemetry from './useProtonTipsTelemetry';

interface Props {
    ctaText: string;
}

const PassAliasTipCTA = ({ ctaText }: Props) => {
    const { hasReachedAliasesCountLimit } = usePassAliasesContext();
    const { sendCTAButtonClickedReport } = useProtonTipsTelemetry();

    const authentication = useAuthentication();

    const passAliasesURL = useMemo(() => {
        const search = new URLSearchParams();
        search.set(
            'filters',
            encodeFilters({
                type: 'alias',
                sort: 'recent',
                selectedShareId: null,
                search: '',
            })
        );

        return getAppHref(`?${search.toString()}`, APPS.PROTONPASS, authentication?.getLocalID?.());
    }, []);

    const passAliasesUpsellModal = useModalStateObject();
    const createPassAliasesForm = useModalStateObject();

    const onClick = () => {
        if (hasReachedAliasesCountLimit) {
            passAliasesUpsellModal.openModal(true);
        } else {
            createPassAliasesForm.openModal(true);
        }
        sendCTAButtonClickedReport(TipActionType.CreateAlias);
    };

    return (
        <>
            {passAliasesUpsellModal.render && (
                <PassAliasesUpsellModal
                    modalProps={passAliasesUpsellModal.modalProps}
                    upsellComponent={UPSELL_COMPONENT.TIP}
                />
            )}
            {createPassAliasesForm.render && (
                <CreatePassAliasesForm
                    onSubmit={() => {
                        createPassAliasesForm.openModal(false);
                    }}
                    passAliasesURL={passAliasesURL}
                    modalProps={createPassAliasesForm.modalProps}
                />
            )}
            <InlineLinkButton onClick={onClick}>{ctaText}</InlineLinkButton>
        </>
    );
};

export default PassAliasTipCTA;
