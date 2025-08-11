import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ServiceManagementForm from "@/components/ServiceManagementForm";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import CustomFieldManager from "./CustomFieldManager";

interface FormConfig {
  show_phone: boolean;
  require_phone: boolean;
  show_email: boolean;
  require_email: boolean;
  show_notes: boolean;
  require_notes: boolean;
}

interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  is_required: boolean;
}

interface SettingsFormProps {
  services: string[];
  onUpdateServices: (newServices: string[]) => void;
  formConfig: FormConfig;
  onUpdateFormConfig: (newConfig: Partial<FormConfig>) => void;
  customFields: CustomField[];
  onUpdateCustomFields: () => void;
}

const SettingsForm = ({ services, onUpdateServices, formConfig, onUpdateFormConfig, customFields, onUpdateCustomFields }: SettingsFormProps) => {
  const [localConfig, setLocalConfig] = useState(formConfig);

  useEffect(() => {
    setLocalConfig(formConfig);
  }, [formConfig]);

  const handleConfigChange = (key: keyof FormConfig, value: boolean) => {
    const newConfig = { ...localConfig, [key]: value };
    if (key === 'show_phone' && !value) newConfig.require_phone = false;
    if (key === 'show_email' && !value) newConfig.require_email = false;
    if (key === 'show_notes' && !value) newConfig.require_notes = false;
    setLocalConfig(newConfig);
  };

  const handleSaveSettings = () => {
    onUpdateFormConfig(localConfig);
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Customize Appointment Form</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
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
          <div className="flex items-center justify-between p-3 border rounded-lg">
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
          <div className="flex items-center justify-between p-3 border rounded-lg">
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
        </div>
      </div>

      <Separator />
      
      <CustomFieldManager customFields={customFields} onUpdate={onUpdateCustomFields} />

      <Separator />

      <ServiceManagementForm currentServices={services} onUpdateServices={onUpdateServices} />

      <div className="flex justify-end mt-6">
        <Button onClick={handleSaveSettings}>Save Form Settings</Button>
      </div>
    </div>
  );
};

export default SettingsForm;