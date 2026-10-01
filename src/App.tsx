/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { QuickSearchModal } from './components/QuickSearchModal';
import { ShiftHandoverModal } from './components/ShiftHandoverModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { LoginModal } from './components/LoginModal';
import { WhatsAppPayload } from './services/whatsapp';
import { DeliveryItem } from './types';

// Views
import { DashboardView } from './views/DashboardView';
import { AccessControlView } from './views/AccessControlView';
import { CCTVView } from './views/CCTVView';
import { DeliveriesView } from './views/DeliveriesView';
import { NoticesView } from './views/NoticesView';
import { VisitorsView } from './views/VisitorsView';
import { ContractorsView } from './views/ContractorsView';
import { PublicAgentsView } from './views/PublicAgentsView';
import { VehiclesView } from './views/VehiclesView';
import { ApartmentsView } from './views/ApartmentsView';
import { ResidentsView } from './views/ResidentsView';
import { OccurrencesView } from './views/OccurrencesView';
import { OtherControlsView } from './views/OtherControlsView';
import { ReportsView } from './views/ReportsView';
import { AdminSettingsView } from './views/AdminSettingsView';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isNewDeliveryModalOpen, setIsNewDeliveryModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [whatsAppPayload, setWhatsAppPayload] = useState<WhatsAppPayload | null>(null);

  // Cross-view deep linking states
  const [targetApartmentId, setTargetApartmentId] = useState<string | undefined>(undefined);
  const [selectedDeliveryForPickup, setSelectedDeliveryForPickup] = useState<DeliveryItem | null>(null);
  const [snapshotForOccurrence, setSnapshotForOccurrence] = useState<{ url: string; cameraName: string } | null>(null);

  // Quick stats for sidebar badges
  const [pendingDeliveriesCount, setPendingDeliveriesCount] = useState(0);
  const [openOccurrencesCount, setOpenOccurrencesCount] = useState(0);
  const [waitingAuthCount, setWaitingAuthCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(storage.getCurrentUser());

  const refreshBadges = () => {
    setCurrentUser(storage.getCurrentUser());
    const dels = storage.getDeliveries();
    setPendingDeliveriesCount(dels.filter((d) => d.status !== 'retirado' && d.status !== 'devolvido').length);

    const ocos = storage.getOccurrences();
    setOpenOccurrencesCount(ocos.filter((o) => o.status === 'aberta' || o.status === 'em_analise').length);

    const logs = storage.getAccessLogs();
    setWaitingAuthCount(logs.filter((l) => l.status === 'aguardando_autorizacao').length);
  };

  useEffect(() => {
    refreshBadges();
    const unsub = storage.subscribe(refreshBadges);
    return () => unsub();
  }, []);

  // Keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenWhatsApp = (payload: WhatsAppPayload) => {
    setWhatsAppPayload(payload);
  };

  const handleFastCheckIn = (
    name: string,
    type: 'visitante' | 'prestador',
    aptId: string,
    blockId: string,
    doc: string
  ) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const entryTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const user = storage.getCurrentUser();

    storage.saveAccessLog({
      id: `acc-${Date.now()}`,
      personName: name,
      personType: type,
      document: doc,
      apartmentId: aptId,
      blockId,
      purpose: type === 'visitante' ? 'Visita Social Autorizada' : 'Prestação de Serviço Autorizada',
      entryTime,
      status: 'dentro',
      authorizationMethod: 'previa',
      authorizedByName: 'Autorização Prévia',
      operatorName: user.name,
    });

    setActiveTab('access');
  };

  const handleSelectSearchResult = (tab: ActiveTab, entityId?: string) => {
    if (tab === 'apartments' && entityId) {
      setTargetApartmentId(entityId);
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Header */}
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenShiftHandover={() => setIsShiftModalOpen(true)}
        onToggleSidebarMobile={() => setIsSidebarMobileOpen((prev) => !prev)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          isOpenMobile={isSidebarMobileOpen}
          onCloseMobile={() => setIsSidebarMobileOpen(false)}
          userRole={currentUser.role}
          pendingDeliveriesCount={pendingDeliveriesCount}
          openOccurrencesCount={openOccurrencesCount}
          waitingAuthCount={waitingAuthCount}
        />

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenQuickEntryModal={() => setActiveTab('access')}
              onOpenQuickExitModal={() => setActiveTab('access')}
              onOpenQuickDeliveryModal={() => {
                setActiveTab('deliveries');
                setIsNewDeliveryModalOpen(true);
              }}
              onOpenQuickOccurrenceModal={() => setActiveTab('occurrences')}
              onTriggerWhatsApp={handleOpenWhatsApp}
              onPickupDelivery={(del) => {
                setSelectedDeliveryForPickup(del);
                setActiveTab('deliveries');
              }}
            />
          )}

          {activeTab === 'access' && <AccessControlView onTriggerWhatsApp={handleOpenWhatsApp} />}

          {activeTab === 'cctv' && (
            <CCTVView
              onAttachSnapshotToOccurrence={(url, cameraName) => {
                setSnapshotForOccurrence({ url, cameraName });
                setActiveTab('occurrences');
              }}
            />
          )}

          {activeTab === 'deliveries' && (
            <DeliveriesView
              onTriggerWhatsApp={handleOpenWhatsApp}
              selectedDeliveryForPickup={selectedDeliveryForPickup}
              onClearSelectedDelivery={() => setSelectedDeliveryForPickup(null)}
              initialOpenCreateModal={isNewDeliveryModalOpen}
              onCloseCreateModal={() => setIsNewDeliveryModalOpen(false)}
            />
          )}

          {activeTab === 'notices' && <NoticesView />}

          {activeTab === 'visitors' && (
            <VisitorsView
              onTriggerWhatsApp={handleOpenWhatsApp}
              onFastCheckIn={handleFastCheckIn}
            />
          )}

          {activeTab === 'contractors' && (
            <ContractorsView
              onTriggerWhatsApp={handleOpenWhatsApp}
              onFastCheckIn={handleFastCheckIn}
            />
          )}

          {activeTab === 'public_agents' && <PublicAgentsView />}

          {activeTab === 'vehicles' && <VehiclesView />}

          {activeTab === 'apartments' && (
            <ApartmentsView
              onTriggerWhatsApp={handleOpenWhatsApp}
              targetApartmentId={targetApartmentId}
            />
          )}

          {activeTab === 'residents' && <ResidentsView onTriggerWhatsApp={handleOpenWhatsApp} />}

          {activeTab === 'occurrences' && (
            <OccurrencesView
              initialSnapshot={snapshotForOccurrence}
              onClearSnapshot={() => setSnapshotForOccurrence(null)}
            />
          )}

          {activeTab === 'other_controls' && <OtherControlsView />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'admin' && <AdminSettingsView />}
        </main>
      </div>

      {/* Global Interactive Modals */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleSelectSearchResult}
      />

      <ShiftHandoverModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        onTurnoCompleted={() => refreshBadges()}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => refreshBadges()}
      />

      {whatsAppPayload && (
        <WhatsAppModal
          isOpen={true}
          onClose={() => setWhatsAppPayload(null)}
          initialPayload={whatsAppPayload}
        />
      )}
    </div>
  );
}
