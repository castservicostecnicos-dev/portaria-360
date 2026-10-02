export type UserRole = 'admin' | 'porteiro' | 'supervisor' | 'dev';

export interface UserPermissions {
  canManageUsers: boolean;
  canConfigCondo: boolean;
  canDeleteRecords: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone: string;
  active: boolean;
  permissions: UserPermissions;
  lastLogin?: string;
  condoId?: string;
  condoName?: string;
}

export interface ClientCondo {
  id: string;
  name: string;
  cnpj?: string;
  address: string;
  cep?: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  active: boolean;
  status: 'ativo' | 'inativo' | 'degustacao';
  createdAt: string;
  blocksCount: number;
  aptsCount: number;
  camerasCount?: number;
  admPredial: {
    id: string;
    name: string;
    email: string;
    password: string;
    phone: string;
    cargo: string;
  };
  notes?: string;
}

export interface CondoConfig {
  id: string;
  name: string;
  cnpj: string;
  address: string;
  cep: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  logoUrl?: string;
  facadeUrl?: string;
  blocksCount: number;
  aptsCount: number;
  rules: {
    deliveryHours: string;
    quietHours: string;
    movingHours: string;
    visitorPolicy: string;
  };
}

export interface Block {
  id: string;
  name: string;
  identification: string;
  aptsCount: number;
  active: boolean;
  notes?: string;
}

export interface Apartment {
  id: string;
  number: string;
  blockId: string;
  floor: number;
  status: 'ocupado' | 'vago' | 'reforma' | 'alugado';
  notes?: string;
}

export interface Resident {
  id: string;
  name: string;
  cpf: string;
  rg?: string;
  birthDate?: string;
  phone: string;
  whatsapp: string;
  email: string;
  photoUrl?: string;
  apartmentId: string;
  blockId: string;
  type: 'proprietario' | 'inquilino' | 'familiar' | 'dependente' | 'outro';
  active: boolean;
  isMainResident: boolean;
  isNotificationContact: boolean;
  canReceivePackages: boolean;
  canAuthorizeVisitors: boolean;
  canAuthorizeContractors: boolean;
  notes?: string;
}

export interface Visitor {
  id: string;
  name: string;
  document: string;
  phone: string;
  photoUrl?: string;
  apartmentId: string;
  blockId: string;
  authorizedByMoradorId?: string;
  authorizedByName?: string;
  scheduledDate: string;
  scheduledTime?: string;
  notes?: string;
  isPreAuthorized: boolean;
}

export type ContractorType =
  | 'eletricista'
  | 'encanador'
  | 'tecnico_internet'
  | 'tv_cabo'
  | 'manutencao'
  | 'obras'
  | 'limpeza'
  | 'jardinagem'
  | 'entregador_servico'
  | 'empresa_terceirizada'
  | 'outro';

export interface Contractor {
  id: string;
  name: string;
  document: string;
  company: string;
  phone: string;
  photoUrl?: string;
  serviceType: ContractorType;
  apartmentId: string;
  blockId: string;
  responsibleResidentId?: string;
  responsibleResidentName?: string;
  authorizationType: 'pontual' | 'recorrente';
  validFrom: string;
  validUntil: string;
  scheduledTime?: string;
  notes?: string;
}

export type PublicAgencyType =
  | 'policia_militar'
  | 'policia_civil'
  | 'bombeiros'
  | 'samu'
  | 'guarda_municipal'
  | 'defesa_civil'
  | 'fiscalizacao'
  | 'correios'
  | 'concessionaria'
  | 'outro';

export interface PublicAgent {
  id: string;
  name: string;
  agency: PublicAgencyType;
  badgeNumber: string;
  document: string;
  vehiclePlate?: string;
  visitPurpose: string;
  apartmentId?: string;
  areaVisited: string;
  entryTime: string;
  exitTime?: string;
  operatorId: string;
  operatorName: string;
  notes?: string;
  status: 'dentro' | 'saiu';
}

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  type: 'carro' | 'moto' | 'van' | 'caminhao' | 'bicicleta';
  photoUrl?: string;
  ownerName: string;
  residentId?: string;
  apartmentId: string;
  blockId: string;
  parkingSpace: string;
  status: 'ativo' | 'visitante' | 'prestador' | 'irregular';
  notes?: string;
}

export type AccessStatus =
  | 'dentro'
  | 'saiu'
  | 'aguardando_autorizacao'
  | 'autorizado'
  | 'recusado'
  | 'cancelado';

export type PersonType =
  | 'morador'
  | 'visitante'
  | 'prestador'
  | 'agente_publico'
  | 'veiculo'
  | 'entregador'
  | 'outro';

export interface AccessLog {
  id: string;
  personName: string;
  personType: PersonType;
  document?: string;
  apartmentId?: string;
  blockId?: string;
  purpose: string;
  entryTime: string;
  exitTime?: string;
  status: AccessStatus;
  authorizationMethod?: 'interfone' | 'whatsapp' | 'presencial' | 'previa' | 'portaria';
  authorizedByName?: string;
  vehiclePlate?: string;
  operatorName: string;
  notes?: string;
  photoUrl?: string;
}

export type DeliveryType =
  | 'encomenda'
  | 'correspondencia'
  | 'documento'
  | 'remedio'
  | 'material'
  | 'compra'
  | 'delivery'
  | 'carta'
  | 'sedex'
  | 'transportadora'
  | 'outros';

export type DeliveryStatus =
  | 'recebido'
  | 'aguardando_retirada'
  | 'morador_avisado'
  | 'retirado'
  | 'devolvido'
  | 'entregue_ao_destinatario';

