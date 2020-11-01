#!/bin/bash
echo What should the version be?
read VERSION

echo Your server deployment version is $VERSION

# build docker image
echo building docker image...
docker build -t nicolaigaina/leethub:$VERSION .

# deploy docker image to docker repository
echo deploing docker image to docker repository...
docker push nicolaigaina/leethub:$VERSION

# login to server, pull the docker image from repository, tag it with a given version, and deploy it to dokku
echo deploying on to dockku...
ssh root@64.227.19.213 "docker pull nicolaigaina/leethub:$VERSION && docker tag nicolaigaina/leethub:$VERSION dokku/api:$VERSION && dokku deploy api $VERSION"
