import tkinter as tk
from tkinter import ttk, messagebox
import json
import os
from datetime import datetime
import tempfile
import webbrowser

# ---------------- PADEN ----------------

MAP = os.path.dirname(os.path.abspath(__file__))

DATA = os.path.join(MAP, "vogels.json")
MUT = os.path.join(MAP, "mutaties.json")
STAT = os.path.join(MAP, "status.json")
KOOI = os.path.join(MAP, "kooien.json")
JAAR = os.path.join(MAP, "jaren.json")

RINGMAAT = os.path.join(MAP, "ringmaten.json")
GESLACHT = os.path.join(MAP, "geslacht.json")
HERKOMST = os.path.join(MAP, "herkomst.json")

KOPPELS = os.path.join(MAP, "koppels.json")

# ---------------- FILE HELPERS ----------------

def lees(file, default):
    if os.path.exists(file):
        try:
            with open(file, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return default


def schrijf(file, data):
    with open(file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


# ---------------- DATA ----------------

vogels = lees(DATA, {})

mutaties = lees(MUT, ["Wildkleur", "Lutino", "Albino"])
statussen = lees(STAT, ["Actief", "Verkocht", "Overleden"])
kooien = lees(KOOI, [])
jaren = lees(JAAR, [str(datetime.now().year)])

ringmaten = lees(RINGMAAT, ["10mm", "11mm", "12mm"])
geslachten = lees(GESLACHT, ["Man", "Pop"])
herkomsten = lees(HERKOMST, ["Eigen kweek", "Aangekocht"])

# koppels:
# {
#   "KoppelNaam": {
#       "man": "Stam - Ring",
#       "pop": "Stam - Ring",
#       "kooi": "K1",
#       "kweekjaar": "2026",
#       "jongen": ["Stam - Ring", ...]
#   }
# }
koppels = lees(KOPPELS, {})
for _, info in koppels.items():
    if "man" not in info:
        info["man"] = ""
    if "pop" not in info:
        info["pop"] = ""
    if "kooi" not in info:
        info["kooi"] = ""
    if "kweekjaar" not in info:
        info["kweekjaar"] = ""
    if "jongen" not in info:
        info["jongen"] = []


def opslaan():
    schrijf(DATA, vogels)
    schrijf(MUT, mutaties)
    schrijf(STAT, statussen)
    schrijf(KOOI, kooien)
    schrijf(JAAR, jaren)
    schrijf(RINGMAAT, ringmaten)
    schrijf(GESLACHT, geslachten)
    schrijf(HERKOMST, herkomsten)
    schrijf(KOPPELS, koppels)


# ---------------- GUI ----------------

root = tk.Tk()
root.title("Vogelbeheer Splendid Parkieten gemaakt door Davy")
root.geometry("1520x920")

frame = tk.LabelFrame(root, text="Vogel gegevens", padx=8, pady=8)
frame.pack(fill="x", padx=8, pady=6)

velden = {}


def veld(n, r, combo=False):
    tk.Label(frame, text=n, anchor="w", width=16).grid(
        row=r, column=0, sticky="w", padx=(0, 6), pady=2
    )

    if combo:
        w = ttk.Combobox(frame, state="readonly", width=38)
    else:
        w = ttk.Entry(frame, width=40)

    w.grid(row=r, column=1, sticky="we", pady=2)
    velden[n] = w


veld("Stamnummer *", 0)
veld("Ringnummer", 1)
veld("Ringmaat", 2, True)
veld("Geslacht", 3, True)
veld("Mutatie", 4, True)
veld("Status", 5, True)
veld("Herkomst", 6, True)
veld("Kooi", 7, True)
veld("Kweekjaar", 8, True)
veld("Vader", 9, True)
veld("Moeder", 10, True)

velden["Kweekjaar"].set(str(datetime.now().year))

# ---------------- TABEL ----------------

kolommen = (
    "Stam", "RingNr", "Ringmaat", "Geslacht", "Mutatie",
    "Status", "Herkomst", "Kooi", "Jaar", "Vader", "Moeder"
)

tabel_frame = tk.LabelFrame(root, text="Overzicht vogels", padx=6, pady=6)
tabel_frame.pack(fill="both", expand=True, padx=8, pady=6)

container = tk.Frame(tabel_frame)
container.pack(fill="both", expand=True)

lijst = ttk.Treeview(container, columns=kolommen, show="headings")
ys = ttk.Scrollbar(container, orient="vertical", command=lijst.yview)
xs = ttk.Scrollbar(container, orient="horizontal", command=lijst.xview)
lijst.configure(yscrollcommand=ys.set, xscrollcommand=xs.set)

for c in kolommen:
    lijst.heading(c, text=c)
    lijst.column(c, width=130, anchor="w")

lijst.grid(row=0, column=0, sticky="nsew")
ys.grid(row=0, column=1, sticky="ns")
xs.grid(row=1, column=0, sticky="ew")

container.rowconfigure(0, weight=1)
container.columnconfigure(0, weight=1)

# ---------------- HULPFUNCTIES ----------------

def sleutel(v):
    return v["Stamnummer"] + "-" + v["Ringnummer"]


def vogel_naam(v):
    return f"{v.get('Stamnummer', '')} - {v.get('Ringnummer', '')}".strip(" -")


def vogel_info_regels(v):
    volgorde = [
        "Stamnummer", "Ringnummer", "Ringmaat", "Geslacht",
        "Mutatie", "Status", "Herkomst", "Kooi", "Kweekjaar",
        "Vader", "Moeder"
    ]
    return [f"{k}: {v.get(k, '')}" for k in volgorde]


def vind_vogel_op_naam(naam):
    naam = (naam or "").strip()
    if not naam:
        return None

    delen = [x.strip() for x in naam.split(" - ", 1)]
    if len(delen) != 2:
        return None

    stam, ring = delen
    return vogels.get(f"{stam}-{ring}")


def alle_mannen():
    return sorted([vogel_naam(v) for v in vogels.values() if v.get("Geslacht") == "Man"])


def alle_poppen():
    return sorted([vogel_naam(v) for v in vogels.values() if v.get("Geslacht") == "Pop"])


def alle_vogel_namen():
    return sorted([vogel_naam(v) for v in vogels.values()])


def kind_al_in_koppel(kind_naam, exclude_koppel=None):
    for koppelnaam, info in koppels.items():
        if exclude_koppel is not None and koppelnaam == exclude_koppel:
            continue
        if kind_naam in info.get("jongen", []):
            return True
    return False


def bestaat_koppel_combinatie(man_naam, pop_naam, exclude_koppel=None):
    for naam, info in koppels.items():
        if exclude_koppel is not None and naam == exclude_koppel:
            continue
        if info.get("man") == man_naam and info.get("pop") == pop_naam:
            return True
    return False


def kinderen_van(vogel):
    resultaat = []
    if vogel is None:
        return resultaat

    nm = vogel_naam(vogel)
    for v in vogels.values():
        if v.get("Vader", "").strip() == nm or v.get("Moeder", "").strip() == nm:
            resultaat.append(v)
    return resultaat


def bestaat_ring(jaar, ring, uitsluiten=None):
    for k, v in vogels.items():
        if k == uitsluiten:
            continue
        if v.get("Kweekjaar") == jaar and v.get("Ringnummer") == ring:
            return True
    return False


# ---------------- STAMBOOM ----------------

def bouw_stamboom(vogel, max_gen=4, gen=1, bezocht=None):
    if bezocht is None:
        bezocht = set()

    if vogel is None:
        return {"gen": gen, "label": "Onbekend", "details": [], "vader": None, "moeder": None}

    key = sleutel(vogel)
    if key in bezocht:
        return {
            "gen": gen,
            "label": f"{vogel_naam(vogel)} (cyclische verwijzing)",
            "details": vogel_info_regels(vogel),
            "vader": None,
            "moeder": None
        }

    node = {
        "gen": gen,
        "label": vogel_naam(vogel),
        "details": vogel_info_regels(vogel),
        "vader": None,
        "moeder": None
    }

    if gen >= max_gen:
        return node

    nieuw_bezocht = set(bezocht)
    nieuw_bezocht.add(key)

    vader_ref = vogel.get("Vader", "").strip()
    moeder_ref = vogel.get("Moeder", "").strip()

    if vader_ref:
        node["vader"] = bouw_stamboom(vind_vogel_op_naam(vader_ref), max_gen, gen + 1, nieuw_bezocht)
    else:
        node["vader"] = {"gen": gen + 1, "label": "Onbekende vader", "details": [], "vader": None, "moeder": None}

    if moeder_ref:
        node["moeder"] = bouw_stamboom(vind_vogel_op_naam(moeder_ref), max_gen, gen + 1, nieuw_bezocht)
    else:
        node["moeder"] = {"gen": gen + 1, "label": "Onbekende moeder", "details": [], "vader": None, "moeder": None}

    return node


def bouw_nakomelingen_boom(vogel, max_gen=4, gen=1, bezocht=None):
    if bezocht is None:
        bezocht = set()

    if vogel is None:
        return {"gen": gen, "label": "Onbekend", "details": [], "kinderen": []}

    key = sleutel(vogel)
    if key in bezocht:
        return {
            "gen": gen,
            "label": f"{vogel_naam(vogel)} (cyclische verwijzing)",
            "details": vogel_info_regels(vogel),
            "kinderen": []
        }

    node = {
        "gen": gen,
        "label": vogel_naam(vogel),
        "details": vogel_info_regels(vogel),
        "kinderen": []
    }

    if gen >= max_gen:
        return node

    nieuw_bezocht = set(bezocht)
    nieuw_bezocht.add(key)

    for k in kinderen_van(vogel):
        node["kinderen"].append(
            bouw_nakomelingen_boom(k, max_gen=max_gen, gen=gen + 1, bezocht=nieuw_bezocht)
        )

    return node


def render_stamboom_html_mooi(node):
    if node is None:
        return "<li><div class='node'><div class='node-title'>Onbekend</div></div></li>"

    data = {}
    for regel in node.get("details", []):
        if ": " in regel:
            k, v = regel.split(": ", 1)
            data[k] = v

    def val(k):
        t = data.get(k, "")
        return t if t else "-"

    html = f"""
<li>
  <div class="node">
    <div class="node-title">{node.get('label', 'Onbekend')}</div>
    <div class="node-grid">
      <div class="node-item"><b>Stamnummer:</b> {val("Stamnummer")}</div>
      <div class="node-item"><b>Ringnummer:</b> {val("Ringnummer")}</div>
      <div class="node-item"><b>Ringmaat:</b> {val("Ringmaat")}</div>
      <div class="node-item"><b>Geslacht:</b> {val("Geslacht")}</div>
      <div class="node-item"><b>Mutatie:</b> {val("Mutatie")}</div>
      <div class="node-item"><b>Status:</b> {val("Status")}</div>
      <div class="node-item"><b>Herkomst:</b> {val("Herkomst")}</div>
      <div class="node-item"><b>Kooi:</b> {val("Kooi")}</div>
      <div class="node-item"><b>Kweekjaar:</b> {val("Kweekjaar")}</div>
      <div class="node-item"><b>Vader:</b> {val("Vader")}</div>
      <div class="node-item"><b>Moeder:</b> {val("Moeder")}</div>
    </div>
  </div>
"""

    kinderen_html = []

    if node.get("vader") is not None:
        kinderen_html.append(render_stamboom_html_mooi(node["vader"]))
    if node.get("moeder") is not None:
        kinderen_html.append(render_stamboom_html_mooi(node["moeder"]))

    for kind in node.get("kinderen", []):
        kinderen_html.append(render_stamboom_html_mooi(kind))

    if kinderen_html:
        html += "<ul>" + "".join(kinderen_html) + "</ul>"

    html += "</li>"
    return html


def exporteer_stamboom_en_print(richting="voorouders"):
    sel = lijst.selection()
    if not sel:
        messagebox.showwarning("Geen selectie", "Selecteer eerst een vogel in de tabel.")
        return

    vogel = vogels.get(sel[0])
    if not vogel:
        messagebox.showerror("Fout", "Geselecteerde vogel niet gevonden.")
        return

    if richting == "nakomelingen":
        boom = bouw_nakomelingen_boom(vogel, max_gen=4)
        titel_richting = "Nakomelingen"
        kleur = "#0ea5e9"
    else:
        boom = bouw_stamboom(vogel, max_gen=4)
        titel_richting = "Voorouders"
        kleur = "#22c55e"

    boom_html = render_stamboom_html_mooi(boom)

    inhoud = f"""<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Stamboom - {titel_richting} - {vogel_naam(vogel)}</title>
<style>
:root {{
  --accent: {kleur};
  --bg: #f6f8fb;
  --card: #ffffff;
  --text: #0f172a;
  --muted: #475569;
  --line: #cbd5e1;
}}
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: var(--bg); color: var(--text); font-family: "Segoe UI", Arial, sans-serif; }}
.wrapper {{ max-width: 1450px; margin: 0 auto; padding: 24px; }}
.header {{ background: linear-gradient(135deg, var(--accent), #334155); color: #fff; border-radius: 14px; padding: 18px 20px; margin-bottom: 16px; }}
.header h1 {{ margin: 0 0 6px 0; font-size: 24px; }}
.header .sub {{ opacity: .95; font-size: 14px; }}
.hint {{ background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; padding: 10px 12px; border-radius: 10px; margin-bottom: 18px; font-size: 13px; }}
.tree {{ overflow: auto; padding: 10px; background: #eef2f7; border: 1px solid #dbe3ee; border-radius: 12px; }}
.tree ul {{ padding-top: 24px; position: relative; padding-left: 28px; margin: 0; }}
.tree li {{ list-style: none; margin: 0; padding: 12px 8px 0 8px; position: relative; }}
.tree li::before, .tree li::after {{ content: ""; position: absolute; left: -18px; }}
.tree li::before {{ border-left: 2px solid var(--line); top: 0; height: 100%; }}
.tree li::after {{ border-top: 2px solid var(--line); top: 26px; width: 18px; height: 20px; }}
.tree li:last-child::before {{ height: 26px; }}
.node {{ display: inline-block; min-width: 320px; max-width: 900px; background: var(--card); border: 1px solid #dbe3ee; border-left: 6px solid var(--accent); border-radius: 12px; padding: 10px 12px; }}
.node-title {{ font-weight: 700; font-size: 15px; margin-bottom: 6px; }}
.node-grid {{ display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap: 4px 14px; font-size: 12.5px; color: var(--muted); }}
.node-item b {{ color: #0f172a; }}
@media (max-width: 900px) {{
  .node {{ min-width: 260px; }}
  .node-grid {{ grid-template-columns: 1fr; }}
}}
@media print {{
  body {{ background: #fff; }}
  .wrapper {{ max-width: none; padding: 8mm; }}
  .hint {{ display: none; }}
  .tree {{ border: none; background: #fff; padding: 0; }}
  .node {{ break-inside: avoid; page-break-inside: avoid; }}
}}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>Stamboom (4 generaties) - {titel_richting}</h1>
    <div class="sub">Startvogel: {vogel_naam(vogel)}</div>
  </div>
  <div class="hint">Gebruik <b>Ctrl+P</b> om te printen. Kies je printer of <b>Opslaan als PDF</b>.</div>
  <div class="tree"><ul>{boom_html}</ul></div>
</div>
</body>
</html>
"""

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".html", mode="w", encoding="utf-8")
    tmp.write(inhoud)
    tmp.close()

    webbrowser.open("file://" + tmp.name)
    messagebox.showinfo(
        "Stamboom gegenereerd",
        f"De {titel_richting.lower()}-stamboom is geopend in je browser.\nGebruik Ctrl+P voor printerkeuze of Opslaan als PDF."
    )


# ---------------- KOPPEL AFDRUKVOORBEELD ----------------

def exporteer_koppel_print(koppel_naam):
    """Genereert afdrukbare HTML-versie van één koppel"""
    if koppel_naam not in koppels:
        messagebox.showerror("Fout", "Koppel niet gevonden.")
        return

    info = koppels[koppel_naam]
    man_naam = info.get("man", "Onbekend")
    pop_naam = info.get("pop", "Onbekend")
    jongen = info.get("jongen", [])
    
    man_info = vind_vogel_op_naam(man_naam)
    pop_info = vind_vogel_op_naam(pop_naam)
    
    # Bouw jongen tabel HTML
    jongen_html = ""
    if jongen:
        jongen_html += """
        <table class="jongen-table">
          <thead>
            <tr>
              <th>Stamnummer</th>
              <th>Ringnummer</th>
              <th>Ringmaat</th>
              <th>Geslacht</th>
              <th>Mutatie</th>
            </tr>
          </thead>
          <tbody>
"""
        for jong in sorted(jongen):
            jong_info = vind_vogel_op_naam(jong)
            if jong_info:
                stam = jong_info.get("Stamnummer", "-")
                ring = jong_info.get("Ringnummer", "-")
                ringmaat = jong_info.get("Ringmaat", "-")
                geslacht = jong_info.get("Geslacht", "-")
                mutatie = jong_info.get("Mutatie", "-")
                jongen_html += f"""
            <tr>
              <td>{stam}</td>
              <td>{ring}</td>
              <td>{ringmaat}</td>
              <td>{geslacht}</td>
              <td>{mutatie}</td>
            </tr>
"""
            else:
                jongen_html += f"""
            <tr>
              <td colspan="5">{jong}</td>
            </tr>
"""
        jongen_html += """
          </tbody>
        </table>
"""
    else:
        jongen_html += '<div class="jong-item-empty">Geen jongen geregistreerd</div>\n'
    
    koppel_html = f"""
<div class="koppel-card">
  <div class="koppel-header">
    <h2>{koppel_naam}</h2>
  </div>
  
  <div class="koppel-content">
    <div class="koppel-section">
      <h3>👨 Man: {man_naam}</h3>
      <div class="vogel-details">
        <div class="detail-row">
          <span class="label">Ringmaat:</span>
          <span class="value">{man_info.get('Ringmaat', '-') if man_info else '-'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Mutatie:</span>
          <span class="value">{man_info.get('Mutatie', '-') if man_info else '-'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Status:</span>
          <span class="value">{man_info.get('Status', '-') if man_info else '-'}</span>
        </div>
      </div>
    </div>
    
    <div class="koppel-section">
      <h3>👩 Pop: {pop_naam}</h3>
      <div class="vogel-details">
        <div class="detail-row">
          <span class="label">Ringmaat:</span>
          <span class="value">{pop_info.get('Ringmaat', '-') if pop_info else '-'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Mutatie:</span>
          <span class="value">{pop_info.get('Mutatie', '-') if pop_info else '-'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Status:</span>
          <span class="value">{pop_info.get('Status', '-') if pop_info else '-'}</span>
        </div>
      </div>
    </div>
    
    <div class="koppel-section">
      <h3>📋 Koppel info</h3>
      <div class="vogel-details">
        <div class="detail-row">
          <span class="label">Kooi:</span>
          <span class="value">{info.get('kooi', '-')}</span>
        </div>
        <div class="detail-row">
          <span class="label">Kweekjaar:</span>
          <span class="value">{info.get('kweekjaar', '-')}</span>
        </div>
        <div class="detail-row">
          <span class="label">Aantal jongen:</span>
          <span class="value">{len(jongen)}</span>
        </div>
      </div>
    </div>
    
    <div class="koppel-section">
      <h3>🐥 Jongen ({len(jongen)})</h3>
      {jongen_html}
    </div>
  </div>
</div>
"""

    inhoud = f"""<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Koppel: {koppel_naam}</title>
<style>
:root {{
  --accent: #ec4899;
  --bg: #f6f8fb;
  --card: #ffffff;
  --text: #0f172a;
  --muted: #475569;
  --border: #e2e8f0;
}}

* {{ box-sizing: border-box; }}

body {{
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: "Segoe UI", Arial, sans-serif;
  line-height: 1.6;
}}

.wrapper {{
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}}

.header {{
  background: linear-gradient(135deg, var(--accent), #a855f7);
  color: #fff;
  border-radius: 14px;
  padding: 24px 28px;
  margin-bottom: 24px;
}}

.header h1 {{
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
}}

.header .sub {{
  opacity: 0.95;
  font-size: 14px;
}}

.hint {{
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 24px;
  font-size: 13px;
}}

.koppel-card {{
  background: var(--card);
  border: 1px solid var(--border);
  border-left: 6px solid var(--accent);
  border-radius: 12px;
  padding: 18px;
  page-break-inside: avoid;
  break-inside: avoid;
}}

.koppel-header {{
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--border);
}}

.koppel-header h2 {{
  margin: 0;
  font-size: 18px;
  color: #000;
}}

.koppel-content {{
  display: flex;
  flex-direction: column;
  gap: 12px;
}}

.koppel-section h3 {{
  margin: 8px 0 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}}

.vogel-details {{
  display: flex;
  flex-direction: column;
  gap: 4px;
}}

.detail-row {{
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 13px;
}}

.detail-row .label {{
  font-weight: 600;
  color: var(--text);
}}

.detail-row .value {{
  color: var(--muted);
}}

.jongen-table {{
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin-top: 8px;
}}

.jongen-table thead {{
  background: #f1f5f9;
  border-bottom: 2px solid var(--border);
}}

.jongen-table th {{
  padding: 6px 8px;
  text-align: left;
  font-weight: 600;
  color: var(--text);
}}

.jongen-table td {{
  padding: 6px 8px;
  border-bottom: 1px solid var(--border);
  color: var(--muted);
}}

.jongen-table tbody tr:hover {{
  background: #f9fafb;
}}

.jong-item-empty {{
  padding: 6px 8px;
  background: #f1f5f9;
  border-radius: 6px;
  font-size: 12px;
  color: #334155;
  text-align: center;
}}

@media (max-width: 768px) {{
  .wrapper {{
    padding: 12px;
  }}
  
  .jongen-table {{
    font-size: 11px;
  }}
  
  .jongen-table th,
  .jongen-table td {{
    padding: 4px 6px;
  }}
}}

@media print {{
  body {{
    background: #fff;
  }}
  
  .wrapper {{
    max-width: none;
    padding: 8mm;
  }}
  
  .hint {{
    display: none;
  }}
  
  .koppel-card {{
    border: 1px solid #ddd;
  }}
  
  .jongen-table {{
    page-break-inside: avoid;
  }}
}}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>{koppel_naam}</h1>
    <div class="sub">Gegenereerd op {datetime.now().strftime('%d-%m-%Y %H:%M')}</div>
  </div>
  
  <div class="hint">
    Gebruik <b>Ctrl+P</b> om af te drukken. Kies je printer of <b>Opslaan als PDF</b>.
  </div>
  
  {koppel_html}
</div>
</body>
</html>
"""

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".html", mode="w", encoding="utf-8")
    tmp.write(inhoud)
    tmp.close()

    webbrowser.open("file://" + tmp.name)


