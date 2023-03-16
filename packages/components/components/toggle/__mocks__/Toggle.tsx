// There is a strange behavior of the "checked" attribute of <input type="checkbox" />. It's not updated like everything
// else when "checked" boolean variable is changed. This mock works around the problem.
export default jest.fn().mockImplementation(({ id, checked, onChange, ...rest }) => {
    return (
        <span id={id} onClick={() => onChange(!checked)} {...rest}>
            {checked ? 'CHECKED' : ''}
        </span>
    );
});
