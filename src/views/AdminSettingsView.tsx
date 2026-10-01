import React, { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  Building,
  MessageSquare,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  FileText,
  Key,
} from 'lucide-react';
import { storage } from '../services/storage';
import { CondoConfig, User, WhatsAppTemplate, AuditLog } from '../types';

export const AdminSettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'condo' | 'users' | 'templates' | 'logs' | 'backup'>('condo');
  const [condo, setCondo] = useState<CondoConfig>(storage.getCondo());
  const [users, setUsers] = useState<User[]>(storage.getUsers());
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(storage.getWhatsAppTemplates());
  const [logs, setLogs] = useState<AuditLog[]>(storage.getAuditLogs());

  // Editing state for users
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userRole, setUserRole] = useState<User['role']>('porteiro');
  const [userActive, setUserActive] = useState(true);
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [canConfigCondo, setCanConfigCondo] = useState(false);
  const [canDeleteRecords, setCanDeleteRecords] = useState(false);
  const [canViewReports, setCanViewReports] = useState(true);

  // Template editor modal
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [templateText, setTemplateText] = useState('');
  const [templateTitle, setTemplateTitle] = useState('');

  // Notification message
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const refreshData = () => {
    setCondo(storage.getCondo());
    setUsers(storage.getUsers());
    setTemplates(storage.getWhatsAppTemplates());
    setLogs(storage.getAuditLogs());
  };

  useEffect(() => {
    refreshData();
    const unsub = storage.subscribe(refreshData);
    return () => unsub();
  }, []);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleSaveCondo = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveCondo(condo);
    showFeedback('Configurações do condomínio salvas com sucesso!');
  };

  const handleOpenUserModal = (u?: User) => {
    if (u) {
      setEditingUser(u);
      setUserName(u.name);
      setUserEmail(u.email);
      setUserPassword(u.password || '');
      setUserPhone(u.phone);
      setUserRole(u.role);
      setUserActive(u.active);
      setCanManageUsers(u.permissions.canManageUsers);
      setCanConfigCondo(u.permissions.canConfigCondo);
      setCanDeleteRecords(u.permissions.canDeleteRecords);
      setCanViewReports(u.permissions.canViewReports);
    } else {
      setEditingUser(null);
      setUserName('');
      setUserEmail('');
      setUserPassword('');
      setUserPhone('');
      setUserRole('porteiro');
      setUserActive(true);
      setCanManageUsers(false);
      setCanConfigCondo(false);
      setCanDeleteRecords(false);
      setCanViewReports(true);
    }
    setShowUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const isDev = userRole === 'dev' || userEmail.trim().toLowerCase() === 'ale11062@gmail.com';
    const updated: User = {
      id: editingUser ? editingUser.id : `user-${Date.now()}`,
      name: userName,
      email: userEmail.trim().toLowerCase(),
      password: userPassword || (isDev ? 'cast@2468' : 'senha123'),
      role: isDev ? 'dev' : userRole,
      phone: userPhone,
      active: userActive,
      permissions: {
        canManageUsers: isDev ? true : canManageUsers,
        canConfigCondo: isDev ? true : canConfigCondo,
        canDeleteRecords: isDev ? true : canDeleteRecords,
        canViewReports: isDev ? true : canViewReports,
        canManageSettings: isDev ? true : canConfigCondo,
      },
    };
    storage.saveUser(updated);
    setShowUserModal(false);
    showFeedback('Usuário salvo com sucesso!');
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Deseja excluir este usuário do sistema?')) {
      storage.deleteUser(id);
      showFeedback('Usuário removido.');
    }
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    storage.saveWhatsAppTemplate({
      ...editingTemplate,
      title: templateTitle,
      templateText,
    });
    setEditingTemplate(null);
    showFeedback('Modelo de mensagem WhatsApp atualizado!');
  };

  const handleExportBackup = () => {
    const jsonStr = storage.exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_portaria360_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback('Arquivo de backup exportado!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (storage.importBackupJSON(content)) {
        showFeedback('Backup restaurado com sucesso!');
      } else {
        alert('Erro ao carregar arquivo de backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetToFactory = () => {
    if (confirm('ATENÇÃO: Deseja redefinir todo o sistema para os dados de demonstração iniciais? Esta ação substituirá dados atuais.')) {
      storage.resetToInitialSeed();
      showFeedback('Sistema restaurado para o padrão inicial!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Administração & Configurações</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastro do condomínio, controle de usuários e permissões, templates de WhatsApp e auditoria.
          </p>
        </div>

        {/* Feedback pill */}
        {feedbackMsg && (
          <div className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-lg text-xs font-semibold animate-pulse">
            ✓ {feedbackMsg}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('condo')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'condo' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building className="w-3.5 h-3.5 text-emerald-400" />
          <span>Dados do Condomínio</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'users' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-sky-400" />
          <span>Usuários & Permissões ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'templates' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
          <span>Templates WhatsApp ({templates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'logs' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>Log de Auditoria ({logs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'backup' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Download className="w-3.5 h-3.5 text-rose-400" />
          <span>Backup & Segurança</span>
        </button>
      </div>

      {/* TAB 1: DADOS DO CONDOMÍNIO */}
      {activeTab === 'condo' && (
        <form onSubmit={handleSaveCondo} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Nome do Condomínio *</label>
              <input
                type="text"
                required
                value={condo.name}
                onChange={(e) => setCondo({ ...condo, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">CNPJ *</label>
              <input
                type="text"
                required
                value={condo.cnpj}
                onChange={(e) => setCondo({ ...condo, cnpj: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono-tabular"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">Endereço Completo</label>
              <input
                type="text"
                value={condo.address}
                onChange={(e) => setCondo({ ...condo, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">CEP</label>
              <input
                type="text"
                value={condo.cep}
                onChange={(e) => setCondo({ ...condo, cep: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono-tabular"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Cidade</label>
              <input
                type="text"
                value={condo.city}
                onChange={(e) => setCondo({ ...condo, city: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Estado</label>
              <input
                type="text"
                value={condo.state}
                onChange={(e) => setCondo({ ...condo, state: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white uppercase"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Telefone da Portaria</label>
              <input
                type="text"
                value={condo.phone}
                onChange={(e) => setCondo({ ...condo, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">E-mail Administrativo</label>
              <input
                type="email"
                value={condo.email}
                onChange={(e) => setCondo({ ...condo, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-3">
            <h4 className="font-semibold text-white">Regras Específicas do Condomínio</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Horário de Entregas & Encomendas</label>
                <input
                  type="text"
                  value={condo.rules.deliveryHours}
                  onChange={(e) =>
                    setCondo({ ...condo, rules: { ...condo.rules, deliveryHours: e.target.value } })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Horário de Silêncio</label>
                <input
                  type="text"
                  value={condo.rules.quietHours}
                  onChange={(e) =>
                    setCondo({ ...condo, rules: { ...condo.rules, quietHours: e.target.value } })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Regras de Mudanças</label>
                <input
                  type="text"
                  value={condo.rules.movingHours}
                  onChange={(e) =>
                    setCondo({ ...condo, rules: { ...condo.rules, movingHours: e.target.value } })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Política de Visitantes</label>
                <input
                  type="text"
                  value={condo.rules.visitorPolicy}
                  onChange={(e) =>
                    setCondo({ ...condo, rules: { ...condo.rules, visitorPolicy: e.target.value } })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow"
            >
              Salvar Dados do Condomínio
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: USUÁRIOS & PERMISSÕES */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Operadores e Administradores do Sistema
            </h3>
            <button
              onClick={() => handleOpenUserModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Usuário</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">E-mail / Telefone</th>
                  <th className="py-3 px-4">Perfil</th>
                  <th className="py-3 px-4">Senha / Acesso</th>
                  <th className="py-3 px-4">Permissões Especiais</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const isDev = u.role === 'dev' || u.email.toLowerCase() === 'ale11062@gmail.com';
                  return (
                    <tr key={u.id} className={`hover:bg-slate-850/50 ${isDev ? 'bg-purple-950/20' : ''}`}>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white block">{u.name}</span>
                        {isDev && (
                          <span className="text-[10px] text-purple-300 font-bold bg-purple-950 px-1 rounded border border-purple-800 inline-block mt-0.5">
                            ⚡ Master Developer
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {u.email} <span className="text-[10px] text-slate-500 block">{u.phone}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                            isDev
                              ? 'bg-purple-900/60 text-purple-300 border border-purple-700'
                              : u.role === 'admin'
                              ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isDev ? 'Dev Master' : u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                        <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {u.password || '••••••••'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[10px] space-x-1">
                        {u.permissions.canManageUsers && (
                          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-300">Gestão Usuários</span>
                        )}
                        {u.permissions.canConfigCondo && (
                          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300">Config Condomínio</span>
                        )}
                        {u.permissions.canDeleteRecords && (
                          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-rose-300">Excluir Registros</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {u.active ? (
                          <span className="text-emerald-400 font-semibold text-[11px]">Ativo</span>
                        ) : (
                          <span className="text-rose-400 font-semibold text-[11px]">Desativado</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenUserModal(u)}
                            className="p-1.5 text-slate-400 hover:text-white"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TEMPLATES WHATSAPP */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Configure os modelos padrão das mensagens disparadas pela portaria aos moradores. As tags entre colchetes como <code>[NOME]</code>, <code>[TIPO]</code>, <code>[APARTAMENTO]</code>, <code>[HORA]</code> e <code>[CONDOMINIO]</code> são preenchidas automaticamente.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="font-semibold text-white text-xs">{tpl.title}</h4>
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 border border-purple-800 px-1.5 py-0.2 rounded uppercase">
                      {tpl.category}
                    </span>
                  </div>
                  <pre className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                    {tpl.templateText}
                  </pre>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => {
                      setEditingTemplate(tpl);
                      setTemplateTitle(tpl.title);
                      setTemplateText(tpl.templateText);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Modelo</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: LOG DE AUDITORIA */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Registros de Auditoria & Trilha de Segurança
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Últimas 50 operações registradas</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Operador</th>
                  <th className="py-3 px-4">Ação</th>
                  <th className="py-3 px-4">Módulo</th>
                  <th className="py-3 px-4">Detalhes do Evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono-tabular">
                {logs.slice(0, 50).map((l) => (
                  <tr key={l.id} className="hover:bg-slate-850/50">
                    <td className="py-2.5 px-4 text-slate-400">{l.timestamp}</td>
                    <td className="py-2.5 px-4 text-white font-medium">{l.userName} ({l.userRole})</td>
                    <td className="py-2.5 px-4 text-emerald-400 font-semibold">{l.action}</td>
                    <td className="py-2.5 px-4 text-slate-300">{l.entity}</td>
                    <td className="py-2.5 px-4 text-slate-300 max-w-[320px] truncate">{l.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: BACKUP & SEGURANÇA */}
      {activeTab === 'backup' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6 text-xs">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Cópia de Segurança Completa (Backup JSON)</h3>
            <p className="text-slate-400 leading-relaxed">
              Exporte todos os cadastros, acessos, encomendas, moradores, veículos e logs para um arquivo seguro em formato JSON.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={handleExportBackup}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Backup Completo (.JSON)</span>
              </button>

              <label className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold border border-slate-700 cursor-pointer">
                <Upload className="w-4 h-4 text-sky-400" />
                <span>Restaurar de Arquivo JSON</span>
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-sm font-semibold text-rose-400 mb-1">Redefinição de Demonstração / Fábrica</h3>
            <p className="text-slate-400 leading-relaxed">
              Restaura todo o banco de dados para os registros de teste e demonstração do condomínio Solar das Palmeiras.
            </p>
            <button
              onClick={handleResetToFactory}
              className="mt-3 px-4 py-2 bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-lg font-semibold"
            >
              Resetar Dados para Demonstração Inicial
            </button>
          </div>
        </div>
      )}

      {/* Modal User Edit */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveUser}
            className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-3.5 text-xs"
          >
            <h3 className="text-sm font-semibold text-white">
              {editingUser ? 'Editar Usuário do Sistema' : 'Novo Usuário do Sistema'}
            </h3>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">E-mail *</label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Telefone</label>
                <input
                  type="text"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Perfil de Acesso</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="porteiro">Porteiro / Operador</option>
                  <option value="supervisor">Supervisor de Segurança</option>
                  <option value="admin">Administrador / Síndico</option>
                  <option value="dev">Desenvolvedor / Master</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Status da Conta</label>
                <select
                  value={userActive ? 'active' : 'inactive'}
                  onChange={(e) => setUserActive(e.target.value === 'active')}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="active">Ativo (Pode Acessar)</option>
                  <option value="inactive">Desativado / Bloqueado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Senha de Acesso ao Sistema</label>
              <input
                type="text"
                placeholder="Defina a senha do operador ou deixe a atual"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Permite autenticação via tela de login ou recuperação de senha.
              </span>
            </div>

            {/* Individual Permissions */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <span className="font-semibold text-slate-300 block">Permissões Individuais:</span>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="p-users"
                  checked={canManageUsers}
                  onChange={(e) => setCanManageUsers(e.target.checked)}
                  className="accent-emerald-600 rounded"
                />
                <label htmlFor="p-users" className="text-slate-300">Pode cadastrar e editar usuários</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="p-condo"
                  checked={canConfigCondo}
                  onChange={(e) => setCanConfigCondo(e.target.checked)}
                  className="accent-emerald-600 rounded"
                />
                <label htmlFor="p-condo" className="text-slate-300">Pode configurar regras e dados do condomínio</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="p-del"
                  checked={canDeleteRecords}
                  onChange={(e) => setCanDeleteRecords(e.target.checked)}
                  className="accent-emerald-600 rounded"
                />
                <label htmlFor="p-del" className="text-slate-300">Pode excluir registros históricos</label>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="px-3 py-1.5 text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold"
              >
                Salvar Usuário
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Edit Template */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveTemplate}
            className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl p-5 space-y-3 text-xs"
          >
            <h3 className="text-sm font-semibold text-white">Editar Modelo de WhatsApp</h3>

            <div>
              <label className="block text-slate-300 mb-1">Título do Modelo</label>
              <input
                type="text"
                required
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Texto com Marcadores Automáticos</label>
              <textarea
                rows={8}
                required
                value={templateText}
                onChange={(e) => setTemplateText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white font-mono leading-relaxed"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="px-3 py-1.5 text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold"
              >
                Salvar Modelo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
