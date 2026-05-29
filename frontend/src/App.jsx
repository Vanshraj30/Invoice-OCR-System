import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Trash2, Download, Search, Upload, Eye, X, Layers,
  ChevronDown, ChevronUp, CheckCircle, AlertCircle, Sun, Moon,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, BarChart, Bar,
} from "recharts";
import "./index.css";

const API = "http://127.0.0.1:8000";

// ─── Theme token sets ──────────────────────────────────────────────────────────
const DARK = {
  bg:         "#0d1117",
  surface:    "#161b22",
  surface2:   "#1c2230",
  border:     "#222d3d",
  accent:     "#4d7cfe",
  text:       "#e6edf3",
  muted:      "#8b949e",
  green:      "#3fb950",
  red:        "#f85149",
  orange:     "#e3b341",
  cyan:       "#39c5cf",
  lineBlue:   "#58a6ff",
  lineGreen:  "#3fb950",
  lineOrange: "#e3b341",
  cardShadow: "0 1px 3px rgba(0,0,0,.4)",
};

const LIGHT = {
  bg:         "#f0f4f8",
  surface:    "#ffffff",
  surface2:   "#f6f8fa",
  border:     "#d0d7de",
  accent:     "#2563eb",
  text:       "#1c2a3a",
  muted:      "#57606a",
  green:      "#1a7f37",
  red:        "#cf222e",
  orange:     "#9a6700",
  cyan:       "#0969da",
  lineBlue:   "#2563eb",
  lineGreen:  "#1a7f37",
  lineOrange: "#9a6700",
  cardShadow: "0 1px 4px rgba(0,0,0,.08)",
};

// ─── Small helpers ─────────────────────────────────────────────────────────────
function mlBadge(status) {
  if (!status) return <span className="badge badge-red">Unknown</span>;
  const s = status.toLowerCase();
  if (s === "passed")  return <span className="badge badge-green">Passed</span>;
  if (s === "failed")  return <span className="badge badge-red">Failed</span>;
  if (s === "pending") return <span className="badge badge-orange">Pending</span>;
  return <span className="badge badge-blue">{status}</span>;
}