# ---------------- UI REFRESH ----------------

def refresh():
    lijst.delete(*lijst.get_children())
    for k, v in sorted(
        vogels.items(),
        key=lambda item: (item[1].get("Kweekjaar", ""), item[1].get("Stamnummer", ""), item[1].get("Ringnummer", ""))
    ):
        lijst.insert(
            "",
            tk.END,
            iid=k,
            values=(
                v.get("Stamnummer", ""),
                v.get("Ringnummer", ""),
                v.get("Ringmaat", ""),
                v.get("Geslacht", ""),
                v.get("Mutatie", ""),
                v.get("Status", ""),
                v.get("Herkomst", ""),
                v.get("Kooi", ""),
                v.get("Kweekjaar", ""),
                v.get("Vader", ""),
                v.get("Moeder", "")
            )
        )


def refresh_dropdowns():
    velden["Mutatie"]["values"] = sorted(mutaties)
    velden["Status"]["values"] = sorted(statussen)
    velden["Kooi"]["values"] = sorted(kooien)
    velden["Kweekjaar"]["values"] = sorted(jaren)
    velden["Ringmaat"]["values"] = sorted(ringmaten)
    velden["Geslacht"]["values"] = sorted(geslachten)
    velden["Herkomst"]["values"] = sorted(herkomsten)

    vaders_lijst = []
    moeders_lijst = []

    for vogel in vogels.values():
        naam = vogel.get("Stamnummer", "") + " - " + vogel.get("Ringnummer", "")
        if vogel.get("Geslacht") == "Man":
            vaders_lijst.append(naam)
        elif vogel.get("Geslacht") == "Pop":
            moeders_lijst.append(naam)

    velden["Vader"]["values"] = sorted(vaders_lijst)
    velden["Moeder"]["values"] = sorted(moeders_lijst)


