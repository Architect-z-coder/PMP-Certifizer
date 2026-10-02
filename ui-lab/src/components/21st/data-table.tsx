// Source: 21st.dev — "Data Table" by @ephraimduncan (demo id 28327, demo "Default")
// https://21st.dev/@ephraimduncan/components/table-05
// Changes for Certifizer: a11y: aria-label on the page-size select; French copy; `columns`/`data` became props (defaults = the demo’s own rows); status labels in French; status colours → readiness tier tokens; DropdownMenuTrigger `render={<Button/>}` → radix `asChild` (the shipped dropdown-menu.tsx is the radix one). Markup otherwise unchanged.
"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Status = "completed" | "pending" | "processing" | "cancelled";

interface Item {
  id: string;
  name: string;
  date: string;
  status: Status;
  amount: string;
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  completed: {
    label: "Terminé",
    className:
      "bg-tier-3/15 text-tier-4",
  },
  pending: {
    label: "En attente",
    className:
      "bg-tier-2/15 text-tier-2",
  },
  processing: {
    label: "En cours",
    className:
      "bg-accent-soft text-accent-soft-ink",
  },
  cancelled: {
    label: "Annulé",
    className:
      "bg-danger-soft text-destructive",
  },
};

function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  return (
    <Badge className={cn("border-0", config.className)} variant="outline">
      {config.label}
    </Badge>
  );
}

export const defaultColumns: ColumnDef<Item>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Tout sélectionner"
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={
          table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Sélectionner la ligne"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Nom",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Montant</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">{row.getValue("amount")}</div>
    ),
  },
  {
    id: "actions",
    cell: () => (
      <div className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-8 w-8" size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Ouvrir le menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              Voir le détail
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
];

export const defaultData: Item[] = [
  {
    id: "1",
    name: "Project Alpha",
    date: "Jan 15, 2024",
    status: "completed",
    amount: "$2,500",
  },
  {
    id: "2",
    name: "Website Redesign",
    date: "Feb 3, 2024",
    status: "processing",
    amount: "$4,200",
  },
  {
    id: "3",
    name: "Mobile App MVP",
    date: "Feb 18, 2024",
    status: "pending",
    amount: "$8,750",
  },
  {
    id: "4",
    name: "Brand Identity",
    date: "Mar 5, 2024",
    status: "completed",
    amount: "$1,800",
  },
  {
    id: "5",
    name: "Marketing Campaign",
    date: "Mar 22, 2024",
    status: "cancelled",
    amount: "$3,400",
  },
  {
    id: "6",
    name: "Analytics Dashboard",
    date: "Apr 8, 2024",
    status: "processing",
    amount: "$5,600",
  },
  {
    id: "7",
    name: "E-commerce Platform",
    date: "Apr 25, 2024",
    status: "pending",
    amount: "$12,000",
  },
  {
    id: "8",
    name: "API Integration",
    date: "May 10, 2024",
    status: "completed",
    amount: "$3,200",
  },
];

export { StatusBadge };
export type { Item, Status };
export default function Table05<T = Item>({
  columns = defaultColumns as unknown as ColumnDef<T>[],
  data = defaultData as unknown as T[],
  searchPlaceholder = "Rechercher…",
  pageSize = 5,
  className = "w-full max-w-3xl space-y-4",
}: { columns?: ColumnDef<T>[]; data?: T[]; searchPlaceholder?: string; pageSize?: number; className?: string }) {
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      globalFilter,
    },
    initialState: {
      pagination: { pageSize },
    },
  });

  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;

  return (
    <div className={className}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Afficher</span>
          <Select
            onValueChange={(value) => table.setPageSize(Number(value))}
            value={String(table.getState().pagination.pageSize)}
          >
            <SelectTrigger className="h-8 w-16" aria-label="Lignes par page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground text-sm">lignes</span>
        </div>
        <Input
          className="h-8 w-full sm:w-64"
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder={searchPlaceholder}
          value={globalFilter}
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  Aucun résultat.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-pretty text-muted-foreground text-sm">
          Lignes{" "}
          {table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
            1}{" "}
          à{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length,
          )}{" "}
          sur {table.getFilteredRowModel().rows.length}
        </p>
        <div className="flex items-center gap-1">
          <Button
            aria-label="Page précédente"
            className="h-8 w-8"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            size="icon"
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Page précédente</span>
          </Button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
            <Button
              aria-label={`Aller à la page ${page}`}
              className="h-8 w-8"
              key={page}
              onClick={() => table.setPageIndex(page - 1)}
              size="icon"
              variant={currentPage === page ? "default" : "outline"}
            >
              {page}
            </Button>
          ))}
          <Button
            aria-label="Page suivante"
            className="h-8 w-8"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            size="icon"
            variant="outline"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Page suivante</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
