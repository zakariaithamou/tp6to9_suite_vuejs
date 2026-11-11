<!--
  TP9 -- Meteo en direct.
  Le gabarit (template) est deja cable sur les donnees : il n'y a rien a
  modifier dans la partie template. Tout le travail est dans les methodes
  et la computed de la partie script, marquees TODO 1 a 6.
-->
<template>
  <div class="app">
    <header class="topbar">
      <h1>Météo en direct</h1>
      <button class="unit-toggle" @click="basculerUnite" v-if="ville">
        Afficher en {{ unite === "metric" ? "°F" : "°C" }}
      </button>
    </header>

    <div class="search">
      <input
        v-model="query"
        @input="onInputRecherche"
        type="text"
        placeholder="Rechercher une ville... (ex: Safi, Paris)"
      />
      <p class="hint" v-if="chargementSuggestions">Recherche...</p>
      <p class="msg-error" v-if="erreurSuggestions">{{ erreurSuggestions }}</p>

      <ul class="suggestions" v-if="suggestions.length">
        <li
          v-for="s in suggestions"
          :key="s.lat + '-' + s.lon"
          @click="choisirVille(s)"
        >
          {{ s.name }}<span v-if="s.state">, {{ s.state }}</span> ({{
            s.country
          }})
        </li>
      </ul>
    </div>

    <div class="historique" v-if="historique.length">
      <span>Récent :</span>
      <button
        v-for="h in historique"
        :key="h.lat + '-' + h.lon"
        @click="choisirVille(h)"
      >
        {{ h.name }}
      </button>
    </div>

    <div class="meteo" v-if="ville">
      <p class="loading" v-if="chargementMeteo">Chargement de la météo...</p>
      <p class="msg-error" v-else-if="erreurMeteo">{{ erreurMeteo }}</p>

      <div v-else-if="meteoActuelle" class="courante">
        <h2>{{ ville.name }}, {{ ville.country }}</h2>
        <div class="temp-actuelle">
          <img
            :src="iconeUrl(meteoActuelle.weather[0].icon)"
            :alt="meteoActuelle.weather[0].description"
          />
          <span class="valeur">{{ Math.round(meteoActuelle.main.temp) }}°</span>
          <span class="description">{{
            meteoActuelle.weather[0].description
          }}</span>
        </div>
        <p class="details">
          Ressenti {{ Math.round(meteoActuelle.main.feels_like) }}° · Humidité
          {{ meteoActuelle.main.humidity }}%
        </p>
      </div>

      <div class="previsions" v-if="previsionsParJour.length">
        <div class="jour" v-for="j in previsionsParJour" :key="j.date">
          <span class="date">{{ j.date }}</span>
          <img :src="iconeUrl(j.icone)" :alt="j.description" />
          <span class="temps"
            >{{ Math.round(j.min) }}° / {{ Math.round(j.max) }}°</span
          >
        </div>
      </div>
    </div>

    <p class="empty" v-if="!ville">Cherchez une ville pour voir sa météo.</p>
  </div>
</template>

<script>
// La cle est lue depuis .env (jamais commitée -- voir .env.example et le sujet).
const API_KEY = import.meta.env.VITE_OWM_API_KEY;
const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

