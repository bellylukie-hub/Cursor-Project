const db = require('../db/database');

const SEED_COUNTRIES = [
  { code: 'ZA', name: 'South Africa' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'CD', name: 'DRC' },
  { code: 'TZ', name: 'Tanzania' }
];

const SEED_STATIONS = [
  { id: 'durban', name: 'Durban', countryCode: 'ZA', loading: ['Durban Port', 'Clayville'], offloading: [] },
  { id: 'johannesburg', name: 'Johannesburg', countryCode: 'ZA', loading: ['City Deep', 'Johannesburg Depot'], offloading: [] },
  { id: 'ndola', name: 'Ndola', countryCode: 'ZM', loading: ['Ndola Depot'], offloading: ['Ndola Mine'] },
  { id: 'lusaka', name: 'Lusaka', countryCode: 'ZM', loading: ['Lusaka Hub'], offloading: ['Lusaka Depot'] },
  { id: 'kasumbalesa', name: 'Kasumbalesa', countryCode: 'CD', loading: ['Kasumbalesa Border'], offloading: ['Kasumbalesa Yard'] },
  { id: 'lubumbashi', name: 'Lubumbashi', countryCode: 'CD', loading: ['Lubumbashi Depot', 'Kamoto'], offloading: ['Lubumbashi Mine'] },
  { id: 'kolwezi', name: 'Kolwezi', countryCode: 'CD', loading: ['Kolwezi Hub'], offloading: ['Kolwezi Mine', 'Mutanda'] },
  { id: 'likasi', name: 'Likasi', countryCode: 'CD', loading: [], offloading: ['Likasi Depot', 'Likasi Plant'] },
  { id: 'dar', name: 'Dar es Salaam', countryCode: 'TZ', loading: ['Dar Port', 'Dar Depot'], offloading: [] },
  { id: 'kanyaka', name: 'Kanyaka', countryCode: 'CD', loading: ['Kanyaka Mine'], offloading: ['Kanyaka Depot'] },
  { id: 'beira', name: 'Beira', countryCode: 'MZ', loading: ['Beira Access World', 'Beira Port'], offloading: [] }
];

const SEED_INTERNATIONAL = {
  'ZA-CD': { entryBorder: 'Kasumbalesa', viaBorder1: '', viaBorder2: '', portOfEntry: 'Durban Port', exitBorder: '' },
  'TZ-CD': { entryBorder: 'Kasumbalesa', viaBorder1: 'Sakania', viaBorder2: '', portOfEntry: 'Dar Port', exitBorder: '' },
  'ZM-CD': { entryBorder: 'Kasumbalesa', viaBorder1: '', viaBorder2: '', portOfEntry: '', exitBorder: '' },
  'CD-ZA': { entryBorder: '', viaBorder1: '', viaBorder2: '', portOfEntry: '', exitBorder: 'Kasumbalesa' },
  'CD-ZM': { entryBorder: '', viaBorder1: '', viaBorder2: '', portOfEntry: '', exitBorder: 'Kasumbalesa' },
  'CD-TZ': { entryBorder: '', viaBorder1: 'Sakania', viaBorder2: '', portOfEntry: '', exitBorder: 'Kasumbalesa' },
  'MZ-CD': { entryBorder: 'Kasumbalesa', viaBorder1: 'Forbes/Machipanda', viaBorder2: 'Chirundu', portOfEntry: '', exitBorder: 'Forbes/Machipanda' }
};

function rowToCountry(r) {
  return { code: r.code, name: r.name };
}

function rowToStation(r, loadingPoints, offloadingPoints) {
  return {
    id: r.id, name: r.name, countryCode: r.country_code, countryName: r.country_name,
    status: r.status, loadingPoints: loadingPoints || [], offloadingPoints: offloadingPoints || []
  };
}

function rowToRouteTemplate(r) {
  return {
    id: r.id, name: r.name,
    originStationId: r.origin_station_id, destinationStationId: r.destination_station_id,
    originStation: r.origin_station, destinationStation: r.destination_station,
    originCountry: r.origin_country, destinationCountry: r.destination_country,
    routeType: r.route_type,
    entryBorder: r.entry_border, viaBorder1: r.via_border_1, viaBorder2: r.via_border_2,
    portOfEntry: r.port_of_entry, exitBorder: r.exit_border,
    defaultLoadingPoint: r.default_loading_point, defaultOffloadingPoint: r.default_offloading_point,
    status: r.status
  };
}

function getLoadingPoints(stationId) {
  return db.prepare('SELECT name FROM route_loading_points WHERE station_id = ? ORDER BY name').all(stationId).map(r => r.name);
}

