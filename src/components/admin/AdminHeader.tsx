import React from "react";
import {
  Settings,
  Plus,
  MoreHorizontal,
  Upload,
  Download,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminHeaderProps {
  onImport: (event: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLElement>) => void;
  onExportCSV: () => void;
  onExportXLSX: () => void;
  onClearAll: () => void;
  isExporting: boolean;
  filteredAppointmentsLength: number;
  onNewAppointmentClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isImporting: boolean;
}

const AdminHeader = ({
  onImport,
  onExportCSV,
  onExportXLSX,
  onClearAll,
  isExporting,
  filteredAppointmentsLength,
  onNewAppointmentClick,
  fileInputRef,
  isImporting,
}: AdminHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Settings className="w-8 h-8 mr-3 text-blue-600" />
          Admin Panel
        </h1>
        <p className="text-gray-600 mt-1">Full control over your appointment system</p>
      </div>
      <div className="flex items-center space-x-3 w-full sm:w-auto">
        <Button
          className="flex-grow sm:flex-grow-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-200 rounded-lg px-6 py-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          onClick={onNewAppointmentClick}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onImport} disabled={isImporting}>
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportCSV} disabled={isExporting || filteredAppointmentsLength === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportXLSX} disabled={isExporting || filteredAppointmentsLength === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClearAll} className="text-red-600 focus:text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <input
          type="file"
          ref={fileInputRef}
          onChange={onImport}
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          className="hidden"
        />
      </div>
    </div>
  );
};

export default AdminHeader;