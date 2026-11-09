import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  stickyHeader?: boolean;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, stickyHeader, children, ...props }, ref) => (
    <div className="overflow-x-auto">
      <table ref={ref} className={cn('w-full text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  )
);
Table.displayName = 'Table';

export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, children, ...props }, ref) => (
    <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props}>{children}</thead>
  )
);
TableHeader.displayName = 'TableHeader';

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, children, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props}>{children}</tbody>
  )
);
TableBody.displayName = 'TableBody';

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement> & { clickable?: boolean }>(
  ({ className, clickable, children, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b border-gray-100 transition-colors',
        clickable && 'hover:bg-gray-50 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
);
TableRow.displayName = 'TableRow';

export const TableHead = forwardRef<HTMLTableCellElement, HTMLAttributes<HTMLTableCellElement> & { width?: string }>(
  ({ className, width, children, ...props }, ref) => (
    <th
      ref={ref}
      style={{ width }}
      className={cn('px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs', className)}
      {...props}
    >
      {children}
    </th>
  )
);
TableHead.displayName = 'TableHead';

export const TableCell = forwardRef<HTMLTableCellElement, HTMLAttributes<HTMLTableCellElement>>(
  ({ className, children, ...props }, ref) => (
    <td ref={ref} className={cn('px-4 py-3 text-gray-900', className)} {...props}>{children}</td>
  )
);
TableCell.displayName = 'TableCell';

export const TableFooter = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, children, ...props }, ref) => (
    <tfoot ref={ref} className={cn('bg-gray-50 border-t border-gray-100', className)} {...props}>{children}</tfoot>
  )
);
TableFooter.displayName = 'TableFooter';