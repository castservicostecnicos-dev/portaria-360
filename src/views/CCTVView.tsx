import React, { useState, useEffect } from 'react';
import {
  Video,
  Grid,
  Maximize2,
  Camera,
  RefreshCw,
  ExternalLink,
  Plus,
  Play,
  Pause,
  AlertCircle,
  Sliders,
  Check,
  Disc,
} from 'lucide-react';
import { storage } from '../services/storage';
import { CCTVCamera, CCTVZone } from '../types';

interface CCTVViewProps {
  onAttachSnapshotToOccurrence?: (snapshotUrl: string, cameraName: string) => void;
}

export const CCTVView: React.FC<CCTVViewProps> = ({ onAttachSnapshotToOccurrence }) => {
  const [cameras, setCameras] = useState<CCTVCamera[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [gridLayout, setGridLayout] = useState<'1x1' | '2x2' | '3x3'>('2x2');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState('');
  const [isRecording, setIsRecording] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [capturedSnapshot, setCapturedSnapshot] = useState<{ url: string; cam: CCTVCamera } | null>(null);

  // New camera form state
  const [newCamName, setNewCamName] = useState('');
  const [newCamZone, setNewCamZone] = useState<CCTVZone>('portao_veicular');
  const [newCamLocation, setNewCamLocation] = useState('');
  const [newCamBrand, setNewCamBrand] = useState('Intelbras');
  const [newCamIp, setNewCamIp] = useState('');
  const [newCamExternalUrl, setNewCamExternalUrl] = useState('');

  const refreshCameras = () => {
    const list = storage.getCCTVCameras();
    setCameras(list);
    if (!selectedCameraId && list.length > 0) {
      setSelectedCameraId(list[0].id);
    }
  };

  useEffect(() => {
    refreshCameras();
    const unsub = storage.subscribe(refreshCameras);

    const timer = setInterval(() => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      setCurrentTime(
        `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
      );
    }, 1000);

    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  const filteredCameras = cameras.filter((cam) => {
    if (filterZone === 'all') return true;
    return cam.zone === filterZone;
  });

  const selectedCamera = cameras.find((c) => c.id === selectedCameraId) || cameras[0];

  const handleCaptureSnapshot = (cam: CCTVCamera) => {
    // Generate snapshot representation
    const snapshotUrl = cam.snapshotUrl || '/src/assets/images/cctv_entrance_gate_1790763519317.jpg';
    setCapturedSnapshot({ url: snapshotUrl, cam });
    storage.addAuditLog(
      'Snapshot CFTV Capturado',
      'Segurança',
      `Captura de tela da câmera ${cam.name} realizada pelo operador.`
    );
  };

  const handleSaveNewCamera = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamName || !newCamLocation) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    const newCam: CCTVCamera = {
      id: `cam-${Date.now()}`,
      name: newCamName,
      zone: newCamZone,
      location: newCamLocation,
      status: 'online',
      brand: newCamBrand,
      ipAddress: newCamIp || '192.168.1.150',
      resolution: '1080p Full HD (30 FPS)',
      feedType: 'simulated_live',
      externalViewerUrl: newCamExternalUrl || undefined,
      recordingRefPrefix: `NVR01_CH${cameras.length + 1}`,
    };

    storage.saveCCTVCamera(newCam);
    setShowAddModal(false);
    setNewCamName('');
    setNewCamLocation('');
    setNewCamExternalUrl('');
    setNewCamIp('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Layout Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Central de CFTV & Monitoramento</h2>
            <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded font-mono">
              NVR CONDOMÍNIO
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Feeds ao vivo, monitoramento de portões, cancelas e gravação de evidências.
          </p>
        </div>

        {/* Layout Switcher & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Zone filter */}
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">Todas as Áreas ({cameras.length})</option>
            <option value="portao_veicular">Portão Veicular</option>
            <option value="portao_social">Portão Social / Eclusa</option>
            <option value="garagem_subsolo">Garagem Subsolo</option>
            <option value="hall_torre_a">Hall Torre A</option>
            <option value="hall_torre_b">Hall Torre B</option>
            <option value="perimetro">Perímetro / Muros</option>
            <option value="area_lazer">Área de Lazer</option>
          </select>

          {/* Grid buttons */}
          <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-lg gap-1">
            <button
              onClick={() => setGridLayout('1x1')}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                gridLayout === '1x1' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              1 Câmera
            </button>
            <button
              onClick={() => setGridLayout('2x2')}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                gridLayout === '2x2' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mosaico 4
            </button>
            <button
              onClick={() => setGridLayout('3x3')}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                gridLayout === '3x3' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({cameras.length})
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span>Adicionar Câmera</span>
          </button>
        </div>
      </div>

      {/* MAIN VIEWPORT: Either 1x1 focused view or Mosaic */}
      {gridLayout === '1x1' && selectedCamera ? (
        <div className="space-y-3">
          <div className="relative bg-black rounded-xl overflow-hidden border border-slate-800 aspect-video shadow-2xl flex items-center justify-center">
            {selectedCamera.snapshotUrl ? (
              <img
                src={selectedCamera.snapshotUrl}
                alt={selectedCamera.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500">
                <Video className="w-12 h-12 mb-2 opacity-40 animate-pulse text-sky-400" />
                <span className="text-xs font-mono">CONECTANDO AO STREAM NVR ({selectedCamera.ipAddress})...</span>
              </div>
            )}

            {/* Live Security HUD Overlay */}
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/80 backdrop-blur px-3 py-1 rounded text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>REC LIVE</span>
              <span>·</span>
              <span className="text-white font-semibold">{selectedCamera.name}</span>
            </div>

            <div className="absolute top-3 right-3 flex items-center gap-3 bg-black/80 backdrop-blur px-3 py-1 rounded text-xs font-mono text-slate-300">
              <span>{currentTime}</span>
              <span className="text-sky-400">{selectedCamera.resolution}</span>
            </div>

            <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur px-3 py-1 rounded text-xs text-slate-300">
              <span>Localização: <strong>{selectedCamera.location}</strong></span>
              <span className="mx-2 text-slate-600">|</span>
              <span>IP: {selectedCamera.ipAddress}</span>
              <span className="mx-2 text-slate-600">|</span>
              <span>Ref NVR: {selectedCamera.recordingRefPrefix}</span>
            </div>

            {/* Quick Action Floating Bar on Video */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                onClick={() => handleCaptureSnapshot(selectedCamera)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-sky-600 text-white text-xs font-semibold rounded-lg border border-slate-700 shadow transition-colors"
                title="Capturar Foto / Evidência"
              >
                <Camera className="w-4 h-4 text-sky-300" />
                <span>Capturar Imagem</span>
              </button>

              {selectedCamera.externalViewerUrl && (
                <a
                  href={selectedCamera.externalViewerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg border border-slate-700 shadow transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-amber-300" />
                  <span>DVR Externo</span>
                </a>
              )}
            </div>
          </div>

          {/* Camera Selector Strip Below */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {cameras.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCameraId(c.id)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  selectedCameraId === c.id
                    ? 'border-sky-500 bg-sky-950/40 text-white'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                }`}
              >
                <p className="text-xs font-semibold truncate">{c.name.split(':')[0]}</p>
                <p className="text-[10px] text-slate-400 truncate">{c.location}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Mosaic Grid Layout */
        <div
          className={`grid gap-3 ${
            gridLayout === '2x2' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {filteredCameras.map((cam) => (
            <div
              key={cam.id}
              className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex flex-col justify-between hover:border-sky-500/70 transition-all shadow"
            >
              {cam.snapshotUrl ? (
                <img
                  src={cam.snapshotUrl}
                  alt={cam.name}
                  className="w-full h-full object-cover opacity-90"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-950">
                  <Video className="w-8 h-8 mb-1 opacity-40 text-sky-400" />
                  <span className="text-[11px] font-mono">FEED LIVE SIMULADO</span>
                </div>
              )}

              {/* Header HUD */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                <span>{cam.name.split(':')[0]}</span>
              </div>

              <div className="absolute top-2 right-2 flex items-center gap-1">
                <span className="bg-black/80 backdrop-blur text-[10px] font-mono text-slate-300 px-1.5 py-0.5 rounded">
                  {currentTime.slice(11)}
                </span>
                <button
                  onClick={() => {
                    setSelectedCameraId(cam.id);
                    setGridLayout('1x1');
                  }}
                  className="bg-black/80 hover:bg-sky-600 text-slate-300 hover:text-white p-1 rounded transition-colors"
                  title="Ampliar em tela cheia"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bottom footer & actions */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 flex items-end justify-between">
                <div className="truncate mr-2">
                  <p className="text-xs font-semibold text-white truncate">{cam.name}</p>
                  <p className="text-[10px] text-slate-300 truncate">{cam.location} · {cam.brand}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCaptureSnapshot(cam)}
                    className="p-1.5 bg-slate-900/90 hover:bg-sky-600 text-sky-300 hover:text-white rounded border border-slate-700 transition-colors"
                    title="Capturar Foto"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>

                  {cam.externalViewerUrl && (
                    <a
                      href={cam.externalViewerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-slate-900/90 hover:bg-amber-600 text-amber-300 hover:text-white rounded border border-slate-700 transition-colors"
                      title="Abrir no DVR do Condomínio"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Snapshot Preview & Action Modal */}
      {capturedSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-white">Evidência Fotográfica Capturada</h3>
              </div>
              <button
                onClick={() => setCapturedSnapshot(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Fechar
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="rounded-lg overflow-hidden border border-slate-700 bg-black">
                <img src={capturedSnapshot.url} alt="Evidência" className="w-full h-auto object-contain" />
              </div>
              <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                <p><strong>Câmera:</strong> {capturedSnapshot.cam.name}</p>
                <p><strong>Localização:</strong> {capturedSnapshot.cam.location}</p>
                <p><strong>Carimbo de Data/Hora:</strong> {currentTime}</p>
                <p className="text-[11px] text-slate-500 font-mono">Hash Evidência: #{Date.now()}-CFTV</p>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-[11px] text-emerald-400">✓ Gravado no registro de auditoria</span>
              <button
                onClick={() => {
                  if (onAttachSnapshotToOccurrence) {
                    onAttachSnapshotToOccurrence(capturedSnapshot.url, capturedSnapshot.cam.name);
                  }
                  setCapturedSnapshot(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-colors"
              >
                Vincular a Nova Ocorrência
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Camera Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveNewCamera}
            className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-400" />
                <span>Cadastrar Ponto de Câmera CFTV</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancelar
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nome / Identificador *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: CAM-08: Portão de Carga & Lixeira"
                  value={newCamName}
                  onChange={(e) => setNewCamName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Zona / Setor *</label>
                <select
                  value={newCamZone}
                  onChange={(e) => setNewCamZone(e.target.value as CCTVZone)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="portao_veicular">Portão Veicular</option>
                  <option value="portao_social">Portão Social / Eclusa</option>
                  <option value="garagem_subsolo">Garagem Subsolo</option>
                  <option value="hall_torre_a">Hall Torre A</option>
                  <option value="hall_torre_b">Hall Torre B</option>
                  <option value="perimetro">Perímetro / Muro</option>
                  <option value="area_lazer">Área de Lazer / Salão</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Localização Física *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Corredor de serviço próximo à guarita"
                  value={newCamLocation}
                  onChange={(e) => setNewCamLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Fabricante / Modelo</label>
                  <input
                    type="text"
                    placeholder="Intelbras, Hikvision, Dahua..."
                    value={newCamBrand}
                    onChange={(e) => setNewCamBrand(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Endereço IP na Rede</label>
                  <input
                    type="text"
                    placeholder="Ex: 192.168.1.108"
                    value={newCamIp}
                    onChange={(e) => setNewCamIp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Link de Visualização Direta / DVR (Opcional)</label>
                <input
                  type="url"
                  placeholder="http://dvr-local:8080 ou rtsp://..."
                  value={newCamExternalUrl}
                  onChange={(e) => setNewCamExternalUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 text-[11px]"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Permite aos porteiros abrir o stream do canal específico em um clique.
                </p>
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
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow"
              >
                Salvar Câmera
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
