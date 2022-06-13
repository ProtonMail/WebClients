# Release beta 29 - 2022-06-22

## Fixed

-   Automatically handle small connection interruptions
-   Improved automatic pausing
-   Better duplicity detection after failed upload
-   Fix download and upload at the same time in Brave

# Introducing Proton's refreshed look.

# Release beta 28 - 2022-05-25

As we continue to make privacy accessible to everyone, we've updated our apps to provide you with an even better experience with our services.

Proton - Privacy by default.

# Release beta 27 - 2022-05-04

## Added

-   Enable abuse form

## Improved

-   Show folder size when downloading helping users estimate time and storage requirements
-   Show folder/file name in tab title to help users find the right tab quickly

## Fixed

-   Improved messaging for download failures caused when user edits folder during download
-   Fixed issues related to users unable to edit links after changing default addresses

# Release beta 26 - 2022-04-06

## Added

-   Transfer Manager includes uploading folders
-   Signature validation is reported with option to continue

## Improved

-   Upload performance of many small files
-   UI tweaks

## Fixed

-   Downloaded zip archive can be extracted using Windows built-in zip extractor
-   Allowed space in custom password for shared link
-   Validation of custom password for shared link
-   Stuck downloads in initial or pending state
-   Loading thumbnails

# Release beta 25 - 2022-03-09

## Added

-   Ability to sort files within trash section
-   Pausing uploads upon network issue

## Improved

-   Improved overall performance of the application

## Fixed

-   Canceling all uploads caused error message to appear at times
-   Ability to upload files/folders from within the context menu
-   Added missing translations
-   Uploading huge files

# Release beta 24 - 2022-01-25

## Added

-   Folder tree view for quicker navigation through your Drive
-   Ability to view number of accesses to the folder details

## Fixed

-   Missing copy link for folders within contextual menu

# Release beta 23 - 2022-01-05

## Improved

-   Sharing folders via link
-   Downloading folders via shared link
-   Improved behaviour of the checkboxes on list view
-   Removed unavailable actions from the contextual menu
-   Updated icons in contextual menu

## Fixed

-   Breadcrumb chevrons sizing

# Release beta 22 - 2021-11-24

## Improved

-   List view design tweaks
-   Grid view design tweaks
-   New navigation interactions

## Fixed

-   Folder upload via drag&drop on Firefox

# Release beta 21 - 2021-10-27

## Improved

-   Sorting can be done from Shared section
-   New media player for video files up to 100 MB
-   Design tweaks on files icons
-   Allow to delete locked files

## Fixed

-   Issue with uploads, page scrolling on Firefox mobile
-   Issue on folders being skipped during upload

# Release beta 20 - 2021-10-06

This release is focused on improvements of existing features.

## Improved

-   Upload performance
-   General thumbnail performance
-   Thumbnails are now visible in trash and shared sections
-   Transfer Manager sorting
-   UI tweaks

## Fixed

-   Issue with uploads of multiple large files
-   All uploads are now properly handled in bulk actions
-   Upload % done showed wrong information
-   Token expiration error when download was taking more than 30 min
-   Transfer manager would not behave properly in some situations
-   Undue 404 errors
-   Missing security headers on /sw/ping

# Release beta 19 - 2021-09-01

Just in time for the new season, this latest release improves how you secure and interact with your data. We give you more control when uploading and downloading multiple files and also made a number of fixes and UX improvements to enhance the everyday convenience of using Proton Drive.

## Fixed

-   Space trimming in file and folder names fixed and made consistent
-   Empty pages placeholers aligned
-   The top message bar width issue fixed when names happen to be very long and contain no spaces

## Added

-   Bulk transfers management: pause, resume, cancel, retry or review failed ones in Transfer manager
-   Share button added in Grid view when mouse over a file event happens
-   Thumbnail of shared image file will be displayed when in download page
-   Grid mode available in Shared and Trash sections

# Release beta 18 - 2021-07-29

## Fixed

-   Uploading files with different Unicode character in the name is prevented
-   Some interface fixes (colors, tooltip text tweaks; error messages…)

## Added

-   Some performance improvements (better HTTP2 support)
-   Thumbnails are now visible in list view layout
-   Downloading multiple files now generates a zip archive that keeps the original folder structure

# Release beta 17 - 2021-07-14

With this Proton Drive update we give you more control over how you want to handle duplicates when uploading. Scroll down for other fixes and improvements.

## Fixed

-   User is now presented with explanatory message and option to download, when previewing a PDF file through Brave's Private Window with TOR
-   Confirmation modal is displayed when user is trying to close "Share via link" modal by pressing Escape button