def gegevens():
    return {
        "Stamnummer": velden["Stamnummer *"].get().strip(),
        "Ringnummer": velden["Ringnummer"].get().strip(),
        "Ringmaat": velden["Ringmaat"].get().strip(),
        "Geslacht": velden["Geslacht"].get().strip(),
        "Mutatie": velden["Mutatie"].get().strip(),
        "Status": velden["Status"].get().strip(),
        "Herkomst": velden["Herkomst"].get().strip(),
        "Kooi": velden["Kooi"].get().strip(),
        "Kweekjaar": velden["Kweekjaar"].get().strip(),
        "Vader": velden["Vader"].get().strip(),
        "Moeder": velden["Moeder"].get().strip()
    }


def leeg_formulier():
    velden["Stamnummer *"].delete(0, tk.END)
    velden["Ringnummer"].delete(0, tk.END)
    velden["Ringmaat"].set("")
    velden["Geslacht"].set("")
    velden["Mutatie"].set("")
    velden["Status"].set("")
    velden["Herkomst"].set("")
    velden["Kooi"].set("")
    velden["Kweekjaar"].set(str(datetime.now().year))
    velden["Vader"].set("")
    velden["Moeder"].set("")


# ---------------- CRUD VOGELS ----------------

def toevoegen():
    d = gegevens()
    if d["Stamnummer"] == "":
        messagebox.showerror("Fout", "Stamnummer verplicht")
        return

    if bestaat_ring(d["Kweekjaar"], d["Ringnummer"]):
        messagebox.showerror("Fout", "Dubbele ring binnen hetzelfde jaar")
        return

    vogels[sleutel(d)] = d
    opslaan()
    refresh()
    refresh_dropdowns()
    leeg_formulier()


