# Blue Carbon Registry and MRV System

A Monitoring, Reporting & Verification (MRV) platform for blue carbon projects including mangrove restoration, seagrass conservation, and coastal wetland protection. This is a College Capstone/CEP Project.

## Features

- **Project Registry**: Register and track blue carbon restoration projects
- **Data Upload**: Upload drone imagery, satellite data, and IoT sensor measurements
- **AI-Powered Verification**: Automated validation of project data and carbon sequestration estimates
- **Blockchain-Based Credits**: Transparent carbon credit generation and tracking
- **Carbon Marketplace**: Buy and sell verified blue carbon credits
- **GIS Mapping**: Interactive geospatial visualization of restoration sites
- **IoT Monitoring**: Real-time environmental sensor data simulation
- **Verification Workflow**: Multi-stage project verification pipeline
- **Admin Dashboard**: Project review, fraud detection, and system monitoring
- **Multi-language Support**: English, Hindi, Tamil, Telugu
- **PWA Support**: Installable as a progressive web app

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Radix UI, Tailwind CSS
- **State Management**: React Context API
- **Data Visualization**: Recharts, Three.js
- **Maps**: Mapbox GL, Canvas-based interactive map
- **Animation**: GSAP
- **Internationalization**: i18next, react-i18next
- **Forms**: React Hook Form, Zod validation

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   ├── Navbar.tsx      # Main navigation
│   ├── UX4GFooter.tsx  # Footer with accessibility features
│   └── ...
├── contexts/           # React Context providers
│   ├── AuthContext.tsx     # Authentication & user management
│   ├── DataContext.tsx     # Project & credit data
│   ├── IoTContext.tsx      # Sensor simulation
│   ├── LanguageContext.tsx # i18n support
│   └── ...
├── pages/              # Page components
│   ├── LandingPage.tsx     # Public landing page
│   ├── Dashboard.tsx       # User dashboard
│   ├── Registry.tsx        # Verified projects registry
│   ├── Marketplace.tsx     # Carbon credit trading
│   ├── DataUpload.tsx      # Project data submission
│   ├── AdminPanel.tsx      # Admin verification panel
│   ├── GISMapping.tsx      # Geospatial visualization
│   ├── IoTSimulation.tsx   # IoT sensor monitoring
│   ├── VerificationWorkflow.tsx # Verification pipeline
│   ├── CarbonWallet.tsx    # Credit wallet
│   └── ...
├── locales/            # Translation files (en, hi, ta, te)
├── hooks/              # Custom React hooks
└── lib/                # Utility functions
```

## Default Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| NGO | ngo@example.com | ngo123 |
| Panchayat | panchayat@example.com | panchayat123 |
| Govt Officer | govadmin@example.com | govadmin123 |
| Researcher | researcher@example.com | researcher123 |
| Buyer | buyer@example.com | buyer123 |

## License

This project is developed for educational purposes as a College CEP (Capstone/Final Year) Project.