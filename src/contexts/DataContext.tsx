import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Project {
  id: string;
  name: string;
  description: string;
  userId: string;
  gpsCoordinates: {
    lat: number;
    lng: number;
  };
  images: string[];
  dataFiles: string[];
  dateCreated: string;
  verified: boolean;
  treeCount: number;
  biomass: number; // in tons
  co2Sequestered: number; // in tons
  creditsGenerated: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CarbonCredit {
  id: string;
  projectId: string;
  amount: number;
  price: number;
  sellerId: string;
  buyerId?: string;
  status: 'available' | 'sold' | 'reserved';
  createdAt: string;
}

export interface Transaction {
  id: string;
  creditId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  totalPrice: number;
  timestamp: string;
}

interface DataContextType {
  projects: Project[];
  credits: CarbonCredit[];
  transactions: Transaction[];
  createProject: (project: Omit<Project, 'id' | 'dateCreated' | 'verified' | 'creditsGenerated' | 'status'>) => void;
  approveProject: (projectId: string) => void;
  rejectProject: (projectId: string) => void;
  listCreditsForSale: (projectId: string, amount: number, price: number) => void;
  purchaseCredits: (creditId: string, buyerId: string) => boolean;
  getUserProjects: (userId: string) => Project[];
  getAvailableCredits: () => CarbonCredit[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Helper functions for dummy calculations
const calculateTreeCount = (images: string[]): number => {
  // Dummy calculation based on number of images
  return Math.floor(Math.random() * 500) + 100;
};

const calculateBiomass = (treeCount: number): number => {
  // Dummy: ~0.5 tons per tree on average
  return Math.round(treeCount * 0.5 * 100) / 100;
};

const calculateCO2Sequestered = (biomass: number): number => {
  // Dummy: 1 ton biomass = ~1.83 tons CO2
  return Math.round(biomass * 1.83 * 100) / 100;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [credits, setCredits] = useState<CarbonCredit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Initialize with sample data if localStorage is empty
    const storedProjects = localStorage.getItem('bluecarbon_projects');
    if (!storedProjects) {
      const sampleProjects: Project[] = [
        {
          id: '1',
          name: 'Mangrove Restoration - Sundarbans',
          description: 'Large scale mangrove restoration project in the Sundarbans delta',
          userId: '2',
          gpsCoordinates: { lat: 21.9497, lng: 88.2516 },
          images: ['mangrove1.jpg', 'mangrove2.jpg'],
          dataFiles: ['iot_data.csv'],
          dateCreated: new Date(Date.now() - 86400000 * 30).toISOString(),
          verified: true,
          treeCount: 2500,
          biomass: 1250,
          co2Sequestered: 2287.5,
          creditsGenerated: 2287,
          status: 'approved',
        },
        {
          id: '2',
          name: 'Coastal Afforestation - Kerala',
          description: 'Coastal afforestation project to prevent soil erosion',
          userId: '2',
          gpsCoordinates: { lat: 10.8505, lng: 76.2711 },
          images: ['coastal1.jpg'],
          dataFiles: ['satellite_data.csv'],
          dateCreated: new Date(Date.now() - 86400000 * 15).toISOString(),
          verified: false,
          treeCount: 1200,
          biomass: 600,
          co2Sequestered: 1098,
          creditsGenerated: 0,
          status: 'pending',
        },
      ];
      
      localStorage.setItem('bluecarbon_projects', JSON.stringify(sampleProjects));
      setProjects(sampleProjects);
    } else {
      setProjects(JSON.parse(storedProjects));
    }

    const storedCredits = localStorage.getItem('bluecarbon_credits');
    if (!storedCredits) {
      const sampleCredits: CarbonCredit[] = [
        {
          id: '1',
          projectId: '1',
          amount: 1000,
          price: 25,
          sellerId: '2',
          status: 'available',
          createdAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem('bluecarbon_credits', JSON.stringify(sampleCredits));
      setCredits(sampleCredits);
    } else {
      setCredits(JSON.parse(storedCredits));
    }

    const storedTransactions = localStorage.getItem('bluecarbon_transactions');
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    }
  }, []);

  const createProject = (projectData: Omit<Project, 'id' | 'dateCreated' | 'verified' | 'creditsGenerated' | 'status'>) => {
    const treeCount = calculateTreeCount(projectData.images);
    const biomass = calculateBiomass(treeCount);
    const co2Sequestered = calculateCO2Sequestered(biomass);

    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
      dateCreated: new Date().toISOString(),
      verified: false,
      treeCount,
      biomass,
      co2Sequestered,
      creditsGenerated: 0,
      status: 'pending',
    };

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    localStorage.setItem('bluecarbon_projects', JSON.stringify(updatedProjects));
  };

  const approveProject = (projectId: string) => {
    const updatedProjects = projects.map(project => 
      project.id === projectId 
        ? { 
            ...project, 
            verified: true, 
            status: 'approved' as const,
            creditsGenerated: Math.floor(project.co2Sequestered)
          }
        : project
    );
    setProjects(updatedProjects);
    localStorage.setItem('bluecarbon_projects', JSON.stringify(updatedProjects));
  };

  const rejectProject = (projectId: string) => {
    const updatedProjects = projects.map(project => 
      project.id === projectId 
        ? { ...project, status: 'rejected' as const }
        : project
    );
    setProjects(updatedProjects);
    localStorage.setItem('bluecarbon_projects', JSON.stringify(updatedProjects));
  };

  const listCreditsForSale = (projectId: string, amount: number, price: number) => {
    const project = projects.find(p => p.id === projectId);
    if (!project || !project.verified) return;

    const newCredit: CarbonCredit = {
      id: Date.now().toString(),
      projectId,
      amount,
      price,
      sellerId: project.userId,
      status: 'available',
      createdAt: new Date().toISOString(),
    };

    const updatedCredits = [...credits, newCredit];
    setCredits(updatedCredits);
    localStorage.setItem('bluecarbon_credits', JSON.stringify(updatedCredits));
  };

  const purchaseCredits = (creditId: string, buyerId: string): boolean => {
    const credit = credits.find(c => c.id === creditId);
    if (!credit || credit.status !== 'available') return false;

    const updatedCredits = credits.map(c => 
      c.id === creditId 
        ? { ...c, status: 'sold' as const, buyerId }
        : c
    );

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      creditId,
      buyerId,
      sellerId: credit.sellerId,
      amount: credit.amount,
      totalPrice: credit.amount * credit.price,
      timestamp: new Date().toISOString(),
    };

    const updatedTransactions = [...transactions, newTransaction];

    setCredits(updatedCredits);
    setTransactions(updatedTransactions);
    localStorage.setItem('bluecarbon_credits', JSON.stringify(updatedCredits));
    localStorage.setItem('bluecarbon_transactions', JSON.stringify(updatedTransactions));

    return true;
  };

  const getUserProjects = (userId: string) => {
    return projects.filter(project => project.userId === userId);
  };

  const getAvailableCredits = () => {
    return credits.filter(credit => credit.status === 'available');
  };

  return (
    <DataContext.Provider
      value={{
        projects,
        credits,
        transactions,
        createProject,
        approveProject,
        rejectProject,
        listCreditsForSale,
        purchaseCredits,
        getUserProjects,
        getAvailableCredits,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};