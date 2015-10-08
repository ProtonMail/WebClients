.PHONY: all npm-install test start versions
.PHONY: travis.install travis.script
.PHONY: .FORCE

all: start

npm-install: .FORCE
	./bin/crun-node npm install --unsafe-perm --loglevel info --no-bin-links

test: npm-install
	bin/crun-node npm test

start: npm-install
	bin/crun-node npm start

versions:
	bash --version
	docker --version

travis.install: versions npm-install

travis.script: test
