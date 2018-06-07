##################################################################
### The most lightweight image needed to run the product
##################################################################
FROM node:8-alpine as dckr-prtn-common-base

# Port where the server starts
EXPOSE 8080

##################################################################
### The actual builder (does install js dependencies from the package lock file)
### By using this image, you get a warmed-up cache+dependencies, making for faster rebuild
##################################################################
FROM dckr-prtn-common-base as dckr-prtn-dev-runner

# Adding required dependencies to call `yarn install`
RUN apk add --no-cache git libpng-dev build-base nasm autoconf automake libtool

# Configure yarn to find modules in explicit folders
RUN yarn config set cache-folder /node_modules_cache
RUN yarn config set prefix /node_modules_global
# XXX doesn't work well, because of the build system making assumptions about the default
# RUN echo '--*.modules-folder "/node_modules"' > ~/.yarnrc

WORKDIR /build

# Get the needed files to perform a first yarn install
COPY ./package.json .
COPY ./yarn.lock .
COPY ./tasks ./tasks
COPY ./env ./env
RUN mkdir -p ./src/libraries
COPY ./src/libraries/mailparser.js ./src/libraries

# XXX some checks choke on the custom module folder, because they assume it's a subfolder of cwd...
# RUN mkdir -p /node_modules
# RUN ln -s /node_modules .

# And install dependencies
RUN yarn install # --verbose

WORKDIR /pm

VOLUME /build
VOLUME /pm

# Default command
CMD /bin/sh


##################################################################
### This is a lightweight version of the above (about half the size)
### It doesn't carry the node cache, or any of the dependencies required to rebuild
##################################################################
FROM dckr-prtn-common-base as dckr-prtn-light-runner

COPY --from=dckr-prtn-dev-runner /build/node_modules /build/node_modules
# COPY --from=dckr-prtn-dev-runner /node_modules_cache /node_modules_cache
# COPY --from=dckr-prtn-dev-runner /node_modules_global /node_modules_global

WORKDIR /pm

VOLUME /build
VOLUME /pm

# Default command
CMD /bin/sh
