import {
  CondoConfig,
  Block,
  Apartment,
  Resident,
  Visitor,
  Contractor,
  PublicAgent,
  Vehicle,
  AccessLog,
  DeliveryItem,
  Occurrence,
  LostFoundItem,
  KeyControl,
  Authorization,
  SpecialService,
  ShiftEntry,
  AuditLog,
  User,
  WhatsAppTemplate,
  CCTVCamera,
  CommunicationNotice,
  ClientCondo,
} from '../types';

import {
  SEED_CONDO,
  SEED_CLIENT_CONDOS,
  SEED_USERS,
  SEED_BLOCKS,
  SEED_APARTMENTS,
  SEED_RESIDENTS,
  SEED_VEHICLES,
  SEED_VISITORS,
  SEED_CONTRACTORS,
  SEED_PUBLIC_AGENTS,
  SEED_ACCESS_LOGS,
  SEED_DELIVERIES,
  SEED_OCCURRENCES,
  SEED_LOST_FOUND,
  SEED_KEYS,
  SEED_AUTHORIZATIONS,
  SEED_SPECIAL_SERVICES,
  SEED_SHIFT_ENTRIES,
  SEED_AUDIT_LOGS,
  SEED_WHATSAPP_TEMPLATES,
  SEED_CCTV_CAMERAS,
  SEED_COMMUNICATION_NOTICES,
} from '../data/seedData';
import { firestoreSync } from './firestoreSync';

const STORAGE_KEYS = {
  CONDO: 'portaria360_condo',
  CLIENT_CONDOS: 'portaria360_client_condos',
  USERS: 'portaria360_users',
  CURRENT_USER: 'portaria360_current_user',
  BLOCKS: 'portaria360_blocks',
  APARTMENTS: 'portaria360_apartments',
  RESIDENTS: 'portaria360_residents',
  VEHICLES: 'portaria360_vehicles',
  VISITORS: 'portaria360_visitors',
  CONTRACTORS: 'portaria360_contractors',
  PUBLIC_AGENTS: 'portaria360_public_agents',
  ACCESS_LOGS: 'portaria360_access_logs',
  DELIVERIES: 'portaria360_deliveries',
  OCCURRENCES: 'portaria360_occurrences',
  LOST_FOUND: 'portaria360_lost_found',
  KEYS: 'portaria360_keys',
  AUTHORIZATIONS: 'portaria360_authorizations',
  SPECIAL_SERVICES: 'portaria360_special_services',
  SHIFT_ENTRIES: 'portaria360_shift_entries',
  AUDIT_LOGS: 'portaria360_audit_logs',
  WHATSAPP_TEMPLATES: 'portaria360_whatsapp_templates',
  CCTV_CAMERAS: 'portaria360_cctv_cameras',
  COMMUNICATION_NOTICES: 'portaria360_communication_notices',
};

