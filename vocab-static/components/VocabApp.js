"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { PASSAGES } from "../data/database";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const CARD_COLORS = [
  { bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.28)",   acc: "#22c55e" },
  { bg: "rgba(56,189,248,0.08)",  border: "rgba(56,189,248,0.28)",  acc: "#38bdf8" },
  { bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.28)",  acc: "#f97316" },
  { bg: "rgba(236,72,153,0.08)",  border: "rgba(236,72,153,0.28)",  acc: "#ec4899" },
  { bg: "rgba(234,179,8,0.08)",   border: "rgba(234,179,8,0.28)",   acc: "#eab308" },
  { bg: "rgba(124,106,247,0.08)", border: "rgba(124,106,247,0.28)", acc: "#a78bfa" },
  { bg: "rgba(20,184,166,0.08)",  border: "rgba(20,184,166,0.28)",  acc: "#14b8a6" },
  { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.28)", acc: "#f87171" },
];

const LEVELS = { intermediate: { c: "#22c55e", bg: "rgba(34,197,94,0.1)",  b: "rgba(34,197,94,0.3)"  },
                 upper:        { c: "#38bdf8", bg: "rgba(56,189,248,0.1)",  b: "rgba(56,189,248,0.3)"  },
                 advanced:     { c: "#f97316", bg: "rgba(249,115,22,0.1)",  b: "rgba(249,115,22,0.3)"  } };

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function speak(word) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US"; u.rate = 0.82;
  window.speechSynthesis.speak(u);
}

function ls_get(key, def) {
  if (typeof window === "undefined") return def;
  try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; }
}
function ls_set(key, val) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(val));
}

