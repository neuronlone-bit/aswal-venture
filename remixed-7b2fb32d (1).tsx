import { useState, useEffect, useRef } from "react";

// ─── DATA ───────────────────────────────────────────────────────────────────

const ROUTES = [
  { id:1, name:"Clock Tower → ISBT", via:"Rajpur Rd", time:18, dist:"5.2 km", status:"heavy", alt:"Via Chakrata Rd (+4 min)", sponsored:false },
  { id:2, name:"Paltan Bazaar → Sahastradhara", via:"Haridwar Bypass", time:26, dist:"11.4 km", status:"moderate", alt:null, sponsored:true, sponsor:"Hotel Pacific Dehradun" },
  { id:3, name:"Clement Town → FRI", via:"GMS Rd", time:12, dist:"4.8 km", status:"clear", alt:null, sponsored:false },
  { id:4, name:"Rispana → IT Park", via:"Saharanpur Rd", time:22, dist:"7.1 km", status:"heavy", alt:"Via Ring Rd (+6 min)", sponsored:false },
];

const HOTSPOTS = [
  { id:1, name:"Clock Tower Chowk", congestion:92, trend:"↑", color:"#ef4444" },
  { id:2, name:"Ballupur Chowk", congestion:74, trend:"→", color:"#f97316" },
  { id:3, name:"Prem Nagar", congestion:58, trend:"↓", color:"#eab308" },
  { id:4, name:"Rajpur Road", congestion:81, trend:"↑", color:"#ef4444" },
  { id:5, name:"Haridwar Bypass", congestion:33, trend:"↓", color:"#22c55e" },
  { id:6, name:"IT Park Junction", congestion:67, trend:"→", color:"#f97316" },
];

const ALERTS = [
  { id:1, icon:"🚧", text:"Road repair work on Rajpur Road near Parade Ground. Expect 15-min delays.", time:"2 min ago", severity:"high" },
  { id:2, icon:"🚌", text:"Heavy bus movement near ISBT. Avoid Haridwar Bypass 8-10 AM.", time:"12 min ago", severity:"medium" },
  { id:3, icon:"🌧️", text:"Light rain near Mussoorie Diversion. Wet roads reported.", time:"28 min ago", severity:"low" },
  { id:4, icon:"🎉", text:"Parade Ground event tonight — expect heavy traffic 5-9 PM.", time:"1 hr ago", severity:"medium" },
];

const LOCAL_ADS = [
  { id:1, brand:"Ellora's Bakery", offer:"15% OFF today — On your way to work?", tag:"Nearby • 400m", icon:"🥐", cta:"Get Offer" },
  { id:2, brand:"SOS Mechanics", offer:"Free tyre check during traffic jams. Call us!", tag:"Sponsored • 1.2km", icon:"🔧", cta:"Call Now" },
  { id:3, brand:"Pacific Mall Doon", offer:"Free parking on weekdays — avoid street chaos!", tag:"Sponsored • 2.1km", icon:"🛍️", cta:"Navigate" },
];

const TRAFFIC_RULES = [
  { id:1, category:"Speed Limits", icon:"🚗", color:"#3b82f6", rules:[
    { rule:"Urban areas (inside city)", limit:"50 km/h", note:"Rajpur Rd, Clock Tower area" },
    { rule:"Expressway / Highway", limit:"100 km/h", note:"Haridwar-Dehradun NH" },
    { rule:"School zones", limit:"25 km/h", note:"During school hours 7-9 AM, 1-3 PM" },
    { rule:"Residential zones", limit:"30 km/h", note:"Vasant Vihar, Turner Rd" },
  ]},
  { id:2, category:"Helmet & Seatbelt", icon:"🪖", color:"#22c55e", rules:[
    { rule:"Two-wheeler rider", limit:"Helmet mandatory", note:"ISI-certified only; both rider & pillion" },
    { rule:"Car driver & front seat", limit:"Seatbelt mandatory", note:"Rs.1,000 fine per violation" },
    { rule:"Car rear passengers", limit:"Seatbelt mandatory", note:"Effective 2023 under MV Act" },
    { rule:"Children below 4 yrs", limit:"Child seat required", note:"In rear seat, facing backward" },
  ]},
  { id:3, category:"Parking Rules", icon:"🅿️", color:"#f59e0b", rules:[
    { rule:"No-parking zones", limit:"Strict tow zone", note:"Clock Tower, Paltan Bazaar" },
    { rule:"Footpath parking", limit:"Prohibited", note:"Rs.500 fine + towing" },
    { rule:"Double parking", limit:"Prohibited", note:"Rs.1,000 fine" },
    { rule:"Disabled bay misuse", limit:"Rs.2,000 fine", note:"Immediate tow + penalty" },
  ]},
  { id:4, category:"Phone & Distracted Driving", icon:"📵", color:"#ef4444", rules:[
    { rule:"Mobile phone while driving", limit:"Prohibited", note:"Rs.1,000 first offence, Rs.10,000 repeat" },
    { rule:"Earphones / AirPods", limit:"One ear max", note:"Both ears blocked = violation" },
    { rule:"Eating while driving", limit:"Distraction offence", note:"Rs.500 fine" },
  ]},
  { id:5, category:"DUI / Drunk Driving", icon:"🍺", color:"#a855f7", rules:[
    { rule:"Blood Alcohol Level", limit:"< 30mg/100ml", note:"Zero tolerance for commercial drivers" },
    { rule:"First offence", limit:"Rs.10,000 + 6 months jail", note:"License suspended" },
    { rule:"Second offence", limit:"Rs.15,000 + 2 yr jail", note:"Permanent record" },
  ]},
];

