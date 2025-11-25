import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Plus,
  Phone,
  Mail,
  Edit,
  Trash2,
  Star,
  CheckCircle2,
  Users,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useContacts } from "@/hooks/useContacts";
import { TrustedContact, CreateContactData, validatePhoneNumber, formatPhoneNumber } from "@/lib/contacts";

const TrustedContacts = () => {
  const navigate = useNavigate();
  const { contacts, primaryContact, loading, error, addContact, updateContact, deleteContact, verifyContactById, setAsPrimary } = useContacts();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<TrustedContact | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateContactData>({
    name: '',
    phoneNumber: '',
    email: '',
    relationship: 'family',
    isPrimary: false,
    notes: ''
  });

  const relationshipOptions = [
    { value: 'family', label: 'Family Member', icon: '👨‍👩‍👧‍👦' },
    { value: 'friend', label: 'Friend', icon: '👫' },
    { value: 'colleague', label: 'Colleague', icon: '💼' },
    { value: 'neighbor', label: 'Neighbor', icon: '🏘️' },
    { value: 'other', label: 'Other', icon: '👤' }
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      phoneNumber: '',
      email: '',
      relationship: 'family',
      isPrimary: false,
      notes: ''
    });
    setFormError(null);
  };

  const handleAddContact = async () => {
    setFormError(null);

    // Validation
    if (!formData.name.trim()) {
      setFormError('Please enter a name');
      return;
    }

    if (!formData.phoneNumber.trim()) {
      setFormError('Please enter a phone number');
      return;
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      setFormError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      await addContact(formData);
      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to add contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditContact = async () => {
    if (!selectedContact) return;

    setFormError(null);

    // Validation
    if (!formData.name.trim()) {
      setFormError('Please enter a name');
      return;
    }

    if (!formData.phoneNumber.trim()) {
      setFormError('Please enter a phone number');
      return;
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      setFormError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateContact(selectedContact.id, formData);
      setShowEditDialog(false);
      setSelectedContact(null);
      resetForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to update contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!selectedContact) return;

    setIsSubmitting(true);
    try {
      await deleteContact(selectedContact.id);
      setShowDeleteDialog(false);
      setSelectedContact(null);
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (contact: TrustedContact) => {
    setSelectedContact(contact);
    setFormData({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      email: contact.email || '',
      relationship: contact.relationship,
      isPrimary: contact.isPrimary,
      notes: contact.notes || ''
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (contact: TrustedContact) => {
    setSelectedContact(contact);
    setShowDeleteDialog(true);
  };

  const handleSetPrimary = async (contactId: string) => {
    try {
      await setAsPrimary(contactId);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleVerifyContact = async (contactId: string) => {
    try {
      await verifyContactById(contactId);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const getRelationshipInfo = (relationship: string) => {
    return relationshipOptions.find(opt => opt.value === relationship) || relationshipOptions[4];
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(-1)}
                className="p-1.5 sm:p-2"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-foreground">Trusted Contacts</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Manage your emergency contacts</p>
              </div>
            </div>
            <Button 
              size="sm"
              onClick={() => {
                resetForm();
                setShowAddDialog(true);
              }}
              className="h-8 sm:h-9"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Add Contact</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Primary Contact Highlight */}
        {primaryContact && (
          <Card className="mb-6 bg-primary/5 border-primary/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary fill-primary" />
                  <CardTitle className="text-base sm:text-lg">Primary Emergency Contact</CardTitle>
                </div>
                <Badge variant="default" className="bg-primary">Primary</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold text-lg">{primaryContact.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>{getRelationshipInfo(primaryContact.relationship).icon}</span>
                    <span>{getRelationshipInfo(primaryContact.relationship).label}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => window.open(`tel:${primaryContact.phoneNumber}`, '_self')}
                    className="flex-1 sm:flex-none"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        {contacts.length === 0 && !loading && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <Users className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-lg">No Contacts Yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add trusted contacts who can be reached in case of emergency
                  </p>
                </div>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Contacts List */}
        <div className="space-y-3">
          {contacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base sm:text-lg">{contact.name}</h3>
                          {contact.isPrimary && (
                            <Badge variant="default" className="text-xs">Primary</Badge>
                          )}
                          {contact.lastVerified && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        
                        <div className="mt-1 space-y-1">
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            <a 
                              href={`tel:${contact.phoneNumber}`}
                              className="hover:text-primary transition-colors"
                            >
                              {formatPhoneNumber(contact.phoneNumber)}
                            </a>
                          </p>
                          {contact.email && (
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              <a 
                                href={`mailto:${contact.email}`}
                                className="hover:text-primary transition-colors truncate"
                              >
                                {contact.email}
                              </a>
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span>{getRelationshipInfo(contact.relationship).icon}</span>
                            <span>{getRelationshipInfo(contact.relationship).label}</span>
                          </p>
                        </div>

                        {contact.notes && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            {contact.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 sm:shrink-0">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => window.open(`tel:${contact.phoneNumber}`, '_self')}
                      className="flex-1 sm:flex-none"
                    >
                      <Phone className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Call</span>
                    </Button>
                    
                    {!contact.isPrimary && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetPrimary(contact.id)}
                        className="flex-1 sm:flex-none"
                      >
                        <Star className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Set Primary</span>
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(contact)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openDeleteDialog(contact)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Banner */}
        {contacts.length > 0 && (
          <Card className="mt-6 bg-accent/5 border-accent/20">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Tip:</strong> Set a primary contact for quickest emergency access. 
                Verify contacts by calling them to ensure the numbers are correct.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Add Contact Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Trusted Contact</DialogTitle>
            <DialogDescription>
              Add someone you trust to contact in case of emergency
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {formError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="10-digit phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship *</Label>
              <Select 
                value={formData.relationship} 
                onValueChange={(value) => setFormData({ ...formData, relationship: value as TrustedContact['relationship'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {relationshipOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={formData.isPrimary}
                onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="isPrimary" className="cursor-pointer">
                Set as primary emergency contact
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddContact} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update contact information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {formError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number *</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="10-digit phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email (Optional)</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-relationship">Relationship *</Label>
              <Select 
                value={formData.relationship} 
                onValueChange={(value) => setFormData({ ...formData, relationship: value as TrustedContact['relationship'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {relationshipOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes (Optional)</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isPrimary"
                checked={formData.isPrimary}
                onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="edit-isPrimary" className="cursor-pointer">
                Set as primary emergency contact
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedContact(null);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEditContact} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedContact?.name}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TrustedContacts;
