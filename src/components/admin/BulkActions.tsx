import { CheckCircle, Clock, UserX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface BulkActionsProps {
  selectedAppointments: string[];
  selectAll: boolean;
  onSelectAll: (checked: boolean) => void;
  onBulkStatusChange: (status: string) => void;
  onBulkDelete: () => void;
}

const BulkActions = ({
  selectedAppointments,
  selectAll,
  onSelectAll,
  onBulkStatusChange,
  onBulkDelete
}: BulkActionsProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Checkbox
              id="select-all"
              checked={selectAll}
              onCheckedChange={onSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select All ({selectedAppointments.length})
            </label>
          </div>
          <div className="flex items-center justify-center sm:justify-end space-x-2 flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkStatusChange('confirmed')}
              disabled={selectedAppointments.length === 0}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Confirm
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkStatusChange('pending')}
              disabled={selectedAppointments.length === 0}
            >
              <Clock className="w-4 h-4 mr-1" />
              Pending
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkStatusChange('cancelled')}
              disabled={selectedAppointments.length === 0}
            >
              <UserX className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
              disabled={selectedAppointments.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkActions;