import React, { useState, useEffect } from 'react';
import { Clock, CheckSquare, Square, X, AlertCircle, ArrowRight, UserCheck, Check } from 'lucide-react';
import { storage } from '../services/storage';
import { ShiftEntry, ShiftPendingItem, User } from '../types';

interface ShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTurnoCompleted?: () => void;
}

export const ShiftHandoverModal: React.FC<ShiftHandoverModalProps> = ({
  isOpen,
  onClose,
  onTurnoCompleted,
}) => {
  const [currentUser, setCurrentUser] = useState<User>(storage.getCurrentUser());
  const [nextOperatorName, setNextOperatorName] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [pendencies, setPendencies] = useState<ShiftPendingItem[]>([]);
  const [activeShift, setActiveShift] = useState<ShiftEntry | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [signedSuccess, setSignedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentUser(storage.getCurrentUser());
      setAllUsers(storage.getUsers());
      const shifts = storage.getShiftEntries();
      const current = shifts[0] || null;
      setActiveShift(current);
      if (current) {
        setPendencies(current.pendencies || []);
        setGeneralNotes(current.generalNotes || '');
      }

      // Auto check live pending issues from other modules
      const keysOut = storage.getKeys().filter((k) => k.status === 'retirado');
      const openOcos = storage.getOccurrences().filter((o) => o.status === 'aberta' || o.status === 'em_analise');
      const peopleInside = storage.getAccessLogs().filter((l) => l.status === 'dentro');
      const pendingDels = storage.getDeliveries().filter((d) => d.status === 'aguardando_retirada' || d.status === 'recebido');

      // Populate fresh pendencies if current has few
      if (!current || (current.pendencies && current.pendencies.length < 2)) {
        const dynamicPendencies: ShiftPendingItem[] = [
          ...keysOut.map((k) => ({
            id: `k-${k.id}`,
            label: `Chave ${k.number} (${k.identification}) entregue para ${k.handedTo} ainda não devolvida`,
            category: 'chave' as const,
            resolved: false,
          })),
          ...openOcos.map((o) => ({
            id: `o-${o.id}`,
            label: `Ocorrência em aberto: ${o.type} (${o.location}) - ${o.description.slice(0, 50)}...`,
            category: 'ocorrencia' as const,
            resolved: false,
          })),
          ...peopleInside.slice(0, 2).map((p) => ({
            id: `p-${p.id}`,
            label: `${p.personType.toUpperCase()} ${p.personName} permanece dentro do condomínio (Entrada: ${p.entryTime.slice(11)})`,
            category: 'visitante' as const,
            resolved: false,
          })),
          {
            id: 'p-dels',
            label: `Total de ${pendingDels.length} encomenda(s) aguardando retirada nos armários da guarita`,
            category: 'encomenda' as const,
            resolved: false,
          },
        ];
        setPendencies(dynamicPendencies);
      }
    }
  }, [isOpen]);

  const togglePendency = (id: string) => {
    setPendencies((prev) =>
      prev.map((item) => (item.id === id ? { ...item, resolved: !item.resolved } : item))
    );
  };

  const handleFinishShift = () => {
    if (!nextOperatorName) {
      alert('Por favor informe o nome do próximo porteiro / operador que está assumindo o posto.');
      return;
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const endedAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    if (activeShift) {
      const updated: ShiftEntry = {
        ...activeShift,
        endedAt,
        generalNotes,
        handoverTo: nextOperatorName,
        handoverCompleted: true,
        pendencies,
      };
      storage.saveShiftEntry(updated);
    }

    // Create next shift immediately
    const nextShiftNumber: ShiftEntry = {
      id: `shift-${Date.now()}`,
      shiftDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      shiftTurn: 'Tarde (14h - 22h)',
      operatorName: nextOperatorName,
      startedAt: endedAt,
      generalNotes: `Turno assumido de ${currentUser.name}. Pendências anteriores verificadas.`,
      handoverCompleted: false,
      pendencies: pendencies.filter((p) => !p.resolved),
    };
    storage.saveShiftEntry(nextShiftNumber);

    storage.addAuditLog(
      'Passagem de Turno Concluída',
      'Turno',
      `Passagem realizada por ${currentUser.name} para ${nextOperatorName}. Pendências repassadas: ${pendencies.filter((p) => !p.resolved).length}.`
    );

    setSignedSuccess(true);
    setTimeout(() => {
      setSignedSuccess(false);
      if (onTurnoCompleted) onTurnoCompleted();
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Passagem de Turno da Portaria</h3>
              <p className="text-xs text-slate-400">
                Operador Atual: <strong className="text-slate-200">{currentUser.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Shift Checklist / Pendências */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Checklist de Pendências do Turno</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {pendencies.filter((p) => p.resolved).length} de {pendencies.length} resolvidas
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
              {pendencies.map((item) => (
                <div
                  key={item.id}
                  onClick={() => togglePendency(item.id)}
                  className={`flex items-start gap-2.5 p-2 rounded cursor-pointer transition-colors ${
                    item.resolved ? 'bg-emerald-950/20 text-slate-400' : 'hover:bg-slate-900 text-slate-200'
                  }`}
                >
                  <button type="button" className="mt-0.5 text-emerald-400 shrink-0">
                    {item.resolved ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                  <span
                    className={`text-xs leading-relaxed select-none ${
                      item.resolved ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Observations and Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Observações Gerais & Situações Relevantes do Turno
            </label>
            <textarea
              rows={3}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Ex: Todas as câmeras funcionando, ronda externa realizada às 10h, técnico da Schindler aguardado..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Next Operator Assignment */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Próximo Porteiro / Operador Assumindo o Posto
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allUsers
                .filter((u) => u.id !== currentUser.id)
                .map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setNextOperatorName(u.name)}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                      nextOperatorName === u.name
                        ? 'border-emerald-500 bg-emerald-950/40 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{u.role}</p>
                    </div>
                    {nextOperatorName === u.name && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                ))}
            </div>

            <input
              type="text"
              placeholder="Ou digite o nome completo caso não esteja na lista..."
              value={nextOperatorName}
              onChange={(e) => setNextOperatorName(e.target.value)}
              className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleFinishShift}
            disabled={signedSuccess}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-md transition-colors"
          >
            {signedSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Turno Encerrado com Sucesso!</span>
              </>
            ) : (
              <>
                <span>Assinar & Transferir Posto</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