def verwijderen():
    sel = lijst.selection()
    if not sel:
        return

    if not messagebox.askyesno("Bevestigen", "Weet je zeker dat je deze vogel wilt verwijderen?"):
        return

    key = sel[0]
    vogel = vogels.get(key)
    vogel_nm = vogel_naam(vogel) if vogel else None

    if vogel_nm:
        for koppel_naam, info in koppels.items():
            if info.get("man") == vogel_nm or info.get("pop") == vogel_nm or vogel_nm in info.get("jongen", []):
                messagebox.showerror(
                    "Fout",
                    f"Vogel zit nog in koppel '{koppel_naam}'.\nVerwijder eerst de link in koppels."
                )
                return

    del vogels[key]
    opslaan()
    refresh()
    refresh_dropdowns()
    leeg_formulier()


def edit():
    sel = lijst.selection()
    if not sel:
        return

    d = vogels[sel[0]]

    velden["Stamnummer *"].delete(0, tk.END)
    velden["Stamnummer *"].insert(0, d.get("Stamnummer", ""))

    velden["Ringnummer"].delete(0, tk.END)
    velden["Ringnummer"].insert(0, d.get("Ringnummer", ""))

    velden["Ringmaat"].set(d.get("Ringmaat", ""))
    velden["Geslacht"].set(d.get("Geslacht", ""))
    velden["Mutatie"].set(d.get("Mutatie", ""))
    velden["Status"].set(d.get("Status", ""))
    velden["Herkomst"].set(d.get("Herkomst", ""))
    velden["Kooi"].set(d.get("Kooi", ""))
    velden["Kweekjaar"].set(d.get("Kweekjaar", ""))
    velden["Vader"].set(d.get("Vader", ""))
    velden["Moeder"].set(d.get("Moeder", ""))