function exportToCSV(invoices) {
  if (!invoices.length) return alert("No invoices to export.");
  const headers = ["ID", "File Name", "Invoice Number", "Vendor", "Date", "Total", "ML Status"];
  const rows = invoices.map(inv =>
    [
      inv.id,
      `"${(inv.filename      || "").replace(/"/g, '""')}"`,
      `"${(inv.invoice_number|| "").replace(/"/g, '""')}"`,
      `"${(inv.vendor        || "").replace(/"/g, '""')}"`,
      inv.date   || "",
      inv.total  || 0,
      inv.ml_status || "",
    ].join(",")
  );
  const csv  = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `invoices_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOLTIPS
// ─────────────────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, C }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <p style={{ color: C.muted, marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontFamily: "JetBrains Mono, monospace" }}>
          {p.name}: {p.value != null ? Number(p.value).toFixed(1) + "%" : "—"}
        </p>
      ))}
    </div>
  );
};

const BarTooltip = ({ active, payload, label, C }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <p style={{ color: C.muted, marginBottom: 4 }}>{label}</p>
      <p style={{ color: C.accent, fontFamily: "JetBrains Mono, monospace" }}>₹{payload[0]?.value?.toLocaleString()}</p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// INVOICE DETAIL PANEL
// ─────────────────────────────────────────────────────────────────────────────
const BoolBadge = ({ value, C }) => {
  const bool = value === true || String(value).toLowerCase() === "true";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: bool ? "rgba(63,185,80,.15)" : "rgba(248,81,73,.15)",
      color: bool ? C.green : C.red,
      border: `1px solid ${bool ? "rgba(63,185,80,.3)" : "rgba(248,81,73,.3)"}`,
    }}>
      {bool ? <CheckCircle size={10} strokeWidth={2.5}/> : <AlertCircle size={10} strokeWidth={2.5}/>}
      {String(value)}
    </span>
  );
};

const DetailRow = ({ label, value, accent, isBool, C }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "9px 0", borderBottom: `1px solid ${C.border}`,
  }}>
    <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{label}</span>
    {isBool
      ? <BoolBadge value={value} C={C} />
      : <span style={{
          fontSize: 13, fontWeight: 600,
          color: accent || C.text,
          fontFamily: (typeof value === "string" && value.startsWith("[")) ? "JetBrains Mono, monospace" : "inherit",
        }}>
          {value ?? "—"}
        </span>
    }
  </div>
);

const DetailSection = ({ title, icon, accentColor, children, defaultOpen = true, C }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden", background: C.surface2, marginBottom: 10 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "11px 14px",
        background: "none", border: "none", cursor: "pointer", color: C.text,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 24, height: 24, borderRadius: 6, background: accentColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
            {icon}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: C.muted }}>
            {title}
          </span>
        </div>
        {open ? <ChevronUp size={14} color={C.muted}/> : <ChevronDown size={14} color={C.muted}/>}
      </button>
      {open && <div style={{ padding: "0 14px 6px" }}>{children}</div>}
    </div>
  );
};

function InvoiceDetailPanel({ data, onClose, C }) {
  if (!data) return null;
  const s    = data.structured_data ?? {};
  const ml   = s.ml_analysis        ?? {};
  const pred = s.ml_prediction      ?? {};
  const ai   = s.aiesi_analysis     ?? {};

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, marginBottom: 20, position: "relative", boxShadow: C.cardShadow }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 9,
            background: "linear-gradient(135deg, #4d7cfe 0%, #39c5cf 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, flexShrink: 0, boxShadow: "0 4px 14px rgba(77,124,254,.35)",
          }}>📄</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Invoice Details</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "JetBrains Mono, monospace" }}>
              {data.filename ?? "Untitled"}
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: C.muted, display: "flex", alignItems: "center" }}>
          <X size={15}/>
        </button>
      </div>

      {/* Hero totals banner */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        background: "linear-gradient(135deg, rgba(77,124,254,.1) 0%, rgba(57,197,207,.07) 100%)",
        border: "1px solid rgba(77,124,254,.2)", borderRadius: 10, padding: "14px 18px", marginBottom: 16,
      }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".8px", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>Actual Total</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.accent, fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>
            {s.total != null ? `₹${Number(s.total).toLocaleString("en-IN")}` : "—"}
          </div>
        </div>
        <div style={{ width: 1, height: 40, background: C.border }}/>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".8px", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>ML Predicted</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.cyan, fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>
            {pred.predicted_total != null ? `₹${pred.predicted_total}` : "—"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".8px", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>GSTIN</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "JetBrains Mono, monospace" }}>
            {s.gstin ?? "—"}
          </div>
        </div>
      </div>

      {/* 2-column sections */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
        <div>
          {/* ── Invoice Info ── */}
          <DetailSection title="Invoice Info" icon="🧾" accentColor="rgba(77,124,254,.3)" C={C}>
            <DetailRow label="Invoice Number" value={s.invoice_number}                        C={C}/>
            <DetailRow label="Date"           value={s.date}                                  C={C}/>
            <DetailRow label="Vendor Name"    value={s.vendor_name}                           C={C}/>
            <DetailRow label="GSTIN"          value={s.gstin}          accent={C.accent}      C={C}/>
            <DetailRow label="Email"          value={s.email}          accent={C.cyan}        C={C}/>
            <DetailRow label="Phone"          value={s.phone}                                 C={C}/>
            <DetailRow label="PO Number"      value={s.po_number}      accent={C.orange}      C={C}/>
            <DetailRow label="Address"        value={s.address}                               C={C}/>
          </DetailSection>

          {/* ── Financials ── */}
          <DetailSection title="Financials" icon="💰" accentColor="rgba(63,185,80,.25)" C={C}>
            <DetailRow label="Subtotal"      value={s.subtotal != null ? `₹${Number(s.subtotal).toLocaleString("en-IN")}` : null}                    C={C}/>
            <DetailRow label="Tax"           value={s.tax      != null ? `₹${Number(s.tax).toLocaleString("en-IN")}`      : null}                    C={C}/>
            <DetailRow label="Payment Mode"  value={s.payment_mode}   accent={C.cyan}                                                                C={C}/>
            <DetailRow label="Total"         value={s.total    != null ? `₹${Number(s.total).toLocaleString("en-IN")}`    : null} accent={C.green}   C={C}/>
          </DetailSection>
        </div>

        <div>
          {/* ── ML Analysis · LayoutLM ── */}
          <DetailSection title="ML Analysis · LayoutLM" icon="🧠" accentColor="rgba(163,113,247,.3)" C={C}>
            <DetailRow label="Word Count"      value={ml.word_count}                                                                  C={C}/>
            <DetailRow label="Box Count"       value={ml.box_count}                              accent={C.accent}                    C={C}/>
            <DetailRow label="Layout Aware"    value={ml.layout_aware}                           isBool                               C={C}/>
            <DetailRow label="Predicted Date"  value={pred.predicted_date}                                                            C={C}/>
            <DetailRow label="Predicted Total" value={pred.predicted_total != null ? `₹${pred.predicted_total}` : null} accent={C.cyan} C={C}/>
            <DetailRow label="Quantity"        value={s.quantity ?? pred.quantity}               accent={C.orange}                    C={C}/>
          </DetailSection>

          {/* ── AIESI Analysis · BiLSTM ── */}
          <DetailSection title="AIESI Analysis · BiLSTM" icon="⚡" accentColor="rgba(57,197,207,.25)" C={C}>
            <DetailRow label="Sequence Length" value={ai.sequence_length}                                                             accent={C.cyan}   C={C}/>
            <DetailRow label="AI Extraction"   value={ai.ai_extraction}                         isBool                               C={C}/>
            <DetailRow label="Tensor Shape"    value={Array.isArray(ai.tensor_shape) ? `[${ai.tensor_shape.join(", ")}]` : null}     accent={C.orange} C={C}/>
          </DetailSection>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKFLOW DRAWER
// ─────────────────────────────────────────────────────────────────────────────
function WorkflowDrawer({ open, onClose, invoices = [], onUpdateStatus, C }) {
  const [tab,           setTab]           = useState("workflow");
  const [toggles,       setToggles]       = useState([true, true, false]);
  const [dragOverColumn,setDragOverColumn]= useState(null);
  const [filterStatus,  setFilterStatus]  = useState("");
  const [wfSearch,      setWfSearch]      = useState("");

  const tabs = [
    { id: "workflow", label: "Approval workflow" },
    { id: "export",   label: "Export options"    },
  ];

  const getStatus = (inv) => (inv.status || "draft").toLowerCase();

  const allFiltered = invoices.filter(inv => {
    const matchSearch = !wfSearch ||
      (inv.vendor        || "").toLowerCase().includes(wfSearch.toLowerCase()) ||
      (inv.invoice_number|| "").toLowerCase().includes(wfSearch.toLowerCase()) ||
      (inv.filename      || "").toLowerCase().includes(wfSearch.toLowerCase());
    const matchStatus = !filterStatus || getStatus(inv) === filterStatus;
    return matchSearch && matchStatus;
  });

  const draftList    = allFiltered.filter(inv => getStatus(inv) === "draft");
  const reviewList   = allFiltered.filter(inv => ["review","pending"].includes(getStatus(inv)));
  const approvedList = allFiltered.filter(inv => getStatus(inv) === "approved");
  const paidList     = allFiltered.filter(inv => getStatus(inv) === "paid");

  const totalInvoices       = invoices.length;
  const awaitingReviewCount = invoices.filter(inv => ["review","pending"].includes(getStatus(inv))).length;
  const approvedCount       = invoices.filter(inv => getStatus(inv) === "approved").length;
  const overdueCount        = invoices.filter(inv => inv.is_overdue).length;
  const pendingValue        = invoices
    .filter(inv => ["draft","review","approved","pending"].includes(getStatus(inv)))
    .reduce((s, inv) => s + (Number(inv.total) || 0), 0);

  const handleDragStart = (e, id) => { e.dataTransfer.setData("invoice_id", id); };
  const handleDragOver  = (e, col) => { e.preventDefault(); setDragOverColumn(col); };
  const handleDragLeave = ()        => { setDragOverColumn(null); };
  const handleDrop      = (e, newStatus) => {
    e.preventDefault(); setDragOverColumn(null);
    const id = e.dataTransfer.getData("invoice_id");
    if (id && onUpdateStatus) onUpdateStatus(id, newStatus);
  };

  const InvCard = ({ c, stageBadgeClass, stageBadgeLabel }) => (
    <div className="inv-card"
      style={c.is_overdue ? { borderLeft: `3px solid ${C.red}` } : {}}
      draggable onDragStart={(e) => handleDragStart(e, c.id)}
    >
      <div className="vendor">{c.vendor || "Unknown Vendor"}</div>
      <div className="meta">
        <span>{c.invoice_number || "N/A"}</span>
        <span style={c.is_overdue ? { color: C.red } : {}}>{c.date || "N/A"}{c.is_overdue ? " ⚠" : ""}</span>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span className="amount">₹{c.total || 0}</span>
        <span className={`kbadge ${stageBadgeClass}`}>{stageBadgeLabel}</span>
      </div>
      <div className="assignee">
        <div className={`avatar ${c.avatar_color || "av-blue"}`}>{c.assignee_initials || "SYS"}</div>
        <span style={{ fontSize:11, color:C.muted }}>{c.assignee_name || "System"}</span>
      </div>
      <div className={`conf-bar ${(c.confidence||85)<70?"conf-mid":"conf-high"}`} style={{ width:`${c.confidence||85}%` }}/>
      <div style={{ fontSize:10, color:(c.confidence||85)<60?C.red:C.muted, marginTop:2 }}>
        OCR confidence {c.confidence||85}%{(c.confidence||85)<60?" — manual check needed":""}
      </div>
    </div>
  );

  const stages = [
    { list:draftList,    col:"draft",    hd:"draft",    label:"Draft",    bc:"b-draft"    },
    { list:reviewList,   col:"review",   hd:"review",   label:"Review",   bc:"b-review"   },
    { list:approvedList, col:"approved", hd:"approved", label:"Approved", bc:"b-approved" },
    { list:paidList,     col:"paid",     hd:"paid",     label:"Paid",     bc:"b-paid"     },
  ];

  return (
    <>
      <div className={`drawer-overlay${open?" open":""}`} onClick={onClose}/>
      <div className={`drawer${open?" open":""}`} style={{ background: C.surface, borderLeft: `1px solid ${C.border}`, color: C.text }}>
        <div className="drawer-header" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700 }}>Invoice Workflow & Operations</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>Approval Pipeline · Export</div>
          </div>
          <button className="btn btn-ghost" style={{ padding:"6px 10px" }} onClick={onClose}><X size={18}/></button>
        </div>

        <div className="drawer-body">
          <div className="wf-tabs">
            {tabs.map(t => (
              <button key={t.id} className={`wf-tab${tab===t.id?" active":""}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── APPROVAL WORKFLOW ── */}
          <div className={`wf-section${tab==="workflow"?" active":""}`}>
            <div className="wf-stats">
              <div className="wf-stat"><div className="sl">Total</div><div className="sv">{totalInvoices}</div><div className="sd">This month</div></div>
              <div className="wf-stat"><div className="sl">Awaiting review</div><div className="sv" style={{ color:C.orange }}>{awaitingReviewCount}</div><div className="sd">Needs action</div></div>
              <div className="wf-stat"><div className="sl">Approved</div><div className="sv" style={{ color:C.green }}>{approvedCount}</div><div className="sd">Ready to pay</div></div>
              <div className="wf-stat"><div className="sl">Overdue</div><div className="sv" style={{ color:C.red }}>{overdueCount}</div><div className="sd">Past due</div></div>
              <div className="wf-stat"><div className="sl">Pending value</div><div className="sv">₹{pendingValue.toLocaleString()}</div><div className="sd">Unpaid</div></div>
            </div>

            <div className="wf-action-bar">
              <input
                className="wf-input"
                placeholder="Search vendor, invoice…"
                style={{ maxWidth:200 }}
                value={wfSearch}
                onChange={e => setWfSearch(e.target.value)}
              />
              <select
                className="wf-btn"
                style={{ cursor:"pointer", background: C.surface2, color: C.text, border: `1px solid ${C.border}`, borderRadius:6, padding:"6px 10px", fontSize:12 }}
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="">⚙ All Status</option>
                <option value="draft">Draft</option>
                <option value="review">Review</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
              </select>
              {(wfSearch || filterStatus) && (
                <button
                  className="wf-btn"
                  style={{ color: C.red, borderColor: C.red, fontSize:11 }}
                  onClick={() => { setWfSearch(""); setFilterStatus(""); }}
                >
                  ✕ Clear
                </button>
              )}
              <button className="wf-btn primary">+ New invoice</button>
            </div>

            {(wfSearch || filterStatus) && (
              <div style={{ fontSize:11, color:C.muted, marginBottom:8, paddingLeft:2 }}>
                Showing {allFiltered.length} of {invoices.length} invoices
              </div>
            )}

            <div className="pipeline">
              {stages.map(({ list, col, hd, label, bc }) => (
                <div className="stage-col" key={col}>
                  <div className={`stage-hd ${hd}`}>
                    {label}<span style={{ float:"right", fontWeight:400, color:C.muted }}>{list.length}</span>
                  </div>
                  <div
                    className={`stage-body${dragOverColumn===col?" drag-over":""}`}
                    onDragOver={e => handleDragOver(e, col)}
                    onDragLeave={handleDragLeave}
                    onDrop={e => handleDrop(e, col)}
                  >
                    {list.length === 0
                      ? <div style={{ fontSize:11, color:C.muted, textAlign:"center", padding:"20px 0" }}>No invoices</div>
                      : list.map((c, i) => <InvCard key={c.id||i} c={c} stageBadgeClass={bc} stageBadgeLabel={label}/>)
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── EXPORT OPTIONS ── */}
          <div className={`wf-section${tab==="export"?" active":""}`}>
            <div style={{ fontSize:13, color:C.muted, marginBottom:16 }}>Export invoice data in your preferred format.</div>
            <div className="export-grid">
              {[
                { icon:"📊", title:"CSV export",    desc:"Download all invoices to CSV.",        bg:"rgba(63,185,80,.15)",  col:C.green, fn:() => exportToCSV(invoices) },
                { icon:"📕", title:"PDF report",    desc:"Print a formatted overview.",          bg:"rgba(248,81,73,.15)",  col:C.red,   fn:() => window.print() },
                { icon:"📑", title:"Excel (.xlsx)", desc:"With summary sheet & pivot table.",    bg:"rgba(29,158,117,.15)", col:C.green, fn:null },
              ].map(e => (
                <div key={e.title} className={`export-card${e.fn?" active-ex":""}`} onClick={e.fn || undefined}>
                  <div className="eicon" style={{ background:e.bg, color:e.col, fontSize:18 }}>{e.icon}</div>
                  <div className="etitle">{e.title}</div>
                  <div className="edesc">{e.desc}</div>
                </div>
              ))}
            </div>

            <div className="sched-card">
              <div style={{ fontSize:11, fontWeight:600, color:C.muted, marginBottom:10, textTransform:"uppercase", letterSpacing:".06em" }}>Scheduled exports</div>
              {[
                { label:"Weekly CSV to Google Drive",  sub:"Every Monday 8 AM · Approved only" },
                { label:"Monthly GST report to email", sub:"1st of every month · All vendors"   },
                { label:"Daily Tally sync",            sub:"Every night 11 PM · Paid invoices"  },
              ].map((r, idx) => (
                <div className="sched-row" key={idx}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{r.label}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{r.sub}</div>
                  </div>
                  <button
                    className={`toggle${toggles[idx]?" on":" off"}`}
                    onClick={() => setToggles(t => t.map((v,i) => i===idx ? !v : v))}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, iconBg, dot, C }) {
  return (
    <div className="stat-card" style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}>
      <div className="icon-wrap" style={{ background: iconBg }}>{icon}</div>
      <div className="label" style={{ color: C.muted }}>{label}</div>
      <div className="value" style={{ color: C.text }}>
        {value}
        {dot && <span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:dot, marginLeft:8, verticalAlign:"middle" }}/>}
      </div>
      <div className="sub" style={{ color: C.muted }}>{sub}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [darkMode,      setDarkMode]      = useState(true);
  const [metrics,       setMetrics]       = useState({});
  const [graphData,     setGraphData]     = useState([]);
  const [deepData,      setDeepData]      = useState({});
  const [invoices,      setInvoices]      = useState([]);
  const [file,          setFile]          = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [search,        setSearch]        = useState("");
  const [dragActive,    setDragActive]    = useState(false);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [detailData,    setDetailData]    = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const fileRef = useRef();

  const C = darkMode ? DARK : LIGHT;

  useEffect(() => {
    document.body.style.background = C.bg;
    document.body.style.color      = C.text;
  }, [darkMode]);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try { await Promise.all([fetchMetrics(), fetchGraph(), fetchDeepLearning(), fetchInvoices()]); }
    catch (e) { console.error(e); }
  }

  async function fetchMetrics()      { try { const r = await axios.get(`${API}/dashboard-metrics`);    setMetrics(r.data);  } catch(e){ console.error(e); } }
  async function fetchDeepLearning() { try { const r = await axios.get(`${API}/deep-learning-panel`); setDeepData(r.data); } catch(e){ console.error(e); } }
  async function fetchInvoices()     { try { const r = await axios.get(`${API}/invoices`);             setInvoices(r.data); } catch(e){ console.error(e); } }

  async function fetchGraph() {
    try {
      const r   = await axios.get(`${API}/dashboard-graph`);
      const raw = r.data;

      if (!raw || raw.length === 0) {
        setGraphData([
          { date:"Jan", bilstm:82, layoutlm:78, ocr:74 },
          { date:"Feb", bilstm:85, layoutlm:81, ocr:76 },
          { date:"Mar", bilstm:88, layoutlm:84, ocr:79 },
        ]);
        return;
      }

      const normalised = raw.map(row => {
        const find = (...keys) => {
          for (const k of keys) {
            const found = Object.keys(row).find(rk => rk.toLowerCase() === k.toLowerCase());
            if (found !== undefined && row[found] != null) return Number(row[found]);
          }
          return undefined;
        };
        return {
          date:     row.date ?? row.month ?? row.Date ?? row.Month ?? "",
          bilstm:   find("bilstm","bilstm_score","bi_lstm","BiLSTM"),
          layoutlm: find("layoutlm","layoutlm_score","layout_lm","LayoutLM","layout"),
          ocr:      find("ocr","ocr_score","OCR"),
        };
      });
      setGraphData(normalised);
    } catch(e) { console.error(e); }
  }

  async function handleViewDetail(inv) {
    setDetailData(null);
    setDetailLoading(true);
    setTimeout(() => document.getElementById("detail-anchor")?.scrollIntoView({ behavior:"smooth", block:"start" }), 80);
    try {
      const r = await axios.get(`${API}/invoice/${inv.id}`);
      if (r.data?.structured_data) {
        setDetailData(r.data);
      } else {
        setDetailData({
          filename: r.data.filename || inv.filename,
          structured_data: {
            invoice_number: r.data.invoice_number,
            date:           r.data.date,
            subtotal:       r.data.subtotal,
            tax:            r.data.tax,
            total:          r.data.total,
            gstin:          r.data.gstin,
            vendor_name:    r.data.vendor,
            email:          r.data.email,
            phone:          r.data.phone,
            payment_mode:   r.data.payment_mode,
            po_number:      r.data.po_number,
            quantity:       r.data.quantity,
            address:        r.data.address,
            ml_analysis:    {},
            ml_prediction:  {},
            aiesi_analysis: {},
          },
        });
      }
    } catch { alert("Could not load invoice details."); }
    setDetailLoading(false);
  }

  const updateInvoiceStatus = async (invoiceId, newStatus) => {
    setInvoices(prev => prev.map(inv => String(inv.id)===String(invoiceId) ? {...inv, status:newStatus} : inv));
    try { await axios.patch(`${API}/invoice/${invoiceId}`, { status: newStatus }); }
    catch { alert("Failed to save status change."); fetchAll(); }
  };

  async function handleUpload() {
    if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    setLoading(true);
    try {
      const r = await axios.post(`${API}/upload`, fd);
      await fetchAll();
      setFile(null);
      if (r.data?.structured_data || r.data?.filename) {
        setDetailData(r.data);
        setTimeout(() => document.getElementById("detail-anchor")?.scrollIntoView({ behavior:"smooth", block:"start" }), 200);
      }
    } catch { alert("Upload failed"); }
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this invoice?")) return;
    try {
      await axios.delete(`${API}/invoice/${id}`);
      if (detailData && String(detailData.id ?? "") === String(id)) setDetailData(null);
      fetchAll();
    } catch { alert("Delete failed"); }
  }

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type==="dragenter"||e.type==="dragover");
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const filtered = invoices.filter(inv =>
    !search ||
    (inv.filename||"").toLowerCase().includes(search.toLowerCase()) ||
    (inv.invoice_number||"").toLowerCase().includes(search.toLowerCase()) ||
    (inv.vendor||"").toLowerCase().includes(search.toLowerCase())
  );

  const spendingData = (() => {
    const months = { Mar:0, Apr:0, May:0 };
    invoices.forEach(inv => {
      const d = inv.date||"";
      if      (d.includes("-03")||d.includes("/03")) months.Mar += +(inv.total||0);
      else if (d.includes("-04")||d.includes("/04")) months.Apr += +(inv.total||0);
      else                                            months.May += +(inv.total||0);
    });
    return Object.entries(months).map(([month,spend]) => ({ month, spend }));
  })();

  const pipeline = deepData?.pipeline||{};
  const layoutlm = deepData?.layoutlm||{};
  const bilstm   = deepData?.bilstm  ||{};

  const cardStyle  = { background:C.surface, border:`1px solid ${C.border}`, boxShadow:C.cardShadow };
  const mutedLabel = { fontSize:11, fontWeight:700, letterSpacing:".8px", textTransform:"uppercase", color:C.muted, marginBottom:14 };
  const analyticsVal = { color:C.accent };

  return (
    <>
      <WorkflowDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        invoices={invoices}
        onUpdateStatus={updateInvoiceStatus}
        C={C}
      />

      <div style={{ minHeight:"100vh", background:C.bg, color:C.text, transition:"background .2s, color .2s" }}>

        {/* ── HEADER ── */}
        <header style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:50, boxShadow:C.cardShadow }}>
          <div style={{ maxWidth:1300, margin:"0 auto", padding:"0 24px", height:70, display:"flex", alignItems:"center", position:"relative" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:8, background:C.accent, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
            </div>

            <div style={{ position:"absolute", left:"50%", transform:"translateX(-50%)", textAlign:"center", pointerEvents:"none" }}>
              <div style={{ fontSize:22, fontWeight:800, color:C.text, letterSpacing:".2px", lineHeight:1.2 }}>
                AI Invoice Intelligence Dashboard
              </div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>OCR · Deep Learning · Analytics</div>
            </div>

            <div style={{ display:"flex", gap:10, alignItems:"center", marginLeft:"auto" }}>
              <button className="btn btn-primary" style={{ gap:7, fontSize:13 }} onClick={() => setDrawerOpen(true)}>
                <Layers size={15}/> Workflow & Ops
              </button>
              <button
                onClick={() => setDarkMode(d => !d)}
                style={{
                  display:"flex", alignItems:"center", gap:7,
                  padding:"7px 14px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer",
                  background: darkMode ? "#21262d" : "#e8ecf0",
                  border: `1px solid ${C.border}`,
                  color: C.text,
                  transition:"all .2s",
                }}
              >
                {darkMode ? <Sun size={15} color="#e3b341"/> : <Moon size={15} color="#4d7cfe"/>}
                {darkMode ? "Light mode" : "Dark mode"}
              </button>
            </div>
          </div>
        </header>

        <main style={{ maxWidth:1300, margin:"0 auto", padding:"24px 24px 48px" }}>

          {/* ── UPLOAD ZONE ── */}
          <div
            className={`upload-zone${dragActive?" drag-active":""}`}
            style={{
              padding:"18px 24px", marginBottom:24,
              display:"flex", alignItems:"center", gap:16, flexWrap:"wrap",
              background: C.surface, border:`2px dashed ${dragActive ? C.accent : C.border}`,
              borderRadius:12, cursor:"pointer", transition:"border-color .2s",
            }}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            onClick={() => !file && fileRef.current?.click()}
          >
            <button
              className="btn btn-primary"
              style={{ whiteSpace:"nowrap" }}
              onClick={e => { e.stopPropagation(); file ? handleUpload() : fileRef.current?.click(); }}
              disabled={loading}
            >
              <Upload size={15}/>
              {loading ? "Uploading…" : "Upload Invoice"}
            </button>
            <span style={{ fontSize:13, color:C.muted }}>
              {file
                ? <span style={{ color:C.green }}>✓ {file.name} — <button className="btn btn-ghost" style={{ fontSize:12, padding:"2px 8px" }} onClick={e => { e.stopPropagation(); handleUpload(); }} disabled={loading}>{loading?"Uploading…":"Upload now"}</button></span>
                : <>Drag & drop PDF or image · <strong style={{ color:C.text }}>PNG, JPG, PDF</strong> supported · Max 10MB</>}
            </span>
            <input ref={fileRef} type="file" style={{ display:"none" }} accept=".png,.jpg,.jpeg,.pdf"
              onChange={e => setFile(e.target.files[0])}/>
          </div>

          {/* ── STAT CARDS ── */}
          <div className="grid-4" style={{ marginBottom:20 }}>
            <StatCard C={C} label="INVOICES PROCESSED" value={metrics.total_invoices ?? invoices.length ?? 0} sub="from database" iconBg={darkMode?"#1c2a4a":"#dbeafe"}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}/>
            <StatCard C={C} label="AVERAGE TOTAL" value={`₹${metrics.average_total ?? 0}`} sub="across all invoices" iconBg={darkMode?"#1a2e1e":"#dcfce7"}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}/>
            <StatCard C={C} label="ML SUCCESS" value={metrics.ml_success ?? 0} sub={`of ${metrics.total_invoices ?? invoices.length ?? 0} processed`} iconBg={darkMode?"#2a1c2e":"#f3e8ff"}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={darkMode?"#a371f7":"#7c3aed"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>}/>
            <StatCard C={C} label="BENCHMARK SCORE" value={`${metrics.benchmark_score ?? "0%"}`} sub="model confidence check" dot={C.orange} iconBg={darkMode?"#2a2218":"#fef3c7"}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}/>
          </div>

          {/* ── CHARTS ── */}
          <div className="grid-2-1" style={{ marginBottom:20 }}>
            <div className="card" style={{ ...cardStyle, padding:22 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                <span style={{ fontSize:15, fontWeight:700 }}>ML Performance Graph</span>
                <span style={{ fontSize:12, color:C.muted, background:C.surface2, padding:"3px 10px", borderRadius:6, border:`1px solid ${C.border}` }}>
                  {graphData.length ? `${graphData.length} data points` : "No data"}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={graphData} margin={{ top:4, right:8, bottom:0, left:-10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} opacity={.6}/>
                  <XAxis dataKey="date" stroke={C.muted} tick={{ fontSize:11, fill:C.muted }}/>
                  <YAxis stroke={C.muted} tick={{ fontSize:11, fill:C.muted }} domain={["auto","auto"]} tickFormatter={v=>`${v}%`}/>
                  <Tooltip content={<CustomTooltip C={C}/>}/>
                  <Line type="monotone" dataKey="bilstm"   stroke={C.lineBlue}   strokeWidth={2} dot={{ r:3, fill:C.lineBlue   }} activeDot={{ r:5 }} name="BiLSTM"   connectNulls/>
                  <Line type="monotone" dataKey="layoutlm" stroke={C.lineGreen}  strokeWidth={2} dot={{ r:3, fill:C.lineGreen  }} activeDot={{ r:5 }} name="LayoutLM"  connectNulls/>
                  <Line type="monotone" dataKey="ocr"      stroke={C.lineOrange} strokeWidth={2} dot={{ r:3, fill:C.lineOrange }} activeDot={{ r:5 }} name="OCR" strokeDasharray="6 3" connectNulls/>
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display:"flex", gap:20, marginTop:12 }}>
                {[["BiLSTM",C.lineBlue],["LayoutLM",C.lineGreen],["OCR",C.lineOrange]].map(([n,c]) => (
                  <span key={n} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:C.muted }}>
                    <span style={{ width:20, height:2, background:c, display:"inline-block", borderRadius:2 }}/>{n}
                  </span>
                ))}
              </div>
            </div>

            <div className="card" style={{ ...cardStyle, padding:22 }}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:18 }}>Spending by Month</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={spendingData} barSize={40} margin={{ top:4, right:8, bottom:0, left:-10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} opacity={.6}/>
                  <XAxis dataKey="month" stroke={C.muted} tick={{ fontSize:12, fill:C.muted }}/>
                  <YAxis stroke={C.muted} tick={{ fontSize:11, fill:C.muted }} tickFormatter={v=>`₹${v/1000}k`}/>
                  <Tooltip content={<BarTooltip C={C}/>}/>
                  <Bar dataKey="spend" fill={C.accent} radius={[4,4,0,0]} opacity={.85}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── ANALYTICS PANELS ── */}
          <div className="grid-3" style={{ marginBottom:20 }}>
            <div className="card" style={{ ...cardStyle, padding:20 }}>
              <div style={mutedLabel}>LAYOUTLM ANALYTICS</div>
              <div className="analytics-row"><span className="k" style={{ color:C.muted }}>Layout Aware</span><span className="v" style={analyticsVal}>{String(layoutlm.layout_aware??"true")}</span></div>
              <div className="analytics-row"><span className="k" style={{ color:C.muted }}>Box Count</span><span className="v" style={analyticsVal}>{layoutlm.box_count??0}</span></div>
            </div>
            <div className="card" style={{ ...cardStyle, padding:20 }}>
              <div style={mutedLabel}>BILSTM ANALYTICS</div>
              <div className="analytics-row"><span className="k" style={{ color:C.muted }}>Sequence Length</span><span className="v" style={analyticsVal}>{bilstm.sequence_length??0}</span></div>
              <div className="analytics-row"><span className="k" style={{ color:C.muted }}>AI Extraction</span><span className="v" style={analyticsVal}>{String(bilstm.ai_extraction??"true")}</span></div>
            </div>
            <div className="card" style={{ ...cardStyle, padding:20 }}>
              <div style={mutedLabel}>PIPELINE STATUS</div>
              <div className="analytics-row"><span className="k" style={{ color:C.muted }}>OCR Processed</span><span className="v" style={analyticsVal}>{pipeline.ocr_processed??metrics.total_invoices??invoices.length??0}</span></div>
              <div className="analytics-row"><span className="k" style={{ color:C.muted }}>Successful ML</span><span className="v" style={analyticsVal}>{pipeline.successful_ml??metrics.ml_success??0}</span></div>
              <div className="analytics-row" style={{ flexDirection:"column", alignItems:"flex-start", gap:2 }}>
                <span className="k" style={{ color:C.muted }}>Last Upload</span>
                <span style={{ fontSize:12, color:C.accent, fontFamily:"JetBrains Mono, monospace" }}>{pipeline.latest_upload??"—"}</span>
              </div>
            </div>
          </div>

          {/* ── INVOICE DETAIL PANEL ── */}
          <div id="detail-anchor"/>
          {detailLoading && (
            <div className="card" style={{ ...cardStyle, padding:32, textAlign:"center", marginBottom:20, color:C.muted, fontSize:14 }}>
              <div style={{ marginBottom:8, fontSize:22 }}>⏳</div>
              Loading invoice details…
            </div>
          )}
          {detailData && !detailLoading && (
            <InvoiceDetailPanel data={detailData} onClose={() => setDetailData(null)} C={C}/>
          )}

          {/* ── INVOICES TABLE ── */}
          <div className="card" style={{ ...cardStyle, overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:`1px solid ${C.border}`, gap:12, flexWrap:"wrap" }}>
              <span style={{ fontSize:16, fontWeight:700 }}>Invoices</span>
              <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                <div style={{ position:"relative" }}>
                  <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:C.muted }}/>
                  <input
                    className="search-input"
                    placeholder="Search invoices…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ background:C.surface2, border:`1px solid ${C.border}`, color:C.text }}
                  />
                </div>
                <button
                  className="btn btn-ghost"
                  style={{ color:C.text, borderColor:C.border }}
                  onClick={() => exportToCSV(filtered.length ? filtered : invoices)}
                >
                  <Download size={14}/> Export CSV
                </button>
              </div>
            </div>

            <div style={{ overflowX:"auto" }}>
              <table style={{ color:C.text }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${C.border}`, background:C.surface2 }}>
                    <th style={{ color:C.muted }}>ID</th>
                    <th style={{ color:C.muted }}>FILE</th>
                    <th style={{ color:C.muted }}>INVOICE #</th>
                    <th style={{ color:C.muted }}>DATE</th>
                    <th style={{ color:C.muted }}>VENDOR</th>
                    <th style={{ color:C.muted }}>TOTAL</th>
                    <th style={{ color:C.muted }}>ML STATUS</th>
                    <th style={{ color:C.muted }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? filtered.map(inv => (
                    <tr
                      key={inv.id}
                      style={{
                        borderBottom:`1px solid ${C.border}`,
                        ...(detailData && String(detailData.id??"")===String(inv.id)
                          ? { background:`${C.accent}14`, outline:`1px solid ${C.accent}` }
                          : {}),
                      }}
                    >
                      <td style={{ color:C.muted, fontSize:13 }}>{inv.id}</td>
                      <td style={{ fontWeight:500 }}>{inv.filename}</td>
                      <td style={{ color:C.muted }}>{inv.invoice_number||"—"}</td>
                      <td style={{ color:C.muted }}>{inv.date}</td>
                      <td>{inv.vendor||"Unknown"}</td>
                      <td style={{ fontFamily:"JetBrains Mono, monospace", fontWeight:600 }}>₹{inv.total}</td>
                      <td>{mlBadge(inv.ml_status)}</td>
                      <td>
                        <div style={{ display:"flex", gap:6 }}>
                          <button
                            className="btn btn-ghost"
                            style={{ padding:"5px 10px", color: detailData && String(detailData.id??"")===String(inv.id) ? C.accent : C.muted }}
                            title="View details"
                            onClick={() => handleViewDetail(inv)}
                          >
                            <Eye size={14}/>
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding:"5px 10px" }}
                            title="Delete"
                            onClick={() => handleDelete(inv.id)}
                          >
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign:"center", padding:"40px 0", color:C.muted }}>
                        No invoices found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}
