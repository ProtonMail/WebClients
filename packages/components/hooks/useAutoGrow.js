import { useState, useCallback } from 'react';

const useAutoGrow = ({ maxRows = 5, minRows = 1, autoGrow = false }) => {
    const [rows, setRows] = useState(minRows);

    const updateTextArea = useCallback(
        (event) => {
            const textAreaLineHeight = +getComputedStyle(event.target).lineHeight.replace('px', '');

            const previousRows = event.target.rows;

            // Reset rows so we can calculate calculate currentRows correctly
            event.target.rows = minRows;

            const currentRows = Math.min(
                maxRows,
                Math.max(minRows, ~~(event.target.scrollHeight / textAreaLineHeight))
            );

            // Set rows attribute directly because React won't update it as it stayed the same
            if (currentRows === previousRows) {
                event.target.rows = currentRows;
            }

            setRows(currentRows);
        },
        [minRows, maxRows]
    );

    if (!autoGrow) {
        return {
            rows: maxRows
        };
    }

    return { rows, updateTextArea };
};

export default useAutoGrow;
