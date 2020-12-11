#!/bin/bash

# fetch new code
git fetch
git reset --hard origin/master
npm install

# build site
bash ./deploy.sh
