import '@testing-library/jest-dom';

// Extender expect para assertions más útiles
(expect as any).extend({
  toBeInTheDocumentContainer(received: any, container: HTMLElement) {
    const pass = container ? container.contains(received) : false;
    if (pass) {
      return { message: () => `element ${received?.tagName} found in container`, pass: true };
    } else {
      return {
        message: () => `element ${received?.tagName} not found in container ${container?.tagName}`,
        pass: false,
      };
    }
  },

  toHaveErrorMessage(received: any, expected: string) {
    const errorElement = received?.querySelector?.('.error-message');
    const pass = errorElement?.textContent?.trim() === expected;
    if (pass) {
      return { message: () => `error message "${expected}" found`, pass: true };
    } else {
      return {
        message: () => `error message "${expected}" not found. Got: "${errorElement?.textContent?.trim()}"`,
        pass: false,
      };
    }
  },
});

// Mock global de Firebase (necesario para tests unitarios sin conexión real)
const mockFirebase = {
  auth: {
    currentUser: null,
    onAuthStateChanged: () => {},
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    signOut: jest.fn(),
  },
  firestore: {
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    getDocs: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
  },
};

(global as any).firebase = mockFirebase;
