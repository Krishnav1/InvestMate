


import React, { useState } from 'react';
import Layout from './components/Layout';
import Feed from './components/Feed';
import ChatRoom from './components/ChatRoom';
import Clubs from './components/Clubs';
import Profile from './components/Profile';
import BiometricAuth from './components/BiometricAuth';
import DemoShowcase from './components/DemoShowcase';
import { Tab } from './types';
import { AppProvider } from './context/AppContext';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.FEED);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.FEED:
        return <Feed />;
      case Tab.CHAT:
        return <ChatRoom />;
      case Tab.CLUBS:
        return <Clubs />;
      case Tab.PROFILE:
        return <Profile />;
      default:
        return <Feed />;
    }
  };

  return (
    <>
        <Layout activeTab={activeTab} onTabChange={setActiveTab}>
            {renderContent()}
        </Layout>
        <DemoShowcase />
    </>
  );
};

const App: React.FC = () => {
  return (
    <BiometricAuth>
        <AppProvider>
          <MainApp />
        </AppProvider>
    </BiometricAuth>
  );
};

export default App;