def wijzigen():
    sel = lijst.selection()
    if not sel:
        return

    oud = sel[0]
    oud_vogel = vogels.get(oud)
    oud_naam = vogel_naam(oud_vogel) if oud_vogel else None

    d = gegevens()

    if d["Stamnummer"] == "":
        messagebox.showerror("Fout", "Stamnummer verplicht")
        return

    nieuw = sleutel(d)

    if bestaat_ring(d["Kweekjaar"], d["Ringnummer"], oud):
        messagebox.showerror("Fout", "Dubbele ring binnen hetzelfde jaar")
        return

    vogels[nieuw] = d
    if nieuw != oud:
        del vogels[oud]

    nieuw_naam = vogel_naam(d)
    if oud_naam and nieuw_naam != oud_naam:
        for _, info in koppels.items():
            if info.get("man") == oud_naam:
                info["man"] = nieuw_naam
            if info.get("pop") == oud_naam:
                info["pop"] = nieuw_naam
            info["jongen"] = [nieuw_naam if j == oud_naam else j for j in info.get("jongen", [])]

    opslaan()
    refresh()
    refresh_dropdowns()
    leeg_formulier()


# ---------------- KOPPELS BEHEER (ALLES EDITEERBAAR) ----------------

def koppels_beheer():
    win = tk.Toplevel(root)
    win.title("Koppels beheren (alles editeerbaar)")
    win.geometry("1150x700")

    links = tk.Frame(win, padx=8, pady=8)
    links.pack(side="left", fill="y")

    rechts = tk.Frame(win, padx=8, pady=8)
    rechts.pack(side="right", fill="both", expand=True)

    tk.Label(links, text="Koppelnaam").grid(row=0, column=0, sticky="w")
    ent_naam = ttk.Entry(links, width=35)
    ent_naam.grid(row=1, column=0, pady=(0, 8), sticky="w")

    tk.Label(links, text="Man").grid(row=2, column=0, sticky="w")
    cmb_man = ttk.Combobox(links, state="readonly", width=42, values=alle_mannen())
    cmb_man.grid(row=3, column=0, pady=(0, 8), sticky="w")

    tk.Label(links, text="Pop").grid(row=4, column=0, sticky="w")
    cmb_pop = ttk.Combobox(links, state="readonly", width=42, values=alle_poppen())
    cmb_pop.grid(row=5, column=0, pady=(0, 8), sticky="w")

    tk.Label(links, text="Kooi").grid(row=6, column=0, sticky="w")
    cmb_kooi = ttk.Combobox(links, state="readonly", width=42, values=sorted(kooien))
    cmb_kooi.grid(row=7, column=0, pady=(0, 8), sticky="w")

    tk.Label(links, text="Kweekjaar").grid(row=8, column=0, sticky="w")
    cmb_kweekjaar = ttk.Combobox(links, state="readonly", width=42, values=sorted(jaren))
    cmb_kweekjaar.grid(row=9, column=0, pady=(0, 8), sticky="w")

    tk.Label(links, text="Jong toevoegen aan geselecteerd koppel").grid(row=10, column=0, sticky="w")
    cmb_jong = ttk.Combobox(links, state="readonly", width=42, values=alle_vogel_namen())
    cmb_jong.grid(row=11, column=0, pady=(0, 8), sticky="w")

    cols = ("Koppel", "Man", "Pop", "Kooi", "Kweekjaar", "Aantal jongen")
    tv = ttk.Treeview(rechts, columns=cols, show="headings", height=12)
    for c in cols:
        tv.heading(c, text=c)
        tv.column(c, width=170, anchor="w")
    tv.pack(fill="x")

    tk.Label(rechts, text="Jongen van geselecteerd koppel").pack(anchor="w", pady=(10, 2))
    lb_jongen = tk.Listbox(rechts, height=14)
    lb_jongen.pack(fill="both", expand=True)

    def leeg_editvelden():
        ent_naam.delete(0, tk.END)
        cmb_man.set("")
        cmb_pop.set("")
        cmb_kooi.set("")
        cmb_kweekjaar.set("")
        cmb_jong.set("")

    def refresh_koppels_ui():
        cmb_man["values"] = alle_mannen()
        cmb_pop["values"] = alle_poppen()
        cmb_jong["values"] = alle_vogel_namen()
        cmb_kooi["values"] = sorted(kooien)
        cmb_kweekjaar["values"] = sorted(jaren)

        tv.delete(*tv.get_children())
        for naam, info in sorted(koppels.items()):
            tv.insert("", tk.END, iid=naam, values=(
                naam,
                info.get("man", ""),
                info.get("pop", ""),
                info.get("kooi", ""),
                info.get("kweekjaar", ""),
                len(info.get("jongen", []))
            ))

        lb_jongen.delete(0, tk.END)

    def toon_selectie_in_edit(_evt=None):
        lb_jongen.delete(0, tk.END)
        sel = tv.selection()
        if not sel:
            leeg_editvelden()
            return

        koppel_naam = sel[0]
        info = koppels[koppel_naam]

        ent_naam.delete(0, tk.END)
        ent_naam.insert(0, koppel_naam)
        cmb_man.set(info.get("man", ""))
        cmb_pop.set(info.get("pop", ""))
        cmb_kooi.set(info.get("kooi", ""))
        cmb_kweekjaar.set(info.get("kweekjaar", ""))

        for j in info.get("jongen", []):
            lb_jongen.insert(tk.END, j)

    def valideer_koppel(naam, man, pop, kooi, kweekjaar, exclude_name=None):
        if not naam:
            return "Koppelnaam is verplicht"
        if not man or not pop:
            return "Koppel moet een man en een pop hebben"
        if man == pop:
            return "Man en pop moeten verschillend zijn"
        if not kooi:
            return "Kooi is verplicht"
        if not kweekjaar:
            return "Kweekjaar is verplicht"

        man_v = vind_vogel_op_naam(man)
        pop_v = vind_vogel_op_naam(pop)

        if man_v is None or man_v.get("Geslacht") != "Man":
            return "Gekozen man is ongeldig"
        if pop_v is None or pop_v.get("Geslacht") != "Pop":
            return "Gekozen pop is ongeldig"

        if bestaat_koppel_combinatie(man, pop, exclude_koppel=exclude_name):
            return "Dit koppel (man+pop) bestaat al"

        if exclude_name is None:
            if naam in koppels:
                return "Koppelnaam bestaat al"
        else:
            if naam != exclude_name and naam in koppels:
                return "Nieuwe koppelnaam bestaat al"

        return None

    def maak_koppel():
        naam = ent_naam.get().strip()
        man = cmb_man.get().strip()
        pop = cmb_pop.get().strip()
        kooi = cmb_kooi.get().strip()
        kweekjaar = cmb_kweekjaar.get().strip()

        err = valideer_koppel(naam, man, pop, kooi, kweekjaar, exclude_name=None)
        if err:
            messagebox.showerror("Fout", err)
            return

        koppels[naam] = {
            "man": man,
            "pop": pop,
            "kooi": kooi,
            "kweekjaar": kweekjaar,
            "jongen": []
        }
        opslaan()
        refresh_koppels_ui()
        tv.selection_set(naam)
        tv.focus(naam)
        toon_selectie_in_edit()

    def update_koppel():
        sel = tv.selection()
        if not sel:
            messagebox.showwarning("Geen selectie", "Selecteer eerst een koppel")
            return

        oud_naam = sel[0]
        info = koppels[oud_naam]

        nieuw_naam = ent_naam.get().strip()
        man = cmb_man.get().strip()
        pop = cmb_pop.get().strip()
        kooi = cmb_kooi.get().strip()
        kweekjaar = cmb_kweekjaar.get().strip()

        err = valideer_koppel(nieuw_naam, man, pop, kooi, kweekjaar, exclude_name=oud_naam)
        if err:
            messagebox.showerror("Fout", err)
            return

        jongen = info.get("jongen", [])

        if man in jongen or pop in jongen:
            messagebox.showerror("Fout", "Partner kan niet tegelijk als jong in hetzelfde koppel staan")
            return

        nieuw_info = {
            "man": man,
            "pop": pop,
            "kooi": kooi,
            "kweekjaar": kweekjaar,
            "jongen": jongen
        }

        if nieuw_naam != oud_naam:
            del koppels[oud_naam]
        koppels[nieuw_naam] = nieuw_info

        opslaan()
        refresh_koppels_ui()
        tv.selection_set(nieuw_naam)
        tv.focus(nieuw_naam)
        toon_selectie_in_edit()

    def verwijder_koppel():
        sel = tv.selection()
        if not sel:
            return
        naam = sel[0]
        if not messagebox.askyesno("Bevestigen", f"Koppel '{naam}' verwijderen?"):
            return
        del koppels[naam]
        opslaan()
        refresh_koppels_ui()
        leeg_editvelden()

    def voeg_jong_toe():
        sel = tv.selection()
        if not sel:
            messagebox.showwarning("Geen selectie", "Selecteer eerst een koppel")
            return

        koppel_naam = sel[0]
        info = koppels[koppel_naam]

        jong = cmb_jong.get().strip()
        if not jong:
            messagebox.showerror("Fout", "Selecteer een jong")
            return

        man = info.get("man", "")
        pop = info.get("pop", "")

        if jong == man or jong == pop:
            messagebox.showerror("Fout", "Partner kan niet als jong toegevoegd worden")
            return

        if kind_al_in_koppel(jong, exclude_koppel=koppel_naam):
            messagebox.showerror("Fout", "Dit jong is al gekoppeld aan een ander koppel")
            return

        if jong in info.get("jongen", []):
            messagebox.showwarning("Info", "Dit jong staat al in dit koppel")
            return

        jong_vogel = vind_vogel_op_naam(jong)
        if jong_vogel:
            vader = jong_vogel.get("Vader", "").strip()
            moeder = jong_vogel.get("Moeder", "").strip()
            if vader and moeder:
                ok = (vader == man and moeder == pop) or (vader == pop and moeder == man)
                if not ok:
                    if not messagebox.askyesno(
                        "Waarschuwing",
                        "Vader/Moeder van dit jong komen niet overeen met dit koppel.\nToch toevoegen?"
                    ):
                        return

        info["jongen"].append(jong)
        info["jongen"] = sorted(set(info["jongen"]))
        opslaan()
        refresh_koppels_ui()
        tv.selection_set(koppel_naam)
        tv.focus(koppel_naam)
        toon_selectie_in_edit()

    def verwijder_jong():
        sel_koppel = tv.selection()
        sel_jong = lb_jongen.curselection()
        if not sel_koppel or not sel_jong:
            return

        koppel_naam = sel_koppel[0]
        jong = lb_jongen.get(sel_jong[0])

        if not messagebox.askyesno("Bevestigen", f"Jong '{jong}' verwijderen uit '{koppel_naam}'?"):
            return

        info = koppels[koppel_naam]
        info["jongen"] = [j for j in info.get("jongen", []) if j != jong]
        opslaan()
        refresh_koppels_ui()
        tv.selection_set(koppel_naam)
        tv.focus(koppel_naam)
        toon_selectie_in_edit()

    def afdruk_koppel():
        sel = tv.selection()
        if not sel:
            messagebox.showwarning("Geen selectie", "Selecteer eerst een koppel om af te drukken")
            return
        koppel_naam = sel[0]
        exporteer_koppel_print(koppel_naam)
        messagebox.showinfo(
            "Koppel afdrukken",
            f"Koppel '{koppel_naam}' is geopend in je browser.\nGebruik Ctrl+P voor printerkeuze of Opslaan als PDF."
        )

    btns = tk.Frame(links)
    btns.grid(row=12, column=0, pady=8, sticky="w")

    ttk.Button(btns, text="Nieuw koppel", command=maak_koppel).pack(side="left", padx=3)
    ttk.Button(btns, text="Opslaan wijzigingen", command=update_koppel).pack(side="left", padx=3)
    ttk.Button(btns, text="Verwijder koppel", command=verwijder_koppel).pack(side="left", padx=3)

    btns2 = tk.Frame(links)
    btns2.grid(row=13, column=0, pady=8, sticky="w")

    ttk.Button(btns2, text="Jong toevoegen", command=voeg_jong_toe).pack(side="left", padx=3)
    ttk.Button(btns2, text="Jong verwijderen", command=verwijder_jong).pack(side="left", padx=3)

    btns3 = tk.Frame(links)
    btns3.grid(row=14, column=0, pady=8, sticky="w")

    ttk.Button(btns3, text="🖨️ Afdrukken", command=afdruk_koppel).pack(side="left", padx=3)

    tv.bind("<<TreeviewSelect>>", toon_selectie_in_edit)

    refresh_koppels_ui()


