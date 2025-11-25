import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from 'firebase/auth';

const COLLECTIONS = {
  TRUSTED_CONTACTS: 'trustedContacts'
};

export interface TrustedContact {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  email?: string;
  relationship: 'family' | 'friend' | 'colleague' | 'neighbor' | 'other';
  isPrimary: boolean; // Primary emergency contact
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  lastVerified?: Date;
}

export interface CreateContactData {
  name: string;
  phoneNumber: string;
  email?: string;
  relationship: TrustedContact['relationship'];
  isPrimary?: boolean;
  notes?: string;
}

/**
 * Add a new trusted contact
 */
export const addTrustedContact = async (
  contactData: CreateContactData,
  user: User | null
): Promise<string> => {
  if (!user) {
    throw new Error('You must be signed in to add contacts');
  }

  try {
    // If this is being set as primary, unset any other primary contacts first
    if (contactData.isPrimary) {
      await unsetPrimaryContacts(user.uid);
    }

    const contact: Partial<Omit<TrustedContact, 'id'>> & {
      userId: string;
      name: string;
      phoneNumber: string;
      relationship: TrustedContact['relationship'];
      isPrimary: boolean;
      createdAt: Date;
      updatedAt: Date;
    } = {
      userId: user.uid,
      name: contactData.name.trim(),
      phoneNumber: contactData.phoneNumber.trim(),
      relationship: contactData.relationship,
      isPrimary: contactData.isPrimary || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Only add optional fields if they have values (Firestore doesn't allow undefined)
    if (contactData.email?.trim()) {
      contact.email = contactData.email.trim();
    }
    if (contactData.notes?.trim()) {
      contact.notes = contactData.notes.trim();
    }

    const docRef = await addDoc(collection(db, COLLECTIONS.TRUSTED_CONTACTS), contact);
    return docRef.id;
  } catch (error) {
    console.error('Error adding trusted contact:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Missing or insufficient permissions')) {
        throw new Error('Firestore permission denied. Please check your Firebase security rules.');
      }
      if (error.message.includes('PERMISSION_DENIED')) {
        throw new Error('Database access denied. Please ensure Firestore is enabled in Firebase Console.');
      }
      throw new Error(`Failed to add contact: ${error.message}`);
    }
    
    throw new Error('Failed to add contact. Please try again.');
  }
};

/**
 * Get all trusted contacts for a user
 */
export const getTrustedContacts = async (user: User | null): Promise<TrustedContact[]> => {
  if (!user) {
    return [];
  }

  try {
    const contactsQuery = query(
      collection(db, COLLECTIONS.TRUSTED_CONTACTS),
      where('userId', '==', user.uid)
    );

    const snapshot = await getDocs(contactsQuery);
    const contacts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      lastVerified: doc.data().lastVerified?.toDate()
    } as TrustedContact));

    // Sort in memory: primary first, then by creation date
    return contacts.sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error) {
    console.error('Error fetching trusted contacts:', error);
    throw new Error('Failed to load contacts');
  }
};

/**
 * Subscribe to real-time updates for trusted contacts
 */
