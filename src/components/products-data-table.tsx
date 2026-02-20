import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  MoveLeftIcon,
  MoveRightIcon,
  SearchIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "./ui/button";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  rowCount: number;
  pagination: PaginationState;
  sorting: SortingState;
  onPaginate: OnChangeFn<PaginationState>;
  onSort: OnChangeFn<SortingState>;
  onSearch: (search: string) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  rowCount,
  pagination,
  sorting,
  onPaginate,
  onSort,
  onSearch,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    rowCount,
    onPaginationChange: onPaginate,
    onSortingChange: onSort,
    state: {
      pagination,
      sorting,
    },
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  const [pageInput, setPageInput] = useState(String(pageIndex + 1));

  useEffect(() => {
    setPageInput(String(pageIndex + 1));
  }, [pageIndex]);

  const goToPage = (value: string) => {
    const page = Number(value);
    if (!Number.isNaN(page) && page > 0) {
      const clamped = Math.min(Math.max(Math.round(page), 1), pageCount);
      table.setPageIndex(clamped - 1);
      setPageInput(String(clamped));
    } else {
      setPageInput(String(pageIndex + 1));
    }
  };

  // ─── Search ───────────────────────────────────────────────────────────────

  const [searchInput, setSearchInput] = useState("");
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchRef.current(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div className="overflow-hidden rounded-md border">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <SearchIcon className="text-muted-foreground size-4 shrink-0" />
        <input
          type="search"
          placeholder="Ürün adı veya stok kodu ara..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : header.column.getCanSort() ? (
                    <button
                      type="button"
                      className="flex cursor-pointer select-none items-center gap-1"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {header.column.getIsSorted() === "asc" ? (
                        <ArrowUpIcon className="size-3" />
                      ) : header.column.getIsSorted() === "desc" ? (
                        <ArrowDownIcon className="size-3" />
                      ) : (
                        <ArrowUpDownIcon className="text-muted-foreground size-3" />
                      )}
                    </button>
                  ) : (
                    flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                bulunamadı.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <hr />
      <div className="flex items-center justify-between space-x-2 p-4">
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          Sayfa:
          <input
            type="number"
            min={1}
            max={pageCount}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={() => goToPage(pageInput)}
            onKeyDown={(e) => e.key === "Enter" && goToPage(pageInput)}
            className="w-12 rounded border border-input bg-transparent px-1.5 py-0.5 text-center text-sm focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          / {pageCount} · Toplam: {table.getRowCount()}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="cursor-pointer"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <MoveLeftIcon />
            Önceki
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Sonraki
            <MoveRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
