// QuestWidget.js — Scriptable Widget for Quest Tracker
// Place quest-tracker.json in: iCloud Drive/Scriptable/quest-tracker.json

const FILE_PATH = "quest-tracker.json";

const fm   = FileManager.iCloud();
const dir  = fm.documentsDirectory();
const path = fm.joinPath(dir, FILE_PATH);

let data = null;
if (fm.fileExists(path)) {
  await fm.downloadFileFromiCloud(path);
  try { data = JSON.parse(fm.readString(path)); } catch(e) { data = null; }
}

// ── Colors ─────────────────────────────────────────────────────────────────
const C = {
  bg:       new Color("#0e0c1a"),
  surface2: new Color("#1f1b35"),
  accent:   new Color("#a78bfa"),
  accent2:  new Color("#7c3aed"),
  gold:     new Color("#e2c97e"),
  dawn:     new Color("#f97c4a"),
  text:     new Color("#f0ecff"),
  text2:    new Color("#9d94c4"),
  text3:    new Color("#5a5280"),
  success:  new Color("#6ee7b7"),
  border:   new Color("#2a2050"),
};

// ── Widget ─────────────────────────────────────────────────────────────────
const widget = new ListWidget();
widget.backgroundColor = C.bg;
widget.setPadding(14, 16, 14, 16);

if (!data) {
  const msg = widget.addText("No quest-tracker.json found.\nTap ⚡ Sync Widget in the app.");
  msg.textColor = C.text3;
  msg.font = Font.italicSystemFont(12);
  msg.centerAlignText();
  Script.setWidget(widget);
  Script.complete();
  widget.presentMedium();
  return;
}

const pendingDailies  = (data.dailyQuests  || []).filter(q => !q.done);
const pendingActives  = (data.quests       || []).filter(q => !q.done);

// ── Level + XP bar ─────────────────────────────────────────────────────────
const headerStack = widget.addStack();
headerStack.layoutHorizontally();
headerStack.centerAlignContent();
headerStack.spacing = 12;

// Level badge
const badgeStack = headerStack.addStack();
badgeStack.layoutVertically();
badgeStack.centerAlignContent();
const levelLbl = badgeStack.addText("POWER");
levelLbl.textColor = C.text3;
levelLbl.font = Font.boldSystemFont(8);
levelLbl.centerAlignText();
const levelNum = badgeStack.addText(String(data.level));
levelNum.textColor = C.gold;
levelNum.font = Font.boldSystemFont(44);
levelNum.centerAlignText();

// XP section
const xpStack = headerStack.addStack();
xpStack.layoutVertically();
xpStack.spacing = 4;
const xpHeaderRow = xpStack.addStack();
xpHeaderRow.layoutHorizontally();
const xpLbl = xpHeaderRow.addText("EXPERIENCE");
xpLbl.textColor = C.text3;
xpLbl.font = Font.boldSystemFont(8);
xpHeaderRow.addSpacer();
const xpCounter = xpHeaderRow.addText(`${data.xp} / ${data.xpNeeded} XP`);
xpCounter.textColor = C.accent;
xpCounter.font = Font.systemFont(11);

// XP bar
const barOuter = xpStack.addStack();
barOuter.backgroundColor = C.surface2;
barOuter.cornerRadius = 3;
barOuter.size = new Size(0, 7);
const fillWidth = Math.max(1, Math.round((data.xpPercent / 100) * 180));
const barInner = barOuter.addStack();
barInner.backgroundColor = C.accent2;
barInner.cornerRadius = 3;
barInner.size = new Size(fillWidth, 7);
barOuter.addSpacer();

const xpPctLbl = xpStack.addText(`${data.xpPercent}% to level ${data.level + 1}`);
xpPctLbl.textColor = C.text3;
xpPctLbl.font = Font.systemFont(10);

widget.addSpacer(10);

// ── Divider ────────────────────────────────────────────────────────────────
const div1 = widget.addStack();
div1.backgroundColor = new Color("#ffffff", 0.06);
div1.size = new Size(0, 0.5);
widget.addSpacer(8);

// ── Helper: render a quest section ─────────────────────────────────────────
function addSectionHeader(w, title, count, color) {
  const row = w.addStack();
  row.layoutHorizontally();
  const t = row.addText(title);
  t.textColor = color;
  t.font = Font.boldSystemFont(9);
  row.addSpacer();
  const c = row.addText(`${count} remaining`);
  c.textColor = C.text3;
  c.font = Font.systemFont(9);
}

function addQuestRows(w, quests, accentColor, maxRows) {
  if (quests.length === 0) {
    const empty = w.addText("All clear! ✓");
    empty.textColor = C.text3;
    empty.font = Font.italicSystemFont(11);
    return;
  }
  const visible = quests.slice(0, maxRows);
  for (const q of visible) {
    const row = w.addStack();
    row.layoutHorizontally();
    row.centerAlignContent();
    row.spacing = 5;
    row.setPadding(2, 0, 2, 0);

    const dot = row.addText("◆");
    dot.textColor = accentColor;
    dot.font = Font.systemFont(7);

    const nameStack = row.addStack();
    const name = nameStack.addText(q.name);
    name.textColor = C.text;
    name.font = Font.systemFont(12);
    name.lineLimit = 1;
    row.addSpacer();

    if (q.parts > 1) {
      const prog = row.addText(`${q.progress}/${q.parts}  `);
      prog.textColor = C.text3;
      prog.font = Font.systemFont(10);
    }

    const badge = row.addText(`+${q.xp} XP`);
    badge.textColor = accentColor;
    badge.font = Font.boldSystemFont(10);
  }
  if (quests.length > maxRows) {
    widget.addSpacer(2);
    const more = w.addText(`+${quests.length - maxRows} more…`);
    more.textColor = C.text3;
    more.font = Font.italicSystemFont(10);
  }
}

// ── Daily Quests section ───────────────────────────────────────────────────
addSectionHeader(widget, "🌅  DAILY QUESTS", pendingDailies.length, C.dawn);
widget.addSpacer(5);
addQuestRows(widget, pendingDailies, C.dawn, 3);

widget.addSpacer(8);

// ── Divider ────────────────────────────────────────────────────────────────
const div2 = widget.addStack();
div2.backgroundColor = new Color("#ffffff", 0.06);
div2.size = new Size(0, 0.5);
widget.addSpacer(8);

// ── Active Quests section ──────────────────────────────────────────────────
addSectionHeader(widget, "⚔  ACTIVE QUESTS", pendingActives.length, C.gold);
widget.addSpacer(5);
addQuestRows(widget, pendingActives, C.gold, 2);

// ── Footer ─────────────────────────────────────────────────────────────────
if (data.exportedAt) {
  widget.addSpacer(6);
  const fmt = new DateFormatter();
  fmt.dateFormat = "MMM d 'at' h:mm a";
  const footer = widget.addText("Synced " + fmt.string(new Date(data.exportedAt)));
  footer.textColor = C.text3;
  footer.font = Font.italicSystemFont(9);
}

Script.setWidget(widget);
Script.complete();
widget.presentMedium();
