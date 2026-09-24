import { base44 } from "@/api/base44Client";
import { progressFor, stageMeta } from "@/lib/munkalapConfig";
import { logAudit } from "@/lib/auditLog";

export function makeHistoryEntry(stage, note, actor) {
  return { stage, at: new Date().toISOString(), note: note || "", actor: actor || "" };
}

async function getCurrentUser() {
  try {
    const me = await base44.auth.me();
    return me?.full_name || me?.email || "";
  } catch {
    return "";
  }
}

async function transition(munkalap, nextStatus, note, extra = {}, auditAction = "advance") {
  const history = Array.isArray(munkalap.stage_history) ? munkalap.stage_history : [];
  const actor = await getCurrentUser();
  const entry = makeHistoryEntry(nextStatus, note, actor);
  const updated = await base44.entities.Munkalap.update(munkalap.id, {
    status: nextStatus,
    progress: progressFor(nextStatus),
    stage_history: [...history, entry],
    ...extra,
  });
  logAudit({
    action: auditAction,
    munkalap_id: munkalap.id,
    munkalap_code: munkalap.code,
    from_status: munkalap.status,
    to_status: nextStatus,
    quantity_kg: Number(munkalap.quantity_kg) || 0,
    note,
  });
  return updated;
}

// 1→2: Befogadás
export async function befogadMunkalap(munkalap) {
  const actor = await getCurrentUser();
  return transition(
    munkalap,
    "feldolgozas_alatt",
    `Befogadta: ${actor}`,
    { befogado_nev: actor, befogadva_at: new Date().toISOString() },
    "befogad"
  );
}

// 2→3: Feldolgozás kész
export async function feldolgozasKesz(munkalap) {
  return transition(
    munkalap,
    "elkeszitve",
    "Feldolgozás elkészült",
    { feldolgozas_kesz_at: new Date().toISOString() },
    "feldolgozas_kesz"
  );
}

// 3→4: Vevőnek küldve
export async function vevonekKuldve(munkalap) {
  return transition(munkalap, "vevoi_dontes", "Vevőnek továbbítva — vevő döntésére vár", {}, "vevonek_kuldve");
}

// 4→5: Megrendelve — gyártásra kiadás (ez a gyártási engedély)
export async function megrendelEsKiad(munkalap, gyartasAdatok) {
  const actor = await getCurrentUser();
  return transition(
    munkalap,
    "gyartasra_kiadva",
    "Megrendelve — gyártásra kiadva (GYÁRTÁS ENGEDÉLYEZVE)",
    {
      megrendelve_at: new Date().toISOString(),
      gyartasra_kiadta: actor,
      gyartasra_kiadva_at: new Date().toISOString(),
      ...gyartasAdatok,
    },
    "megrendel"
  );
}

// 5→6: Gyártás indítása
export async function gyartasIndit(munkalap, inditoAdatok) {
  return transition(
    munkalap,
    "gyartasban",
    "Gyártás elindítva",
    {
      gyartas_kezdete: new Date().toISOString(),
      ...inditoAdatok,
    },
    "gyartas_indit"
  );
}

// 6→7: Gyártás kész (rakodható)
export async function gyartasKesz(munkalap, keszAdatok) {
  return transition(
    munkalap,
    "rakodhato",
    "Gyártás kész — rakodható",
    {
      gyartas_vege: new Date().toISOString(),
      rakodhato_at: new Date().toISOString(),
      ...keszAdatok,
    },
    "gyartas_kesz"
  );
}

// 7→8: Felrakva — lezárás
export async function felrakvaLezar(munkalap, rakodasAdatok) {
  return transition(
    munkalap,
    "lezarva",
    "Felrakva — munka lezárva",
    { felrakva_at: new Date().toISOString(), ...rakodasAdatok },
    "felrak"
  );
}

// Bármikor → Megszakítva
export async function megszakitMunkalap(munkalap, ok) {
  const history = Array.isArray(munkalap.stage_history) ? munkalap.stage_history : [];
  const actor = await getCurrentUser();
  const entry = makeHistoryEntry("megszakitva", `Megszakítva: ${ok}`, actor);
  const updated = await base44.entities.Munkalap.update(munkalap.id, {
    status: "megszakitva",
    progress: 100,
    megszakitva_ok: ok,
    megszakitva_at: new Date().toISOString(),
    stage_history: [...history, entry],
  });
  logAudit({
    action: "megszakit",
    munkalap_id: munkalap.id,
    munkalap_code: munkalap.code,
    from_status: munkalap.status,
    to_status: "megszakitva",
    quantity_kg: Number(munkalap.quantity_kg) || 0,
    note: ok,
  });
  return updated;
}

// Sürgősségi kérés (korábbi időpont)
export async function surgoKeres(munkalap, datum, indok) {
  const history = Array.isArray(munkalap.stage_history) ? munkalap.stage_history : [];
  const actor = await getCurrentUser();
  const entry = makeHistoryEntry(munkalap.status, `Sürgősségi kérés: ${datum} — ${indok || ""}`, actor);
  const updated = await base44.entities.Munkalap.update(munkalap.id, {
    surgo_keres_datum: datum,
    surgo_keres_indok: indok || "",
    surgo_allapot: "pending",
    surgo_valasz_datum: null,
    surgo_valasz_mennyiseg: 0,
    surgo_valasz_note: "",
    stage_history: [...history, entry],
  });
  logAudit({
    action: "surgo_keres",
    munkalap_id: munkalap.id,
    munkalap_code: munkalap.code,
    note: `${datum} — ${indok || ""}`,
  });
  return updated;
}

// Sürgősségi válasz (gyár)
export async function surgoValasz(munkalap, allapot, valaszAdatok) {
  const history = Array.isArray(munkalap.stage_history) ? munkalap.stage_history : [];
  const actor = await getCurrentUser();
  const labels = { elfogadva: "Elfogadva", reszben: "Részben teljesíthető", nem_teljesitheto: "Nem teljesíthető" };
  const note = `Sürgősség válasz: ${labels[allapot] || allapot}${valaszAdatok?.surgo_valasz_datum ? ` — ${valaszAdatok.surgo_valasz_datum}` : ""}`;
  const entry = makeHistoryEntry(munkalap.status, note, actor);
  const update = {
    surgo_allapot: allapot,
    surgo_valasz_datum: valaszAdatok?.surgo_valasz_datum || null,
    surgo_valasz_mennyiseg: valaszAdatok?.surgo_valasz_mennyiseg || 0,
    surgo_valasz_note: valaszAdatok?.surgo_valasz_note || "",
    stage_history: [...history, entry],
  };
  if (allapot === "elfogadva" && valaszAdatok?.surgo_valasz_datum) {
    update.varhato_rakodhato = valaszAdatok.surgo_valasz_datum;
  }
  const updated = await base44.entities.Munkalap.update(munkalap.id, update);
  logAudit({
    action: "surgo_valasz",
    munkalap_id: munkalap.id,
    munkalap_code: munkalap.code,
    note,
  });
  return updated;
}