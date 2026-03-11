import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SEV_CLR = { low:"#22c55e", medium:"#f97316", high:"#ef4444", critical:"#a855f7" };
const STA_CLR = { heavy:"#ef4444", moderate:"#f97316", clear:"#22c55e" };
const ADS = [
  { bg:"linear-gradient(135deg,#0d1f3c,#0a2a4a)", accent:"#00d4ff", brand:"Hertz Global",     text:"Rent smart, drive local",       sub:"Book now in 180+ countries →" },
  { bg:"linear-gradient(135deg,#0a1628,#132240)", accent:"#34d399", brand:"TomTom Premium",   text:"Real-time maps, zero ads",       sub:"Upgrade your navigation →" },
  { bg:"linear-gradient(135deg,#160d2c,#1e1040)", accent:"#f59e0b", brand:"eDriving Insure",  text:"Instant global road cover",      sub:"Get a quote in 60 sec →" },
  { bg:"linear-gradient(135deg,#0f1f0a,#152810)", accent:"#86efac", brand:"GreenRide Co.",    text:"Carbon-neutral fleet near you",  sub:"Offset your drive today →" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
async function reverseGeocode(lat, lon) {
  const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
  const d = await r.json();
  return {
    city:        d.address?.city || d.address?.town || d.address?.village || d.address?.county || "Unknown City",
    country:     d.address?.country || "Unknown Country",
    countryCode: (d.address?.country_code || "XX").toUpperCase(),
    lat, lon,
  };
}

async function callClaude(prompt, sys) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      model:"claude-sonnet-4-20250514", max_tokens:2000,
      system: sys || "You are a traffic data API. Respond ONLY with valid compact JSON, no markdown, no backticks, no trailing commas.",
      messages:[{ role:"user", content:prompt }]
    })
  });
  const data = await res.json();
  const text = (data.content||[]).map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
  return JSON.parse(text);
}

// ─── TINY SHARED COMPONENTS ───────────────────────────────────────────────────
function AdBanner({ idx=0 }) {
  const ad = ADS[idx % ADS.length];
  return (
    <div style={{ background:ad.bg, borderRadius:14, padding:"11px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", border:`1px solid ${ad.accent}28`, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, opacity:0.025, backgroundImage:"radial-gradient(#fff 1px,transparent 1px)", backgroundSize:"14px 14px" }}/>
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
          <span style={{ fontSize:8, color:ad.accent, border:`1px solid ${ad.accent}`, padding:"1px 5px", borderRadius:3, fontFamily:"monospace", letterSpacing:1 }}>AD</span>
          <span style={{ fontSize:10, color:"#64748b", fontWeight:600 }}>{ad.brand}</span>
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:"#f1f5f9" }}>{ad.text}</div>
        <div style={{ fontSize:10, color:ad.accent, marginTop:2 }}>{ad.sub}</div>
      </div>
      <button style={{ background:ad.accent, color:"#000", border:"none", borderRadius:8, padding:"7px 13px", fontSize:11, fontWeight:800, cursor:"pointer", flexShrink:0 }}>Open</button>
    </div>
  );
}
function Skel({ h=60, mb=10 }) {
  return <div style={{ background:"linear-gradient(90deg,#0a1525,#132240,#0a1525)", backgroundSize:"200%", borderRadius:12, height:h, animation:"shimmer 1.5s infinite", marginBottom:mb }}/>;
}
function Tag({ children, color="#00d4ff" }) {
  return <span style={{ background:color+"18", border:`1px solid ${color}40`, color, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, whiteSpace:"nowrap" }}>{children}</span>;
}
function Pill({ children, active, onClick, color="#00d4ff" }) {
  return <button onClick={onClick} style={{ background:active?color:"#0a1525", border:`1px solid ${active?color:color+"28"}`, color:active?"#000":color+"99", borderRadius:99, padding:"6px 14px", fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, transition:"all 0.2s" }}>{children}</button>;
}

// ─── TRAFFIC TAB ──────────────────────────────────────────────────────────────
function TrafficTab({ location, data, loading }) {
  if (loading) return <div>{[90,12,55,10,55,10,55,10].map((h,i)=><Skel key={i} h={h} mb={8}/>)}</div>;
  if (!data) return null;
  const { congestion, hotspots, summary } = data;
  const cColor = congestion>70?"#ef4444":congestion>45?"#f97316":"#22c55e";
  return (
    <div>
      <div style={{ background:"linear-gradient(135deg,#0c1a2e,#0f2340)", border:"1px solid #00d4ff20", borderRadius:18, padding:18, marginBottom:16, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:140, height:140, borderRadius:"50%", background:"#00d4ff06", border:"1px solid #00d4ff12" }}/>
        <div style={{ fontSize:10, color:"#00d4ff", fontWeight:700, letterSpacing:1, marginBottom:6 }}>📍 {location.city}, {location.country}</div>
        <div style={{ display:"flex", gap:16, alignItems:"flex-end", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:54, fontWeight:900, color:cColor, lineHeight:1 }}>{congestion}<span style={{ fontSize:16, color:"#334155" }}>%</span></div>
            <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>City Congestion Index</div>
          </div>
          <div style={{ flex:1, fontSize:12, color:"#64748b", lineHeight:1.6, paddingBottom:4 }}>{summary}</div>
        </div>
        <div style={{ background:"#061220", borderRadius:12, height:140, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, opacity:0.05, backgroundImage:"repeating-linear-gradient(0deg,#00d4ff 0,#00d4ff 1px,transparent 0,transparent 36px),repeating-linear-gradient(90deg,#00d4ff 0,#00d4ff 1px,transparent 0,transparent 36px)" }}/>
          {(hotspots||[]).map((h,i)=>{
            const px=[{l:"34%",t:"50%"},{l:"58%",t:"28%"},{l:"20%",t:"68%"},{l:"70%",t:"60%"},{l:"48%",t:"18%"},{l:"80%",t:"42%"},{l:"12%",t:"36%"},{l:"63%",t:"80%"}];
            const p=px[i%px.length]; const c=h.level>70?"#ef4444":h.level>45?"#f97316":"#22c55e";
            return <div key={i} style={{ position:"absolute", left:p.l, top:p.t, transform:"translate(-50%,-50%)" }}>
              <div style={{ width:8+h.level/11, height:8+h.level/11, borderRadius:"50%", background:c, boxShadow:`0 0 ${h.level/7}px ${c}`, animation:h.level>65?"pulse 2s infinite":"none" }}/>
            </div>;
          })}
          <div style={{ position:"absolute", bottom:8, left:10, fontSize:9, color:"#1a3a5a" }}>{location.city} Metro</div>
        </div>
      </div>
      <div style={{ fontSize:11, fontWeight:700, color:"#334155", marginBottom:10, letterSpacing:1 }}>LIVE HOTSPOTS</div>
      {(hotspots||[]).map((h,i)=>{
        const c=h.level>70?"#ef4444":h.level>45?"#f97316":"#22c55e";
        return <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <span style={{ fontSize:9, color:c, width:12 }}>{h.trend==="up"?"↑":h.trend==="down"?"↓":"→"}</span>
          <div style={{ fontSize:12, color:"#cbd5e1", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h.name}</div>
          <div style={{ width:80, background:"#0a1525", borderRadius:99, height:5 }}>
            <div style={{ width:`${h.level}%`, height:"100%", background:c, borderRadius:99 }}/>
          </div>
          <span style={{ fontSize:11, fontWeight:700, color:c, width:30, textAlign:"right" }}>{h.level}%</span>
        </div>;
      })}
      <div style={{ marginTop:14 }}><AdBanner idx={0}/></div>
    </div>
  );
}

// ─── ROUTES TAB ───────────────────────────────────────────────────────────────
function RoutesTab({ data, loading, onPremium }) {
  const [ex, setEx] = useState(null);
  if (loading) return <div>{[70,70,14,70,70].map((h,i)=><Skel key={i} h={h} mb={10}/>)}</div>;
  return (
    <div>
      <div style={{ fontSize:11, fontWeight:700, color:"#334155", marginBottom:12, letterSpacing:1 }}>ROUTES NEAR YOU</div>
      {(data?.routes||[]).map((r,i)=>(
        <div key={i}>
          <div onClick={()=>setEx(ex===i?null:i)} style={{ background:"#0a1525", border:r.sponsored?"1px solid #f59e0b30":"1px solid #0f2040", borderRadius:14, padding:"14px 16px", marginBottom:10, cursor:"pointer", position:"relative" }}>
            {r.sponsored && <span style={{ position:"absolute", top:10, right:12, fontSize:8, color:"#f59e0b", border:"1px solid #f59e0b44", padding:"1px 6px", borderRadius:3, fontFamily:"monospace", letterSpacing:1 }}>SPONSORED</span>}
            <div style={{ display:"flex", justifyContent:"space-between", gap:8, alignItems:"flex-start" }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9", marginBottom:3 }}>{r.name}</div>
                <div style={{ fontSize:11, color:"#334155" }}>{r.via} · {r.distance}</div>
                {r.sponsored && <div style={{ fontSize:10, color:"#f59e0b", marginTop:3 }}>Suggested by {r.sponsor}</div>}
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontSize:24, fontWeight:900, color:"#f1f5f9", lineHeight:1 }}>{r.eta}<span style={{ fontSize:11, fontWeight:400, color:"#334155" }}> min</span></div>
                <Tag color={STA_CLR[r.status]||"#64748b"}>{r.status}</Tag>
              </div>
            </div>
            {ex===i && r.alt && <div style={{ marginTop:10, background:"#132240", borderRadius:8, padding:"8px 12px", fontSize:12, color:"#94a3b8" }}>💡 Alt: {r.alt}</div>}
            {ex!==i && r.alt && <div style={{ fontSize:10, color:"#00d4ff", marginTop:5 }}>Alt route available ›</div>}
          </div>
          {i===1 && <div style={{ marginBottom:10 }}><AdBanner idx={1}/></div>}
        </div>
      ))}
      <div style={{ background:"#0a1525", border:"1px dashed #0f2040", borderRadius:14, padding:16, textAlign:"center", marginTop:4 }}>
        <div style={{ fontSize:20, marginBottom:6 }}>🔒</div>
        <div style={{ fontWeight:700, color:"#f1f5f9", marginBottom:4 }}>Unlock All Routes</div>
        <div style={{ fontSize:12, color:"#475569", marginBottom:12 }}>Live ETA, voice guidance & ad-free</div>
        <button onClick={onPremium} style={{ background:"linear-gradient(135deg,#00d4ff,#0080ff)", border:"none", borderRadius:10, padding:"10px 24px", color:"#000", fontWeight:800, fontSize:13, cursor:"pointer" }}>Go Pro</button>
      </div>
    </div>
  );
}

