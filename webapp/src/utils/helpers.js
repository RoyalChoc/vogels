/**
 * Misc utility functions
 */

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function flattenTreeRows(node, depth = 0, rows = []) {
  if (!node) return rows
  const indent = '  '.repeat(depth)
  rows.push([`${indent}${node.label}`, node.meta || '-'])
  ;(node.children || []).forEach((child) => flattenTreeRows(child, depth + 1, rows))
  return rows
}
