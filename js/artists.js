document.addEventListener('DOMContentLoaded', function() {
  const EARINGS_PER_STREAM = 0.0038

  const app = new Vue({
    el: '#app',

    data() {
      return {
        name: 'Jeff Bezos Blues Explosion',
        streams: 239567881456,
        hours: 9500000,
        listeners: 2536,
        countries: 92,
        image: null,
        theme: 1,
        photoSrc: 'img/sample-artist.jpg',
        imageDataURL: '#'
      }
    },

    watch: {
      theme() {
        this.$nextTick(this.createImage)
      }
    },

    computed: {
      themeCount: () => 4
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
        const intNumber = parseInt(number.toString().replace(/[^0-9.]/g, '')) || 0

        if (intNumber > 1000000000000000) {
          return '∞'
        }
        if (intNumber > 1000000000000) {
          return new Number(intNumber / 1000000000000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + 'T'
        }
        else if (intNumber > 1000000000) {
          return new Number(intNumber / 1000000000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + 'B'
        }
        else if (intNumber > 1000000) {
          return new Number(intNumber / 1000000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + 'M'
        }
        else if (intNumber > 1000) {
          return new Number(intNumber / 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + 'K'
        }
        else {
          return new Number(intNumber).toLocaleString()
        }
      }
    },

    mounted() {
      this.$nextTick(this.createImage)
    },

    methods: {
      async createImage() {
        console.log('createImage')

        const clone = this.$refs.canvas.cloneNode(true)
        clone.classList.remove('visible-image')
        clone.classList.add('hidden-image')
        document.body.appendChild(clone)

        window.scrollTo(0, 0)

        // generate PNG
        const canvas = await html2canvas(clone, {
          useCORS: true,
          scale: 1,
          width: 1080,
          height: 1080,
          allowTaint: true,
        })

        canvas.toBlob(blob => {
          this.imageDataURL = URL.createObjectURL(blob)
          document.body.removeChild(clone)
        }, 'image/png')
      },

      selectPhoto() {
        const file = this.$refs.photoFile.files[0]

        if (file && file.type.match(/^image/)) {
          const reader = new FileReader()
          reader.onload = e => {
            this.photoSrc = e.target.result
            this.$nextTick(this.createImage)
          }
          reader.readAsDataURL(file)
        }
      },

      trackGoal(goal) {
        if (window.fathom) {
          window.fathom.trackGoal(goal, 0)
        }
      }
    }
  })
})
