import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Save, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ServiceManagementFormProps {
  currentServices: string[]; // Array of service names
  onUpdateServices: (newServices: string[]) => void; // Function to update services
}

const ServiceManagementForm = ({ currentServices, onUpdateServices }: ServiceManagementFormProps) => {
  const [newServiceInput, setNewServiceInput] = useState("");
  const [editingService, setEditingService] = useState<{ id: string; value: string } | null>(null);
  const [editingServiceValue, setEditingServiceValue] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateService = (service: string, isEditing = false, originalValue?: string) => {
    const newErrors: Record<string, string> = {};
    if (!service.trim()) {
      newErrors.service = "Service name cannot be empty.";
    } else if (
      currentServices.some(
        (s) =>
          s.toLowerCase() === service.toLowerCase() &&
          (!isEditing || (isEditing && originalValue?.toLowerCase() !== service.toLowerCase()))
      )
    ) {
      newErrors.service = "Service already exists.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddService = () => {
    if (validateService(newServiceInput)) {
      onUpdateServices([...currentServices, newServiceInput.trim()]);
      setNewServiceInput("");
      toast.success("Service added successfully!");
    }
  };

  const handleEditClick = (service: string) => {
    setEditingService({ id: service, value: service }); // Use service name as ID for editing
    setEditingServiceValue(service);
    setErrors({});
  };

  const handleSaveEdit = () => {
    if (editingService && validateService(editingServiceValue, true, editingService.value)) {
      const updatedServices = currentServices.map((s) =>
        s === editingService.value ? editingServiceValue.trim() : s
      );
      onUpdateServices(updatedServices);
      setEditingService(null);
      setEditingServiceValue("");
      toast.success("Service updated successfully!");
    }
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    setEditingServiceValue("");
    setErrors({});
  };

  const handleDeleteService = (serviceToDelete: string) => {
    const updatedServices = currentServices.filter((s) => s !== serviceToDelete);
    onUpdateServices(updatedServices);
    toast.success("Service deleted successfully!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Edit2 className="w-5 h-5 mr-2" />
          Manage Services
        </CardTitle>
        <CardDescription>Add, edit, or remove services offered for appointments.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Service */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Add New Service</label>
          <div className="flex space-x-2">
            <Input
              placeholder="e.g., Manicure, Pedicure"
              value={newServiceInput}
              onChange={(e) => {
                setNewServiceInput(e.target.value);
                if (errors.service) setErrors(prev => ({ ...prev, service: "" }));
              }}
              className={errors.service ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
            />
            <Button onClick={handleAddService}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
          {errors.service && (
            <p className="text-red-600 text-xs mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.service}
            </p>
          )}
        </div>

        {/* Current Services List */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Current Services ({currentServices.length})</h3>
          {currentServices.length === 0 ? (
            <p className="text-gray-500 text-sm">No services added yet. Use the field above to add one!</p>
          ) : (
            <div className="space-y-3">
              {currentServices.map((service, index) => (
                <div key={service} className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-gray-50">
                  {editingService?.id === service ? (
                    <div className="flex-1 flex items-center space-x-2">
                      <Input
                        value={editingServiceValue}
                        onChange={(e) => {
                          setEditingServiceValue(e.target.value);
                          if (errors.service) setErrors(prev => ({ ...prev, service: "" }));
                        }}
                        className={`flex-1 ${errors.service ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                      />
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Badge variant="secondary" className="text-base px-3 py-1">
                        {service}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(service)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently remove the service "{service}" from your list.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteService(service)}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceManagementForm;