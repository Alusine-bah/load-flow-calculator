// main.js
// Power Flow Engineering Calculator V2
//
// Browser interface for:
// - Editable bus data
// - Editable line data
// - Editable line MVA ratings
// - Newton-Raphson
// - Gauss-Seidel
// - Voltage profile analysis
// - Transmission line flow analysis
// - Line thermal loading analysis
// - Simplified three-phase fault analysis
// - N-1 line contingency ranking

(function () {
  'use strict';


  // ================================================================
  // DOM REFERENCES
  // ================================================================

  const busTbody =
    document.getElementById('bus-tbody');

  const lineTbody =
    document.getElementById('line-tbody');

  const baseMvaInput =
    document.getElementById('base-mva');

  const methodSelect =
    document.getElementById('method-select');

  const solveBtn =
    document.getElementById('solve-btn');

  const output =
    document.getElementById('output');

  const voltageOutput =
    document.getElementById('voltage-output');

  const lineFlowOutput =
    document.getElementById('line-flow-output');

  const thermalOutput =
    document.getElementById('thermal-output');

  const faultOutput =
    document.getElementById('fault-output');

  const contingencyOutput =
    document.getElementById('contingency-output');



  // ================================================================
  // CURRENT SOLVED STATE
  // ================================================================

  let latestSystem =
    null;

  let latestResult =
    null;

  let latestZbus =
    null;



  // ================================================================
  // DEFAULT LINE RATINGS FOR 4-BUS EXAMPLE
  // ================================================================

  const defaultRatings = {

    '1-2': 100,

    '1-3': 80,

    '2-4': 50,

    '3-4': 20

  };



  // ================================================================
  // BUS INPUT ROW
  // ================================================================

  function busRow(bus) {

    const tr =
      document.createElement('tr');


    tr.innerHTML =

      '<td>' +
        '<input type="number" ' +
        'class="cell" ' +
        'data-field="id" ' +
        'value="' + bus.id + '" ' +
        'step="1" min="1">' +
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
        '<input type="number" ' +
        'class="cell" ' +
        'data-field="V" ' +
        'value="' + bus.V + '" ' +
        'step="0.001" min="0">' +
      '</td>' +


      '<td>' +
        '<input type="number" ' +
        'class="cell" ' +
        'data-field="delta" ' +
        'value="' + (bus.delta || 0) + '" ' +
        'step="0.1">' +
      '</td>' +


      '<td>' +
        '<input type="number" ' +
        'class="cell" ' +
        'data-field="Pgen" ' +
        'value="' + (bus.Pgen || 0) + '" ' +
        'step="0.01">' +
      '</td>' +


      '<td>' +
        '<input type="number" ' +
        'class="cell" ' +
        'data-field="Qgen" ' +
        'value="' + (bus.Qgen || 0) + '" ' +
        'step="0.01">' +
      '</td>' +


      '<td>' +
        '<input type="number" ' +
        'class="cell" ' +
        'data-field="Pload" ' +
        'value="' + (bus.Pload || 0) + '" ' +
        'step="0.01">' +
      '</td>' +


      '<td>' +
        '<input type="number" ' +
        'class="cell" ' +
        'data-field="Qload" ' +
        'value="' + (bus.Qload || 0) + '" ' +
        'step="0.01">' +
      '</td>';


    return tr;
  }



  // ================================================================
  // LINE INPUT ROW
  // ================================================================

  function lineRow(line) {

    const tr =
      document.createElement('tr');


    const key =
      line.from +
      '-' +
      line.to;


    let rating =
      line.ratingMVA;


    if (!Number.isFinite(rating)) {

      rating =
        defaultRatings[key] || '';
    }


    tr.innerHTML =

      '<td>' +
        '<input type="number" ' +
        'class="cell" ' +
        'data-field="from" ' +
        'value="' + line.from + '" ' +
        'step="1" min="1">' +
      '</td>' +


      '<td>' +
        '<input type="number" ' +
        'class="cell" ' +
        'data-field="to" ' +
        'value="' + line.to + '" ' +
        'step="1" min="1">' +
      '</td>' +


      '<td>' +
        '<input type="number" ' +
        'class="cell" ' +
        'data-field="R" ' +
        'value="' + line.R + '" ' +
        'step="0.0001">' +
      '</td>' +


      '<td>' +
        '<input type="number" ' +
        'class="cell" ' +
        'data-field="X" ' +
        'value="' + line.X + '" ' +
        'step="0.0001">' +
      '</td>' +


      '<td>' +
        '<input type="number" ' +
        'class="cell" ' +
        'data-field="B" ' +
        'value="' + line.B + '" ' +
        'step="0.0001">' +
      '</td>' +


      '<td>' +
        '<input type="number" ' +
        'class="cell" ' +
        'data-field="ratingMVA" ' +
        'value="' + rating + '" ' +
        'step="1" min="0">' +
      '</td>';


    return tr;
  }



  // ================================================================
  // POPULATE TABLES
  // ================================================================

  function populateTables(system) {

    busTbody.innerHTML =
      '';


    for (const bus of system.buses) {

      busTbody.appendChild(
        busRow(bus)
      );
    }


    lineTbody.innerHTML =
      '';


    for (const line of system.lines) {

      lineTbody.appendChild(
        lineRow(line)
      );
    }


    baseMvaInput.value =
      system.baseMVA;
  }



  // ================================================================
  // INPUT HELPERS
  // ================================================================

  function readNumber(
    input,
    label
  ) {

    const value =
      parseFloat(
        input.value
      );


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



  function readOptionalPositiveNumber(
    input,
    label
  ) {

    const raw =
      input.value.trim();


    if (raw === '') {

      return null;
    }


    const value =
      parseFloat(raw);


    if (!Number.isFinite(value)) {

      throw new Error(
        'Invalid number in ' +
        label +
        '.'
      );
    }


    if (value <= 0) {

      throw new Error(
        label +
        ' must be greater than zero.'
      );
    }


    return value;
  }



  function readBaseMVA() {

    const value =
      parseFloat(
        baseMvaInput.value
      );


    if (!Number.isFinite(value) ||
        value <= 0) {

      throw new Error(
        'Base MVA must be greater than zero.'
      );
    }


    return value;
  }



  // ================================================================
  // BUILD POWERSYSTEM V2
  // ================================================================

  function readTables() {

    const system =
      new window.PowerSystem({

        name:
          'User input',

        baseMVA:
          readBaseMVA(),

        baseKV:
          1

      });



    // ------------------------------------------------
    // BUS DATA
    // ------------------------------------------------

    const seenIds =
      new Set();


    const busRows =
      busTbody.querySelectorAll(
        'tr'
      );


    for (const row of busRows) {

      const get =
        (field) =>
          row.querySelector(
            '[data-field="' +
            field +
            '"]'
          );


      const id =
        readNumber(
          get('id'),
          'bus id'
        );


      if (!Number.isInteger(id) ||
          id < 1) {

        throw new Error(
          'Bus id must be a positive integer.'
        );
      }


      if (seenIds.has(id)) {

        throw new Error(
          'Duplicate bus id: ' +
          id
        );
      }


      seenIds.add(id);



      const bus =
        new window.Bus({

          id:
            id,

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

          baseKV:
            1

        });


      system.addBus(bus);
    }



    if (system.buses.length === 0) {

      throw new Error(
        'No buses defined.'
      );
    }



    let slackCount =
      0;


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
    // LINE DATA
    // ------------------------------------------------

    const busIdSet =
      new Set(
        system.buses.map(
          bus => bus.id
        )
      );


    const lineRows =
      lineTbody.querySelectorAll(
        'tr'
      );


    for (const row of lineRows) {

      const get =
        (field) =>
          row.querySelector(
            '[data-field="' +
            field +
            '"]'
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


      if (!busIdSet.has(from) ||
          !busIdSet.has(to)) {

        throw new Error(
          'Line references an unknown bus.'
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


      if (R === 0 &&
          X === 0) {

        throw new Error(
          'Line ' +
          from +
          '-' +
          to +
          ' cannot have both R = 0 and X = 0.'
        );
      }



      const ratingMVA =
        readOptionalPositiveNumber(
          get('ratingMVA'),
          'line rating'
        );



      const line =
        new window.Line({

          from:
            from,

          to:
            to,

          R:
            R,

          X:
            X,

          B:
            B,

          G:
            0,

          ratingMVA:
            ratingMVA

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
  // OUTPUT HELPERS
  // ================================================================

  function escapeHtml(value) {

    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }



  function formatNum(
    value,
    digits
  ) {

    if (!Number.isFinite(value)) {

      return '—';
    }


    return value.toFixed(
      digits
    );
  }



  // ================================================================
  // POWER FLOW RESULTS
  // ================================================================

  function renderResult(result) {

    if (!result.converged) {

      output.innerHTML =

        '<p class="error">' +

        'Solver did not converge after ' +

        escapeHtml(
          result.iterations
        ) +

        ' iterations.' +

        '</p>';


      return;
    }



    let html =
      '';


    html +=

      '<h2>Results — ' +

      escapeHtml(
        result.method
      ) +

      '</h2>';



    html +=

      '<p>' +

      'Converged in <strong>' +

      escapeHtml(
        result.iterations
      ) +

      '</strong> iterations.' +

      '</p>';



    html +=

      '<table class="results-table">' +

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

      html +=

        '<tr>' +

          '<td>' +
          escapeHtml(bus.id) +
          '</td>' +

          '<td>' +
          escapeHtml(bus.type) +
          '</td>' +

          '<td>' +
          formatNum(bus.V, 6) +
          '</td>' +

          '<td>' +
          formatNum(bus.delta_deg, 5) +
          '</td>' +

          '<td>' +
          formatNum(bus.P_calc, 6) +
          '</td>' +

          '<td>' +
          formatNum(bus.Q_calc, 6) +
          '</td>' +

          '<td>' +
          formatNum(bus.Pgen, 4) +
          '</td>' +

          '<td>' +
          formatNum(bus.Qgen, 4) +
          '</td>' +

          '<td>' +
          formatNum(bus.Pload, 4) +
          '</td>' +

          '<td>' +
          formatNum(bus.Qload, 4) +
          '</td>' +

        '</tr>';
    }



    html +=

      '</tbody>' +

      '</table>';



    output.innerHTML =
      html;
  }



  // ================================================================
  // VOLTAGE PROFILE
  // ================================================================

  function renderVoltageProfile(result) {

    const analysis =
      window.analyzeVoltageProfile(
        result
      );


    let html =
      '';


    html +=

      '<p>' +

      '<strong>Minimum:</strong> Bus ' +

      escapeHtml(
        analysis.minimumVoltage.id
      ) +

      ' — ' +

      formatNum(
        analysis.minimumVoltage.V,
        4
      ) +

      ' p.u.' +

      ' &nbsp; | &nbsp; ' +

      '<strong>Maximum:</strong> Bus ' +

      escapeHtml(
        analysis.maximumVoltage.id
      ) +

      ' — ' +

      formatNum(
        analysis.maximumVoltage.V,
        4
      ) +

      ' p.u.' +

      ' &nbsp; | &nbsp; ' +

      '<strong>Average:</strong> ' +

      formatNum(
        analysis.averageVoltage,
        4
      ) +

      ' p.u.' +

      '</p>';



    html +=

      '<table class="results-table">' +

      '<thead>' +

        '<tr>' +

          '<th>Bus</th>' +
          '<th>Voltage (p.u.)</th>' +
          '<th>Angle (°)</th>' +
          '<th>Deviation (%)</th>' +
          '<th>Status</th>' +

        '</tr>' +

      '</thead>' +

      '<tbody>';



    for (const bus of analysis.buses) {

      html +=

        '<tr>' +

          '<td>' +
          escapeHtml(bus.id) +
          '</td>' +

          '<td>' +
          formatNum(bus.V, 4) +
          '</td>' +

          '<td>' +
          formatNum(bus.delta_deg, 4) +
          '</td>' +

          '<td>' +
          formatNum(
            bus.deviation_percent,
            2
          ) +
          '%</td>' +

          '<td>' +
          escapeHtml(bus.status) +
          '</td>' +

        '</tr>';
    }



    html +=

      '</tbody>' +

      '</table>';



    voltageOutput.innerHTML =
      html;
  }



  // ================================================================
  // LINE FLOW
  // ================================================================

  function renderLineFlows(
    system,
    flows
  ) {

    let totalPLoss =
      0;


    let totalQLoss =
      0;


    for (const flow of flows) {

      totalPLoss +=
        flow.P_loss;


      totalQLoss +=
        flow.Q_loss;
    }



    let html =
      '';


    html +=

      '<p>' +

      '<strong>Total active loss:</strong> ' +

      formatNum(
        totalPLoss *
        system.baseMVA,
        4
      ) +

      ' MW' +

      ' &nbsp; | &nbsp; ' +

      '<strong>Total reactive loss:</strong> ' +

      formatNum(
        totalQLoss *
        system.baseMVA,
        4
      ) +

      ' MVAR' +

      '</p>';



    html +=

      '<table class="results-table">' +

      '<thead>' +

        '<tr>' +

          '<th>Line</th>' +
          '<th>P from (MW)</th>' +
          '<th>Q from (MVAR)</th>' +
          '<th>P to (MW)</th>' +
          '<th>Q to (MVAR)</th>' +
          '<th>P loss (MW)</th>' +
          '<th>Q loss (MVAR)</th>' +
          '<th>Sending Flow (MVA)</th>' +
          '<th>Receiving Flow (MVA)</th>' +

        '</tr>' +

      '</thead>' +

      '<tbody>';



    for (const flow of flows) {

      html +=

        '<tr>' +

          '<td>' +
          escapeHtml(
            flow.from +
            '-' +
            flow.to
          ) +
          '</td>' +

          '<td>' +
          formatNum(
            flow.P_from *
            system.baseMVA,
            4
          ) +
          '</td>' +

          '<td>' +
          formatNum(
            flow.Q_from *
            system.baseMVA,
            4
          ) +
          '</td>' +

          '<td>' +
          formatNum(
            flow.P_to *
            system.baseMVA,
            4
          ) +
          '</td>' +

          '<td>' +
          formatNum(
            flow.Q_to *
            system.baseMVA,
            4
          ) +
          '</td>' +

          '<td>' +
          formatNum(
            flow.P_loss *
            system.baseMVA,
            4
          ) +
          '</td>' +

          '<td>' +
          formatNum(
            flow.Q_loss *
            system.baseMVA,
            4
          ) +
          '</td>' +

          '<td>' +
          formatNum(
            flow.S_from_MVA,
            4
          ) +
          '</td>' +

          '<td>' +
          formatNum(
            flow.S_to_MVA,
            4
          ) +
          '</td>' +

        '</tr>';
    }



    html +=

      '</tbody>' +

      '</table>';



    lineFlowOutput.innerHTML =
      html;
  }



  // ================================================================
  // THERMAL LOADING
  // ================================================================

  function renderThermalLoading(
    system,
    lineFlows
  ) {

    const results =
      window.analyzeLineRatings(
        system,
        lineFlows
      );


    let warnings =
      0;


    let overloads =
      0;


    for (const line of results) {

      if (line.status === 'WARNING') {

        warnings++;
      }


      if (line.status === 'OVERLOAD') {

        overloads++;
      }
    }



    let html =
      '';


    html +=

      '<p>' +

      '<strong>Warnings:</strong> ' +

      warnings +

      ' &nbsp; | &nbsp; ' +

      '<strong>Overloads:</strong> ' +

      overloads +

      '</p>';



    html +=

      '<table class="results-table">' +

      '<thead>' +

        '<tr>' +

          '<th>Line</th>' +
          '<th>Flow (MVA)</th>' +
          '<th>Rating (MVA)</th>' +
          '<th>Loading (%)</th>' +
          '<th>Status</th>' +

        '</tr>' +

      '</thead>' +

      '<tbody>';



    for (const line of results) {

      html +=

        '<tr>' +

          '<td>' +
          escapeHtml(
            line.from +
            '-' +
            line.to
          ) +
          '</td>' +

          '<td>' +
          formatNum(
            line.flow_MVA,
            2
          ) +
          '</td>' +

          '<td>' +

          (
            Number.isFinite(
              line.rating_MVA
            )
              ?
              formatNum(
                line.rating_MVA,
                2
              )
              :
              'N/A'
          ) +

          '</td>' +

          '<td>' +

          (
            Number.isFinite(
              line.loading_percent
            )
              ?
              formatNum(
                line.loading_percent,
                2
              ) +
              '%'
              :
              'N/A'
          ) +

          '</td>' +

          '<td>' +
          escapeHtml(
            line.status
          ) +
          '</td>' +

        '</tr>';
    }



    html +=

      '</tbody>' +

      '</table>';



    thermalOutput.innerHTML =
      html;
  }



  // ================================================================
  // FAULT ANALYSIS CONTROLS
  // ================================================================

  function renderFaultControls(
    system,
    result
  ) {

    let options =
      '';


    for (const bus of system.buses) {

      options +=

        '<option value="' +
        bus.id +
        '">' +

        'Bus ' +
        bus.id +

        '</option>';
    }



    faultOutput.innerHTML =

      '<p>' +

      '<strong>Supported calculation:</strong> ' +

      'Three-phase balanced fault' +

      '</p>' +


      '<p>' +

      '<label for="fault-bus-select">' +

      'Fault Bus: ' +

      '</label>' +


      '<select id="fault-bus-select">' +

      options +

      '</select>' +


      ' &nbsp; ' +


      '<label for="fault-impedance-input">' +

      'Fault Impedance Zf (p.u.): ' +

      '</label>' +


      '<input ' +

      'type="number" ' +

      'id="fault-impedance-input" ' +

      'value="0.05" ' +

      'step="0.01" ' +

      'min="0">' +


      ' &nbsp; ' +


      '<button id="run-fault-btn">' +

      'Run Fault Analysis' +

      '</button>' +


      '</p>' +


      '<div id="fault-result">' +

      '<p class="hint">' +

      'Choose a fault bus and click Run Fault Analysis.' +

      '</p>' +

      '</div>' +


      '<p class="hint">' +

      'Current fault calculation is a simplified educational ' +

      'three-phase Zbus model. Sequence-network faults are not yet implemented.' +

      '</p>';



    const faultBusSelect =
      document.getElementById(
        'fault-bus-select'
      );


    const faultImpedanceInput =
      document.getElementById(
        'fault-impedance-input'
      );


    const runFaultBtn =
      document.getElementById(
        'run-fault-btn'
      );


    const faultResult =
      document.getElementById(
        'fault-result'
      );



    if (system.buses.length >= 2) {

      faultBusSelect.value =
        String(
          system.buses[1].id
        );
    }



    runFaultBtn.addEventListener(
      'click',
      function () {

        const faultBus =
          Number(
            faultBusSelect.value
          );


        const faultImpedance =
          Number(
            faultImpedanceInput.value
          );


        if (!Number.isFinite(
          faultImpedance
        ) ||
        faultImpedance < 0) {

          faultResult.innerHTML =

            '<p class="error">' +

            'Fault impedance must be zero or positive.' +

            '</p>';


          return;
        }



        try {

          const fault =
            window.calculateFaultAnalysis(

              system,

              latestZbus,

              faultBus,

              result,

              {

                faultType:
                  'Three Phase',

                faultImpedance:
                  faultImpedance

              }

            );


          renderFaultResult(
            fault,
            faultResult
          );

        } catch (error) {

          console.error(error);


          faultResult.innerHTML =

            '<p class="error">' +

            'Fault analysis error: ' +

            escapeHtml(
              error.message
            ) +

            '</p>';
        }
      }
    );
  }



  // ================================================================
  // FAULT RESULT
  // ================================================================

  function renderFaultResult(
    fault,
    target
  ) {

    const prefaultMagnitude =
      C.abs(
        fault.prefaultVoltage
      );


    target.innerHTML =

      '<table class="results-table">' +

      '<thead>' +

        '<tr>' +

          '<th>Fault Type</th>' +
          '<th>Fault Bus</th>' +
          '<th>Zf (p.u.)</th>' +
          '<th>Pre-fault V (p.u.)</th>' +
          '<th>Fault Current (p.u.)</th>' +
          '<th>Fault Level (MVA)</th>' +

        '</tr>' +

      '</thead>' +

      '<tbody>' +

        '<tr>' +

          '<td>' +
          escapeHtml(
            fault.faultType
          ) +
          '</td>' +

          '<td>' +
          escapeHtml(
            fault.bus
          ) +
          '</td>' +

          '<td>' +
          formatNum(
            fault.faultImpedance,
            4
          ) +
          '</td>' +

          '<td>' +
          formatNum(
            prefaultMagnitude,
            4
          ) +
          '</td>' +

          '<td>' +
          formatNum(
            fault.faultCurrent_pu,
            4
          ) +
          '</td>' +

          '<td>' +
          formatNum(
            fault.faultMVA,
            2
          ) +
          '</td>' +

        '</tr>' +

      '</tbody>' +

      '</table>';
  }



  // ================================================================
  // CONTINGENCY CONTROLS
  // ================================================================

  function renderContingencyControls(
    system
  ) {

    contingencyOutput.innerHTML =

      '<p>' +

      '<strong>N-1 line-outage security assessment</strong>' +

      '</p>' +


      '<p>' +

      'Each transmission line will be removed one at a time, ' +

      'the power flow will be solved again, and the resulting ' +

      'voltage, loss, and thermal effects will be ranked.' +

      '</p>' +


      '<button id="run-contingency-btn">' +

      'Run N-1 Contingency Analysis' +

      '</button>' +


      '<div id="contingency-result">' +

      '<p class="hint">' +

      'Click the button to run all line-outage cases.' +

      '</p>' +

      '</div>' +


      '<p class="hint">' +

      'The current severity score is a heuristic ranking metric ' +

      'used for comparison between contingencies.' +

      '</p>';



    const button =
      document.getElementById(
        'run-contingency-btn'
      );


    const target =
      document.getElementById(
        'contingency-result'
      );



    button.addEventListener(
      'click',
      function () {

        target.innerHTML =

          '<p class="hint">' +

          'Running N-1 contingency analysis...' +

          '</p>';



        try {

          const rawRanking =
            window.runContingencyRanking(
              system
            );


          const report =
            window.createContingencyRankingReport(
              rawRanking
            );


          renderContingencyResults(
            report,
            target
          );

        } catch (error) {

          console.error(error);


          target.innerHTML =

            '<p class="error">' +

            'Contingency analysis error: ' +

            escapeHtml(
              error.message
            ) +

            '</p>';
        }
      }
    );
  }



  // ================================================================
  // CONTINGENCY RESULTS
  // ================================================================

  function renderContingencyResults(
    report,
    target
  ) {

    if (!report ||
        report.length === 0) {

      target.innerHTML =

        '<p class="hint">' +

        'No contingency results available.' +

        '</p>';


      return;
    }



    let html =
      '';


    html +=

      '<table class="results-table">' +

      '<thead>' +

        '<tr>' +

          '<th>Rank</th>' +
          '<th>Outage</th>' +
          '<th>Score</th>' +
          '<th>Severity</th>' +
          '<th>Maximum Loading (%)</th>' +
          '<th>Maximum |ΔV| (p.u.)</th>' +
          '<th>Reason</th>' +

        '</tr>' +

      '</thead>' +

      '<tbody>';



    for (const item of report) {

      html +=

        '<tr>' +

          '<td>' +
          escapeHtml(
            item.rank
          ) +
          '</td>' +

          '<td>' +
          escapeHtml(
            item.outage
          ) +
          '</td>' +

          '<td>' +
          formatNum(
            item.score,
            3
          ) +
          '</td>' +

          '<td>' +
          escapeHtml(
            item.severity
          ) +
          '</td>' +

          '<td>' +

          (
            Number.isFinite(
              item.maximumOverload
            )
              ?
              formatNum(
                item.maximumOverload,
                2
              )
              :
              'N/A'
          ) +

          '</td>' +

          '<td>' +
          formatNum(
            item.maximumVoltageDrop,
            4
          ) +
          '</td>' +

          '<td>' +
          escapeHtml(
            item.reason
          ) +
          '</td>' +

        '</tr>';
    }



    html +=

      '</tbody>' +

      '</table>';



    target.innerHTML =
      html;
  }



  // ================================================================
  // SOLVE
  // ================================================================

  function onSolve() {

    output.innerHTML =
      '<p class="hint">Solving power flow...</p>';


    voltageOutput.innerHTML =
      '<p class="hint">Running voltage analysis...</p>';


    lineFlowOutput.innerHTML =
      '<p class="hint">Running line-flow analysis...</p>';


    thermalOutput.innerHTML =
      '<p class="hint">Running thermal analysis...</p>';


    faultOutput.innerHTML =
      '<p class="hint">Preparing fault analysis...</p>';


    contingencyOutput.innerHTML =
      '<p class="hint">Preparing contingency analysis...</p>';



    let system;


    try {

      system =
        readTables();

    } catch (error) {

      output.innerHTML =

        '<p class="error">' +

        'Input error: ' +

        escapeHtml(
          error.message
        ) +

        '</p>';


      return;
    }



    const method =

      methodSelect.value === 'newton'

        ?

        'Newton-Raphson'

        :

        'Gauss-Seidel';



    let result;


    try {

      result =
        window.solvePowerFlow(

          system,

          {
            method:
              method
          }

        );

    } catch (error) {

      console.error(error);


      output.innerHTML =

        '<p class="error">' +

        'Solver error: ' +

        escapeHtml(
          error.message
        ) +

        '</p>';


      return;
    }



    renderResult(
      result
    );



    if (!result.converged) {

      voltageOutput.innerHTML =
        '<p class="hint">Voltage analysis unavailable.</p>';

      lineFlowOutput.innerHTML =
        '<p class="hint">Line-flow analysis unavailable.</p>';

      thermalOutput.innerHTML =
        '<p class="hint">Thermal analysis unavailable.</p>';

      faultOutput.innerHTML =
        '<p class="hint">Fault analysis requires a converged solution.</p>';

      contingencyOutput.innerHTML =
        '<p class="hint">Contingency analysis requires a converged base solution.</p>';

      return;
    }



    latestSystem =
      system;


    latestResult =
      result;



    renderVoltageProfile(
      result
    );



    let lineFlows;


    try {

      lineFlows =
        window.calculateLineFlows(
          system,
          result
        );

    } catch (error) {

      console.error(error);


      lineFlowOutput.innerHTML =

        '<p class="error">' +

        'Line-flow analysis error: ' +

        escapeHtml(
          error.message
        ) +

        '</p>';


      return;
    }



    renderLineFlows(
      system,
      lineFlows
    );


    renderThermalLoading(
      system,
      lineFlows
    );



    try {

      latestZbus =
        window.calculateZbus(
          system
        );


      renderFaultControls(
        system,
        result
      );

    } catch (error) {

      console.error(error);


      latestZbus =
        null;


      faultOutput.innerHTML =

        '<p class="error">' +

        'Fault-analysis matrix could not be created: ' +

        escapeHtml(
          error.message
        ) +

        '</p>';
    }



    renderContingencyControls(
      system
    );
  }



  // ================================================================
  // INITIAL SYSTEM
  // ================================================================

  const initialSystem =
    window.loadSystemV2(
      '4bus'
    );


  populateTables(
    initialSystem
  );



  // ================================================================
  // EVENT
  // ================================================================

  solveBtn.addEventListener(
    'click',
    onSolve
  );

})();