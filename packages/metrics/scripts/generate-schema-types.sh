#!/bin/bash

# Read globs from file and execute json2ts for each
while IFS= read -r glob; do
    # Skip empty lines and comments
    [[ -z "$glob" || "$glob" =~ ^[[:space:]]*# ]] && continue
    
    echo "Processing glob: $glob"
    json2ts -i "$glob" -o types/ --no-additionalProperties
    
    # Check if the command succeeded
    if [ $? -ne 0 ]; then
        echo "Error processing glob: $glob"
        exit 1
    fi
done < "$(dirname "$0")/../schema-globs.txt"
