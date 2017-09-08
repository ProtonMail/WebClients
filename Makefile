.PHONY: all npm-install test start localurl versions
.PHONY: ci.dependencies ci.test

all: install test

npm-install:
	./bin/npm install --loglevel warn --no-progress

vendor:
	./bin/npm run bower-install
	./tasks/privateDependencies.sh

install: npm-install vendor

test:
	./bin/npm test

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

ci.dependencies: versions install
ci.test: test
