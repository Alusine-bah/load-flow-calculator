// main.js — browser UI driver for the load-flow calculator.
// Reads the system and method from the dropdowns, runs the chosen
// solver, and renders the bus table into #output.

(function () {
  const systemSelect = document.getElementById('system-select');
  const methodSelect = document.getElementById('method-select');
  const solveBtn     = document.getElementById('solve-btn');
  const output       = document.getElementById('output');

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

  function renderResult(systemName, method, result) {
    if (!result.converged) {
      output.innerHTML =
        '<p class="error">Solver did not converge after ' +
        result.iterations + ' iterations.</p>';
      return;
    }

    let html = '';
    html += '<h2>' + escapeHtml(systemName) + ' — ' +
            escapeHtml(method) + '</h2>';
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

  function onSolve() {
    const sysKey = systemSelect.value;
    const method = methodSelect.value;

    const system = window.SYSTEMS[sysKey];
    if (!system) {
      output.innerHTML = '<p class="error">Unknown system: ' +
                         escapeHtml(sysKey) + '</p>';
      return;
    }

    // Deep clone so the solver never mutates the stored SYSTEM.
    const sys = window.cloneSystem(system);

       let result;
    try {
      if (method === 'newton') {
        sys.maxIter = 30;      // NR converges in a handful of iterations
        result = window.solveNewton(sys);
      } else {
        sys.maxIter = 2000;    // GS is slow; needs many iterations
        result = window.solveGaussSeidel(sys);
      }
    } catch (e) {
      output.innerHTML = '<p class="error">Solver threw: ' +
                         escapeHtml(e.message) + '</p>';
      return;
    }

    const methodLabel =
      method === 'newton' ? 'Newton–Raphson' : 'Gauss–Seidel';
    renderResult(system.name || sysKey, methodLabel, result);
  }

  solveBtn.addEventListener('click', onSolve);
})();