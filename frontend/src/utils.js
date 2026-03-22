export function parseDue(str) {
  return new Date(str);
}

export function daysLeft(due) {
  const diff = parseDue(due) - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatDate(str) {
  const d = parseDue(str);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + 
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function dueStatus(due) {
  const d = daysLeft(due);
  if (d < 0) return 'over';
  if (d <= 3) return 'soon';
  return 'ok';
}

export function dueLabel(due) {
  const d = daysLeft(due);
  if (d < 0) return `Overdue by ${Math.abs(d)} day${Math.abs(d) === 1 ? '' : 's'}`;
  if (d === 0) return 'Due today';
  if (d === 1) return 'Due tomorrow';
  return `${d} days left`;
}

export function statusBarColor(st) {
  if (st === 'over') return 'var(--danger)';
  if (st === 'soon') return 'var(--warn)';
  return 'var(--ok)';
}

export function chipClass(st) {
  if (st === 'over') return 'chip over';
  if (st === 'soon') return 'chip due';
  return 'chip safe';
}

export function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / (1024 * 1024)).toFixed(1) + ' MB';
}
