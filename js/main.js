// main.js
// Reads editable bus and line tables,
// converts them into PowerSystem V2 objects,
// runs the unified V2 solver,
// and renders the common LoadFlowResult output.

(function () {
  'use strict';

  const busTbody     = document.getElementById('bus-tbody');
  const lineTbody    = document.getElementById('line-tbody');
  const baseMvaInput = document.getElementById('base-mva');
  const methodSelect = document.getElementById('method-select');
  const solveBtn     = document.getElementById('solve-btn');
  const output       = document.getElementById('output');


  // ================================================================
  // Render editable input tables
  // ================================================================

  function busRow(bus) {
    const tr = document.createElement('tr');

    tr.innerHTML =
      '<td>' +
        '<input type="number" class="cell" data-field="id" ' +
        'value="' + bus.id + '" step="1" min="1"/>' +
      '</td>' +

      '<td>' +
        '<select class="cell" data-field="type">' +
          '<option value="Slack"' +
            (bus.type === 'Slack' ? ' selected' : '') +
          '>Slack</option>' +

          '<option value="PV"' +
            (bus.type === 'PV' ? ' selected' : '') +
          '>PV</option>' +

          '<option value="PQ"' +
            (bus.type === 'PQ' ? ' selected' : '') +
          '>PQ</option>' +
        '</select>' +
      '</td>' +

      '<td>' +
        '<input type="number" class="cell" data-field="V" ' +
        'value="' + bus.V + '" step="0.001" min="0"/>' +
      '</td>' +

      '<td>' +
        '<input type="number" class="cell" data-field="delta" ' +
        'value="' + (bus.delta || 0) + '" step="0.1"/>' +
      '</td>' +

      '<td>' +
        '<input type="number" class="cell" data-field="Pgen" ' +
        'value="' + (bus.Pgen || 0) + '" step="0.01"/>' +
      '</td>' +

      '<td>' +
        '<input type="number" class="cell" data-field="Qgen" ' +
        'value="' + (bus.Qgen || 0) + '" step="0.01"/>' +
      '</td>' +

      '<td>' +
        '<input type="number" class="cell" data-field="Pload" ' +
        'value="' + (bus.Pload || 0) + '" step="0.01"/>' +
      '</td>' +

      '<td>' +
        '<input type="number" class="cell" data-field="Qload" ' +
        'value="' + (bus.Qload || 0) + '" step="0.01"/>' +
      '</td>';

    return tr;
  }


  function lineRow(line) {
    const tr = document.createElement('tr');

    tr.innerHTML =
      '<td>' +
        '<input type="number" class="cell" data-field="from" ' +
        'value="' + line.from + '" step="1" min="1"/>' +
      '</td>' +

      '<td>' +
        '<input type="number" class="cell" data-field="to" ' +
        'value="' + line.to + '" step="1" min="1"/>' +
      '</td>' +

      '<td>' +
        '<input type="number" class="cell" data-field="R" ' +
        'value="' + line.R + '" step="0.0001"/>' +
      '</td>' +

      '<td>' +
        '<input type="number" class="cell" data-field="X" ' +
        'value="' + line.X + '" step="0.0001"/>' +
      '</td>' +

      '<td>' +
        '<input type="number" class="cell" data-field="B" ' +
        'value="' + line.B + '" step="0.0001"/>' +
      '</td>';

    return tr;
  }


  function populateTables(system) {
    busTbody.innerHTML = '';

    for (const bus of system.buses) {
      busTbody.appendChild(busRow(bus));
    }


    lineTbody.innerHTML = '';

    for (const line of system.lines) {
      lineTbody.appendChild(lineRow(line));
    }


    baseMvaInput.value = system.baseMVA;
  }



  // ================================================================
  // Input helpers
  // ================================================================

  function readNumber(input, label) {
    const value = parseFloat(input.value);

    if (!Number.isFinite(value)) {
      throw new Error(
        'Invalid number in ' +
        label +
        ': "' +
        input.value +
        '"'
      );
    }

    return value;
  }


  function readBaseMVA() {
    const value = parseFloat(baseMvaInput.value);

    if (!Number.isFinite(value) || value <= 0) {
      throw new Error('Base MVA must be greater than zero.');
    }

    return value;
  }



  // ================================================================
  // Read UI and create PowerSystem V2
  // ================================================================

  function readTables() {

    const system = new window.PowerSystem({
      name: 'User input',
      baseMVA: readBaseMVA(),
      baseKV: 1
    });


    // ------------------------------------------------
    // Read buses
    // ------------------------------------------------

    const seenIds = new Set();

    const busRows =
      busTbody.querySelectorAll('tr');


    for (const row of busRows) {

      const get = (field) =>
        row.querySelector(
          '[data-field="' + field + '"]'
        );


      const id =
        readNumber(
          get('id'),
          'bus id'
        );


      if (!Number.isInteger(id) || id < 1) {
        throw new Error(
          'Bus id must be a positive integer.'
        );
      }


      if (seenIds.has(id)) {
        throw new Error(
          'Duplicate bus id: ' + id
        );
      }


      seenIds.add(id);


      const bus =
        new window.Bus({

          id: id,

          type:
            get('type').value,

          V:
            readNumber(
              get('V'),
              'bus V'
            ),

          delta:
            readNumber(
              get('delta'),
              'bus angle'
            ),

          Pgen:
            readNumber(
              get('Pgen'),
              'bus Pgen'
            ),

          Qgen:
            readNumber(
              get('Qgen'),
              'bus Qgen'
            ),

          Pload:
            readNumber(
              get('Pload'),
              'bus Pload'
            ),

          Qload:
            readNumber(
              get('Qload'),
              'bus Qload'
            ),

          baseKV: 1

        });


      system.addBus(bus);
    }



    // ------------------------------------------------
    // Validate buses
    // ------------------------------------------------

    if (system.buses.length === 0) {
      throw new Error(
        'No buses defined.'
      );
    }


    let slackCount = 0;

    for (const bus of system.buses) {
      if (bus.type === 'Slack') {
        slackCount++;
      }
    }


    if (slackCount !== 1) {
      throw new Error(
        'Exactly one slack bus is required ' +
        '(found ' +
        slackCount +
        ').'
      );
    }



    // ------------------------------------------------
    // Read lines
    // ------------------------------------------------

    const busIdSet =
      new Set(
        system.buses.map(
          bus => bus.id
        )
      );


    const lineRows =
      lineTbody.querySelectorAll('tr');


    for (const row of lineRows) {

      const get = (field) =>
        row.querySelector(
          '[data-field="' + field + '"]'
        );


      const from =
        readNumber(
          get('from'),
          'line from'
        );


      const to =
        readNumber(
          get('to'),
          'line to'
        );


      if (!Number.isInteger(from) ||
          !Number.isInteger(to)) {

        throw new Error(
          'Line bus numbers must be integers.'
        );
      }


      if (from === to) {
        throw new Error(
          'A line cannot connect a bus to itself: ' +
          from +
          '-' +
          to
        );
      }


      if (!busIdSet.has(from)) {
        throw new Error(
          'Line references unknown bus ' +
          from +
          '.'
        );
      }


      if (!busIdSet.has(to)) {
        throw new Error(
          'Line references unknown bus ' +
          to +
          '.'
        );
      }


      const R =
        readNumber(
          get('R'),
          'line R'
        );


      const X =
        readNumber(
          get('X'),
          'line X'
        );


      const B =
        readNumber(
          get('B'),
          'line B'
        );


      if (R === 0 && X === 0) {
        throw new Error(
          'Line ' +
          from +
          '-' +
          to +
          ' cannot have both R = 0 and X = 0.'
        );
      }


      const line =
        new window.Line({

          from: from,

          to: to,

          R: R,

          X: X,

          B: B,

          G: 0

        });


      system.addLine(line);
    }



    if (system.lines.length === 0) {
      throw new Error(
        'No lines defined.'
      );
    }


    return system;
  }



  // ================================================================
  // Output helpers
  // ================================================================

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }


  function formatNum(value, digits) {
    if (!Number.isFinite(value)) {
      return '—';
    }

    return value.toFixed(digits);
  }



  // ================================================================
  // Render V2 LoadFlowResult
  // ================================================================

  function renderResult(result) {

    if (!result.converged) {

      output.innerHTML =
        '<p class="error">' +
        'Solver did not converge after ' +
        escapeHtml(result.iterations) +
        ' iterations.' +
        '</p>';

      return;
    }


    let html = '';


    html +=
      '<h2>Results — ' +
      escapeHtml(result.method) +
      '</h2>';


    html +=
      '<p>' +
      'Converged in <strong>' +
      escapeHtml(result.iterations) +
      '</strong> iterations.' +
      '</p>';



    html +=
      '<table class="results-table">';


    html +=
      '<thead>' +
        '<tr>' +
          '<th>Bus</th>' +
          '<th>Type</th>' +
          '<th>V (p.u.)</th>' +
          '<th>Angle (°)</th>' +
          '<th>P calc (p.u.)</th>' +
          '<th>Q calc (p.u.)</th>' +
          '<th>P gen (p.u.)</th>' +
          '<th>Q gen (p.u.)</th>' +
          '<th>P load (p.u.)</th>' +
          '<th>Q load (p.u.)</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>';



    for (const bus of result.buses) {

      html += '<tr>';

      html +=
        '<td>' +
        escapeHtml(bus.id) +
        '</td>';

      html +=
        '<td>' +
        escapeHtml(bus.type) +
        '</td>';

      html +=
        '<td>' +
        formatNum(bus.V, 6) +
        '</td>';

      html +=
        '<td>' +
        formatNum(bus.delta_deg, 5) +
        '</td>';

      html +=
        '<td>' +
        formatNum(bus.P_calc, 6) +
        '</td>';

      html +=
        '<td>' +
        formatNum(bus.Q_calc, 6) +
        '</td>';

      html +=
        '<td>' +
        formatNum(bus.Pgen, 4) +
        '</td>';

      html +=
        '<td>' +
        formatNum(bus.Qgen, 4) +
        '</td>';

      html +=
        '<td>' +
        formatNum(bus.Pload, 4) +
        '</td>';

      html +=
        '<td>' +
        formatNum(bus.Qload, 4) +
        '</td>';

      html += '</tr>';
    }


    html +=
      '</tbody>' +
      '</table>';


    output.innerHTML = html;
  }



  // ================================================================
  // Solve
  // ================================================================

  function onSolve() {

    output.innerHTML =
      '<p class="hint">Solving...</p>';


    let system;


    try {

      system =
        readTables();

    } catch (error) {

      output.innerHTML =
        '<p class="error">' +
        'Input error: ' +
        escapeHtml(error.message) +
        '</p>';

      return;
    }



    let method;


    if (methodSelect.value === 'newton') {

      method =
        'Newton-Raphson';

    } else {

      method =
        'Gauss-Seidel';

    }



    let result;


    try {

      result =
        window.solvePowerFlow(
          system,
          {
            method: method
          }
        );

    } catch (error) {

      console.error(error);

      output.innerHTML =
        '<p class="error">' +
        'Solver error: ' +
        escapeHtml(error.message) +
        '</p>';

      return;
    }



    renderResult(result);
  }



  // ================================================================
  // Initial system
  // ================================================================

  const initialSystem =
    window.loadSystemV2('4bus');


  populateTables(initialSystem);



  // ================================================================
  // Events
  // ================================================================

  solveBtn.addEventListener(
    'click',
    onSolve
  );

})();