/**
 * FMS vehicle / truck / trailer field definitions and form helpers
 */
(function () {
    const TRUCK_FIELD_SECTIONS = [
        {
            id: 'identity', label: 'Identity & Registration', fields: [
                { key: 'owner', label: 'Owner', type: 'text' },
                { key: 'fleetNo', label: 'Fleet No', type: 'text' },
                { key: 'registrationNo', label: 'Registration No', type: 'text', required: true, mapsTo: 'plate' },
                { key: 'oldRegistrationNo', label: 'Old Registration No.', type: 'text' },
                { key: 'vehicleMake', label: 'Vehicle Make', type: 'text', mapsTo: 'make' },
                { key: 'vehicleType', label: 'Type', type: 'text' },
                { key: 'vehicleModel', label: 'Vehicle Model', type: 'text', mapsTo: 'model' },
                { key: 'colour', label: 'Colour', type: 'text' },
                { key: 'mfdYear', label: 'Mfd Year', type: 'number' },
                { key: 'active', label: 'Active', type: 'checkbox' },
                { key: 'regDate', label: 'Reg Date', type: 'date' },
                { key: 'compVeh', label: 'Comp. Veh', type: 'checkbox' }
            ]
        },
        {
            id: 'trailers', label: 'Default Trailers', fields: [
                { key: 'defaultTrailer', label: 'Default Trailer', type: 'trailer-select' },
                { key: 'defaultSecondTrailer', label: 'Default Second Trailer', type: 'trailer-select' },
                { key: 'trailerPosition', label: 'Trailer Position', type: 'select', options: ['First', 'Second', 'Both'] }
            ]
        },
        {
            id: 'driver', label: 'Driver & Staff', fields: [
                { key: 'driverName', label: 'Driver Name', type: 'driver-select' },
                { key: 'defaultDriver', label: 'Default Driver', type: 'driver-select' },
                { key: 'staffName', label: 'Staff Name', type: 'text' },
                { key: 'username', label: 'Username', type: 'text' }
            ]
        },
        {
            id: 'body', label: 'Body & Capacity', fields: [
                { key: 'typeOfBody', label: 'Type of Body', type: 'text' },
                { key: 'tareWeight', label: 'Tare Weight', type: 'number', step: '0.01' },
                { key: 'loadingCapacity', label: 'Loading Capacity', type: 'number', step: '0.01', mapsTo: 'capacityMt' },
                { key: 'capacity', label: 'Capacity', type: 'text' },
                { key: 'sidedTrailer', label: 'Sided Trailer', type: 'text' },
                { key: 'heightCm', label: 'Height (CM)', type: 'number', step: '0.01' },
                { key: 'trailerLengthM', label: 'Trailer Length (M)', type: 'number', step: '0.01' }
            ]
        },
        {
            id: 'engine', label: 'Chassis & Engine', fields: [
                { key: 'chassisNo', label: 'Chassis No.', type: 'text' },
                { key: 'engineNo', label: 'Engine No.', type: 'text' },
                { key: 'newEngineNo', label: 'New Engine No', type: 'text' },
                { key: 'engineMake', label: 'Engine Make', type: 'text' },
                { key: 'engineType', label: 'Engine Type', type: 'text' },
                { key: 'ecmNo', label: 'ECM No.', type: 'text' },
                { key: 'cpl', label: 'CPL', type: 'text' },
                { key: 'horsePower', label: 'Horse Power', type: 'text' },
                { key: 'injectorNo', label: 'Injector No.', type: 'text' }
            ]
        },
        {
            id: 'mechanical', label: 'Mechanical Components', fields: [
                { key: 'compressorType', label: 'Compressor Type', type: 'text' },
                { key: 'fanHubType', label: 'Fan Hub Type', type: 'text' },
                { key: 'airFilter', label: 'Air Filter', type: 'text' },
                { key: 'fuelFilter', label: 'Fuel Filter', type: 'text' },
                { key: 'waterFilter', label: 'Water Filter', type: 'text' },
                { key: 'lubricantFilter', label: 'Lubricant Filt.', type: 'text' },
                { key: 'steeringBoxType', label: 'Steering Box Type', type: 'text' },
                { key: 'steeringPosition', label: 'Steering Position', type: 'text' },
                { key: 'gearBoxMake', label: 'Gear Box Make', type: 'text' },
                { key: 'gearBoxModel', label: 'Gear Box Model', type: 'text' },
                { key: 'diffMake', label: 'Diff Make', type: 'text' },
                { key: 'diffSpecs', label: 'Diff Specs', type: 'text' }
            ]
        },
        {
            id: 'operations', label: 'Operations & Trips', fields: [
                { key: 'onTheRoad', label: 'On The Road', type: 'checkbox' },
                { key: 'dateOfLastTrip', label: 'Date Of Last Trip', type: 'date' },
                { key: 'noOfTrips', label: 'No. of Trips', type: 'number' },
                { key: 'lastClosedTrip', label: 'Last Closed Trip', type: 'text' },
                { key: 'lastTripClosedDate', label: 'Last Trip Closed Date', type: 'date' },
                { key: 'lastClosedTripEndMeterReading', label: "Last Closed Trip's End Meter Reading", type: 'number', step: '0.01' },
                { key: 'fmsCalculatedOdometerReading', label: 'FMS Calculated Odometer Reading', type: 'number', step: '0.01' },
                { key: 'allocatedForBulkLongProject', label: 'Allocated for Bulk Long Project', type: 'checkbox' }
            ]
        },
        {
            id: 'purchase', label: 'Purchase & Disposal', fields: [
                { key: 'purchDate', label: 'Purch. Date', type: 'date' },
                { key: 'purchasedFrom', label: 'Purchased From', type: 'text' },
                { key: 'price', label: 'Price', type: 'number', step: '0.01' },
                { key: 'sold', label: 'Sold', type: 'checkbox' },
                { key: 'soldDate', label: 'Sold Date', type: 'date' },
                { key: 'soldTo', label: 'Sold To', type: 'text' },
                { key: 'scrapDate', label: 'Scrap Date', type: 'date' },
                { key: 'scrapComment', label: 'Scrap Cmmt', type: 'text' },
                { key: 'datePainted', label: 'Date Painted', type: 'date' }
            ]
        },
        {
            id: 'fuel', label: 'Fuel & GPS', fields: [
                { key: 'gpsId', label: 'GPS Id', type: 'text' },
                { key: 'gprsId', label: 'GPRS Id', type: 'text' },
                { key: 'fuelTank1Tag', label: 'Fuel Tank 1 Tag', type: 'text' },
                { key: 'fuelTank2Tag', label: 'Fuel Tank 2 Tag', type: 'text' },
                { key: 'leftTankLtr', label: 'Left Tank Ltr', type: 'number', step: '0.01' },
                { key: 'rightTankLtr', label: 'Right Tank Ltr', type: 'number', step: '0.01' },
                { key: 'topTankLtr', label: 'Top Tank Ltr', type: 'number', step: '0.01' },
                { key: 'otherTankLtr', label: 'Other Tank Ltr', type: 'number', step: '0.01' },
                { key: 'totalTankCapacityLtr', label: 'Total Tank Capacity Ltr', type: 'number', step: '0.01' },
                { key: 'truckBullBar', label: 'Truck Bull Bar', type: 'text' },
                { key: 'batteryIsolator', label: 'Battery Isolator', type: 'text' }
            ]
        },
        {
            id: 'mis', label: 'MIS & Notes', fields: [
                { key: 'excludeFromMis', label: 'Exclude From MIS', type: 'checkbox' },
                { key: 'excludeFromMisFrom', label: 'Exclude From MIS From', type: 'date' },
                { key: 'excludeFromMisTo', label: 'Exclude From MIS To', type: 'date' },
                { key: 'linkedWithTf', label: 'Linked With TF', type: 'text' },
                { key: 'remarks', label: 'Remarks', type: 'textarea' }
            ]
        }
    ];

    const TRAILER_FIELD_SECTIONS = [
        {
            id: 'identity', label: 'Identity & Registration', fields: [
                { key: 'owner', label: 'Owner', type: 'text' },
                { key: 'fleetNo', label: 'Fleet No', type: 'text' },
                { key: 'registrationNo', label: 'Registration No', type: 'text', required: true, mapsTo: 'plate' },
                { key: 'oldRegistrationNo', label: 'Old Registration No.', type: 'text' },
                { key: 'trailerType', label: 'Type', type: 'select', mapsTo: 'trailerType', options: [
                    { value: 'standard', label: 'Standard Trailer' },
                    { value: 'superlink-front', label: 'Superlink Front' },
                    { value: 'superlink-rear', label: 'Superlink Rear' }
                ]},
                { key: 'active', label: 'Active', type: 'checkbox' },
                { key: 'regDate', label: 'Reg Date', type: 'date' },
                { key: 'colour', label: 'Colour', type: 'text' }
            ]
        },
        {
            id: 'body', label: 'Body & Specs', fields: [
                { key: 'typeOfBody', label: 'Type of Body', type: 'text' },
                { key: 'tareWeight', label: 'Tare Weight', type: 'number', step: '0.01' },
                { key: 'loadingCapacity', label: 'Loading Capacity', type: 'number', step: '0.01', mapsTo: 'capacityMt' },
                { key: 'heightCm', label: 'Height (CM)', type: 'number', step: '0.01', mapsTo: 'sideHeightMt' },
                { key: 'trailerLengthM', label: 'Trailer Length (M)', type: 'number', step: '0.01' },
                { key: 'sidedTrailer', label: 'Sided Trailer', type: 'text' },
                { key: 'twistlocks', label: 'Twistlocks', type: 'text' },
                { key: 'uprightPockets', label: 'Upright Pockets', type: 'text' },
                { key: 'suspensionType', label: 'Suspension Type', type: 'text' },
                { key: 'headboard', label: 'Headboard', type: 'text' },
                { key: 'trailerBellyTank', label: 'Trailer Belly Tank', type: 'text' },
                { key: 'bellyTankCapacity', label: 'Belly Tank Capacity', type: 'number', step: '0.01' }
            ]
        },
        {
            id: 'purchase', label: 'Purchase & Disposal', fields: [
                { key: 'purchDate', label: 'Purch. Date', type: 'date' },
                { key: 'purchasedFrom', label: 'Purchased From', type: 'text' },
                { key: 'price', label: 'Price', type: 'number', step: '0.01' },
                { key: 'sold', label: 'Sold', type: 'checkbox' },
                { key: 'soldDate', label: 'Sold Date', type: 'date' },
                { key: 'soldTo', label: 'Sold To', type: 'text' },
                { key: 'scrapDate', label: 'Scrap Date', type: 'date' },
                { key: 'scrapComment', label: 'Scrap Cmmt', type: 'text' }
            ]
        },
        {
            id: 'mis', label: 'MIS & Notes', fields: [
                { key: 'excludeFromMis', label: 'Exclude From MIS', type: 'checkbox' },
                { key: 'excludeFromMisFrom', label: 'Exclude From MIS From', type: 'date' },
                { key: 'excludeFromMisTo', label: 'Exclude From MIS To', type: 'date' },
                { key: 'linkedWithTf', label: 'Linked With TF', type: 'text' },
                { key: 'remarks', label: 'Remarks', type: 'textarea' }
            ]
        }
    ];

    function fieldId(prefix, key) { return `${prefix}Field_${key}`; }

    function getFieldValue(record, field) {
        const top = field.mapsTo ? record[field.mapsTo] : record[field.key];
        if (top != null && top !== '') return top;
        const d = record.details || {};
        return d[field.key] != null ? d[field.key] : (field.type === 'checkbox' ? false : '');
    }

    function renderFieldInput(prefix, field, record, ctx) {
        const id = fieldId(prefix, field.key);
        const val = getFieldValue(record, field);
        const req = field.required ? ' *' : '';
        if (field.type === 'checkbox') {
            return `<div class="form-group co-filter-check"><label><input type="checkbox" id="${id}"${val ? ' checked' : ''}> ${field.label}</label></div>`;
        }
        if (field.type === 'textarea') {
            return `<div class="form-group"><label>${field.label}${req}</label><textarea class="form-control" id="${id}" rows="2">${val || ''}</textarea></div>`;
        }
        if (field.type === 'select') {
            const opts = (field.options || []).map(o => {
                const v = typeof o === 'string' ? o : o.value;
                const l = typeof o === 'string' ? o : o.label;
                return `<option value="${v}"${String(val) === String(v) ? ' selected' : ''}>${l}</option>`;
            }).join('');
            return `<div class="form-group"><label>${field.label}${req}</label><select class="form-control" id="${id}">${opts}</select></div>`;
        }
        if (field.type === 'trailer-select') {
            const trailers = (ctx?.trailers || []).filter(t => !t.fleetSetId || t.id === val);
            return `<div class="form-group"><label>${field.label}${req}</label><select class="form-control" id="${id}"><option value="">—</option>${trailers.map(t =>
                `<option value="${t.id}"${t.id === val ? ' selected' : ''}>${t.plate || t.registrationNo}</option>`
            ).join('')}</select></div>`;
        }
        if (field.type === 'driver-select') {
            const drivers = ctx?.drivers || [];
            return `<div class="form-group"><label>${field.label}${req}</label><select class="form-control" id="${id}"><option value="">—</option>${drivers.map(d =>
                `<option value="${d.id}"${d.id === val ? ' selected' : ''}>${d.name}</option>`
            ).join('')}</select></div>`;
        }
        const inputType = field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text';
        const step = field.step ? ` step="${field.step}"` : '';
        return `<div class="form-group"><label>${field.label}${req}</label><input class="form-control" id="${id}" type="${inputType}"${step} value="${val != null ? val : ''}"></div>`;
    }

    function renderVehicleForm(prefix, sections, record, ctx) {
        const tabs = sections.map((s, i) =>
            `<button type="button" class="co-form-tab${i === 0 ? ' active' : ''}" data-tab="${s.id}" data-prefix="${prefix}" onclick="setVehicleFormTab('${prefix}','${s.id}')">${s.label}</button>`
        ).join('');
        const panels = sections.map((s, i) => {
            const fields = s.fields.map(f => renderFieldInput(prefix, f, record, ctx)).join('');
            return `<div class="co-form-panel" data-panel="${s.id}" data-prefix="${prefix}" style="display:${i === 0 ? 'block' : 'none'};"><div class="form-grid-2">${fields}</div></div>`;
        }).join('');
        return `<div class="vehicle-form-tabs co-form-tabs">${tabs}</div>${panels}`;
    }

    window.setVehicleFormTab = function (prefix, tabId) {
        document.querySelectorAll(`.co-form-tab[data-prefix="${prefix}"]`).forEach(b => {
            b.classList.toggle('active', b.dataset.tab === tabId);
        });
        document.querySelectorAll(`.co-form-panel[data-prefix="${prefix}"]`).forEach(p => {
            p.style.display = p.dataset.panel === tabId ? 'block' : 'none';
        });
    };

    function collectVehicleForm(prefix, sections, record) {
        const out = { ...(record || {}), details: { ...(record?.details || {}) } };
        sections.forEach(sec => {
            sec.fields.forEach(field => {
                const el = document.getElementById(fieldId(prefix, field.key));
                if (!el) return;
                let val;
                if (field.type === 'checkbox') val = el.checked;
                else if (field.type === 'number') val = el.value === '' ? null : parseFloat(el.value);
                else val = el.value.trim();
                if (field.mapsTo) out[field.mapsTo] = val;
                else out.details[field.key] = val;
            });
        });
        if (prefix === 'truck') {
            out.plate = (out.plate || out.details.registrationNo || '').toUpperCase();
            out.make = out.make || out.details.vehicleMake || '';
            out.model = out.model || out.details.vehicleModel || '';
        }
        if (prefix === 'trailer') {
            out.plate = (out.plate || out.details.registrationNo || '').toUpperCase();
            if (out.details.trailerType) out.trailerType = out.details.trailerType;
        }
        return out;
    }

    function flattenForDisplay(record, sections) {
        const row = { ...record, ...(record.details || {}) };
        if (record.plate) row.registrationNo = record.plate;
        if (record.make) row.vehicleMake = record.make;
        if (record.model) row.vehicleModel = record.model;
        return row;
    }

    window.FLEET_TRUCK_SECTIONS = TRUCK_FIELD_SECTIONS;
    window.FLEET_TRAILER_SECTIONS = TRAILER_FIELD_SECTIONS;
    window.renderFleetVehicleForm = renderVehicleForm;
    window.collectFleetVehicleForm = collectVehicleForm;
    window.flattenFleetVehicle = flattenForDisplay;
})();