# ---------------- DROPDOWN BEHEER ----------------

def voeg_item(bestand, lijst_data, item):
    item = item.strip()
    if item and item not in lijst_data:
        lijst_data.append(item)
        schrijf(bestand, lijst_data)


def verwijder_item(bestand, lijst_data, item):
    item = item.strip()
    if item not in lijst_data:
        return

    in_gebruik = False
    for v in vogels.values():
        if (
            (bestand == MUT and v.get("Mutatie") == item) or
            (bestand == STAT and v.get("Status") == item) or
            (bestand == KOOI and v.get("Kooi") == item) or
            (bestand == JAAR and v.get("Kweekjaar") == item) or
            (bestand == RINGMAAT and v.get("Ringmaat") == item) or
            (bestand == GESLACHT and v.get("Geslacht") == item) or
            (bestand == HERKOMST and v.get("Herkomst") == item)
        ):
            in_gebruik = True
            break

    if bestand == KOOI and not in_gebruik:
        for info in koppels.values():
            if info.get("kooi", "") == item:
                in_gebruik = True
                break

    if bestand == JAAR and not in_gebruik:
        for info in koppels.values():
            if info.get("kweekjaar", "") == item:
                in_gebruik = True
                break

    if in_gebruik:
        messagebox.showerror("Fout", f"'{item}' is nog in gebruik.")
        return

    lijst_data.remove(item)
    schrijf(bestand, lijst_data)


