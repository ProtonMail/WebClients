import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import TableCell from '@proton/components/components/table/TableCell';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';

interface Props {
    disabledPrevious: boolean;
    disabledNext: boolean;
    onPrevious: () => void;
    onNext: () => void;
}

const ContactImportCsvTableHeader = ({
    disabledPrevious = true,
    disabledNext = true,
    onPrevious,
    onNext,
    ...rest
}: Props) => {
    return (
        <thead {...rest}>
            <tr>
                <TableCell type="header" className="w-1/6 text-center">
                    {c('TableHeader').t`Import`}
                </TableCell>
                <TableCell type="header" className="text-center">{c('TableHeader').t`CSV field`}</TableCell>
                <TableCell type="header" className="text-center">{c('TableHeader').t`vCard field`}</TableCell>
                <TableCell type="header" className="w-3/10 text-center">
                    <div className="inline-flex">
                        <span className="self-center my-auto mr-2">{c('TableHeader').t`Values`}</span>
                        <span className="flex flex-nowrap">
                            <Button icon disabled={disabledPrevious} onClick={onPrevious}>
                                <IcChevronLeft className="shrink-0" />
                            </Button>
                            <Button icon disabled={disabledNext} onClick={onNext}>
                                <IcChevronRight className="shrink-0" />
                            </Button>
                        </span>
                    </div>
                </TableCell>
            </tr>
        </thead>
    );
};

export default ContactImportCsvTableHeader;
