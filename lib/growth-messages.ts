export const DEFAULT_GROWTH_MESSAGES = [
  "Alles, was wachsen darf, beginnt in liebevoller Stille.",
  "Du darfst dir Zeit geben – dein erster Schritt ist bereits genug.",
  "Spüre dich. In dir wächst etwas Eigenes und Wundervolles.",
  "Mit jedem achtsamen Moment findest du ein wenig mehr zu dir.",
  "Deine Kraft muss nicht laut sein, um tief verwurzelt zu sein.",
  "Du darfst dich entfalten – in deinem Tempo und auf deine Weise.",
  "Je liebevoller du dir begegnest, desto freier darfst du wachsen.",
  "Du blühst, wenn du dir selbst Aufmerksamkeit und Nähe schenkst.",
  "Was du in Liebe für dich beginnst, darf reiche Früchte tragen.",
] as const;

export function normalizeGrowthMessages(value: unknown) {
  const messages = Array.isArray(value) ? value : [];
  return DEFAULT_GROWTH_MESSAGES.map((fallback, index) => {
    const message = messages[index];
    return typeof message === "string" && message.trim() ? message.trim() : fallback;
  });
}
