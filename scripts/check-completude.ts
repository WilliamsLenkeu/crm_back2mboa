import { calcCompletude } from "../lib/utils";

const empty = calcCompletude({});
const full = calcCompletude({
  email: "a@b.c",
  telephone: "1",
  organisation: "o",
  fonction: "f",
  secteur: "s",
  pays: "p",
  ville: "v",
  site: "https://x",
  source: "Référence",
  pourquoi: "w",
});
const half = calcCompletude({
  email: "a@b.c",
  telephone: "1",
  organisation: "o",
  fonction: "f",
  secteur: "",
  pays: "",
  ville: "",
  site: "",
  source: "",
  pourquoi: "",
});

console.assert(empty === 0, `empty expected 0 got ${empty}`);
console.assert(full === 100, `full expected 100 got ${full}`);
console.assert(half === 40, `half expected 40 got ${half}`);
console.log("check:completude OK");