export const subscribeTrustedContacts = (
  user: User | null,
  onUpdate: (contacts: TrustedContact[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  if (!user) {
    onUpdate([]);
    return () => {};
  }

  try {
    const contactsQuery = query(
      collection(db, COLLECTIONS.TRUSTED_CONTACTS),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      contactsQuery,
      (snapshot) => {
        const contacts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          lastVerified: doc.data().lastVerified?.toDate()
        } as TrustedContact));
        
        // Sort in memory: primary first, then by creation date
        const sortedContacts = contacts.sort((a, b) => {
          if (a.isPrimary && !b.isPrimary) return -1;
          if (!a.isPrimary && b.isPrimary) return 1;
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
        
        onUpdate(sortedContacts);
      },
      (error) => {
        console.error('Error in contacts subscription:', error);
        onError(new Error('Failed to sync contacts'));
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up contacts subscription:', error);
    onError(error instanceof Error ? error : new Error('Failed to subscribe to contacts'));
    return () => {};
  }
};

/**
 * Update an existing contact
 */
export const updateTrustedContact = async (
  contactId: string,
  updates: Partial<CreateContactData>,
  user: User | null
): Promise<void> => {
  if (!user) {
    throw new Error('You must be signed in to update contacts');
  }

  try {
    // If setting this as primary, unset other primary contacts first
    if (updates.isPrimary) {
      await unsetPrimaryContacts(user.uid, contactId);
    }

    const updateData: Partial<TrustedContact> & { updatedAt: Date } = {
      ...updates,
      updatedAt: new Date()
    };

    // Clean up undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    await updateDoc(doc(db, COLLECTIONS.TRUSTED_CONTACTS, contactId), updateData);
  } catch (error) {
    console.error('Error updating contact:', error);
    throw new Error('Failed to update contact');
  }
};

/**
 * Delete a contact
 */
export const deleteTrustedContact = async (
  contactId: string,
  user: User | null
): Promise<void> => {
  if (!user) {
    throw new Error('You must be signed in to delete contacts');
  }

  try {
    await deleteDoc(doc(db, COLLECTIONS.TRUSTED_CONTACTS, contactId));
  } catch (error) {
    console.error('Error deleting contact:', error);
    throw new Error('Failed to delete contact');
  }
};

/**
 * Mark a contact as verified (user confirmed phone number works)
 */
export const verifyContact = async (
  contactId: string,
  user: User | null
): Promise<void> => {
  if (!user) {
    throw new Error('You must be signed in to verify contacts');
  }

  try {
    await updateDoc(doc(db, COLLECTIONS.TRUSTED_CONTACTS, contactId), {
      lastVerified: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error verifying contact:', error);
    throw new Error('Failed to verify contact');
  }
};

/**
 * Set a contact as primary emergency contact
 */
export const setPrimaryContact = async (
  contactId: string,
  user: User | null
): Promise<void> => {
  if (!user) {
    throw new Error('You must be signed in');
  }

  try {
    // First, unset all other primary contacts
    await unsetPrimaryContacts(user.uid, contactId);

    // Then set this one as primary
    await updateDoc(doc(db, COLLECTIONS.TRUSTED_CONTACTS, contactId), {
      isPrimary: true,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error setting primary contact:', error);
    throw new Error('Failed to set primary contact');
  }
};

/**
 * Helper: Unset all primary contacts for a user (except optionally one)
 */
const unsetPrimaryContacts = async (
  userId: string,
  exceptContactId?: string
): Promise<void> => {
  try {
    const primaryQuery = query(
      collection(db, COLLECTIONS.TRUSTED_CONTACTS),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(primaryQuery);
    
    // Filter for primary contacts in memory
    const updates = snapshot.docs
      .filter(doc => {
        const data = doc.data();
        return data.isPrimary === true && doc.id !== exceptContactId;
      })
      .map(doc => 
        updateDoc(doc.ref, { 
          isPrimary: false,
          updatedAt: new Date()
        })
      );

    await Promise.all(updates);
  } catch (error) {
    console.error('Error unsetting primary contacts:', error);
    // Don't throw - this is a helper function
  }
};

/**
 * Get primary emergency contact
 */
export const getPrimaryContact = async (user: User | null): Promise<TrustedContact | null> => {
  if (!user) {
    return null;
  }

  try {
    const primaryQuery = query(
      collection(db, COLLECTIONS.TRUSTED_CONTACTS),
      where('userId', '==', user.uid)
    );

    const snapshot = await getDocs(primaryQuery);
    
    // Find primary contact in memory
    const primaryDoc = snapshot.docs.find(doc => doc.data().isPrimary === true);
    
    if (!primaryDoc) {
      return null;
    }

    return {
      id: primaryDoc.id,
      ...primaryDoc.data(),
      createdAt: primaryDoc.data().createdAt?.toDate() || new Date(),
      updatedAt: primaryDoc.data().updatedAt?.toDate() || new Date(),
      lastVerified: primaryDoc.data().lastVerified?.toDate()
    } as TrustedContact;
  } catch (error) {
    console.error('Error getting primary contact:', error);
    return null;
  }
};

/**
 * Validate phone number format (basic validation)
 */
export const validatePhoneNumber = (phone: string): boolean => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Indian phone numbers are typically 10 digits
  // Can also include country code (+91) making it 12 digits
  return cleaned.length === 10 || cleaned.length === 12;
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    // Format as: (XXX) XXX-XXXX
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    // Format with country code: +91 XXXXX-XXXXX
    return `+91 ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
};
