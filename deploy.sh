#!/bin/bash
rsync -avh  --exclude=.git --exclude=*.sh ./ static1:~/www/spotifyunwrapped.org --delete
