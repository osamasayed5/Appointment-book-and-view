import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ServiceManagementForm from "@/components/ServiceManagementForm";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity } from '@/utils/activityLogger';
import { CustomField as CustomFieldType } from "@/types";

interface FormConfig {
  show_phone: boolean;
  require_phone: boolean;
  show_email: boolean;
  require_email: boolean;
  show_notes: boolean;
  require_notes: boolean;
  show_duration: boolean;
  require_duration: boolean;
  show_client_name: boolean;
  require_client_name: boolean;
  show_service: boolean;
  require_service: boolean;
  show_date: boolean;
  require_date: boolean;
  show_time: boolean;
  require_time: boolean;
}

interface SettingsFormProps {
  services: string[];
  onUpdateServices: (newServices: string[]) => void;
  formConfig: FormConfig;
  onUpdateFormConfig: (newConfig: Partial<FormConfig>) => void;
  customFields: CustomFieldType[];
  onUpdateCustomFields: () => void;
}

const SettingsForm = ({ services, onUpdateServices, formConfig, onUpdateFormConfig, customFields, onUpdateCustomFields }: SettingsFormProps) => {
  const [localConfig, setLocalConfig] = useState(formConfig);
  const [newField, setNewField] = useState<{label: string; type: CustomFieldType['type']; is_required: boolean; is_visible: boolean}>({ label: '', type: 'text', is_required: false, is_visible: true });
  const [error, setError] = useState('');

  useEffect(() => {
    setLocalConfig(formConfig);
  }, [formConfig]);

  const handleConfigChange = (key: keyof FormConfig, value: boolean) => {
    const newConfig = { ...localConfig, [key]: value };
    if (key === 'show_client_name' && !value) newConfig.require_client_name = false;
    if (key === 'show_service' && !value) newConfig.require_service = false;
    if (key === 'show_date' && !value) newConfig.require_date = false;
    if (key === 'show_time' && !value) newConfig.require_time = false;
    if (key === 'show_duration' && !value) newConfig.require_duration = false;
    if (key === 'show_phone' && !value) newConfig.require_phone = false;
    if (key === 'show_email' && !value) newConfig.require_email = false;
    if (key === 'show_notes' && !value) newConfig.require_notes = false;
    setLocalConfig(newConfig);
  };

  const handleSaveSettings = () => {
    onUpdateFormConfig(localConfig);
  };

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
      .insert({ ...newField, name, label: fieldLabel });

    if (insertError) {
      toast.error(`Failed to add field: ${insertError.message}`);
    } else {
      toast.success('Custom field added successfully!');
      await logActivity(`Added custom field: ${fieldLabel}`);
      setNewField({ label: '', type: 'text', is_required: false, is_visible: true });
      onUpdateCustomFields();
    }
  };

  const handleDeleteField = async (field: CustomFieldType) => {
    if (window.confirm(`Are you sure you want to delete the custom field "${field.label}"? This action cannot be undone.`)) {
      const { error: deleteError } = await supabase
        .from('custom_fields')
        .delete()
        .eq('id', field.id);

      if (deleteError) {
        toast.error(`Failed to delete field: ${deleteError.message}`);
      } else {
        toast.success('Custom field deleted successfully!');
        await logActivity(`Deleted custom field: ${field.label}`);
        onUpdateCustomFields();
      }
    }
  };

  const handleToggleCustomField = async (fieldId: string, property: 'is_visible' | 'is_required', value: boolean) => {
    const { error } = await supabase
      .from('custom_fields')
      .update({ [property]: value })
      .eq('id', fieldId);

    if (error) {
      toast.error(`Failed to update field: ${error.message}`);
    } else {
      toast.success('Field updated!');
      onUpdateCustomFields();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Customize Appointment Form</h3>
        <div className="p-4 border rounded-lg space-y-4">
          <h4 className="text-md font-medium text-gray-800">Standard Fields</h4>
          {/* Standard Fields */}
          <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
            <Label htmlFor="show-client-name" className="font-medium">Client Name Field</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch id="show-client-name" checked={localConfig.show_client_name} onCheckedChange={(checked) => handleConfigChange('show_client_name', checked)} />
                <Label htmlFor="show-client-name">Show</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="require-client-name" checked={localConfig.require_client_name} onCheckedChange={(checked) => handleConfigChange('require_client_name', checked as boolean)} disabled={!localConfig.show_client_name} />
                <Label htmlFor="require-client-name" className={!localConfig.show_client_name ? 'text-gray-400 cursor-not-allowed' : ''}>Required</Label>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
            <Label htmlFor="show-service" className="font-medium">Service Field</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch id="show-service" checked={localConfig.show_service} onCheckedChange={(checked) => handleConfigChange('show_service', checked)} />
                <Label htmlFor="show-service">Show</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="require-service" checked={localConfig.require_service} onCheckedChange={(checked) => handleConfigChange('require_service', checked as boolean)} disabled={!localConfig.show_service} />
                <Label htmlFor="require-service" className={!localConfig.show_service ? 'text-gray-400 cursor-not-allowed' : ''}>Required</Label>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
            <Label htmlFor="show-date" className="font-medium">Date Field</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch id="show-date" checked={localConfig.show_date} onCheckedChange={(checked) => handleConfigChange('show_date', checked)} />
                <Label htmlFor="show-date">Show</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="require-date" checked={localConfig.require_date} onCheckedChange={(checked) => handleConfigChange('require_date', checked as boolean)} disabled={!localConfig.show_date} />
                <Label htmlFor="require-date" className={!localConfig.show_date ? 'text-gray-400 cursor-not-allowed' : ''}>Required</Label>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
            <Label htmlFor="show-time" className="font-medium">Time Field</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch id="show-time" checked={localConfig.show_time} onCheckedChange={(checked) => handleConfigChange('show_time', checked)} />
                <Label htmlFor="show-time">Show</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="require-time" checked={localConfig.require_time} onCheckedChange={(checked) => handleConfigChange('require_time', checked as boolean)} disabled={!localConfig.show_time} />
                <Label htmlFor="require-time" className={!localConfig.show_time ? 'text-gray-400 cursor-not-allowed' : ''}>Required</Label>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
            <Label htmlFor="show-duration" className="font-medium">Duration Field</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch id="show-duration" checked={localConfig.show_duration} onCheckedChange={(checked) => handleConfigChange('show_duration', checked)} />
                <Label htmlFor="show-duration">Show</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="require-duration" checked={localConfig.require_duration} onCheckedChange={(checked) => handleConfigChange('require_duration', checked as boolean)} disabled={!localConfig.show_duration} />
                <Label htmlFor="require-duration" className={!localConfig.show_duration ? 'text-gray-400 cursor-not-allowed' : ''}>Required</Label>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
            <Label htmlFor="show-phone" className="font-medium">Phone Number Field</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch id="show-phone" checked={localConfig.show_phone} onCheckedChange={(checked) => handleConfigChange('show_phone', checked)} />
                <Label htmlFor="show-phone">Show</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="require-phone" checked={localConfig.require_phone} onCheckedChange={(checked) => handleConfigChange('require_phone', checked as boolean)} disabled={!localConfig.show_phone} />
                <Label htmlFor="require-phone" className={!localConfig.show_phone ? 'text-gray-400 cursor-not-allowed' : ''}>Required</Label>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
            <Label htmlFor="show-email" className="font-medium">Email Field</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch id="show-email" checked={localConfig.show_email} onCheckedChange={(checked) => handleConfigChange('show_email', checked)} />
                <Label htmlFor="show-email">Show</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="require-email" checked={localConfig.require_email} onCheckedChange={(checked) => handleConfigChange('require_email', checked as boolean)} disabled={!localConfig.show_email} />
                <Label htmlFor="require-email" className={!localConfig.show_email ? 'text-gray-400 cursor-not-allowed' : ''}>Required</Label>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
            <Label htmlFor="show-notes" className="font-medium">Notes Field</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch id="show-notes" checked={localConfig.show_notes} onCheckedChange={(checked) => handleConfigChange('show_notes', checked)} />
                <Label htmlFor="show-notes">Show</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="require-notes" checked={localConfig.require_notes} onCheckedChange={(checked) => handleConfigChange('require_notes', checked as boolean)} disabled={!localConfig.show_notes} />
                <Label htmlFor="require-notes" className={!localConfig.show_notes ? 'text-gray-400 cursor-not-allowed' : ''}>Required</Label>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings}>Save Standard Fields</Button>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="p-4 border rounded-lg space-y-4">
          <h4 className="text-md font-medium text-gray-800">Custom Fields</h4>
          {/* Existing Custom Fields */}
          <div className="space-y-2">
            {customFields.length > 0 ? (
              customFields.map((field) => (
                <div key={field.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-md bg-gray-50 gap-4">
                  <div>
                    <span className="font-medium">{field.label}</span>
                    <span className="text-sm text-gray-500 ml-2">({field.type})</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch id={`show-${field.id}`} checked={field.is_visible} onCheckedChange={(checked) => handleToggleCustomField(field.id, 'is_visible', checked)} />
                      <Label htmlFor={`show-${field.id}`}>Show</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id={`require-${field.id}`} checked={field.is_required} onCheckedChange={(checked) => handleToggleCustomField(field.id, 'is_required', checked as boolean)} disabled={!field.is_visible} />
                      <Label htmlFor={`require-${field.id}`} className={!field.is_visible ? 'text-gray-400 cursor-not-allowed' : ''}>Required</Label>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteField(field)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No custom fields have been added yet.</p>
            )}
          </div>

          <Separator className="my-4" />
          
          {/* Add New Custom Field */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Add New Custom Field</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="field-label">Field Label</Label>
                <Input id="field-label" placeholder="e.g., Patient ID" value={newField.label} onChange={(e) => setNewField({ ...newField, label: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="field-type">Field Type</Label>
                <Select value={newField.type} onValueChange={(value) => setNewField({ ...newField, type: value as CustomFieldType['type'] })}>
                  <SelectTrigger id="field-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="boolean">Checkbox (Yes/No)</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-4 mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="field-visible" checked={newField.is_visible} onCheckedChange={(checked) => setNewField({ ...newField, is_visible: checked as boolean })} />
                <Label htmlFor="field-visible">Visible by default</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="field-required" checked={newField.is_required} onCheckedChange={(checked) => setNewField({ ...newField, is_required: checked as boolean })} />
                <Label htmlFor="field-required">Required by default</Label>
              </div>
            </div>
            {error && <p className="text-red-600 text-xs flex items-center mt-2"><AlertCircle className="w-3 h-3 mr-1" />{error}</p>}
            <div className="mt-4">
              <Button onClick={handleAddField}><Plus className="w-4 h-4 mr-2" />Add Field</Button>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <ServiceManagementForm currentServices={services} onUpdateServices={onUpdateServices} />
    </div>
  );
};

export default SettingsForm;