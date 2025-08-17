import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Save, AlertCircle, User, Briefcase, Calendar, Clock, Phone, Mail, FileText, Settings } from "lucide-react";
import { toast } from "sonner";

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

interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'link';
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
  const [showCustomServiceInput, setShowCustomServiceInput] = useState(false);
  const [timeParts, setTimeParts] = useState({ hour: '09', minute: '00', ampm: 'AM' });

  const to12h = (time24: string) => {
    if (!time24) return { hour: '09', minute: '00', ampm: 'AM' };
    const [h, m] = time24.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    let hour12 = hour % 12;
    if (hour12 === 0) hour12 = 12;
    return {
        hour: String(hour12).padStart(2, '0'),
        minute: m,
        ampm: ampm
    };
  };

  const to24h = (parts: { hour: string, minute: string, ampm: string }) => {
      let hour = parseInt(parts.hour, 10);
      if (parts.ampm === 'PM' && hour < 12) hour += 12;
      if (parts.ampm === 'AM' && hour === 12) hour = 0;
      return `${String(hour).padStart(2, '0')}:${parts.minute}`;
  };

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
      
      if (initialData?.time) {
        setTimeParts(to12h(initialData.time));
      } else {
        setTimeParts({ hour: '09', minute: '00', ampm: 'AM' });
      }
    }
  }, [initialData, isOpen, services]);

  useEffect(() => {
    handleInputChange('time', to24h(timeParts));
  }, [timeParts]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (formConfig.require_client_name && !formData.clientName.trim()) newErrors.clientName = "Client name is required";
    if (formConfig.require_service && !formData.service) newErrors.service = "Service selection is required";
    else if (formConfig.require_service && formData.service === "Other" && !formData.customService.trim()) newErrors.customService = "Custom service name is required";
    if (formConfig.require_time && !formData.time) newErrors.time = "Time is required";
    if (formConfig.require_date && !formData.date) newErrors.date = "Date is required";
    
    if (formConfig.require_duration && !formData.duration) newErrors.duration = "Duration is required";
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
      toast.error("This time slot conflicts with an existing appointment.");
      return true;
    }
    return false;
  };

  const handleSubmit = () => {
    if (validateForm() && !checkTimeConflict()) {
      let serviceToSave = formData.service === "Other" ? formData.customService.trim() : formData.service;
      if (formData.service === "Other" && serviceToSave && !services.includes(serviceToSave)) {
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
        return <div className="flex items-center space-x-2 pt-2"><Checkbox checked={!!value} onCheckedChange={(checked) => handleCustomDataChange(field.name, checked)} /><Label>{field.label}</Label></div>;
      case 'link':
        return <Input type="url" placeholder="https://example.com" value={value} onChange={(e) => handleCustomDataChange(field.name, e.target.value)} className={className} />;
      case 'text':
      default:
        return <Input type="text" value={value} onChange={(e) => handleCustomDataChange(field.name, e.target.value)} className={className} />;
    }
  };

  const visibleCustomFields = customFields.filter(f => f.is_visible);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Fill in the details below. Fields marked with * are required.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] p-1 pr-4">
          <div className="space-y-6 py-4 px-2">
            {/* Core Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Core Details</h3>
              {formConfig.show_client_name && (
                <div>
                  <Label htmlFor="clientName">Client Name {formConfig.require_client_name && '*'}</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="clientName" value={formData.clientName} onChange={(e) => handleInputChange("clientName", e.target.value)} className={`pl-10 ${errors.clientName ? 'border-red-500' : ''}`} />
                  </div>
                  {errors.clientName && <p className="text-red-600 text-xs mt-1">{errors.clientName}</p>}
                </div>
              )}
              {formConfig.show_service && (
                <div>
                  <Label>Service {formConfig.require_service && '*'}</Label>
                  <Select value={formData.service} onValueChange={handleServiceChange}>
                    <SelectTrigger className={errors.service ? 'border-red-500' : ''}><SelectValue placeholder="Select a service" /></SelectTrigger>
                    <SelectContent>
                      {services.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      <SelectItem value="Other">Other (Specify)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.service && <p className="text-red-600 text-xs mt-1">{errors.service}</p>}
                </div>
              )}
              {formConfig.show_service && showCustomServiceInput && (
                <div>
                  <Label>Custom Service Name {formConfig.require_service && '*'}</Label>
                  <Input value={formData.customService} onChange={(e) => handleInputChange("customService", e.target.value)} className={errors.customService ? 'border-red-500' : ''} />
                  {errors.customService && <p className="text-red-600 text-xs mt-1">{errors.customService}</p>}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formConfig.show_date && (
                  <div>
                    <Label>Date {formConfig.require_date && '*'}</Label>
                    <Input type="date" value={formData.date} onChange={(e) => handleInputChange("date", e.target.value)} className={errors.date ? 'border-red-500' : ''} />
                    {errors.date && <p className="text-red-600 text-xs mt-1">{errors.date}</p>}
                  </div>
                )}
                {formConfig.show_time && (
                  <div>
                    <Label>Time {formConfig.require_time && '*'}</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={timeParts.hour} onValueChange={(h) => setTimeParts(p => ({ ...p, hour: h }))}><SelectTrigger className={errors.time ? 'border-red-500' : ''}><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent></Select>
                      <Select value={timeParts.minute} onValueChange={(m) => setTimeParts(p => ({ ...p, minute: m }))}><SelectTrigger className={errors.time ? 'border-red-500' : ''}><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                      <Select value={timeParts.ampm} onValueChange={(a) => setTimeParts(p => ({ ...p, ampm: a }))}><SelectTrigger className={errors.time ? 'border-red-500' : ''}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="AM">AM</SelectItem><SelectItem value="PM">PM</SelectItem></SelectContent></Select>
                    </div>
                    {errors.time && <p className="text-red-600 text-xs mt-1">{errors.time}</p>}
                  </div>
                )}
              </div>
              {formConfig.show_duration && (
                <div>
                  <Label>Duration (minutes) {formConfig.require_duration && '*'}</Label>
                  <Select value={String(formData.duration)} onValueChange={(value) => handleInputChange("duration", Number(value))}><SelectTrigger className={errors.duration ? 'border-red-500' : ''}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="15">15</SelectItem><SelectItem value="30">30</SelectItem><SelectItem value="45">45</SelectItem><SelectItem value="60">60</SelectItem><SelectItem value="90">90</SelectItem><SelectItem value="120">120</SelectItem></SelectContent></Select>
                  {errors.duration && <p className="text-red-600 text-xs mt-1">{errors.duration}</p>}
                </div>
              )}
            </div>
            <Separator />
            {/* Contact Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>
            </div>
            {formConfig.show_notes && (
              <div>
                <Label>Notes {formConfig.require_notes && '*'}</Label>
                <Textarea value={formData.notes} onChange={(e) => handleInputChange("notes", e.target.value)} />
                {errors.notes && <p className="text-red-600 text-xs mt-1">{errors.notes}</p>}
              </div>
            )}
            {visibleCustomFields.length > 0 && <Separator />}
            {/* Custom Fields Section */}
            {visibleCustomFields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Additional Information</h3>
                {visibleCustomFields.map(field => (
                  <div key={field.id}>
                    {field.type !== 'boolean' && <Label>{field.label}{field.is_required ? ' *' : ''}</Label>}
                    {renderCustomField(field)}
                    {errors[field.name] && <p className="text-red-600 text-xs mt-1">{errors[field.name]}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}><Save className="w-4 h-4 mr-2" />Save Appointment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentForm;