import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportDashboardPDF({ workers, weather, alerts, ppeData }) {
  const doc = new jsPDF();
  const date = new Date().toLocaleString();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Header ──────────────────────────────────────────
  doc.setFillColor(24, 24, 27); // zinc-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Construction Safety Monitor', 14, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(161, 161, 170); // zinc-400
  doc.text('Real-time PPE, Posture & Worker Safety', 14, 20);
  doc.text(`Generated: ${date}`, pageWidth - 14, 20, { align: 'right' });

  let y = 36;

  // ── Weather Summary ──────────────────────────────────
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(39, 39, 42); // zinc-800
  doc.text('Weather Conditions', 14, y);
  y += 6;

  if (weather) {
    const safeStatus = weather.safe ? 'SAFE TO WORK' : 'UNSAFE CONDITIONS';
    const safeColor = weather.safe ? [34, 197, 94] : [239, 68, 68];

    autoTable(doc, {
      startY: y,
      head: [['Temperature', 'Wind Speed', 'Humidity', 'Visibility', 'Status']],
      body: [[
        `${weather.temp}°C`,
        `${weather.wind} km/h`,
        `${weather.humidity ?? '—'}%`,
        `${weather.visibility ?? '—'} km`,
        safeStatus,
      ]],
      headStyles: { fillColor: [39, 39, 42], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        4: { textColor: safeColor, fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(113, 113, 122);
    doc.text('No weather data available', 14, y + 4);
    y += 12;
  }

  // ── Worker Fitness ───────────────────────────────────
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(39, 39, 42);
  doc.text('Worker Fitness Summary', 14, y);
  y += 6;

  if (workers && workers.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Worker Name', 'Employee ID', 'Steps', 'Heart Rate (bpm)', 'Calories (kcal)']],
      body: workers.map(w => [
        w.full_name || '—',
        w.employee_id || '—',
        w.steps ?? 0,
        w.heart_rate ?? 0,
        w.calories ?? 0,
      ]),
      headStyles: { fillColor: [39, 39, 42], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [244, 244, 245] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(113, 113, 122);
    doc.text('No workers connected via Google Fit', 14, y + 4);
    y += 12;
  }

  // ── PPE Compliance ───────────────────────────────────
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(39, 39, 42);
    doc.text('PPE Compliance', 14, y);
    y += 6;

    if (ppeData && ppeData.personCount > 0) {
    autoTable(doc, {
        startY: y,
        head: [['Metric', 'Count']],
        body: [
        ['Persons Detected', ppeData.personCount ?? 0],
        ['Hardhats', ppeData.hardhatCount ?? 0],
        ['Masks', ppeData.maskCount ?? 0],
        ['Safety Vests', ppeData.vestCount ?? 0],
        ['Compliance Rate', ppeData.compliance ? `${ppeData.compliance}%` : '—'],
        ],
        headStyles: { fillColor: [39, 39, 42], textColor: [255, 255, 255], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [244, 244, 245] },
        margin: { left: 14, right: 14 },
        tableWidth: 80,
    });
    y = doc.lastAutoTable.finalY + 10;
    } else {
    doc.setFontSize(9);
    doc.setTextColor(113, 113, 122);
    doc.setFont('helvetica', 'italic');
    doc.text('Camera was not active during this session — no PPE data recorded.', 14, y + 4);
    y += 12;
    }

  // ── Safety Alerts ────────────────────────────────────
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(39, 39, 42);
  doc.text('Safety Alerts', 14, y);
  y += 6;

  if (alerts && alerts.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Severity', 'Title', 'Message', 'Time']],
      body: alerts.map(a => [
        a.severity?.toUpperCase() || '—',
        a.title || '—',
        a.message || '—',
        a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : '—',
      ]),
      headStyles: { fillColor: [39, 39, 42], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [244, 244, 245] },
      columnStyles: {
        0: {
          fontStyle: 'bold',
          textColor: (cell) => {
            const val = cell?.raw?.toString().toLowerCase();
            if (val === 'high') return [239, 68, 68];
            if (val === 'medium') return [234, 179, 8];
            return [34, 197, 94];
          }
        }
      },
      margin: { left: 14, right: 14 },
    });
  } else {
    doc.setFontSize(9);
    doc.setTextColor(113, 113, 122);
    doc.setFont('helvetica', 'italic');
    doc.text('No safety alerts were triggered during this session.', 14, y + 4);
    }
  // ── Footer ───────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(161, 161, 170);
    doc.text(
      `Construction Safety Monitor — Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  doc.save(`safety-report-${new Date().toISOString().split('T')[0]}.pdf`);
}