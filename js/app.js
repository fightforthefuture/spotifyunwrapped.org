document.addEventListener('DOMContentLoaded', function() {
  const CLIENT_ID = 'b4b657d75af6402a8b2be72a97f75389'
  const PERMISSIONS_SCOPE = 'user-read-private user-read-email user-top-read user-library-read'
  const REDIRECT_URL = `${window.location.protocol}//${window.location.host}/`
  const EARINGS_PER_STREAM = 0.0038

  function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  Vue.component('slide', {
    template: `
      <div class="slide">
        <div>
          <slot></slot>
        </div>
        <nav>
          <button class="prev" @click="$parent.prevSlide()"></button>
          <button class="next" @click="$parent.nextSlide()"></button>
        </nav>
      </div>
    `
  })

  const app = new Vue({
    el: '#app',

    data() {
      return {
        isLoggedIn: false,
        accessToken: null,
        minutesListened: 30000,
        profile: {},
        topArtists: [],
        topTracks: [],
        theme: 1,
        slide: 1
      }
    },

    computed: {
      slideCount() {
        return 6
      },

      authorizeURL() {
        return `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URL)}&scope=${encodeURIComponent(PERMISSIONS_SCOPE)}&state=fftf-spotify2020&show_dialog=true`
      },

      minutesListenedFormatted() {
        return new Number(this.minutesListened).toLocaleString()
      },

      millisecondsListened() {
        if (this.minutesListened) {
          return this.minutesListened * 60 * 1000
        }
        else {
          return 0
        }
      },

      averageTrackDuration() {
        let total = 0
        this.topTracks.map(t => total += t.duration_ms)

        return parseInt(total / this.topTracks.length)
      },

      estimatedStreamCount() {
        return parseInt(this.millisecondsListened / this.averageTrackDuration)
      },

      estimatedArtistEarnings() {
        return EARINGS_PER_STREAM * this.estimatedStreamCount
      },

      estimatedArtistEarningsFormatted() {
        return new Number(this.estimatedArtistEarnings).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
      }
    },

    async created() {
      const params = getHashParams()

      if (params.access_token) {
        this.accessToken = params.access_token
        await this.fetchLoginStatus()

        if (this.isLoggedIn) {
          this.fetchTopTracks()
          this.fetchTopArtists()
        }
      }
    },

    filters: {
      truncate(str) {
        const maxLength = 19

        if (str && str.length > maxLength) {
          return `${str.substring(0, maxLength).trim()}…`
        }
        else {
          return str
        }
      }
    },

    methods: {
      login() {
        location.href = this.authorizeURL
      },

      async makeSpotifyRequest(url) {
        const response = await fetch(`https://api.spotify.com/v1/${url}`, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        })

        if (response.ok) {
          const json = await response.json()

          if (json.error) {
            console.error(json.error)
          }
          else {
            return json
          }
        }
        else {
          console.error(response)
        }

        return null
      },

      async fetchLoginStatus() {
        const data = await this.makeSpotifyRequest('me')

        if (data) {
          this.isLoggedIn = true
          this.profile = data
        }
      },

      async fetchTopTracks() {
        const data = await this.makeSpotifyRequest('me/top/tracks?time_range=medium_term')

        if (data) {
          this.topTracks = data.items
        }
      },

      async fetchTopArtists() {
        const data = await this.makeSpotifyRequest('me/top/artists?time_range=medium_term')

        if (data) {
          this.topArtists = data.items
        }
      },

      async createImage() {
        const canvas = await html2canvas(this.$refs.canvas, {
          useCORS: true
        })
        document.body.appendChild(canvas)
      },

      prevSlide() {
        if (this.slide > 1) {
          this.slide--
        }
      },

      nextSlide() {
        if (this.slide < this.slideCount) {
          this.slide++
        }
      }
    }
  })
})