function getOffloadingPoints(stationId) {
  return db.prepare('SELECT name FROM route_offloading_points WHERE station_id = ? ORDER BY name').all(stationId).map(r => r.name);
}

function listCountries() {
  return db.prepare('SELECT * FROM route_countries ORDER BY name').all().map(rowToCountry);
}

function listStations(countryCode) {
  const sql = countryCode
    ? `SELECT s.*, c.name AS country_name FROM route_stations s JOIN route_countries c ON c.code = s.country_code WHERE s.country_code = ? AND s.status = 'active' ORDER BY s.name`
    : `SELECT s.*, c.name AS country_name FROM route_stations s JOIN route_countries c ON c.code = s.country_code WHERE s.status = 'active' ORDER BY c.name, s.name`;
  const rows = countryCode ? db.prepare(sql).all(countryCode) : db.prepare(sql).all();
  return rows.map(r => rowToStation(r, getLoadingPoints(r.id), getOffloadingPoints(r.id)));
}

function listRouteTemplates() {
  return db.prepare(`
    SELECT t.*, os.name AS origin_station, ds.name AS destination_station
    FROM route_templates t
    LEFT JOIN route_stations os ON os.id = t.origin_station_id
    LEFT JOIN route_stations ds ON ds.id = t.destination_station_id
    ORDER BY t.name
  `).all().map(rowToRouteTemplate);
}

function resolveRoute(originStationId, destStationId) {
  const origin = db.prepare(`
    SELECT s.*, c.name AS country_name FROM route_stations s
    JOIN route_countries c ON c.code = s.country_code WHERE s.id = ?
  `).get(originStationId);
  const dest = db.prepare(`
    SELECT s.*, c.name AS country_name FROM route_stations s
    JOIN route_countries c ON c.code = s.country_code WHERE s.id = ?
  `).get(destStationId);
  if (!origin || !dest) return { routeType: 'domestic', showBorders: false };

  const loadingPoints = getLoadingPoints(origin.id);
  const offloadingPoints = getOffloadingPoints(dest.id);
  const base = {
    origin: origin.name, destination: dest.name,
    originCountry: origin.country_code, destinationCountry: dest.country_code,
    originCountryName: origin.country_name, destinationCountryName: dest.country_name,
    loadingPoints, offloadingPoints,
    loadingPoint: loadingPoints[0] || origin.name,
    offloadingPoint: offloadingPoints[0] || dest.name
  };

  if (origin.country_code === dest.country_code) {
    return { ...base, routeType: 'domestic', showBorders: false,
      entryBorder: '', viaBorder1: '', viaBorder2: '', portOfEntry: '', exitBorder: '' };
  }

  const template = db.prepare(`
    SELECT * FROM route_templates
    WHERE origin_station_id = ? AND destination_station_id = ? AND status = 'active' LIMIT 1
  `).get(originStationId, destStationId);

  if (template) {
    return {
      ...base, routeType: 'international', showBorders: true,
      entryBorder: template.entry_border || '', viaBorder1: template.via_border_1 || '',
      viaBorder2: template.via_border_2 || '', portOfEntry: template.port_of_entry || '',
      exitBorder: template.exit_border || '',
      loadingPoint: template.default_loading_point || base.loadingPoint,
      offloadingPoint: template.default_offloading_point || base.offloadingPoint,
      routeTemplateId: template.id, routeTemplateName: template.name
    };
  }

  const intl = SEED_INTERNATIONAL[`${origin.country_code}-${dest.country_code}`] || {
    entryBorder: 'Kasumbalesa', viaBorder1: '', viaBorder2: '',
    portOfEntry: loadingPoints[0] || '', exitBorder: 'Kasumbalesa'
  };
  return { ...base, ...intl, routeType: 'international', showBorders: true };
}

function upsertStation(body) {
  const id = body.id || `ST-${Date.now()}`;
  db.prepare(`
    INSERT INTO route_stations (id, name, country_code, status)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, country_code = excluded.country_code, status = excluded.status
  `).run(id, body.name, body.countryCode, body.status || 'active');

  if (body.loadingPoints) {
    db.prepare('DELETE FROM route_loading_points WHERE station_id = ?').run(id);
    const ins = db.prepare('INSERT INTO route_loading_points (id, station_id, name) VALUES (?, ?, ?)');
    body.loadingPoints.forEach((name, i) => ins.run(`${id}-lp-${i}`, id, name));
  }
  if (body.offloadingPoints) {
    db.prepare('DELETE FROM route_offloading_points WHERE station_id = ?').run(id);
    const ins = db.prepare('INSERT INTO route_offloading_points (id, station_id, name) VALUES (?, ?, ?)');
    body.offloadingPoints.forEach((name, i) => ins.run(`${id}-op-${i}`, id, name));
  }
  return listStations().find(s => s.id === id);
}

