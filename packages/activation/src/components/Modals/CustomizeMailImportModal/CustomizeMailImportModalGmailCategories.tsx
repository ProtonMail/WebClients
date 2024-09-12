import { c } from 'ttag';

import { MailImportDestinationFolder } from '@proton/activation/src/interface';
import { Field, Icon, Label, Option, Row, SelectTwo, Tooltip } from '@proton/components';

interface Props {
    hasCategories: boolean;
    selectedCategoriesDest: MailImportDestinationFolder;
    handleChange: (val: MailImportDestinationFolder) => void;
}

const CustomizeMailImportModalGmailCategories = ({ hasCategories, selectedCategoriesDest, handleChange }: Props) => {
    const categoriesDestOptions = [
        { value: MailImportDestinationFolder.INBOX, title: c('Label').t`Move to Inbox` },
        { value: MailImportDestinationFolder.ARCHIVE, title: c('Label').t`Move to Archive` },
    ];

    return (
        <>
            {hasCategories && (
                <div className="mb-4 border-bottom items-center" data-testid="CustomizeModal:gmailCategories">
                    <Row>
                        <Label className="flex items-center">
                            {c('Label').t`Manage categories`}
                            <Tooltip
                                title={c('Tooltip')
                                    .t`Gmail automatically categorizes some emails like Social or Promotions. You can select where to import these emails to.`}
                            >
                                <Icon name="info-circle" className="ml-2" />
                            </Tooltip>
                        </Label>
                        <Field>
                            <SelectTwo<MailImportDestinationFolder>
                                value={selectedCategoriesDest}
                                onChange={({ value }) => {
                                    handleChange(value);
                                }}
                            >
                                {categoriesDestOptions.map((option) => (
                                    <Option
                                        key={option.value}
                                        value={option.value}
                                        title={option.title}
                                        selected={selectedCategoriesDest === option.value}
                                    />
                                ))}
                            </SelectTwo>
                        </Field>
                    </Row>
                </div>
            )}
        </>
    );
};

export default CustomizeMailImportModalGmailCategories;