export interface DeliveryItem {
  id: string;
  code: string;
  apartmentId: string;
  blockId: string;
  recipientName: string;
  type: DeliveryType;
  description: string;
  sender?: string;
  carrier?: string;
  trackingCode?: string;
  photoUrl?: string;
  receivedAt: string;
  operatorName: string;
  storageLocation: string;
  status: DeliveryStatus;
  notifiedAt?: string;
  pickedUpAt?: string;
  pickedUpBy?: string;
  pickedUpDocument?: string;
  pickedUpSignature?: string;
  pickedUpPhoto?: string;
}

export type OccurrenceType =
  | 'discussao'
  | 'barulho'
  | 'dano'
  | 'problema_acesso'
  | 'problema_visitante'
  | 'problema_prestador'
  | 'objeto_encontrado'
  | 'seguranca'
  | 'vazamento'
  | 'falta_energia'
  | 'elevador'
  | 'incendio'
  | 'emergencia'
  | 'outros';

export interface Occurrence {
  id: string;
  date: string;
  time: string;
  type: OccurrenceType;
  location: string;
  involvedParties: string;
  apartmentId?: string;
  blockId?: string;
  description: string;
  photos?: string[];
  operatorName: string;
  status: 'aberta' | 'em_analise' | 'resolvida' | 'arquivada';
  actionTaken?: string;
}

export interface LostFoundItem {
  id: string;
  item: string;
  photoUrl?: string;
  foundLocation: string;
  foundAt: string;
  foundBy: string;
  storedLocation: string;
  status: 'guardado' | 'retirado' | 'doado';
  retrievedBy?: string;
  retrievedAt?: string;
}

export interface KeyControl {
  id: string;
  type: 'chave' | 'controle_portao' | 'tag_acesso' | 'dispositivo';
  identification: string;
  number: string;
  handedTo: string;
  apartmentId?: string;
  takenAt: string;
  returnedAt?: string;
  status: 'retirado' | 'devolvido';
}

export interface Authorization {
  id: string;
  apartmentId: string;
  blockId: string;
  residentId: string;
  residentName: string;
  authorizedName: string;
  document: string;
  type: 'visitante' | 'prestador' | 'entrega' | 'veiculo' | 'familiar' | 'mudanca' | 'obra' | 'outros';
  startDate: string;
  endDate: string;
  allowedTimeStart?: string;
  allowedTimeEnd?: string;
  allowedWeekdays?: string[];
  notes?: string;
  status: 'ativa' | 'expirada' | 'cancelada';
}

export interface SpecialService {
  id: string;
  type: 'mudanca_entrada' | 'mudanca_saida' | 'obra' | 'entrega_moveis' | 'instalacao_equipamentos' | 'grande_entrega';
  apartmentId: string;
  blockId: string;
  responsibleName: string;
  company?: string;
  scheduledDate: string;
  scheduledTime: string;
  vehicles?: string;
  authorizedBy: string;
  status: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';
  notes?: string;
  entryTime?: string;
  exitTime?: string;
}

export interface ShiftPendingItem {
  id: string;
  label: string;
  category: 'encomenda' | 'visitante' | 'prestador' | 'chave' | 'ocorrencia' | 'manutencao' | 'aviso';
  resolved: boolean;
}

export interface ShiftEntry {
  id: string;
  shiftDate: string;
  shiftTurn: 'Manhã (06h - 14h)' | 'Tarde (14h - 22h)' | 'Noite (22h - 06h)';
  operatorName: string;
  startedAt: string;
  endedAt?: string;
  generalNotes?: string;
  handoverTo?: string;
  handoverCompleted: boolean;
  pendencies: ShiftPendingItem[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  details: string;
}

export interface WhatsAppTemplate {
  id: string;
  key: string;
  title: string;
  templateText: string;
  category: 'encomenda' | 'visitante' | 'prestador' | 'remedio' | 'documento' | 'aviso';
}

export type CCTVZone =
  | 'portao_veicular'
  | 'portao_social'
  | 'garagem_subsolo'
  | 'hall_torre_a'
  | 'hall_torre_b'
  | 'perimetro'
  | 'area_lazer';

export interface CCTVCamera {
  id: string;
  name: string;
  zone: CCTVZone;
  location: string;
  status: 'online' | 'offline' | 'manutencao';
  streamUrl?: string;
  externalViewerUrl?: string;
  rtspUrl?: string;
  snapshotUrl?: string;
  feedType: 'hls_stream' | 'rtsp_proxy' | 'external_dvr' | 'simulated_live' | 'mjpeg_stream' | 'video_file';
  brand: string;
  ipAddress?: string;
  resolution: string;
  recordingRefPrefix?: string;
  dvrChannel?: number;
  dvrHost?: string;
  subStream?: boolean;
}

export type NoticeCategory = 'geral' | 'manutencao' | 'evento' | 'seguranca' | 'urgencia';
export type NoticePriority = 'baixa' | 'media' | 'alta' | 'urgente';

export interface CommunicationNotice {
  id: string;
  title: string;
  category: NoticeCategory;
  priority: NoticePriority;
  content: string;
  targetType: 'todos' | 'bloco' | 'apartamento_especifico';
  targetBlockId?: string;
  targetApartmentIds?: string[];
  scheduledFor?: string;
  sentAt?: string;
  status: 'enviado' | 'agendado' | 'rascunho';
  authorName: string;
  sendViaWhatsApp: boolean;
  readCount: number;
  attachments?: string[];
}

