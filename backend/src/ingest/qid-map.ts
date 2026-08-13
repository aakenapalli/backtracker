// Hand-verified Wikidata QID + canonical English Wikipedia title per site.
//
// Deliberately hand-written and committed rather than resolved by fuzzy name
// search at sync time: searching "Sultan Ahmed Mosque" on Wikidata surfaces
// an unrelated mosque in Bosnia as a top result, and article titles move
// (Blue Mosque's English article moved from "Sultan Ahmed Mosque" to
// "Blue Mosque, Istanbul"). Every entry below was verified once by querying
// Wikipedia's summary API and cross-checking the returned coordinates
// against this project's hand-typed lat/lng (all matched within ~0.5km).
export const qidBySlug: Record<string, { qid: string; wikipediaTitle: string }> = {
  "hagia-sophia": { qid: "Q12506", wikipediaTitle: "Hagia Sophia" },
  "blue-mosque": { qid: "Q80541", wikipediaTitle: "Blue Mosque, Istanbul" },
  "basilica-cistern": { qid: "Q216511", wikipediaTitle: "Basilica Cistern" },
  "topkapi-palace": { qid: "Q170495", wikipediaTitle: "Topkapı Palace" },
  "hippodrome-of-constantinople": { qid: "Q387548", wikipediaTitle: "Hippodrome of Constantinople" },
  "little-hagia-sophia": { qid: "Q1144576", wikipediaTitle: "Little Hagia Sophia" },
  "suleymaniye-mosque": { qid: "Q178643", wikipediaTitle: "Süleymaniye Mosque" },
  "grand-bazaar": { qid: "Q505954", wikipediaTitle: "Grand Bazaar, Istanbul" },
  "galata-tower": { qid: "Q91274", wikipediaTitle: "Galata Tower" },
  "istiklal-avenue": { qid: "Q344348", wikipediaTitle: "İstiklal Avenue" },
  "taksim-square": { qid: "Q736072", wikipediaTitle: "Taksim Square" },
  "balat-walking-area": { qid: "Q48796", wikipediaTitle: "Balat, Fatih" },
  "fener-walking-area": { qid: "Q985842", wikipediaTitle: "Fener" },
  "ecumenical-patriarchate": { qid: "Q211004", wikipediaTitle: "Ecumenical Patriarchate of Constantinople" },
  "bulgarian-st-stephen-church": { qid: "Q2094950", wikipediaTitle: "Bulgarian St. Stephen Church" },
  "chora-church": { qid: "Q849489", wikipediaTitle: "The Chora" },
  "istanbul-archaeological-museums": { qid: "Q636978", wikipediaTitle: "Istanbul Archaeology Museums" },
  "gulhane-park": { qid: "Q1560106", wikipediaTitle: "Gülhane Park" },
  "spice-bazaar": { qid: "Q668641", wikipediaTitle: "Spice Bazaar" },
  "rustem-pasha-mosque": { qid: "Q1137511", wikipediaTitle: "Rüstem Pasha Mosque" },
  "new-mosque": { qid: "Q911720", wikipediaTitle: "New Mosque, Istanbul" },
  "pera-museum": { qid: "Q1662392", wikipediaTitle: "Pera Museum" },
  "cicek-passage": { qid: "Q595289", wikipediaTitle: "Çiçek Pasajı" },
  "dolmabahce-palace": { qid: "Q274141", wikipediaTitle: "Dolmabahçe Palace" },
  "ortakoy-mosque": { qid: "Q176380", wikipediaTitle: "Ortaköy Mosque" },
  "rumeli-fortress": { qid: "Q90801", wikipediaTitle: "Rumelihisarı" },
  "museum-of-turkish-and-islamic-arts": { qid: "Q525939", wikipediaTitle: "Turkish and Islamic Arts Museum" },
};