def beheer_lijsten():
    win = tk.Toplevel(root)
    win.title("Dropdown beheer")
    win.geometry("620x470")
    win.columnconfigure(1, weight=1)

    def build(title, lijst_data, bestand, rij):
        tk.Label(win, text=title, width=15, anchor="w").grid(
            row=rij, column=0, padx=8, pady=6, sticky="w"
        )

        c = ttk.Combobox(win, state="normal")
        c.grid(row=rij, column=1, padx=6, pady=6, sticky="ew")
        c["values"] = sorted(lijst_data)

        if lijst_data:
            c.set(sorted(lijst_data)[0])

        def sync_values():
            c["values"] = sorted(lijst_data)

        def add():
            item = c.get().strip()
            if not item:
                return
            voeg_item(bestand, lijst_data, item)
            sync_values()
            c.set(item)
            refresh_dropdowns()

        def delete():
            item = c.get().strip()
            if not item:
                return
            if not messagebox.askyesno("Bevestigen", f"Weet je zeker dat je '{item}' wilt verwijderen?"):
                return
            verwijder_item(bestand, lijst_data, item)
            sync_values()
            c.set(sorted(lijst_data)[0] if lijst_data else "")
            refresh_dropdowns()

        tk.Button(win, text="+", width=4, command=add).grid(row=rij, column=2, padx=2)
        tk.Button(win, text="-", width=4, command=delete).grid(row=rij, column=3, padx=2)

    build("Mutatie", mutaties, MUT, 0)
    build("Status", statussen, STAT, 1)
    build("Kooi", kooien, KOOI, 2)
    build("Jaar", jaren, JAAR, 3)
    build("Ringmaat", ringmaten, RINGMAAT, 4)
    build("Geslacht", geslachten, GESLACHT, 5)
    build("Herkomst", herkomsten, HERKOMST, 6)

    tk.Label(win, text="Vader/Moeder worden automatisch", fg="#374151").grid(
        row=7, column=0, columnspan=4, pady=(20, 2)
    )
    tk.Label(win, text="gegenereerd uit bestaande vogels", fg="#6b7280").grid(
        row=8, column=0, columnspan=4
    )


# ---------------- KNOPPEN ----------------

btn = tk.Frame(root)
btn.pack(pady=6)

ttk.Button(btn, text="Toevoegen", command=toevoegen).pack(side="left", padx=5)
ttk.Button(btn, text="Edit", command=edit).pack(side="left", padx=5)
ttk.Button(btn, text="Wijzigen", command=wijzigen).pack(side="left", padx=5)
ttk.Button(btn, text="Verwijderen", command=verwijderen).pack(side="left", padx=5)

ttk.Button(
    btn,
    text="Stamboom 4 gen - Voorouders / Print / PDF",
    command=lambda: exporteer_stamboom_en_print("voorouders")
).pack(side="left", padx=5)

ttk.Button(
    btn,
    text="Stamboom 4 gen - Nakomelingen / Print / PDF",
    command=lambda: exporteer_stamboom_en_print("nakomelingen")
).pack(side="left", padx=5)

ttk.Button(btn, text="👫 Koppels beheren (edit)", command=koppels_beheer).pack(side="left", padx=5)

ttk.Button(root, text="⚙ Beheer dropdowns", command=beheer_lijsten).pack(pady=6)

# ---------------- START ----------------

refresh_dropdowns()
refresh()
root.mainloop()