import type { SummaryRow } from '../state/selectors';

interface SummaryTableProps {
  readonly rows: readonly SummaryRow[];
}

export function SummaryTable({ rows }: SummaryTableProps) {
  return (
    <table className="table text-sm">
      <caption className="sr-only">What Bindery will write into the file</caption>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <th scope="row" className="plate w-label-col py-10 text-left font-normal">
              {row.label}
            </th>
            <td className="py-10 text-ink">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
