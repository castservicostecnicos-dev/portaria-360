import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Shield,
  Plus,
  Edit2,
  Trash2,
  Key,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Phone,
  Mail,
  Send,
  Sparkles,
  ExternalLink,
  Search,
  Filter,
  Check,
  X,
  AlertTriangle,
  Play,
  Copy,
  Layers,
  Video,
  Package,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { storage } from '../services/storage';
import { ClientCondo, User } from '../types';

interface DevMasterViewProps {
  onEnterCondoDemo?: (condoId: string) => void;
  onOpenWhatsApp?: (payload: { phone: string; message: string; residentName: string; aptNumber: string; block: string }) => void;
  initialTab?: 'clients' | 'demo';
}

export const DevMasterView: React.FC<DevMasterViewProps> = ({
  onEnterCondoDemo,
  onOpenWhatsApp,
  initialTab = 'clients',
}) => {
  const [activeTab, setActiveTab] = useState<'clients' | 'demo'>(initialTab);
  const [condos, setCondos] = useState<ClientCondo[]>(storage.getClientCondos());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'inativo'>('all');

  // Modal State for New / Edit Condo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCondo, setEditingCondo] = useState<ClientCondo | null>(null);

  // Form Fields - Condo
  const [condoName, setCondoName] = useState('');
  const [condoCnpj, setCondoCnpj] = useState('');
  const [condoAddress, setCondoAddress] = useState('');
  const [condoCity, setCondoCity] = useState('São Paulo');
  const [condoState, setCondoState] = useState('SP');
  const [condoPhone, setCondoPhone] = useState('');
  const [condoEmail, setCondoEmail] = useState('');
  const [condoBlocksCount, setCondoBlocksCount] = useState(2);
  const [condoAptsCount, setCondoAptsCount] = useState(32);
  const [condoNotes, setCondoNotes] = useState('');

  // Form Fields - ADM Predial (Gestor do Condomínio)
  const [admName, setAdmName] = useState('');
  const [admCargo, setAdmCargo] = useState('ADM Predial');
  const [admEmail, setAdmEmail] = useState('');
  const [admPassword, setAdmPassword] = useState('');
  const [admPhone, setAdmPhone] = useState('');

  // Password Recovery / Reset Modal
  const [resetModalCondo, setResetModalCondo] = useState<ClientCondo | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Delete Confirmation Modal
  const [condoToDelete, setCondoToDelete] = useState<ClientCondo | null>(null);

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const refreshData = () => {
    setCondos(storage.getClientCondos());
  };

  useEffect(() => {
    refreshData();
    const unsub = storage.subscribe(refreshData);
    return () => unsub();
  }, []);

  const triggerFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingCondo(null);
    setCondoName('');
    setCondoCnpj('');
    setCondoAddress('');
    setCondoCity('São Paulo');
    setCondoState('SP');
    setCondoPhone('');
    setCondoEmail('');
    setCondoBlocksCount(1);
    setCondoAptsCount(24);
    setCondoNotes('');

    // Pre-populate ADM with sensible placeholder
    setAdmName('');
    setAdmCargo('ADM Predial');
    setAdmEmail('');
    setAdmPassword(`predial@${Math.floor(1000 + Math.random() * 9000)}`);
    setAdmPhone('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (condo: ClientCondo) => {
    setEditingCondo(condo);
    setCondoName(condo.name);
    setCondoCnpj(condo.cnpj || '');
    setCondoAddress(condo.address);
    setCondoCity(condo.city);
    setCondoState(condo.state);
    setCondoPhone(condo.phone);
    setCondoEmail(condo.email);
    setCondoBlocksCount(condo.blocksCount);
    setCondoAptsCount(condo.aptsCount);
    setCondoNotes(condo.notes || '');

    setAdmName(condo.admPredial.name);
    setAdmCargo(condo.admPredial.cargo || 'ADM Predial');
    setAdmEmail(condo.admPredial.email);
    setAdmPassword(condo.admPredial.password);
    setAdmPhone(condo.admPredial.phone);
    setIsModalOpen(true);
  };

  const handleSaveCondo = (e: React.FormEvent) => {
    e.preventDefault();

    if (!condoName.trim()) {
      triggerFeedback('Informe o nome do condomínio.', 'error');
      return;
    }

    if (!admName.trim() || !admEmail.trim() || !admPassword.trim()) {
      triggerFeedback('Informe o nome, e-mail e senha do ADM Predial.', 'error');
      return;
    }

    const condoId = editingCondo ? editingCondo.id : `condo-${Date.now()}`;
    const admId = editingCondo?.admPredial.id || `user-adm-${Date.now()}`;

    const newOrUpdatedCondo: ClientCondo = {
      id: condoId,
      name: condoName.trim(),
      cnpj: condoCnpj.trim() || undefined,
      address: condoAddress.trim(),
      city: condoCity.trim() || 'São Paulo',
      state: condoState.trim() || 'SP',
      phone: condoPhone.trim(),
      email: condoEmail.trim(),
      active: editingCondo ? editingCondo.active : true,
      status: editingCondo ? editingCondo.status : 'ativo',
      createdAt: editingCondo ? editingCondo.createdAt : new Date().toISOString().split('T')[0],
      blocksCount: Number(condoBlocksCount) || 1,
      aptsCount: Number(condoAptsCount) || 10,
      camerasCount: editingCondo?.camerasCount || 4,
      admPredial: {
        id: admId,
        name: admName.trim(),
        email: admEmail.trim().toLowerCase(),
        password: admPassword.trim(),
        phone: admPhone.trim(),
        cargo: admCargo.trim() || 'ADM Predial',
      },
      notes: condoNotes.trim(),
    };

    storage.saveClientCondo(newOrUpdatedCondo);
    setIsModalOpen(false);
    triggerFeedback(
      editingCondo
        ? `Condomínio "${newOrUpdatedCondo.name}" atualizado com sucesso!`
        : `Condomínio "${newOrUpdatedCondo.name}" e ADM Predial "${admName}" cadastrados com sucesso!`
    );
  };

  const handleToggleStatus = (condo: ClientCondo) => {
    const result = storage.toggleClientCondoStatus(condo.id);
    if (result.success) {
      triggerFeedback(
        `Condomínio "${condo.name}" foi ${result.active ? 'ATIVADO' : 'DESATIVADO'} com sucesso!`
      );
    }
  };

  const handleDeleteCondo = () => {
    if (!condoToDelete) return;
    storage.deleteClientCondo(condoToDelete.id);
    triggerFeedback(`Condomínio "${condoToDelete.name}" removido com sucesso.`);
    setCondoToDelete(null);
  };

  const handleOpenResetModal = (condo: ClientCondo) => {
    setResetModalCondo(condo);
    setNewPasswordInput(condo.admPredial.password);
  };

  const handleSaveResetPassword = () => {
    if (!resetModalCondo) return;
    if (!newPasswordInput.trim()) {
      triggerFeedback('Digite uma senha válida.', 'error');
      return;
    }

    const res = storage.resetAdmPredialPassword(resetModalCondo.id, newPasswordInput.trim());
    if (res.success) {
      triggerFeedback(`Senha do ADM ${resetModalCondo.admPredial.name} redefinida para "${res.password}"!`);
      setResetModalCondo(null);
    }
  };

  const handleSendCredentialsWhatsApp = (condo: ClientCondo) => {
    const phone = condo.admPredial.phone.replace(/\D/g, '');
    const cleanPhone = phone.startsWith('55') ? phone : `55${phone}`;
    const text = encodeURIComponent(
      `Olá ${condo.admPredial.name}, seus dados de acesso como ADM Predial do *${condo.name}* no sistema Portaria 360:\n\n` +
      `🌐 *Acesso:* ${window.location.origin}\n` +
      `📧 *E-mail:* ${condo.admPredial.email}\n` +
      `🔑 *Senha de Acesso:* ${condo.admPredial.password}\n\n` +
      `Você já pode fazer login para cadastrar a equipe de porteiros e gerenciar a portaria!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleCopyCredentials = (condo: ClientCondo) => {
    const text = `Acesso Portaria 360 - ${condo.name}\nADM Predial: ${condo.admPredial.name}\nE-mail: ${condo.admPredial.email}\nSenha: ${condo.admPredial.password}\nLink: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    triggerFeedback('Credenciais copiadas para a área de transferência!');
  };

  const toggleShowPassword = (condoId: string) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [condoId]: !prev[condoId],
    }));
  };

  // Filtered condos
  const filteredCondos = condos.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.admPredial.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.admPredial.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'ativo' && c.active) ||
      (statusFilter === 'inativo' && !c.active);

    return matchesSearch && matchesStatus;
  });

  const totalCondos = condos.length;
  const activeCondos = condos.filter((c) => c.active).length;
  const inactiveCondos = condos.filter((c) => !c.active).length;
  const totalApts = condos.reduce((acc, c) => acc + (c.aptsCount || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner Dev Master */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-700/50 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-300">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Portal do Desenvolvedor & Gestão Multi-Condomínio</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Dev Master
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Cadastre novos condomínios, defina os Administradores Prediais (como o João) e faça demonstrações comerciais para novos clientes.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-indigo-900/60 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'clients'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Clientes & Condomínios ({condos.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('demo')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'demo'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Demonstração do Serviço</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-indigo-900/40">
          <div className="bg-slate-950/50 p-2.5 rounded-lg border border-indigo-950">
            <span className="text-[11px] text-slate-400 block font-medium">Condomínios Registrados</span>
            <span className="text-lg font-bold text-white font-mono">{totalCondos}</span>
          </div>
          <div className="bg-slate-950/50 p-2.5 rounded-lg border border-indigo-950">
            <span className="text-[11px] text-emerald-400 block font-medium">Condomínios Ativos</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">{activeCondos}</span>
          </div>
          <div className="bg-slate-950/50 p-2.5 rounded-lg border border-indigo-950">
            <span className="text-[11px] text-rose-400 block font-medium">Desativados / Bloqueados</span>
            <span className="text-lg font-bold text-rose-400 font-mono">{inactiveCondos}</span>
          </div>
          <div className="bg-slate-950/50 p-2.5 rounded-lg border border-indigo-950">
            <span className="text-[11px] text-indigo-300 block font-medium">Total de Apartamentos</span>
            <span className="text-lg font-bold text-indigo-300 font-mono">{totalApts} unids</span>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
              : 'bg-rose-950/80 border-rose-800 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 1: CLIENTS & CONDOMINIUMS MANAGEMENT                     */}
      {/* ============================================================ */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar condomínio, cidade ou ADM..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-400">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Todos ({totalCondos})</option>
                  <option value="ativo">Ativos ({activeCondos})</option>
                  <option value="inativo">Inativos ({inactiveCondos})</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Condomínio</span>
            </button>
          </div>

          {/* Condominium Cards List */}
          {filteredCondos.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">Nenhum condomínio encontrado</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery ? 'Nenhum resultado corresponde à sua busca.' : 'Cadastre o primeiro condomínio para começar a utilizar a plataforma.'}
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Condomínio</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredCondos.map((condo) => {
                const isPasswordVisible = !!showPasswordMap[condo.id];
                return (
                  <div
                    key={condo.id}
                    className={`bg-slate-900 border rounded-xl overflow-hidden transition-all duration-200 shadow-md ${
                      condo.active
                        ? 'border-slate-800 hover:border-slate-700'
                        : 'border-rose-900/40 bg-slate-950/90 opacity-80'
                    }`}
                  >
                    {/* Condo Card Header */}
                    <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2.5 rounded-lg border shrink-0 ${
                            condo.active
                              ? 'bg-indigo-950/50 border-indigo-800/60 text-indigo-400'
                              : 'bg-rose-950/40 border-rose-900/60 text-rose-400'
                          }`}
                        >
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-sm tracking-tight">{condo.name}</h3>
                            <button
                              onClick={() => handleToggleStatus(condo)}
                              title={condo.active ? 'Clique para desativar' : 'Clique para ativar'}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-1 ${
                                condo.active
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-rose-900/40 hover:text-rose-300'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-emerald-900/40 hover:text-emerald-300'
                              }`}
                            >
                              {condo.active ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  <span>Ativo</span>
                                </>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                  <span>Inativo</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {condo.address}, {condo.city} - {condo.state}
                          </p>
                          {condo.cnpj && (
                            <span className="text-[10px] text-slate-500 font-mono">CNPJ: {condo.cnpj}</span>
                          )}
                        </div>
                      </div>

                      {/* Top Action Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(condo)}
                          title="Editar Condomínio e ADM Predial"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCondoToDelete(condo)}
                          title="Excluir Condomínio"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Condo Details Body */}
                    <div className="p-4 space-y-3">
                      {/* Structure quick pills */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-md text-slate-300 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{condo.blocksCount} {condo.blocksCount === 1 ? 'Bloco' : 'Blocos'}</span>
                        </span>
                        <span className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-md text-slate-300 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{condo.aptsCount} Apartamentos</span>
                        </span>
                        {condo.camerasCount ? (
                          <span className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-md text-slate-300 flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5 text-amber-400" />
                            <span>{condo.camerasCount} Câmeras CFTV</span>
                          </span>
                        ) : null}
                      </div>

                      {/* ADM Predial Box (João do Condomínio) */}
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 text-[10px] font-bold">
                              {condo.admPredial.name.charAt(0)}
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-white block leading-tight">
                                {condo.admPredial.name}
                              </span>
                              <span className="text-[10px] text-indigo-300">
                                {condo.admPredial.cargo || 'ADM Predial (Cadastra os Porteiros)'}
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            Perfil Admin
                          </span>
                        </div>

                        {/* Contacts & Credentials */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-900">
                          <div className="flex items-center gap-1.5 text-slate-300 truncate">
                            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{condo.admPredial.email}</span>
                          </div>

                          {condo.admPredial.phone && (
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>{condo.admPredial.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Password & Recovery Row */}
                        <div className="flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800 text-[11px]">
                          <div className="flex items-center gap-2">
                            <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="text-slate-400">Senha do ADM:</span>
                            <span className="font-mono font-semibold text-amber-200">
                              {isPasswordVisible ? condo.admPredial.password : '••••••••'}
                            </span>
                            <button
                              onClick={() => toggleShowPassword(condo.id)}
                              className="text-slate-400 hover:text-white"
                              title={isPasswordVisible ? 'Ocultar senha' : 'Ver senha'}
                            >
                              {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCopyCredentials(condo)}
                              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                              title="Copiar dados de acesso"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenResetModal(condo)}
                              className="text-[10px] text-amber-400 hover:text-amber-300 hover:underline font-medium"
                            >
                              Redefinir
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => handleSendCredentialsWhatsApp(condo)}
                          className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Enviar Acesso via WhatsApp</span>
                        </button>

                        {onEnterCondoDemo && (
                          <button
                            onClick={() => onEnterCondoDemo(condo.id)}
                            className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span>Abrir Portaria</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: DEMONSTRATION SHOWROOM FOR CLIENT PRESENTATION        */}
      {/* ============================================================ */}
      {activeTab === 'demo' && (
        <div className="space-y-6">
          {/* Hero Showcase Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-800/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="max-w-2xl">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider inline-flex items-center gap-1.5 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Showroom para Apresentação a Clientes</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                Demonstre o funcionamento completo da Portaria 360 para Síndicos e Administradoras
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Use este ambiente interativo durante reuniões comerciais. Mostre na prática como o sistema elimina falhas na portaria, avisa os moradores no WhatsApp instantaneamente e centraliza o controle de acesso e câmeras CFTV.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-5">
                {onEnterCondoDemo && (
                  <button
                    onClick={() => onEnterCondoDemo('condo-solar-palmeiras')}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-950/60 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Entrar na Portaria de Demonstração (Solar das Palmeiras)</span>
                  </button>
                )}
                {onEnterCondoDemo && (
                  <button
                    onClick={() => onEnterCondoDemo('condo-sao-sebastiao')}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>Abrir Portaria: Condomínio São Sebastião</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Feature Cards to Pitch to Clients */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Feature 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-emerald-800/80 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">Recebimento & WhatsApp Automático</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Ao selecionar o Bloco e o Apartamento, o sistema preenche na hora o morador titular e telefone. Com 1 clique o porteiro avisa da encomenda no WhatsApp do morador, com foto e protocolo.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <span className="text-[11px] text-emerald-400 font-semibold block">✨ Argumento de Venda:</span>
                <span className="text-[11px] text-slate-400">Zero pacotes perdidos e fim das reclamações de encomendas na portaria.</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-indigo-800/80 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">Controle de Acesso com Foto & Placa</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Registro rápido de visitantes, entregadores (iFood, Mercado Livre) e prestadores de serviço com crachá virtual, autorização prévia do morador e controle de veículos na garagem.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <span className="text-[11px] text-indigo-300 font-semibold block">✨ Argumento de Venda:</span>
                <span className="text-[11px] text-slate-400">Segurança total com auditoria completa de quem entrou e quem autorizou.</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-amber-800/80 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                  <Video className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">Câmeras CFTV & Links Intelbras DDNS</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Mosaico de câmeras integrado na tela da portaria. Suporta links DDNS da Intelbras, streams RTSP e captura instantânea de snapshots para anexar em ocorrências.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <span className="text-[11px] text-amber-300 font-semibold block">✨ Argumento de Venda:</span>
                <span className="text-[11px] text-slate-400">O porteiro não precisa alternar entre o software das câmeras e a portaria.</span>
              </div>
            </div>
          </div>

          {/* Demonstration Guide / Script for Developer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Roteiro de Demonstração em 3 Minutos para Fechar com o Síndico</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-[10px]">1</span>
                  <span>Registrar Encomenda</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Entre na aba <strong>Encomendas</strong>, clique em <strong>Nova Encomenda</strong>, selecione o Bloco A e Apto 101. Mostre como os dados da Ana Paula e telefone são preenchidos sozinhos e a mensagem no WhatsApp é gerada.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 font-bold text-indigo-400">
                  <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-700 flex items-center justify-center text-[10px]">2</span>
                  <span>Liberar Prestador / Visitante</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Mostre a tela de <strong>Controle de Acesso</strong> ou o <strong>Painel Principal</strong>, faça o check-in de um técnico de internet e mostre o crachá temporário na tela com horário de entrada.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <span className="w-5 h-5 rounded-full bg-amber-950 border border-amber-700 flex items-center justify-center text-[10px]">3</span>
                  <span>Explicar a Hierarquia do Sistema</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Explique que você como Desenvolvedor cadastra o condomínio e entrega o login para o <strong>ADM Predial (o Síndico)</strong>. E o ADM Predial tem autonomia total para cadastrar os porteiros da guarita!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: CADASTRO / EDIÇÃO DE CONDOMÍNIO E ADM PREDIAL         */}
      {/* ============================================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/30 border border-indigo-500/40 rounded-lg text-indigo-300">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingCondo ? `Editar ${editingCondo.name}` : 'Cadastrar Novo Condomínio'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cadastre os dados do condomínio e defina o Administrador Predial responsável pela equipe.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCondo} className="p-6 space-y-6">
              {/* SECTION 1: CONDOMINIUM INFO */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    1. Dados do Condomínio (Cliente)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Nome do Condomínio * <span className="text-slate-500 font-normal">(Ex: Condomínio Edifício São Sebastião)</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Condomínio Edifício São Sebastião"
                      value={condoName}
                      onChange={(e) => setCondoName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">CNPJ (Opcional)</label>
                    <input
                      type="text"
                      placeholder="00.000.000/0001-00"
                      value={condoCnpj}
                      onChange={(e) => setCondoCnpj(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Telefone da Portaria / Geral</label>
                    <input
                      type="text"
                      placeholder="(11) 3333-4444"
                      value={condoPhone}
                      onChange={(e) => setCondoPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">Endereço Completo</label>
                    <input
                      type="text"
                      placeholder="Rua São Sebastião, 420 - Centro"
                      value={condoAddress}
                      onChange={(e) => setCondoAddress(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Cidade</label>
                    <input
                      type="text"
                      placeholder="São Paulo"
                      value={condoCity}
                      onChange={(e) => setCondoCity(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Estado (UF)</label>
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="SP"
                      value={condoState}
                      onChange={(e) => setCondoState(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Quantidade de Blocos/Torres</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={condoBlocksCount}
                      onChange={(e) => setCondoBlocksCount(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Quantidade de Apartamentos</label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={condoAptsCount}
                      onChange={(e) => setCondoAptsCount(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: ADM PREDIAL (JOÃO) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      2. Cadastro do ADM Predial (Gestor do Prédio)
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    Quem cadastra os porteiros
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
                  <p className="text-[11px] text-slate-400">
                    O <strong>ADM Predial</strong> receberá este login para gerenciar este condomínio e cadastrar os porteiros da portaria.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Nome do ADM Predial * <span className="text-slate-500 font-normal">(Ex: João Silva)</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: João da Silva"
                        value={admName}
                        onChange={(e) => setAdmName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Cargo / Função</label>
                      <input
                        type="text"
                        placeholder="Ex: ADM Predial / Síndico Geral"
                        value={admCargo}
                        onChange={(e) => setAdmCargo(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        E-mail de Login do ADM *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="joao.adm@saosebastiao.com.br"
                        value={admEmail}
                        onChange={(e) => setAdmEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Telefone / WhatsApp do ADM
                      </label>
                      <input
                        type="text"
                        placeholder="(11) 98888-1234"
                        value={admPhone}
                        onChange={(e) => setAdmPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-slate-300">
                          Senha de Acesso do ADM *
                        </label>
                        <button
                          type="button"
                          onClick={() => setAdmPassword(`predial@${Math.floor(1000 + Math.random() * 9000)}`)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Gerar Senha Automática</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Ex: joao@2468"
                        value={admPassword}
                        onChange={(e) => setAdmPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCondo ? 'Salvar Alterações' : 'Cadastrar Condomínio & ADM'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: RESET DE SENHA DO ADM PREDIAL                         */}
      {/* ============================================================ */}
      {resetModalCondo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Recuperação de Senha do ADM</h3>
                <p className="text-xs text-slate-400">{resetModalCondo.name}</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">ADM Predial:</span>
                <span className="text-white font-semibold">{resetModalCondo.admPredial.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">E-mail de Login:</span>
                <span className="text-white font-mono">{resetModalCondo.admPredial.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Senha Atual:</span>
                <span className="text-amber-300 font-mono font-bold">{resetModalCondo.admPredial.password}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nova Senha de Acesso
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setNewPasswordInput(`predial@${Math.floor(1000 + Math.random() * 9000)}`)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 font-medium"
                >
                  Gerar
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetModalCondo(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveResetPassword}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
              >
                Salvar Nova Senha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EXCLUSÃO DE CONDOMÍNIO                                */}
      {/* ============================================================ */}
      {condoToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/60 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Excluir Condomínio?</h3>
                <p className="text-xs text-rose-300">Esta ação não pode ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Você tem certeza que deseja remover o condomínio <strong className="text-white">"{condoToDelete.name}"</strong> e os acessos do ADM Predial <strong>{condoToDelete.admPredial.name}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCondoToDelete(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteCondo}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
