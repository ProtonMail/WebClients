import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Row } from 'react-components';

const CardForm = ({ card: existingCard, onSubmit }) => {
    const countries = [];
    const months = [];
    const years = [];
    const [card, updateCard] = useState(existingCard);
    const handleChange = (key) => (event) => updateCard({ [key]: event.target.value });

    /*
    fullname: params.method.Details.Name,
                    number: '•••• •••• •••• ' + params.method.Details.Last4,
                    month: params.method.Details.ExpMonth,
                    year: params.method.Details.ExpYear,
                    cvc: '•••',
                    zip: params.method.Details.ZIP,
                    country: params.method.Details.Country
    */
    return (
        <>
            <Row>
                <Input onChange={handleChange('fullname')} placeholder={c('Placeholder').t`Name on Card`} re />
            </Row>
            <Row>
                <Input onChange={handleChange('number')} placeholder={c('Placeholder').t`Card Number`} maxlength="20" />
            </Row>
            <Row className="flex-autogrid">
                <Select onChange={handleChange('month')} className="flex-autogrid-item" options={months} />
                <Select onChange={handleChange('year')} className="flex-autogrid-item" options={years} />
                <Input onChange={handleChange('cvc')} className="flex-autogrid-item" placeholder={c('Placeholder').t`Security Code`} />
            </Row>
            <Row className="flex-autogrid">
                <Input onChange={handleChange('zip')} className="flex-autogrid-item" placeholder={c('Placeholder').t`ZIP/Postal Code`} />
                <Select onChange={handleChange('country')} className="flex-autogrid-item" options={countries}  />
            </Row>
        </>
    );
};

CardForm.propTypes = {
    card: PropTypes.object,
    onChange: PropTypes.func.isRequired
};

export default CardForm;