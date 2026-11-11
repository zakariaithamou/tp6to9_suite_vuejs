<template>
  <h1>Annuaire des étudiants</h1>

  <!-- TODO A : formulaire d'ajout (prenom, nom, filiere, annee, email) -->
  <form @submit.prevent="ajouterEtudiant">
    <input
      v-model="newStudent.firstName"
      type="text"
      placeholder="Prénom"
      required
    />
    <input
      v-model="newStudent.lastName"
      type="text"
      placeholder="Nom"
      required
    />
    <input v-model="newStudent.filiere" type="text" placeholder="Filière" />
    <input
      v-model.number="newStudent.year"
      type="number"
      placeholder="Année"
      min="1"
    />
    <input v-model="newStudent.email" type="email" placeholder="Email" />
    <button type="submit">Ajouter</button>
  </form>
  <form>
    <button type="submit">Ajouter</button>
  </form>

  <!-- TODO B : recherche (texte) + tri (select : nom / filiere) -->
  <div class="toolbar">
    <input
      v-model="recherche"
      type="text"
      placeholder="Rechercher par nom ou prénom..."
    />
    <select v-model="tri">
      <option value="lastName">Trier par nom</option>
      <option value="filiere">Trier par filière</option>
    </select>
  </div>

  <!-- TODO B (suite) : bouclez sur le résultat recherché + trié -->
  <StudentCard
    v-for="student in etudiantsAffiches"
    :key="student.id"
    :student="student"
  />
</template>

<script>
import StudentCard from "../components/StudentCard.vue";
import { store } from "../store/students.js";

export default {
  name: "StudentListView",
  components: { StudentCard },
  data() {
    return {
      store,
      recherche: "",
      tri: "lastName",
      newStudent: {
        firstName: "",
        lastName: "",
        filiere: "",
        year: 1,
        email: "",
      },
    };
  },
  computed: {
    etudiantsAffiches() {
      const query = this.recherche.toLowerCase().trim();

      const filtered = this.store.students.filter((student) => {
        const nom = (student.lastName || "").toLowerCase();
        const prenom = (student.firstName || "").toLowerCase();
        return nom.includes(query) || prenom.includes(query);
      });

      return [...filtered].sort((a, b) => {
        const valA = (a[this.tri] || "").toString();
        const valB = (b[this.tri] || "").toString();
        return valA.localeCompare(valB);
      });
    },
  },
  methods: {
    ajouterEtudiant() {
      const firstName = this.newStudent.firstName.trim();
      const lastName = this.newStudent.lastName.trim();

      if (!firstName || !lastName) {
        return;
      }

      this.store.students.push({
        id: Date.now(),
        firstName,
        lastName,
        filiere: this.newStudent.filiere.trim(),
        year: Number(this.newStudent.year) || 1,
        email: this.newStudent.email.trim(),
      });

      this.newStudent = {
        firstName: "",
        lastName: "",
        filiere: "",
        year: 1,
        email: "",
      };
    },
  },
};
</script>
