// main.js — reads editable bus and line tables, runs the chosen solver,
// renders results.

(function () {
  'use strict';

  const busTbody     = document.getElementById('bus-tbody');
  const lineTbody    = document.getElementById('line-tbody');
  const baseMvaInput = document.getElementById('base-mva');
  const methodSelect = document.getElementById('method-select');
  const solveBtn     = document.getElementById('solve-btn');
  const output       = document.getElementById('output');

  // ----------------------------------------------------------------
  // Rendering the editable tables
  // ----------------------------------------------------------------

  function busRow(bus) {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td><input type="number" class="cell" data-field="id" value="' + bus.id + '" step="1" min="1"/></td>' +
      '<td>' +
        '<select class="cell" data-field="type">' +
          '<option value="Slack"' + (bus.type === 'Slack' ? ' selected' : '') + '>Slack</option>' +
          '<option value="PV"'    + (bus.type === 'PV'    ? ' selected' : '') + '>PV</option>' +
          '<option value="PQ"'    + (bus.type === 'PQ'    ? ' selected' : '') + '>PQ</option>' +
        '</select>' +
      '</td>' +
      '<td><input type="number" class="cell" data-field="V" value="' + bus.V + '" step="0.001" min="0"/></td>' +
      '<td><input type="number" class="cell" data-field="delta" value="' + (bus.delta || 0) + '" step="0.1"/></td>' +
      '<td><input type="number" class="cell" data-field="Pgen" value="' + (bus.Pgen || 0) + '" step="0.01"/></td>' +
      '<td><input type="number" class="cell" data-field="Qgen" value="' + (bus.Qgen || 0) + '" step="0.01"/></td>' +
      '<td><input type="number" class="cell" data-field="Pload" value="' + (bus.Pload || 0) + '" step="0.01"/></td>' +
      '<td><input type="number" class="cell" data-field="Qload" value="' + (bus.Qload || 0) + '" step="0.01"/></td>';
    return tr;
  }

  function lineRow(line) {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td><input type="number" class="cell" data-field="from" value="' + line.from + '" step="1" min="1"/></td>' +
      '<td><input type="number" class="cell" data-field="to"   value="' + line.to   + '" step="1" min="1"/></td>' +
      '<td><input type="number" class="cell" data-field="R"    value="' + line.R    + '" step="0.0001"/></td>' +
      '<td><input type="number" class="cell" data-field="X"    value="' + line.X    + '" step="0.0001"/></td>' +
      '<td><input type="number" class="cell" data-field="B"    value="' + line.B    + '" step="0.0001"/></td>';
    return tr;
  }

  function populateTables(system) {
    busTbody.innerHTML = '';
    for (const b of system.buses) busTbody.appendChild(busRow(b));

    lineTbody.innerHTML = '';
    for (const l of system.lines) lineTbody.appendChild(lineRow(l));

    baseMvaInput.value = system.baseMVA;
  }

  // ----------------------------------------------------------------
  // Reading the tables back
  // ----------------------------------------------------------------

  function readNumber(input, label) {
    const v = parseFloat(input.value);
    if (!isFinite(v)) {
      throw new Error('Invalid number in ' + label + ': "' + input.value + '"');
    }
    return v;
  }

  function readTables() {
    const buses = [];
    const seenIds = new Set();
    const rowsB = busTbody.querySelectorAll('tr');
    for (const row of rowsB) {
      const get = (field) => row.querySelector('[data-field="' + field + '"]');
      const typeInput = get('type');
      const bus = {
        id:    readNumber(get('id'),    'bus id'),
        type:  typeInput.value,
        V:     readNumber(get('V'),     'bus V'),
        delta: readNumber(get('delta'), 'bus θ'),
        Pgen:  readNumber(get('Pgen'),  'bus Pgen'),
        Qgen:  readNumber(get('Qgen'),  'bus Qgen'),
        Pload: readNumber(get('Pload'), 'bus Pload'),
        Qload: readNumber(get('Qload'), 'bus Qload'),
      };
      if (seenIds.has(bus.id)) {
        throw new Error('Duplicate bus id: ' + bus.id);
      }
      seenIds.add(bus.id);
      buses.push(bus);
    }

    const lines = [];
    const rowsL = lineTbody.querySelectorAll('tr');
    for (const row of rowsL) {
      const get = (field) => row.querySelector('[data-field="' + field + '"]');
      const line = {
        from: readNumber(get('from'), 'line from'),
        to:   readNumber(get('to'),   'line to'),
        R:    readNumber(get('R'),    'line R'),
        X:    readNumber(get('X'),    'line X'),
        B:    readNumber(get('B'),    'line B'),
      };
      lines.push(line);
    }

    // Basic validation
    if (buses.length === 0) throw new Error('No buses defined.');
    if (lines.length === 0) throw new Error('No lines defined.');

    let slackCount = 0;
    for (const b of buses) {
      if (b.type === 'Slack') slackCount++;
    }
    if (slackCount !== 1) {
      throw new Error('Exactly one slack bus is required (found ' + slackCount + ').');
    }

    const idSet = new Set(buses.map(b => b.id));
    for (const l of lines) {
      if (!idSet.has(l.from)) throw new Error('Line references unknown bus ' + l.from + '.');
      if (!idSet.has(l.to))   throw new Error('Line references unknown bus ' + l.to   + '.');
    }

    return {
      name:    'User input',
      baseMVA: parseFloat(baseMvaInput.value) || 100,
      baseKV:  1,
      tol:     1e-9,
      maxIter: 30,
      buses,
      lines,
    };
  }

  // ----------------------------------------------------------------
  // Rendering the results
  // ----------------------------------------------------------------

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function formatNum(x, digits) {
    if (!isFinite(x)) return '—';
    return x.toFixed(digits);
  }

  function renderResult(methodLabel, result) {
    if (!result.converged) {
      output.innerHTML =
        '<p class="error">Solver did not converge after ' +
        result.iterations + ' iterations.</p>';
      return;
    }

    let html = '';
    html += '<h2>Results — ' + escapeHtml(methodLabel) + '</h2>';
    html += '<p>Converged in <strong>' + result.iterations +
            '</strong> iterations.</p>';

    html += '<table class="results-table">';
    html += '<thead><tr>';
    html += '<th>Bus</th><th>Type</th><th>V (p.u.)</th>';
    html += '<th>Angle (°)</th><th>P gen (p.u.)</th><th>Q gen (p.u.)</th>';
    html += '<th>P load (p.u.)</th><th>Q load (p.u.)</th>';
    html += '</tr></thead><tbody>';

    for (const b of result.busResults) {
      html += '<tr>';
      html += '<td>' + b.id + '</td>';
      html += '<td>' + escapeHtml(b.type) + '</td>';
      html += '<td>' + formatNum(b.V, 6) + '</td>';
      html += '<td>' + formatNum(b.delta_deg, 5) + '</td>';
      html += '<td>' + formatNum(b.Pgen, 4) + '</td>';
      html += '<td>' + formatNum(b.Qgen, 4) + '</td>';
      html += '<td>' + formatNum(b.Pload, 4) + '</td>';
      html += '<td>' + formatNum(b.Qload, 4) + '</td>';
      html += '</tr>';
    }

    html += '</tbody></table>';
    output.innerHTML = html;
  }

  // ----------------------------------------------------------------
  // Solve
  // ----------------------------------------------------------------

  function onSolve() {
    output.innerHTML = '<p class="hint">Solving…</p>';

    let system;
    try {
      system = readTables();
    } catch (e) {
      output.innerHTML = '<p class="error">Input error: ' +
                         escapeHtml(e.message) + '</p>';
      return;
    }

    const method = methodSelect.value;
    let result;
    try {
      if (method === 'newton') {
        system.maxIter = 30;
        result = window.solveNewton(system);
      } else {
        system.maxIter = 2000;
        result = window.solveGaussSeidel(system);
      }
    } catch (e) {
      output.innerHTML = '<p class="error">Solver threw: ' +
                         escapeHtml(e.message) + '</p>';
      return;
    }

    const methodLabel = method === 'newton' ? 'Newton–Raphson' : 'Gauss–Seidel';
    renderResult(methodLabel, result);
  }

  // ----------------------------------------------------------------
  // Initial load
  // ----------------------------------------------------------------

  // For now, prefill with the 4-bus example. The example-loader
  // dropdown comes in a later step.
  populateTables(window.SYSTEMS['4bus']);

  solveBtn.addEventListener('click', onSolve);
})();