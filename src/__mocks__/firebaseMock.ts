// Mock de Firebase para tests unitarios
export const mockFirebase = {
  auth: {
    currentUser: null,
    onAuthStateChanged: (callback: (user: any) => void) => {
      callback(mockFirebase.auth.currentUser);
      return () => {}; // unsubscribe function
    },
    signInWithEmailAndPassword: jest.fn().mockResolvedValue({
      user: { uid: 'test-user-123', email: 'test@test.com' },
      operationType: 'signIn',
    }),
    createUserWithEmailAndPassword: jest.fn().mockResolvedValue({
      user: { uid: 'test-user-123', email: 'test@test.com' },
      operationType: 'signUp',
    }),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    signOut: jest.fn().mockResolvedValue(undefined),
  },
  firestore: {
    collection: () => ({
      getDocs: jest.fn().mockResolvedValue({
        docs: [],
        empty: true,
      }),
      doc: () => ({
        getDoc: jest.fn().mockResolvedValue({
          exists: () => false,
          data: () => null,
          id: 'test-doc',
        }),
        setDoc: jest.fn().mockResolvedValue(undefined),
        updateDoc: jest.fn().mockResolvedValue(undefined),
        deleteDoc: jest.fn().mockResolvedValue(undefined),
      }),
    }),
    doc: () => ({
      getDoc: jest.fn().mockResolvedValue({
        exists: () => false,
        data: () => null,
        id: 'test-doc',
      }),
      setDoc: jest.fn().mockResolvedValue(undefined),
      updateDoc: jest.fn().mockResolvedValue(undefined),
      deleteDoc: jest.fn().mockResolvedValue(undefined),
    }),
    addDoc: jest.fn().mockResolvedValue({ id: 'new-doc-id' }),
    query: () => ({
      where: () => ({
        orderBy: () => ({
          onSnapshot: () => ({}),
          getDocs: jest.fn().mockResolvedValue({ docs: [], empty: true }),
        }),
      }),
    }),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
  },
};

export default mockFirebase;
