import { c } from 'ttag';

import { TableCell, Button, Icon } from '../../../components';

interface Props {
    disabledPrevious: boolean;
    disabledNext: boolean;
    onPrevious: () => void;
    onNext: () => void;
}

const ImportCsvTableHeader = ({ disabledPrevious = true, disabledNext = true, onPrevious, onNext, ...rest }: Props) => {
    return (
        <thead {...rest}>
            <tr>
                <TableCell type="header" className="w15 text-center">
                    {c('TableHeader').t`Import`}
                </TableCell>
                <TableCell type="header" className="text-center">{c('TableHeader').t`CSV field`}</TableCell>
                <TableCell type="header" className="text-center">{c('TableHeader').t`vCard field`}</TableCell>
                <TableCell type="header" className="w30 text-center">
                    <div className="inline-flex">
                        <span className="flex-item-centered-vert mr0-5">{c('TableHeader').t`Values`}</span>
                        <span className="flex flex-nowrap">
                            <Button icon disabled={disabledPrevious} onClick={onPrevious}>
                                <Icon name="angle-down" className="flex-item-noshrink rotateZ-90" />
                            </Button>
                            <Button icon disabled={disabledNext} onClick={onNext}>
                                <Icon name="angle-down" className="flex-item-noshrink rotateZ-270" />
                            </Button>
                        </span>
                    </div>
                </TableCell>
            </tr>
        </thead>
    );
};

export default ImportCsvTableHeader;
