.PHONY: all vendor npm-install install build test start localurl versions

all: install test

clean:
	git clean -xfd

npm-install:
	./bin/npm install --loglevel warn --no-progress

vendor:
	./bin/npm run bower-install
	./tasks/privateDependencies.sh

install: npm-install vendor

build:
	./bin/npm run build

test:
	./bin/npm run lint
	./bin/npm test

test-e2e:
	./bin/npm run e2e

start:
	DOCKER_OPTS="-p 8080:8080 -p 3000:3000 -p 3001:3001" ./bin/npm run start-prod

localurl:
	@echo "http://$$(./bin/docker-ip):8080"

versions:
	make --version
	bash --version
	docker version
	docker info
	./bin/npm version
