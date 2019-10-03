import React from 'react';
import PropTypes from 'prop-types';

// eslint-disable-next-line
const SignupContainer = ({ match, history, onLogin, stopRedirect }) => {
    return <>SignupContainer</>;
};

SignupContainer.propTypes = {
    stopRedirect: PropTypes.func.isRequired,
    onLogin: PropTypes.func.isRequired,
    match: PropTypes.shape({
        params: PropTypes.shape({
            step: PropTypes.string
        })
    }).isRequired,
    history: PropTypes.shape({
        push: PropTypes.func.isRequired,
        location: PropTypes.shape({
            search: PropTypes.string.isRequired,
            state: PropTypes.oneOfType([
                PropTypes.shape({
                    selector: PropTypes.string.isRequired,
                    token: PropTypes.string.isRequired
                }),
                PropTypes.shape({
                    Coupon: PropTypes.shape({ Code: PropTypes.string })
                })
            ])
        }).isRequired
    }).isRequired
};

export default SignupContainer;
