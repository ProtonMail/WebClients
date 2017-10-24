#!/bin/bash

ANDROID='android-chrome-'
declare -a ANDROID_SIZE=(36 48 72 96 144 192)
IOS='apple-touch-icon-'
declare -a IOS_SIZE=(57 60 72 76 114 120 144 152 180)
FAVICON='favicon-'
declare -a FAVICON_SIZE=(16 32 96 194)

if [ $1 = '--help' ]
then
    echo
    echo "=================   HELP   ===================="
    echo
    echo "./tasks/createFavicon.sh <path to favicon.png>"
    echo 'ex: ./tasks/createFavicon.sh /tmp/icon.png'
    echo
    echo "==============================================="
    echo

else

    path_img=$1
    filename_img=$(basename "$path_img")
    output_dir=$(pwd)"/src/assets/favicons/";

    CUSTOM_ICON_SRC="$output_dir$(echo 'android-chrome-192x192.png')"
    declare -a CUSTOM_ICON_OUTPUT=('apple-touch-icon.png' 'apple-touch-icon-precomposed.png');

    function build() {
        echo "- build" $1
        for size in ${@:2};
        do
            output_file="$output_dir$1$size$(echo 'x'$size).png"
            convert $path_img -resize $size $output_file
        done
    }

    build $ANDROID "${ANDROID_SIZE[@]}"
    build $IOS "${IOS_SIZE[@]}"
    build $FAVICON "${FAVICON_SIZE[@]}"

    echo "- build custom icon"
    for output in "${CUSTOM_ICON_OUTPUT[@]}";
    do
        output_custom="$output_dir$(echo $output)"
        cp $CUSTOM_ICON_SRC $output_custom;
    done

    favicon="$output_dir$(echo 'favicon.ico')";
    echo "- build favicon.ico"
    convert $path_img -define icon:auto-resize=32,16 $favicon

    echo
    echo "✓ Done"

fi
