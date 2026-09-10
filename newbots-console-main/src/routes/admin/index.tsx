import { createFileRoute } from "@tanstack/react-router";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Admin NEXO NETWORK" },
      {
        name: "description",
        content: "Visão geral de clientes, sistemas e licenças da plataforma NEXO NETWORK.",
      },
      { property: "og:title", content: "Dashboard — Admin NEXO NETWORK" },
      {
        property: "og:description",
        content: "Visão geral de clientes, sistemas e licenças da NEXO NETWORK.",
      },
    ],
  }),
  component: AdminDashboard,
});
