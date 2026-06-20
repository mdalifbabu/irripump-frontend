import { Button } from "@/components/ui/button";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const PaginationBar = ({ currentPage, totalPages, totalElements, pageSize, onPageChange }: Props) => {
  if (totalPages <= 1) return null;

  const from = currentPage * pageSize + 1;
  const to = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className="flex items-center justify-between pt-3">
      <span className="text-sm text-muted-foreground">{from}–{to} / {totalElements}</span>
      <div className="flex gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(0)} disabled={currentPage === 0}>
          <ChevronFirst className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="flex items-center px-3 text-sm">{currentPage + 1} / {totalPages}</span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(totalPages - 1)} disabled={currentPage >= totalPages - 1}>
          <ChevronLast className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PaginationBar;
