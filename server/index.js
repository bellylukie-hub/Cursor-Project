const express = require("express");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cors = require("cors");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3001;
const secret = process.env.JWT_SECRET || "replace-this-development-secret";
const root = path.join(__dirname, "..");
fs.mkdirSync(path.join(root, "data"), { recursive: true });
fs.mkdirSync(path.join(root, "uploads"), { recursive: true });
const db = new Database(path.join(root, "data", "operations.db"));
const upload = multer({ dest: path.join(root, "uploads") });

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(root, "uploads")));

db.pragma("foreign_keys = ON");
db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'operator', area TEXT, active INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS trips (id INTEGER PRIMARY KEY, trip_number TEXT NOT NULL, truck_number TEXT NOT NULL, direction TEXT NOT NULL CHECK(direction IN ('NB','SB')), owner TEXT, driver_name TEXT, driver_phone TEXT, loading_point TEXT, offloading_point TEXT, entry_border TEXT, exit_border TEXT, area TEXT DEFAULT 'Unassigned', responsible_user_id INTEGER, current_status TEXT DEFAULT 'Awaiting action', started_at TEXT DEFAULT CURRENT_TIMESTAMP, completed_at TEXT, pod_completed_at TEXT, exit_zambia_at TEXT, deleted_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(trip_number, truck_number, direction));
CREATE TABLE IF NOT EXISTS status_events (id INTEGER PRIMARY KEY, trip_id INTEGER NOT NULL, status TEXT NOT NULL, event_at TEXT NOT NULL, problem TEXT, person_contacted TEXT, action_taken TEXT, expected_at TEXT, notes TEXT, created_by INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(trip_id) REFERENCES trips(id));
CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY, trip_id INTEGER, document_type TEXT NOT NULL, filename TEXT NOT NULL, original_filename TEXT, uploaded_by INTEGER, expiry_date TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(trip_id) REFERENCES trips(id));
CREATE TABLE IF NOT EXISTS areas (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, direction TEXT DEFAULT 'Both', aliases TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS kpi_targets (id INTEGER PRIMARY KEY, process TEXT UNIQUE NOT NULL, target_hours INTEGER NOT NULL, orange_percent INTEGER DEFAULT 80);
CREATE TABLE IF NOT EXISTS assets (id INTEGER PRIMARY KEY, asset_type TEXT NOT NULL, identifier TEXT NOT NULL, serial_number TEXT, assigned_to TEXT, return_date TEXT, next_maintenance TEXT, notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS runner_fees (id INTEGER PRIMARY KEY, owner TEXT, truck_number TEXT, border_name TEXT, direction TEXT, zam_arrival TEXT, drc_exit TEXT, duration_hours REAL, rate REAL, amount REAL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY, user_id INTEGER, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id INTEGER, detail TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
`);

const count = db.prepare("SELECT COUNT(*) count FROM users").get().count;
if (!count) {
  db.prepare("INSERT INTO users(name,email,password_hash,role,area) VALUES(?,?,?,?,?)").run("System Administrator", "admin@turnaround.local", bcrypt.hashSync("ChangeMe123!", 10), "admin", "All");
  ["Kasumbalesa", "Sakania", "Mokambo", "Kanyaka", "Lubumbashi / Kipushi", "Likasi / Tenke", "Kambove / Kisanfu", "Kolwezi"].forEach(name => db.prepare("INSERT OR IGNORE INTO areas(name) VALUES(?)").run(name));
  [["NB turnaround", 336], ["SB loading", 48], ["Dispatch / escort", 192], ["POD collection", 48], ["Border TR8/T1", 48], ["Border IM4", 72]].forEach(([process, target_hours]) => db.prepare("INSERT OR IGNORE INTO kpi_targets(process,target_hours) VALUES(?,?)").run(process, target_hours));
}

function audit(req, action, entity, id, detail = "") {
  db.prepare("INSERT INTO audit_logs(user_id,action,entity_type,entity_id,detail) VALUES(?,?,?,?,?)").run(req.user?.id || null, action, entity, id || null, detail);
}
function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  try { req.user = jwt.verify(token, secret); next(); } catch { res.status(401).json({ error: "Please sign in to continue." }); }
}
function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Administrator permission is required." });
  next();
}
function durationInfo(trip) {
  const hours = (Date.now() - new Date(trip.started_at).getTime()) / 36e5;
  const kpi = trip.direction === "NB" ? 336 : 48;
  return { hours: Math.round(hours), kpiHours: kpi, level: hours >= kpi ? "red" : hours >= kpi * .8 ? "orange" : "green" };
}
function serializeTrip(trip) { return { ...trip, ...durationInfo(trip) }; }

app.post("/api/auth/login", (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE email=? AND active=1").get(req.body.email?.toLowerCase());
  if (!user || !bcrypt.compareSync(req.body.password || "", user.password_hash)) return res.status(401).json({ error: "Incorrect email or password." });
  const token = jwt.sign({ id: user.id, name: user.name, role: user.role, area: user.area }, secret, { expiresIn: "12h" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, area: user.area } });
});
app.get("/api/auth/me", auth, (req, res) => res.json({ user: req.user }));

app.get("/api/dashboard", auth, (req, res) => {
  const trips = db.prepare("SELECT * FROM trips WHERE deleted_at IS NULL AND completed_at IS NULL").all().map(serializeTrip);
  const byLevel = level => trips.filter(t => t.level === level).length;
  const perArea = db.prepare("SELECT area, direction, COUNT(*) count FROM trips WHERE deleted_at IS NULL AND completed_at IS NULL GROUP BY area,direction").all();
  const alerts = trips.filter(t => t.level !== "green").sort((a,b) => b.hours-a.hours).slice(0, 8);
  res.json({ total: trips.length, nb: trips.filter(t => t.direction === "NB").length, sb: trips.filter(t => t.direction === "SB").length, green: byLevel("green"), orange: byLevel("orange"), red: byLevel("red"), perArea, alerts });
});
app.get("/api/trips", auth, (req, res) => {
  let sql = "SELECT * FROM trips WHERE deleted_at IS NULL";
  const args = [];
  if (req.query.live === "true") sql += " AND completed_at IS NULL";
  if (req.query.direction) { sql += " AND direction=?"; args.push(req.query.direction); }
  if (req.query.area) { sql += " AND area=?"; args.push(req.query.area); }
  if (req.query.q) { sql += " AND (trip_number LIKE ? OR truck_number LIKE ? OR owner LIKE ? OR driver_name LIKE ?)"; args.push(...Array(4).fill(`%${req.query.q}%`)); }
  res.json(db.prepare(sql + " ORDER BY started_at DESC").all(...args).map(serializeTrip));
});
app.post("/api/trips", auth, (req, res) => {
  const v = req.body;
  if (!v.trip_number || !v.truck_number || !["NB","SB"].includes(v.direction)) return res.status(400).json({ error: "Trip number, truck number, and direction are required." });
  try {
    const area = v.area || "Unassigned";
    const r = db.prepare(`INSERT INTO trips(trip_number,truck_number,direction,owner,driver_name,driver_phone,loading_point,offloading_point,entry_border,exit_border,area,responsible_user_id,started_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(v.trip_number, v.truck_number, v.direction, v.owner || "", v.driver_name || "", v.driver_phone || "", v.loading_point || "", v.offloading_point || "", v.entry_border || "", v.exit_border || "", area, req.user.id, v.started_at || new Date().toISOString());
    audit(req, "CREATE", "trip", r.lastInsertRowid, `${v.direction} trip created`);
    res.status(201).json(serializeTrip(db.prepare("SELECT * FROM trips WHERE id=?").get(r.lastInsertRowid)));
  } catch (e) { res.status(409).json({ error: "An active record with this Trip + Truck + direction already exists." }); }
});
app.get("/api/trips/:id", auth, (req, res) => {
  const trip = db.prepare("SELECT * FROM trips WHERE id=? AND deleted_at IS NULL").get(req.params.id);
  if (!trip) return res.status(404).json({ error: "Trip not found." });
  res.json({ trip: serializeTrip(trip), timeline: db.prepare("SELECT s.*,u.name entered_by_name FROM status_events s LEFT JOIN users u ON u.id=s.created_by WHERE trip_id=? ORDER BY event_at DESC").all(trip.id), documents: db.prepare("SELECT * FROM documents WHERE trip_id=? ORDER BY created_at DESC").all(trip.id) });
});
app.post("/api/trips/:id/statuses", auth, (req, res) => {
  const trip = db.prepare("SELECT * FROM trips WHERE id=? AND deleted_at IS NULL").get(req.params.id);
  if (!trip || !req.body.status) return res.status(400).json({ error: "A valid trip and status are required." });
  const v = req.body, at = v.event_at || new Date().toISOString();
  db.prepare("INSERT INTO status_events(trip_id,status,event_at,problem,person_contacted,action_taken,expected_at,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?)").run(trip.id,v.status,at,v.problem||"",v.person_contacted||"",v.action_taken||"",v.expected_at||"",v.notes||"",req.user.id);
  const fields = [v.status === "POD sent to invoice team" ? "pod_completed_at=?" : null, v.status === "Exited to Zambia" ? "exit_zambia_at=?" : null].filter(Boolean);
  const complete = (trip.direction === "NB" && v.status === "POD sent to invoice team") || (trip.direction === "SB" && v.status === "Exited to Zambia");
  db.prepare(`UPDATE trips SET current_status=?, ${fields.join(",")}${complete ? ", completed_at=?" : ""} WHERE id=?`).run(v.status, ...fields.map(() => at), ...(complete ? [at] : []), trip.id);
  audit(req, "STATUS_UPDATE", "trip", trip.id, v.status);
  res.json({ ok: true });
});
app.post("/api/trips/:id/documents", auth, upload.single("file"), (req, res) => {
  if (!req.file || !req.body.document_type) return res.status(400).json({ error: "Document type and file are required." });
  const r = db.prepare("INSERT INTO documents(trip_id,document_type,filename,original_filename,uploaded_by,expiry_date) VALUES(?,?,?,?,?,?)").run(req.params.id,req.body.document_type,req.file.filename,req.file.originalname,req.user.id,req.body.expiry_date || null);
  audit(req, "UPLOAD", "document", r.lastInsertRowid, req.body.document_type);
  res.status(201).json({ id:r.lastInsertRowid, file:`/uploads/${req.file.filename}` });
});
app.post("/api/imports/trips", auth, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Excel file required." });
  const rows = XLSX.utils.sheet_to_json(XLSX.readFile(req.file.path).Sheets[XLSX.readFile(req.file.path).SheetNames[0]], { defval:"" });
  let created=0; const errors=[];
  const insert = db.prepare("INSERT INTO trips(trip_number,truck_number,direction,owner,driver_name,loading_point,offloading_point,entry_border,exit_border,area,responsible_user_id,started_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)");
  const transaction = db.transaction(() => rows.forEach((row, index) => {
    try { if (!row.Trip || !row.Truck || !["NB","SB"].includes(String(row.Direction).toUpperCase())) throw new Error("Trip, Truck and Direction (NB/SB) are required"); insert.run(row.Trip,row.Truck,String(row.Direction).toUpperCase(),row.Owner,row.Driver,row["Loading Point"],row["Offloading Point"],row["Entry Border"],row["Exit Border"],row.Area || "Unassigned",req.user.id,new Date().toISOString()); created++; } catch(e) { errors.push({ row:index+2,error:e.message.includes("UNIQUE") ? "Duplicate Trip + Truck + Direction" : e.message }); }
  }));
  transaction(); audit(req,"IMPORT","trips",null,`${created} rows imported`); res.json({ created, errors, total:rows.length });
});
app.get("/api/areas", auth, (req,res) => res.json(db.prepare("SELECT * FROM areas ORDER BY name").all()));
app.get("/api/assets", auth, (req,res) => res.json(db.prepare("SELECT * FROM assets ORDER BY created_at DESC").all()));
app.post("/api/assets", auth, (req,res) => { const v=req.body; if(!v.asset_type || !v.identifier) return res.status(400).json({error:"Asset type and identifier are required."}); const r=db.prepare("INSERT INTO assets(asset_type,identifier,serial_number,assigned_to,return_date,next_maintenance,notes) VALUES(?,?,?,?,?,?,?)").run(v.asset_type,v.identifier,v.serial_number||"",v.assigned_to||"",v.return_date||null,v.next_maintenance||null,v.notes||""); audit(req,"CREATE","asset",r.lastInsertRowid); res.status(201).json({id:r.lastInsertRowid}); });
app.post("/api/runner-fees", auth, (req,res) => { const v=req.body, h=(new Date(v.drc_exit)-new Date(v.zam_arrival))/36e5; let rate=0; if(v.border_name==="Kanyaka") rate=h<=24?5:0; else rate=h<=48?40:h<=96?25:15; const r=db.prepare("INSERT INTO runner_fees(owner,truck_number,border_name,direction,zam_arrival,drc_exit,duration_hours,rate,amount) VALUES(?,?,?,?,?,?,?,?,?)").run(v.owner||"",v.truck_number||"",v.border_name,v.direction,v.zam_arrival,v.drc_exit,h,rate,rate); audit(req,"CREATE","runner_fee",r.lastInsertRowid); res.status(201).json({id:r.lastInsertRowid,duration_hours:h,rate,amount:rate}); });
app.get("/api/reports/turnaround", auth, (req,res) => { const trips=db.prepare("SELECT * FROM trips WHERE deleted_at IS NULL ORDER BY started_at DESC").all().map(serializeTrip); res.json({trips, summary:{total:trips.length,nb:trips.filter(x=>x.direction==="NB").length,sb:trips.filter(x=>x.direction==="SB").length,completed:trips.filter(x=>x.completed_at).length}}); });
app.get("/api/reports/turnaround.xlsx", auth, (req,res) => { const rows=db.prepare("SELECT trip_number AS Trip,truck_number AS Truck,direction AS Direction,owner AS Owner,driver_name AS Driver,area AS Area,current_status AS Status,started_at AS Started,completed_at AS Completed FROM trips WHERE deleted_at IS NULL").all(); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),"Turnaround"); const f=path.join(root,"uploads",`turnaround-${Date.now()}.xlsx`); XLSX.writeFile(wb,f); res.download(f,"turnaround-report.xlsx"); });
app.get("/api/admin/users", auth, requireAdmin, (req,res) => res.json(db.prepare("SELECT id,name,email,role,area,active,created_at FROM users ORDER BY name").all()));
app.post("/api/admin/users", auth, requireAdmin, (req,res) => { const v=req.body; if(!v.name||!v.email||!v.password) return res.status(400).json({error:"Name, email and password are required."}); try { const r=db.prepare("INSERT INTO users(name,email,password_hash,role,area) VALUES(?,?,?,?,?)").run(v.name,v.email.toLowerCase(),bcrypt.hashSync(v.password,10),v.role||"operator",v.area||""); audit(req,"CREATE","user",r.lastInsertRowid); res.status(201).json({id:r.lastInsertRowid}); } catch {res.status(409).json({error:"Email already exists."});} });
app.listen(port, () => console.log(`Operations API running at http://localhost:${port}`));
