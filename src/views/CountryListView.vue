<template>
  <h1>Explorateur de pays</h1>

  <p class="loading" v-show="loading">Chargement des pays...</p>
  <p class="error" v-if="error">{{ error }}</p>

  <div class="toolbar">
    <input v-model="recherche" placeholder="Rechercher un pays..." />
  </div>

  <div class="grid">
    <CountryCard
      v-for="country in paysAffiches"
      :key="country.cca3"
      :country="country"
    />
  </div>
</template>

<script>
import CountryCard from '../components/CountryCard.vue'

const API_URL =
  'https://raw.githubusercontent.com/mledoze/countries/master/countries.json'

export default {
  name: 'CountryListView',
  components: { CountryCard },
  data() {
    return {
      countries: [],
      loading: true,
      error: null,
      recherche: ''
    }
  },
  computed: {
    paysAffiches() {
      const query = this.recherche.toLowerCase().trim()
      if (!query) {
        return this.countries
      }

      return this.countries.filter(country => {
        const nomCommun = country.name?.common?.toLowerCase() || ''
        return nomCommun.includes(query)
      })
    }
  },
  methods: {
   async chargerPays() {
      this.loading = true
      this.error = null

      try {
        const response = await fetch(API_URL)

        if (!response.ok) {
          throw new Error(`Erreur réseau (${response.status})`)
        }

        const data = await response.json()
        this.countries = data.map(country => ({
          ...country,
          flags: {
            svg: `https://flagcdn.com/${country.cca2.toLowerCase()}.svg`
          },
          population: country.population || 0
        }))
      } catch (err) {
        this.error =
          err instanceof TypeError
            ? 'Impossible de contacter le serveur. Vérifiez votre connexion.'
            : err.message || 'Impossible de récupérer la liste des pays.'
      } finally {
        this.loading = false
      }
    }
  },
  mounted() {
    this.chargerPays()
  }
}
</script>