// ─── ALERTS TAB ───────────────────────────────────────────────────────────────
function AlertsTab({ data, loading }) {
  if (loading) return <div>{[70,70,70,70].map((h,i)=><Skel key={i} h={h}/>)}</div>;
  const sevC = { high:"#ef4444", medium:"#f97316", low:"#eab308" };
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#334155", letterSpacing:1 }}>LIVE ALERTS</div>
        <span style={{ fontSize:10, color:"#22c55e", border:"1px solid #22c55e44", padding:"2px 8px", borderRadius:99 }}>● Live</span>
      </div>
      {(data?.alerts||[]).map((a,i)=>(
        <div key={i}>
          <div style={{ display:"flex", gap:12, padding:"12px 0", borderBottom:"1px solid #0a1525" }}>
            <span style={{ fontSize:22, flexShrink:0 }}>{a.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, color:"#e2e8f0", lineHeight:1.5 }}>{a.text}</div>
              <div style={{ fontSize:10, color:"#1e3a5a", marginTop:4 }}>{a.time}</div>
            </div>
            <div style={{ width:3, borderRadius:99, background:sevC[a.severity]||"#334155", flexShrink:0 }}/>
          </div>
          {i===1 && <div style={{ padding:"12px 0" }}><AdBanner idx={2}/></div>}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── GOV'T TAB — RULES ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function RulesPanel({ rules, country }) {
  const [open, setOpen] = useState(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const cats = ["all", ...(rules||[]).map(r=>r.category)];
  const filtered = (rules||[]).filter(cat =>
    (catFilter==="all" || cat.category===catFilter) &&
    (search==="" || cat.rules?.some(r=>r.rule?.toLowerCase().includes(search.toLowerCase())||r.note?.toLowerCase().includes(search.toLowerCase())))
  );
  const catColors = ["#00d4ff","#22c55e","#f59e0b","#ef4444","#a855f7","#f97316","#06b6d4"];
  return (
    <div>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#061624,#0a2040)", border:"1px solid #00d4ff18", borderRadius:14, padding:"14px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ fontSize:32 }}>📋</div>
        <div>
          <div style={{ fontSize:10, color:"#00d4ff", fontWeight:700, letterSpacing:1 }}>OFFICIAL ROAD CODE</div>
          <div style={{ fontSize:15, fontWeight:800, color:"#f1f5f9" }}>{country} Traffic Laws</div>
          <div style={{ fontSize:11, color:"#334155" }}>Motor Vehicles Act · Current Edition</div>
        </div>
        <div style={{ marginLeft:"auto" }}><Tag color="#22c55e">IN FORCE</Tag></div>
      </div>

      {/* Search */}
      <div style={{ position:"relative", marginBottom:12 }}>
        <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#334155" }}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search rules…"
          style={{ width:"100%", background:"#0a1525", border:"1px solid #0f2040", borderRadius:10, padding:"10px 14px 10px 36px", color:"#f1f5f9", fontSize:13 }}/>
      </div>

      {/* Category pills */}
      <div style={{ display:"flex", gap:6, overflowX:"auto", marginBottom:16, paddingBottom:4, scrollbarWidth:"none" }}>
        {cats.map((c,i)=><Pill key={c} active={catFilter===c} onClick={()=>setCatFilter(c)} color={i===0?"#00d4ff":catColors[(i-1)%catColors.length]}>{c==="all"?"All":c}</Pill>)}
      </div>

      {/* Rule cards */}
      {filtered.map((cat,ci)=>{
        const cc = catColors[ci % catColors.length];
        const isOpen = open===ci;
        return (
          <div key={ci} style={{ marginBottom:10 }}>
            <div onClick={()=>setOpen(isOpen?null:ci)} style={{ background:"#0a1525", border:`1px solid ${cc}22`, borderRadius:isOpen?"12px 12px 0 0":12, padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:cc+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{cat.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#f1f5f9" }}>{cat.category}</div>
                <div style={{ fontSize:11, color:"#334155", marginTop:2 }}>{cat.rules?.length} rule{cat.rules?.length!==1?"s":""}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {cat.severity && <Tag color={SEV_CLR[cat.severity]||"#64748b"}>{cat.severity}</Tag>}
                <span style={{ color:"#1e3a5a", fontSize:16, transform:isOpen?"rotate(90deg)":"none", transition:"0.2s" }}>›</span>
              </div>
            </div>
            {isOpen && (
              <div style={{ background:"#060f1e", border:`1px solid ${cc}18`, borderTop:"none", borderRadius:"0 0 12px 12px" }}>
                {(cat.rules||[]).map((r,ri)=>(
                  <div key={ri} style={{ padding:"13px 16px", borderBottom:ri<cat.rules.length-1?"1px solid #0a1525":"none" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, color:"#e2e8f0", fontWeight:600, lineHeight:1.4 }}>{r.rule}</div>
                        {r.note && <div style={{ fontSize:11, color:"#334155", marginTop:4, lineHeight:1.5 }}>ℹ️ {r.note}</div>}
                        {r.penalty && <div style={{ fontSize:11, color:"#ef4444", marginTop:4 }}>⚠️ Penalty: {r.penalty}</div>}
                      </div>
                      <div style={{ background:cc+"18", border:`1px solid ${cc}35`, borderRadius:8, padding:"4px 10px", fontSize:11, fontWeight:700, color:cc, flexShrink:0, textAlign:"center", maxWidth:100 }}>{r.limit}</div>
                    </div>
                  </div>
                ))}
                {/* Law reference footer */}
                {cat.lawRef && (
                  <div style={{ padding:"10px 16px", background:cc+"08", borderTop:`1px solid ${cc}15`, display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:11, color:cc+"99" }}>📜</span>
                    <span style={{ fontSize:10, color:"#334155" }}>Legal ref: {cat.lawRef}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {filtered.length===0 && (
        <div style={{ textAlign:"center", padding:"40px 20px", color:"#334155" }}>
          <div style={{ fontSize:30, marginBottom:8 }}>🔍</div>
          <div style={{ fontSize:13 }}>No rules match your search</div>
        </div>
      )}

      <div style={{ marginTop:14 }}><AdBanner idx={3}/></div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── GOV'T TAB — FINES ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function FinesPanel({ fines, currency }) {
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcOffense, setCalcOffense] = useState(0);
  const [calcPrior, setCalcPrior] = useState(false);
  const [calcCom, setCalcCom] = useState(false);

  const sevs = ["all","low","medium","high","critical"];
  const filtered = (fines||[]).filter(f=>{
    const ms = (f.violation||"").toLowerCase().includes(search.toLowerCase());
    const mf = sevFilter==="all" || f.severity===sevFilter;
    return ms && mf;
  });

  const calcFine = () => {
    if (!fines?.[calcOffense]) return "—";
    let base = fines[calcOffense].rawAmount || 100;
    if (calcPrior) base *= 2;
    if (calcCom) base *= 1.5;
    return `${currency}${Math.round(base).toLocaleString()}`;
  };

  return (
    <div>
      {/* Header stat bar */}
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {[["critical","#a855f7","🔴 Critical"],["high","#ef4444","🔶 High"],["medium","#f97316","🟡 Medium"],["low","#22c55e","🟢 Low"]].map(([s,c,lbl])=>{
          const cnt = (fines||[]).filter(f=>f.severity===s).length;
          return cnt>0 ? (
            <div key={s} onClick={()=>setSevFilter(sevFilter===s?"all":s)} style={{ flex:1, background:c+"12", border:`1px solid ${c}30`, borderRadius:10, padding:"8px 6px", textAlign:"center", cursor:"pointer", opacity:sevFilter!=="all"&&sevFilter!==s?0.4:1, transition:"opacity 0.2s" }}>
              <div style={{ fontSize:16, fontWeight:900, color:c }}>{cnt}</div>
              <div style={{ fontSize:8, color:c+"99", fontWeight:700, marginTop:1 }}>{s.toUpperCase()}</div>
            </div>
          ) : null;
        })}
      </div>

      {/* Search + Calculator */}
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <div style={{ flex:1, position:"relative" }}>
          <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#334155" }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search violation…"
            style={{ width:"100%", background:"#0a1525", border:"1px solid #0f2040", borderRadius:10, padding:"10px 12px 10px 32px", color:"#f1f5f9", fontSize:12 }}/>
        </div>
        <button onClick={()=>setCalcOpen(!calcOpen)} style={{ background:calcOpen?"#f59e0b":"#0a1525", border:`1px solid ${calcOpen?"#f59e0b":"#0f2040"}`, borderRadius:10, padding:"10px 14px", color:calcOpen?"#000":"#f59e0b", fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
          🧮 Calc
        </button>
      </div>

      {/* Fine calculator panel */}
      {calcOpen && (
        <div style={{ background:"linear-gradient(135deg,#0f1f00,#1a3000)", border:"1px solid #f59e0b25", borderRadius:14, padding:16, marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#f59e0b", marginBottom:12, letterSpacing:0.5 }}>🧮 FINE CALCULATOR</div>
          <div style={{ fontSize:12, color:"#94a3b8", marginBottom:8 }}>Select violation:</div>
          <select value={calcOffense} onChange={e=>setCalcOffense(Number(e.target.value))}
            style={{ width:"100%", background:"#0a1525", border:"1px solid #0f2040", borderRadius:8, padding:"9px 12px", color:"#f1f5f9", fontSize:12, marginBottom:10 }}>
            {(fines||[]).map((f,i)=><option key={i} value={i}>{f.violation}</option>)}
          </select>
          <div style={{ display:"flex", gap:10, marginBottom:12 }}>
            <label style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:"#94a3b8", cursor:"pointer" }}>
              <input type="checkbox" checked={calcPrior} onChange={e=>setCalcPrior(e.target.checked)} style={{ accentColor:"#f59e0b" }}/> Prior offence (×2)
            </label>
            <label style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:"#94a3b8", cursor:"pointer" }}>
              <input type="checkbox" checked={calcCom} onChange={e=>setCalcCom(e.target.checked)} style={{ accentColor:"#f59e0b" }}/> Commercial vehicle (×1.5)
            </label>
          </div>
          <div style={{ background:"#0a1525", borderRadius:10, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:13, color:"#64748b" }}>Estimated Fine</span>
            <span style={{ fontSize:22, fontWeight:900, color:"#f59e0b" }}>{calcFine()}</span>
          </div>
        </div>
      )}

      {/* Severity filter pills */}
      <div style={{ display:"flex", gap:6, overflowX:"auto", marginBottom:14, paddingBottom:4, scrollbarWidth:"none" }}>
        {sevs.map(s=><Pill key={s} active={sevFilter===s} onClick={()=>setSevFilter(s)} color={s==="all"?"#00d4ff":SEV_CLR[s]}>{s==="all"?"All":s.charAt(0).toUpperCase()+s.slice(1)}</Pill>)}
      </div>

      {/* Fine list */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {filtered.map((f,i)=>{
          const c = SEV_CLR[f.severity]||"#64748b";
          const isOpen = selected===i;
          return (
            <div key={i} onClick={()=>setSelected(isOpen?null:i)} style={{ background:"#0a1525", borderLeft:`3px solid ${c}`, border:`1px solid ${c}18`, borderRadius:"0 12px 12px 0", padding:"12px 14px", cursor:"pointer", transition:"background 0.15s" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:20 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#f1f5f9" }}>{f.violation}</div>
                    <div style={{ fontSize:10, color:"#334155", marginTop:2 }}>{f.section}</div>
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                  <div style={{ fontSize:17, fontWeight:900, color:c }}>{f.amount}</div>
                  <div style={{ fontSize:9, color:"#ef4444" }}>{f.points} pts</div>
                </div>
              </div>
              {isOpen && (
                <div style={{ marginTop:10, background:c+"0a", border:`1px solid ${c}18`, borderRadius:8, padding:"10px 12px" }}>
                  {f.description && <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.5, marginBottom:6 }}>{f.description}</div>}
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <Tag color={c}>{f.severity?.toUpperCase()}</Tag>
                    {f.licensePoints && <Tag color="#f59e0b">{f.licensePoints} license points</Tag>}
                    {f.jailTime && <Tag color="#ef4444">Jail: {f.jailTime}</Tag>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length===0 && (
        <div style={{ textAlign:"center", padding:"40px 0", color:"#334155" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🔎</div>
          <div style={{ fontSize:13 }}>No violations found</div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── GOV'T TAB — CHALLAN/TICKETS ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function ChallanPanel({ challans: initChallans, currency }) {
  const [vehicleNo, setVehicleNo] = useState("");
  const [searched, setSearched] = useState(true);
  const [paidIds, setPaidIds] = useState([]);
  const [payModal, setPayModal] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [disputeModal, setDisputeModal] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeSent, setDisputeSent] = useState([]);
  const challans = initChallans || [];
  const unpaid = challans.filter(c=>c.status!=="paid" && !paidIds.includes(c.id));
  const unpaidTotal = unpaid.reduce((a,c)=>a+(c.amount||0),0);

  const doPay = (id) => {
    setPaidIds(p=>[...p,id]);
    const c = challans.find(x=>x.id===id);
    setReceipt({ id, challan:c, ts: new Date().toLocaleString(), refNo:"TXN"+Math.random().toString(36).slice(2,8).toUpperCase() });
    setPayModal(null);
  };

  return (
    <div>
      {/* Vehicle lookup */}
      <div style={{ background:"#0a1525", border:"1px solid #0f2040", borderRadius:14, padding:16, marginBottom:16 }}>
        <div style={{ fontSize:11, color:"#334155", fontWeight:700, letterSpacing:1, marginBottom:10 }}>VEHICLE / LICENCE LOOKUP</div>
        <div style={{ display:"flex", gap:8 }}>
          <input value={vehicleNo} onChange={e=>setVehicleNo(e.target.value)} placeholder="Enter plate / licence number"
            style={{ flex:1, background:"#060f1e", border:"1px solid #0f2040", borderRadius:10, padding:"10px 14px", color:"#f1f5f9", fontSize:13 }}/>
          <button onClick={()=>setSearched(true)} style={{ background:"#00d4ff", border:"none", borderRadius:10, padding:"10px 16px", color:"#000", fontWeight:800, fontSize:13, cursor:"pointer" }}>Check</button>
        </div>
        <div style={{ fontSize:10, color:"#1e3a5a", marginTop:8 }}>🔒 Data fetched from government traffic authority database</div>
      </div>

      {searched && (
        <>
          {/* Outstanding banner */}
          {unpaidTotal > 0 ? (
            <div style={{ background:"linear-gradient(135deg,#1a0505,#200808)", border:"1px solid #ef444428", borderRadius:14, padding:"14px 16px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:10, color:"#f87171", fontWeight:700, letterSpacing:1, marginBottom:4 }}>⚠️ OUTSTANDING DUES</div>
                <div style={{ fontSize:30, fontWeight:900, color:"#ef4444", lineHeight:1 }}>{currency}{unpaidTotal.toLocaleString()}</div>
                <div style={{ fontSize:10, color:"#7f1d1d", marginTop:4 }}>{unpaid.length} unpaid ticket{unpaid.length!==1?"s":""} · Pay to avoid court summons</div>
              </div>
              <button onClick={()=>setPayModal("all")} style={{ background:"#ef4444", border:"none", borderRadius:10, padding:"11px 16px", color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer" }}>Pay All</button>
            </div>
          ) : (
            <div style={{ background:"#052e16", border:"1px solid #22c55e28", borderRadius:12, padding:14, marginBottom:14, textAlign:"center" }}>
              <div style={{ fontSize:22, marginBottom:4 }}>✅</div>
              <div style={{ fontSize:13, fontWeight:700, color:"#22c55e" }}>No outstanding fines</div>
            </div>
          )}

          {/* Challan cards */}
          {challans.map((c)=>{
            const isPaid = c.status==="paid" || paidIds.includes(c.id);
            const isDisputed = disputeSent.includes(c.id);
            return (
              <div key={c.id} style={{ background:"#0a1525", border:`1px solid ${isPaid?"#22c55e18":isDisputed?"#f59e0b18":"#ef444418"}`, borderRadius:14, padding:"14px 16px", marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:isPaid||isDisputed?10:12 }}>
                  <div>
                    <div style={{ fontSize:10, color:"#334155", marginBottom:3 }}>Ticket #{c.id}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9" }}>{c.violation}</div>
                    <div style={{ fontSize:11, color:"#475569", marginTop:3 }}>📍 {c.location} · {c.date}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:20, fontWeight:900, color:isPaid?"#22c55e":isDisputed?"#f59e0b":"#ef4444" }}>{currency}{c.amount}</div>
                    <Tag color={isPaid?"#22c55e":isDisputed?"#f59e0b":"#ef4444"}>{isPaid?"PAID":isDisputed?"IN DISPUTE":"UNPAID"}</Tag>
                  </div>
                </div>
                {isPaid && <div style={{ background:"#22c55e0a", border:"1px solid #22c55e18", borderRadius:8, padding:"7px 12px", textAlign:"center", fontSize:12, color:"#22c55e" }}>✔ Payment Confirmed</div>}
                {isDisputed && !isPaid && <div style={{ background:"#f59e0b0a", border:"1px solid #f59e0b18", borderRadius:8, padding:"7px 12px", textAlign:"center", fontSize:12, color:"#f59e0b" }}>⏳ Dispute Under Review (5–10 business days)</div>}
                {!isPaid && !isDisputed && (
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>setPayModal(c.id)} style={{ flex:1, background:"#ef444418", border:"1px solid #ef444428", borderRadius:8, padding:"9px", color:"#ef4444", fontWeight:700, fontSize:12, cursor:"pointer" }}>Pay {currency}{c.amount} →</button>
                    <button onClick={()=>setDisputeModal(c.id)} style={{ background:"#f59e0b18", border:"1px solid #f59e0b28", borderRadius:8, padding:"9px 14px", color:"#f59e0b", fontWeight:700, fontSize:12, cursor:"pointer" }}>Dispute</button>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div onClick={()=>setPayModal(null)} style={{ position:"fixed", inset:0, background:"#000c", zIndex:400, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"linear-gradient(180deg,#0a1525,#020913)", borderRadius:"24px 24px 0 0", padding:28, width:"100%", maxWidth:420, border:"1px solid #0f2040", borderBottom:"none" }}>
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:36, marginBottom:6 }}>💳</div>
              <div style={{ fontSize:20, fontWeight:900, color:"#f1f5f9" }}>Pay Traffic Fine</div>
              <div style={{ fontSize:12, color:"#334155" }}>Secure · Government Payment Gateway</div>
            </div>
            <div style={{ background:"#060f1e", border:"1px solid #0f2040", borderRadius:12, padding:14, marginBottom:14 }}>
              {[["Fine Amount",`${currency}${payModal==="all"?unpaidTotal:challans.find(c=>c.id===payModal)?.amount}`],["Processing Fee","Free"],["Total",`${currency}${payModal==="all"?unpaidTotal:challans.find(c=>c.id===payModal)?.amount}`]].map(([k,v],i,arr)=>(
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:i<arr.length-1?"1px solid #0a1525":"none" }}>
                  <span style={{ fontSize:13, color:"#475569" }}>{k}</span>
                  <span style={{ fontSize:i===arr.length-1?16:13, fontWeight:i===arr.length-1?900:600, color:i===arr.length-1?"#22c55e":"#f1f5f9" }}>{v}</span>
                </div>
              ))}
            </div>
            {[["📱","UPI / Mobile Pay"],["💳","Credit / Debit Card"],["🏦","Net Banking"],["💰","Digital Wallet"]].map(([em,m])=>(
              <button key={m} onClick={()=>{ const id=payModal==="all"?challans.filter(c=>c.status!=="paid"&&!paidIds.includes(c.id)).map(c=>c.id):[payModal]; id.forEach(i=>doPay(i)); }}
                style={{ width:"100%", background:"#0a1525", border:"1px solid #0f2040", borderRadius:10, padding:"12px 16px", color:"#f1f5f9", fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:8, textAlign:"left" }}>
                {em} &nbsp;{m}
              </button>
            ))}
            <button onClick={()=>setPayModal(null)} style={{ background:"none", border:"none", width:"100%", color:"#334155", fontSize:12, marginTop:4, cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {disputeModal && (
        <div onClick={()=>setDisputeModal(null)} style={{ position:"fixed", inset:0, background:"#000c", zIndex:400, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"linear-gradient(180deg,#0a1525,#020913)", borderRadius:"24px 24px 0 0", padding:28, width:"100%", maxWidth:420, border:"1px solid #0f2040", borderBottom:"none" }}>
            <div style={{ textAlign:"center", marginBottom:16 }}>
              <div style={{ fontSize:32, marginBottom:6 }}>⚖️</div>
              <div style={{ fontSize:18, fontWeight:900, color:"#f1f5f9" }}>Dispute Ticket #{disputeModal}</div>
              <div style={{ fontSize:12, color:"#334155", marginTop:4 }}>Submit your objection to the traffic authority</div>
            </div>
            <div style={{ fontSize:12, color:"#475569", marginBottom:8 }}>Reason for dispute:</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
              {["Incorrect vehicle details","I was not the driver","Technical fault / Malfunction","Wrong location recorded","Other"].map(r=>(
                <button key={r} onClick={()=>setDisputeReason(r)} style={{ background:disputeReason===r?"#f59e0b18":"#0a1525", border:`1px solid ${disputeReason===r?"#f59e0b40":"#0f2040"}`, borderRadius:9, padding:"10px 14px", color:disputeReason===r?"#f59e0b":"#64748b", fontSize:12, fontWeight:600, cursor:"pointer", textAlign:"left" }}>{r}</button>
              ))}
            </div>
            <textarea placeholder="Additional details (optional)…" style={{ width:"100%", background:"#060f1e", border:"1px solid #0f2040", borderRadius:10, padding:"10px 14px", color:"#f1f5f9", fontSize:12, height:70, resize:"none", marginBottom:14 }}/>
            <button onClick={()=>{ if(disputeReason){ setDisputeSent(d=>[...d,disputeModal]); setDisputeModal(null); setDisputeReason(""); }}}
              style={{ width:"100%", background:disputeReason?"#f59e0b":"#0a1525", border:`1px solid ${disputeReason?"#f59e0b":"#0f2040"}`, borderRadius:12, padding:"13px", color:disputeReason?"#000":"#334155", fontWeight:800, fontSize:14, cursor:disputeReason?"pointer":"default" }}>
              Submit Dispute
            </button>
            <button onClick={()=>setDisputeModal(null)} style={{ background:"none", border:"none", width:"100%", color:"#334155", fontSize:12, marginTop:10, cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receipt && (
        <div onClick={()=>setReceipt(null)} style={{ position:"fixed", inset:0, background:"#000c", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 20px" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"linear-gradient(180deg,#052e16,#020913)", border:"1px solid #22c55e30", borderRadius:24, padding:28, width:"100%", maxWidth:380, textAlign:"center" }}>
            <div style={{ fontSize:50, marginBottom:12 }}>✅</div>
            <div style={{ fontSize:20, fontWeight:900, color:"#22c55e", marginBottom:4 }}>Payment Successful!</div>
            <div style={{ fontSize:13, color:"#475569", marginBottom:20 }}>Your ticket has been cleared</div>
            <div style={{ background:"#060f1e", borderRadius:12, padding:16, marginBottom:20, textAlign:"left" }}>
              {[["Reference","#"+receipt.refNo],["Ticket","#"+receipt.id],["Amount",`${currency}${receipt.challan?.amount}`],["Date & Time",receipt.ts],["Status","PAID ✓"]].map(([k,v])=>(
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #0a1525" }}>
                  <span style={{ fontSize:11, color:"#475569" }}>{k}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:k==="Status"?"#22c55e":"#f1f5f9" }}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>setReceipt(null)} style={{ background:"#22c55e", border:"none", borderRadius:12, padding:"13px 32px", color:"#000", fontWeight:800, fontSize:14, cursor:"pointer" }}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── GOV'T TAB — REWARDS ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function RewardsPanel({ rewards: initRewards, quiz: quizData, country }) {
  const [rewards, setRewards] = useState((initRewards||[]).map(r=>({...r,claimed:false})));
  const [activeSection, setActiveSection] = useState("score");
  const [quizOpen, setQuizOpen] = useState(false);
  const [qStep, setQStep] = useState(0);
  const [qSel, setQSel] = useState(null);
  const [qScore, setQScore] = useState(0);
  const [qDone, setQDone] = useState(false);
  const [streak, setStreak] = useState(7);
  const [redeemed, setRedeemed] = useState([]);

  const BASE_PTS = 1920;
  const NEXT_TIER = 2500;
  const progress = Math.min((BASE_PTS / NEXT_TIER) * 100, 100);

  const TIERS = [
    { name:"Bronze",  min:0,    max:999,  icon:"🥉", color:"#92400e" },
    { name:"Silver",  min:1000, max:2499, icon:"🥈", color:"#64748b" },
    { name:"Gold",    min:2500, max:4999, icon:"🥇", color:"#d97706" },
    { name:"Platinum",min:5000, max:9999, icon:"💎", color:"#06b6d4" },
    { name:"Elite",   min:10000,max:Infinity,icon:"👑",color:"#a855f7"},
  ];
  const currentTier = TIERS.find(t=>BASE_PTS>=t.min && BASE_PTS<=t.max) || TIERS[0];
  const nextTier    = TIERS[TIERS.indexOf(currentTier)+1];

  const LEADERBOARD = [
    { rank:1, name:"David K.",  pts:3840, badge:"🥇", plate:"L-1234" },
    { rank:2, name:"Priya S.",  pts:3210, badge:"🥈", plate:"B-5678" },
    { rank:3, name:"Chen W.",   pts:2890, badge:"🥉", plate:"K-9012" },
    { rank:4, name:"You",       pts:BASE_PTS, badge:"⭐", plate:"—", isUser:true },
    { rank:5, name:"Ana R.",    pts:1780, badge:"",   plate:"M-3456" },
  ];

  const SHOP = [
    { icon:"🅿️", label:"Waive 1 Parking Fine",       cost:400, id:"p1" },
    { icon:"🔍", label:"Free Vehicle Inspection",     cost:700, id:"p2" },
    { icon:"⚖️", label:"Priority Dispute Support",    cost:1200,id:"p3" },
    { icon:"💰", label:"Road Tax Discount 10%",       cost:2000,id:"p4" },
    { icon:"🏎️", label:"Speed Camera Grace Period",   cost:2500,id:"p5" },
    { icon:"🎟️", label:"Toll Exemption Pass (1 month)",cost:3000,id:"p6"},
  ];

  const STREAKS = [
    {d:"Mon",done:true},{d:"Tue",done:true},{d:"Wed",done:true},{d:"Thu",done:true},
    {d:"Fri",done:true},{d:"Sat",done:true},{d:"Sun",done:false},
  ];

  const handleAnswer = (i) => {
    if (qSel!==null) return;
    setQSel(i);
    if (i===quizData?.[qStep]?.answer) setQScore(s=>s+1);
    setTimeout(()=>{
      if (qStep<(quizData?.length||0)-1) { setQStep(s=>s+1); setQSel(null); }
      else setQDone(true);
    }, 900);
  };

  const sections = [
    {id:"score",label:"Score"},
    {id:"rewards",label:"Rewards"},
    {id:"shop",label:"Redeem"},
    {id:"board",label:"Ranks"},
  ];

  return (
    <div>
      {/* Section tabs */}
      <div style={{ display:"flex", gap:4, background:"#0a1525", borderRadius:12, padding:4, marginBottom:16 }}>
        {sections.map(s=>(
          <button key={s.id} onClick={()=>setActiveSection(s.id)} style={{ flex:1, background:activeSection===s.id?"#7c3aed":"transparent", border:"none", borderRadius:9, padding:"7px 4px", fontSize:10, fontWeight:700, color:activeSection===s.id?"#fff":"#334155", cursor:"pointer", transition:"all 0.2s" }}>{s.label}</button>
        ))}
      </div>

      {/* ── SCORE SECTION ── */}
      {activeSection==="score" && (
        <div>
          {/* Tier card */}
          <div style={{ background:`linear-gradient(135deg,${currentTier.color}18,${currentTier.color}06)`, border:`1px solid ${currentTier.color}30`, borderRadius:18, padding:20, marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
              <div>
                <div style={{ fontSize:10, color:currentTier.color, fontWeight:700, letterSpacing:1, marginBottom:6 }}>YOUR CITIZEN SCORE</div>
                <div style={{ fontSize:52, fontWeight:900, color:"#f1f5f9", lineHeight:1 }}>{BASE_PTS.toLocaleString()}</div>
                <div style={{ fontSize:12, color:currentTier.color, marginTop:6, fontWeight:600 }}>{currentTier.icon} {currentTier.name} Driver</div>
              </div>
              <div style={{ background:currentTier.color+"18", border:`1px solid ${currentTier.color}30`, borderRadius:14, padding:"12px 14px", textAlign:"center" }}>
                <div style={{ fontSize:32 }}>{currentTier.icon}</div>
                <div style={{ fontSize:9, color:currentTier.color, fontWeight:700, marginTop:4 }}>{currentTier.name.toUpperCase()}</div>
              </div>
            </div>
            {nextTier && (
              <>
                <div style={{ fontSize:10, color:"#334155", marginBottom:6 }}>Progress to {nextTier.icon} {nextTier.name}: {(NEXT_TIER-BASE_PTS)} pts needed</div>
                <div style={{ background:"#060f1e", borderRadius:99, height:8, overflow:"hidden" }}>
                  <div style={{ width:`${progress}%`, height:"100%", background:`linear-gradient(90deg,${currentTier.color},${nextTier.color})`, borderRadius:99, transition:"width 1s" }}/>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                  <span style={{ fontSize:9, color:"#1e3a5a" }}>{currentTier.name}</span>
                  <span style={{ fontSize:9, color:"#334155" }}>{BASE_PTS} / {NEXT_TIER}</span>
                  <span style={{ fontSize:9, color:"#1e3a5a" }}>{nextTier.name}</span>
                </div>
              </>
            )}
          </div>

          {/* Tier ladder */}
          <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:4, scrollbarWidth:"none" }}>
            {TIERS.map(t=>(
              <div key={t.name} style={{ background:t.name===currentTier.name?t.color+"20":"#0a1525", border:`1px solid ${t.name===currentTier.name?t.color:"#0f2040"}30`, borderRadius:10, padding:"8px 10px", flexShrink:0, textAlign:"center", minWidth:64, opacity:BASE_PTS>=t.min?1:0.35 }}>
                <div style={{ fontSize:18 }}>{t.icon}</div>
                <div style={{ fontSize:9, fontWeight:700, color:t.name===currentTier.name?t.color:"#334155", marginTop:2 }}>{t.name}</div>
                <div style={{ fontSize:8, color:"#1e3a5a" }}>{t.min.toLocaleString()}+</div>
              </div>
            ))}
          </div>

          {/* Daily streak */}
          <div style={{ background:"#0a1525", border:"1px solid #f59e0b20", borderRadius:14, padding:16, marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#f59e0b", letterSpacing:0.5 }}>🔥 DAILY STREAK</div>
                <div style={{ fontSize:11, color:"#334155", marginTop:2 }}>Drive safely every day to earn bonus pts</div>
              </div>
              <div style={{ background:"#f59e0b18", border:"1px solid #f59e0b30", borderRadius:10, padding:"6px 12px", textAlign:"center" }}>
                <div style={{ fontSize:22, fontWeight:900, color:"#f59e0b" }}>{streak}</div>
                <div style={{ fontSize:8, color:"#92400e", fontWeight:700 }}>DAYS</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {STREAKS.map((s,i)=>(
                <div key={i} style={{ flex:1, textAlign:"center" }}>
                  <div style={{ width:"100%", aspectRatio:"1", borderRadius:8, background:s.done?"#f59e0b":"#060f1e", border:`1px solid ${s.done?"#f59e0b30":"#0f2040"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:s.done?12:10, color:s.done?"#000":"#1e3a5a", fontWeight:700, marginBottom:4 }}>{s.done?"✓":"·"}</div>
                  <div style={{ fontSize:8, color:"#334155" }}>{s.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── REWARDS SECTION ── */}
      {activeSection==="rewards" && (
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:"#334155", marginBottom:12, letterSpacing:1 }}>🎁 GOVERNMENT REWARDS — {country?.toUpperCase()}</div>
          {rewards.map((r,i)=>(
            <div key={i} style={{ background:"#0a1525", border:r.claimed?"1px solid #22c55e20":"1px solid #0f2040", borderRadius:12, padding:"14px 15px", marginBottom:10, display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ fontSize:28, flexShrink:0 }}>{r.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#f1f5f9" }}>{r.title}</div>
                <div style={{ fontSize:11, color:"#334155", marginTop:2, lineHeight:1.4 }}>{r.desc}</div>
                <div style={{ fontSize:11, color:"#7c3aed", marginTop:5, fontWeight:700 }}>+{r.points} Citizen Pts</div>
              </div>
              {r.claimed
                ? <div style={{ fontSize:11, color:"#22c55e", fontWeight:700, flexShrink:0 }}>✓ Claimed</div>
                : <button onClick={()=>setRewards(rs=>rs.map((x,j)=>j===i?{...x,claimed:true}:x))} style={{ background:"#7c3aed18", border:"1px solid #7c3aed30", borderRadius:8, padding:"7px 13px", color:"#7c3aed", fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>Claim</button>
              }
            </div>
          ))}

          {/* Quiz CTA */}
          {(quizData?.length||0)>0 && (
            <div style={{ background:"linear-gradient(135deg,#042010,#062818)", border:"1px solid #22c55e25", borderRadius:14, padding:18, marginTop:4, textAlign:"center" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🎓</div>
              <div style={{ fontWeight:800, color:"#f1f5f9", marginBottom:4 }}>{country} Traffic Quiz</div>
              <div style={{ fontSize:12, color:"#334155", marginBottom:14 }}>Test your knowledge · Earn up to +75 pts</div>
              <button onClick={()=>{setQuizOpen(true);setQStep(0);setQScore(0);setQSel(null);setQDone(false);}}
                style={{ background:"#22c55e", border:"none", borderRadius:10, padding:"11px 28px", color:"#000", fontWeight:800, fontSize:13, cursor:"pointer" }}>Start Quiz →</button>
            </div>
          )}
        </div>
      )}

      {/* ── SHOP SECTION ── */}
      {activeSection==="shop" && (
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:"#334155", marginBottom:4, letterSpacing:1 }}>🎟️ REDEEM YOUR POINTS</div>
          <div style={{ fontSize:11, color:"#1e3a5a", marginBottom:14 }}>Your balance: <span style={{ color:"#7c3aed", fontWeight:700 }}>{BASE_PTS.toLocaleString()} pts</span></div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {SHOP.map(item=>{
              const canAfford = BASE_PTS >= item.cost;
              const isDone = redeemed.includes(item.id);
              return (
                <div key={item.id} style={{ background:"#0a1525", border:`1px solid ${isDone?"#22c55e18":"#0f2040"}`, borderRadius:12, padding:"13px 16px", display:"flex", alignItems:"center", gap:12, opacity:canAfford||isDone?1:0.5 }}>
                  <span style={{ fontSize:24, flexShrink:0 }}>{item.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"#f1f5f9" }}>{item.label}</div>
                    <Tag color="#7c3aed">{item.cost.toLocaleString()} pts</Tag>
                  </div>
                  {isDone
                    ? <div style={{ fontSize:11, color:"#22c55e", fontWeight:700 }}>Redeemed ✓</div>
                    : <button onClick={()=>{ if(canAfford) setRedeemed(r=>[...r,item.id]); }}
                        style={{ background:canAfford?"#7c3aed":"#060f1e", border:"none", borderRadius:8, padding:"7px 14px", color:canAfford?"#fff":"#1e3a5a", fontSize:11, fontWeight:700, cursor:canAfford?"pointer":"default" }}>
                        {canAfford?"Redeem":"Locked"}
                      </button>
                  }
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── LEADERBOARD SECTION ── */}
      {activeSection==="board" && (
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:"#334155", marginBottom:12, letterSpacing:1 }}>🏆 CITY LEADERBOARD</div>
          {LEADERBOARD.map(l=>(
            <div key={l.rank} style={{ background:l.isUser?"#7c3aed12":"#0a1525", border:`1px solid ${l.isUser?"#7c3aed25":"#0f2040"}`, borderRadius:12, padding:"12px 16px", marginBottom:8, display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ fontSize:l.badge?20:14, width:28, textAlign:"center", color:"#334155", fontWeight:700 }}>{l.badge||`#${l.rank}`}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:l.isUser?800:600, color:l.isUser?"#c4b5fd":"#e2e8f0" }}>{l.name}{l.isUser?" 👈":""}</div>
                <div style={{ fontSize:10, color:"#1e3a5a" }}>{l.plate}</div>
              </div>
              <div style={{ fontSize:15, fontWeight:900, color:l.isUser?"#a78bfa":"#64748b" }}>{l.pts.toLocaleString()}<span style={{ fontSize:9, color:"#334155" }}> pts</span></div>
            </div>
          ))}
          <div style={{ background:"#0a1525", border:"1px solid #0f2040", borderRadius:12, padding:14, textAlign:"center", marginTop:4 }}>
            <div style={{ fontSize:12, color:"#334155", marginBottom:8 }}>Rankings update daily at midnight local time</div>
            <div style={{ fontSize:11, color:"#7c3aed", fontWeight:600 }}>You are in top 15% of drivers in {country} 🎉</div>
          </div>
        </div>
      )}

      {/* ── QUIZ MODAL ── */}
      {quizOpen && (quizData?.length||0)>0 && (
        <div style={{ position:"fixed", inset:0, background:"#000000e0", zIndex:400, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div style={{ background:"linear-gradient(180deg,#0a1525,#020913)", borderRadius:"24px 24px 0 0", padding:28, width:"100%", maxWidth:420, border:"1px solid #0f2040", borderBottom:"none" }}>
            {!qDone ? (
              <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <span style={{ fontSize:11, color:"#334155" }}>Q {qStep+1} / {quizData.length}</span>
                  <span style={{ fontSize:11, color:"#22c55e", fontWeight:700 }}>Score {qScore}</span>
                </div>
                <div style={{ background:"#060f1e", borderRadius:99, height:3, marginBottom:18 }}>
                  <div style={{ width:`${(qStep/quizData.length)*100}%`, height:"100%", background:"#22c55e", borderRadius:99, transition:"width 0.4s" }}/>
                </div>
                <div style={{ fontSize:16, fontWeight:700, color:"#f1f5f9", lineHeight:1.5, marginBottom:18 }}>{quizData[qStep]?.question}</div>
                {(quizData[qStep]?.options||[]).map((opt,i)=>{
                  const isCorrect = i===quizData[qStep]?.answer;
                  let bg="#0a1525", border="1px solid #0f2040", color="#e2e8f0";
                  if (qSel!==null) {
                    if (isCorrect) { bg="#052e16"; border="1px solid #22c55e50"; color="#22c55e"; }
                    else if (i===qSel) { bg="#1a0505"; border="1px solid #ef444450"; color="#ef4444"; }
                  }
                  return (
                    <button key={i} onClick={()=>handleAnswer(i)} style={{ width:"100%", background:bg, border, borderRadius:10, padding:"11px 15px", color, fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:8, textAlign:"left", transition:"all 0.25s" }}>
                      <span style={{ opacity:0.5, marginRight:8 }}>{["A","B","C","D"][i]}.</span>{opt}
                    </button>
                  );
                })}
                {qSel!==null && quizData[qStep]?.explanation && (
                  <div style={{ background:"#0a2040", border:"1px solid #00d4ff20", borderRadius:10, padding:"10px 14px", fontSize:12, color:"#94a3b8", lineHeight:1.5, marginTop:4 }}>
                    💡 {quizData[qStep].explanation}
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign:"center", padding:"10px 0" }}>
                <div style={{ fontSize:50, marginBottom:12 }}>{qScore===quizData.length?"🎉":qScore>=Math.floor(quizData.length/2)?"😊":"😅"}</div>
                <div style={{ fontSize:24, fontWeight:900, color:"#f1f5f9", marginBottom:6 }}>{qScore} / {quizData.length} Correct!</div>
                <div style={{ fontSize:13, color:"#475569", marginBottom:8 }}>
                  You earned <span style={{ color:"#22c55e", fontWeight:800 }}>+{qScore*25} Citizen Points</span>
                </div>
                {qScore===quizData.length && (
                  <div style={{ background:"#052e16", border:"1px solid #22c55e25", borderRadius:10, padding:10, marginBottom:14, fontSize:12, color:"#22c55e" }}>
                    🏆 Perfect Score! Bonus +25 pts awarded
                  </div>
                )}
                <button onClick={()=>setQuizOpen(false)} style={{ background:"#22c55e", border:"none", borderRadius:10, padding:"12px 32px", color:"#000", fontWeight:800, fontSize:14, cursor:"pointer" }}>Done ✓</button>
              </div>
            )}
            {!qDone && <button onClick={()=>setQuizOpen(false)} style={{ background:"none", border:"none", width:"100%", color:"#1e3a5a", fontSize:11, marginTop:10, cursor:"pointer" }}>Close quiz</button>}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── GOV'T TAB WRAPPER ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function GovtTab({ location, data, loading }) {
  const [sub, setSub] = useState("rules");
  const subTabs = [
    { id:"rules",   label:"📋 Rules" },
    { id:"fines",   label:"💰 Fines" },
    { id:"challan", label:"🎫 Challan" },
    { id:"rewards", label:"🏆 Rewards" },
  ];

  if (loading) return (
    <div>
      <Skel h={82} mb={14}/>
      <div style={{ display:"flex", gap:4, marginBottom:16 }}>{[1,2,3,4].map(i=><Skel key={i} h={38} mb={0}/>)}</div>
      {[70,10,60,10,60,10,60].map((h,i)=><Skel key={i} h={h} mb={8}/>)}
    </div>
  );

  return (
    <div>
      {/* Gov badge */}
      <div style={{ background:"linear-gradient(135deg,#061624,#0a2040)", border:"1px solid #00d4ff18", borderRadius:16, padding:"14px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ fontSize:34 }}>🏛️</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:9, color:"#00d4ff", fontWeight:700, letterSpacing:1.5, marginBottom:3 }}>OFFICIAL TRAFFIC AUTHORITY</div>
          <div style={{ fontSize:15, fontWeight:800, color:"#f1f5f9" }}>{location?.country} Road Compliance</div>
          <div style={{ fontSize:11, color:"#334155" }}>{location?.city} · Motor Vehicles Act · Live</div>
        </div>
        <Tag color="#22c55e">LIVE</Tag>
      </div>

      {/* Sub-tab nav */}
      <div style={{ display:"flex", gap:4, marginBottom:16 }}>
        {subTabs.map(t=>(
          <button key={t.id} onClick={()=>setSub(t.id)} style={{ flex:1, background:sub===t.id?"#00d4ff":"#0a1525", border:`1px solid ${sub===t.id?"#00d4ff":"#0f2040"}`, borderRadius:10, padding:"9px 2px", fontSize:9, fontWeight:700, color:sub===t.id?"#000":"#334155", cursor:"pointer", transition:"all 0.2s", lineHeight:1.3 }}>{t.label}</button>
        ))}
      </div>

      {sub==="rules"   && <RulesPanel   rules={data?.rules}  country={location?.country}/>}
      {sub==="fines"   && <FinesPanel   fines={data?.fines}  currency={data?.currency||"$"}/>}
      {sub==="challan" && <ChallanPanel challans={data?.challans} currency={data?.currency||"$"}/>}
      {sub==="rewards" && <RewardsPanel rewards={data?.rewards} quiz={data?.quiz} country={location?.country}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN APP ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function WorldTrafficApp() {
  const [location,   setLocation]   = useState(null);
  const [geoError,   setGeoError]   = useState(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [activeTab,  setActiveTab]  = useState("traffic");
  const [showPro,    setShowPro]    = useState(false);
  const [time,       setTime]       = useState(new Date());

  const [trafficData, setTrafficData] = useState(null);
  const [routesData,  setRoutesData]  = useState(null);
  const [alertsData,  setAlertsData]  = useState(null);
  const [govtData,    setGovtData]    = useState(null);

  const [loadingTraffic, setLT] = useState(false);
  const [loadingRoutes,  setLR] = useState(false);
  const [loadingAlerts,  setLA] = useState(false);
  const [loadingGovt,    setLG] = useState(false);

  const fetched = useRef(new Set());

  useEffect(() => {
    const t = setInterval(()=>setTime(new Date()), 1000);
    return ()=>clearInterval(t);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setGeoError("Geolocation not supported"); setGeoLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try { setLocation(await reverseGeocode(pos.coords.latitude, pos.coords.longitude)); }
        catch { setGeoError("Could not determine city"); }
        setGeoLoading(false);
      },
      () => { setGeoError("Location access denied"); setGeoLoading(false); },
      { timeout:10000 }
    );
  }, []);

  const fetchTab = useCallback(async tab => {
    if (!location || fetched.current.has(tab)) return;
    fetched.current.add(tab);
    const { city, country, countryCode } = location;

    if (tab==="traffic") {
      setLT(true);
      try {
        setTrafficData(await callClaude(
          `Realistic current traffic data for ${city}, ${country}. JSON: {"congestion":<0-100>,"summary":"<2 sentences>","hotspots":[{"name":"<local road>","level":<0-100>,"trend":"up"|"down"|"flat"},... 7 items]}`
        ));
      } catch { fetched.current.delete(tab); }
      setLT(false);
    }

    if (tab==="routes") {
      setLR(true);
      try {
        setRoutesData(await callClaude(
          `Popular routes in ${city}, ${country}. JSON: {"routes":[{"name":"<A> → <B>","via":"<road>","distance":"<Xkm>","eta":<min>,"status":"heavy"|"moderate"|"clear","alt":"<alt or null>","sponsored":false}, {"name":"...","sponsored":true,"sponsor":"<local biz>"},... 4 total]}`
        ));
      } catch { fetched.current.delete(tab); }
      setLR(false);
    }

    if (tab==="alerts") {
      setLA(true);
      try {
        setAlertsData(await callClaude(
          `4 current traffic alerts for ${city}, ${country}. JSON: {"alerts":[{"icon":"<emoji>","text":"<alert with local road names>","time":"<X min ago>","severity":"high"|"medium"|"low"},... 4 items]}`
        ));
      } catch { fetched.current.delete(tab); }
      setLA(false);
    }

    if (tab==="govt") {
      setLG(true);
      try {
        setGovtData(await callClaude(
          `Traffic laws and compliance data for ${country} (${countryCode}). Use local currency symbol. Return JSON:
{
  "currency":"<symbol>",
  "rules":[
    {"icon":"🚗","category":"Speed Limits","severity":"high","lawRef":"<local law>","rules":[{"rule":"<context>","limit":"<value>","note":"<note>","penalty":"<fine>"},{"rule":"...","limit":"...","note":"..."},{"rule":"...","limit":"...","note":"..."}]},
    {"icon":"🪖","category":"Helmet & Seatbelt","severity":"high","lawRef":"<local law>","rules":[{"rule":"...","limit":"...","note":"..."},{"rule":"...","limit":"...","note":"..."}]},
    {"icon":"🅿️","category":"Parking Rules","severity":"medium","lawRef":"<local law>","rules":[{"rule":"...","limit":"...","note":"..."},{"rule":"...","limit":"...","note":"..."}]},
    {"icon":"📵","category":"Mobile & Distraction","severity":"high","lawRef":"<local law>","rules":[{"rule":"...","limit":"...","note":"..."},{"rule":"...","limit":"...","note":"..."}]},
    {"icon":"🍺","category":"DUI / Drink Driving","severity":"critical","lawRef":"<local law>","rules":[{"rule":"...","limit":"...","note":"...","penalty":"..."},{"rule":"...","limit":"...","note":"..."}]}
  ],
  "fines":[
    {"icon":"🚦","violation":"Signal Jump","amount":"<currency+value>","rawAmount":<number>,"section":"<law ref>","severity":"medium","points":-5,"description":"<brief description>","licensePoints":"<X points>"},
    {"icon":"💨","violation":"Speeding (moderate)","amount":"<currency+value>","rawAmount":<number>,"section":"<law ref>","severity":"medium","points":-5,"description":"<brief>"},
    {"icon":"🏎️","violation":"Speeding (severe)","amount":"<currency+value>","rawAmount":<number>,"section":"<law ref>","severity":"high","points":-10,"description":"<brief>","jailTime":"<if applicable>"},
    {"icon":"🪖","violation":"No Helmet","amount":"<currency+value>","rawAmount":<number>,"section":"<law ref>","severity":"medium","points":-5,"description":"<brief>"},
    {"icon":"🔒","violation":"No Seatbelt","amount":"<currency+value>","rawAmount":<number>,"section":"<law ref>","severity":"medium","points":-5,"description":"<brief>"},
    {"icon":"🍺","violation":"Drink Driving","amount":"<currency+value>","rawAmount":<number>,"section":"<law ref>","severity":"critical","points":-20,"description":"<brief>","jailTime":"<time>"},
    {"icon":"📱","violation":"Mobile Phone Use","amount":"<currency+value>","rawAmount":<number>,"section":"<law ref>","severity":"high","points":-10,"description":"<brief>"},
    {"icon":"🪪","violation":"No Valid Licence","amount":"<currency+value>","rawAmount":<number>,"section":"<law ref>","severity":"high","points":-15,"description":"<brief>"},
    {"icon":"↔️","violation":"Wrong Side Driving","amount":"<currency+value>","rawAmount":<number>,"section":"<law ref>","severity":"high","points":-8,"description":"<brief>"},
    {"icon":"🅿️","violation":"Illegal Parking","amount":"<currency+value>","rawAmount":<number>,"section":"<law ref>","severity":"low","points":-2,"description":"<brief>"}
  ],
  "challans":[
    {"id":"TK001","vehicle":"<local format plate>","violation":"Signal Jump","date":"04 Mar 2026","amount":<number>,"location":"<local road in ${city}>","status":"unpaid"},
    {"id":"TK002","vehicle":"<same plate>","violation":"Illegal Parking","date":"01 Feb 2026","amount":<smaller number>,"location":"<local road>","status":"paid"}
  ],
  "rewards":[
    {"icon":"🌿","title":"Green Commuter","desc":"Used public transport 10 days in a row","points":200},
    {"icon":"🛡️","title":"Safe Driver","desc":"Zero violations in last 90 days","points":500},
    {"icon":"🌙","title":"Off-Peak Hero","desc":"Avoided rush hour 15 times","points":250},
    {"icon":"🤝","title":"Pedestrian Respect","desc":"Yielded to pedestrians 20 times","points":300},
    {"icon":"🎯","title":"Precision Parker","desc":"Parked correctly 30 times","points":150}
  ],
  "quiz":[
    {"question":"<specific question about ${country} traffic law>","options":["<A>","<B>","<C>","<D>"],"answer":<0-3>,"explanation":"<brief factual explanation>"},
    {"question":"<another local question>","options":["<A>","<B>","<C>","<D>"],"answer":<0-3>,"explanation":"<brief>"},
    {"question":"<third local question>","options":["<A>","<B>","<C>","<D>"],"answer":<0-3>,"explanation":"<brief>"}
  ]
}`,
          "You are a legal traffic data API for any country worldwide. Respond ONLY with valid compact JSON. No markdown, no backticks, no trailing commas, no comments."
        ));
      } catch { fetched.current.delete(tab); }
      setLG(false);
    }
  }, [location]);

  useEffect(() => { if (location) fetchTab(activeTab); }, [location, activeTab, fetchTab]);

  const TABS = [
    { id:"traffic", label:"Traffic", icon:"🗺️" },
    { id:"routes",  label:"Routes",  icon:"🛣️" },
    { id:"alerts",  label:"Alerts",  icon:"🔔" },
    { id:"govt",    label:"Gov't",   icon:"🏛️" },
  ];

  // ── BOOT SCREENS ──────────────────────────────────────────────────────────
  const sharedStyle = { fontFamily:"'Syne','DM Sans',sans-serif", background:"#020913", minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#f1f5f9", maxWidth:420, margin:"0 auto", padding:"0 30px", textAlign:"center" };

  if (geoLoading) return (
    <div style={sharedStyle}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <div style={{ width:56, height:56, border:"3px solid #0f2040", borderTop:"3px solid #00d4ff", borderRadius:"50%", animation:"spin 1s linear infinite", marginBottom:22 }}/>
      <div style={{ fontSize:22, fontWeight:800, marginBottom:8 }}>TrafficGlobe</div>
      <div style={{ fontSize:13, color:"#334155" }}>Detecting your location…</div>
    </div>
  );

  if (geoError && !location) return (
    <div style={sharedStyle}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      <div style={{ fontSize:50, marginBottom:16 }}>📍</div>
      <div style={{ fontSize:22, fontWeight:800, marginBottom:8 }}>Location Required</div>
      <div style={{ fontSize:13, color:"#334155", marginBottom:24, lineHeight:1.7 }}>{geoError}. TrafficGlobe needs your location to show local traffic, laws & fines for your country.</div>
      <button onClick={()=>window.location.reload()} style={{ background:"#00d4ff", border:"none", borderRadius:12, padding:"12px 28px", color:"#000", fontWeight:800, fontSize:14, cursor:"pointer" }}>Allow Location & Retry</button>
    </div>
  );

  // ── MAIN APP ──────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'Syne','DM Sans',sans-serif", background:"#020913", minHeight:"100vh", color:"#f1f5f9", maxWidth:420, margin:"0 auto", position:"relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        *{box-sizing:border-box} input,textarea,select{outline:none;font-family:inherit}
        button:active{opacity:0.8} ::-webkit-scrollbar{display:none}
      `}</style>

      {/* Ambient glow */}
      <div style={{ position:"fixed", top:-120, right:-80, width:340, height:340, borderRadius:"50%", background:"radial-gradient(circle,#00d4ff06 0%,transparent 70%)", pointerEvents:"none", zIndex:0 }}/>

      {/* ── HEADER ── */}
      <div style={{ position:"sticky", top:0, zIndex:50, background:"#020913f0", backdropFilter:"blur(14px)", borderBottom:"1px solid #0a1f3a", padding:"13px 20px 10px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:7, height:7, background:"#22c55e", borderRadius:"50%", boxShadow:"0 0 8px #22c55e" }}/>
              <span style={{ fontSize:10, color:"#22c55e", fontWeight:700, letterSpacing:1 }}>LIVE</span>
              <span style={{ fontSize:10, color:"#1e3a5a" }}>{time.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
              {location && <span style={{ fontSize:10, color:"#00d4ff", fontWeight:600 }}>· {location.city}</span>}
            </div>
            <div style={{ fontSize:24, fontWeight:800, letterSpacing:-0.5, lineHeight:1.2, marginTop:1 }}>Traffic<span style={{ color:"#00d4ff" }}>Globe</span></div>
          </div>
          <button onClick={()=>setShowPro(true)} style={{ background:"linear-gradient(135deg,#00d4ff,#0080ff)", border:"none", borderRadius:20, padding:"8px 16px", color:"#000", fontWeight:800, fontSize:11, cursor:"pointer" }}>⚡ PRO</button>
        </div>
        {location && (
          <div style={{ display:"inline-flex", alignItems:"center", gap:7, marginTop:9, background:"#0a1f3a", borderRadius:99, padding:"5px 13px" }}>
            <span style={{ fontSize:13 }}>📍</span>
            <span style={{ fontSize:11, color:"#e2e8f0", fontWeight:600 }}>{location.city}, {location.country}</span>
            <span style={{ fontSize:9, color:"#1e3a5a" }}>({location.countryCode})</span>
            <button onClick={()=>{ fetched.current.clear(); fetchTab(activeTab); }} style={{ background:"none", border:"none", color:"#00d4ff", fontSize:12, cursor:"pointer", fontWeight:700, padding:"0 0 0 4px" }}>↻</button>
          </div>
        )}
      </div>

      {/* Ad */}
      <div style={{ padding:"12px 20px 0" }}><AdBanner idx={0}/></div>

      {/* ── TABS ── */}
      <div style={{ display:"flex", padding:"13px 20px 0", gap:4 }}>
        {TABS.map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{ flex:1, background:activeTab===tab.id?(tab.id==="govt"?"#1d4ed8":"#00d4ff"):"#0a1525", color:activeTab===tab.id?"#000":"#334155", border:activeTab===tab.id?"none":"1px solid #0a1f3a", borderRadius:10, padding:"9px 4px", fontSize:9, fontWeight:700, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, transition:"all 0.2s" }}>
            <span style={{ fontSize:16 }}>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding:"16px 20px", paddingBottom:110, position:"relative", zIndex:1 }}>
        {activeTab==="traffic" && <TrafficTab location={location||{}} data={trafficData} loading={loadingTraffic}/>}
        {activeTab==="routes"  && <RoutesTab  data={routesData}  loading={loadingRoutes}  onPremium={()=>setShowPro(true)}/>}
        {activeTab==="alerts"  && <AlertsTab  data={alertsData}  loading={loadingAlerts}/>}
        {activeTab==="govt"    && <GovtTab    location={location} data={govtData} loading={loadingGovt}/>}
      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:420, background:"#020913f0", backdropFilter:"blur(14px)", borderTop:"1px solid #0a1f3a", padding:"10px 20px 22px", display:"flex", justifyContent:"space-around", zIndex:100 }}>
        {TABS.map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{ background:"none", border:"none", display:"flex", flexDirection:"column", alignItems:"center", gap:3, cursor:"pointer", opacity:activeTab===tab.id?1:0.3, transition:"opacity 0.2s" }}>
            <span style={{ fontSize:20 }}>{tab.icon}</span>
            <span style={{ fontSize:9, color:activeTab===tab.id?(tab.id==="govt"?"#60a5fa":"#00d4ff"):"#334155", fontWeight:700 }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── PRO MODAL ── */}
      {showPro && (
        <div onClick={()=>setShowPro(false)} style={{ position:"fixed", inset:0, background:"#000000bb", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"linear-gradient(180deg,#0a1525,#020913)", borderRadius:"24px 24px 0 0", padding:28, width:"100%", maxWidth:420, border:"1px solid #0a1f3a", borderBottom:"none" }}>
            <div style={{ textAlign:"center", marginBottom:22 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>⚡</div>
              <div style={{ fontSize:24, fontWeight:800 }}>Traffic<span style={{ color:"#00d4ff" }}>Globe</span> Pro</div>
              <div style={{ color:"#334155", fontSize:13, marginTop:4 }}>Every country. Every road. Zero ads.</div>
            </div>
            {["🌍 Works in every country & every city","🚫 Completely ad-free experience","🗺️ Unlimited live routes with voice ETA","🔔 Push & SMS alerts in your language","🏛️ Gov't fine dispute support worldwide","📊 Weekly personalised driving report","⚡ AI predictions 30 min ahead","🎯 Exclusive Platinum rewards access"].map((f,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #0a1f3a22", fontSize:13, color:"#e2e8f0" }}>{f}</div>
            ))}
            <button style={{ width:"100%", background:"linear-gradient(135deg,#00d4ff,#0080ff)", border:"none", borderRadius:14, padding:"16px", marginTop:20, color:"#000", fontSize:16, fontWeight:900, cursor:"pointer" }}>Get Pro · $4.99 / month</button>
            <div style={{ textAlign:"center", fontSize:11, color:"#1e3a5a", marginTop:10 }}>Cancel anytime · 3-day free trial</div>
            <button onClick={()=>setShowPro(false)} style={{ background:"none", border:"none", width:"100%", color:"#1e3a5a", fontSize:12, marginTop:10, cursor:"pointer" }}>No thanks, keep seeing ads</button>
          </div>
        </div>
      )}
    </div>
  );
}
