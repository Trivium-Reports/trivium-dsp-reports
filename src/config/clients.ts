/**
 * Client roster — single source of truth.
 *
 * Each entry's `slug` becomes the URL: `https://<site>/<slug>`
 * The dashboard loads `/data/<slug>/dsp.csv` and looks up `name` for the brand label.
 *
 * Privacy by design: nothing on any client's dashboard references or links
 * to any other client. Each URL is isolated.
 *
 * To onboard a new client: add an entry here AND drop their CSV at
 * `public/data/<slug>/dsp.csv`. Set `active: false` to temporarily hide.
 */

export interface Client {
  slug: string;
  name: string;
  active: boolean;
}

export const CLIENTS: Client[] = [
  { slug: "mirai-clinical",        name: "Mirai Clinical",        active: true },
  { slug: "dura-cleanse",          name: "Dura Cleanse",          active: true },
  { slug: "fit-and-fresh",         name: "Fit & Fresh",           active: true },
  { slug: "survival-garden-seeds", name: "Survival Garden Seeds", active: true },
];

export function getClientBySlug(slug: string | undefined): Client | undefined {
  if (!slug) return undefined;
  return CLIENTS.find(c => c.slug === slug && c.active);
}
