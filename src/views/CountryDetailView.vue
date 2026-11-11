<template>
  <p class="loading" v-show="loading">Chargement...</p>
  <p class="error" v-if="error">{{ error }}</p>

  <div v-if="country">
    <img
      :src="country.flags.svg"
      :alt="`Drapeau ${country.name.common}`"
      style="width: 200px"
    />
    <h1>{{ country.name.common }}</h1>
    <p>Nom officiel : {{ country.name.official }}</p>
    <p>Capitale : {{ country.capital ? country.capital[0] : "—" }}</p>
    <p>Région : {{ country.region }}</p>
    <p>Population : {{ country.population.toLocaleString() }}</p>
  </div>

  <button @click="$router.back()">Retour</button>
</template>

<script>
export default {
  name: "CountryDetailView",
  data() {
    return {
      country: null,
      loading: true,
      error: null,
    };
  },
  methods: {
    async chargerPays() {
      this.loading = true;
      this.error = null;

      const code = String(this.$route.params.code || "").toUpperCase();
      const url =
        "https://raw.githubusercontent.com/mledoze/countries/master/countries.json";

      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Erreur réseau (${response.status})`);
        }

        const countries = await response.json();
        const data = countries.find((item) => item.cca3 === code);

        if (!data) {
          throw new Error("Pays introuvable.");
        }

        this.country = {
          ...data,
          flags: {
            svg: `https://flagcdn.com/${data.cca2.toLowerCase()}.svg`,
          },
          population: data.population || 0,
        };
      } catch (err) {
        this.error =
          err instanceof TypeError
            ? "Impossible de contacter le serveur. Vérifiez votre connexion."
            : err.message || "Impossible de charger les détails du pays.";
      } finally {
        this.loading = false;
      }
    },
  },
  mounted() {
    this.chargerPays();
  },
};
</script>
