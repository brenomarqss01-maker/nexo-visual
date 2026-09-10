export interface ShowcaseClient {
  name: string;
  logo?: string;
  url?: string;
}

/** Servidores/clientes exibidos na seção "Utilizado por". */
export const showcaseClients: ShowcaseClient[] = [
  { name: "New Era City" },
  { name: "Vortex RP" },
  { name: "Atlas Network" },
  { name: "Nova Bay" },
  { name: "Iron Squad" },
  { name: "Prime Roleplay" },
];
