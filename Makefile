.PHONY: all npm-install test start localurl versions
.PHONY: circle.dependencies circle.test
.PHONY: .FORCE

all: start

npm-install: .FORCE
	./bin/crun-node npm install --unsafe-perm --loglevel warn --no-bin-links

install: npm-install

test: npm-install
	bin/crun-node npm test

start: npm-install
	DOCKER_OPTS="-p 8080:8080" bin/crun-node npm start

localurl:
	@echo "http://$$(./bin/docker-ip):8080"

versions:
	make --version
	bash --version
	docker version
	docker info

circle.dependencies: versions npm-install
circle.test: test