function upsertRouteTemplate(body) {
  const id = body.id || `RT-${Date.now()}`;
  const origin = db.prepare('SELECT * FROM route_stations WHERE id = ?').get(body.originStationId);
  const dest = db.prepare('SELECT * FROM route_stations WHERE id = ?').get(body.destinationStationId);
  if (!origin || !dest) throw new Error('Origin and destination stations are required');

  const routeType = origin.country_code === dest.country_code ? 'domestic' : 'international';
  const borders = routeType === 'international'
    ? (SEED_INTERNATIONAL[`${origin.country_code}-${dest.country_code}`] || {})
    : {};

  db.prepare(`
    INSERT INTO route_templates (
      id, name, origin_station_id, destination_station_id,
      origin_country, destination_country, route_type,
      entry_border, via_border_1, via_border_2, port_of_entry, exit_border,
      default_loading_point, default_offloading_point, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name, origin_station_id = excluded.origin_station_id,
      destination_station_id = excluded.destination_station_id,
      origin_country = excluded.origin_country, destination_country = excluded.destination_country,
      route_type = excluded.route_type, entry_border = excluded.entry_border,
      via_border_1 = excluded.via_border_1, via_border_2 = excluded.via_border_2,
      port_of_entry = excluded.port_of_entry, exit_border = excluded.exit_border,
      default_loading_point = excluded.default_loading_point,
      default_offloading_point = excluded.default_offloading_point, status = excluded.status
  `).run(
    id, body.name || `${origin.name} → ${dest.name}`,
    body.originStationId, body.destinationStationId,
    origin.country_code, dest.country_code, routeType,
    body.entryBorder || borders.entryBorder || '', body.viaBorder1 || borders.viaBorder1 || '',
    body.viaBorder2 || borders.viaBorder2 || '', body.portOfEntry || borders.portOfEntry || '',
    body.exitBorder || borders.exitBorder || '',
    body.defaultLoadingPoint || '', body.defaultOffloadingPoint || '', body.status || 'active'
  );
  return listRouteTemplates().find(r => r.id === id);
}

function seedRouteCatalog() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM route_countries').get().c;
  if (count > 0) return { seeded: false };

  const insCountry = db.prepare('INSERT INTO route_countries (code, name) VALUES (?, ?)');
  SEED_COUNTRIES.forEach(c => insCountry.run(c.code, c.name));
  insCountry.run('MZ', 'Mozambique');

  const insStation = db.prepare('INSERT INTO route_stations (id, name, country_code, status) VALUES (?, ?, ?, ?)');
  const insLoad = db.prepare('INSERT INTO route_loading_points (id, station_id, name) VALUES (?, ?, ?)');
  const insOff = db.prepare('INSERT INTO route_offloading_points (id, station_id, name) VALUES (?, ?, ?)');

  SEED_STATIONS.forEach(s => {
    insStation.run(s.id, s.name, s.countryCode, 'active');
    (s.loading || []).forEach((n, i) => insLoad.run(`${s.id}-lp-${i}`, s.id, n));
    (s.offloading || []).forEach((n, i) => insOff.run(`${s.id}-op-${i}`, s.id, n));
  });

  Object.entries(SEED_INTERNATIONAL).forEach(([key, borders]) => {
    const [oc, dc] = key.split('-');
    const origins = SEED_STATIONS.filter(s => s.countryCode === oc);
    const dests = SEED_STATIONS.filter(s => s.countryCode === dc);
    if (!origins.length || !dests.length) return;
    const o = origins[0];
    const d = dests.find(x => x.id === 'kolwezi') || dests[0];
    upsertRouteTemplate({
      id: `RT-${oc}-${dc}`, name: `${o.name} → ${d.name} (${oc}→${dc})`,
      originStationId: o.id, destinationStationId: d.id,
      ...borders,
      defaultLoadingPoint: (o.loading || [])[0] || '',
      defaultOffloadingPoint: (d.offloading || [])[0] || ''
    });
  });

  // Domestic routes
  [['lubumbashi', 'kolwezi'], ['ndola', 'lusaka']].forEach(([a, b]) => {
    upsertRouteTemplate({
      id: `RT-dom-${a}-${b}`, name: `${a} → ${b} (domestic)`,
      originStationId: a, destinationStationId: b
    });
  });

  return { seeded: true };
}

function getFullCatalog() {
  seedRouteCatalog();
  return {
    countries: listCountries(),
    stations: listStations(),
    routeTemplates: listRouteTemplates()
  };
}

module.exports = {
  listCountries, listStations, listRouteTemplates, resolveRoute,
  upsertStation, upsertRouteTemplate, seedRouteCatalog, getFullCatalog
};
