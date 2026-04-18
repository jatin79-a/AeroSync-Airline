/* AeroSync — Dashboard Charts (Chart.js) */

const BLUE     = '#2563eb';
const PURPLE   = '#7c3aed';
const GREEN    = '#10b981';
const ORANGE   = '#f59e0b';
const RED      = '#ef4444';
const BLUE_T   = 'rgba(37,99,235,0.10)';
const PURPLE_T = 'rgba(124,58,237,0.10)';

const defaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f172a', padding: 10, cornerRadius: 8, bodyFont: { family: 'Inter' }, titleFont: { family: 'Inter' } } },
  scales: {
    x: { grid: { display: false }, border: { display: false }, ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } } },
    y: { grid: { color: '#f1f5f9', drawBorder: false }, border: { display: false, dash: [4,4] }, ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } } }
  }
};

/* ── Revenue Line Chart ─────────────────────────────────────── */
const revenueCtx = document.getElementById('revenueChart');
if (revenueCtx) {
  new Chart(revenueCtx, {
    type: 'line',
    data: {
      labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
      datasets: [
        {
          label: 'Revenue',
          data: window.CHART_REVENUE || [42000, 58000, 49000, 72000, 61000, 85000, 93000],
          borderColor: BLUE, backgroundColor: BLUE_T,
          fill: true, tension: 0.4, borderWidth: 2.5,
          pointBackgroundColor: '#fff', pointBorderColor: BLUE, pointBorderWidth: 2, pointRadius: 4
        },
        {
          label: 'Previous Year',
          data: window.CHART_REVENUE_PREV || [31000, 44000, 38000, 55000, 47000, 63000, 71000],
          borderColor: '#e2e8f0', backgroundColor: 'transparent',
          tension: 0.4, borderWidth: 1.5, borderDash: [5,5],
          pointRadius: 0
        }
      ]
    },
    options: {
      ...defaults,
      plugins: { ...defaults.plugins, legend: { display: true, position: 'top', align: 'end', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 16, color: '#64748b', font: { family: 'Inter', size: 12 } } } }
    }
  });
}

/* ── Class Split Donut ─────────────────────────────────────── */
const donutCtx = document.getElementById('donutChart');
if (donutCtx) {
  const economy  = window.ECONOMY_BOOKINGS  || 65;
  const business = window.BUSINESS_BOOKINGS || 35;
  new Chart(donutCtx, {
    type: 'doughnut',
    data: {
      labels: ['Economy', 'Business'],
      datasets: [{
        data: [economy, business],
        backgroundColor: [BLUE, PURPLE],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: true, position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 16, color: '#64748b', font: { family: 'Inter', size: 12 } } },
        tooltip: defaults.plugins.tooltip
      }
    }
  });
}

/* ── City Revenue Bar Chart ─────────────────────────────────── */
const cityCtx = document.getElementById('cityRevenueChart');
if (cityCtx) {
  const labels = window.CITY_LABELS || ['Toronto', 'New York', 'London', 'Paris', 'Montreal'];
  const values = window.CITY_VALUES || [48000, 72000, 36000, 29000, 21000];
  new Chart(cityCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Revenue',
        data: values,
        backgroundColor: [BLUE, PURPLE, GREEN, ORANGE, RED],
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: { ...defaults }
  });
}
