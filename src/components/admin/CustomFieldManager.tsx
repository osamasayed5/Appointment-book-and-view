import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { logActivity } from '@/utils/activityLogger';

interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  is_required: boolean;
}

interface CustomFieldManagerProps {
  customFields: CustomField[];
  onUpdate: () => void;
}

const CustomFieldManager = ({ customFields, onUpdate }: CustomFieldManagerProps) => {
  const [newField, setNewField] = useState({ label: '', type: 'text', is_required: false });
  const [error, setError] = useState('');

  const handleAddField = async () => {
    if (!newField.label.trim()) {
      setError('Field label cannot be empty.');
      return;
    }
    setError('');

    const fieldLabel = newField.label.trim();
    const name = fieldLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    const { error: insertError } = await supabase
      .from('custom_fields')
      .insert({
        ...newField,
        name,
        label: fieldLabel,
      });

    if (insertError) {
      toast.error(`Failed to add field: ${insertError.message}`);
    } else {
      toast.success('Custom field added successfully!');
      await logActivity(`Added custom field: ${fieldLabel}`);
      setNewField({ label: '', type: 'text', is_required: false });
      onUpdate();
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    const fieldToDelete = customFields.find(f => f.id === fieldId);
    if (window.confirm(`Are you sure you want to delete the custom field "${fieldToDelete?.label}"? This action cannot be undone.`)) {
      const { error: deleteError } = await supabase
        .from('custom_fields')
        .delete()
        .eq('id', fieldId);

      if (deleteError) {
        toast.error(`Failed to delete field: ${deleteError.message}`);
      } else {
        toast.success('Custom field deleted successfully!');
        await logActivity(`Deleted custom field: ${fieldToDelete?.label}`);
        onUpdate();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Manage Custom Fields</h3>
        <div className="p-4 border rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="field-label">Field Label</Label>
              <Input
                id="field-label"
                placeholder="e.g., Patient ID"
                value={newField.label}
                onChange={(e) => setNewField({ ...newField, label: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="field-type">Field Type</Label>
              <Select value={newField.type} onValueChange={(value) => setNewField({ ...newField, type: value })}>
                <SelectTrigger id="field-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="boolean">Checkbox (Yes/No)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="field-required"
              checked={newField.is_required}
              onCheckedChange={(checked) => setNewField({ ...newField, is_required: checked as boolean })}
            />
            <Label htmlFor="field-required">This field is required</Label>
          </div>
          {error && (
            <p className="text-red-600 text-xs flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {error}
            </p>
          )}
          <Button onClick={handleAddField}>
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="text-md font-medium text-gray-800 mb-3">Existing Custom Fields</h4>
        <div className="space-y-2">
          {customFields.length > 0 ? (
            customFields.map((field) => (
              <div key={field.id} className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                <div>
                  <span className="font-medium">{field.label}</span>
                  <span className="text-sm text-gray-500 ml-2">({field.type}){field.is_required ? ' *' : ''}</span>
                </div>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteField(field.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No custom fields have been added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomFieldManager;