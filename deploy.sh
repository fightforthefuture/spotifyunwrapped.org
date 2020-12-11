#!/bin/bash
rsync -avh  --exclude=.git --exclude=*.sh ./ static1:~/www/spotifyunwrapped.org --delete

# bust cloudflare cache
CLOUDFLARE_ZONE_ID=292c884e08d88ea17718f9c23883261f
curl -X DELETE "https://cloudflare.fftf.xyz/zones/${CLOUDFLARE_ZONE_ID}/cache" \
     -H "X-Auth-Key: ${CLOUDFLARE_ZONE_KEY}"

