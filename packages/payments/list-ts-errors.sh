
yarn check-types | grep -E "\.(ts|tsx)" | sed -E 's/\([0-9]+,[0-9]+\).*//' | sort -u