import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AdminPasscodePromptProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AdminPasscodePrompt: React.FC<AdminPasscodePromptProps> = ({ onSuccess, onCancel }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleVerify = () => {
    const expectedPasscode = import.meta.env.VITE_ADMIN_PASSCODE;

    if (!expectedPasscode) {
      setError("Admin passcode is not configured. Please set VITE_ADMIN_PASSCODE in your .env file.");
      toast.error("Admin passcode not configured.");
      return;
    }

    if (passcode === expectedPasscode) {
      onSuccess();
      setPasscode('');
      setError(null);
      toast.success("Admin access granted!");
    } else {
      setError("Incorrect passcode. Please try again.");
      toast.error("Incorrect passcode.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-160px)]">
      <Card className="w-full max-w-sm p-6 shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center">
            <Lock className="w-6 h-6 mr-2 text-blue-600" />
            Admin Access
          </CardTitle>
          <CardDescription className="mt-2 text-gray-600">
            Enter the admin passcode to access the admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Enter passcode"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={handleKeyDown}
              className={error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
            />
            {error && (
              <p className="text-red-600 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {error}
              </p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleVerify}>
              Verify
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPasscodePrompt;