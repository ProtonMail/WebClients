.PHONY: all npm-install test start localurl versions
.PHONY: circle.dependencies circle.test

all: test

npm-image:
	cat bin/npm.Dockerfile | docker build -

npm-install:
	./bin/npm install --loglevel warn --no-progress

install: npm-install

test: npm-install
	bin/npm test

start: npm-install
	DOCKER_OPTS="-p 3000:3000 -p 3001:3001" bin/npm start

localurl:
	@echo "http://$$(./bin/docker-ip):8080"

versions:
	make --version
	bash --version
	docker version
	docker info

circle.dependencies: versions npm-image npm-install
circle.test: test
