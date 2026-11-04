/**
 * Image manifest: every photograph on the site is referenced from here.
 *
 * kind: "maa"   genuine MAA event photography, supplied by the client.
 * kind: "stock" illustrative Unsplash photography (Unsplash License). It must
 *               never be captioned or implied to show an MAA event, a planned
 *               venue, or a partner. `source` is kept for license records.
 *
 * To swap an image, drop the file in /public/images and update `src` and `alt`.
 * Keep the key the same and every page picks up the change.
 */

export type Photo = {
  src: string;
  alt: string;
  kind: "maa" | "stock";
  source?: string;
  /** CSS object-position for art-directed crops. */
  focus?: string;
};

const stock = (file: string, alt: string, id: string, focus?: string): Photo => ({
  src: `/images/photos/${file}.jpg`,
  alt,
  kind: "stock",
  source: `https://images.unsplash.com/photo-${id}`,
  focus,
});
const maa = (file: string, alt: string, focus?: string): Photo => ({
  src: `/images/events/${file}.jpg`,
  alt,
  kind: "maa",
  focus,
});

export const photos = {
  /* Genuine MAA photography: American X History Tour */
  runLoveMural: maa(
    "run-love-mural",
    "Runners pass a large, brightly painted LOVE mural during a previous American X History Tour",
    "30% 60%",
  ),
  groupCrosswalk: maa(
    "group-crosswalk",
    "American X History Tour participants pose together in a Miami crosswalk, arms raised",
    "50% 60%",
  ),
  groupSidewalk: maa(
    "group-sidewalk",
    "A large group of American X History Tour participants gathers on a Miami sidewalk",
    "50% 55%",
  ),
  groupOverhead: maa(
    "group-overhead",
    "Overhead view of American X History Tour participants in a circle, looking up at the camera",
    "50% 40%",
  ),
  rideCauseway: maa(
    "ride-causeway",
    "A cyclist and a walker cross a white Miami causeway with the downtown skyline behind them",
    "50% 45%",
  ),

  /* Illustrative stock */
  marathonStreet: stock(
    "marathon-street",
    "Runners in a road race move through a city street at first light",
    "1760315972424-1637530daead",
  ),
  groupFitness: stock(
    "group-fitness-beach",
    "A group works out together on white sand beside a fishing pier",
    "1561579890-3ace74d8e378",
  ),
  logCarry: stock(
    "log-carry",
    "A team lifts a heavy log overhead together during an outdoor fitness challenge",
    "1775322844311-899a2a620f24",
    "50% 25%",
  ),
  volleyballSunset: stock(
    "volleyball-sunset",
    "Silhouetted players compete in beach volleyball at sunset",
    "1612872087720-bb876e2e67d1",
  ),
  paddleboard: stock(
    "paddleboard-group",
    "A group of paddleboarders on calm water at dusk",
    "1557151498-af2467d6f7f4",
  ),
  aerialSouthBeach: stock(
    "aerial-south-beach",
    "Aerial view of South Beach, with wide sand, turquoise water and the Miami skyline",
    "1734229178504-c1d3310c999f",
    "50% 40%",
  ),
  oceanDrive: stock(
    "ocean-drive-day",
    "Palm trees and pastel Art Deco buildings along Ocean Drive in Miami Beach",
    "1784253622017-dfa7b8857eac",
  ),
  rooftopSunset: stock(
    "rooftop-sunset",
    "People on a hospitality terrace overlooking the water at sunset",
    "1791193706449-a811075610df",
  ),
  hotelTerrace: stock(
    "hotel-terrace",
    "An open-air terrace lounge looking out over the water",
    "1790276319738-f7b19d7f7e8c",
  ),
} satisfies Record<string, Photo>;