## Added

-   Choice how to handle duplicate files when uploading: Upload and rename, Overwrite, or Skip
-   For duplicate folders on upload, there is additional choice to merge contents
-   New file type icons
-   Download and Preview files in Trash
-   User can now remove a custom password and use the same URL to share a file

# Release beta 16 - 2021-06-15

This time we Proton Drive team brings you updates to the Shared section, improved upload visuals and many more improvements which will enlighten your day using Proton Beta

## Fixed

-   Sorting files or folders selection is now highlighted
-   Restarting a download in case of connection issue, will resume already downloaded progress
-   Deleted time in Trash is now calculated and displayed correctly
-   When user clicks on Name column for first time, sorting will happen from A to Z

## Added

-   The Shared section will now have Preview, Download, Rename, and View details functionality for the files shared (via toolbar or context menu)
-   Updated the drag & drop upload visuals
-   Additional settings row in Share via link modal is now fully clickable
-   Users can click on Shared icon to open Sharing options modal in My files view
-   Updated the default sorting of files (now it's by modified date, Newest to oldest)
-   Added Download and Share buttons to the Preview mode
-   Added number of accesses to file Details screen for when a file is shared

# Release beta 15 - 2021-05-26

With this product iteration we give you ability to view thumbnails (for new uploads only) in Grid layout mode.

## Fixed

-   Adding a custom password does not change the generated secure sharing link
-   Removed Proton promo banner from download a file shared page
-   Updated top bar link when re-activating keys after a password reset

## Added

-   View thumbnails of supported image type files in Grid layout

# Release beta 14 - 2021-05-05

Our team has been hard at work smashing bugs and improving experience using Proton Drive.

## Fixed

-   Alignment of file name in Details modal
-   Drag & drop when moving item over breadcrumbs will not break the structure
-   Layout issue in Transfer manager when transfer speed happens to be high

## Added

-   A new column "# of accesses" in the Shared section, to display number of accesses of the shared link
-   Sharing modal has seen copy and layout updates
-   User can now start sharing a file by pressing a button in the toolbar, or on mouse-over event of a file

# Release beta 13 - 2021-04-02

After a password reset you can choose to recover access to your previously encrypted files stored on your Proton Drive. Also, we are adding support of 5 new languages together with sharing experience improvements.

## Fixed

-   Copy password button is now disabled if the field is empty
-   Made improvements when downloading large files with custom password

## Added

-   Access recovery process to the previously encrypted files after a password reset
-   5 new languages: Croatian, Traditional Chinese, Greek, Kabyle, and Spanish (Spain)

# Release beta 12 - 2021-03-10

We have further improved sharing a link user experience.

## Fixed

-   Share with link modal layout is now collapsed by default in order to provide less distractions for users who want to generate a link and copy it
-   Loosened restrictions when using a custom password for a shared link
-   Long file and folder names now conveniently shortened and gives users full name on tooltip

## Added

-   User can now set expiration date of a shared link by choosing date & time from calendar component

# Release beta 11 - 2021-03-03

Among other improvements, this update provides a more convenient way to manage your shared links.

## Fixed

-   "End-to-end Encryption by Proton" label removed in order to streamline the look & feel across the Proton products family

## Added

-   A new section to overview your shared links. Edit, delete or create a new shared link easily without leaving the section
-   Storage space quota is now visible at the left bottom of the side menu bar

# Release beta 10 - 2021-02-24

## Fixed

-   Downloading of large files (1GB or more) should be more stable, due to the implemented pagination

# Release beta 9 - 2021-02-10

Improvements and fixes to make your everyday experience with Proton Drive better.

## Fixed

-   Password protection layout and copy updates
-   The Proton security label updated

## Added

-   Transfer progress in the transfer manager is now displayed in parentheses
-   View file details modal for multiple files selected: number of them, and the total size
-   Delete permanently from trash icon is now aligned with the one in ProtonMail
-   Improved downloading process by implementing a retry

# Release beta 8 - 2021-01-13

With this update we bring you more convenience by remembering which layout you chose to browse your files. Also, numerous bug fixes and improvements.

## Fixed

-   Long file name is displayed fully on the download page
-   Invisible and breaking characters can no longer be entered into a file name
-   Image rendering when in zoomed in mode
-   SVG file type detection

## Added

-   Layout (Grid or List), and column used for sorting are remembered

# Release beta 7 - 2020-12-17

In order to provide full control and comfort for our initial waves of Beta users, we have opted in to set the shared links to never expire by default. However, user can change this option and set number of days for a shared link to expire.

## Added

-   By default, shared links will never expire

# Release beta 6 - 2020-12-15

More improvements and fixes coming your way before the holiday season kicks in.

## Fixed

-   Improved the upload process (block retries)
-   You can now pause queued file in Transfer manager
-   Changed "No preview available" placeholder image to better convey the situation
-   Other minor fixes

## Added

-   Black Friday promo replaced with a regular promo text
-   og:image and og:description texts added when sharing a link to Proton Drive

# Release beta 5 - 2020-12-08

We have updated share with link feature with easier to grasp labels and more convenient layout to set password. Further improved uploading experience by chasing down couple of bugs and increasing upload success rating. Next, we have made file type recognition better by reading its header bytes. Read on for the full list of improvements below, and get in touch with us if you have feedback to share please.

## Fixed

-   When uploading, naming restrictions updated to avoid errors and name collisions:
    -   Only reject files that are names `.`, `..` or have `/` in their name
    -   \ and / symbols not be allowed
-   User can now open image files downloaded via shared link with Firefox mobile browser too
-   Upload or download progress rate displayed correctly in the transfer manager header
-   File and folder names are selected when rename modal is opened
-   Pausing one transfer will not resume another

## Added

-   For share with link we have updated: toolbar button and context menu labels, new dialog explanatory text and set password layout
-   Upload URL request retries for more successful operation
-   Download URL request retries for more successful operation (for regular downloads, excluding shared links)
-   Determine file mime-type from file header bytes, so that we can more reliably determine file mime-type and only use extension as a fallback
-   Improved file preview process when previewing a lot of files
-   Added tooltips for My files and Trash sections

# Release beta 4 - 2020-11-25

The Proton Drive beta now lets you share files with end-to-end encrypted URL links. ​ In addition, we have been improving the upload experience.

## Fixed

-   Upload progress goes above 100% when an upload fails
-   Block upload not being retried
-   Space at the end shows incorrect error when uploading

## Added

-   Share a secure link publicly
-   Use a pre-generated password for the secure link, or change it
-   Change the default expiration date (90 days) of a secure link

# Release beta 3 - 2020-11-11

We have been working on adding new functionality to ProtonDrive, as well as listening to your feedback to address frictions you've been having.

We resolved large file uploading errors by curing the memory leaks, and before uploading hundreds of files, user will get a warning message. This is to improve the uploading files experience, but it does not stop here, as we will continue iterating and building better product going forward.

Thank you for your feedback and time with us.

## Fixed

-   Memory leaks addressed which caused large uploads to fail
-   Updated the encryption label text
-   Sorting arrows aligned
-   Labels aligned when creating a new folder
-   Shift-selecting items on Windows

## Added

-   Upload file button in the toolbar
-   Warning message when uploading many files
-   Retry loop for smoother transfers
-   Refresh button to reload the current view in My files and Trash
-   Cancel all the transfers when closing Transfer manager

# Release beta 2 - 2020-10-14

## Fixed

-   File & Folder details labels vertical alignment
-   Toolbar buttons on responsive
-   Infinite requests to get trash contents
-   Infinite spinner animation after going into folder and back
-   Root children are loaded multiple times when loading Drive for the first time
-   "Link not found" errors when rapidly cancelling several file uploads
-   PDF preview on Firefox
-   Minimised Transfer manager does not hide grid item names now
-   Improved FAB when Transfer manager opened

## Added

-   A new favicon

# Release beta 1 - 2020-09-29

Here at Proton we value your support and staying with us over the years. As a token of gratitude, and unveiling our future plans, we give you early access to ProtonBeta

With ProtonDrive, you can upload and manage your files, keep your files secure and access them from anywhere.

ProtonDrive has been hand crafted by using end-to-end and zero-access encryption technologies, so no one can read your data. Not even us. Welcome to ProtonBeta

## Added

-   See My files in List or Grid view
-   Download a file, folder
-   Upload a file, folder
-   Expand multiple file transfers view, see progress, file name, size

-   Preview a file (image, pdf and text types)
-   Create a new folder
-   Rename a file or folder
-   View details of a file or folder

-   View storage quota info
-   See Trash, delete item, restore item, empty Trash
-   Cancel, Pause, Restart or Resume a download or upload
-   Move a file or folder: drag & drop, breadcrumbs or dialog

-   Sort items by name, size, date modified, type
-   Fully smooth Dark mode
-   Right click context menu for all the actions to manage items on a desktop browser
-   French language support