const FINES_DATA = [
  { id:1, violation:"Signal Jumping (Red Light)", amount:1000, section:"S.177 MV Act", severity:"medium", icon:"🚦", points:-5 },
  { id:2, violation:"Over Speeding (upto 40km/h over)", amount:1000, section:"S.183 MV Act", severity:"medium", icon:"💨", points:-5 },
  { id:3, violation:"Over Speeding (40+ km/h over)", amount:2000, section:"S.183(2)", severity:"high", icon:"🏎️", points:-10 },
  { id:4, violation:"Driving Without Helmet", amount:1000, section:"S.129 MV Act", severity:"medium", icon:"🪖", points:-5 },
  { id:5, violation:"No Seatbelt", amount:1000, section:"S.194B", severity:"medium", icon:"🔒", points:-5 },
  { id:6, violation:"Drunk Driving (First offence)", amount:10000, section:"S.185 MV Act", severity:"critical", icon:"🍺", points:-20 },
  { id:7, violation:"Using Mobile While Driving", amount:5000, section:"S.184 MV Act", severity:"high", icon:"📱", points:-10 },
  { id:8, violation:"Driving Without Licence", amount:5000, section:"S.181 MV Act", severity:"high", icon:"🪪", points:-15 },
  { id:9, violation:"Wrong Side Driving", amount:1000, section:"S.184 MV Act", severity:"medium", icon:"↔️", points:-8 },
  { id:10, violation:"Overloading (Vehicle)", amount:2000, section:"S.194 MV Act", severity:"medium", icon:"⚖️", points:-5 },
  { id:11, violation:"Triple Riding (2-wheeler)", amount:1000, section:"S.128 MV Act", severity:"medium", icon:"🛵", points:-5 },
  { id:12, violation:"Parking Violation", amount:500, section:"S.122 MV Act", severity:"low", icon:"🅿️", points:-2 },
];

const CHALLANS_INIT = [
  { id:"DL2024001", vehicle:"UK07-XX-1234", violation:"Signal Jumping", date:"04 Mar 2026", amount:1000, status:"unpaid", location:"Clock Tower Chowk" },
  { id:"DL2024002", vehicle:"UK07-XX-1234", violation:"No Seatbelt", date:"14 Feb 2026", amount:1000, status:"paid", location:"Rajpur Road" },
  { id:"DL2024003", vehicle:"UK07-XX-1234", violation:"Parking Violation", date:"02 Jan 2026", amount:500, status:"paid", location:"Paltan Bazaar" },
];

const REWARDS_INIT = [
  { id:1, icon:"🌿", title:"Green Commuter", desc:"Used public transport 10 days in a row", points:200, claimed:true },
  { id:2, icon:"⛽", title:"Fuel Saver", desc:"Carpooled to IT Park 5 times this month", points:150, claimed:true },
  { id:3, icon:"🛡️", title:"Safe Driver", desc:"Zero violations in last 90 days", points:500, claimed:false },
  { id:4, icon:"🎓", title:"Rule Scholar", desc:"Completed traffic quiz with 100% score", points:100, claimed:false },
  { id:5, icon:"🌙", title:"Off-Peak Hero", desc:"Travelled outside peak hours 15 times", points:250, claimed:false },
  { id:6, icon:"🚶", title:"Pedestrian Respect", desc:"Stopped at zebra crossing 20 times", points:300, claimed:false },
];

const LEADERBOARD = [
  { rank:1, name:"Arjun M.", points:2840, badge:"🥇", vehicle:"UK07-AB" },
  { rank:2, name:"Priya S.", points:2710, badge:"🥈", vehicle:"UK07-CD" },
  { rank:3, name:"Rohit K.", points:2590, badge:"🥉", vehicle:"UK07-EF" },
  { rank:4, name:"You", points:1920, badge:"⭐", vehicle:"UK07-XX", isUser:true },
  { rank:5, name:"Neha T.", points:1800, badge:"", vehicle:"UK07-GH" },
];

const statusColor = { heavy:"#ef4444", moderate:"#f97316", clear:"#22c55e" };
const statusLabel = { heavy:"Heavy", moderate:"Moderate", clear:"Clear" };
const severityColor = { low:"#22c55e", medium:"#f97316", high:"#ef4444", critical:"#a855f7" };

// ─── SHARED UI ───────────────────────────────────────────────────────────────

function AdBanner({ variant = "top" }) {
  const ads = [
    { bg:"linear-gradient(135deg,#1a1a2e,#16213e)", accent:"#f59e0b", brand:"Doon Valley Motors", text:"New Car EMI from Rs.6,999/mo", sub:"Test drive near you →", badge:"AD" },
    { bg:"linear-gradient(135deg,#0f2027,#203a43)", accent:"#34d399", brand:"Nainital Bank", text:"Zero-fee UPI & Instant Loans", sub:"Open account today →", badge:"AD" },
  ];
  const ad = ads[variant === "top" ? 0 : 1];
  return (
    <div style={{ background:ad.bg, borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", border:`1px solid ${ad.accent}33`, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, opacity:0.04, backgroundImage:"repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)", backgroundSize:"8px 8px" }} />
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
          <span style={{ fontSize:9, color:ad.accent, fontFamily:"monospace", border:`1px solid ${ad.accent}`, padding:"1px 5px", borderRadius:3, letterSpacing:1 }}>{ad.badge}</span>
          <span style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>{ad.brand}</span>
        </div>
        <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9" }}>{ad.text}</div>
        <div style={{ fontSize:11, color:ad.accent, marginTop:2 }}>{ad.sub}</div>
      </div>
      <button style={{ background:ad.accent, color:"#000", border:"none", borderRadius:8, padding:"8px 14px", fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>Open</button>
    </div>
  );
}

function TrafficBar({ value, color }) {
  return (
    <div style={{ background:"#1e293b", borderRadius:99, height:6, overflow:"hidden", flex:1 }}>
      <div style={{ width:`${value}%`, height:"100%", background:color, borderRadius:99, transition:"width 1s ease" }} />
    </div>
  );
}

function RouteCard({ route }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div onClick={() => setExpanded(!expanded)} style={{ background:"#0f172a", border:route.sponsored?"1px solid #f59e0b44":"1px solid #1e293b", borderRadius:12, padding:"14px 16px", cursor:"pointer", position:"relative" }}>
      {route.sponsored && <div style={{ position:"absolute", top:10, right:12, fontSize:9, color:"#f59e0b", border:"1px solid #f59e0b55", padding:"1px 6px", borderRadius:4, fontFamily:"monospace", letterSpacing:1 }}>SPONSORED</div>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div>
          <div style={{ fontWeight:700, fontSize:14, color:"#f1f5f9", marginBottom:2 }}>{route.name}</div>
          <div style={{ fontSize:11, color:"#64748b" }}>via {route.via} · {route.dist}</div>
          {route.sponsored && <div style={{ fontSize:10, color:"#f59e0b", marginTop:3 }}>🏨 Suggested by {route.sponsor}</div>}
        </div>
        <div style={{ textAlign:"right", flexShrink:0, marginLeft:10 }}>
          <div style={{ fontSize:22, fontWeight:800, color:"#f1f5f9", lineHeight:1 }}>{route.time}<span style={{ fontSize:11, fontWeight:400, color:"#64748b" }}> min</span></div>
          <div style={{ marginTop:4 }}>
            <span style={{ background:statusColor[route.status]+"22", color:statusColor[route.status], fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99 }}>{statusLabel[route.status]}</span>
          </div>
        </div>
      </div>
      {expanded && route.alt && <div style={{ background:"#1e293b", borderRadius:8, padding:"8px 12px", fontSize:12, color:"#94a3b8", marginTop:4 }}>💡 Alternative: {route.alt}</div>}
      {!expanded && route.alt && <div style={{ fontSize:11, color:"#3b82f6", marginTop:2 }}>Alt route available ›</div>}
    </div>
  );
}

function AlertCard({ alert }) {
  const colors = { high:"#ef4444", medium:"#f97316", low:"#eab308" };
  return (
    <div style={{ display:"flex", gap:12, padding:"12px 0", borderBottom:"1px solid #1e293b" }}>
      <div style={{ fontSize:22, flexShrink:0 }}>{alert.icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, color:"#e2e8f0", lineHeight:1.5 }}>{alert.text}</div>
        <div style={{ fontSize:11, color:"#475569", marginTop:4 }}>{alert.time}</div>
      </div>
      <div style={{ width:4, borderRadius:99, background:colors[alert.severity], flexShrink:0 }} />
    </div>
  );
}

function LocalAdCard({ ad }) {
  return (
    <div style={{ background:"linear-gradient(135deg,#0f172a,#162032)", border:"1px solid #1e293b", borderRadius:12, padding:"14px 16px", minWidth:220, display:"flex", flexDirection:"column", gap:8, flexShrink:0 }}>
      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
        <div style={{ fontSize:28 }}>{ad.icon}</div>
        <div>
          <div style={{ fontWeight:700, fontSize:13, color:"#f1f5f9" }}>{ad.brand}</div>
          <div style={{ fontSize:10, color:"#f59e0b" }}>{ad.tag}</div>
        </div>
      </div>
      <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.5 }}>{ad.offer}</div>
      <button style={{ background:"#f59e0b", color:"#000", border:"none", borderRadius:8, padding:"7px 0", fontWeight:700, fontSize:12, cursor:"pointer" }}>{ad.cta}</button>
    </div>
  );
}

