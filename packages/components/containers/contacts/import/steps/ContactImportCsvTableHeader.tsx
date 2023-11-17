import { c } from 'ttag';

import { Button } from '@proton/atoms';

import { Icon, TableCell } from '../../../../components';

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
                        <span className="flex-item-centered-vert mr-2">{c('TableHeader').t`Values`}</span>
                        <span className="flex flex-nowrap">
                            <Button icon disabled={disabledPrevious} onClick={onPrevious}>
                                <Icon name="chevron-left" className="shrink-0" />
                            </Button>
                            <Button icon disabled={disabledNext} onClick={onNext}>
                                <Icon name="chevron-right" className="shrink-0" />
                            </Button>
                        </span>
                    </div>
                </TableCell>
            </tr>
        </thead>
    );
};

export default ContactImportCsvTableHeader;
