#!/bin/bash

# cheap cachebuster
TIMESTAMP=`date +"%s"`
FILES=( index.html artists.html )

for file in "${FILES[@]}"; do
  sed -i '' "s/v=TIMESTAMP/v=${TIMESTAMP}/g" $file
done

# upload site to server
rsync -avh  --exclude=.git --exclude=*.sh ./ static1:~/www/spotifyunwrapped.org --delete

# remove timestamps from source code
for file in "${FILES[@]}"; do
  sed -i '' "s/v=${TIMESTAMP}/v=TIMESTAMP/g" $file
done

# bust cloudflare cache
CLOUDFLARE_ZONE_ID=292c884e08d88ea17718f9c23883261f
curl -X DELETE "https://cloudflare.fftf.xyz/zones/${CLOUDFLARE_ZONE_ID}/cache" \
     -H "X-Auth-Key: ${CLOUDFLARE_ZONE_KEY}"