// ─── GOVT SUB-SECTIONS ───────────────────────────────────────────────────────

function GovtBadge() {
  return (
    <div style={{ background:"linear-gradient(135deg,#0c2340,#1a3a5c)", border:"1px solid #2563eb44", borderRadius:14, padding:"14px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:14 }}>
      <div style={{ fontSize:36 }}>🏛️</div>
      <div>
        <div style={{ fontSize:11, color:"#60a5fa", fontWeight:700, letterSpacing:1, marginBottom:2 }}>UTTARAKHAND GOVERNMENT</div>
        <div style={{ fontSize:15, fontWeight:800, color:"#f1f5f9" }}>Traffic Compliance Portal</div>
        <div style={{ fontSize:11, color:"#64748b" }}>Dehradun Traffic Police · MV Act 2019</div>
      </div>
      <div style={{ marginLeft:"auto", flexShrink:0 }}>
        <div style={{ background:"#22c55e22", border:"1px solid #22c55e44", borderRadius:8, padding:"4px 10px", fontSize:10, color:"#22c55e", fontWeight:700 }}>LIVE</div>
      </div>
    </div>
  );
}

function RulesSection() {
  const [open, setOpen] = useState(null);
  return (
    <div>
      <div style={{ fontSize:13, fontWeight:700, color:"#94a3b8", marginBottom:12, letterSpacing:0.5 }}>TRAFFIC RULES — UTTARAKHAND</div>
      {TRAFFIC_RULES.map(cat => (
        <div key={cat.id} style={{ marginBottom:10 }}>
          <div onClick={() => setOpen(open===cat.id ? null : cat.id)} style={{ background:"#0f172a", border:`1px solid ${cat.color}33`, borderRadius:12, padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:cat.color+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{cat.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:13, color:"#f1f5f9" }}>{cat.category}</div>
              <div style={{ fontSize:11, color:"#64748b" }}>{cat.rules.length} rules</div>
            </div>
            <div style={{ color:"#475569", fontSize:18, transition:"transform 0.2s", transform:open===cat.id?"rotate(90deg)":"rotate(0deg)" }}>›</div>
          </div>
          {open === cat.id && (
            <div style={{ background:"#060e1f", border:`1px solid ${cat.color}22`, borderTop:"none", borderRadius:"0 0 12px 12px" }}>
              {cat.rules.map((r,i) => (
                <div key={i} style={{ padding:"12px 16px", borderBottom:i<cat.rules.length-1?"1px solid #1e293b":"none" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:"#e2e8f0", fontWeight:600 }}>{r.rule}</div>
                      <div style={{ fontSize:11, color:"#475569", marginTop:3 }}>📍 {r.note}</div>
                    </div>
                    <div style={{ background:cat.color+"22", border:`1px solid ${cat.color}44`, borderRadius:8, padding:"4px 10px", fontSize:11, fontWeight:700, color:cat.color, flexShrink:0, textAlign:"center" }}>{r.limit}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FinesSection() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const filtered = FINES_DATA.filter(f => {
    const ms = f.violation.toLowerCase().includes(search.toLowerCase());
    const mf = filter==="all" || f.severity===filter;
    return ms && mf;
  });
  return (
    <div>
      <div style={{ fontSize:13, fontWeight:700, color:"#94a3b8", marginBottom:12, letterSpacing:0.5 }}>FINE SCHEDULE — MV ACT 2019</div>
      <input placeholder="🔍  Search violation..." value={search} onChange={e => setSearch(e.target.value)}
        style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:10, padding:"10px 14px", color:"#f1f5f9", fontSize:13, width:"100%", boxSizing:"border-box", marginBottom:12 }} />
      <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:4, scrollbarWidth:"none" }}>
        {["all","low","medium","high","critical"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ background:filter===s?(s==="all"?"#3b82f6":severityColor[s]):"#0f172a", border:`1px solid ${s==="all"?"#3b82f644":severityColor[s]+"44"}`, borderRadius:20, padding:"5px 14px", fontSize:11, fontWeight:700, color:filter===s?"#000":"#94a3b8", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, textTransform:"capitalize" }}>{s}</button>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {filtered.map(f => (
          <div key={f.id} style={{ background:"#0f172a", borderLeft:`3px solid ${severityColor[f.severity]}`, borderTop:`1px solid ${severityColor[f.severity]}22`, borderBottom:`1px solid ${severityColor[f.severity]}22`, borderRight:`1px solid ${severityColor[f.severity]}22`, borderRadius:"0 12px 12px 0", padding:"12px 14px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:20 }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#f1f5f9" }}>{f.violation}</div>
                  <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>{f.section}</div>
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                <div style={{ fontSize:18, fontWeight:900, color:severityColor[f.severity] }}>Rs.{f.amount.toLocaleString()}</div>
                <div style={{ fontSize:10, color:"#ef4444" }}>{f.points} pts</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChallanSection() {
  const [vehicleNo, setVehicleNo] = useState("UK07-XX-1234");
  const [searched, setSearched] = useState(true);
  const [paidIds, setPaidIds] = useState([]);
  const [payModal, setPayModal] = useState(null);

  const challans = CHALLANS_INIT;
  const unpaidTotal = challans.filter(c => c.status==="unpaid" && !paidIds.includes(c.id)).reduce((a,c) => a+c.amount, 0);

  return (
    <div>
      <div style={{ fontSize:13, fontWeight:700, color:"#94a3b8", marginBottom:12, letterSpacing:0.5 }}>CHALLAN LOOKUP & PAYMENT</div>
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        <input value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} placeholder="Enter Vehicle No."
          style={{ flex:1, background:"#0f172a", border:"1px solid #1e293b", borderRadius:10, padding:"10px 14px", color:"#f1f5f9", fontSize:13 }} />
        <button onClick={() => setSearched(true)} style={{ background:"#2563eb", border:"none", borderRadius:10, padding:"10px 16px", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>Check</button>
      </div>

      {searched && (
        <>
          {unpaidTotal > 0 ? (
            <div style={{ background:"linear-gradient(135deg,#450a0a,#1a0808)", border:"1px solid #ef444444", borderRadius:12, padding:"14px 16px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:12, color:"#f87171", fontWeight:700, marginBottom:4 }}>⚠️ OUTSTANDING DUES</div>
                <div style={{ fontSize:28, fontWeight:900, color:"#ef4444" }}>Rs.{unpaidTotal}</div>
                <div style={{ fontSize:11, color:"#991b1b", marginTop:2 }}>Pay before 31 Mar 2026 to avoid summons</div>
              </div>
              <button onClick={() => setPayModal("all")} style={{ background:"#ef4444", border:"none", borderRadius:10, padding:"10px 16px", color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer" }}>Pay All</button>
            </div>
          ) : (
            <div style={{ background:"#052e16", border:"1px solid #22c55e44", borderRadius:12, padding:"12px 16px", marginBottom:14, textAlign:"center" }}>
              <div style={{ fontSize:20, marginBottom:4 }}>✅</div>
              <div style={{ fontSize:13, fontWeight:700, color:"#22c55e" }}>No outstanding challans</div>
            </div>
          )}

          {challans.map(c => {
            const isPaid = c.status==="paid" || paidIds.includes(c.id);
            return (
              <div key={c.id} style={{ background:"#0f172a", border:`1px solid ${isPaid?"#22c55e22":"#ef444422"}`, borderRadius:12, padding:"14px 16px", marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:10, color:"#475569", marginBottom:2 }}>Challan #{c.id}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9" }}>{c.violation}</div>
                    <div style={{ fontSize:11, color:"#64748b", marginTop:3 }}>📍 {c.location} · {c.date}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:20, fontWeight:900, color:isPaid?"#22c55e":"#ef4444" }}>Rs.{c.amount}</div>
                    <div style={{ fontSize:10, fontWeight:700, color:isPaid?"#22c55e":"#ef4444", marginTop:2 }}>{isPaid?"PAID":"UNPAID"}</div>
                  </div>
                </div>
                {isPaid
                  ? <div style={{ background:"#22c55e11", border:"1px solid #22c55e22", borderRadius:8, padding:"6px", textAlign:"center", fontSize:11, color:"#22c55e" }}>✔ Payment Confirmed</div>
                  : <button onClick={() => setPayModal(c.id)} style={{ width:"100%", background:"#ef444422", border:"1px solid #ef444444", borderRadius:8, padding:"8px", color:"#ef4444", fontWeight:700, fontSize:12, cursor:"pointer" }}>Pay Rs.{c.amount} →</button>
                }
              </div>
            );
          })}
        </>
      )}

      {payModal && (
        <div onClick={() => setPayModal(null)} style={{ position:"fixed", inset:0, background:"#000000cc", zIndex:300, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"linear-gradient(180deg,#0f172a,#020817)", borderRadius:"24px 24px 0 0", padding:28, width:"100%", maxWidth:420, border:"1px solid #1e293b", borderBottom:"none" }}>
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:36, marginBottom:8 }}>💳</div>
              <div style={{ fontSize:20, fontWeight:900, color:"#f1f5f9" }}>Pay Challan</div>
              <div style={{ fontSize:13, color:"#64748b", marginTop:4 }}>Secure · Govt. Payment Gateway</div>
            </div>
            <div style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:12, padding:16, marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:13, color:"#64748b" }}>Challan Amount</span>
                <span style={{ fontSize:13, fontWeight:700, color:"#f1f5f9" }}>Rs.1,000</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:13, color:"#64748b" }}>Processing Fee</span>
                <span style={{ fontSize:13, fontWeight:700, color:"#22c55e" }}>Free</span>
              </div>
              <div style={{ height:1, background:"#1e293b", margin:"10px 0" }} />
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:14, fontWeight:700, color:"#f1f5f9" }}>Total Due</span>
                <span style={{ fontSize:18, fontWeight:900, color:"#22c55e" }}>Rs.1,000</span>
              </div>
            </div>
            {[["📱","UPI / GPay / PhonePe"],["💳","Debit / Credit Card"],["🏦","Net Banking"],["💰","Paytm / Wallet"]].map(([em,m],i) => (
              <button key={i} onClick={() => { setPaidIds(p=>[...p, payModal]); setPayModal(null); }}
                style={{ width:"100%", background:"#0f172a", border:"1px solid #1e293b", borderRadius:10, padding:"12px 16px", color:"#f1f5f9", fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:8, textAlign:"left" }}>
                {em} &nbsp;{m}
              </button>
            ))}
            <button onClick={() => setPayModal(null)} style={{ background:"none", border:"none", width:"100%", color:"#475569", fontSize:12, marginTop:4, cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function RewardsSection() {
  const [rewards, setRewards] = useState(REWARDS_INIT);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [quizDone, setQuizDone] = useState(false);

  const totalPoints = 1920;
  const nextTier = 2500;
  const progress = (totalPoints / nextTier) * 100;

  const QUIZ = [
    { q:"What is the speed limit in urban areas of Dehradun?", opts:["30 km/h","50 km/h","70 km/h","100 km/h"], ans:1 },
    { q:"Blood alcohol limit for private vehicle drivers?", opts:["10mg/100ml","20mg/100ml","30mg/100ml","50mg/100ml"], ans:2 },
    { q:"Fine for using mobile while driving (first offence)?", opts:["Rs.500","Rs.1,000","Rs.5,000","Rs.10,000"], ans:2 },
    { q:"Helmet is mandatory for which riders?", opts:["Only driver","Only pillion","Both rider & pillion","Neither"], ans:2 },
  ];

  const handleAnswer = (i) => {
    if (selected !== null) return;
    setSelected(i);
    const correct = i === QUIZ[quizStep].ans;
    if (correct) setQuizScore(s => s+1);
    setTimeout(() => {
      if (quizStep < QUIZ.length-1) { setQuizStep(s=>s+1); setSelected(null); }
      else { setQuizDone(true); }
    }, 800);
  };

  const claimReward = (id) => setRewards(rs => rs.map(r => r.id===id ? {...r, claimed:true} : r));

  return (
    <div>
      {/* Score Card */}
      <div style={{ background:"linear-gradient(135deg,#1e1b4b,#312e81)", border:"1px solid #6366f144", borderRadius:16, padding:18, marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:11, color:"#a5b4fc", fontWeight:700, letterSpacing:1 }}>YOUR CITIZEN SCORE</div>
            <div style={{ fontSize:42, fontWeight:900, color:"#f1f5f9", lineHeight:1.1 }}>{totalPoints.toLocaleString()}</div>
            <div style={{ fontSize:12, color:"#818cf8", marginTop:4 }}>🏆 Silver Driver · Rank #4 in Dehradun</div>
          </div>
          <div style={{ background:"#6366f122", border:"1px solid #6366f144", borderRadius:12, padding:"8px 14px", textAlign:"center" }}>
            <div style={{ fontSize:28 }}>🥈</div>
            <div style={{ fontSize:10, color:"#a5b4fc", fontWeight:700 }}>SILVER</div>
          </div>
        </div>
        <div style={{ fontSize:11, color:"#818cf8", marginBottom:6 }}>Next: Gold Tier at {nextTier} pts</div>
        <div style={{ background:"#1e1b4b", borderRadius:99, height:8, overflow:"hidden" }}>
          <div style={{ width:`${progress}%`, height:"100%", background:"linear-gradient(90deg,#6366f1,#a855f7)", borderRadius:99 }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
          <span style={{ fontSize:10, color:"#4338ca" }}>0</span>
          <span style={{ fontSize:10, color:"#a5b4fc" }}>{totalPoints} / {nextTier}</span>
        </div>
      </div>

      {/* Tier Explanation */}
      <div style={{ display:"flex", gap:6, marginBottom:16, overflowX:"auto", paddingBottom:4, scrollbarWidth:"none" }}>
        {[["🥉","Bronze","0-999"],["🥈","Silver","1000-2499"],["🥇","Gold","2500-4999"],["💎","Platinum","5000+"]].map(([ic,name,range],i) => (
          <div key={i} style={{ background:i===1?"#312e81":"#0f172a", border:i===1?"1px solid #6366f1":"1px solid #1e293b", borderRadius:10, padding:"8px 12px", flexShrink:0, textAlign:"center", minWidth:80 }}>
            <div style={{ fontSize:18 }}>{ic}</div>
            <div style={{ fontSize:11, fontWeight:700, color:i===1?"#a5b4fc":"#64748b" }}>{name}</div>
            <div style={{ fontSize:9, color:"#475569" }}>{range}</div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:14, padding:16, marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#94a3b8", marginBottom:12, letterSpacing:0.5 }}>🏆 CITY LEADERBOARD</div>
        {LEADERBOARD.map(l => (
          <div key={l.rank} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 8px", marginBottom:2, background:l.isUser?"#6366f111":"transparent", borderRadius:l.isUser?8:0 }}>
            <div style={{ fontSize:20, width:28, textAlign:"center" }}>{l.badge || `#${l.rank}`}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:l.isUser?800:600, color:l.isUser?"#a5b4fc":"#e2e8f0" }}>{l.name}{l.isUser?" 👈":""}</div>
              <div style={{ fontSize:10, color:"#475569" }}>{l.vehicle}</div>
            </div>
            <div style={{ fontSize:14, fontWeight:800, color:l.isUser?"#a5b4fc":"#f1f5f9" }}>{l.points.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Rewards list */}
      <div style={{ fontSize:13, fontWeight:700, color:"#94a3b8", marginBottom:12, letterSpacing:0.5 }}>🎁 GOVERNMENT REWARDS</div>
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
        {rewards.map(r => (
          <div key={r.id} style={{ background:"#0f172a", border:r.claimed?"1px solid #22c55e33":"1px solid #1e293b", borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ fontSize:28, flexShrink:0 }}>{r.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#f1f5f9" }}>{r.title}</div>
              <div style={{ fontSize:11, color:"#64748b", marginTop:2, lineHeight:1.4 }}>{r.desc}</div>
              <div style={{ fontSize:11, color:"#a855f7", marginTop:4, fontWeight:700 }}>+{r.points} Citizen Pts</div>
            </div>
            {r.claimed
              ? <div style={{ fontSize:11, color:"#22c55e", fontWeight:700, flexShrink:0 }}>✓ Claimed</div>
              : <button onClick={() => claimReward(r.id)} style={{ background:"#a855f722", border:"1px solid #a855f744", borderRadius:8, padding:"8px 14px", color:"#a855f7", fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0 }}>Claim</button>
            }
          </div>
        ))}
      </div>

      {/* Redeem section */}
      <div style={{ background:"linear-gradient(135deg,#1a0a2e,#2d1b55)", border:"1px solid #7c3aed44", borderRadius:14, padding:16, marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#c4b5fd", marginBottom:12, letterSpacing:0.5 }}>🎟️ REDEEM POINTS</div>
        {[
          { label:"Waive 1 Parking Fine", cost:500, icon:"🅿️" },
          { label:"Free Vehicle Inspection", cost:800, icon:"🔍" },
          { label:"Priority Challan Dispute", cost:1200, icon:"⚖️" },
          { label:"Govt. Road Tax Discount 10%", cost:2000, icon:"💰" },
        ].map((item,i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:i<3?"1px solid #7c3aed22":"none" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:18 }}>{item.icon}</span>
              <div style={{ fontSize:13, color:"#e2e8f0" }}>{item.label}</div>
            </div>
            <button style={{ background:totalPoints>=item.cost?"#7c3aed":"#1e293b", border:"none", borderRadius:8, padding:"6px 12px", color:totalPoints>=item.cost?"#fff":"#475569", fontSize:11, fontWeight:700, cursor:totalPoints>=item.cost?"pointer":"default" }}>
              {item.cost} pts
            </button>
          </div>
        ))}
      </div>

      {/* Quiz CTA */}
      <div style={{ background:"linear-gradient(135deg,#052e16,#063a1c)", border:"1px solid #22c55e44", borderRadius:14, padding:18, textAlign:"center" }}>
        <div style={{ fontSize:30, marginBottom:8 }}>🎓</div>
        <div style={{ fontWeight:800, color:"#f1f5f9", marginBottom:4 }}>Traffic Rules Quiz</div>
        <div style={{ fontSize:12, color:"#64748b", marginBottom:14 }}>Answer correctly and earn up to 100 pts per quiz</div>
        <button onClick={() => { setShowQuiz(true); setQuizStep(0); setQuizScore(0); setSelected(null); setQuizDone(false); }}
          style={{ background:"#22c55e", border:"none", borderRadius:10, padding:"12px 28px", color:"#000", fontWeight:800, fontSize:14, cursor:"pointer" }}>
          Start Quiz →
        </button>
      </div>

      {/* Quiz Modal */}
      {showQuiz && (
        <div style={{ position:"fixed", inset:0, background:"#000000dd", zIndex:300, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div style={{ background:"linear-gradient(180deg,#0f172a,#020817)", borderRadius:"24px 24px 0 0", padding:28, width:"100%", maxWidth:420, border:"1px solid #1e293b", borderBottom:"none" }}>
            {!quizDone ? (
              <>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#64748b" }}>Q{quizStep+1} / {QUIZ.length}</div>
                  <div style={{ fontSize:13, color:"#22c55e", fontWeight:700 }}>Score: {quizScore}</div>
                </div>
                {/* Progress bar */}
                <div style={{ background:"#1e293b", borderRadius:99, height:4, marginBottom:20 }}>
                  <div style={{ width:`${((quizStep)/QUIZ.length)*100}%`, height:"100%", background:"#22c55e", borderRadius:99 }} />
                </div>
                <div style={{ fontSize:17, fontWeight:700, color:"#f1f5f9", lineHeight:1.5, marginBottom:20 }}>{QUIZ[quizStep].q}</div>
                {QUIZ[quizStep].opts.map((opt,i) => {
                  let bg="#0f172a", border="1px solid #1e293b", color="#e2e8f0";
                  if (selected !== null) {
                    if (i===QUIZ[quizStep].ans) { bg="#052e16"; border="1px solid #22c55e"; color="#22c55e"; }
                    else if (i===selected) { bg="#450a0a"; border="1px solid #ef4444"; color="#ef4444"; }
                  }
                  return (
                    <button key={i} onClick={() => handleAnswer(i)} style={{ width:"100%", background:bg, border, borderRadius:10, padding:"12px 16px", color, fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:8, textAlign:"left", transition:"all 0.2s" }}>
                      {["A","B","C","D"][i]}. {opt}
                    </button>
                  );
                })}
              </>
            ) : (
              <div style={{ textAlign:"center", padding:"20px 0" }}>
                <div style={{ fontSize:50, marginBottom:12 }}>{quizScore===QUIZ.length?"🎉":quizScore>=2?"😊":"😅"}</div>
                <div style={{ fontSize:22, fontWeight:900, color:"#f1f5f9", marginBottom:8 }}>{quizScore}/{QUIZ.length} Correct!</div>
                <div style={{ fontSize:14, color:"#64748b", marginBottom:20 }}>You earned <span style={{ color:"#22c55e", fontWeight:800 }}>+{quizScore*25} Citizen Points</span></div>
                {quizScore===QUIZ.length && <div style={{ background:"#052e16", border:"1px solid #22c55e44", borderRadius:12, padding:12, marginBottom:16, fontSize:13, color:"#22c55e" }}>🏆 Perfect Score Bonus! +100 pts</div>}
                <button onClick={() => setShowQuiz(false)} style={{ background:"#22c55e", border:"none", borderRadius:10, padding:"12px 28px", color:"#000", fontWeight:800, fontSize:14, cursor:"pointer" }}>Done ✓</button>
              </div>
            )}
            {!quizDone && <button onClick={() => setShowQuiz(false)} style={{ background:"none", border:"none", width:"100%", color:"#475569", fontSize:12, marginTop:8, cursor:"pointer" }}>Close Quiz</button>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function DehradunTrafficApp() {
  const [activeTab, setActiveTab] = useState("map");
  const [govtTab, setGovtTab] = useState("rules");
  const [time, setTime] = useState(new Date());
  const [showPremium, setShowPremium] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const tabs = [
    { id:"map", label:"Traffic", icon:"🗺️" },
    { id:"routes", label:"Routes", icon:"🛣️" },
    { id:"alerts", label:"Alerts", icon:"🔔" },
    { id:"nearby", label:"Nearby", icon:"📍" },
    { id:"govt", label:"Gov't", icon:"🏛️" },
  ];

  const govtTabs = [
    { id:"rules", label:"Rules" },
    { id:"fines", label:"Fines" },
    { id:"challan", label:"Challan" },
    { id:"rewards", label:"Rewards" },
  ];

  return (
    <div style={{ fontFamily:"'Outfit','DM Sans',sans-serif", background:"#020817", minHeight:"100vh", color:"#f1f5f9", maxWidth:420, margin:"0 auto", position:"relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} *{box-sizing:border-box}`}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(180deg,#020817,#0a0f1e)", padding:"16px 20px 12px", borderBottom:"1px solid #1e293b", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:8, height:8, background:"#22c55e", borderRadius:"50%", boxShadow:"0 0 8px #22c55e" }} />
              <span style={{ fontSize:11, color:"#22c55e", fontWeight:600, letterSpacing:1 }}>LIVE</span>
              <span style={{ fontSize:11, color:"#475569" }}>{time.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span>
            </div>
            <div style={{ fontSize:22, fontWeight:900, letterSpacing:-0.5, marginTop:2 }}>Doon<span style={{ color:"#f59e0b" }}>Traffic</span></div>
          </div>
          <button onClick={() => setShowPremium(true)} style={{ background:"linear-gradient(135deg,#f59e0b,#ef4444)", border:"none", borderRadius:20, padding:"8px 16px", color:"#000", fontWeight:800, fontSize:12, cursor:"pointer" }}>⚡ PRO</button>
        </div>
      </div>

      {/* Ad Banner */}
      <div style={{ padding:"12px 20px 0" }}><AdBanner variant="top" /></div>

      {/* Top Tabs */}
      <div style={{ display:"flex", padding:"14px 20px 0", gap:4 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex:1, background:activeTab===tab.id?(tab.id==="govt"?"#2563eb":"#f59e0b"):"#0f172a", color:activeTab===tab.id?(tab.id==="govt"?"#fff":"#000"):"#64748b", border:activeTab===tab.id?"none":"1px solid #1e293b", borderRadius:10, padding:"9px 4px", fontSize:10, fontWeight:700, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, transition:"all 0.2s" }}>
            <span style={{ fontSize:15 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Page Content */}
      <div style={{ padding:"16px 20px", paddingBottom:110 }}>

        {/* TRAFFIC MAP */}
        {activeTab === "map" && (
          <div>
            <div style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:16, padding:16, marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:12, color:"#64748b", marginBottom:2 }}>City-wide Congestion</div>
                  <div style={{ fontSize:36, fontWeight:900, color:"#f97316", lineHeight:1 }}>68<span style={{ fontSize:16, color:"#64748b" }}>%</span></div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:12, color:"#64748b" }}>Peak Hours</div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9" }}>8–10 AM</div>
                  <div style={{ fontSize:12, color:"#64748b" }}>5–8 PM</div>
                </div>
              </div>
              <div style={{ background:"#0a1628", borderRadius:12, padding:14, position:"relative", height:160, overflow:"hidden" }}>
                {[0,1,2,3].map(i=><div key={i} style={{ position:"absolute",left:0,right:0,top:`${25*i}%`,height:1,background:"#1e293b" }}/>)}
                {[0,1,2,3].map(i=><div key={i} style={{ position:"absolute",top:0,bottom:0,left:`${25*i}%`,width:1,background:"#1e293b" }}/>)}
                {HOTSPOTS.map((h,i)=>{
                  const pos=[{left:"38%",top:"45%"},{left:"62%",top:"30%"},{left:"20%",top:"65%"},{left:"70%",top:"60%"},{left:"48%",top:"15%"},{left:"80%",top:"45%"}];
                  return <div key={h.id} style={{ position:"absolute",left:pos[i].left,top:pos[i].top,transform:"translate(-50%,-50%)" }}>
                    <div style={{ width:10+h.congestion/12,height:10+h.congestion/12,borderRadius:"50%",background:h.color,boxShadow:`0 0 ${h.congestion/8}px ${h.color}`,animation:h.congestion>70?"pulse 2s infinite":"none" }}/>
                  </div>;
                })}
                <div style={{ position:"absolute",bottom:8,left:10,fontSize:10,color:"#475569" }}>Dehradun City Centre</div>
                <div style={{ position:"absolute",top:8,right:10,fontSize:10,color:"#475569" }}>Sahastradhara ↗</div>
              </div>
            </div>
            <div style={{ fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:10,letterSpacing:0.5 }}>CONGESTION HOTSPOTS</div>
            {HOTSPOTS.map(h=>(
              <div key={h.id} style={{ display:"flex",alignItems:"center",gap:12,marginBottom:10 }}>
                <div style={{ fontSize:10,color:h.color,width:16,textAlign:"center" }}>{h.trend}</div>
                <div style={{ fontSize:13,color:"#e2e8f0",width:150,flexShrink:0 }}>{h.name}</div>
                <TrafficBar value={h.congestion} color={h.color}/>
                <div style={{ fontSize:12,fontWeight:700,color:h.color,width:34,textAlign:"right" }}>{h.congestion}%</div>
              </div>
            ))}
          </div>
        )}

        {/* ROUTES */}
        {activeTab === "routes" && (
          <div>
            <div style={{ fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:12,letterSpacing:0.5 }}>POPULAR ROUTES</div>
            {ROUTES.map((r,i) => (
              <div key={r.id} style={{ marginBottom:10 }}>
                <RouteCard route={r}/>
                {i===1 && <div style={{ margin:"12px 0" }}><AdBanner variant="bottom"/></div>}
              </div>
            ))}
            <div style={{ background:"#0f172a",border:"1px dashed #1e293b",borderRadius:12,padding:16,marginTop:6,textAlign:"center" }}>
              <div style={{ fontSize:22,marginBottom:6 }}>🔒</div>
              <div style={{ fontWeight:700,color:"#f1f5f9",marginBottom:4 }}>Unlock 20+ Routes</div>
              <div style={{ fontSize:12,color:"#64748b",marginBottom:12 }}>Real-time ETA, voice nav & zero ads</div>
              <button onClick={() => setShowPremium(true)} style={{ background:"linear-gradient(135deg,#f59e0b,#ef4444)",border:"none",borderRadius:8,padding:"10px 24px",color:"#000",fontWeight:800,fontSize:13,cursor:"pointer" }}>Go Pro — Rs.49/mo</button>
            </div>
          </div>
        )}

        {/* ALERTS */}
        {activeTab === "alerts" && (
          <div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
              <div style={{ fontSize:13,fontWeight:700,color:"#94a3b8",letterSpacing:0.5 }}>LIVE ALERTS</div>
              <span style={{ fontSize:10,color:"#22c55e",border:"1px solid #22c55e44",padding:"2px 8px",borderRadius:99 }}>● Live</span>
            </div>
            {ALERTS.map((a,i) => (
              <div key={a.id}>
                <AlertCard alert={a}/>
                {i===1 && <div style={{ padding:"12px 0" }}><AdBanner variant="top"/></div>}
              </div>
            ))}
            <div style={{ marginTop:16,background:"#0f172a",borderRadius:12,padding:16,border:"1px solid #1e293b",textAlign:"center" }}>
              <div style={{ fontSize:13,color:"#64748b",marginBottom:10 }}>Want instant SMS alerts?</div>
              <input placeholder="Enter mobile number" style={{ background:"#1e293b",border:"none",borderRadius:8,padding:"10px 14px",color:"#f1f5f9",fontSize:13,width:"100%",marginBottom:8 }}/>
              <button style={{ width:"100%",background:"#3b82f6",border:"none",borderRadius:8,padding:"10px",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer" }}>Subscribe Free →</button>
              <div style={{ fontSize:10,color:"#475569",marginTop:6 }}>Powered by our sponsor · Ad-supported</div>
            </div>
          </div>
        )}

        {/* NEARBY */}
        {activeTab === "nearby" && (
          <div>
            <div style={{ fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:4,letterSpacing:0.5 }}>ON YOUR ROUTE TODAY</div>
            <div style={{ fontSize:11,color:"#475569",marginBottom:14 }}>Sponsored local businesses near traffic areas</div>
            <div ref={scrollRef} style={{ display:"flex",gap:12,overflowX:"auto",paddingBottom:8,scrollbarWidth:"none" }}>
              {LOCAL_ADS.map(ad=><LocalAdCard key={ad.id} ad={ad}/>)}
            </div>
            <div style={{ marginTop:20 }}>
              <div style={{ fontSize:13,fontWeight:700,color:"#94a3b8",marginBottom:12,letterSpacing:0.5 }}>PARKING NEAR HOTSPOTS</div>
              {[
                { name:"Parade Ground Parking",slots:14,price:"Rs.20/hr",dist:"0.3 km",sponsor:true },
                { name:"Paltan Bazaar Lot B",slots:3,price:"Rs.15/hr",dist:"0.5 km",sponsor:false },
                { name:"Pacific Mall Parking",slots:89,price:"Free 2h",dist:"1.1 km",sponsor:true },
              ].map((p,i)=>(
                <div key={i} style={{ background:"#0f172a",border:p.sponsor?"1px solid #f59e0b33":"1px solid #1e293b",borderRadius:12,padding:"12px 16px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight:700,fontSize:13,color:"#f1f5f9" }}>{p.name}</div>
                    <div style={{ fontSize:11,color:"#64748b" }}>{p.dist} away · {p.price}</div>
                    {p.sponsor && <div style={{ fontSize:9,color:"#f59e0b",marginTop:2 }}>SPONSORED</div>}
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:20,fontWeight:800,color:p.slots<10?"#ef4444":"#22c55e" }}>{p.slots}</div>
                    <div style={{ fontSize:10,color:"#64748b" }}>slots</div>
                  </div>
                </div>
              ))}
            </div>
            <AdBanner variant="bottom"/>
          </div>
        )}

        {/* GOVT */}
        {activeTab === "govt" && (
          <div>
            <GovtBadge/>
            <div style={{ display:"flex",gap:4,marginBottom:18,background:"#0f172a",borderRadius:12,padding:4 }}>
              {govtTabs.map(t=>(
                <button key={t.id} onClick={() => setGovtTab(t.id)} style={{ flex:1,background:govtTab===t.id?"#2563eb":"transparent",border:"none",borderRadius:9,padding:"8px 4px",fontSize:11,fontWeight:700,color:govtTab===t.id?"#fff":"#475569",cursor:"pointer",transition:"all 0.2s" }}>{t.label}</button>
              ))}
            </div>
            {govtTab==="rules"   && <RulesSection/>}
            {govtTab==="fines"   && <FinesSection/>}
            {govtTab==="challan" && <ChallanSection/>}
            {govtTab==="rewards" && <RewardsSection/>}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:"#020817",borderTop:"1px solid #1e293b",padding:"10px 16px 20px",display:"flex",justifyContent:"space-around",zIndex:100 }}>
        {tabs.map(tab=>(
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",padding:"4px 6px",opacity:activeTab===tab.id?1:0.35,transition:"opacity 0.2s" }}>
            <span style={{ fontSize:18 }}>{tab.icon}</span>
            <span style={{ fontSize:9,color:activeTab===tab.id?(tab.id==="govt"?"#60a5fa":"#f59e0b"):"#64748b",fontWeight:700 }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Premium Modal */}
      {showPremium && (
        <div onClick={() => setShowPremium(false)} style={{ position:"fixed",inset:0,background:"#000000cc",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"linear-gradient(180deg,#0f172a,#020817)",borderRadius:"24px 24px 0 0",padding:28,width:"100%",maxWidth:420,border:"1px solid #1e293b",borderBottom:"none" }}>
            <div style={{ textAlign:"center",marginBottom:24 }}>
              <div style={{ fontSize:40,marginBottom:8 }}>⚡</div>
              <div style={{ fontSize:24,fontWeight:900 }}>DoonTraffic <span style={{ color:"#f59e0b" }}>Pro</span></div>
              <div style={{ color:"#64748b",fontSize:13,marginTop:4 }}>Drive smarter. No distractions.</div>
            </div>
            {["🚫 Zero advertisements","🗺️ 20+ live routes & ETA","🔔 Instant SMS & push alerts","🅿️ Priority parking intel","📊 Weekly commute reports","🌐 Offline mode for Mussoorie road","🏛️ Priority challan dispute & legal help"].map((f,i)=>(
              <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #1e293b22",fontSize:13,color:"#e2e8f0" }}>{f}</div>
            ))}
            <button style={{ width:"100%",background:"linear-gradient(135deg,#f59e0b,#ef4444)",border:"none",borderRadius:14,padding:"16px",marginTop:20,color:"#000",fontSize:16,fontWeight:900,cursor:"pointer" }}>Get Pro · Rs.49/month</button>
            <div style={{ textAlign:"center",fontSize:11,color:"#475569",marginTop:10 }}>Cancel anytime · 3-day free trial</div>
            <button onClick={() => setShowPremium(false)} style={{ background:"none",border:"none",width:"100%",color:"#475569",fontSize:12,marginTop:10,cursor:"pointer" }}>No thanks, I'll keep seeing ads</button>
          </div>
        </div>
      )}
    </div>
  );
}
