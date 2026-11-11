import { createRouter, createWebHistory } from "vue-router";
import StudentListView from "../views/StudentListView.vue";
import StudentDetailView from "../views/StudentDetailView.vue";
import NotFoundView from "../views/NotFoundView.vue"; // ou votre composant 404

const routes = [
  {
    path: "/",
    name: "students-list",
    component: StudentListView,
  },
  {
    path: "/etudiant/:id",
    name: "student-detail",
    component: StudentDetailView,
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