class StorageService {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initIfEmpty();
  }

  private initIfEmpty() {
    if (!localStorage.getItem(STORAGE_KEYS.CONDO)) {
      this.resetToInitialSeed();
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLIENT_CONDOS)) {
      localStorage.setItem(STORAGE_KEYS.CLIENT_CONDOS, JSON.stringify(SEED_CLIENT_CONDOS));
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('Error in storage listener', e);
      }
    });
  }

  public resetToInitialSeed() {
    localStorage.setItem(STORAGE_KEYS.CONDO, JSON.stringify(SEED_CONDO));
    localStorage.setItem(STORAGE_KEYS.CLIENT_CONDOS, JSON.stringify(SEED_CLIENT_CONDOS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(SEED_USERS[1])); // Default as Porteiro João Pedro
    localStorage.setItem(STORAGE_KEYS.BLOCKS, JSON.stringify(SEED_BLOCKS));
    localStorage.setItem(STORAGE_KEYS.APARTMENTS, JSON.stringify(SEED_APARTMENTS));
    localStorage.setItem(STORAGE_KEYS.RESIDENTS, JSON.stringify(SEED_RESIDENTS));
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(SEED_VEHICLES));
    localStorage.setItem(STORAGE_KEYS.VISITORS, JSON.stringify(SEED_VISITORS));
    localStorage.setItem(STORAGE_KEYS.CONTRACTORS, JSON.stringify(SEED_CONTRACTORS));
    localStorage.setItem(STORAGE_KEYS.PUBLIC_AGENTS, JSON.stringify(SEED_PUBLIC_AGENTS));
    localStorage.setItem(STORAGE_KEYS.ACCESS_LOGS, JSON.stringify(SEED_ACCESS_LOGS));
    localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(SEED_DELIVERIES));
    localStorage.setItem(STORAGE_KEYS.OCCURRENCES, JSON.stringify(SEED_OCCURRENCES));
    localStorage.setItem(STORAGE_KEYS.LOST_FOUND, JSON.stringify(SEED_LOST_FOUND));
    localStorage.setItem(STORAGE_KEYS.KEYS, JSON.stringify(SEED_KEYS));
    localStorage.setItem(STORAGE_KEYS.AUTHORIZATIONS, JSON.stringify(SEED_AUTHORIZATIONS));
    localStorage.setItem(STORAGE_KEYS.SPECIAL_SERVICES, JSON.stringify(SEED_SPECIAL_SERVICES));
    localStorage.setItem(STORAGE_KEYS.SHIFT_ENTRIES, JSON.stringify(SEED_SHIFT_ENTRIES));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(SEED_AUDIT_LOGS));
    localStorage.setItem(STORAGE_KEYS.WHATSAPP_TEMPLATES, JSON.stringify(SEED_WHATSAPP_TEMPLATES));
    localStorage.setItem(STORAGE_KEYS.CCTV_CAMERAS, JSON.stringify(SEED_CCTV_CAMERAS));
    localStorage.setItem(STORAGE_KEYS.COMMUNICATION_NOTICES, JSON.stringify(SEED_COMMUNICATION_NOTICES));
    this.notify();
  }

  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
    this.notify();
  }

  // Current User
  public getCurrentUser(): User {
    const user = this.getItem<User>(STORAGE_KEYS.CURRENT_USER, SEED_USERS[1]);
    return user || SEED_USERS[1];
  }

  public setCurrentUser(user: User) {
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
    this.addAuditLog('Troca de Operador Ativo', 'Sessão', `Operador alterado para ${user.name} (${user.role})`);
  }

  // Users
  public getUsers(): User[] {
    const list = this.getItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
    // Ensure the developer account ale11062@gmail.com is always present and up-to-date
    const devIndex = list.findIndex((u) => u.email.toLowerCase() === 'ale11062@gmail.com');
    if (devIndex === -1) {
      list.unshift(SEED_USERS[0]);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
    } else {
      // Ensure password and role are correctly set
      if (list[devIndex].password !== 'cast@2468' || list[devIndex].role !== 'dev') {
        list[devIndex].password = 'cast@2468';
        list[devIndex].role = 'dev';
        list[devIndex].permissions = {
          canManageUsers: true,
          canConfigCondo: true,
          canDeleteRecords: true,
          canViewReports: true,
          canManageSettings: true,
        };
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
      }
    }
    return list;
  }

  public authenticate(email: string, password: string): { success: boolean; user?: User; message: string } {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.trim().toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, message: 'Usuário não encontrado com este e-mail.' };
    }

    if (!user.active) {
      return { success: false, message: 'Este usuário está desativado no sistema. Contate a administração.' };
    }

    if (user.password && user.password !== password) {
      return { success: false, message: 'Senha incorreta. Verifique suas credenciais.' };
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    user.lastLogin = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    this.saveUser(user);
    this.setCurrentUser(user);
    this.addAuditLog('Login de Usuário', 'Autenticação', `Usuário ${user.name} (${user.email}) autenticado com sucesso`);

    return { success: true, user, message: 'Login realizado com sucesso!' };
  }

  public recoverPassword(email: string): { success: boolean; message: string; recoveredPassword?: string } {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.trim().toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, message: 'Nenhuma conta encontrada com o e-mail informado.' };
    }

    const pass = user.password || 'senha123';
    this.addAuditLog('Recuperação de Senha', 'Autenticação', `Solicitação de recuperação para ${user.email}`);

    return {
      success: true,
      message: `Credenciais localizadas com sucesso! Sua senha de acesso é: "${pass}"`,
      recoveredPassword: pass,
    };
  }

  public saveUser(user: User) {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
      this.addAuditLog('Atualização de Usuário', 'Usuários', `Usuário ${user.name} atualizado`);
    } else {
      users.push(user);
      this.addAuditLog('Cadastro de Usuário', 'Usuários', `Novo usuário ${user.name} (${user.role}) cadastrado`);
    }
    this.setItem(STORAGE_KEYS.USERS, users);
  }

  public deleteUser(userId: string) {
    let users = this.getUsers();
    const target = users.find((u) => u.id === userId);
    users = users.filter((u) => u.id !== userId);
    this.setItem(STORAGE_KEYS.USERS, users);
    if (target) {
      this.addAuditLog('Exclusão de Usuário', 'Usuários', `Usuário ${target.name} removido`);
    }
  }

  // Client Condos (Multi-condo Dev Management)
  public getClientCondos(): ClientCondo[] {
    return this.getItem<ClientCondo[]>(STORAGE_KEYS.CLIENT_CONDOS, SEED_CLIENT_CONDOS);
  }

  public saveClientCondo(condo: ClientCondo) {
    const list = this.getClientCondos();
    const idx = list.findIndex((c) => c.id === condo.id);
    if (idx >= 0) {
      list[idx] = condo;
      this.addAuditLog('Atualização de Condomínio', 'Dev Master', `Condomínio ${condo.name} atualizado pelo desenvolvedor`);
    } else {
      list.unshift(condo);
      this.addAuditLog('Cadastro de Condomínio', 'Dev Master', `Novo condomínio ${condo.name} e ADM Predial ${condo.admPredial.name} cadastrados`);
    }
    this.setItem(STORAGE_KEYS.CLIENT_CONDOS, list);
    firestoreSync.syncClientCondo(condo);

    // Sync ADM Predial into Users table so they can log in immediately
    if (condo.admPredial && condo.admPredial.email) {
      const users = this.getUsers();
      const existingUserIdx = users.findIndex(
        (u) => u.id === condo.admPredial.id || u.email.toLowerCase() === condo.admPredial.email.toLowerCase()
      );
      const admUser: User = {
        id: condo.admPredial.id || `user-adm-${Date.now()}`,
        name: `${condo.admPredial.name}`,
        email: condo.admPredial.email,
        password: condo.admPredial.password || 'senha123',
        phone: condo.admPredial.phone || '',
        role: 'admin',
        active: condo.active,
        permissions: {
          canManageUsers: true,
          canConfigCondo: true,
          canDeleteRecords: true,
          canViewReports: true,
          canManageSettings: true,
        },
      };

      if (existingUserIdx >= 0) {
        users[existingUserIdx] = {
          ...users[existingUserIdx],
          ...admUser,
          id: users[existingUserIdx].id,
        };
      } else {
        users.push(admUser);
      }
      this.setItem(STORAGE_KEYS.USERS, users);
      firestoreSync.syncUser(admUser);
    }
  }

  public deleteClientCondo(condoId: string) {
    const list = this.getClientCondos();
    const target = list.find((c) => c.id === condoId);
    const updated = list.filter((c) => c.id !== condoId);
    this.setItem(STORAGE_KEYS.CLIENT_CONDOS, updated);
    firestoreSync.deleteClientCondo(condoId);
    if (target) {
      this.addAuditLog('Exclusão de Condomínio', 'Dev Master', `Condomínio ${target.name} removido da plataforma`);
    }
  }

  public toggleClientCondoStatus(condoId: string): { success: boolean; active: boolean; status: 'ativo' | 'inativo' } {
    const list = this.getClientCondos();
    const idx = list.findIndex((c) => c.id === condoId);
    if (idx === -1) return { success: false, active: false, status: 'inativo' };

    const newActive = !list[idx].active;
    list[idx].active = newActive;
    list[idx].status = newActive ? 'ativo' : 'inativo';
    this.setItem(STORAGE_KEYS.CLIENT_CONDOS, list);

    // Also toggle the active status of the ADM Predial user
    const users = this.getUsers();
    const admEmail = list[idx].admPredial.email.toLowerCase();
    const userIdx = users.findIndex((u) => u.email.toLowerCase() === admEmail);
    if (userIdx >= 0) {
      users[userIdx].active = newActive;
      this.setItem(STORAGE_KEYS.USERS, users);
    }

    this.addAuditLog(
      'Status de Condomínio Alterado',
      'Dev Master',
      `Condomínio ${list[idx].name} agora está ${newActive ? 'ATIVO' : 'DESATIVADO'}`
    );

    return { success: true, active: newActive, status: list[idx].status };
  }

  public resetAdmPredialPassword(condoId: string, customNewPassword?: string): { success: boolean; password: string; message: string } {
    const list = this.getClientCondos();
    const idx = list.findIndex((c) => c.id === condoId);
    if (idx === -1) {
      return { success: false, password: '', message: 'Condomínio não encontrado.' };
    }

    const newPass = customNewPassword || `portaria@${Math.random().toString(36).slice(-6)}`;
    list[idx].admPredial.password = newPass;
    this.setItem(STORAGE_KEYS.CLIENT_CONDOS, list);

    // Also sync to Users
    const users = this.getUsers();
    const admEmail = list[idx].admPredial.email.toLowerCase();
    const userIdx = users.findIndex((u) => u.email.toLowerCase() === admEmail);
    if (userIdx >= 0) {
      users[userIdx].password = newPass;
      this.setItem(STORAGE_KEYS.USERS, users);
    }

    this.addAuditLog(
      'Reset de Senha ADM Predial',
      'Dev Master',
      `Senha do ADM ${list[idx].admPredial.name} (${list[idx].name}) resetada`
    );

    return {
      success: true,
      password: newPass,
      message: `Senha do ADM ${list[idx].admPredial.name} redefinida com sucesso para "${newPass}"`,
    };
  }

  public switchActiveCondo(condoId: string): { success: boolean; condo?: ClientCondo } {
    const list = this.getClientCondos();
    const target = list.find((c) => c.id === condoId);
    if (!target) return { success: false };

    // Update active condo config
    const current = this.getCondo();
    const updated: CondoConfig = {
      ...current,
      id: target.id,
      name: target.name,
      cnpj: target.cnpj || current.cnpj,
      address: target.address,
      city: target.city,
      state: target.state,
      phone: target.phone,
      email: target.email,
      blocksCount: target.blocksCount,
      aptsCount: target.aptsCount,
    };
    this.saveCondo(updated);
    this.addAuditLog('Troca de Contexto Condomínio', 'Dev Master', `Visualização do condomínio ${target.name} iniciada`);
    return { success: true, condo: target };
  }

  // Condo Config
  public getCondo(): CondoConfig {
    return this.getItem<CondoConfig>(STORAGE_KEYS.CONDO, SEED_CONDO);
  }

  public saveCondo(config: CondoConfig) {
    this.setItem(STORAGE_KEYS.CONDO, config);
    this.addAuditLog('Configuração do Condomínio', 'Condomínio', `Dados do condomínio ${config.name} atualizados`);
    firestoreSync.syncCondo(config);
  }

  // Blocks
  public getBlocks(): Block[] {
    return this.getItem<Block[]>(STORAGE_KEYS.BLOCKS, SEED_BLOCKS);
  }

  public saveBlock(block: Block) {
    const blocks = this.getBlocks();
    const idx = blocks.findIndex((b) => b.id === block.id);
    if (idx >= 0) blocks[idx] = block;
    else blocks.push(block);
    this.setItem(STORAGE_KEYS.BLOCKS, blocks);
    this.addAuditLog('Bloco/Torre', 'Estrutura', `Bloco ${block.name} salvo`);
  }

  public deleteBlock(blockId: string) {
    const blocks = this.getBlocks().filter((b) => b.id !== blockId);
    this.setItem(STORAGE_KEYS.BLOCKS, blocks);
    this.addAuditLog('Bloco/Torre', 'Estrutura', `Bloco ${blockId} removido`);
  }

  // Apartments
  public getApartments(): Apartment[] {
    return this.getItem<Apartment[]>(STORAGE_KEYS.APARTMENTS, SEED_APARTMENTS);
  }

  public saveApartment(apt: Apartment) {
    const apts = this.getApartments();
    const idx = apts.findIndex((a) => a.id === apt.id);
    if (idx >= 0) apts[idx] = apt;
    else apts.push(apt);
    this.setItem(STORAGE_KEYS.APARTMENTS, apts);
    this.addAuditLog('Apartamento', 'Unidade', `Apartamento ${apt.number} salvo`);
  }

  public deleteApartment(aptId: string) {
    const apts = this.getApartments().filter((a) => a.id !== aptId);
    this.setItem(STORAGE_KEYS.APARTMENTS, apts);
    this.addAuditLog('Apartamento', 'Unidade', `Apartamento ${aptId} removido`);
  }

  // Residents
  public getResidents(): Resident[] {
    return this.getItem<Resident[]>(STORAGE_KEYS.RESIDENTS, SEED_RESIDENTS);
  }

  public saveResident(resident: Resident) {
    const list = this.getResidents();
    const idx = list.findIndex((r) => r.id === resident.id);
    if (idx >= 0) list[idx] = resident;
    else list.push(resident);
    this.setItem(STORAGE_KEYS.RESIDENTS, list);
    this.addAuditLog('Morador', 'Cadastro', `Morador(a) ${resident.name} salvo(a)`);
  }

  public deleteResident(id: string) {
    const list = this.getResidents();
    const target = list.find((r) => r.id === id);
    this.setItem(STORAGE_KEYS.RESIDENTS, list.filter((r) => r.id !== id));
    if (target) {
      this.addAuditLog('Exclusão Morador', 'Cadastro', `Morador ${target.name} excluído`);
    }
  }

  // Visitors
  public getVisitors(): Visitor[] {
    return this.getItem<Visitor[]>(STORAGE_KEYS.VISITORS, SEED_VISITORS);
  }

  public saveVisitor(visitor: Visitor) {
    const list = this.getVisitors();
    const idx = list.findIndex((v) => v.id === visitor.id);
    if (idx >= 0) list[idx] = visitor;
    else list.push(visitor);
    this.setItem(STORAGE_KEYS.VISITORS, list);
    this.addAuditLog('Visitante', 'Visitantes', `Visitante ${visitor.name} salvo(a)`);
  }

  public deleteVisitor(id: string) {
    const list = this.getVisitors().filter((v) => v.id !== id);
    this.setItem(STORAGE_KEYS.VISITORS, list);
    this.addAuditLog('Visitante', 'Visitantes', `Visitante ${id} removido`);
  }

  // Contractors
  public getContractors(): Contractor[] {
    return this.getItem<Contractor[]>(STORAGE_KEYS.CONTRACTORS, SEED_CONTRACTORS);
  }

  public saveContractor(contractor: Contractor) {
    const list = this.getContractors();
    const idx = list.findIndex((c) => c.id === contractor.id);
    if (idx >= 0) list[idx] = contractor;
    else list.push(contractor);
    this.setItem(STORAGE_KEYS.CONTRACTORS, list);
    this.addAuditLog('Prestador de Serviço', 'Prestadores', `Prestador ${contractor.name} (${contractor.company}) salvo`);
  }

  public deleteContractor(id: string) {
    const list = this.getContractors().filter((c) => c.id !== id);
    this.setItem(STORAGE_KEYS.CONTRACTORS, list);
    this.addAuditLog('Prestador de Serviço', 'Prestadores', `Prestador ${id} removido`);
  }

  // Public Agents
  public getPublicAgents(): PublicAgent[] {
    return this.getItem<PublicAgent[]>(STORAGE_KEYS.PUBLIC_AGENTS, SEED_PUBLIC_AGENTS);
  }

  public savePublicAgent(agent: PublicAgent) {
    const list = this.getPublicAgents();
    const idx = list.findIndex((a) => a.id === agent.id);
    if (idx >= 0) list[idx] = agent;
    else list.push(agent);
    this.setItem(STORAGE_KEYS.PUBLIC_AGENTS, list);
    this.addAuditLog('Agente Público', 'Órgãos Públicos', `${agent.agency}: ${agent.name} registrado`);
  }

  public deletePublicAgent(id: string) {
    const list = this.getPublicAgents().filter((a) => a.id !== id);
    this.setItem(STORAGE_KEYS.PUBLIC_AGENTS, list);
    this.addAuditLog('Agente Público', 'Órgãos Públicos', `Agente ${id} removido`);
  }

  // Vehicles
  public getVehicles(): Vehicle[] {
    return this.getItem<Vehicle[]>(STORAGE_KEYS.VEHICLES, SEED_VEHICLES);
  }

  public saveVehicle(veh: Vehicle) {
    const list = this.getVehicles();
    const idx = list.findIndex((v) => v.id === veh.id);
    if (idx >= 0) list[idx] = veh;
    else list.push(veh);
    this.setItem(STORAGE_KEYS.VEHICLES, list);
    this.addAuditLog('Veículo', 'Garagem', `Veículo placa ${veh.plate} (${veh.model}) salvo`);
  }

  public deleteVehicle(id: string) {
    const list = this.getVehicles().filter((v) => v.id !== id);
    this.setItem(STORAGE_KEYS.VEHICLES, list);
    this.addAuditLog('Veículo', 'Garagem', `Veículo ${id} removido`);
  }

  // Access Logs
  public getAccessLogs(): AccessLog[] {
    return this.getItem<AccessLog[]>(STORAGE_KEYS.ACCESS_LOGS, SEED_ACCESS_LOGS);
  }

  public saveAccessLog(log: AccessLog) {
    const list = this.getAccessLogs();
    const idx = list.findIndex((l) => l.id === log.id);
    if (idx >= 0) list[idx] = log;
    else list.unshift(log); // Newer on top
    this.setItem(STORAGE_KEYS.ACCESS_LOGS, list);
    this.addAuditLog('Controle de Acesso', 'Acesso', `${log.personType.toUpperCase()}: ${log.personName} - Status: ${log.status}`);
  }

  // Deliveries
  public getDeliveries(): DeliveryItem[] {
    return this.getItem<DeliveryItem[]>(STORAGE_KEYS.DELIVERIES, SEED_DELIVERIES);
  }

  public saveDelivery(del: DeliveryItem) {
    const list = this.getDeliveries();
    const idx = list.findIndex((d) => d.id === del.id);
    if (idx >= 0) list[idx] = del;
    else list.unshift(del);
    this.setItem(STORAGE_KEYS.DELIVERIES, list);
    this.addAuditLog('Encomendas / Recebimentos', 'Recebimento', `${del.type.toUpperCase()} ${del.code} para ${del.recipientName} - Status: ${del.status}`);
  }

  // Occurrences
  public getOccurrences(): Occurrence[] {
    return this.getItem<Occurrence[]>(STORAGE_KEYS.OCCURRENCES, SEED_OCCURRENCES);
  }

  public saveOccurrence(occ: Occurrence) {
    const list = this.getOccurrences();
    const idx = list.findIndex((o) => o.id === occ.id);
    if (idx >= 0) list[idx] = occ;
    else list.unshift(occ);
    this.setItem(STORAGE_KEYS.OCCURRENCES, list);
    this.addAuditLog('Livro de Ocorrências', 'Ocorrência', `Ocorrência ${occ.type} em ${occ.location} - Status: ${occ.status}`);
  }

  // Lost and Found
  public getLostFound(): LostFoundItem[] {
    return this.getItem<LostFoundItem[]>(STORAGE_KEYS.LOST_FOUND, SEED_LOST_FOUND);
  }

  public saveLostFound(item: LostFoundItem) {
    const list = this.getLostFound();
    const idx = list.findIndex((i) => i.id === item.id);
    if (idx >= 0) list[idx] = item;
    else list.unshift(item);
    this.setItem(STORAGE_KEYS.LOST_FOUND, list);
    this.addAuditLog('Achados e Perdidos', 'Item', `${item.item} - Status: ${item.status}`);
  }

  // Keys & Remote tags
  public getKeys(): KeyControl[] {
    return this.getItem<KeyControl[]>(STORAGE_KEYS.KEYS, SEED_KEYS);
  }

  public saveKey(key: KeyControl) {
    const list = this.getKeys();
    const idx = list.findIndex((k) => k.id === key.id);
    if (idx >= 0) list[idx] = key;
    else list.unshift(key);
    this.setItem(STORAGE_KEYS.KEYS, list);
    this.addAuditLog('Chaves e Controles', 'Controle', `${key.type.toUpperCase()} ${key.number} (${key.identification}) - ${key.status}`);
  }

  // Authorizations
  public getAuthorizations(): Authorization[] {
    return this.getItem<Authorization[]>(STORAGE_KEYS.AUTHORIZATIONS, SEED_AUTHORIZATIONS);
  }

  public saveAuthorization(auth: Authorization) {
    const list = this.getAuthorizations();
    const idx = list.findIndex((a) => a.id === auth.id);
    if (idx >= 0) list[idx] = auth;
    else list.unshift(auth);
    this.setItem(STORAGE_KEYS.AUTHORIZATIONS, list);
    this.addAuditLog('Autorização', 'Acesso', `Autorização para ${auth.authorizedName} (${auth.type}) salva`);
  }

  // Special services / Removals / Works
  public getSpecialServices(): SpecialService[] {
    return this.getItem<SpecialService[]>(STORAGE_KEYS.SPECIAL_SERVICES, SEED_SPECIAL_SERVICES);
  }

  public saveSpecialService(spec: SpecialService) {
    const list = this.getSpecialServices();
    const idx = list.findIndex((s) => s.id === spec.id);
    if (idx >= 0) list[idx] = spec;
    else list.unshift(spec);
    this.setItem(STORAGE_KEYS.SPECIAL_SERVICES, list);
    this.addAuditLog('Serviço Especial / Mudança', 'Operações', `${spec.type.toUpperCase()}: ${spec.responsibleName}`);
  }

  // Shift entries
  public getShiftEntries(): ShiftEntry[] {
    return this.getItem<ShiftEntry[]>(STORAGE_KEYS.SHIFT_ENTRIES, SEED_SHIFT_ENTRIES);
  }

  public saveShiftEntry(entry: ShiftEntry) {
    const list = this.getShiftEntries();
    const idx = list.findIndex((e) => e.id === entry.id);
    if (idx >= 0) list[idx] = entry;
    else list.unshift(entry);
    this.setItem(STORAGE_KEYS.SHIFT_ENTRIES, list);
    this.addAuditLog('Turno da Portaria', 'Passagem de Turno', `Turno ${entry.shiftTurn} atualizado`);
  }

  // WhatsApp Templates
  public getWhatsAppTemplates(): WhatsAppTemplate[] {
    return this.getItem<WhatsAppTemplate[]>(STORAGE_KEYS.WHATSAPP_TEMPLATES, SEED_WHATSAPP_TEMPLATES);
  }

  public saveWhatsAppTemplate(template: WhatsAppTemplate) {
    const list = this.getWhatsAppTemplates();
    const idx = list.findIndex((t) => t.id === template.id);
    if (idx >= 0) list[idx] = template;
    else list.push(template);
    this.setItem(STORAGE_KEYS.WHATSAPP_TEMPLATES, list);
    this.addAuditLog('Template WhatsApp', 'Comunicação', `Modelo "${template.title}" salvo`);
  }

  // CCTV Cameras
  public getCCTVCameras(): CCTVCamera[] {
    return this.getItem<CCTVCamera[]>(STORAGE_KEYS.CCTV_CAMERAS, SEED_CCTV_CAMERAS);
  }

  public saveCCTVCamera(camera: CCTVCamera) {
    const list = this.getCCTVCameras();
    const idx = list.findIndex((c) => c.id === camera.id);
    if (idx >= 0) list[idx] = camera;
    else list.push(camera);
    this.setItem(STORAGE_KEYS.CCTV_CAMERAS, list);
    firestoreSync.syncCCTVCamera(camera);
    this.addAuditLog('Câmera CFTV', 'Segurança', `Câmera ${camera.name} (${camera.location}) configurada`);
  }

  public deleteCCTVCamera(id: string) {
    const list = this.getCCTVCameras();
    const target = list.find((c) => c.id === id);
    this.setItem(STORAGE_KEYS.CCTV_CAMERAS, list.filter((c) => c.id !== id));
    firestoreSync.deleteCCTVCamera(id);
    if (target) {
      this.addAuditLog('Câmera CFTV Removida', 'Segurança', `Câmera ${target.name} removida`);
    }
  }

  // Communication Notices (Mural de Avisos)
  public getNotices(): CommunicationNotice[] {
    return this.getItem<CommunicationNotice[]>(STORAGE_KEYS.COMMUNICATION_NOTICES, SEED_COMMUNICATION_NOTICES);
  }

  public saveNotice(notice: CommunicationNotice) {
    const list = this.getNotices();
    const idx = list.findIndex((n) => n.id === notice.id);
    if (idx >= 0) list[idx] = notice;
    else list.unshift(notice);
    this.setItem(STORAGE_KEYS.COMMUNICATION_NOTICES, list);
    this.addAuditLog('Comunicado Geral', 'Comunicação', `Comunicado "${notice.title}" (${notice.category}) publicado`);
  }

  public deleteNotice(id: string) {
    const list = this.getNotices();
    const target = list.find((n) => n.id === id);
    this.setItem(STORAGE_KEYS.COMMUNICATION_NOTICES, list.filter((n) => n.id !== id));
    if (target) {
      this.addAuditLog('Exclusão de Comunicado', 'Comunicação', `Comunicado "${target.title}" removido`);
    }
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
  }

  public addAuditLog(action: string, entity: string, details: string) {
    const user = this.getCurrentUser();
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp,
      userName: user ? user.name : 'Operador Portaria',
      userRole: user ? user.role : 'porteiro',
      action,
      entity,
      details,
    };

    const logs = this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    logs.unshift(newLog);
    // Keep max 500 logs to prevent bloat
    if (logs.length > 500) logs.pop();
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    this.notify();
  }

  // Backup & Restore
  public exportBackupJSON(): string {
    const fullState: Record<string, unknown> = {};
    for (const [name, key] of Object.entries(STORAGE_KEYS)) {
      fullState[name] = this.getItem(key, null);
    }
    return JSON.stringify(fullState, null, 2);
  }

  public importBackupJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      for (const [name, key] of Object.entries(STORAGE_KEYS)) {
        if (parsed[name] !== undefined) {
          localStorage.setItem(key, JSON.stringify(parsed[name]));
        }
      }
      this.addAuditLog('Restauração de Backup', 'Sistema', 'Backup do sistema restaurado com sucesso.');
      this.notify();
      return true;
    } catch (e) {
      console.error('Failed to import backup', e);
      return false;
    }
  }
}

export const storage = new StorageService();
