.PHONY: all npm-install test start versions
.PHONY: travis.install travis.script
.PHONY: .FORCE

all: start

npm-install: .FORCE
	./bin/crun-node npm install --unsafe-perm --loglevel warn --no-bin-links

install: npm-install

test: npm-install
	bin/crun-node npm test

start: npm-install
	bin/crun-node npm start

versions:
	make --version
	bash --version
	./sh/docker-compose --version
	docker --version
	docker info

travis.install: versions npm-install

travis.script: test