export default {
  name: "App",
  data() {
    return {
      query: "",
      debounceTimer: null,
      suggestions: [],
      chargementSuggestions: false,
      erreurSuggestions: null,

      ville: null,
      historique: [],

      meteoActuelle: null,
      previsions: [],
      chargementMeteo: false,
      erreurMeteo: null,

      unite: "metric",
    };
  },
  computed: {
    // TODO 6 : regroupez this.previsions (tranches de 3h, sur 5 jours) en une
    // prevision par jour. Chaque element de this.previsions a la forme :
    //   { dt_txt: "2024-05-12 15:00:00", main: { temp_min, temp_max }, weather: [{ icon, description }] }
    // Indice : la partie de dt_txt avant l'espace ("2024-05-12") est une bonne
    // cle de regroupement. Pour chaque jour, calculez le min et le max des
    // temperatures rencontrees, et gardez une icone/description representative
    // (par exemple celle de la tranche la plus proche de midi).
    // Renvoyez un tableau trie par date : [{ date, min, max, icone, description }, ...]
    previsionsParJour() {
      return [];
    },
  },
  methods: {
    iconeUrl(code) {
      return `https://openweathermap.org/img/wn/${code}@2x.png`;
    },

    onInputRecherche() {
      clearTimeout(this.debounceTimer);

      if (!this.query.trim()) {
        this.suggestions = [];
        this.erreurSuggestions = null;
        return;
      }

      this.debounceTimer = setTimeout(() => {
        this.rechercherVilles();
      }, 400);
    },

    // TODO 2 : appelle l'API de geocodage pour retrouver les villes correspondant
    // a this.query, et remplit this.suggestions.
    // URL : `${GEO_URL}?q=${encodeURIComponent(this.query)}&limit=5&appid=${API_KEY}`
    // A gerer avec des messages differents dans erreurSuggestions :
    //   - reponse.status === 401 -> cle API invalide ou absente
    //   - reponse.status === 429 -> quota depasse, reessayer plus tard
    //   - reponse.ok mais tableau vide -> aucune ville trouvee pour cette recherche
    // Pensez a chargementSuggestions (true avant l'appel, false dans un finally).
    async rechercherVilles() {
      this.chargementSuggestions = true;
      this.erreurSuggestions = null;
      this.suggestions = [];

      const url = `${GEO_URL}?q=${encodeURIComponent(this.query.trim())}&limit=5&appid=${API_KEY}`;

      try {
        const response = await fetch(url);

        if (response.status === 401) {
          throw new Error("Clé API invalide ou absente.");
        }
        if (response.status === 429) {
          throw new Error("Quota dépassé, veuillez réessayer plus tard.");
        }
        if (!response.ok) {
          throw new Error(
            `Erreur réseau (${response.status} : ${response.statusText})`,
          );
        }

        const data = await response.json();

        if (data.length === 0) {
          this.erreurSuggestions = "Aucune ville trouvée pour cette recherche.";
        } else {
          this.suggestions = data;
        }
      } catch (err) {
        this.erreurSuggestions =
          err.message || "Impossible de récupérer les villes.";
      } finally {
        this.chargementSuggestions = false;
      }
    },

    // TODO 3 : appelee au clic sur une suggestion OU sur un element de l'historique.
    // Doit : vider suggestions et query, memoriser la ville dans this.ville,
    // ajouter cette ville en tete de this.historique (pas de doublon sur le
    // couple lat/lon, 5 elements maximum), puis appeler chargerMeteo().
    choisirVille(ville) {
      this.suggestions = [];
      this.query = "";
      this.erreurSuggestions = null;
      this.ville = ville;

      const sansDoublon = this.historique.filter(
        (h) => !(h.lat === ville.lat && h.lon === ville.lon),
      );
      this.historique = [ville, ...sansDoublon].slice(0, 5);

      this.chargerMeteo();
    },

    // TODO 4 : charge la meteo actuelle ET les previsions pour this.ville, en
    // lancant les deux requetes EN PARALLELE avec Promise.all plutot que l'une
    // apres l'autre (elles ne dependent pas l'une de l'autre).
    //   - meteo actuelle : `${WEATHER_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${this.unite}&lang=fr`
    //   - previsions      : `${FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${this.unite}&lang=fr`
    // Remplissez this.meteoActuelle (objet) et this.previsions (donnees.list,
    // un tableau -- la computed previsionsParJour se charge de l'agregation).
    // Gerez chargementMeteo/erreurMeteo comme dans les TP precedents.
    async chargerMeteo() {
      if (!this.ville) return;

      this.chargementMeteo = true;
      this.erreurMeteo = null;
      const { lat, lon } = this.ville;

      const urlActuelle = `${WEATHER_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${this.unite}&lang=fr`;
      const urlPrevisions = `${FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${this.unite}&lang=fr`;

      try {
        const [repActuelle, repPrevisions] = await Promise.all([
          fetch(urlActuelle),
          fetch(urlPrevisions),
        ]);

        if (!repActuelle.ok || !repPrevisions.ok) {
          throw new Error("Erreur lors de la récupération des données météo.");
        }

        const [dataActuelle, dataPrevisions] = await Promise.all([
          repActuelle.json(),
          repPrevisions.json(),
        ]);

        this.meteoActuelle = dataActuelle;
        this.previsions = dataPrevisions.list || [];
      } catch (err) {
        this.erreurMeteo = err.message || "Impossible de charger la météo.";
      } finally {
        this.chargementMeteo = false;
      }
    },

    // TODO 5 : bascule this.unite entre 'metric' et 'imperial', puis recharge
    // la meteo de la ville courante (les temperatures dependent du parametre
    // units= dans l'URL, donc changer l'unite veut dire refaire l'appel).
    basculerUnite() {
      this.unite = this.unite === "metric" ? "imperial" : "metric";
      if (this.ville) {
        this.chargerMeteo();
      }
    },
  },
};
</script>
