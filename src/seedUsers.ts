import { doc, setDoc } from "firebase/firestore";
import { db } from "./lib/firebase";

const users = [
  { uid: "zex2ApqTWZgDwJQY4q3OpYW01IS2", name: "Irish S. Santiago", role: "Division Head" },
  { uid: "xhOMOp7uPRMblZurcnuKAuWsmd12", name: "Niño Vicente DJ. Zacarias", role: "EMT" },
  { uid: "XhI7e3DWN4Mp5IG8UlNgXmS2NPs1", name: "Napoleon R. Bautista", role: "EMT" },
  { uid: "y0wFfaqwSHXuXgJGIpAv2BNT4PN2", name: "Gail Gabriel C. Torralba", role: "EMT" },
  { uid: "dEIBpOuzYwZOSQmsTSangFXQrR83", name: "Arnel C. Penuller", role: "EMT" },
  { uid: "IOS2X9TtXcMs7BShoMDmUPdp9MF3", name: "Alexander L. Alberto", role: "EMT" },
  { uid: "wmhGQpRJjGONvHMKvbvojwmrrZI3", name: "Edilberto A. Cabalquinto", role: "EMT" },
  { uid: "t8XEOghvBTbXp8STeO5JoZafnrL2", name: "Henry John M. Pascual Jr", role: "EMT" },
  { uid: "mRIugJ4s01O4PQ8dPxZroG7Mky13", name: "Greg Peter B. Bartlett", role: "EMT" },
  { uid: "ioTw16PBBwfdANYwxyXmKDHyIgv2", name: "Antonio G. Sapasap Jr.", role: "EMT" },
  { uid: "Tj91f836JdZToVWzymadhRu2alY2", name: "Meliza J. Leoncio", role: "EMT" },
  { uid: "gzQUcxRaIuSyLjepZyUonfYwZn42", name: "Jedidah C. Dapon", role: "EMT" },
  { uid: "gt54f96FX2YQsswOBrqqda9XSRk1", name: "Arnny N. Clavio", role: "EMT" },
  { uid: "22mNFeASgAQutgggkk5gxRJy8o42", name: "Argie Joseph M. Clavio", role: "EMT" },
  { uid: "e7oTSYoyZHdvZ1FV92IvS2A1ml52", name: "Edgar V. Rodriguez", role: "EMT" },
  { uid: "Jea8k97hHOa1Md1OPOW2fFmu0oW2", name: "Gabriel Luis M. Adriano", role: "OpCen" },
  { uid: "LsNZEnVzLNWBOTRnIObxnGCx9f42", name: "Martin John A. Nazar", role: "OpCen" },
  { uid: "pPkUcrXDIOhX3KHYwCySbdH7TGM2", name: "Bernard John M. Burayag II", role: "OpCen" },
  { uid: "F11iZ53hEMNfTgkfZMNyw3fHP5F3", name: "Gladioli Marie B. Rodriguez", role: "Tech Head" },
];

export async function seedUsers() {
  for (const user of users) {
    await setDoc(doc(db, "users", user.uid), { name: user.name, role: user.role });
    console.log(`✅ ${user.name} → ${user.role}`);
  }
  console.log("🎉 Done!");
}