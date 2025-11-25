import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  TrustedContact,
  CreateContactData,
  getTrustedContacts,
  addTrustedContact,
  updateTrustedContact,
  deleteTrustedContact,
  verifyContact,
  setPrimaryContact,
  subscribeTrustedContacts,
  getPrimaryContact
} from '@/lib/contacts';

interface UseContactsReturn {
  contacts: TrustedContact[];
  primaryContact: TrustedContact | null;
  loading: boolean;
  error: string | null;
  addContact: (contactData: CreateContactData) => Promise<void>;
  updateContact: (contactId: string, updates: Partial<CreateContactData>) => Promise<void>;
  deleteContact: (contactId: string) => Promise<void>;
  verifyContactById: (contactId: string) => Promise<void>;
  setAsPrimary: (contactId: string) => Promise<void>;
  refreshContacts: () => Promise<void>;
}

export const useContacts = (): UseContactsReturn => {
  const { currentUser } = useAuth();
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [primaryContact, setPrimaryContactState] = useState<TrustedContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time subscription to contacts
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupSubscription = () => {
      setLoading(true);
      setError(null);

      unsubscribe = subscribeTrustedContacts(
        currentUser,
        (updatedContacts) => {
          setContacts(updatedContacts);
          // Update primary contact
          const primary = updatedContacts.find(c => c.isPrimary) || null;
          setPrimaryContactState(primary);
          setLoading(false);
        },
        (error) => {
          console.error('Contacts subscription error:', error);
          setError(error.message);
          setLoading(false);
        }
      );
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser]);

  const addContact = async (contactData: CreateContactData): Promise<void> => {
    try {
      setError(null);
      await addTrustedContact(contactData, currentUser);
      // Real-time subscription will automatically update the list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add contact';
      setError(errorMessage);
      throw error;
    }
  };

  const updateContact = async (
    contactId: string,
    updates: Partial<CreateContactData>
  ): Promise<void> => {
    try {
      setError(null);
      await updateTrustedContact(contactId, updates, currentUser);
      // Real-time subscription will automatically update the list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update contact';
      setError(errorMessage);
      throw error;
    }
  };

  const deleteContact = async (contactId: string): Promise<void> => {
    try {
      setError(null);
      await deleteTrustedContact(contactId, currentUser);
      // Real-time subscription will automatically update the list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete contact';
      setError(errorMessage);
      throw error;
    }
  };

  const verifyContactById = async (contactId: string): Promise<void> => {
    try {
      setError(null);
      await verifyContact(contactId, currentUser);
      // Real-time subscription will automatically update the list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify contact';
      setError(errorMessage);
      throw error;
    }
  };

  const setAsPrimary = async (contactId: string): Promise<void> => {
    try {
      setError(null);
      await setPrimaryContact(contactId, currentUser);
      // Real-time subscription will automatically update the list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set primary contact';
      setError(errorMessage);
      throw error;
    }
  };

  const refreshContacts = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const updatedContacts = await getTrustedContacts(currentUser);
      setContacts(updatedContacts);
      const primary = await getPrimaryContact(currentUser);
      setPrimaryContactState(primary);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh contacts';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    contacts,
    primaryContact,
    loading,
    error,
    addContact,
    updateContact,
    deleteContact,
    verifyContactById,
    setAsPrimary,
    refreshContacts
  };
};
