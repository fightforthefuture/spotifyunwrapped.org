document.addEventListener('DOMContentLoaded', function() {
  const CLIENT_ID = 'b4b657d75af6402a8b2be72a97f75389'
  const PERMISSIONS_SCOPE = 'user-read-private user-read-email user-top-read user-library-read'
  const REDIRECT_URL = `${window.location.protocol}//${window.location.host}/`
  const EARINGS_PER_STREAM = 0.0038
  const SLIDE_SECONDS = 10

  function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  function randomNumber(min = 0, max = 50) {
    const random = Math.random() * (max - min) + min
    return Math.floor(random)
  }

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
        slide: 1,
        imageDataURL: '#',
        storyTransitionClass: 'scale-in',
        isMuted: true,
        music: null,
        slideTimeout: null,
        knowsMusicExist: false
      }
    },

    watch: {
      slide() {
        // this class messes up the html2canvas output,
        // so we need to remove it after the transition
        if (this.isStory) {
          setTimeout(() => {
            this.storyTransitionClass = ''
          }, 500)
        }
        else {
          this.storyTransitionClass = 'scale-in'
          this.setTimer()
        }

        this.updateMusic()
      },

      topTracks() {
        this.$nextTick(this.updateMusic)
        // this.updateMusic()
      },

      theme() {
        this.$nextTick(this.createImage)
      },
    },

    computed: {
      themeCount: () => 4,
      slideCount: () => 9,
      storySlide: () => 8,
      topTrackSlide: () => 6,

      authorizeURL() {
        return `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URL)}&scope=${encodeURIComponent(PERMISSIONS_SCOPE)}&state=fftf-spotify2020&show_dialog=true`
      },

      minutesListenedInt() {
        return parseInt(this.minutesListened.toString().replace(/[^0-9.]/g, '')) || 0
      },

      millisecondsListened() {
        return this.minutesListenedInt * 60 * 1000
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

      estimatedArtistEarningsPerMinute() {
        return this.estimatedArtistEarnings / this.minutesListenedInt
      },

      percentagePaidToArtists() {
        return Math.ceil(this.estimatedArtistEarnings / 120.0 * 100)
      },

      estimatedArtistEarningsPerHour() {
        return this.estimatedArtistEarningsPerMinute * 60
      },

      estimatedArtistCentsPerHour() {
        return Math.floor(this.estimatedArtistEarningsPerHour * 100)
      },

      isStory() {
        return this.slide === this.storySlide
      },

      currentTrack() {
        if (this.slide === this.topTrackSlide) {
          return this.topTracks[0]
        }
        else {
          return this.topTracks[this.slide]
        }
      },

      topGenre() {
        if (this.topArtists.length < 1) {
          return ''
        }

        const genres = {}

        for (let artist of this.topArtists) {
         for (let genre of artist.genres) {
            if (!genres[genre]) {
              genres[genre] = {
                name: genre,
                count: 0
              }
            }

            genres[genre].count += 1
          }
        }

        const sorted = Object.values(genres)
          .sort((a, b) => a.count - b.count)
          .reverse()

        // too boring
        if (sorted[0].name === 'rock' && sorted.length > 1) {
          return sorted[1].name
        }
        else {
          return sorted[0].name
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
      },

      formatNumber(number) {
        return new Number(number).toLocaleString()
      },

      formatCurrency(number) {
        return new Number(number).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD'
        })
      }
    },

    async created() {
      const params = getHashParams()

      if (params.access_token) {
        this.accessToken = params.access_token
        await this.fetchLoginStatus()

        if (this.isLoggedIn) {
          this.minutesListened = randomNumber(30000, 36000).toLocaleString()
          this.fetchTopTracks()
          this.fetchTopArtists()
          this.setTimer()
        }
      }
    },

    methods: {
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
        const clone = this.$refs.story.cloneNode(true)
        clone.classList.remove('visible-story')
        clone.classList.add('hidden-story')
        document.body.appendChild(clone)

        window.scrollTo(0, 0)

        // generate PNG
        const canvas = await html2canvas(clone, {
          useCORS: true,
          scale: 1,
          width: 1080,
          height: 1920,
          allowTaint: true,
        })

        canvas.toBlob(blob => {
          this.imageDataURL = URL.createObjectURL(blob)
          document.body.removeChild(clone)
        }, 'image/png')
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
      },

      toggleMusic() {
        this.isMuted = !this.isMuted
        this.knowsMusicExist = true

        if (this.isMuted) {
          this.music.pause()
        }
        else {
          this.music.play()
        }
      },

      updateMusic() {
        if (this.music) {
          this.music.pause()
        }

        if (this.currentTrack) {
          console.log(`loading ${this.currentTrack.preview_url}`)
          this.music = new Audio()
          this.music.loop = true
          this.music.src = this.currentTrack.preview_url

          if (!this.isMuted) {
            this.music.play()
          }
        }
      },

      setTimer() {
        clearTimeout(this.slideTimeout)

        this.slideTimeout = setTimeout(() => {
          if (this.slide < this.storySlide) {
            this.nextSlide()
          }
        }, SLIDE_SECONDS * 1000)
      },

      trackGoal(goal) {
        if (window.fathom) {
          window.fathom.trackGoal(goal, 0)
        }
      }
    }
  })
})
