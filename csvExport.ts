
export function exportToCsv<T extends Record<string, any>>(filename: string, data: T[]) {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];

  csvRows.push(headers.join(',')); // Add headers

  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      // Handle potential commas within data by quoting them
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  if (link.download !== undefined) { // Check if browser supports download attribute
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Fallback for older browsers
    alert('Your browser does not support automatic downloads. Please copy the data manually.');
    window.open(`data:text/csv;charset=utf-8,${encodeURIComponent(csvString)}`);
  }
}
    