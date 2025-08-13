import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

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
  is_visible: boolean;
}

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  title: string;
  existingAppointments?: any[];
  services: string[];
  onUpdateServices: (newServices: string[]) => void;
  formConfig: FormConfig;
  customFields: CustomField[];
}

const AppointmentForm = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  title, 
  existingAppointments = [],
  services, 
  onUpdateServices,
  formConfig,
  customFields
}: AppointmentFormProps) => {
  const getInitialFormData = () => ({
    clientName: initialData?.client_name || "",
    service: initialData?.service || "",
    customService: "", 
    date: initialData?.date || new Date().toISOString().split('T')[0],
    time: initialData?.time || "",
    duration: initialData?.duration || 30,
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    notes: initialData?.notes || "",
    customData: initialData?.custom_data || {},
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [timeConflict, setTimeConflict] = useState<string | null>(null);
  const [showCustomServiceInput, setShowCustomServiceInput] = useState(false);
  const [saveNewService, setSaveNewService] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initialFormData = getInitialFormData();
      const isCustomService = initialData && !services.includes(initialData.service);
      if (isCustomService) {
        initialFormData.service = "Other";
        initialFormData.customService = initialData.service;
      }
      setFormData(initialFormData);
      setShowCustomServiceInput(isCustomService);
      setErrors({});
      setTimeConflict(null);
      setSaveNewService(false);
    }
  }, [initialData, isOpen, services]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.clientName.trim()) newErrors.clientName = "Client name is required";
    if (!formData.service) newErrors.service = "Service selection is required";
    else if (formData.service === "Other" && !formData.customService.trim()) newErrors.customService = "Custom service name is required";
    if (!formData.time) newErrors.time = "Time is required";
    if (!formData.date) newErrors.date = "Date is required";
    
    if (formConfig.require_email && !formData.email.trim()) newErrors.email = "Email is required";
    if (formConfig.require_phone && !formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (formConfig.require_notes && !formData.notes.trim()) newErrors.notes = "Notes are required";

    customFields.forEach(field => {
      if (field.is_visible && field.is_required && (formData.customData[field.name] == null || formData.customData[field.name] === '')) {
        newErrors[field.name] = `${field.label} is required.`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkTimeConflict = () => {
    if (!formData.date || !formData.time || !formData.duration) return false;
    const appointmentTime = new Date(`${formData.date}T${formData.time}`);
    const appointmentEndTime = new Date(appointmentTime.getTime() + formData.duration * 60000);
    const hasConflict = existingAppointments.some(appointment => {
      if (appointment.id === initialData?.id || appointment.date !== formData.date) return false;
      const existingTime = new Date(`${appointment.date}T${appointment.time}`);
      const existingEndTime = new Date(existingTime.getTime() + appointment.duration * 60000);
      return (appointmentTime < existingEndTime && appointmentEndTime > existingTime);
    });
    if (hasConflict) {
      setTimeConflict("This time slot conflicts with an existing appointment");
      return true;
    }
    setTimeConflict(null);
    return false;
  };

  const handleSubmit = () => {
    if (validateForm() && !checkTimeConflict()) {
      let serviceToSave = formData.service === "Other" ? formData.customService.trim() : formData.service;
      if (formData.service === "Other" && saveNewService && serviceToSave && !services.includes(serviceToSave)) {
        onUpdateServices([...services, serviceToSave]);
        toast.success(`Service "${serviceToSave}" has been added to your services list.`);
      }
      onSave({ ...formData, service: serviceToSave });
      onClose();
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleCustomDataChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      customData: {
        ...prev.customData,
        [fieldName]: value,
      },
    }));
    if (errors[fieldName]) setErrors(prev => ({ ...prev, [fieldName]: "" }));
  };

  const handleServiceChange = (value: string) => {
    setShowCustomServiceInput(value === "Other");
    setFormData(prev => ({ ...prev, service: value, customService: "" }));
  };

  const renderCustomField = (field: CustomField) => {
    const value = formData.customData[field.name] || '';
    const error = errors[field.name];
    const className = error ? 'border-red-500' : '';

    switch (field.type) {
      case 'number':
        return <Input type="number" value={value} onChange={(e) => handleCustomDataChange(field.name, e.target.value)} className={className} />;
      case 'date':
        return <Input type="date" value={value} onChange={(e) => handleCustomDataChange(field.name, e.target.value)} className={className} />;
      case 'boolean':
        return <Checkbox checked={!!value} onCheckedChange={(checked) => handleCustomDataChange(field.name, checked)} />;
      case 'text':
      default:
        return <Input type="text" value={value} onChange={(e) => handleCustomDataChange(field.name, e.target.value)} className={className} />;
    }
  };

  if (!isOpen) return null;

  const visibleCustomFields = customFields.filter(f => f.is_visible);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200 animate-scaleIn">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">{title}</h2>
            <Button variant="ghost" size="sm" onClick={onClose}><X className="w-5 h-5" /></Button>
          </div>
          
          <div className="space-y-6">
            <div>
              <Label>Client Name *</Label>
              <Input value={formData.clientName} onChange={(e) => handleInputChange("clientName", e.target.value)} className={errors.clientName ? 'border-red-500' : ''} />
              {errors.clientName && <p className="text-red-600 text-xs mt-1">{errors.clientName}</p>}
            </div>

            <div>
              <Label>Service *</Label>
              <Select value={formData.service} onValueChange={handleServiceChange}>
                <SelectTrigger className={errors.service ? 'border-red-500' : ''}><SelectValue placeholder="Select a service" /></SelectTrigger>
                <SelectContent>
                  {services.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  <SelectItem value="Other">Other (Specify)</SelectItem>
                </SelectContent>
              </Select>
              {errors.service && <p className="text-red-600 text-xs mt-1">{errors.service}</p>}
            </div>

            {showCustomServiceInput && (
              <div>
                <Label>Custom Service Name *</Label>
                <Input value={formData.customService} onChange={(e) => handleInputChange("customService", e.target.value)} className={errors.customService ? 'border-red-500' : ''} />
                {errors.customService && <p className="text-red-600 text-xs mt-1">{errors.customService}</p>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={formData.date} onChange={(e) => handleInputChange("date", e.target.value)} className={errors.date ? 'border-red-500' : ''} />
                {errors.date && <p className="text-red-600 text-xs mt-1">{errors.date}</p>}
              </div>
              <div>
                <Label>Time *</Label>
                <Input type="time" value={formData.time} onChange={(e) => handleInputChange("time", e.target.value)} className={errors.time ? 'border-red-500' : ''} />
                {errors.time && <p className="text-red-600 text-xs mt-1">{errors.time}</p>}
              </div>
            </div>

            <div>
              <Label>Duration (minutes)</Label>
              <Select value={String(formData.duration)} onValueChange={(value) => handleInputChange("duration", Number(value))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">120 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formConfig.show_phone && (
              <div>
                <Label>Phone {formConfig.require_phone && '*'}</Label>
                <Input value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} className={errors.phone ? 'border-red-500' : ''} />
                {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
              </div>
            )}

            {formConfig.show_email && (
              <div>
                <Label>Email {formConfig.require_email && '*'}</Label>
                <Input type="email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} className={errors.email ? 'border-red-500' : ''} />
                {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
              </div>
            )}

            {formConfig.show_notes && (
              <div>
                <Label>Notes {formConfig.require_notes && '*'}</Label>
                <Textarea value={formData.notes} onChange={(e) => handleInputChange("notes", e.target.value)} />
                {errors.notes && <p className="text-red-600 text-xs mt-1">{errors.notes}</p>}
              </div>
            )}
            
            {visibleCustomFields.length > 0 && <Separator />}

            {visibleCustomFields.map(field => (
              <div key={field.id}>
                <Label>{field.label}{field.is_required ? ' *' : ''}</Label>
                {renderCustomField(field)}
                {errors[field.name] && <p className="text-red-600 text-xs mt-1">{errors[field.name]}</p>}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-3 mt-8">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}><Save className="w-4 h-4 mr-2" />Save</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentForm;