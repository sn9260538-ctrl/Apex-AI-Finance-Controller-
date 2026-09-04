import React, { useState } from "react";
import { LayoutDashboard, ReceiptText, LineChart, FileSearch, Settings, Menu, X, Search, DollarSign, ShieldCheck } from "lucide-react";
import OverviewTab from "./components/OverviewTab";
import TransactionsTab from "./components/TransactionsTab";
import ReportsTab from "./components/ReportsTab";
import ReconciliationTab from "./components/ReconciliationTab";
import SettingsTab from "./components/SettingsTab";
import CashForecastTab from "./components/CashForecastTab";
import ComplianceTab from "./components/ComplianceTab";
import AIFinancialAgent from "./components/AIFinancialAgent";
import { FinanceDataProvider } from "./context/FinanceDataContext";

export default function App() {
  const [activeTab, setActiveTab] = useState("reconciliation");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  const primaryNavItems = [
    { id: "reconciliation", label: "Reconciliation", icon: FileSearch },
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "transactions", label: "Transactions", icon: ReceiptText },
    { id: "cash_forecast", label: "Cash & Forecast", icon: DollarSign },
    { id: "compliance", label: "Compliance", icon: ShieldCheck },
    { id: "reports", label: "Reports", icon: LineChart },
  ];

  const utilityNavItems = [
    { id: "settings", label: "Settings & Help", icon: Settings },
  ];

  const allNavItems = [...primaryNavItems, ...utilityNavItems];

  return (
    <FinanceDataProvider>
      <div className="min-h-screen flex bg-neu-base text-neu-primary font-body overflow-hidden">
        
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-neu-primary/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar Navigation - Extruded Panel */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-neu-base shadow-[12px_0_24px_rgba(163,177,198,0.4)] flex flex-col justify-between transition-transform duration-300 ease-out transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex-shrink-0`}>
          <div>
            <div className="p-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[16px] bg-[#9EEB75] shadow-neu-extruded-sm flex items-center justify-center text-[#0F2F28] overflow-hidden">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.5 8.5C6.5 7.5 8 8 9 9.5C10 11.5 11 15 12.5 18C10.5 15.5 8.5 11.5 7 10C6 9 5 8.5 5.5 8.5Z" />
                    <path d="M9.5 10.5C12 9 15 7 18.5 5.5C15.5 8 12.5 9.5 9.5 10.5Z" />
                    <path d="M11 12.5C13.5 11.5 16 10 18.5 9C16 11.5 13.5 12.5 11 12.5Z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-display font-extrabold tracking-tight text-neu-primary">Apex</h1>
                  <p className="text-xs text-neu-muted font-bold tracking-widest uppercase mt-1">Controller</p>
                </div>
              </div>
              <button className="lg:hidden p-3 rounded-2xl bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset text-neu-muted transition-all" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Primary Navigation */}
            <nav className="px-6 py-2 space-y-3">
              {primaryNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-6 py-3.5 rounded-2xl text-sm transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-neu-accent focus-visible:ring-offset-2 focus-visible:ring-offset-neu-base ${
                      isActive
                        ? "bg-neu-base shadow-neu-inset text-neu-accent font-bold"
                        : "bg-neu-base shadow-transparent hover:shadow-neu-extruded-sm hover:-translate-y-[1px] text-neu-muted hover:text-neu-primary font-medium"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-neu-accent" : "text-neu-muted"}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Utility Navigation: Settings & Help */}
          <div className="px-6 pb-6 pt-4 border-t border-neu-muted/20">
            {utilityNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-6 py-3.5 rounded-2xl text-sm transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-neu-accent focus-visible:ring-offset-2 focus-visible:ring-offset-neu-base ${
                    isActive
                      ? "bg-neu-base shadow-neu-inset text-neu-accent font-bold"
                      : "bg-neu-base shadow-transparent hover:shadow-neu-extruded-sm hover:-translate-y-[1px] text-neu-muted hover:text-neu-primary font-medium"
                  }`}
                >
                  <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-neu-accent" : "text-neu-muted"}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-neu-base">
          {/* Top Header */}
          <header className="h-24 shrink-0 flex items-center px-6 sm:px-10 justify-between gap-4 sticky top-0 z-10 bg-neu-base shadow-[0_4px_16px_rgba(163,177,198,0.2)] mb-8">
            <div className="flex items-center gap-4 shrink-0">
              <button 
                className="lg:hidden p-3 rounded-2xl bg-neu-base shadow-neu-extruded hover:shadow-neu-extruded-hover active:shadow-neu-inset text-neu-muted transition-all"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-neu-primary capitalize tracking-tight hidden lg:block">
                {allNavItems.find(i => i.id === activeTab)?.label}
              </h2>
            </div>

            {activeTab === 'transactions' && (
              <div className="flex flex-1 sm:flex-none justify-end items-center ml-auto">
                 <div className="relative flex items-center w-full max-w-[280px] sm:w-64">
                   <div className="w-full h-12 rounded-full shadow-neu-inset bg-neu-base px-5 flex items-center focus-within:ring-2 focus-within:ring-neu-accent focus-within:ring-offset-2 focus-within:ring-offset-neu-base transition-all">
                     <Search className="w-4 h-4 text-neu-muted mr-3 shrink-0" />
                     <input 
                        className="bg-transparent border-none outline-none w-full text-sm font-bold text-neu-primary placeholder:text-neu-muted focus:ring-0 min-w-0"
                        placeholder="Search the source"
                        aria-label="Global search"
                        type="text"
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                     />
                   </div>
                 </div>
              </div>
            )}
          </header>

          {/* Tab Content - Scrollable Area */}
          <div className="flex-1 overflow-auto px-4 sm:px-10 pb-12 smooth-scroll">
            <div className="max-w-7xl mx-auto h-full">
              {activeTab === "overview" && <OverviewTab onNavigateToRecon={() => setActiveTab("reconciliation")} />}
              {activeTab === "transactions" && <TransactionsTab searchQuery={globalSearch} />}
              {activeTab === "reconciliation" && <ReconciliationTab searchQuery={globalSearch} onViewOverview={() => setActiveTab("overview")} />}
              {activeTab === "cash_forecast" && <CashForecastTab />}
              {activeTab === "compliance" && <ComplianceTab />}
              {activeTab === "reports" && <ReportsTab onNavigateToRecon={() => setActiveTab("reconciliation")} />}
              {activeTab === "settings" && <SettingsTab />}
            </div>
          </div>
        </main>
        <AIFinancialAgent />
      </div>
    </FinanceDataProvider>
  );
}
