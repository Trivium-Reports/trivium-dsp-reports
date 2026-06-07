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
  { slug: "fit-and-fresh",         name: "Fit + Fresh",           active: true },
  { slug: "survival-garden-seeds", name: "Survival Garden Seeds", active: true },
  // Onboarded 2026-06-08 — second wave: 14 brands
  { slug: "primal-queen",          name: "Primal Queen",          active: true },
  { slug: "woxer",                 name: "Woxer",                 active: true },
  { slug: "wander-beauty",         name: "Wander Beauty",         active: true },
  { slug: "sprinkle-and-sweep",    name: "Sprinkle & Sweep",      active: true },
  { slug: "paradise-naturals",     name: "Paradise Naturals",     active: true },
  { slug: "healthy-bones",         name: "Healthy Bones",         active: true },
  { slug: "probiora",              name: "ProBiora Plus",         active: true },
  { slug: "honey-bae",             name: "Honey Bae",             active: true },
  { slug: "sud-scrub",             name: "Sud Scrub",             active: true },
  { slug: "future-kind",           name: "Future Kind+",          active: true },
  { slug: "jarmino",               name: "Jarmino",               active: true },
  { slug: "daron",                 name: "Daron Worldwide",       active: true },
  { slug: "theraice",              name: "TheraICE",              active: true },
  { slug: "dexas",                 name: "Dexas",                 active: true },
];

export function getClientBySlug(slug: string | undefined): Client | undefined {
  if (!slug) return undefined;
  return CLIENTS.find(c => c.slug === slug && c.active);
}
