import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Camera,
  CheckCircle2,
  Clock,
  Building,
  User,
  Shield,
  Trash2,
  Edit2,
  Image,
} from 'lucide-react';
import { storage } from '../services/storage';
import { Occurrence, OccurrenceType, Block, Apartment } from '../types';
import { CameraCaptureModal } from '../components/CameraCaptureModal';

interface OccurrencesViewProps {
  initialSnapshot?: { url: string; cameraName: string } | null;
  onClearSnapshot?: () => void;
}

export const OccurrencesView: React.FC<OccurrencesViewProps> = ({
  initialSnapshot,
  onClearSnapshot,
}) => {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);

  // Form State
  const [type, setType] = useState<OccurrenceType>('barulho');
  const [location, setLocation] = useState('');
  const [involvedParties, setInvolvedParties] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState('bloco-a');
  const [selectedAptId, setSelectedAptId] = useState('apt-101a');
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [status, setStatus] = useState<Occurrence['status']>('aberta');

  const refreshData = () => {
    setOccurrences(storage.getOccurrences());
    setBlocks(storage.getBlocks());
    setApartments(storage.getApartments());
  };

  useEffect(() => {
    refreshData();
    const unsub = storage.subscribe(refreshData);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (initialSnapshot) {
      setAttachedPhotos([initialSnapshot.url]);
      setDescription(`[Evidência capturada pela Câmera CFTV: ${initialSnapshot.cameraName}]\n`);
      setShowAddModal(true);
      if (onClearSnapshot) onClearSnapshot();
    }
  }, [initialSnapshot]);

  const filteredOccurrences = occurrences.filter((occ) => {
    const matchesSearch =
      occ.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      occ.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      occ.involvedParties.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || occ.status === filterStatus;
    const matchesType = filterType === 'all' || occ.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCreateOccurrence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !description) {
      alert('Local e descrição da ocorrência são obrigatórios.');
      return;
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const user = storage.getCurrentUser();

    const newOcc: Occurrence = {
      id: `oco-${Date.now()}`,
      date,
      time,
      type,
      location,
      involvedParties,
      apartmentId: selectedAptId || undefined,
      blockId: selectedBlockId || undefined,
      description,
      photos: attachedPhotos.length > 0 ? attachedPhotos : undefined,
      operatorName: user.name,
      status,
      actionTaken: actionTaken || undefined,
    };

    storage.saveOccurrence(newOcc);
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setLocation('');
    setInvolvedParties('');
    setDescription('');
    setActionTaken('');
    setAttachedPhotos([]);
    setStatus('aberta');
  };

  const handleUpdateStatus = (occ: Occurrence, newStatus: Occurrence['status']) => {
    const updated: Occurrence = {
      ...occ,
      status: newStatus,
    };
    storage.saveOccurrence(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Livro de Ocorrências Digital</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro formal de barulho, avarias, conflitos, chamados de manutenção e evidências fotográficas.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Ocorrência</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Pesquisar por palavras da descrição, local ou envolvidos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="aberta">Abertas</option>
            <option value="em_analise">Em Análise</option>
            <option value="resolvida">Resolvidas</option>
            <option value="arquivada">Arquivadas</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">Todos os Tipos</option>
            <option value="barulho">Barulho / Lei do Silêncio</option>
            <option value="discussao">Discussão / Conflito</option>
            <option value="dano">Dano ao Patrimônio</option>
            <option value="elevador">Problema no Elevador</option>
            <option value="vazamento">Vazamento / Hidráulica</option>
            <option value="seguranca">Segurança / Invasão</option>
            <option value="falta_energia">Falta de Energia</option>
            <option value="problema_acesso">Problema de Acesso</option>
          </select>
        </div>
      </div>

      {/* Occurrences List */}
      <div className="space-y-3">
        {filteredOccurrences.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-xl">
            Nenhuma ocorrência encontrada com os filtros selecionados.
          </div>
        ) : (
          filteredOccurrences.map((occ) => {
            const aptNum = occ.apartmentId ? occ.apartmentId.replace('apt-', '').toUpperCase() : 'Área Comum';

            return (
              <div
                key={occ.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 hover:border-slate-700 transition-colors shadow space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold uppercase text-white bg-slate-800 border border-slate-700 px-2.5 py-1 rounded">
                      {occ.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">{occ.location}</span>
                    <span className="text-[10px] text-slate-400">· Apt {aptNum}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono-tabular text-slate-400">
                      {occ.date} às {occ.time}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                        occ.status === 'aberta'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : occ.status === 'em_analise'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {occ.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                  {occ.description}
                </div>

                {occ.involvedParties && (
                  <p className="text-[11px] text-slate-400">
                    Envolvidos: <strong className="text-slate-300">{occ.involvedParties}</strong>
                  </p>
                )}

                {occ.actionTaken && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-0.5">
                    <span className="font-semibold text-emerald-400 block text-[11px]">
                      Providência / Desfecho Adotado:
                    </span>
                    <p className="text-slate-300">{occ.actionTaken}</p>
                  </div>
                )}

                {/* Attached photos */}
                {occ.photos && occ.photos.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    {occ.photos.map((p, idx) => (
                      <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-700 w-20 h-16 bg-black">
                        <img src={p} alt="Evidência" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer and status changer */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Registrado por porteiro: <strong className="text-slate-400">{occ.operatorName}</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {occ.status !== 'resolvida' && (
                      <button
                        onClick={() => handleUpdateStatus(occ, 'resolvida')}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-700/60 rounded-lg transition-colors"
                      >
                        Marcar como Resolvida
                      </button>
                    )}
                    {occ.status === 'aberta' && (
                      <button
                        onClick={() => handleUpdateStatus(occ, 'em_analise')}
                        className="px-2.5 py-1 text-xs text-amber-300 bg-amber-950/40 hover:bg-amber-900 border border-amber-700/50 rounded-lg transition-colors"
                      >
                        Colocar em Análise
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Occurrence Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateOccurrence}
            className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Registrar Ocorrência no Livro Digital</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancelar
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Classificação / Tipo *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as OccurrenceType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="barulho">Barulho / Som Alto</option>
                    <option value="discussao">Discussão / Desentendimento</option>
                    <option value="dano">Dano ao Patrimônio / Quebra</option>
                    <option value="elevador">Falha no Elevador</option>
                    <option value="vazamento">Vazamento / Hidráulica</option>
                    <option value="seguranca">Segurança / Alarme / Perímetro</option>
                    <option value="problema_acesso">Problema de Portão / Acesso</option>
                    <option value="problema_visitante">Problema com Visitante</option>
                    <option value="problema_prestador">Problema com Prestador</option>
                    <option value="objeto_encontrado">Objeto Encontrado</option>
                    <option value="emergencia">Emergência Médica / Acidente</option>
                    <option value="outros">Outro Incidente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status Inicial</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="aberta">Aberta (Requer Providência)</option>
                    <option value="em_analise">Em Análise pela Síndica</option>
                    <option value="resolvida">Resolvida Imediatamente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Local Exato do Ocorrido *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Hall social 3º andar Torre A, Garagem vaga 14, Área da churrasqueira..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Apartamento Vinculado</label>
                  <select
                    value={selectedAptId}
                    onChange={(e) => setSelectedAptId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="">Nenhum (Área Comum Geral)</option>
                    {apartments.map((apt) => (
                      <option key={apt.id} value={apt.id}>
                        Apt {apt.number} ({apt.blockId === 'bloco-a' ? 'Torre A' : 'Torre B'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Pessoas Envolvidas</label>
                  <input
                    type="text"
                    placeholder="Ex: Morador Apt 302 e reclamação Apt 301"
                    value={involvedParties}
                    onChange={(e) => setInvolvedParties(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Relato Descritivo dos Fatos *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Descreva em detalhes o que aconteceu, horário aproximado e circunstâncias..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-rose-500 leading-relaxed resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Providência Adotada pela Portaria</label>
                <input
                  type="text"
                  placeholder="Ex: Interfonado ao morador às 23h50, ruído cessado."
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Photo Evidence Capture */}
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-rose-400" />
                  <div>
                    <span className="font-semibold text-white block">Fotos / Evidências da Ocorrência</span>
                    <span className="text-[11px] text-slate-400">
                      {attachedPhotos.length > 0 ? `${attachedPhotos.length} foto(s) anexada(s)` : 'Opcional'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold border border-slate-700"
                >
                  Capturar Foto
                </button>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors"
              >
                Salvar no Livro de Ocorrências
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={(img) => setAttachedPhotos((prev) => [...prev, img])}
        title="Capturar Foto da Ocorrência"
      />
    </div>
  );
};
