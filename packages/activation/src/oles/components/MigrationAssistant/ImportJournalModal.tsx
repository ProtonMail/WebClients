import { type FC, useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import type {
    ApiImporterOrganizationProductReport,
    ApiImporterOrganizationReport,
    ApiImporterOrganizationUser,
    ApiImporterProduct,
} from '@proton/activation/src/api/api.interface';
import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';

import type { CreateMigrationBatchError } from '../../thunk';

export type UserWithExtendedErrors = ApiImporterOrganizationUser & { transferErrors: CreateMigrationBatchError[] };

export const transferErrorUserFilter =
    (user: ApiImporterOrganizationUser) =>
    ({ metadata }: CreateMigrationBatchError) =>
        metadata.user.ID === user.ID;

type ReportModel = ApiImporterOrganizationReport & { Error: string | undefined };
type ProductReports = { [K in ApiImporterProduct]?: ReportModel };

const getSkippedMessageForProduct = (product: ApiImporterProduct, count: number) => {
    switch (product) {
        case 'Mail':
            return c('BOSS').ngettext(
                msgid`Skipped ${count} email due to incompatibilities`,
                `Skipped ${count} emails due to incompatibilities`,
                count
            );
        case 'Calendar':
            return c('BOSS').ngettext(
                msgid`Skipped ${count} event due to incompatibilities`,
                `Skipped ${count} events due to incompatibilities`,
                count
            );
        case 'Contacts':
            return c('BOSS').ngettext(
                msgid`Skipped ${count} contact due to incompatibilities`,
                `Skipped ${count} contacts due to incompatibilities`,
                count
            );
    }
};

const ImportJournalSection: FC<{
    product: ApiImporterProduct;
    report: ReportModel | undefined;
    className?: string;
}> = ({ product, report, className }) => {
    return (
        <div className={className}>
            <p className="m-0 text-semibold">{product}</p>

            {!report && <SkeletonLoader className="w-2/3" />}

            {report && report.Error && <p className="m-0 color-weak">{report.Error}</p>}

            {report && !report.Error && Boolean(report.Journal.length) && (
                <p className="m-0 color-weak">{getSkippedMessageForProduct(product, report.Journal.length ?? 0)}</p>
            )}

            {report && !report.Error && !Boolean(report.Journal.length) && (
                <p className="m-0 color-weak">{c('BOSS').t`Import completed successfully`}</p>
            )}
        </div>
    );
};

const ImportJournalModal: FC<{
    importerOrganizationId: string;
    user: UserWithExtendedErrors;
    modalProps: ModalStateProps;
}> = ({ importerOrganizationId, user, modalProps }) => {
    const api = useSilentApi();
    const { transferErrors } = user;
    const [productReports, setProductReports] = useState<ProductReports>();

    const fallbackError = c('BOSS').t`No error details available. Please contact customer support for more information`;
    const importedProducts: ApiImporterProduct[] = ['Mail', 'Contacts', 'Calendar'];

    useEffect(() => {
        void (async () => {
            if (transferErrors.length) {
                return;
            }

            const reports = !user.ImporterOrganizationUser
                ? []
                : await api<{ Reports: ApiImporterOrganizationProductReport[] }>({
                      method: 'GET',
                      url: `importer/v1/organizations/${importerOrganizationId}/reports`,
                      params: {
                          UserId: user.ImporterOrganizationUser!.UserID,
                      },
                  })
                      .then(({ Reports }) => Reports)
                      .catch(() => []);

            const importedProducts: ApiImporterProduct[] = ['Mail', 'Contacts', 'Calendar'];

            const productReports = importedProducts.reduce((acc: ProductReports, p) => {
                const productReport = reports.find((r) => r.Product === p)?.Report;
                const productStatus = user.ImporterOrganizationUser?.ProductStatuses.find((s) => s.Product === p);

                if (!productReport && !productStatus) {
                    return acc;
                }

                acc[p] = {
                    State: productReport?.State ?? productStatus?.State ?? 0,
                    TotalSize: productReport?.TotalSize ?? 0,
                    Journal: productReport?.Journal ?? [],
                    Error: productStatus?.Error,
                };

                return acc;
            }, {} as ProductReports);

            setProductReports(productReports);
        })();
    }, []);

    return (
        <ModalTwo {...modalProps}>
            <ModalTwoHeader title={c('BOSS').t`Import details`} subline={`${user.AdminSetName} (${user.Email})`} />
            <ModalTwoContent>
                {transferErrors.length
                    ? transferErrors.map(({ error }, i) => (
                          <div key={i} className="mb-4">
                              <p className="m-0 color-weak">{error.message || error.name || fallbackError}</p>
                          </div>
                      ))
                    : importedProducts.map((p) => (
                          <ImportJournalSection key={p} className="mb-4" product={p} report={productReports?.[p]} />
                      ))}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={modalProps.onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ImportJournalModal;