/* ─────────────────────────────────────────────
   SMALL UI COMPONENTS
───────────────────────────────────────────── */
function GradText({ children, from, to, size = 19, serif = false, style = {} }) {
  return (
    <span style={{ fontFamily: serif ? "'Playfair Display',serif" : "'DM Sans',sans-serif", fontSize: size, fontWeight: 700, background: `linear-gradient(90deg,${from},${to})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "inline-block", ...style }}>
      {children}
    </span>
  );
}

function Btn({ children, onClick, variant = "default", size = "md", style = {} }) {
  const variants = {
    default: { border: "1px solid #26264a",                    bg: "#13131f",                   color: "#e8e8f0" },
    green:   { border: "1px solid rgba(34,197,94,0.45)",       bg: "rgba(34,197,94,0.10)",      color: "#22c55e" },
    orange:  { border: "1px solid rgba(249,115,22,0.45)",      bg: "rgba(249,115,22,0.10)",     color: "#f97316" },
    sky:     { border: "1px solid rgba(56,189,248,0.45)",      bg: "rgba(56,189,248,0.10)",     color: "#38bdf8" },
    purple:  { border: "1px solid rgba(124,106,247,0.45)",     bg: "rgba(124,106,247,0.10)",    color: "#a78bfa" },
    yellow:  { border: "1px solid rgba(234,179,8,0.45)",       bg: "rgba(234,179,8,0.10)",      color: "#eab308" },
  };
  const v = variants[variant] || variants.default;
  const pad = size === "sm" ? "5px 11px" : size === "lg" ? "12px 22px" : "9px 16px";
  const fs  = size === "sm" ? 11 : size === "lg" ? 15 : 13;
  return (
    <button onClick={onClick} style={{ padding: pad, borderRadius: 9, border: v.border, background: v.bg, color: v.color, fontSize: fs, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "inline-flex", alignItems: "center", gap: 5, transition: "opacity .15s", ...style }}>
      {children}
    </button>
  );
}

function SecHeader({ icon, title, sub, from, to, ibg, ib }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, marginTop: 22 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: ibg, border: `1px solid ${ib}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{icon}</div>
      <div>
        <GradText from={from} to={to} size={18} serif>{title}</GradText>
        <div style={{ fontSize: 11, color: "#64648a", marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "9px 0" }} />;
}

/* ─────────────────────────────────────────────
   WORD MODAL
───────────────────────────────────────────── */
function WordModal({ entry, onClose, isSaved, onToggleSave }) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!entry) return null;

  const handleSpeak = () => {
    setPlaying(true);
    speak(entry.word);
    setTimeout(() => setPlaying(false), 2200);
  };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="animate-slide" style={{ background: "#1a1a2e", border: "1px solid #33335a", borderRadius: 20, padding: "26px 24px", maxWidth: 460, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Word title */}
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, fontWeight: 700, color: "#e8e8f0", marginBottom: 2 }}>{entry.word}</div>

        {/* English */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#64648a", marginBottom: 5 }}>🇬🇧 English Definition</div>
          <div style={{ fontSize: 14, color: "#d0d0e8", lineHeight: 1.65 }}>{entry.en}</div>
        </div>

        <Divider />

        {/* Uzbek */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#64648a", marginBottom: 5 }}>🇺🇿 O'zbekcha tarjima</div>
          <div style={{ fontSize: 13, color: "#6ee7b7", fontStyle: "italic", lineHeight: 1.6 }}>{entry.uz}</div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 22, flexWrap: "wrap" }}>
          <button onClick={handleSpeak} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 9, border: `1px solid ${playing ? "rgba(34,197,94,0.4)" : "rgba(56,189,248,0.4)"}`, background: playing ? "rgba(34,197,94,0.08)" : "rgba(56,189,248,0.08)", color: playing ? "#22c55e" : "#38bdf8", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            🔊 {playing ? "Playing..." : "Listen"}
          </button>
          <button onClick={onToggleSave} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 9, border: `1px solid ${isSaved ? "rgba(234,179,8,0.4)" : "rgba(249,115,22,0.4)"}`, background: isSaved ? "rgba(234,179,8,0.08)" : "rgba(249,115,22,0.08)", color: isSaved ? "#eab308" : "#f97316", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            {isSaved ? "★ Saqlangan" : "⭐ Saqlash"}
          </button>
          <button onClick={onClose} style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid #26264a", background: "transparent", color: "#64648a", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            ✕ Yopish
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   READ TAB
───────────────────────────────────────────── */
function ReadTab({ savedWords, onToggleSave }) {
  const [passage, setPassage] = useState(PASSAGES[0]);
  const [lang, setLang]       = useState("uz");
  const [showTrans, setShowTrans] = useState(false);
  const [modalEntry, setModalEntry] = useState(null);
  const passageRef = useRef(null);

  const savedSet = new Set(savedWords.map((w) => w.word.toLowerCase()));
  const lv = LEVELS[passage.level] || LEVELS.intermediate;

  const selectPassage = (p) => {
    setPassage(p);
    setShowTrans(false);
    setModalEntry(null);
    setTimeout(() => passageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  /* Render passage with clickable words */
  const renderText = (text) =>
    text.split(/(\s+)/).map((chunk, i) => {
      const clean = chunk.replace(/[^a-zA-Z']/g, "");
      const entry = passage.vocabulary.find((v) => v.word.toLowerCase() === clean.toLowerCase());
      if (entry) {
        return (
          <span key={i} onClick={() => setModalEntry(entry)} style={{ background: "rgba(124,106,247,0.15)", borderRadius: 3, padding: "0 2px", cursor: "pointer", borderBottom: "2px solid rgba(124,106,247,0.6)", transition: "background .15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(124,106,247,0.3)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(124,106,247,0.15)")}>
            {chunk}
          </span>
        );
      }
      return chunk;
    });

  return (
    <div>
      {/* ── Passage grid ── */}
      <SecHeader icon="📚" title="Passaj tanlang" sub={`30 ta passaj · Intermediate → Advanced`} from="#22c55e" to="#14b8a6" ibg="rgba(34,197,94,0.12)" ib="rgba(34,197,94,0.3)" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(145px,1fr))", gap: 7, maxHeight: 215, overflowY: "auto", marginBottom: 20 }}>
        {PASSAGES.map((p) => {
          const lc = LEVELS[p.level] || LEVELS.intermediate;
          const active = passage.id === p.id;
          return (
            <div key={p.id} onClick={() => selectPassage(p)}
              style={{ padding: "9px 11px", background: active ? "rgba(34,197,94,0.06)" : "#13131f", border: `1px solid ${active ? "#22c55e" : "#26264a"}`, borderRadius: 9, cursor: "pointer", transition: "all .15s" }}>
              <div style={{ fontSize: 9, color: lc.c, marginBottom: 3, fontFamily: "DM Mono,monospace", fontWeight: 600 }}>#{p.id} · {p.level}</div>
              <div style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.3, color: active ? "#e8e8f0" : "#a0a0b8" }}>{p.title}</div>
            </div>
          );
        })}
      </div>

      {/* ── Passage header ── */}
      <div ref={passageRef} style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, flexWrap: "wrap" }}>
          <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase", fontFamily: "DM Mono,monospace", background: lv.bg, color: lv.c, border: `1px solid ${lv.b}` }}>
            {passage.level}
          </span>
          <span style={{ fontSize: 11, color: "#64648a", fontFamily: "DM Mono,monospace" }}>#{passage.id}</span>
        </div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, marginBottom: 13, background: "linear-gradient(90deg,#e8e8f0,#9090b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {passage.title}
        </div>
        {/* Translate buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["uz", "ru"].map((l) => (
            <button key={l} onClick={() => { setLang(l); setShowTrans(true); }}
              style={{ padding: "8px 16px", borderRadius: 9, border: `1px solid ${lang === l && showTrans ? "rgba(56,189,248,0.5)" : "#26264a"}`, background: lang === l && showTrans ? "rgba(56,189,248,0.10)" : "#13131f", color: lang === l && showTrans ? "#38bdf8" : "#a0a0b8", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all .15s" }}>
              {l === "uz" ? "🇺🇿 O'zbek" : "🇷🇺 Русский"}
            </button>
          ))}
          {showTrans && (
            <button onClick={() => setShowTrans(false)}
              style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid #26264a", background: "transparent", color: "#64648a", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
              ✕ Yopish
            </button>
          )}
        </div>
      </div>

      {/* ── Passage text ── */}
      <div style={{ background: "#1a1a2e", border: "1px solid #26264a", borderRadius: 14, padding: 20, lineHeight: 1.95, fontSize: 15, color: "#c0c0d8", marginBottom: 4 }}>
        {renderText(passage.text)}
        <div style={{ marginTop: 10, fontSize: 11, color: "#44446a", fontStyle: "italic" }}>
          💡 Tagida chiziq bor so'zlarga bosing → ta'rif chiqadi
        </div>
      </div>

      {/* ── Translation ── */}
      {showTrans && (
        <div className="animate-fade" style={{ background: lang === "uz" ? "rgba(34,197,94,0.05)" : "rgba(56,189,248,0.05)", border: `1px solid ${lang === "uz" ? "rgba(34,197,94,0.2)" : "rgba(56,189,248,0.2)"}`, borderRadius: 14, padding: 20, marginTop: 10, lineHeight: 1.9, fontSize: 14, color: lang === "uz" ? "#6ee7b7" : "#93c5fd" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#64648a", marginBottom: 10 }}>
            {lang === "uz" ? "🇺🇿 O'zbekcha tarjima" : "🇷🇺 Русский перевод"}
          </div>
          {lang === "uz" ? passage.translation_uz : passage.translation_ru}
        </div>
      )}

      {/* ── Vocabulary cards ── */}
      <SecHeader icon="✨" title="Key Vocabulary" sub="Bosing → ta'rif · 🔊 Tinglash · ⭐ Saqlash" from="#f97316" to="#eab308" ibg="rgba(249,115,22,0.12)" ib="rgba(249,115,22,0.3)" />
      {passage.vocabulary.map((v, i) => {
        const col = CARD_COLORS[i % CARD_COLORS.length];
        const saved = savedSet.has(v.word.toLowerCase());
        return (
          <div key={v.word} className="animate-fade" style={{ background: col.bg, border: `1px solid ${col.border}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
            {/* Word row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 21, fontWeight: 700, color: col.acc, cursor: "pointer" }} onClick={() => setModalEntry(v)}>
                {v.word}
              </span>
              <button onClick={() => { speak(v.word); }}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(56,189,248,0.3)", background: "rgba(56,189,248,0.07)", color: "#38bdf8", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>
                🔊 Listen
              </button>
            </div>

            {/* English */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: col.acc, marginBottom: 3 }}>🇬🇧 English</div>
              <div style={{ fontSize: 13, color: "#d0d0e8", lineHeight: 1.55 }}>{v.en}</div>
            </div>

            <Divider />

            {/* Uzbek */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#22c55e", marginBottom: 3 }}>🇺🇿 O'zbekcha</div>
              <div style={{ fontSize: 13, color: "#6ee7b7", fontStyle: "italic", lineHeight: 1.5 }}>{v.uz}</div>
            </div>

            {/* Save */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => onToggleSave(v)}
                style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${saved ? "rgba(234,179,8,0.5)" : "#26264a"}`, background: "transparent", color: saved ? "#eab308" : "#64648a", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {saved ? "★" : "☆"}
              </button>
            </div>
          </div>
        );
      })}

      {/* Word modal */}
      {modalEntry && (
        <WordModal
          entry={modalEntry}
          onClose={() => setModalEntry(null)}
          isSaved={savedSet.has(modalEntry.word.toLowerCase())}
          onToggleSave={() => onToggleSave(modalEntry)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   FLASHCARDS TAB
───────────────────────────────────────────── */
function FlashcardsTab({ savedWords, onToggleSave }) {
  const [deck, setDeck]       = useState([]);
  const [idx, setIdx]         = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [learned, setLearned] = useState(() => ls_get("etr_learned", []));

  useEffect(() => {
    const shuffled = [...savedWords].sort(() => Math.random() - 0.5);
    setDeck(shuffled); setIdx(0); setFlipped(false);
  }, [savedWords]);

  const card   = deck[idx];
  const prog   = deck.length ? ((idx + 1) / deck.length) * 100 : 0;
  const isLearned = card ? learned.includes(card.word.toLowerCase()) : false;

  const rate = (r) => {
    if (r === "easy" && card && !isLearned) {
      const u = [...learned, card.word.toLowerCase()];
      setLearned(u); ls_set("etr_learned", u);
    }
    setFlipped(false);
    setTimeout(() => setIdx((i) => (i + 1) % Math.max(deck.length, 1)), 120);
  };

  const shuffle = () => {
    setDeck([...savedWords].sort(() => Math.random() - 0.5));
    setIdx(0); setFlipped(false);
  };

  return (
    <div>
      <SecHeader icon="🃏" title="Flashcard Review" sub="Kartani bosib ag'daring · Hard / Ok / Easy" from="#22c55e" to="#14b8a6" ibg="rgba(34,197,94,0.12)" ib="rgba(34,197,94,0.3)" />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        {/* Progress */}
        <div style={{ width: "100%", maxWidth: 500, height: 4, background: "#26264a", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${prog}%`, height: "100%", background: "linear-gradient(90deg,#22c55e,#14b8a6)", transition: "width .4s ease" }} />
        </div>
        <div style={{ fontSize: 11, color: "#64648a", fontFamily: "DM Mono,monospace" }}>
          {deck.length ? `${idx + 1} / ${deck.length}` : "0 / 0"}
        </div>

        {/* Card */}
        <div onClick={() => deck.length && setFlipped((f) => !f)}
          style={{ width: "100%", maxWidth: 500, height: 280, cursor: deck.length ? "pointer" : "default", perspective: 1000 }}>
          <div style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d", transition: "transform .55s cubic-bezier(.4,0,.2,1)", transform: flipped ? "rotateY(180deg)" : "none" }}>

            {/* Front */}
            <div style={{ position: "absolute", inset: 0, borderRadius: 18, backfaceVisibility: "hidden", background: "#1a1a2e", border: "1px solid #26264a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, textAlign: "center" }}>
              <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#64648a", marginBottom: 14, fontFamily: "DM Mono,monospace" }}>English Word</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 700, background: "linear-gradient(135deg,#e8e8f0,#a0a0d0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 }}>
                {card ? card.word : "So'z yo'q"}
              </div>
              {isLearned && <div style={{ fontSize: 10, color: "#22c55e", marginTop: 4 }}>✅ Learned</div>}
              <div style={{ position: "absolute", bottom: 12, fontSize: 10, color: "#44446a" }}>👆 Bosib ta'rifni ko'ring</div>
            </div>

            {/* Back */}
            <div style={{ position: "absolute", inset: 0, borderRadius: 18, backfaceVisibility: "hidden", background: "linear-gradient(135deg,rgba(34,197,94,0.08),rgba(20,184,166,0.06))", border: "1px solid rgba(34,197,94,0.3)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 26, textAlign: "center", transform: "rotateY(180deg)" }}>
              {card && <>
                <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#64648a", marginBottom: 12, fontFamily: "DM Mono,monospace" }}>Definition</div>
                <div style={{ fontSize: 14, color: "#e8e8f0", lineHeight: 1.6, marginBottom: 10 }}>{card.en}</div>
                <Divider />
                <div style={{ fontSize: 13, color: "#6ee7b7", fontStyle: "italic", lineHeight: 1.5, marginTop: 6 }}>🇺🇿 {card.uz}</div>
                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  <button onClick={(e) => { e.stopPropagation(); speak(card.word); }}
                    style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid rgba(56,189,248,0.35)", background: "rgba(56,189,248,0.07)", color: "#38bdf8", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                    🔊 Listen
                  </button>
                </div>
              </>}
              <div style={{ position: "absolute", bottom: 12, fontSize: 10, color: "#44446a" }}>👆 Orqaga</div>
            </div>
          </div>
        </div>

        {/* Rate buttons */}
        {flipped && deck.length > 0 && (
          <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 500 }}>
            {[
              { id: "hard",   e: "😓", l: "Hard",  bg: "rgba(248,113,113,0.10)", b: "rgba(248,113,113,0.35)", c: "#f87171" },
              { id: "medium", e: "🤔", l: "Ok",    bg: "rgba(234,179,8,0.10)",   b: "rgba(234,179,8,0.35)",   c: "#eab308" },
              { id: "easy",   e: "✅", l: "Easy",  bg: "rgba(34,197,94,0.10)",   b: "rgba(34,197,94,0.35)",   c: "#22c55e" },
            ].map((b) => (
              <button key={b.id} onClick={() => rate(b.id)}
                style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${b.b}`, background: b.bg, color: b.c, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                {b.e} {b.l}
              </button>
            ))}
          </div>
        )}

        {!deck.length && (
          <div style={{ textAlign: "center", padding: "30px 20px", color: "#64648a", fontSize: 13 }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>⭐</div>
            O'qish bo'limida so'zlarni saqlang
          </div>
        )}

        <Btn variant="green" onClick={shuffle}>🔄 Aralashtirish</Btn>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   QUIZ TAB
───────────────────────────────────────────── */
function QuizTab({ savedWords }) {
  const allVocab = PASSAGES.flatMap((p) => p.vocabulary);
  const [q, setQ]           = useState(null);
  const [answered, setAns]  = useState(null);
  const [score, setScore]   = useState({ correct: 0, wrong: 0, total: 0 });
  const [mode, setMode]     = useState("all"); // "all" | "saved"

  const pool = mode === "saved" ? savedWords : allVocab;

  const generateQ = useCallback(() => {
    if (pool.length < 4) return;
    const target = pool[Math.floor(Math.random() * pool.length)];
    const others = allVocab.filter((v) => v.word !== target.word);
    const distractors = others.sort(() => Math.random() - 0.5).slice(0, 3).map((v) => v.en);
    const options = [target.en, ...distractors].sort(() => Math.random() - 0.5);
    setQ({ word: target.word, uz: target.uz, correct: target.en, options });
    setAns(null);
  }, [pool, allVocab]);

  useEffect(() => { generateQ(); }, [mode]);

  const answer = (opt) => {
    if (answered) return;
    const ok = opt === q.correct;
    setAns({ selected: opt, ok });
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), wrong: s.wrong + (ok ? 0 : 1), total: s.total + 1 }));
  };

  return (
    <div>
      <SecHeader icon="🧠" title="Vocabulary Quiz" sub="Bilimingizni sinab ko'ring!" from="#f97316" to="#eab308" ibg="rgba(249,115,22,0.12)" ib="rgba(249,115,22,0.3)" />

      {/* Mode selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {[{ id: "all", l: "🌐 Barcha so'zlar" }, { id: "saved", l: "⭐ Saqlangan" }].map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)}
            style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${mode === m.id ? "rgba(249,115,22,0.5)" : "#26264a"}`, background: mode === m.id ? "rgba(249,115,22,0.10)" : "#13131f", color: mode === m.id ? "#f97316" : "#64648a", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            {m.l}
          </button>
        ))}
      </div>

      {/* Score */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
        {[{ n: score.correct, l: "To'g'ri", c: "#22c55e" }, { n: score.wrong, l: "Noto'g'ri", c: "#f87171" }, { n: score.total, l: "Jami", c: "#f97316" }].map(({ n, l, c }) => (
          <div key={l} style={{ padding: "10px 16px", background: "#1a1a2e", border: "1px solid #26264a", borderRadius: 11, textAlign: "center", minWidth: 72 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: c }}>{n}</div>
            <div style={{ fontSize: 10, color: "#64648a", textTransform: "uppercase", marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      {pool.length < 4 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#64648a" }}>
          <div style={{ fontSize: 34, marginBottom: 12 }}>📝</div>
          <div style={{ fontSize: 16, fontFamily: "'Playfair Display',serif", color: "#e8e8f0", marginBottom: 6 }}>
            {mode === "saved" ? "Kamida 4 ta so'z saqlang" : "So'zlar topilmadi"}
          </div>
        </div>
      ) : q && (
        <div className="animate-fade" style={{ background: "#1a1a2e", border: "1px solid #26264a", borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#f97316", fontFamily: "DM Mono,monospace", marginBottom: 12 }}>
            🎯 Definition Match
          </div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 21, lineHeight: 1.4, marginBottom: 6 }}>
            "<strong style={{ color: "#f97316" }}>{q.word}</strong>" qanday ma'noni anglatadi?
          </div>
          {q.uz && (
            <div style={{ fontSize: 12, color: "#6ee7b7", fontStyle: "italic", marginBottom: 16 }}>🇺🇿 {q.uz}</div>
          )}
          <div style={{ display: "grid", gap: 8 }}>
            {q.options.map((opt, i) => {
              let bg = "#13131f", border = "#26264a", col = "#e8e8f0";
              if (answered) {
                if (opt === q.correct) { bg = "rgba(34,197,94,0.09)"; border = "#22c55e"; col = "#22c55e"; }
                else if (opt === answered.selected) { bg = "rgba(248,113,113,0.09)"; border = "#f87171"; col = "#f87171"; }
              }
              return (
                <button key={i} disabled={!!answered} onClick={() => answer(opt)}
                  style={{ padding: "12px 16px", borderRadius: 11, border: `1px solid ${border}`, background: bg, color: col, fontSize: 13, textAlign: "left", cursor: answered ? "default" : "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 10, transition: "all .15s" }}>
                  <span style={{ width: 22, height: 22, borderRadius: 5, border: `1px solid ${col}`, opacity: 0.7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, fontFamily: "DM Mono,monospace", flexShrink: 0 }}>
                    {["A", "B", "C", "D"][i]}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
          {answered && (
            <div style={{ marginTop: 14, padding: "13px 16px", borderRadius: 11, background: answered.ok ? "rgba(34,197,94,0.09)" : "rgba(248,113,113,0.09)", border: `1px solid ${answered.ok ? "rgba(34,197,94,0.3)" : "rgba(248,113,113,0.3)"}`, color: answered.ok ? "#22c55e" : "#f87171", fontSize: 13 }}>
              {answered.ok ? "✅ To'g'ri!" : `❌ Noto'g'ri.`}
              {!answered.ok && <div style={{ marginTop: 4, fontSize: 12 }}>To'g'ri: {q.correct}</div>}
            </div>
          )}
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Btn variant="orange" onClick={generateQ}>Keyingi savol →</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SAVED TAB
───────────────────────────────────────────── */
function SavedTab({ savedWords, onToggleSave }) {
  const learnedSet = new Set(ls_get("etr_learned", []));
  const [search, setSearch] = useState("");

  const filtered = savedWords.filter((w) =>
    w.word.toLowerCase().includes(search.toLowerCase()) ||
    w.en.toLowerCase().includes(search.toLowerCase())
  );

  const exportWords = () => {
    const txt = savedWords.map((w) => `${w.word}\nEN: ${w.en}\nUZ: ${w.uz}\n`).join("\n---\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([txt], { type: "text/plain" })),
      download: "my-vocabulary.txt",
    });
    a.click();
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 4 }}>
        <SecHeader icon="⭐" title="Mening So'zlarim" sub={savedWords.length ? `${savedWords.length} ta so'z · ${learnedSet.size} ta o'rganilgan` : "Hali so'z yo'q"} from="#38bdf8" to="#14b8a6" ibg="rgba(56,189,248,0.12)" ib="rgba(56,189,248,0.3)" />
        {savedWords.length > 0 && <Btn variant="default" size="sm" onClick={exportWords}>📤 Export</Btn>}
      </div>

      {savedWords.length > 0 && (
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍  So'z qidirish..."
          style={{ width: "100%", padding: "9px 14px", borderRadius: 9, border: "1px solid #26264a", background: "#13131f", color: "#e8e8f0", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", marginBottom: 14 }}
        />
      )}

      {!savedWords.length ? (
        <div style={{ textAlign: "center", padding: "48px 20px", color: "#64648a" }}>
          <div style={{ fontSize: 38, marginBottom: 12 }}>⭐</div>
          <div style={{ fontSize: 17, fontFamily: "'Playfair Display',serif", color: "#e8e8f0", marginBottom: 6 }}>So'z yo'q</div>
          <div style={{ fontSize: 13 }}>O'qish bo'limida vocabularydan ⭐ bosib so'z saqlang.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
          {filtered.map((w, i) => {
            const isLearned = learnedSet.has(w.word.toLowerCase());
            const col = CARD_COLORS[i % CARD_COLORS.length];
            return (
              <div key={w.word} style={{ background: "#1a1a2e", border: "1px solid #26264a", borderRadius: 12, padding: 16, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: col.acc }} />
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 700, color: col.acc, marginBottom: 4 }}>{w.word}</div>
                <div style={{ fontSize: 12, color: "#a0a0c0", lineHeight: 1.5, marginBottom: 6 }}>{w.en}</div>
                <div style={{ fontSize: 11, color: "#6ee7b7", fontStyle: "italic", marginBottom: 10, lineHeight: 1.4 }}>🇺🇿 {w.uz}</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                  {isLearned && <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 10, fontFamily: "DM Mono,monospace", background: "rgba(56,189,248,0.09)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.2)" }}>✅ learned</span>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => speak(w.word)}
                    style={{ padding: "4px 9px", borderRadius: 6, border: "1px solid rgba(56,189,248,0.3)", background: "rgba(56,189,248,0.07)", color: "#38bdf8", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                    🔊
                  </button>
                  <button onClick={() => onToggleSave(w)}
                    style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #26264a", background: "transparent", color: "#64648a", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
export default function VocabApp() {
  const [tab, setTab]             = useState("read");
  const [savedWords, setSavedWords] = useState(() => ls_get("etr_saved", []));
  const [streak, setStreak]       = useState(0);

  /* Streak */
  useEffect(() => {
    const today = new Date().toDateString();
    const last  = localStorage.getItem("etr_last_visit");
    let s = parseInt(localStorage.getItem("etr_streak") || "0");
    if (last !== today) {
      s = last === new Date(Date.now() - 86400000).toDateString() ? s + 1 : 1;
      localStorage.setItem("etr_streak", String(s));
      localStorage.setItem("etr_last_visit", today);
    }
    setStreak(s);
  }, []);

  const toggleSave = useCallback((entry) => {
    setSavedWords((prev) => {
      const exists = prev.some((w) => w.word.toLowerCase() === entry.word.toLowerCase());
      const updated = exists
        ? prev.filter((w) => w.word.toLowerCase() !== entry.word.toLowerCase())
        : [...prev, { word: entry.word, en: entry.en, uz: entry.uz }];
      ls_set("etr_saved", updated);
      return updated;
    });
  }, []);

  const learnedCount = ls_get("etr_learned", []).length;

  const TABS = [
    { id: "read",       label: "📖 O'qish"   },
    { id: "flashcards", label: "🃏 Kartalar"  },
    { id: "quiz",       label: "🧠 Quiz"     },
    { id: "saved",      label: "⭐ So'zlar"   },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d14", color: "#e8e8f0", fontFamily: "'DM Sans',sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(13,13,20,0.97)", borderBottom: "1px solid #26264a", padding: "12px 16px 10px", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#7c6af7,#f97316)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>📖</div>
          <div>
            <GradText from="#a78bfa" to="#fb923c" size={15} serif>English Through Reading</GradText>
            <div style={{ fontSize: 10, color: "#64648a", textTransform: "uppercase", letterSpacing: "0.5px" }}>Vocabulary Master</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
          {[
            { dot: "#22c55e", label: `${savedWords.length} saved`         },
            { dot: "#38bdf8", label: `${learnedCount} learned`            },
            { dot: "#f97316", label: `${streak} day streak`               },
            { dot: "#a78bfa", label: `${PASSAGES.length} passages`        },
          ].map(({ dot, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "#13131f", border: "1px solid #26264a", borderRadius: 20, fontSize: 11, fontFamily: "DM Mono,monospace", whiteSpace: "nowrap", flexShrink: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: dot }} />{label}
            </div>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "14px 14px 50px" }}>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, background: "#13131f", border: "1px solid #26264a", borderRadius: 12, padding: 3, marginBottom: 16, overflowX: "auto", scrollbarWidth: "none" }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: "9px 6px", borderRadius: 9, border: "none", background: tab === t.id ? "#1a1a2e" : "transparent", color: tab === t.id ? "#e8e8f0" : "#64648a", fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s", boxShadow: tab === t.id ? "0 2px 8px rgba(0,0,0,0.4)" : "none" }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "read"       && <ReadTab       savedWords={savedWords} onToggleSave={toggleSave} />}
        {tab === "flashcards" && <FlashcardsTab savedWords={savedWords} onToggleSave={toggleSave} />}
        {tab === "quiz"       && <QuizTab       savedWords={savedWords} />}
        {tab === "saved"      && <SavedTab      savedWords={savedWords} onToggleSave={toggleSave} />}
      </div>
    </div>
  );
}
